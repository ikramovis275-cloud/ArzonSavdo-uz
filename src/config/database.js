const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL ga ulandi');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL xatolik:', err);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL muvaffaqiyatli ulandi (Pool connected)');
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL ulanishda xatolik:', error);
    console.log('Hozirgi DATABASE_URL mavjudmi:', !!process.env.DATABASE_URL);
    // Renderda server o'chib qolmasligi uchun exit qilmaymiz, qayta urinib ko'raveradi
  }
};

module.exports = { pool, connectDB };
