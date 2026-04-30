const path = require('path');
const fs = require('fs');
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

const DEXIE_BASE_URL = 'https://zyh2ho4s6.dexie.cloud';
const DEXIE_URL = 'https://zyh2ho4s6.dexie.cloud/my/webPushSubscriptions';
const PUBLIC_REALM_ID = 'rlm-public';
const SUPPORTED_LANGUAGES = new Set(['en', 'sv', 'de']);
const PUSH_TEXTS = {
  en: {
    list: 'List',
    newObservationAdded: 'New observation added',
    welcomeTitle: 'Hello from Birdlist!',
    welcomeBody: 'You will now be notified when new observations get added to this list.',
  },
  sv: {
    list: 'Lista',
    newObservationAdded: 'Ny observation tillagd',
    welcomeTitle: 'Hej från Birdlist!',
    welcomeBody: 'Du får nu notiser när nya observationer läggs till i listan.',
  },
  de: {
    list: 'Liste',
    newObservationAdded: 'Neue Beobachtung hinzugefügt',
    welcomeTitle: 'Hallo von Birdlist!',
    welcomeBody: 'Du wirst jetzt benachrichtigt, wenn neue Beobachtungen zu dieser Liste hinzugefügt werden.',
  },
};

function loadBirdSpecies() {
  const candidatePaths = [
    process.env.BIRD_SPECIES_PATH,
    path.join(__dirname, 'src', 'assets', 'birdSpecies.json'),
    path.join(__dirname, 'public', 'birdSpecies.json'),
    path.join(__dirname, 'dist', 'birdSpecies.json'),
  ].filter(Boolean);

  for (const candidatePath of candidatePaths) {
    try {
      if (!fs.existsSync(candidatePath)) {
        continue;
      }

      return JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
    } catch (error) {
      console.warn(`Failed to load bird species data from ${candidatePath}.`, error);
    }
  }

  console.warn('Bird species data was not found. Push notifications will use observation names without localization.');
  return [];
}

const birdSpecies = loadBirdSpecies();
const birdSpeciesByLatinName = new Map(birdSpecies.map((species) => [species.latinName, species]));

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

const isPushConfigured = Boolean(publicVapidKey && privateVapidKey);
if (!isPushConfigured) {
  console.warn('Missing VAPID_PUBLIC or VAPID_PRIVATE environment variables. Push notifications are disabled.');
} else {
  webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
}

function normalizeListId(listId) {
  return String(listId ?? '').trim();
}

function normalizeLanguage(language) {
  const normalized = String(language || 'en').split('-')[0].toLowerCase();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : 'en';
}

function getSubscriptionRecordId(subscription) {
  return subscription?.id || subscription?._id || null;
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
    a?.keys?.auth === b?.keys?.auth &&
    normalizeLanguage(a?.language) === normalizeLanguage(b?.language)
  );
}

