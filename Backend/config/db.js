import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

// Ensure DATABASE_URL is set or constructed from components
if (!process.env.DATABASE_URL) {
  const user = process.env.POSTGRES_USER || 'postgres';
  const pass = process.env.POSTGRES_PASSWORD || 'root';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const dbName = process.env.POSTGRES_DB || 'dutyledger_db';
  process.env.DATABASE_URL = `postgresql://${user}:${pass}@${host}:${port}/${dbName}?schema=public`;
}

// Production-ready singleton PrismaClient
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

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log("🔌 PostgreSQL disconnected cleanly via Prisma");
  } catch (err) {
    console.error("Error during Prisma disconnect:", err.message);
  }
};

export {
  prisma,
  connectToDB,
  disconnectDB,
};

export default prisma;
