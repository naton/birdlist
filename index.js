const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

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

const publicVapidKey = "BC-q_Qa_xZrCippKmu2_x6oRsJFP7E9II66LbGAvhUc_Hw2Xe9pm6JJFEj_07OJzIcI4NjU4ovz8oOKb1jqPyhU";
const privateVapidKey = "umUxE_qhAiU-GD4e68jsI9eDktH3PiYRgEbUcqbv1bE";

// Setup the public and private VAPID keys to web-push library.
webpush.setVapidDetails("mailto:anton@andreasson.org", publicVapidKey, privateVapidKey);

// Create route for allow client to subscribe to push notification.
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  res.status(201).json({});
  const payload = JSON.stringify({ title: "Hello World", body: "This is your first push notification" });

  webpush.sendNotification(subscription, payload).catch(console.log);
})

const PORT = 5001;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
