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

  const express = require('express');
  const cors = require('cors');
  const path = require('path');
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for Supabase
  const http = require('http');
  const { Server } = require('socket.io');

  app = express();
  app.use((req, res, next) => {
    console.log(`🔍 [Incoming Request] ${req.method} ${req.url} (path: ${req.path})`);
    if (req.headers['access-control-request-private-network']) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.set('io', io);
  // Expose a getter for utils/realtimeNotifier to retrieve the Socket.IO instance
  app.getIo = () => io;

  // ⚠️ On Vercel, static files (manifest.json, sw.js, favicon) are served
  // directly by Vercel's CDN edge via vercel.json routing rules.
  // Do NOT use express.static(frontend/dist) here — it has no effect on Vercel
  // and can cause conflicts.

  // Configure CORS to allow any origin (including all Vercel preview domains)
  const getAllowedOrigin = (origin) => {
    if (!origin) return true; // server-to-server
    const isVercel = /\.vercel\.app$/.test(origin) || origin.endsWith('vercel.app');
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    return isVercel || isLocal;
  };
  const corsOptions = {
    origin: (origin, callback) => {
      // Izinkan browser mana pun memanggil backend ini selama ia merupakan subdomain vercel.app, localhost, atau jika origin kosong (non-browser)
      if (!origin || getAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        // Fallback aman untuk custom domains
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 'Authorization', 'x-tenant-id',
      'x-outlet-id', 'x-user-id', 'x-user-role',
      'X-Requested-With', 'Accept', 'sentry-trace', 'baggage'
    ]
  };
  app.use(cors(corsOptions));
  // Explicitly handle OPTIONS preflight — must respond 200 before auth middleware
  app.options('*', (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id, x-outlet-id, x-user-id, x-user-role, X-Requested-With, Accept, sentry-trace, baggage');
    if (req.headers['access-control-request-private-network']) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    res.sendStatus(200);
  });

  app.use(express.json());
  const fs = require('fs');
  app.get('/api/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const extname = path.extname(filename);
    const baseName = path.basename(filename, extname);
    const uploadsDir = path.join(__dirname, '../public/uploads');
    
    // List order of extensions to try (original first, then fallbacks)
    const extensionsToTry = [extname, '.png', '.webp', '.jpg', '.jpeg'];
    
    for (const ext of extensionsToTry) {
      if (!ext) continue;
      const filePath = path.join(uploadsDir, baseName + ext);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
    
    res.status(404).send('Not Found');
  });
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

  // ── RUTE PUBLIK (Tanpa JWT) ─────────────────────────────────────────────
  // Endpoint ini harus didaftarkan SEBELUM authMiddleware agar tamu (browser
  // pelanggan tanpa token) bisa mengecek status shift kasir aktif dan melihat menu.
  app.get('/api/shifts/active-public', async (req, res, next) => {
    try {
      const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID wajib disertakan di Header (x-tenant-id) atau Query (?tenantId=...).' });
      }
      const shiftService = require('./services/shiftService');
      const activeShift = await shiftService.getActiveShift(tenantId);
      res.json(activeShift);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/menu', async (req, res, next) => {
    try {
      const menuController = require('./controllers/menuController');
      return menuController.getAllMenu(req, res, next);
    } catch (err) {
      next(err);
    }
  });
  // ────────────────────────────────────────────────────────────────────────

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
  app.use('/api/corporate', require('./routes/corporateRoutes'));
  app.use('/api/customisations', require('./routes/customisationRoutes'));


  const { supabase } = require('./supabase');
  const sharp = require('sharp');
  app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      
      // Mengompresi dan mengonversi gambar ke format WebP dengan kualitas 80
      let imageBuffer = req.file.buffer;
      let fileExt = 'webp';
      let contentType = 'image/webp';

      try {
        imageBuffer = await sharp(req.file.buffer)
          .webp({ quality: 80 })
          .toBuffer();
      } catch (sharpErr) {
        console.warn('⚠️ [Upload Engine] Sharp failed to process image, uploading raw file instead:', sharpErr.message);
        fileExt = req.file.originalname.split('.').pop();
        contentType = req.file.mimetype;
      }
      
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `public/${fileName}`;
      
      // Upload ke Supabase Storage (bucket: 'uploads')
      let uploadRes = await supabase.storage
        .from('uploads')
        .upload(filePath, imageBuffer, {
          contentType: contentType,
          upsert: true
        });
        
      if (uploadRes.error && uploadRes.error.message.includes('Bucket not found')) {
        console.warn('⚠️ [Upload Engine] Bucket "uploads" not found, initiating self-healing bucket creation...');
        const { error: createErr } = await supabase.storage.createBucket('uploads', { public: true });
        if (!createErr) {
          console.log('✅ [Upload Engine] Bucket "uploads" successfully created programmatically. Retrying upload...');
          uploadRes = await supabase.storage
            .from('uploads')
            .upload(filePath, imageBuffer, {
              contentType: contentType,
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
