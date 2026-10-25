import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import app from './app.js';
import { connectToDB, disconnectDB } from './config/db.js';
import { validateEnv } from './config/envValidator.js';

// 1. Validate environment configuration
validateEnv();

const PORT = process.env.PORT || 4500;
let server;

// 2. Start server after database connection is verified
connectToDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
      console.log(`🩺 Health check accessible at http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
    process.exit(1);
  });

// 3. Graceful Process Termination (Zero-downtime rolling deploys)
const handleGracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log("🔒 HTTP server closed to new requests.");
      await disconnectDB();
      console.log("✅ Graceful shutdown completed cleanly.");
      process.exit(0);
    });

    // Force exit if connections take too long to close
    setTimeout(() => {
      console.error("⚠️ Forced shutdown due to timeout.");
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
