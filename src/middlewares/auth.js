const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Avtorizatsiya token kerak' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query('SELECT id, username, role FROM admins WHERE id = $1', [decoded.id]);
    if (!rows[0]) {
      return res.status(401).json({ success: false, message: 'Admin topilmadi' });
    }

    req.admin = rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Noto\'g\'ri token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token muddati tugadi' });
    }
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

module.exports = { authenticate };
