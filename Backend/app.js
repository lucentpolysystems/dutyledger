import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './config/db.js';

import authRoutes from './modules/auth/authRoutes.js';
import userRoutes from './modules/user/userRoutes.js';
import attendanceRoutes from './modules/attendanceCopy/attendance.routes.js';
import payrollroutes from './modules/payroll/payrollroutes.js';
import calendar from './modules/calendar/holidayRoutes.js';
import mailroutes from './modules/mail/mailroutes.js';
import contectHRRoutes from './modules/contactwithHR/contectHRRoutes.js';
import announcementRoutes from './modules/announcements/announcements.routes.js';
import rbacRoutes from './modules/rbac/rbacRoutes.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Managed by Nginx in production
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3100',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Dev-friendly fallback
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per IP
  message: { message: "Too many authentication attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/change-password', authLimiter);

// Request logger in dev/staging
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[📥 ${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint (for Docker, load balancers, and monitoring)
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: 'connected',
        type: 'PostgreSQL 16 (Prisma)',
        latencyMs,
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message,
      },
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

// Mount API routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', payrollroutes);
app.use('/api', calendar);
app.use('/api', mailroutes);
app.use('/api/contact-hr', contectHRRoutes);
app.use('/api', announcementRoutes);
app.use('/api/rbac', rbacRoutes);

// Catch-all 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// Centralized Error Handler (Never leak stack traces in production)
app.use((err, req, res, next) => {
  console.error("Unhandled Application Error:", err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

export default app;
export { app };
