const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel');
const { sendStatusNotification } = require('../bot');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Buyurtmalar boshqaruvi
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Barcha buyurtmalarni olish
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, delivering, delivered, cancelled]
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Buyurtmalar ro'yxati
 */
const getOrders = async (req, res) => {
  try {
    const { status, user_id, limit = 20, offset = 0 } = req.query;
    const orders = await orderModel.findAll({
      status,
      user_id: user_id ? parseInt(user_id) : null,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    const total = await orderModel.count(status);
    res.json({ success: true, data: orders, total, count: orders.length });
  } catch (error) {
    console.error('getOrders xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Buyurtma ID orqali olish
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Buyurtma ma'lumotlari bilan order items
 *       404:
 *         description: Topilmadi
 */
const getOrderById = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Yangi buyurtma yaratish
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, address, phone]
 *             properties:
 *               user_id:
 *                 type: integer
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Buyurtma yaratildi
 */
const createOrder = async (req, res) => {
  try {
    const { user_id, address, phone, items } = req.body;

    if (!user_id || !address || !phone || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'user_id, address, phone va items kerak' });
    }

    let total_price = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Bonusni ayirib tashlash
    const user = await userModel.findById(user_id);
    if (user && user.bonus > 0) {
        total_price = Math.max(0, total_price - user.bonus);
    }

    const order = await orderModel.create({ user_id, total_price, address, phone, items });

    // Savatni tozalash
    await cartModel.clearCart(user_id);

    // Referral bonusini tekshirish - birinchi buyurtmada
    if (user && user.referred_by) {
      const referrer = await userModel.findByReferralCode(user.referred_by);
      if (referrer) {
        const bonus = total_price * 0.05; // 5% bonus
        await userModel.addBonus(referrer.id, bonus);
      }
    }

    res.status(201).json({ success: true, message: 'Buyurtma yaratildi', data: order });
  } catch (error) {
    console.error('createOrder xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Buyurtma statusini yangilash
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, delivering, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Status yangilandi
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'];

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri status' });
    }

    const order = await orderModel.updateStatus(req.params.id, status);
    if (!order) return res.status(404).json({ success: false, message: 'Topilmadi' });

    // Bot orqali xabar yuborish
    const fullOrder = await orderModel.findById(req.params.id);
    if (fullOrder && fullOrder.user_telegram_id) {
        await sendStatusNotification(fullOrder.user_telegram_id, status, req.params.id);
    }

    res.json({ success: true, message: 'Status yangilandi', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

module.exports = { getOrders, getOrderById, createOrder, updateOrderStatus };
