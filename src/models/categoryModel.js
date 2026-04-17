const { pool } = require('../config/database');

class CategoryModel {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return rows[0];
  }

  async create({ name, icon = '📦' }) {
    const { rows } = await pool.query(
      'INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING *',
      [name, icon]
    );
    return rows[0];
  }

  async update(id, { name, icon }) {
    const { rows } = await pool.query(
      'UPDATE categories SET name = COALESCE($2, name), icon = COALESCE($3, icon) WHERE id = $1 RETURNING *',
      [id, name, icon]
    );
    return rows[0];
  }

  async delete(id) {
    const { rows } = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }

  async count() {
    const { rows } = await pool.query('SELECT COUNT(*) FROM categories');
    return parseInt(rows[0].count);
  }
}

module.exports = new CategoryModel();
