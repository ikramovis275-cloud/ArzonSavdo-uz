const router = require('express').Router();
const {
  getUsers,
  getUserById,
  getUserByTelegramId,
  registerUser,
  blockUser,
  addBonus,
} = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { pool } = require('../config/database');

// Bot routes (no auth, bot uses internal token)
router.post('/register', registerUser);
router.get('/telegram/:telegram_id', getUserByTelegramId);

// Admin routes
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id/block', authenticate, blockUser);
router.post('/:id/bonus', authenticate, addBonus);
router.put('/:id/bonus/reset', (req, res, next) => {
    // Public reset for bot, or we can use auth
    next();
}, async (req, res) => {
    try {
        await pool.query('UPDATE users SET bonus = 0 WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Bonus reset' });
    } catch (e) { res.status(500).json({ success: false }); }
});

module.exports = router;
