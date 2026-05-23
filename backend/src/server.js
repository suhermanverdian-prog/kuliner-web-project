require('dotenv').config();
const Sentry = require("@sentry/node");
const { requireFeature } = require('./middleware/tierGuard');
// MENCEGAH VERCEL CRASH:
// const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: "https://d12d810e0ed1be3ceeb39ce32badf469@o4511436228067328.ingest.us.sentry.io/4511436240650240",
  integrations: [
    // nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// GLOBAL SOCKET INJECTION
app.set('io', io);

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'ken_enterprise_secret_2024';

// AUTH MIDDLEWARE (IDENTITY GUARD v4.0)
const authMiddleware = require('./middleware/authMiddleware');
app.use(authMiddleware);

// Activity Log Middleware – captures mutating requests for audit trail
const activityLog = require('./middlewares/activityLog');
app.use(activityLog);


// ============================================================
// CENTRAL API REGISTRY (CORRECTED MAP)
// ============================================================

// 1. Core Authentication & Identity
app.use('/api', require('./routes/userRoutes'));

// 2. Operational Modules
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/system', require('./routes/systemRoutes'));
app.use('/api/inventory', requireFeature('inventory'), require('./routes/inventoryRoutes'));
app.use('/api/accounting', requireFeature('accounting'), require('./routes/accountingRoutes'));
app.use('/api/shifts', requireFeature('shift'), require('./routes/shiftRoutes')); // NEW SHIFT ARCHITECTURE
app.use('/api/ai', requireFeature('ai_insights'), require('./routes/aiRoutes'));

// 3. Specialized Namespaces
app.use('/api/p', requireFeature('procurement'), require('./routes/procurementRoutes'));
app.use('/api/laporan', require('./routes/reportRoutes'));

// ============================================================

// STATIC ASSETS
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// GLOBAL ERROR HANDLER
Sentry.setupExpressErrorHandler(app); // Sentry must be before our custom error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const { startSyncDaemon } = require('./services/syncService');

// Cegah listen manual saat dijalankan di Vercel Serverless
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 KEN ENTERPRISE CORE ACTIVE ON PORT ${PORT}`);
    startSyncDaemon(); // 🔄 Start Background Auto-Reconciliation Engine
  });
}

// WAJIB DIEKSPOR UNTUK VERCEL SERVERLESS
module.exports = app;
