const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const fetch = require('node-fetch');

// Load local secrets first, then fallback to .env.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const publicVapidKey = process.env.VAPID_PUBLIC;
const privateVapidKey = process.env.VAPID_PRIVATE;
const vapidSubject = process.env.VAPID_SUBJECT;
const privateDexieCloudKey = process.env.DEXIE_CLOUD_CLIENTID;
const privateDexieCloudSecret = process.env.DEXIE_CLOUD_CLIENTSECRET;

const DEXIE_URL = 'https://zyh2ho4s6.dexie.cloud/my/webPushSubscriptions';

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://birdlist.app'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  })
);

app.use(express.json());

if (!publicVapidKey || !privateVapidKey) {
  console.error('Missing VAPID_PUBLIC or VAPID_PRIVATE environment variables. Add them in .env.local or .env');
  process.exit(1);
}
webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);

function normalizeListId(listId) {
  return String(listId ?? '').trim();
}

function sanitizeIncomingSubscription(subscription) {
  if (!subscription || typeof subscription !== 'object') {
    return null;
  }

  const endpoint = typeof subscription.endpoint === 'string' ? subscription.endpoint.trim() : '';
  const p256dh = typeof subscription?.keys?.p256dh === 'string' ? subscription.keys.p256dh : '';
  const auth = typeof subscription?.keys?.auth === 'string' ? subscription.keys.auth : '';

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  const expirationTime = subscription.expirationTime ?? null;

  return {
    endpoint,
    expirationTime,
    keys: {
      p256dh,
      auth,
    },
  };
}

function isStoredSubscriptionRecordValid(subscription) {
  const sanitizedSubscription = sanitizeIncomingSubscription(subscription);
  if (!sanitizedSubscription) {
    return false;
  }

  const listId = normalizeListId(subscription?.listId);
  return listId.length > 0;
}

function makeEndpointListKey(endpoint, listId) {
  return `${endpoint}::${normalizeListId(listId)}`;
}

function sameSubscriptionData(a, b) {
  return (
    a.endpoint === b.endpoint &&
    (a.expirationTime ?? null) === (b.expirationTime ?? null) &&
    a?.keys?.p256dh === b?.keys?.p256dh &&
    a?.keys?.auth === b?.keys?.auth
  );
}

function sanitizeNotificationPayload(payload) {
  const title = typeof payload?.title === 'string' && payload.title.trim() ? payload.title : 'Birdlist';
  const options = payload?.options && typeof payload.options === 'object' ? payload.options : {};

  const listIdRaw = options?.data?.listId;
  const listId = normalizeListId(listIdRaw);

  if (!listId) {
    return { error: 'Push payload must include options.data.listId' };
  }

  return {
    listId,
    dataToSend: JSON.stringify({ title, options }),
  };
}

const getDexieCloudAccessToken = async () => {
  if (!privateDexieCloudKey || !privateDexieCloudSecret) {
    throw new Error('Missing DEXIE_CLOUD_CLIENTID or DEXIE_CLOUD_CLIENTSECRET environment variables.');
  }

  const payload = {
    grant_type: 'client_credentials',
    scopes: ['ACCESS_DB', 'GLOBAL_READ', 'GLOBAL_WRITE'],
    client_id: privateDexieCloudKey,
    client_secret: privateDexieCloudSecret,
    claims: {
      sub: 'birdlist@system.local',
    },
  };

  const response = await fetch('https://zyh2ho4s6.dexie.cloud/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Dexie token request failed (${response.status}): ${errorBody}`);
  }

  const body = await response.json();
  return body.accessToken;
};

async function getAccessHeader() {
  return `Bearer ${await getDexieCloudAccessToken()}`;
}

async function getSubscriptionsFromDatabase() {
  const response = await fetch(DEXIE_URL, {
    method: 'GET',
    headers: { Authorization: await getAccessHeader() },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Loading subscriptions failed (${response.status}): ${errorBody}`);
  }

  const payload = await response.json();
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function insertSubscriptionToDatabase(subscription) {
  const response = await fetch(DEXIE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: await getAccessHeader(),
    },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Saving subscription failed (${response.status}): ${errorBody}`);
  }
}

async function deleteSubscriptionFromDatabase(id) {
  const response = await fetch(`${DEXIE_URL}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: await getAccessHeader() },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Deleting subscription failed (${response.status}): ${errorBody}`);
  }
}

async function cleanupLegacySubscriptions() {
  const subscriptions = await getSubscriptionsFromDatabase();
  const seen = new Set();
  let removed = 0;

  for (const subscription of subscriptions) {
    const isValid = isStoredSubscriptionRecordValid(subscription);

    if (!isValid) {
      if (subscription?._id) {
        await deleteSubscriptionFromDatabase(subscription._id);
        removed += 1;
      }
      continue;
    }

    const key = makeEndpointListKey(subscription.endpoint, subscription.listId);
    if (seen.has(key)) {
      if (subscription?._id) {
        await deleteSubscriptionFromDatabase(subscription._id);
        removed += 1;
      }
      continue;
    }

    seen.add(key);
  }

  if (removed > 0) {
    console.log(`Cleaned up ${removed} legacy/duplicate push subscription(s).`);
  }
}

