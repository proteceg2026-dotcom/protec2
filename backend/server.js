const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const quoteRoutes = require('./routes/quotes');
const crmRoutes = require('./routes/crm');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for cross-platform apps & local web client
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'ProTec Sales Assistant & CRM Backend',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Serve Frontend Static Build in Production / Render
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send('<h2 style="font-family:sans-serif;text-align:center;margin-top:50px;">🚀 ProTec Sales Assistant API Server is Running!</h2>');
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({ success: false, message: err.message || 'حدث خطأ في الخادم' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 ProTec Sales Assistant Backend Running on Port ${PORT}`);
  console.log(`🌐 Local / Public Access Port: ${PORT}`);
  console.log(`=======================================================`);
});
