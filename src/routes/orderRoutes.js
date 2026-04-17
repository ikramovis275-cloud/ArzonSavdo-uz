const router = require('express').Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth');

// Bot routes (no auth, secured by telegram_id check in bot)
router.post('/', createOrder);

// Admin & Bot routes
router.get('/', getOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/status', authenticate, updateOrderStatus);

module.exports = router;
