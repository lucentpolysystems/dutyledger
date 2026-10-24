const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../auth.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

// Ensure DATABASE_URL is set or constructed from components
if (!process.env.DATABASE_URL) {
  const user = process.env.POSTGRES_USER || 'postgres';
  const pass = process.env.POSTGRES_PASSWORD || 'postgres';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const dbName = process.env.POSTGRES_DB || 'dutyledger_db';
  process.env.DATABASE_URL = `postgresql://${user}:${pass}@${host}:${port}/${dbName}?schema=public`;
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const connectToDB = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ PostgreSQL connected successfully via Prisma");
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
    throw err;
  }
};

// Compatibility adapter for existing controller calls using getDB().collection(...)
const createCollectionAdapter = (collectionName) => {
  const norm = (collectionName || '').toLowerCase();

  return {
    findOne: async (query = {}, options = {}) => {
      if (norm === 'users') {
        const where = {};
        if (query.user_id) where.userId = String(query.user_id);
        else if (query.id) where.userId = String(query.id);
        else if (query.username) where.username = String(query.username);
        else if (query.email) where.email = String(query.email);
        else if (query._id) where.id = String(query._id);

        if (query.$or && Array.isArray(query.$or)) {
          return await prisma.user.findFirst({
            where: {
              OR: query.$or.map(cond => {
                const c = {};
                if (cond.user_id) c.userId = String(cond.user_id);
                if (cond.username) c.username = String(cond.username);
                if (cond.email) c.email = String(cond.email);
                if (cond._id) c.id = String(cond._id);
                return c;
              })
            }
          });
        }
        return await prisma.user.findFirst({ where });
      }

      if (norm === 'attendance') {
        const where = {};
        if (query.user_id) where.userId = String(query.user_id);
        if (query.date) where.date = String(query.date);
        return await prisma.attendance.findFirst({ where });
      }

      if (norm === 'salaryinfo') {
        const where = {};
        if (query.employee_id) where.employeeId = String(query.employee_id);
        return await prisma.salaryInfo.findFirst({ where });
      }

      if (norm === 'holidays') {
        return await prisma.holiday.findFirst({ where: query });
      }

      if (norm === 'announcements') {
        return await prisma.announcement.findFirst({ where: query });
      }

      if (norm === 'hrrequests' || norm === 'contact_hr') {
        return await prisma.contactHR.findFirst({ where: query });
      }

      if (norm === 'roles') {
        const where = {};
        if (query.role_id) where.roleId = String(query.role_id);
        return await prisma.role.findFirst({ where });
      }

      return null;
    },

    find: (query = {}) => {
      let sortConfig = { createdAt: 'desc' };
      return {
        sort: function (s) {
          sortConfig = s;
          return this;
        },
        project: function () {
          return this;
        },
        toArray: async function () {
          if (norm === 'users') {
            const where = {};
            if (query.department) where.department = query.department;
            if (query.reporting_to) where.reportingTo = query.reporting_to;
            return await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
          }
          if (norm === 'attendance') {
            const where = {};
            if (query.user_id) where.userId = String(query.user_id);
            if (query.date) where.date = String(query.date);
            return await prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
          }
          if (norm === 'holidays') {
            return await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
          }
          if (norm === 'announcements') {
            return await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
          }
          if (norm === 'hrrequests' || norm === 'contact_hr') {
            return await prisma.contactHR.findMany({ orderBy: { createdAt: 'desc' } });
          }
          if (norm === 'roles') {
            return await prisma.role.findMany({ orderBy: { createdAt: 'asc' } });
          }
          return [];
        }
      };
    },

    insertOne: async (doc) => {
      if (norm === 'users') {
        const created = await prisma.user.create({
          data: {
            userId: doc.user_id || doc.userId,
            username: doc.username,
            email: doc.email,
            password: doc.password,
            role: doc.role || 'Employee',
            roles: doc.roles || ['ROLE_EMPLOYEE'],
            department: doc.department || 'General',
            designation: doc.designation || 'Staff',
            joiningDate: doc.joigningDate || doc.joiningDate,
            gender: doc.gender,
            address: doc.address,
            bankAccount: doc.bankAccount,
            ifsc: doc.IFSC || doc.ifsc,
            mobile: doc.mobile,
            salary: Number(doc.salary) || 0,
            employmentType: doc.employmentType || 'Full-time',
            attendanceType: doc.attendanceType || 'Office',
            emergencyContact: doc.emergencyContact,
            emergencyContactName: doc.emergencyContactname || doc.emergencyContactName,
            passwordSetToken: doc.passwordSetToken,
            tokenExpiry: doc.tokenExpiry,
          }
        });
        return { insertedId: created.id };
      }

      if (norm === 'attendance') {
        const created = await prisma.attendance.create({
          data: {
            userId: doc.user_id || doc.userId,
            date: doc.date,
            inTime: doc.in_time || doc.inTime,
            outTime: doc.out_time || doc.outTime,
            totalHours: doc.total_hours || doc.totalHours,
            workDuration: doc.work_duration || doc.workDuration,
            status: doc.status || 'Present',
            location: doc.location,
            punchType: doc.punchType,
            time: doc.time ? new Date(doc.time) : new Date(),
          }
        });
        return { insertedId: created.id };
      }

      if (norm === 'holidays') {
        const created = await prisma.holiday.create({
          data: { date: doc.date, reason: doc.reason }
        });
        return { insertedId: created.id };
      }

      if (norm === 'announcements') {
        const created = await prisma.announcement.create({
          data: {
            title: doc.title,
            description: doc.description,
            startDate: doc.startDate,
            endDate: doc.endDate,
            createdBy: doc.createdBy || 'HR',
          }
        });
        return { insertedId: created.id };
      }

      if (norm === 'hrrequests' || norm === 'contact_hr') {
        const created = await prisma.contactHR.create({
          data: {
            employeeId: doc.employeeId,
            employeeName: doc.employeeName,
            subject: doc.subject,
            category: doc.category || 'General Inquiry',
            priority: doc.priority || 'Normal',
            message: doc.message,
            attachment: doc.attachment,
            status: doc.status || 'Pending',
          }
        });
        return { insertedId: created.id };
      }

      if (norm === 'roles') {
        const created = await prisma.role.create({
          data: {
            roleId: doc.role_id,
            name: doc.name,
            description: doc.description || '',
            isSystemRole: Boolean(doc.is_system_role),
            inheritsFrom: doc.inherits_from || [],
            permissions: doc.permissions || [],
          }
        });
        return { insertedId: created.id };
      }

      if (norm === 'audit_events' || norm === 'audit_logs') {
        const created = await prisma.auditEvent.create({
          data: {
            actorId: doc.actor_id,
            actorName: doc.actor_name,
            action: doc.action,
            resource: doc.resource,
            targetId: doc.target_id,
            details: doc.details || {},
            ip: doc.ip,
          }
        });
        return { insertedId: created.id };
      }

      return { insertedId: 'unknown' };
    },

    updateOne: async (filter, update) => {
      const data = update.$set || update;

      if (norm === 'users') {
        const targetUserId = filter.user_id || filter.userId;
        const updateData = {};
        if (data.username !== undefined) updateData.username = data.username;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.mobile !== undefined) updateData.mobile = data.mobile;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount;
        if (data.gender !== undefined) updateData.gender = data.gender;
        if (data.IFSC !== undefined) updateData.ifsc = data.IFSC;
        if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
        if (data.emergencyContactname !== undefined) updateData.emergencyContactName = data.emergencyContactname;
        if (data.password !== undefined) updateData.password = data.password;
        if (data.passwordSetToken !== undefined) updateData.passwordSetToken = data.passwordSetToken;
        if (data.tokenExpiry !== undefined) updateData.tokenExpiry = data.tokenExpiry;
        if (data.cached_permissions !== undefined) updateData.cachedPermissions = data.cached_permissions;

        if (targetUserId) {
          const res = await prisma.user.updateMany({
            where: { userId: String(targetUserId) },
            data: updateData
          });
          return { modifiedCount: res.count };
        }
      }

      if (norm === 'attendance') {
        const userId = String(filter.user_id || filter.userId);
        const date = String(filter.date);
        await prisma.attendance.upsert({
          where: { userId_date: { userId, date } },
          create: {
            userId,
            date,
            inTime: data.in_time || data.inTime,
            outTime: data.out_time || data.outTime,
            totalHours: data.total_hours || data.totalHours,
            workDuration: data.work_duration || data.workDuration,
            status: data.status || 'Present',
            punchType: data.punchType,
            time: data.time ? new Date(data.time) : new Date(),
          },
          update: {
            outTime: data.out_time !== undefined ? data.out_time : undefined,
            totalHours: data.total_hours !== undefined ? data.total_hours : undefined,
            workDuration: data.work_duration !== undefined ? data.work_duration : undefined,
            status: data.status !== undefined ? data.status : undefined,
          }
        });
        return { modifiedCount: 1 };
      }

      if (norm === 'salaryinfo') {
        const empId = filter.employee_id || filter.employeeId;
        const setOnInsert = update.$setOnInsert || data;
        await prisma.salaryInfo.upsert({
          where: { employeeId: String(empId) },
          create: {
            employeeId: String(empId),
            employeeName: setOnInsert.employee_name || setOnInsert.employeeName || 'Employee',
            baseSalary: Number(setOnInsert.base_salary || setOnInsert.baseSalary) || 0,
            hra: Number(setOnInsert.hra) || 0,
            bonus: Number(setOnInsert.bonus) || 0,
            taxPercent: Number(setOnInsert.tax_percent || setOnInsert.taxPercent) || 10,
            pfPercent: Number(setOnInsert.pf_percent || setOnInsert.pfPercent) || 12,
            paidLeavesAllowed: Number(setOnInsert.paid_leaves_allowed || setOnInsert.paidLeavesAllowed) || 2,
            joiningDate: setOnInsert.joining_date || setOnInsert.joiningDate || '',
            updatedBy: setOnInsert.updated_by || 'System',
          },
          update: {
            baseSalary: data.base_salary ? Number(data.base_salary) : undefined,
            hra: data.hra ? Number(data.hra) : undefined,
            bonus: data.bonus ? Number(data.bonus) : undefined,
          }
        });
        return { modifiedCount: 1 };
      }

      return { modifiedCount: 0 };
    }
  };
};

const getDB = () => {
  return {
    collection: (name) => createCollectionAdapter(name),
  };
};

module.exports = {
  prisma,
  connectToDB,
  connectToMongoDB: connectToDB, // Backward compatibility with Servercopy.js
  getDB,
};
