import 'dotenv/config';
import { MongoClient } from 'mongodb';

const postgresTopics = new Set([
  'JOINs', 'Subqueries', 'CTEs', 'Aggregations', 'Window functions', 'EXISTS', 'CASE',
  'Transactions', 'ACID', 'Indexes', 'Composite indexes', 'Partial indexes', 'Query planner',
  'EXPLAIN', 'EXPLAIN ANALYZE', 'Isolation levels', 'Locks', 'Deadlocks', 'Connection pooling',
  'Partitioning basics', 'Replication basics'
]);

const redisQuestions = [
  'Why use Redis instead of PostgreSQL for caching?',
  'What is cache-aside?',
  'What is cache invalidation?',
  'What is TTL?',
  'What happens during a cache hit/miss?',
  'What happens if Redis goes down?',
  'What are Redis data types and when would you use each?',
  'What is Redis Pub/Sub?',
  'Pub/Sub vs Redis Streams?',
  'What is a distributed lock?',
  'How would you implement rate limiting using Redis?',
  'What are RDB and AOF?',
  'What happens when Redis memory is full?',
  'What is Redis replication?',
  'What is Redis Cluster?',
  'How does BullMQ use Redis?',
  'How do you prevent stale cache?',
  'How do you handle Redis failure in a Node.js application?'
];

const client = new MongoClient(process.env.MONGODB_URI);
const database = process.env.MONGODB_DB || 'learning_tracker';
const trackerId = process.env.TRACKER_ID || 'personal-tracker';

try {
  await client.connect();
  const trackers = client.db(database).collection('trackers');
  const tracker = await trackers.findOne({ _id: trackerId });
  const data = tracker?.data;
  if (!data?.weeks || !Array.isArray(data.weeks)) throw new Error('Tracker data was not found.');

  const legacyModule = data.weeks.find(week => week.title === 'PostgreSQL + Redis (2 weeks)');
  const redisModule = data.weeks.find(week => week.title === 'Redis (1 week)');
  const now = new Date().toISOString();
  let changed = false;

  if (legacyModule) {
    const postgresql = { ...legacyModule, title: 'PostgreSQL (1 week)', topics: legacyModule.topics.filter(topic => postgresTopics.has(topic.title)) };
    const redisTopics = legacyModule.topics.filter(topic => !postgresTopics.has(topic.title));
    const redis = {
      id: 'phase-redis', number: legacyModule.number + 1, title: 'Redis (1 week)',
      topics: [...redisTopics, ...redisQuestions.map((title, index) => ({
        id: `redis-question-${index + 1}`, title, status: 'not-started', notes: '', studyMinutes: 0, updatedAt: now
      }))]
    };
    const index = data.weeks.indexOf(legacyModule);
    data.weeks.splice(index, 1, postgresql, redis);
    data.weeks.forEach((week, index) => { week.number = index + 1; });
    changed = true;
  } else if (redisModule) {
    const existing = new Set(redisModule.topics.map(topic => topic.title));
    const additions = redisQuestions.filter(title => !existing.has(title)).map((title, index) => ({
      id: `redis-question-${index + 1}`, title, status: 'not-started', notes: '', studyMinutes: 0, updatedAt: now
    }));
    if (additions.length) { redisModule.topics.push(...additions); changed = true; }
  } else {
    throw new Error('Could not find the PostgreSQL + Redis module.');
  }

  if (changed) {
    await trackers.updateOne({ _id: trackerId }, { $set: { data, updatedAt: new Date() } });
    console.log('Curriculum updated: PostgreSQL and Redis are now separate modules.');
  } else {
    console.log('Curriculum is already up to date.');
  }
} finally {
  await client.close();
}
