require('dotenv').config();
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://d12d810e0ed1be3ceeb39ce32badf469@o4511436228067328.ingest.us.sentry.io/4511436240650240",
  integrations: [],
  tracesSampleRate: 1.0,
});

let app;
let startServer = () => {};

try {
  const { requireFeature } = require('./middleware/tierGuard');
  // MENCEGAH VERCEL CRASH:
  // const { nodeProfilingIntegration } = require("@sentry/profiling-node");


  Sentry.init({
    dsn: "https://d12d810e0ed1be3ceeb39ce32badf469@o4511436228067328.ingest.us.sentry.io/4511436240650240",
    integrations: [],
    tracesSampleRate: 1.0,
  });

  const express = require('express');
  const cors = require('cors');
  const path = require('path');
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for Supabase
  const http = require('http');
  const { Server } = require('socket.io');

  app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.set('io', io);
  // Expose a getter for utils/realtimeNotifier to retrieve the Socket.IO instance
  app.getIo = () => io;

  app.use(cors());
  app.use(express.json());
  app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads')));
  
  // Public route test
  app.get('/api/health', (req, res) => res.json({ status: 'ok', source: 'vercel' }));
  // New simple health check that bypasses auth & other middleware
  app.get('/api/healthz', (req, res) => res.json({ status: 'ok' }));
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

  // Swagger UI Integration
  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yamljs');
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


  const jwt = require('jsonwebtoken');
  const SECRET = process.env.JWT_SECRET || 'ken_enterprise_secret_2024';

  const authMiddleware = require('./middleware/authMiddleware');
  app.use(authMiddleware);

  const activityLog = require('./middleware/activityLog');
  app.use(activityLog);

  const closingGuard = require('./middleware/closingGuard');

  app.use('/api', require('./routes/userRoutes'));
  app.use('/api/menu', require('./routes/menuRoutes'));
  app.use('/api/transactions', closingGuard, require('./routes/transactionRoutes'));
  app.use('/api/system', require('./routes/systemRoutes'));
  app.use('/api/inventory', requireFeature('inventory'), require('./routes/inventoryRoutes'));
  app.use('/api/opname', requireFeature('inventory'), closingGuard, require('./routes/opnameRoutes'));
  app.use('/api/accounting', requireFeature('accounting'), closingGuard, require('./routes/accountingRoutes'));
  app.use('/api/shifts', requireFeature('shift'), require('./routes/shiftRoutes'));
  app.use('/api/ai', requireFeature('ai_insights'), require('./routes/aiRoutes'));
  app.use('/api/p', requireFeature('procurement'), require('./routes/procurementRoutes'));
  app.use('/api/laporan', require('./routes/reportRoutes'));
  app.use('/api/promo-codes', require('./routes/promoCodeRoutes'));
  app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
  app.use('/api/assets', requireFeature('accounting'), require('./routes/assetRoutes'));
  app.use('/api/closings', requireFeature('accounting'), require('./routes/closingRoutes'));

  const { supabase } = require('./supabase');
  app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `public/${fileName}`;
      
      // Upload ke Supabase Storage (bucket: 'uploads')
      let uploadRes = await supabase.storage
        .from('uploads')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });
        
      if (uploadRes.error && uploadRes.error.message.includes('Bucket not found')) {
        console.warn('⚠️ [Upload Engine] Bucket "uploads" not found, initiating self-healing bucket creation...');
        const { error: createErr } = await supabase.storage.createBucket('uploads', { public: true });
        if (!createErr) {
          console.log('✅ [Upload Engine] Bucket "uploads" successfully created programmatically. Retrying upload...');
          uploadRes = await supabase.storage
            .from('uploads')
            .upload(filePath, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: true
            });
        }
      }
        
      if (uploadRes.error) {
        console.error('Supabase Storage Error:', uploadRes.error);
        return res.status(500).json({ error: 'Gagal mengupload ke storage. Pastikan bucket "uploads" sudah dibuat di Supabase.' });
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
        
      res.json({ url: publicUrlData.publicUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  Sentry.setupExpressErrorHandler(app);
  const errorHandler = require('./middleware/errorHandler');
  app.use(errorHandler);

  const PORT = process.env.PORT || 3001;
  const { startSyncDaemon } = require('./services/syncService');
  const { initJobs } = require('./jobs');

  startServer = () => {
    server.listen(PORT, () => {
      console.log(`🚀 KEN ENTERPRISE CORE ACTIVE ON PORT ${PORT}`);
      startSyncDaemon();
      initJobs();
    });
  };

  if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
    startServer();
  }
} catch (error) {
  console.error("❌ CRITICAL STARTUP ERROR:", error);
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({ 
      error: "VERCEL_STARTUP_CRASH", 
      message: error.message, 
      stack: error.stack 
    });
  });
}

module.exports = app;

