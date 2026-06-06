// src/middleware/roleGuard.js
module.exports = function roleGuard(requiredRole) {
  return (req, res, next) => {
    try {
      const userRole = (req.userContext && req.userContext.role) || '';
      if (!userRole) {
        const err = new Error('Akses Ditolak: Role tidak ditemukan.');
        err.status = 401;
        return next(err);
      }
      
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const lowerUserRole = userRole.toLowerCase();
      
      // Auto bypass for superadmin and owner for admin routes
      if (lowerUserRole === 'superadmin' || lowerUserRole === 'owner') {
        return next();
      }
      
      const match = roles.some(r => r.toLowerCase() === lowerUserRole);
      if (!match) {
        const err = new Error('Akses Ditolak: Hak akses tidak cukup.');
        err.status = 403;
        return next(err);
      }
      next();
    } catch (e) {
      next(e);
    }
  };
};
