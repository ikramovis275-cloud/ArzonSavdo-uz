const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const { pool } = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Statistikalar
 */

/**
 * @swagger
 * /api/stats/dashboard:
 *   get:
 *     summary: Dashboard statistikasi
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Dashboard ma'lumotlari
 */
const getDashboard = async (req, res) => {
  try {
    const [today, totalUsers, totalOrders, pendingOrders, topProducts, daily] = await Promise.all([
      orderModel.getTodayRevenue(),
      userModel.count(),
      orderModel.count(),
      orderModel.count('pending'),
      productModel.getTopSelling(5),
      orderModel.getDailyRevenue(),
    ]);

    res.json({
      success: true,
      data: {
        today: {
          revenue: parseFloat(today.revenue),
          orders: parseInt(today.orders),
        },
        totals: {
          users: totalUsers,
          orders: totalOrders,
          pendingOrders,
        },
        topProducts,
        dailyRevenue: daily,
      },
    });
  } catch (error) {
    console.error('getDashboard xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/stats/revenue:
 *   get:
 *     summary: Daromad statistikasi
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, monthly]
 *         description: daily yoki monthly
 *     responses:
 *       200:
 *         description: Daromad ma'lumotlari
 */
const getRevenue = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    const data = period === 'monthly'
      ? await orderModel.getMonthlyRevenue()
      : await orderModel.getDailyRevenue();

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/stats/top-users:
 *   get:
 *     summary: Eng ko'p buyurtma bergan userlar
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Top userlar
 */
const getTopUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.username, u.telegram_id, u.bonus,
              COUNT(o.id) as order_count,
              COALESCE(SUM(o.total_price), 0) as total_spent
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
       GROUP BY u.id
       ORDER BY total_spent DESC
       LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/stats/broadcast:
 *   post:
 *     summary: Barcha userlarga xabar yuborish (Telegram uchun telegram_ids qaytaradi)
 *     tags: [Stats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Telegram IDlar ro'yxati
 */
const getBroadcastIds = async (req, res) => {
  try {
    const telegramIds = await userModel.getAllTelegramIds();
    res.json({ success: true, data: telegramIds, count: telegramIds.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

module.exports = { getDashboard, getRevenue, getTopUsers, getBroadcastIds };
