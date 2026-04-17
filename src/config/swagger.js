const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Arzon-Savdo API',
      version: '1.0.0',
      description: 'Arzon-Savdo E-commerce Platform API Documentation',
      contact: {
        name: 'Arzon-Savdo',
        email: 'admin@arzon-savdo.uz',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            telegram_id: { type: 'string' },
            name: { type: 'string' },
            username: { type: 'string' },
            phone: { type: 'string' },
            bonus: { type: 'number' },
            referral_code: { type: 'string' },
            is_blocked: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            icon: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            rating: { type: 'number' },
            image: { type: 'string' },
            category_id: { type: 'integer' },
            stock: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            total_price: { type: 'number' },
            address: { type: 'string' },
            phone: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'],
            },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
