const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login muvaffaqiyatli
 *       401:
 *         description: Noto'g'ri ma'lumotlar
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username va password kerak' });
    }

    const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Noto\'g\'ri username yoki password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Noto\'g\'ri username yoki password' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login muvaffaqiyatli',
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (error) {
    console.error('Login xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Token egasini olish
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin ma'lumotlari
 *       401:
 *         description: Unauthorized
 */
const getMe = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, role, created_at FROM admins WHERE id = $1',
      [req.admin.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

module.exports = { login, getMe };
