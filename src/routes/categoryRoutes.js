const router = require('express').Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Protected routes (Admin only)
router.post('/', authenticate, createCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

module.exports = router;
