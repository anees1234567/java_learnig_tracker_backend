import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { MongoClient } from 'mongodb';

const { MONGODB_URI, MONGODB_DB = 'learning_tracker', PORT = 3001, TRACKER_ID = 'personal-tracker', CLIENT_ORIGIN } = process.env;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Copy .env.example to .env and add your MongoDB connection string.');
}

const client = new MongoClient(MONGODB_URI);
await client.connect();
const trackers = client.db(MONGODB_DB).collection('trackers');

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN ? CLIENT_ORIGIN.split(',').map(value => value.trim()) : true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_request, response) => {
  await client.db(MONGODB_DB).command({ ping: 1 });
  response.json({ ok: true });
});

app.get('/api/tracker', async (_request, response) => {
  const tracker = await trackers.findOne({ _id: TRACKER_ID }, { projection: { _id: 0, data: 1 } });
  response.json(tracker ?? { data: null });
});

app.put('/api/tracker', async (request, response) => {
  const { data } = request.body ?? {};
  if (!data || data.version !== 3 || !Array.isArray(data.weeks) || !Array.isArray(data.sessions)) {
    return response.status(400).json({ error: 'Invalid tracker data.' });
  }
  await trackers.updateOne({ _id: TRACKER_ID }, { $set: { data, updatedAt: new Date() } }, { upsert: true });
  response.json({ ok: true });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Server error.' });
});

app.listen(PORT, () => console.log(`Tracker API listening on http://localhost:${PORT}`));
