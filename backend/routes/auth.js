const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Ping server test
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'السيرفر يعمل بنجاح!', timestamp: new Date() });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة السر' });
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ success: false, message: 'خطأ في خادم البيانات' });
    if (!user) return res.status(400).json({ success: false, message: 'اسم المستخدم غير موجود' });

    const validPass = bcrypt.compareSync(password, user.password);
    if (!validPass) return res.status(400).json({ success: false, message: 'كلمة السر غير صحيحة' });

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      max_discount_percent: user.max_discount_percent,
      can_approve: user.can_approve,
      can_upload_price: user.can_upload_price
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: payload,
      message: `أهلاً بك يا ${user.name}`
    });
  });
});

// Get current profile
router.get('/me', authenticateToken, (req, res) => {
  db.get("SELECT id, username, name, role, max_discount_percent, can_approve, can_upload_price FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, user });
  });
});

module.exports = router;
