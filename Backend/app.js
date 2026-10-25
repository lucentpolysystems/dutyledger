import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { prisma } from './config/db.js';

import authRoutes from './modules/auth/authRoutes.js';
import userRoutes from './modules/user/userRoutes.js';
import attendanceRoutes from './modules/attendanceCopy/attendance.routes.js';
import payrollroutes from './modules/payroll/payrollroutes.js';
import calendar from './modules/calendar/holidayRoutes.js';
import mailroutes from './modules/mail/mailroutes.js';
import cloudinaryroutes from './modules/cloudinary/cloudinaryroutes.js';
import contectHRRoutes from './modules/contactwithHR/contectHRRoutes.js';
import announcementRoutes from './modules/announcements/announcements.routes.js';
import rbacRoutes from './modules/rbac/rbacRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
  console.log(`[📥 ${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint (for Docker and monitoring)
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
        type: 'PostgreSQL (Prisma)',
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
app.use('/api', cloudinaryroutes);
app.use('/api/contact-hr', contectHRRoutes);
app.use('/api', announcementRoutes);
app.use('/api/rbac', rbacRoutes);

export default app;
export { app };
