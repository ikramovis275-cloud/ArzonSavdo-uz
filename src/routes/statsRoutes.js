const router = require('express').Router();
const { getDashboard, getRevenue, getTopUsers, getBroadcastIds } = require('../controllers/statsController');
const { authenticate } = require('../middlewares/auth');

router.get('/dashboard', authenticate, getDashboard);
router.get('/revenue', authenticate, getRevenue);
router.get('/top-users', authenticate, getTopUsers);
router.post('/broadcast', authenticate, getBroadcastIds);

module.exports = router;
