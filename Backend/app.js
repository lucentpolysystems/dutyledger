const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { prisma } = require('./config/db');

const authRoutes = require('./modules/auth/authRoutes');
const userRoutes = require('./modules/user/userRoutes');
const attendanceRoutes = require("./modules/attendanceCopy/attendance.routes");
const payrollroutes = require('./modules/payroll/payrollroutes');
const calendar = require('./modules/calendar/holidayRoutes');
const mailroutes = require('./modules/mail/mailroutes');
const cloudinaryroutes = require('./modules/cloudinary/cloudinaryroutes');
const contectHRRoutes = require('./modules/contactwithHR/contectHRRoutes');
const announcementRoutes = require('./modules/announcements/announcements.routes');
const rbacRoutes = require('./modules/rbac/rbacRoutes');

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

module.exports = app;
