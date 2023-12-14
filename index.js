require('dotenv').config();
const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');

const publicVapidKey = process.env.VAPID_PUBLIC;
const privateVapidKey = process.env.VAPID_PRIVATE;
const privateDexieCloudKey = process.env.DEXIE_CLOUD_CLIENTID;
const privateDexieCloudSecret = process.env.DEXIE_CLOUD_CLIENTSECRET;

// Create express app.
const app = express();

// Add CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://birdlist.app:5001']
}));  

// Use body parser which we will use to parse request body that sending from client.
app.use(bodyParser.json());

// We will store our client files in ./client directory.
app.use(express.static(path.join(__dirname, "client")))

// Setup the public and private VAPID keys to web-push library.
webpush.setVapidDetails("mailto:anton@andreasson.org", publicVapidKey, privateVapidKey);

const getDexieCloudAccessToken = async () => {
  console.log("getDexieCloudAccessToken…")

  const payload = {
    "grant_type": "client_credentials",
    "scopes": ["ACCESS_DB", "GLOBAL_READ", "GLOBAL_WRITE"],
    "client_id": privateDexieCloudKey,
    "client_secret": privateDexieCloudSecret,
    "claims": {
      "sub": "birdlist@system.local"
    }
  };
  
  const apiCallPromise = await fetch("https://zyh2ho4s6.dexie.cloud/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload)
  });

  const apiCallObj = await apiCallPromise.json();
  return apiCallObj.accessToken;
}

async function getAccessHeader() {
  const header = "Bearer " + await getDexieCloudAccessToken();
  return header;
};

// This utility function makes sure the request is valid, has a body and an endpoint property, 
// otherwise it returns an error to the client (via https://flaviocopes.com/push-api/)
const isValidSaveRequest = (req, res) => {
  if (!req.body || !req.body.endpoint) {
    res.status(400);
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify({
      error: {
        id: 'no-endpoint',
        message: 'Subscription must have an endpoint'
      }
    }))
    return false;
  }
  return true;
}

function saveSubscriptionToDatabase(subscription) {
  console.log("saveSubscriptionToDatabase…")
  return new Promise((resolve, reject) => {
    insertToDatabase(subscription, (err, id) => {
      if (err) {
        reject(err)
        return
      }

      resolve(id)
    })
  })
}

async function insertToDatabase(subscription, callback) {
  console.log("insertToDatabase…")
  const apiCallPromise = await fetch("https://zyh2ho4s6.dexie.cloud/my/webPushSubscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": await getAccessHeader()
    },
    body: JSON.stringify(subscription.body)
  });
  const apiCallObj = await apiCallPromise;
  console.log("insertToDatabase: ", apiCallObj)
}

async function deleteSubscriptionFromDatabase(id) {
  console.log("deleteSubscriptionFromDatabase…")
  fetch(`https://zyh2ho4s6.dexie.cloud/my/webPushSubscriptions/${id}`, {
    method: "DELETE",
    headers: { "Authorization": await getAccessHeader() }
  }).then(response => console.log("deleteSubscriptionFromDatabase: ", response));
}

async function getSubscriptionsFromDatabase() {
  console.log("getSubscriptionsFromDatabase…")
  const apiCallPromise = await fetch("https://zyh2ho4s6.dexie.cloud/my/webPushSubscriptions", {
    method: "GET",
    headers: { "Authorization": await getAccessHeader() }
  });
  const apiCallObj = await apiCallPromise;
  return apiCallObj.json();
}

function triggerPush(subscription, dataToSend) {
  console.log("triggerPush…")
  return webpush.sendNotification(subscription, dataToSend)
    .catch((err) => {
      if (err.statusCode === 410) {
        return deleteSubscriptionFromDatabase(subscription.id)
      } else {
        console.log('Subscription is no longer valid: ', err)
      }
    })
}

// Create route for allow client to subscribe to push notification.
app.post('/api/subscription', (req, res) => {
  if (!isValidSaveRequest(req, res)) {
    return;
  }

  saveSubscriptionToDatabase(req, res.body)
    .then((subscriptionId) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(JSON.stringify({ data: { success: true } }))
    })
    .catch((err) => {
      res.status(500)
      res.setHeader('Content-Type', 'application/json')
      res.send(JSON.stringify({
        error: {
          id: 'unable-to-save-subscription',
          message: 'Subscription received but failed to save it'
        }
      }));
    });

  const subscription = req.body;
  res.status(201).json({});
  const payload = JSON.stringify({ title: "Hello World", body: "This is your first push notification" });
  webpush.sendNotification(subscription, payload).catch(console.log);
});

app.post('/api/push', async (req, res) => {
  await getSubscriptionsFromDatabase()
    .then((subscriptions) => {
      let promiseChain = Promise.resolve()
      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i]
        promiseChain = promiseChain.then(() => {
          let dataToSend = JSON.stringify(req.body); // { title: "New bird spotted:", body: '[listid]' }
          return triggerPush(subscription, dataToSend)
        })
      }
      return promiseChain
    })
    .then(() => {
      res.setHeader('Content-Type', 'application/json')
      res.send(JSON.stringify({ data: { success: true } }))
    })
    .catch((err) => {
      res.status(500)
      res.setHeader('Content-Type', 'application/json')
      res.send(JSON.stringify({
        error: {
          id: 'unable-to-send-messages',
          message: `Failed to send the push ${err.message}`
        }
      }));
    });
});

const PORT = 5001;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
