const productModel = require('../models/productModel');
const path = require('path');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Mahsulotlar boshqaruvi
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Barcha mahsulotlarni olish
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
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
 *         description: Mahsulotlar ro'yxati
 */
const getProducts = async (req, res) => {
  try {
    const { category_id, search, limit = 20, offset = 0 } = req.query;
    const products = await productModel.findAll({
      category_id: category_id ? parseInt(category_id) : null,
      search,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    const total = await productModel.count(category_id ? parseInt(category_id) : null);
    res.json({ success: true, data: products, total, count: products.length });
  } catch (error) {
    console.error('getProducts xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Mahsulot ID orqali olish
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mahsulot
 *       404:
 *         description: Topilmadi
 */
const getProductById = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Yangi mahsulot yaratish
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category_id:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Mahsulot yaratildi
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, stock } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Nom va narx kerak' });
    }

    let image = null;
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    }

    const product = await productModel.create({
      name,
      description,
      price: parseFloat(price),
      category_id: category_id ? parseInt(category_id) : null,
      stock: stock ? parseInt(stock) : 0,
      image,
    });

    res.status(201).json({ success: true, message: 'Mahsulot yaratildi', data: product });
  } catch (error) {
    console.error('createProduct xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Mahsulotni yangilash
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Yangilandi
 */
const updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/uploads/products/${req.file.filename}`;
    }
    if (data.price) data.price = parseFloat(data.price);
    if (data.stock) data.stock = parseInt(data.stock);
    if (data.category_id) data.category_id = parseInt(data.category_id);

    const product = await productModel.update(req.params.id, data);
    if (!product) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: 'Mahsulot yangilandi', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Mahsulotni o'chirish (soft delete)
 *     tags: [Products]
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
const deleteProduct = async (req, res) => {
  try {
    const product = await productModel.delete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: 'Mahsulot o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

/**
 * @swagger
 * /api/products/{id}/rate:
 *   post:
 *     summary: Mahsulotga reyting berish
 *     tags: [Products]
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
 *             required: [user_id, rating]
 *             properties:
 *               user_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Reyting saqlandi
 */
const rateProduct = async (req, res) => {
  try {
    const { user_id, rating } = req.body;
    const product_id = parseInt(req.params.id);

    if (!user_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'user_id va 1-5 oraliqda rating kerak' });
    }

    const { pool } = require('../config/database');
    await pool.query(
      `INSERT INTO ratings (user_id, product_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET rating = $3`,
      [user_id, product_id, rating]
    );

    await productModel.updateRating(product_id);
    const product = await productModel.findById(product_id);

    res.json({ success: true, message: 'Reyting saqlandi', data: { rating: product.rating } });
  } catch (error) {
    console.error('rateProduct xatolik:', error);
    res.status(500).json({ success: false, message: 'Server xatolik' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, rateProduct };
