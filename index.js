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

// Create express app.
const app = express();

// Add CORS
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

// Parse JSON request bodies.
app.use(express.json());

// Setup the public and private VAPID keys to web-push library.
if (!publicVapidKey || !privateVapidKey) {
  console.error('Missing VAPID_PUBLIC or VAPID_PRIVATE environment variables. Add them in .env.local or .env');
  process.exit(1);
}
webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);

const getDexieCloudAccessToken = async () => {
  console.log('getDexieCloudAccessToken...');

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

function parseSubscriptionRequestBody(body) {
  const rawSubscription = body?.subscription?.endpoint ? body.subscription : body;
  const subscription = rawSubscription ? { ...rawSubscription } : null;
  const listId = body?.listId ?? null;

  // listId is metadata on Birdlist side, not part of PushSubscription.
  if (subscription && 'listId' in subscription) {
    delete subscription.listId;
  }

  return { subscription, listId };
}

// Ensure the request has a PushSubscription endpoint property.
const isValidSaveRequest = (req, res) => {
  const { subscription } = parseSubscriptionRequestBody(req.body);

  if (!subscription || !subscription.endpoint) {
    res.status(400).json({
      error: {
        id: 'no-endpoint',
        message: 'Subscription must have an endpoint',
      },
    });
    return false;
  }
  return true;
};

function saveSubscriptionToDatabase(subscription, listId) {
  console.log('saveSubscriptionToDatabase...');
  return upsertSubscriptionInDatabase(subscription, listId);
}

async function upsertSubscriptionInDatabase(subscription, listId) {
  const subscriptions = await getSubscriptionsFromDatabase();
  const alreadyExists = subscriptions.some(
    (item) =>
      item.endpoint === subscription.endpoint &&
      String(item.listId ?? '') === String(listId ?? '')
  );

  if (alreadyExists) {
    console.log('Subscription already exists, skipping insert.');
    return false;
  }

  const subscriptionPayload = {
    ...subscription,
    listId,
  };
  await insertToDatabase(subscriptionPayload);
  return true;
}

async function insertToDatabase(subscription) {
  console.log('insertToDatabase...');
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

  console.log('insertToDatabase:', response.status);
}

async function deleteSubscriptionFromDatabase(id) {
  console.log('deleteSubscriptionFromDatabase...');
  const response = await fetch(`${DEXIE_URL}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: await getAccessHeader() },
  });
  console.log('deleteSubscriptionFromDatabase:', response.status);
}

async function getSubscriptionsFromDatabase() {
  console.log('getSubscriptionsFromDatabase...');
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

async function deleteSubscriptionByEndpoint(endpoint, listId = null) {
  const subscriptions = await getSubscriptionsFromDatabase();
  const targets = subscriptions.filter(
    (item) =>
      item.endpoint === endpoint &&
      (listId === null || String(item.listId ?? '') === String(listId))
  );

  if (!targets.length) {
    return { removed: 0, remainingForEndpoint: subscriptions.filter((item) => item.endpoint === endpoint).length };
  }

  await Promise.all(targets.filter((item) => item?._id).map((item) => deleteSubscriptionFromDatabase(item._id)));

  const refreshedSubscriptions = await getSubscriptionsFromDatabase();
  const remainingForEndpoint = refreshedSubscriptions.filter((item) => item.endpoint === endpoint).length;
  return { removed: targets.length, remainingForEndpoint };
}

async function triggerPush(subscription, dataToSend) {
  console.log('triggerPush...');
  try {
    await webpush.sendNotification(subscription, dataToSend);
    return { sent: true, removed: false };
  } catch (err) {
    if ((err.statusCode === 404 || err.statusCode === 410) && subscription?._id) {
      await deleteSubscriptionFromDatabase(subscription._id);
      return { sent: false, removed: true };
    }
    console.log('Subscription is no longer valid:', err);
    return { sent: false, removed: false };
  }
}

function normalizeNotificationPayload(payload) {
  const title = payload?.title || 'Birdlist';
  const normalizedOptions = payload?.options ? { ...payload.options } : {};

  // Backward compatibility with old payload shape { title, body, icon, listId }.
  if (!payload?.options) {
    if (payload?.body) normalizedOptions.body = payload.body;
    if (payload?.icon) normalizedOptions.icon = payload.icon;
    if (payload?.badge) normalizedOptions.badge = payload.badge;
    if (payload?.tag) normalizedOptions.tag = payload.tag;
    if (payload?.listId) {
      normalizedOptions.data = { ...(normalizedOptions.data || {}), listId: payload.listId };
    }
  } else if (payload?.listId && !normalizedOptions.data?.listId) {
    normalizedOptions.data = { ...(normalizedOptions.data || {}), listId: payload.listId };
  }

  return JSON.stringify({
    title,
    options: normalizedOptions,
  });
}

function getListIdFromPushPayload(payload) {
  return payload?.options?.data?.listId ?? payload?.listId ?? null;
}

function dedupeSubscriptionsByEndpoint(subscriptions) {
  const dedupedMap = new Map();

  for (const subscription of subscriptions) {
    if (!subscription?.endpoint) continue;
    if (!dedupedMap.has(subscription.endpoint)) {
      dedupedMap.set(subscription.endpoint, subscription);
    }
  }

  return Array.from(dedupedMap.values());
}

// Create route for allowing a client to subscribe to push notifications.
app.post('/api/subscription', async (req, res) => {
  if (!isValidSaveRequest(req, res)) {
    return;
  }

  try {
    const { subscription, listId } = parseSubscriptionRequestBody(req.body);

    const wasCreated = await saveSubscriptionToDatabase(subscription, listId);

    res.status(201).json({ data: { success: true } });

    if (wasCreated) {
      const payload = normalizeNotificationPayload({
        title: 'Hello from Birdlist!',
        body: 'You will now be notified when new observations gets added to your lists.',
      });

      // Best effort welcome notification.
      webpush.sendNotification(subscription, payload).catch(console.log);
    }
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-save-subscription',
        message: `Subscription received but failed to save it: ${err.message}`,
      },
    });
  }
});

app.post('/api/unsubscription', async (req, res) => {
  if (!req.body || !req.body.endpoint) {
    res.status(400).json({
      error: {
        id: 'no-endpoint',
        message: 'Unsubscription must have an endpoint',
      },
    });
    return;
  }

  try {
    const listId = req.body?.listId ?? null;
    const result = await deleteSubscriptionByEndpoint(req.body.endpoint, listId);
    res.status(200).json({
      data: {
        success: true,
        removed: result.removed,
        remainingForEndpoint: result.remainingForEndpoint,
      },
    });
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
  if (!req.body || !req.body.endpoint || req.body.listId === undefined || req.body.listId === null) {
    res.status(400).json({
      error: {
        id: 'missing-params',
        message: 'Status check must include endpoint and listId',
      },
    });
    return;
  }

  try {
    const subscriptions = await getSubscriptionsFromDatabase();
    const subscribed = subscriptions.some(
      (item) =>
        item.endpoint === req.body.endpoint &&
        String(item.listId ?? '') === String(req.body.listId)
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
  try {
    const requestedListId = getListIdFromPushPayload(req.body);
    const allSubscriptions = await getSubscriptionsFromDatabase();
    const subscriptions = dedupeSubscriptionsByEndpoint(
      requestedListId === null
        ? allSubscriptions
        : allSubscriptions.filter(
            (subscription) => String(subscription.listId ?? '') === String(requestedListId)
          )
    );
    const dataToSend = normalizeNotificationPayload(req.body);

    const results = await Promise.all(
      subscriptions.map((subscription) => triggerPush(subscription, dataToSend))
    );

    const sent = results.filter((result) => result.sent).length;
    const removed = results.filter((result) => result.removed).length;

    res.json({
      data: {
        success: true,
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

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
