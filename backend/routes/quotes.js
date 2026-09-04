const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get all quotes
router.get('/', authenticateToken, (req, res) => {
  const { status, customer_id } = req.query;
  let sql = "SELECT * FROM quotes WHERE 1=1";
  let params = [];

  // Non-admins only see their own quotes unless they have approval privileges
  if (req.user.role === 'sales' && !req.user.can_approve) {
    sql += " AND user_id = ?";
    params.push(req.user.id);
  }

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  if (customer_id) {
    sql += " AND customer_id = ?";
    params.push(customer_id);
  }

  sql += " ORDER BY id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    // Parse items_json
    const quotes = rows.map(r => ({
      ...r,
      items: JSON.parse(r.items_json || '[]')
    }));

    res.json({ success: true, count: quotes.length, quotes });
  });
});

// Get quote by ID
router.get('/:id', authenticateToken, (req, res) => {
  db.get("SELECT * FROM quotes WHERE id = ?", [req.params.id], (err, quote) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!quote) return res.status(404).json({ success: false, message: 'عرض السعر غير موجود' });
    
    quote.items = JSON.parse(quote.items_json || '[]');
    res.json({ success: true, quote });
  });
});

// Create new quotation
router.post('/', authenticateToken, (req, res) => {
  const { customer_id, customer_name, items, discount_percent, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'يجب إضافة منتج واحد على الأقل في عرض السعر' });
  }

  // Calculate totals
  let total_amount = 0;
  items.forEach(item => {
    total_amount += (parseFloat(item.unit_price) * parseInt(item.quantity));
  });

  const discPercent = discount_percent ? parseFloat(discount_percent) : 0;
  const discount_amount = (total_amount * discPercent) / 100;
  const final_amount = total_amount - discount_amount;

  // Determine initial status based on user discount permissions
  let initialStatus = 'approved';
  const userMaxDisc = req.user.max_discount_percent || 10;

  if (discPercent > userMaxDisc && !req.user.can_approve && req.user.role === 'sales') {
    initialStatus = 'submitted'; // Needs approval
  }

  const quote_number = `Q-${Date.now().toString().slice(-6)}`;

  db.run(
    `INSERT INTO quotes (quote_number, customer_id, customer_name, user_id, user_name, total_amount, discount_percent, discount_amount, final_amount, status, notes, items_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quote_number,
      customer_id || null,
      customer_name || 'عميل نقدي',
      req.user.id,
      req.user.name,
      total_amount,
      discPercent,
      discount_amount,
      final_amount,
      initialStatus,
      notes || '',
      JSON.stringify(items)
    ],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      const quoteId = this.lastID;
      const message = initialStatus === 'submitted'
        ? 'تم رفع طلب عرض السعر بنجاح، وبانتظار اعتماد المدير لأن الخصم يتجاوز حدك المسموح'
        : 'تم إنشاء وثيقة عرض السعر واعتمادها بنجاح';

      res.json({
        success: true,
        message,
        quoteId,
        quote_number,
        status: initialStatus,
        final_amount
      });
    }
  );
});

// Update quote status (Approve / Reject)
router.put('/:id/status', authenticateToken, (req, res) => {
  const { status, notes } = req.body;

  if (!['approved', 'rejected', 'draft', 'submitted'].includes(status)) {
    return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
  }

  // Check if user can approve
  if (['approved', 'rejected'].includes(status) && !req.user.can_approve && req.user.role === 'sales') {
    return res.status(403).json({ success: false, message: 'غير مسموح لك بتعديل حالة الاعتمادات لعروض الأسعار' });
  }

  db.run(
    `UPDATE quotes SET status = ?, notes = coalesce(?, notes) WHERE id = ?`,
    [status, notes || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: `تم تغيير حالة عرض السعر إلى: ${status}` });
    }
  );
});

// Delete quote
router.delete('/:id', authenticateToken, (req, res) => {
  db.run("DELETE FROM quotes WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'تم حذف عرض السعر' });
  });
});

module.exports = router;
