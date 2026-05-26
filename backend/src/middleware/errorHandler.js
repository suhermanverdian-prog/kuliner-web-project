const AppError = require('../utils/AppError');
const logger = require('../utils/logger'); // Winston logger

// Development error response (includes stack)
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error response (sanitised, detailed logging)
const sendErrorProd = (err, res) => {
  // Log detailed error for debugging
  logger.error('Unhandled error', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    code: err.code,
    requestId: err.requestId,
    tenantId: err.tenantId,
    path: err.path,
  });

  // If the error is operational, send the message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or unknown error: do not leak details
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan sistem internal.',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // Attach request context for logging
  err.requestId = req.id || null;
  err.path = req.originalUrl;
  err.tenantId = (req.userContext && req.userContext.tenantId) || null;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};
