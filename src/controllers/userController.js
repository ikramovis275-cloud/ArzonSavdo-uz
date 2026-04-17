const userModel = require('../models/userModel');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Foydalanuvchilar boshqaruvi
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Barcha userlarni olish
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: Userlar ro'yxati
 */
const getUsers = async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    const users = await userModel.findAll({ search, limit: parseInt(limit), offset: parseInt(offset) });
    const total = await userModel.count();
    res.json({ success: true, data: users, total, count: users.length });
  } catch (error) {
    console.error('getUsers xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: User ID orqali olish
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User ma'lumotlari
 *       404:
 *         description: Topilmadi
 */
const getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User topilmadi' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/users/telegram/{telegram_id}:
 *   get:
 *     summary: Telegram ID orqali user olish
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: telegram_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User
 *       404:
 *         description: Topilmadi
 */
const getUserByTelegramId = async (req, res) => {
  try {
    const user = await userModel.findByTelegramId(req.params.telegram_id);
    if (!user) return res.status(404).json({ success: false, message: 'User topilmadi' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Bot orqali user registratsiya qilish
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [telegram_id]
 *             properties:
 *               telegram_id:
 *                 type: string
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               referral_code:
 *                 type: string
 *                 description: Taklif qilgan kod
 *     responses:
 *       200:
 *         description: User mavjud yoki yangi yaratildi
 */
const registerUser = async (req, res) => {
  try {
    const { telegram_id, name, username, referral_code: referred_by_code } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ success: false, message: 'telegram_id kerak' });
    }

    let user = await userModel.findByTelegramId(telegram_id);
    if (user) {
      return res.json({ success: true, message: 'User mavjud', data: user, isNew: false });
    }

    // Unikal referral code yaratish
    const { v4: uuidv4 } = require('uuid');
    const referral_code = telegram_id.toString().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();

    user = await userModel.create({
      telegram_id,
      name,
      username,
      referral_code,
      referred_by: referred_by_code || null,
    });

    // Taklif qilgan odamga 3000 bonus qo'shish
    if (referred_by_code) {
        const referrer = await userModel.findByReferralCode(referred_by_code);
        if (referrer) {
            await userModel.addBonus(referrer.id, 3000);
            console.log(`🎁 Referrer ${referrer.username} ga 3000 bonus berildi`);
        }
    }

    res.status(201).json({ success: true, message: 'User yaratildi', data: user, isNew: true });
  } catch (error) {
    console.error('registerUser xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/users/{id}/block:
 *   put:
 *     summary: Userni blok/unblock qilish
 *     tags: [Users]
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
 *             required: [is_blocked]
 *             properties:
 *               is_blocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Yangilandi
 */
const blockUser = async (req, res) => {
  try {
    const { is_blocked } = req.body;
    const user = await userModel.blockUser(req.params.id, is_blocked);
    if (!user) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: is_blocked ? 'User bloklandi' : 'User unbloklandi', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/users/{id}/bonus:
 *   post:
 *     summary: Userlarga bonus qo'shish
 *     tags: [Users]
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
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Bonus qo'shildi
 */
const addBonus = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Musbat miqdor kerak' });
    }
    const user = await userModel.addBonus(req.params.id, amount);
    if (!user) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: 'Bonus qo\'shildi', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

module.exports = { getUsers, getUserById, getUserByTelegramId, registerUser, blockUser, addBonus };
