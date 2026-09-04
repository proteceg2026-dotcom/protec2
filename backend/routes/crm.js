const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get all customers
router.get('/', authenticateToken, (req, res) => {
  const { search, status } = req.query;
  let sql = "SELECT * FROM customers WHERE 1=1";
  let params = [];

  if (search && search.trim() !== '') {
    sql += " AND (name LIKE ? OR company LIKE ? OR phone LIKE ? OR email LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  sql += " ORDER BY id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, count: rows.length, customers: rows });
  });
});

// Get single customer details with quote history
router.get('/:id', authenticateToken, (req, res) => {
  const customerId = req.params.id;

  db.get("SELECT * FROM customers WHERE id = ?", [customerId], (err, customer) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!customer) return res.status(404).json({ success: false, message: 'العميل غير موجود' });

    db.all("SELECT * FROM quotes WHERE customer_id = ? ORDER BY id DESC", [customerId], (err, quotes) => {
      if (err) quotes = [];
      const parsedQuotes = quotes.map(q => ({ ...q, items: JSON.parse(q.items_json || '[]') }));

      const totalSales = parsedQuotes
        .filter(q => q.status === 'approved')
        .reduce((sum, q) => sum + q.final_amount, 0);

      res.json({
        success: true,
        customer,
        quotes: parsedQuotes,
        stats: {
          totalQuotes: parsedQuotes.length,
          approvedQuotes: parsedQuotes.filter(q => q.status === 'approved').length,
          totalSalesValue: totalSales
        }
      });
    });
  });
});

// Create new customer
router.post('/', authenticateToken, (req, res) => {
  const { name, company, phone, email, address, tax_id, status, notes } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'اسم العميل مطلوب' });
  }

  db.run(
    `INSERT INTO customers (name, company, phone, email, address, tax_id, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      company ? company.trim() : '',
      phone ? phone.trim() : '',
      email ? email.trim() : '',
      address ? address.trim() : '',
      tax_id ? tax_id.trim() : '',
      status || 'lead',
      notes || ''
    ],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'تم إضافة العميل بنجاح في نظام الـ CRM', customerId: this.lastID });
    }
  );
});

// Update customer
router.put('/:id', authenticateToken, (req, res) => {
  const { name, company, phone, email, address, tax_id, status, notes } = req.body;

  db.run(
    `UPDATE customers
     SET name = ?, company = ?, phone = ?, email = ?, address = ?, tax_id = ?, status = ?, notes = ?
     WHERE id = ?`,
    [
      name.trim(),
      company ? company.trim() : '',
      phone ? phone.trim() : '',
      email ? email.trim() : '',
      address ? address.trim() : '',
      tax_id ? tax_id.trim() : '',
      status || 'lead',
      notes || '',
      req.params.id
    ],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'تم تحديث بيانات العميل بنجاح' });
    }
  );
});

// Delete customer
router.delete('/:id', authenticateToken, (req, res) => {
  db.run("DELETE FROM customers WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'تم حذف العميل' });
  });
});

module.exports = router;
