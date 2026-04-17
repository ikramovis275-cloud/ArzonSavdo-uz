const { pool } = require('../config/database');

class OrderModel {
  async findAll({ limit = 20, offset = 0, status = null, user_id = null } = {}) {
    let query = `
      SELECT o.*, u.name as user_name, u.username as user_username, u.telegram_id
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (status) {
      query += ` AND o.status = $${idx++}`;
      params.push(status);
    }
    if (user_id) {
      query += ` AND o.user_id = $${idx++}`;
      params.push(user_id);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT o.*, u.name as user_name, u.username as user_username, u.telegram_id
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    if (!rows[0]) return null;

    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name as product_name, p.image as product_image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    return { ...rows[0], items };
  }

  async create({ user_id, total_price, address, phone, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        'INSERT INTO orders (user_id, total_price, address, phone) VALUES ($1, $2, $3, $4) RETURNING *',
        [user_id, total_price, address, phone]
      );
      const order = rows[0];

      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [order.id, item.product_id, item.quantity, item.price]
        );
        // Stock kamaytirish
        await client.query(
          'UPDATE products SET stock = stock - $2 WHERE id = $1',
          [item.product_id, item.quantity]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(id, status) {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, status]
    );
    return rows[0];
  }

  async count(status = null) {
    const query = status
      ? 'SELECT COUNT(*) FROM orders WHERE status = $1'
      : 'SELECT COUNT(*) FROM orders';
    const { rows } = await pool.query(query, status ? [status] : []);
    return parseInt(rows[0].count);
  }

  async getDailyRevenue() {
    const { rows } = await pool.query(
      `SELECT DATE(created_at) as date, SUM(total_price) as revenue, COUNT(*) as orders
       FROM orders
       WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );
    return rows;
  }

  async getMonthlyRevenue() {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(created_at, 'YYYY-MM') as month, SUM(total_price) as revenue, COUNT(*) as orders
       FROM orders
       WHERE status != 'cancelled'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`
    );
    return rows;
  }

  async getTodayRevenue() {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as revenue, COUNT(*) as orders
       FROM orders
       WHERE status != 'cancelled' AND DATE(created_at) = CURRENT_DATE`
    );
    return rows[0];
  }
}

module.exports = new OrderModel();
