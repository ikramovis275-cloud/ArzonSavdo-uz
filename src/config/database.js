const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'arzon_savdo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL ga ulandi');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL xatolik:', err);
  process.exit(-1);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`✅ PostgreSQL ulandi: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL ulanmadi:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
