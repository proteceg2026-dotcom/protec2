const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all users (Admin & Manager)
router.get('/', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  db.all("SELECT id, username, name, role, max_discount_percent, can_approve, can_upload_price, created_at FROM users ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, users: rows });
  });
});

// Create new user (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), (req, res) => {
  const { username, password, name, role, max_discount_percent, can_approve, can_upload_price } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة السر والاسم الكامل مطلوبان' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userRole = role || 'sales';
  const discountLimit = max_discount_percent !== undefined ? parseFloat(max_discount_percent) : 10.0;
  const approvePerm = can_approve ? 1 : 0;
  const uploadPerm = can_upload_price ? 1 : 0;

  db.run(
    `INSERT INTO users (username, password, name, role, max_discount_percent, can_approve, can_upload_price)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, hashedPassword, name, userRole, discountLimit, approvePerm, uploadPerm],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ success: false, message: 'اسم المستخدم موجود بالفعل' });
        }
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({
        success: true,
        message: 'تم إضافة المستخدم بنجاح',
        userId: this.lastID
      });
    }
  );
});

// Update user permissions & profile (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const userId = req.params.id;
  const { name, role, max_discount_percent, can_approve, can_upload_price, password } = req.body;

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    const newName = name || user.name;
    const newRole = role || user.role;
    const newDiscount = max_discount_percent !== undefined ? parseFloat(max_discount_percent) : user.max_discount_percent;
    const newApprove = can_approve !== undefined ? (can_approve ? 1 : 0) : user.can_approve;
    const newUpload = can_upload_price !== undefined ? (can_upload_price ? 1 : 0) : user.can_upload_price;

    let query = `UPDATE users SET name = ?, role = ?, max_discount_percent = ?, can_approve = ?, can_upload_price = ?`;
    let params = [newName, newRole, newDiscount, newApprove, newUpload];

    if (password && password.trim() !== '') {
      query += `, password = ?`;
      params.push(bcrypt.hashSync(password, 10));
    }

    query += ` WHERE id = ?`;
    params.push(userId);

    db.run(query, params, function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'تم تحديث صلاحيات وبيانات المستخدم بنجاح' });
    });
  });
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الحالي' });
  }

  db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  });
});

module.exports = router;
