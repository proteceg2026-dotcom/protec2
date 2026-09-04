const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Multer config for file upload
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// Make sure uploads folder exists
if (!fs.existsSync(path.join(__dirname, '../uploads/'))) {
  fs.mkdirSync(path.join(__dirname, '../uploads/'), { recursive: true });
}

// Get all / search products
router.get('/', authenticateToken, (req, res) => {
  const { search, category } = req.query;
  let sql = "SELECT * FROM products WHERE 1=1";
  let params = [];

  if (search && search.trim() !== '') {
    sql += " AND (code LIKE ? OR name LIKE ? OR description LIKE ? OR category LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  if (category && category.trim() !== '') {
    sql += " AND category = ?";
    params.push(category);
  }

  sql += " ORDER BY id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, count: rows.length, products: rows });
  });
});

// Single product lookup by code or ID
router.get('/code/:code', authenticateToken, (req, res) => {
  db.get("SELECT * FROM products WHERE code = ?", [req.params.code], (err, product) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود بهذا الكود' });
    res.json({ success: true, product });
  });
});

// Add new product
router.post('/', authenticateToken, (req, res) => {
  const { code, name, description, category, unit_price, min_price, stock_quantity, currency } = req.body;

  if (!code || !name || unit_price === undefined) {
    return res.status(400).json({ success: false, message: 'كود المنتج والاسم والسعر مطلوبون' });
  }

  db.run(
    `INSERT INTO products (code, name, description, category, unit_price, min_price, stock_quantity, currency)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code.toUpperCase().trim(),
      name.trim(),
      description || '',
      category || 'عام',
      parseFloat(unit_price),
      min_price ? parseFloat(min_price) : 0,
      stock_quantity ? parseInt(stock_quantity) : 0,
      currency || 'EGP'
    ],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ success: false, message: 'كود المنتج موجود بالفعل' });
        }
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: 'تم إضافة المنتج بنجاح', productId: this.lastID });
    }
  );
});

// Update product
router.put('/:id', authenticateToken, (req, res) => {
  const { code, name, description, category, unit_price, min_price, stock_quantity, currency } = req.body;

  db.run(
    `UPDATE products 
     SET code = ?, name = ?, description = ?, category = ?, unit_price = ?, min_price = ?, stock_quantity = ?, currency = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      code.toUpperCase().trim(),
      name.trim(),
      description || '',
      category || 'عام',
      parseFloat(unit_price),
      min_price ? parseFloat(min_price) : 0,
      stock_quantity ? parseInt(stock_quantity) : 0,
      currency || 'EGP',
      req.params.id
    ],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'تم تحديث بياتات المنتج بنجاح' });
    }
  );
});

// Delete product
router.delete('/:id', authenticateToken, (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'تم حذف المنتج' });
  });
});

// Upload price list (Excel / CSV / PDF)
router.post('/upload-pricelist', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'يرجى اختيار ملف لستة الأسعار' });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname.toLowerCase();
  let importedItems = [];

  try {
    if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls') || originalName.endsWith('.csv')) {
      // Parse Excel or CSV
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length < 2) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ success: false, message: 'الملف فارغ أو لا يحتوي على صفوف بيانات' });
      }

      // Try to detect headers or standard positions
      // Headers expected: Code/كود , Name/الاسم , Price/السعر , Category/القسم , Stock/الكمية
      let codeIdx = 0, nameIdx = 1, priceIdx = 2, catIdx = 3, stockIdx = 4;

      const headerRow = data[0].map(c => String(c).toLowerCase());
      headerRow.forEach((col, idx) => {
        if (col.includes('كود') || col.includes('code') || col.includes('sku')) codeIdx = idx;
        if (col.includes('اسم') || col.includes('name') || col.includes('منتج')) nameIdx = idx;
        if (col.includes('سعر') || col.includes('price') || col.includes('مبلغ')) priceIdx = idx;
        if (col.includes('قسم') || col.includes('تصنيف') || col.includes('category')) catIdx = idx;
        if (col.includes('كمية') || col.includes('مخزون') || col.includes('stock')) stockIdx = idx;
      });

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const code = row[codeIdx] ? String(row[codeIdx]).trim() : `PRD-${Date.now()}-${i}`;
        const name = row[nameIdx] ? String(row[nameIdx]).trim() : '';
        const price = row[priceIdx] ? parseFloat(row[priceIdx]) : 0;
        const category = row[catIdx] ? String(row[catIdx]).trim() : 'عام';
        const stock = row[stockIdx] ? parseInt(row[stockIdx]) : 10;

        if (name && !isNaN(price) && price > 0) {
          importedItems.push({ code, name, unit_price: price, category, stock_quantity: stock });
        }
      }
    } else if (originalName.endsWith('.pdf')) {
      // Parse PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const lines = pdfData.text.split('\n');

      let counter = 1;
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Regex pattern to extract price numbers and product text
        // Example line: "PRD-201 كابل كهرباء 500 EGP"
        const matches = line.match(/([A-Z0-9_-]+)?\s*([^\d]+)\s+([\d,.]+)/i);
        if (matches) {
          const code = matches[1] ? matches[1].trim() : `PDF-${counter++}`;
          const name = matches[2] ? matches[2].trim() : '';
          const price = parseFloat(matches[3].replace(/,/g, ''));

          if (name.length > 2 && !isNaN(price) && price > 0) {
            importedItems.push({
              code: code.toUpperCase(),
              name,
              unit_price: price,
              category: 'مستورد من PDF',
              stock_quantity: 10
            });
          }
        }
      }
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'امتداد الملف غير مدعوم. يرجى رفع ملف إكسيل أو CSV أو PDF' });
    }

    // Clean temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (importedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'لم يتم العثور على منتجات صالحة في الملف للاستيراد' });
    }

    // Upsert items into DB
    let insertedCount = 0;
    let updatedCount = 0;

    const stmtUpsert = db.prepare(`
      INSERT INTO products (code, name, unit_price, category, stock_quantity)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        unit_price = excluded.unit_price,
        category = excluded.category,
        stock_quantity = excluded.stock_quantity,
        updated_at = CURRENT_TIMESTAMP
    `);

    db.serialize(() => {
      importedItems.forEach(item => {
        stmtUpsert.run([item.code, item.name, item.unit_price, item.category, item.stock_quantity]);
      });
      stmtUpsert.finalize();
    });

    res.json({
      success: true,
      message: `تم رفع واستيراد ${importedItems.length} منتج بنجاح من لستة الأسعار!`,
      importedCount: importedItems.length
    });

  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة الملف: ' + error.message });
  }
});

module.exports = router;
