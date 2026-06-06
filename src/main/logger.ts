import winston from 'winston'
import path from 'path'

// Get log directory — safe to call even before app.whenReady()
function getLogDir(): string {
  try {
    const { app } = require('electron')
    if (app && app.getPath) {
      return app.getPath('userData')
    }
  } catch {}
  return '.'
}

const logDir = getLogDir()

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message }) => `${level}: ${message}`)
      )
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'voxscribe-error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'voxscribe.log')
    })
  ]
})
