const { pool } = require('../config/database');

class CartModel {
  async getByUserId(user_id) {
    const { rows } = await pool.query(
      `SELECT c.*, p.name as product_name, p.price as product_price, p.image as product_image, p.stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [user_id]
    );
    return rows;
  }

  async addItem(user_id, product_id, quantity = 1) {
    const { rows } = await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart.quantity + $3
       RETURNING *`,
      [user_id, product_id, quantity]
    );
    return rows[0];
  }

  async updateQuantity(user_id, product_id, quantity) {
    if (quantity <= 0) {
      return this.removeItem(user_id, product_id);
    }
    const { rows } = await pool.query(
      'UPDATE cart SET quantity = $3 WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [user_id, product_id, quantity]
    );
    return rows[0];
  }

  async removeItem(user_id, product_id) {
    const { rows } = await pool.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [user_id, product_id]
    );
    return rows[0];
  }

  async clearCart(user_id) {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [user_id]);
  }

  async getTotal(user_id) {
    const { rows } = await pool.query(
      `SELECT SUM(c.quantity * p.price) as total, COUNT(c.id) as items
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [user_id]
    );
    return rows[0];
  }
}

module.exports = new CartModel();
