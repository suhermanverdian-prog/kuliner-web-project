// src/middleware/roleGuard.js
module.exports = function roleGuard(requiredRole) {
  return (req, res, next) => {
    try {
      const userRole = req.userContext && req.userContext.role;
      if (!userRole) {
        const err = new Error('Akses Ditolak: Role tidak ditemukan.');
        err.status = 401;
        return next(err);
      }
      if (userRole !== requiredRole) {
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
