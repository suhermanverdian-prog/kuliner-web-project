const jwt = require('jsonwebtoken');

/**
 * @function authMiddleware
 * @description Validasi JWT dan Injeksi User Context (Tenant & Role) secara Aman
 */
const authMiddleware = (req, res, next) => {
  // Public paths (Read-only access for Guests)
  const publicPaths = [
    '/api/login', 
    '/api/register', 
    '/api/health', 
    '/api/v1/system/health',
    '/api/menu',
    '/api/activeshift',
    '/api/v1/system/outletinfos'
  ];

  // Initialize empty context to prevent destructuring crashes downstream
  req.userContext = {};

  const authHeader = req.headers.authorization;

  // 1. Uji otentikasi jika header token ada (Mencegah tenant undefined pada public paths)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ken_enterprise_secret_2024');
      req.userContext = {
        userId: decoded.id || decoded.userId,
        role: decoded.role,
        tenantId: decoded.tenantId,
        outletId: req.headers['x-outlet-id'] || decoded.outletId || null
      };
      return next();
    } catch (err) {
      if (!publicPaths.includes(req.path) && !req.path.startsWith('/uploads')) {
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
      }
    }
  }

  // 2. Uji header x-tenant-id untuk tamu atau transaksi self-ordering
  const headerTenantId = req.headers['x-tenant-id'] || req.query.tenantId || req.query.tenant_id;
  if (headerTenantId) {
    req.userContext = {
      userId: req.headers['x-user-id'] || 'guest-user',
      role: req.headers['x-user-role'] || 'guest',
      tenantId: headerTenantId,
      outletId: req.headers['x-outlet-id'] || req.query.outletId || null
    };
    return next();
  }

  // 3. Izinkan rute publik dengan menyuntikkan Master Tenant Default
  if (publicPaths.includes(req.path) || req.path.startsWith('/uploads')) {
    req.userContext = {
      userId: 'guest-user',
      role: 'guest',
      tenantId: '00000000-0000-0000-0000-000000000000',
      outletId: null
    };
    return next();
  }

  // 4. DEVELOPMENT FALLBACK: Penyelamat saat pengembangan lokal tanpa token
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ [Identity] No token found. Injecting Master Context...');
    req.userContext = { 
      userId: '00000000-0000-0000-0000-000000000000',
      role: 'superadmin', 
      tenantId: '00000000-0000-0000-0000-000000000000',
      outletId: null
    };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
};

module.exports = authMiddleware;
