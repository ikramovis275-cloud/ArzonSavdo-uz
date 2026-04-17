require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { connectDB } = require('./src/config/database');
const { createTables } = require('./src/models/init');
const swaggerSpec = require('./src/config/swagger');
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');
const { initBot } = require('./src/bot');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files (rasm uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Arzon-Savdo API',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/stats', require('./src/routes/statsRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Arzon-Savdo API ishlayapti 🚀',
    version: '1.0.0',
    documentation: `http://localhost:${PORT}/api/docs`,
    timestamp: new Date().toISOString(),
  });
});

// Root
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route topilmadi: ${req.method} ${req.url}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server xatolik:', err);
  if (err.message && err.message.includes('Faqat rasm')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Ichki server xatolik' });
});

// Create default admin if not exists
const createDefaultAdmin = async () => {
  try {
    const { rows } = await pool.query('SELECT id FROM admins LIMIT 1');
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await pool.query(
        'INSERT INTO admins (username, password) VALUES ($1, $2)',
        [process.env.ADMIN_USERNAME || 'admin', hashedPassword]
      );
      console.log('✅ Default admin yaratildi: admin / admin123');
    }
  } catch (error) {
    console.error('Admin yaratishda xatolik:', error);
  }
};

// Start server
const start = async () => {
  try {
    await connectDB();
    await createTables();
    await createDefaultAdmin();
    initBot();

    app.listen(PORT, () => {
      console.log('====================================');
      console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
      
      // 2-sekundlik Backend Cron va Self-Ping (Render o'chib qolmasligi uchun)
      setInterval(() => {
        // Har 10 daqiqada o'ziga o'zi zapros yuboradi (Self-Ping)
        if (new Date().getSeconds() % 30 === 0) {
             const axios = require('axios');
             axios.get(`http://localhost:${PORT}/health`).catch(() => {});
        }
      }, 2000);
      
      console.log(`🛒 Arzon-Savdo Backend v1.0.0`);
      console.log('====================================');
    });
  } catch (error) {
    console.error('❌ Server ishga tushmadi:', error);
    process.exit(1);
  }
};

start();
