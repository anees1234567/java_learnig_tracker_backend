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
app.use(cors({
  origin: 'https://ornate-pastelito-daf809.netlify.app', // Replace with your actual frontend URL
  credentials: true
}));
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

app.post('/api/session', async (request, response) => {
  try {
    const { date, minutes } = request.body ?? {};
    if (!date || typeof minutes !== 'number') return response.status(400).json({ error: 'Invalid payload' });

    const tracker = await trackers.findOne({ _id: TRACKER_ID });
    const data = tracker?.data ?? { version: 3, weeks: [], sessions: [] };
    if (!Array.isArray(data.sessions)) data.sessions = [];
    // merge minutes into today's session (aggregate per date)
    const idx = data.sessions.findIndex(s => s.date === date);
    if (idx >= 0) {
      data.sessions[idx].minutes = (Number(data.sessions[idx].minutes) || 0) + minutes;
    } else {
      const id = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      data.sessions.push({ id, date, minutes });
    }
    await trackers.updateOne({ _id: TRACKER_ID }, { $set: { data, updatedAt: new Date() } }, { upsert: true });
    return response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return response.status(500).json({ error: 'Server error' });
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Server error.' });
});

app.listen(PORT, () => console.log(`Tracker API listening on http://localhost:${PORT}`));
