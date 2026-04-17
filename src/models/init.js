const { pool } = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255),
        username VARCHAR(255),
        phone VARCHAR(20),
        bonus DECIMAL(12,2) DEFAULT 0,
        referral_code VARCHAR(20) UNIQUE,
        referred_by VARCHAR(20),
        is_blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(10) DEFAULT '📦',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12,2) NOT NULL,
        rating DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        image VARCHAR(500),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        stock INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Cart table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        total_price DECIMAL(12,2) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','delivering','delivered','cancelled')),
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Order Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    // Reviews (Fikrlar) table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT,
        image VARCHAR(500),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Jadvallar muvaffaqiyatli yaratildi');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Jadvallar yaratishda xatolik:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { createTables };
