const app = require('./app');
const { connectToDB } = require('./config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'auth.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const PORT = process.env.PORT || 4500;

connectToDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
      console.log(`🩺 Health check accessible at http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
  });
