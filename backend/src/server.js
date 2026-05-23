require('dotenv').config();
let app;
try {
  const Sentry = require("@sentry/node");
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
  app.use(cors());
  app.use(express.json());
  
  // Public route test
  app.get('/api/health', (req, res) => res.json({ status: 'ok', source: 'vercel' }));

  const jwt = require('jsonwebtoken');
  const SECRET = process.env.JWT_SECRET || 'ken_enterprise_secret_2024';

  const authMiddleware = require('./middleware/authMiddleware');
  app.use(authMiddleware);

  const activityLog = require('./middlewares/activityLog');
  app.use(activityLog);

  app.use('/api', require('./routes/userRoutes'));
  app.use('/api/menu', require('./routes/menuRoutes'));
  app.use('/api/transactions', require('./routes/transactionRoutes'));
  app.use('/api/system', require('./routes/systemRoutes'));
  app.use('/api/inventory', requireFeature('inventory'), require('./routes/inventoryRoutes'));
  app.use('/api/accounting', requireFeature('accounting'), require('./routes/accountingRoutes'));
  app.use('/api/shifts', requireFeature('shift'), require('./routes/shiftRoutes'));
  app.use('/api/ai', requireFeature('ai_insights'), require('./routes/aiRoutes'));
  app.use('/api/p', requireFeature('procurement'), require('./routes/procurementRoutes'));
  app.use('/api/laporan', require('./routes/reportRoutes'));

  const supabase = require('./config/supabase');
  app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `public/${fileName}`;
      
      // Upload ke Supabase Storage (bucket: 'uploads')
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });
        
      if (error) {
        console.error('Supabase Storage Error:', error);
        return res.status(500).json({ error: 'Gagal mengupload ke storage. Pastikan bucket "uploads" sudah dibuat dan public di Supabase Anda.' });
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

  if (!process.env.VERCEL) {
    server.listen(PORT, () => {
      console.log(`🚀 KEN ENTERPRISE CORE ACTIVE ON PORT ${PORT}`);
      startSyncDaemon();
    });
  }
} catch (error) {
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
