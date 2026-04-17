const cartModel = require('../models/cartModel');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Savat boshqaruvi
 */

/**
 * @swagger
 * /api/cart/{user_id}:
 *   get:
 *     summary: Userni savatini olish
 *     tags: [Cart]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Savat elementlari
 */
const getCart = async (req, res) => {
  try {
    const items = await cartModel.getByUserId(req.params.user_id);
    const total = await cartModel.getTotal(req.params.user_id);
    res.json({ success: true, data: items, total: parseFloat(total.total || 0), itemCount: parseInt(total.items || 0) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Savatga mahsulot qo'shish
 *     tags: [Cart]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, product_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Savatga qo'shildi
 */
const addToCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity = 1 } = req.body;
    if (!user_id || !product_id) {
      return res.status(400).json({ success: false, message: 'user_id va product_id kerak' });
    }
    const item = await cartModel.addItem(user_id, product_id, quantity);
    res.json({ success: true, message: 'Savatga qo\'shildi', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Savat elementini yangilash
 *     tags: [Cart]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, product_id, quantity]
 *             properties:
 *               user_id:
 *                 type: integer
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Yangilandi
 */
const updateCartItem = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    const item = await cartModel.updateQuantity(user_id, product_id, quantity);
    res.json({ success: true, message: 'Savat yangilandi', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/cart/remove:
 *   delete:
 *     summary: Savatdan mahsulot o'chirish
 *     tags: [Cart]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, product_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               product_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: O'chirildi
 */
const removeFromCart = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    await cartModel.removeItem(user_id, product_id);
    res.json({ success: true, message: 'Savatdan o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/cart/{user_id}/clear:
 *   delete:
 *     summary: Savatni to'liq tozalash
 *     tags: [Cart]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Savat tozalandi
 */
const clearCart = async (req, res) => {
  try {
    await cartModel.clearCart(req.params.user_id);
    res.json({ success: true, message: 'Savat tozalandi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