function sanitizeNotificationPayload(payload) {
  const notification = payload?.notification && typeof payload.notification === 'object' ? payload.notification : null;
  const title = typeof payload?.title === 'string' && payload.title.trim() ? payload.title : 'Birdlist';
  const options = payload?.options && typeof payload.options === 'object' ? payload.options : {};

  const listIdRaw = notification?.listId || options?.data?.listId;
  const listId = normalizeListId(listIdRaw);

  if (!listId) {
    return { error: 'Push payload must include notification.listId or options.data.listId' };
  }

  return {
    listId,
    message: notification || { title, options },
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

function makePublicObservationId() {
  const random = Math.random().toString(36).slice(2, 10);
  return `obs${Date.now().toString(36)}${random}`;
}

function toDexieCloudDate(value) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return {
    $t: 'Date',
    v: safeDate.toISOString(),
  };
}

function sanitizePublicObservationPayload(payload) {
  const observation = payload?.observation;
  if (!observation || typeof observation !== 'object') {
    return { error: 'Body must include { observation }.' };
  }

  const listId = normalizeListId(observation.listId);
  const name = String(observation.name || '').trim();
  const owner = String(observation.owner || '').trim();
  const location = String(observation.location || '').trim();
  const latinName = String(observation.latinName || '').trim();
  const ownerAliases = [
    owner,
    ...(Array.isArray(observation.ownerAliases) ? observation.ownerAliases : []),
  ]
    .map((value) => String(value || '').trim())
    .filter((value) => value && value !== 'unauthorized');
  const uniqueOwnerAliases = [...new Set(ownerAliases)];

  if (!listId) {
    return { error: 'Observation must include listId.' };
  }

  if (!name) {
    return { error: 'Observation must include name.' };
  }

  if (uniqueOwnerAliases.length === 0) {
    return { error: 'You need to log in first to use this feature.' };
  }

  return {
    ownerAliases: uniqueOwnerAliases,
    observation: {
      id: makePublicObservationId(),
      name,
      owner: uniqueOwnerAliases[0],
      date: toDexieCloudDate(observation.date),
      realmId: PUBLIC_REALM_ID,
      listId,
      ...(location ? { location } : {}),
      ...(latinName ? { latinName } : {}),
    },
  };
}

function getPushTexts(language) {
  return PUSH_TEXTS[normalizeLanguage(language)] || PUSH_TEXTS.en;
}

function getLocalizedBirdName(bird, language) {
  const fallback = String(bird?.name || '').trim();
  const latinName = String(bird?.latinName || '').trim();
  const species = latinName ? birdSpeciesByLatinName.get(latinName) : null;
  const lang = normalizeLanguage(language);

  return species?.[lang] || species?.en || species?.sv || fallback || latinName;
}

function createPushPayload(message, subscription) {
  if (!message || typeof message !== 'object' || !message.type) {
    return JSON.stringify(message);
  }

  const language = normalizeLanguage(subscription?.language);
  const texts = getPushTexts(language);

  if (message.type === 'new-observation') {
    const listId = normalizeListId(message.listId);
    const birdName = getLocalizedBirdName(message.bird, language);
    return JSON.stringify({
      title: `${texts.newObservationAdded}: ${birdName}`,
      options: {
        icon: 'https://birdlist.app/192x192.png',
        body: `${texts.list}: ${message.listTitle || ''}`,
        tag: `list-${listId}`,
        data: {
          listId,
        },
      },
    });
  }

  if (message.type === 'welcome') {
    return JSON.stringify({
      title: texts.welcomeTitle,
      options: {
        body: texts.welcomeBody,
      },
    });
  }

  return JSON.stringify(message);
}

function canContributeToPublicList(list, ownerAliases, joinedLinks = []) {
  const aliases = new Set(ownerAliases.map((alias) => String(alias || '').trim()).filter(Boolean));
  const listOwner = String(list?.owner || '').trim();

  if (listOwner && aliases.has(listOwner)) {
    return true;
  }

  return joinedLinks.some((row) => aliases.has(String(row?.userId || '').trim()));
}

function uniquePublicListParticipants(list, joinedLinks = []) {
  return [
    list?.owner,
    ...joinedLinks.map((row) => row?.userId),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));
}

async function dexieRequest(pathname, options = {}) {
  const response = await fetch(`${DEXIE_BASE_URL}${pathname}`, {
    ...options,
    headers: {
      Authorization: await getAccessHeader(),
      ...(options.headers || {}),
    },
  });

  return response;
}

function encodePrimaryKey(primaryKey) {
  if (typeof primaryKey === 'string') {
    return encodeURIComponent(primaryKey);
  }

  return encodeURIComponent(JSON.stringify(primaryKey));
}

function toQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    searchParams.append(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function dexieGetMany(table, query = {}) {
  const response = await dexieRequest(`/all/${table}${toQueryString(query)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GET /all/${table} failed (${response.status}): ${errorBody}`);
  }

  const payload = await response.json();
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function dexieGetById(table, primaryKey) {
  const response = await dexieRequest(`/all/${table}/${encodePrimaryKey(primaryKey)}`, {
    method: 'GET',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GET /all/${table}/{id} failed (${response.status}): ${errorBody}`);
  }

  const payload = await response.json();
  if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object') {
    return payload.data;
  }

  return payload;
}

async function dexieUpsertMany(table, objects) {
  if (!Array.isArray(objects) || objects.length === 0) {
    return;
  }

  const response = await dexieRequest(`/all/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(objects),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`POST /all/${table} failed (${response.status}): ${errorBody}`);
  }
}

async function dexieDeleteById(table, primaryKey) {
  const response = await dexieRequest(`/all/${table}/${encodePrimaryKey(primaryKey)}`, {
    method: 'DELETE',
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DELETE /all/${table}/{id} failed (${response.status}): ${errorBody}`);
  }
}

async function setListRealmVisibility(listId, makePublic) {
  const list = await dexieGetById('lists', listId);
  if (!list) {
    return null;
  }

  const sourceRealmId = String(list.realmId || '').trim();
  const ownerRealmId = String(list.owner || '').trim();
  const targetRealmId = makePublic ? PUBLIC_REALM_ID : ownerRealmId;

  if (!targetRealmId) {
    throw new Error('List has no owner realm to move back to private visibility.');
  }

  if (sourceRealmId === targetRealmId) {
    return {
      listId,
      sourceRealmId,
      targetRealmId,
      movedObservations: 0,
      movedComments: 0,
    };
  }

  const [observations, comments] = await Promise.all([
    dexieGetMany('observations', { listId }),
    dexieGetMany('comments', { listId }),
  ]);

  await Promise.all([
    dexieUpsertMany('lists', [{ ...list, realmId: targetRealmId }]),
    dexieUpsertMany(
      'observations',
      observations.map((observation) => ({ ...observation, realmId: targetRealmId }))
    ),
    dexieUpsertMany(
      'comments',
      comments.map((comment) => ({ ...comment, realmId: targetRealmId }))
    ),
  ]);

  const shouldCleanupSourceRealm =
    sourceRealmId &&
    sourceRealmId !== targetRealmId &&
    sourceRealmId !== PUBLIC_REALM_ID &&
    sourceRealmId !== ownerRealmId;

  if (shouldCleanupSourceRealm) {
    const members = await dexieGetMany('members', { realmId: sourceRealmId });
    await Promise.all(members.filter((member) => member?.id).map((member) => dexieDeleteById('members', member.id)));
    await dexieDeleteById('realms', sourceRealmId).catch(() => {});
  }

  return {
    listId,
    sourceRealmId,
    targetRealmId,
    movedObservations: observations.length,
    movedComments: comments.length,
  };
}

async function addPublicObservation(payload) {
  const sanitized = sanitizePublicObservationPayload(payload);
  if (sanitized.error) {
    return { error: sanitized.error };
  }

  const observation = sanitized.observation;
  const list = await dexieGetById('lists', observation.listId);
  if (!list) {
    return { error: 'List not found.', status: 404 };
  }

  if (String(list.realmId || '').trim() !== PUBLIC_REALM_ID) {
    return { error: 'List is not public.', status: 403 };
  }

  const joinedLinks = await dexieGetMany('joinedLists', { listId: observation.listId }).catch(() => []);
  if (!canContributeToPublicList(list, sanitized.ownerAliases, joinedLinks)) {
    return { error: 'Join this list to contribute.', status: 403 };
  }

  const updated = toDexieCloudDate(new Date());
  await Promise.all([
    dexieUpsertMany('observations', [observation]),
    dexieUpsertMany('lists', [{ ...list, updated }]),
  ]);

  let push = null;
  try {
    push = await sendPushToList(observation.listId, {
      type: 'new-observation',
      listId: observation.listId,
      listTitle: list.title || list.name || '',
      bird: {
        name: observation.name,
        latinName: observation.latinName,
      },
    });
  } catch (err) {
    console.log('Failed to send public observation push:', err.message || err);
    push = {
      listId: observation.listId,
      total: 0,
      sent: 0,
      removed: 0,
      error: err.message || 'Failed to send push.',
    };
  }

  return {
    observation,
    listId: observation.listId,
    push,
  };
}

async function getPublicListParticipants(listId) {
  const normalizedListId = normalizeListId(listId);
  if (!normalizedListId) {
    return { error: 'List id is required.' };
  }

  const list = await dexieGetById('lists', normalizedListId);
  if (!list) {
    return { error: 'List not found.', status: 404 };
  }

  if (String(list.realmId || '').trim() !== PUBLIC_REALM_ID) {
    return { error: 'List is not public.', status: 403 };
  }

  const joinedLinks = await dexieGetMany('joinedLists', { listId: normalizedListId }).catch(() => []);
  return {
    listId: normalizedListId,
    participants: uniquePublicListParticipants(list, joinedLinks),
  };
}

async function deleteListEverywhere(listId, deleteObservations = false) {
  const list = await dexieGetById('lists', listId);
  if (!list) {
    return null;
  }

  const [observations, comments, joinedLinks] = await Promise.all([
    deleteObservations ? dexieGetMany('observations', { listId }) : Promise.resolve([]),
    dexieGetMany('comments', { listId }),
    dexieGetMany('joinedLists', { listId }).catch(() => []),
  ]);

  await Promise.all([
    dexieDeleteById('lists', listId),
    ...observations.filter((observation) => observation?.id).map((observation) => dexieDeleteById('observations', observation.id)),
    ...comments.filter((comment) => comment?.id).map((comment) => dexieDeleteById('comments', comment.id)),
    ...joinedLinks.filter((row) => row?.id).map((row) => dexieDeleteById('joinedLists', row.id)),
  ]);

  const sourceRealmId = String(list.realmId || '').trim();
  const ownerRealmId = String(list.owner || '').trim();
  const shouldCleanupSourceRealm =
    sourceRealmId &&
    sourceRealmId !== PUBLIC_REALM_ID &&
    sourceRealmId !== ownerRealmId;

  if (shouldCleanupSourceRealm) {
    const members = await dexieGetMany('members', { realmId: sourceRealmId });
    await Promise.all(members.filter((member) => member?.id).map((member) => dexieDeleteById('members', member.id)));
    await dexieDeleteById('realms', sourceRealmId).catch(() => {});
  }

  return {
    listId,
    deletedObservations: observations.length,
    deletedComments: comments.length,
    deletedJoinedLinks: joinedLinks.length,
  };
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
      const subscriptionId = getSubscriptionRecordId(subscription);
      if (subscriptionId) {
        await deleteSubscriptionFromDatabase(subscriptionId);
        removed += 1;
      }
      continue;
    }

    const key = makeEndpointListKey(subscription.endpoint, subscription.listId);
    if (seen.has(key)) {
      const subscriptionId = getSubscriptionRecordId(subscription);
      if (subscriptionId) {
        await deleteSubscriptionFromDatabase(subscriptionId);
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

async function upsertListSubscription(subscription, listId, language = 'en') {
  const normalizedListId = normalizeListId(listId);
  const normalizedLanguage = normalizeLanguage(language);
  const subscriptions = await getSubscriptionsFromDatabase();

  const existing = subscriptions.find(
    (item) => item.endpoint === subscription.endpoint && normalizeListId(item.listId) === normalizedListId
  );

  if (existing && sameSubscriptionData(existing, subscription)) {
    return { created: false, updated: false };
  }

  const existingId = getSubscriptionRecordId(existing);
  if (existingId) {
    await deleteSubscriptionFromDatabase(existingId);
  }

  await insertSubscriptionToDatabase({
    ...subscription,
    listId: normalizedListId,
    language: normalizedLanguage,
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

  await Promise.all(
    targets
      .map(getSubscriptionRecordId)
      .filter(Boolean)
      .map((subscriptionId) => deleteSubscriptionFromDatabase(subscriptionId))
  );

  const refreshedSubscriptions = await getSubscriptionsFromDatabase();
  const remainingForEndpoint = refreshedSubscriptions.filter((item) => item.endpoint === endpoint).length;

  return {
    removed: targets.length,
    remainingForEndpoint,
  };
}

async function triggerPush(subscription, dataToSend) {
  if (!isPushConfigured) {
    return { sent: false, removed: false };
  }

  try {
    await webpush.sendNotification(subscription, dataToSend);
    return { sent: true, removed: false };
  } catch (err) {
    const subscriptionId = getSubscriptionRecordId(subscription);
    if ((err.statusCode === 404 || err.statusCode === 410) && subscriptionId) {
      await deleteSubscriptionFromDatabase(subscriptionId);
      return { sent: false, removed: true };
    }

    console.log('Failed to send push to subscription:', err.message || err);
    return { sent: false, removed: false };
  }
}

async function sendPushToList(listId, message) {
  const normalizedListId = normalizeListId(listId);
  const subscriptions = (await getSubscriptionsFromDatabase()).filter(
    (subscription) => normalizeListId(subscription.listId) === normalizedListId
  );

  const results = await Promise.all(
    subscriptions.map((subscription) => triggerPush(subscription, createPushPayload(message, subscription)))
  );

  return {
    listId: normalizedListId,
    total: subscriptions.length,
    sent: results.filter((result) => result.sent).length,
    removed: results.filter((result) => result.removed).length,
  };
}

app.post('/api/subscription', async (req, res) => {
  const listId = normalizeListId(req.body?.listId);
  const subscription = sanitizeIncomingSubscription(req.body?.subscription);
  const language = normalizeLanguage(req.body?.language);

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
    const result = await upsertListSubscription(subscription, listId, language);

    if (result.created && isPushConfigured) {
      webpush.sendNotification(subscription, createPushPayload({ type: 'welcome' }, { language })).catch(console.log);
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
  const language = normalizeLanguage(req.body?.language);

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
    const existing = subscriptions.find(
      (item) => item.endpoint === endpoint && normalizeListId(item.listId) === listId
    );
    const subscribed = Boolean(existing);

    if (existing && normalizeLanguage(existing.language) !== language) {
      const existingId = getSubscriptionRecordId(existing);
      if (existingId) {
        await deleteSubscriptionFromDatabase(existingId);
      }
      await insertSubscriptionToDatabase({
        ...existing,
        language,
        updatedAt: new Date().toISOString(),
      });
    }

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
    const push = await sendPushToList(payload.listId, payload.message);

    res.status(200).json({
      data: {
        success: true,
        ...push,
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

app.post('/api/list-visibility', async (req, res) => {
  const listId = normalizeListId(req.body?.listId);
  const makePublic = Boolean(req.body?.makePublic);

  if (!listId) {
    res.status(400).json({
      error: {
        id: 'invalid-request',
        message: 'Body must include { listId, makePublic }',
      },
    });
    return;
  }

  try {
    const result = await setListRealmVisibility(listId, makePublic);
    if (!result) {
      res.status(404).json({
        error: {
          id: 'list-not-found',
          message: 'List not found.',
        },
      });
      return;
    }

    res.status(200).json({
      data: {
        success: true,
        ...result,
        makePublic,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-update-list-visibility',
        message: `Failed to update list visibility: ${err.message}`,
      },
    });
  }
});

app.post('/api/public-observation', async (req, res) => {
  try {
    const result = await addPublicObservation(req.body);
    if (result?.error) {
      res.status(result.status || 400).json({
        error: {
          id: 'unable-to-save-public-observation',
          message: result.error,
        },
      });
      return;
    }

    res.status(200).json({
      data: {
        success: true,
        ...result,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-save-public-observation',
        message: `Failed to save observation: ${err.message}`,
      },
    });
  }
});

app.post('/api/public-list-participants', async (req, res) => {
  try {
    const result = await getPublicListParticipants(req.body?.listId);
    if (result?.error) {
      res.status(result.status || 400).json({
        error: {
          id: 'unable-to-load-public-list-participants',
          message: result.error,
        },
      });
      return;
    }

    res.status(200).json({
      data: {
        success: true,
        ...result,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-load-public-list-participants',
        message: `Failed to load participants: ${err.message}`,
      },
    });
  }
});

app.post('/api/delete-list', async (req, res) => {
  const listId = normalizeListId(req.body?.listId);
  const deleteObservations = Boolean(req.body?.deleteObservations);

  if (!listId) {
    res.status(400).json({
      error: {
        id: 'invalid-request',
        message: 'Body must include { listId, deleteObservations }',
      },
    });
    return;
  }

  try {
    const result = await deleteListEverywhere(listId, deleteObservations);
    if (!result) {
      res.status(404).json({
        error: {
          id: 'list-not-found',
          message: 'List not found.',
        },
      });
      return;
    }

    res.status(200).json({
      data: {
        success: true,
        ...result,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: {
        id: 'unable-to-delete-list',
        message: `Failed to delete list: ${err.message}`,
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
