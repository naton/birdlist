const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const publicVapidKey = "BC-q_Qa_xZrCippKmu2_x6oRsJFP7E9II66LbGAvhUc_Hw2Xe9pm6JJFEj_07OJzIcI4NjU4ovz8oOKb1jqPyhU";
const privateVapidKey = "umUxE_qhAiU-GD4e68jsI9eDktH3PiYRgEbUcqbv1bE";
const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiaXJkbGlzdEBzeXN0ZW0ubG9jYWwiLCJzY29wZXMiOlsiQUNDRVNTX0RCIl0sImlhdCI6MTY4MDYzNjc0NSwibmJmIjoxNjgwNjM2NDQ1LCJleHAiOjE2ODA2NDAzNDUsImF1ZCI6WyJodHRwczovL3p5aDJobzRzNi5kZXhpZS5jbG91ZCIsInp5aDJobzRzNiJdLCJpc3MiOiJEYXZpZElzc3VlciJ9.NTiByo-GbQnpj2-T-ID4TfDZZSffHuEG7re75uBPlQM";
const accessHeaders = { "Authorization": "Bearer " + accessToken }

// Create express app.
const app = express();

// Add CORS
app.use(cors({
  origin: ['http://localhost:4173','http://localhost:5173']
}));  

// Use body parser which we will use to parse request body that sending from client.
app.use(bodyParser.json());

// We will store our client files in ./client directory.
app.use(express.static(path.join(__dirname, "client")))

// Setup the public and private VAPID keys to web-push library.
webpush.setVapidDetails("mailto:anton@andreasson.org", publicVapidKey, privateVapidKey);

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

function insertToDatabase(subscription, callback) {
  fetch("https://zyh2ho4s6.dexie.cloud/my/webPushSubscriptions", {
    method: "POST",
    headers: accessHeaders
  }).then(response => console.log(response));
}

function deleteSubscriptionFromDatabase(id) {
  fetch(`https://zyh2ho4s6.dexie.cloud/my/webPushSubscriptions/${id}`, {
    method: "DELETE",
    headers: accessHeaders
  }).then(response => console.log(response));
}

function getSubscriptionsFromDatabase() {
  fetch("https://zyh2ho4s6.dexie.cloud/my/webPushSubscriptions", {
    method: "GET",
    headers: accessHeaders
  }).then(response => console.log(response));
}

function triggerPush(subscription, dataToSend) {
  return webpush.sendNotification(subscription, dataToSend)
    .catch((err) => {
      if (err.statusCode === 410) {
        return deleteSubscriptionFromDatabase(subscription._id)
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

  // const subscription = req.body;
  // res.status(201).json({});
  // const payload = JSON.stringify({ title: "Hello World", body: "This is your first push notification" });
  // webpush.sendNotification(subscription, payload).catch(console.log);
});

app.post('/api/push', (req, res) => {
  return getSubscriptionsFromDatabase()
    .then((subscriptions) => {
      let promiseChain = Promise.resolve()
      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i]
        promiseChain = promiseChain.then(() => {
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
