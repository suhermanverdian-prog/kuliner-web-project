const { createLogger, format, transports } = require('winston');

const activeTransports = [];

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  activeTransports.push(new transports.Console({ format: format.simple() }));
} else {
  activeTransports.push(new transports.Console({ format: format.simple() }));
  try {
    activeTransports.push(new transports.File({ filename: 'logs/error.log', level: 'error' }));
    activeTransports.push(new transports.File({ filename: 'logs/combined.log' }));
  } catch (e) {
    console.error("Failed to initialize file logger", e);
  }
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: activeTransports
});

module.exports = logger;