async function upsertListSubscription(subscription, listId) {
  const normalizedListId = normalizeListId(listId);
  const subscriptions = await getSubscriptionsFromDatabase();

  const existing = subscriptions.find(
    (item) => item.endpoint === subscription.endpoint && normalizeListId(item.listId) === normalizedListId
  );

  if (existing && sameSubscriptionData(existing, subscription)) {
    return { created: false, updated: false };
  }

  if (existing?._id) {
    await deleteSubscriptionFromDatabase(existing._id);
  }

  await insertSubscriptionToDatabase({
    ...subscription,
    listId: normalizedListId,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  });

  return { created: !existing, updated: Boolean(existing) };
}

async function deleteListSubscription(endpoint, listId) {
  const normalizedListId = normalizeListId(listId);
  const subscriptions = await getSubscriptionsFromDatabase();

  const targets = subscriptions.filter(
    (item) => item.endpoint === endpoint && normalizeListId(item.listId) === normalizedListId
  );

  await Promise.all(targets.filter((item) => item?._id).map((item) => deleteSubscriptionFromDatabase(item._id)));

  const refreshedSubscriptions = await getSubscriptionsFromDatabase();
  const remainingForEndpoint = refreshedSubscriptions.filter((item) => item.endpoint === endpoint).length;

  return {
    removed: targets.length,
    remainingForEndpoint,
  };
}

async function triggerPush(subscription, dataToSend) {
  try {
    await webpush.sendNotification(subscription, dataToSend);
    return { sent: true, removed: false };
  } catch (err) {
    if ((err.statusCode === 404 || err.statusCode === 410) && subscription?._id) {
      await deleteSubscriptionFromDatabase(subscription._id);
      return { sent: false, removed: true };
    }

    console.log('Failed to send push to subscription:', err.message || err);
    return { sent: false, removed: false };
  }
}

app.post('/api/subscription', async (req, res) => {
  const listId = normalizeListId(req.body?.listId);
  const subscription = sanitizeIncomingSubscription(req.body?.subscription);

  if (!listId || !subscription) {
    res.status(400).json({
      error: {
        id: 'invalid-request',
        message: 'Body must include { listId, subscription{ endpoint, keys{ p256dh, auth } } }',
      },
    });
    return;
  }

  try {
    const result = await upsertListSubscription(subscription, listId);

    if (result.created) {
      const welcomePayload = JSON.stringify({
        title: 'Hello from Birdlist!',
        options: {
          body: 'You will now be notified when new observations get added to this list.',
        },
      });

      webpush.sendNotification(subscription, welcomePayload).catch(console.log);
    }

    res.status(200).json({ data: { success: true, ...result } });
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-save-subscription',
        message: `Failed to save subscription: ${err.message}`,
      },
    });
  }
});

app.post('/api/unsubscription', async (req, res) => {
  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : '';
  const listId = normalizeListId(req.body?.listId);

  if (!endpoint || !listId) {
    res.status(400).json({
      error: {
        id: 'invalid-request',
        message: 'Body must include { endpoint, listId }',
      },
    });
    return;
  }

  try {
    const result = await deleteListSubscription(endpoint, listId);
    res.status(200).json({ data: { success: true, ...result } });
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-delete-subscription',
        message: `Failed to delete subscription: ${err.message}`,
      },
    });
  }
});

app.post('/api/subscription-status', async (req, res) => {
  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : '';
  const listId = normalizeListId(req.body?.listId);

  if (!endpoint || !listId) {
    res.status(400).json({
      error: {
        id: 'invalid-request',
        message: 'Body must include { endpoint, listId }',
      },
    });
    return;
  }

  try {
    const subscriptions = await getSubscriptionsFromDatabase();
    const subscribed = subscriptions.some(
      (item) => item.endpoint === endpoint && normalizeListId(item.listId) === listId
    );

    res.status(200).json({ data: { success: true, subscribed } });
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-check-subscription',
        message: `Failed to check subscription: ${err.message}`,
      },
    });
  }
});

app.post('/api/push', async (req, res) => {
  const payload = sanitizeNotificationPayload(req.body);
  if (payload.error) {
    res.status(400).json({
      error: {
        id: 'invalid-push-payload',
        message: payload.error,
      },
    });
    return;
  }

  try {
    const subscriptions = (await getSubscriptionsFromDatabase()).filter(
      (subscription) => normalizeListId(subscription.listId) === payload.listId
    );

    const results = await Promise.all(
      subscriptions.map((subscription) => triggerPush(subscription, payload.dataToSend))
    );

    const sent = results.filter((result) => result.sent).length;
    const removed = results.filter((result) => result.removed).length;

    res.status(200).json({
      data: {
        success: true,
        listId: payload.listId,
        total: subscriptions.length,
        sent,
        removed,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-send-messages',
        message: `Failed to send the push: ${err.message}`,
      },
    });
  }
});

const PORT = process.env.PORT || 5001;

async function start() {
  await cleanupLegacySubscriptions();

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
