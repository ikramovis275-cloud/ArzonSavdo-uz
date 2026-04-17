const categoryModel = require('../models/categoryModel');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Kategoriyalar boshqaruvi
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Barcha kategoriyalarni olish
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: Kategoriyalar ro'yxati
 */
const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    res.json({ success: true, data: categories, count: categories.length });
  } catch (error) {
    console.error('getCategories xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Kategoriya ID orqali olish
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Kategoriya
 *       404:
 *         description: Topilmadi
 */
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Kategoriya topilmadi' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Yangi kategoriya yaratish
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kategoriya yaratildi
 */
const createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nom kerak' });
    const category = await categoryModel.create({ name, icon });
    res.status(201).json({ success: true, message: 'Kategoriya yaratildi', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Kategoriyani yangilash
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Yangilandi
 */
const updateCategory = async (req, res) => {
  try {
    const category = await categoryModel.update(req.params.id, req.body);
    if (!category) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: 'Kategoriya yangilandi', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Kategoriyani o'chirish
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: O'chirildi
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await categoryModel.delete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: 'Kategoriya o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
