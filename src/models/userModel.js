const { pool } = require('../config/database');

class UserModel {
  // Barcha userlarni olish
  async findAll({ limit = 50, offset = 0, search = '' } = {}) {
    const query = search
      ? `SELECT * FROM users WHERE name ILIKE $1 OR username ILIKE $1 OR phone ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
      : `SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    const params = search ? [`%${search}%`, limit, offset] : [limit, offset];
    const { rows } = await pool.query(query, params);
    return rows;
  }

  // ID orqali topish
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  }

  // Telegram ID orqali topish
  async findByTelegramId(telegram_id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
    return rows[0];
  }

  // Referral code orqali topish
  async findByReferralCode(referral_code) {
    const { rows } = await pool.query('SELECT * FROM users WHERE referral_code = $1', [referral_code]);
    return rows[0];
  }

  // Yangi user yaratish
  async create({ telegram_id, name, username, referral_code, referred_by = null }) {
    const { rows } = await pool.query(
      `INSERT INTO users (telegram_id, name, username, referral_code, referred_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [telegram_id, name, username, referral_code, referred_by]
    );
    return rows[0];
  }

  // User yangilash
  async update(id, data) {
    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0];
  }

  // Bonus qo'shish
  async addBonus(id, amount) {
    const { rows } = await pool.query(
      'UPDATE users SET bonus = bonus + $2 WHERE id = $1 RETURNING *',
      [id, amount]
    );
    return rows[0];
  }

  // Blok qilish
  async blockUser(id, is_blocked) {
    const { rows } = await pool.query(
      'UPDATE users SET is_blocked = $2 WHERE id = $1 RETURNING *',
      [id, is_blocked]
    );
    return rows[0];
  }

  // Telefon yangilash
  async updatePhone(id, phone) {
    const { rows } = await pool.query(
      'UPDATE users SET phone = $2 WHERE id = $1 RETURNING *',
      [id, phone]
    );
    return rows[0];
  }

  // Jami userlar soni
  async count() {
    const { rows } = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(rows[0].count);
  }

  // Barcha telegram IDlar (reklama uchun)
  async getAllTelegramIds() {
    const { rows } = await pool.query(
      'SELECT telegram_id FROM users WHERE is_blocked = false'
    );
    return rows.map(r => r.telegram_id);
  }
}

module.exports = new UserModel();
