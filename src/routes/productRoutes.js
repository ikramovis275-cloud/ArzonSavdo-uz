const router = require('express').Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  rateProduct,
} = require('../controllers/productController');
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/:id/rate', rateProduct);

// Protected routes (Admin only)
router.post('/', authenticate, upload.single('image'), createProduct);
router.put('/:id', authenticate, upload.single('image'), updateProduct);
router.delete('/:id', authenticate, deleteProduct);

module.exports = router;
