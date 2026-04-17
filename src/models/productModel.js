const { pool } = require('../config/database');

class ProductModel {
  async findAll({ limit = 20, offset = 0, category_id = null, search = '' } = {}) {
    let query = `
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    const params = [];
    let paramIdx = 1;

    if (category_id) {
      query += ` AND p.category_id = $${paramIdx++}`;
      params.push(category_id);
    }
    if (search) {
      query += ` AND (p.name ILIKE $${paramIdx++} OR p.description ILIKE $${paramIdx - 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT p.*, c.name as category_name, c.icon as category_icon
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );
    return rows[0];
  }

  async create({ name, description, price, category_id, stock, image }) {
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, category_id, stock, image)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, price, category_id, stock, image]
    );
    return rows[0];
  }

  async update(id, data) {
    const allowedFields = ['name', 'description', 'price', 'category_id', 'stock', 'image', 'is_active'];
    const updates = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    updates.updated_at = 'NOW()';

    const fields = Object.keys(updates)
      .filter(k => k !== 'updated_at')
      .map((k, i) => `${k} = $${i + 2}`)
      .join(', ');
    const values = Object.keys(updates)
      .filter(k => k !== 'updated_at')
      .map(k => updates[k]);

    const { rows } = await pool.query(
      `UPDATE products SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0];
  }

  async delete(id) {
    const { rows } = await pool.query(
      'UPDATE products SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  }

  async updateRating(product_id) {
    const { rows } = await pool.query(
      `SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as count
       FROM ratings WHERE product_id = $1`,
      [product_id]
    );
    const { avg_rating, count } = rows[0];
    await pool.query(
      'UPDATE products SET rating = $2, rating_count = $3 WHERE id = $1',
      [product_id, avg_rating || 0, count]
    );
  }

  async count(category_id = null) {
    const query = category_id
      ? 'SELECT COUNT(*) FROM products WHERE is_active = true AND category_id = $1'
      : 'SELECT COUNT(*) FROM products WHERE is_active = true';
    const params = category_id ? [category_id] : [];
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
  }

  async getTopSelling(limit = 5) {
    const { rows } = await pool.query(
      `SELECT p.*, SUM(oi.quantity) as total_sold
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }
}

module.exports = new ProductModel();
