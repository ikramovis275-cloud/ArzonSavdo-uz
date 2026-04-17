const router = require('express').Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');

router.get('/:user_id', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove', removeFromCart);
router.delete('/:user_id/clear', clearCart);

module.exports = router;
