import { Hono } from 'hono';
import { cors } from 'hono/cors';

import authRoutes from './routes/auth.js';
import announcementRoutes from './routes/announcements.js';
import winnerRoutes from './routes/winners.js';
import bookmarkRoutes from './routes/bookmarks.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import feedbackRoutes from './routes/feedback.js';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.onError((err, c) => {
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

// Health check
app.get('/', (c) => c.json({ message: 'Vee Rubber GProcurement Tracker API is running' }));

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/announcements', announcementRoutes);
app.route('/api/winners', winnerRoutes);
app.route('/api/bookmarks', bookmarkRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/feedback', feedbackRoutes);

export default {
  fetch: app.fetch,
  // Scheduled handler (cron trigger)
  async scheduled(event, env, ctx) {
    // Future use: fetch RSS feed or send email digests directly from Worker if needed
  },
};
