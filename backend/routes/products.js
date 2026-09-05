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

// Download Standard Excel Template
router.get('/download-template', (req, res) => {
  try {
    const templateData = [
      {
        'كود_المنتج': 'PRD-101',
        'اسم_المنتج': 'مولد كهربائي 50 كيلو واط كاتربيلر',
        'العائلة_القسم': 'المولدات',
        'السعر_الأساسي': 125000,
        'نسبة_الخصم_العائلة_%': 12,
        'الكمية_المتاحة': 10,
        'شروط_وملاحظات_الخصم': 'خصم خاص لعائلة المولدات الكهربائية'
      },
      {
        'كود_المنتج': 'PRD-102',
        'اسم_المنتج': 'كابل نحاس مسلح 4x16 ملم (100 متر)',
        'العائلة_القسم': 'الكابلات',
        'السعر_الأساسي': 14500,
        'نسبة_الخصم_العائلة_%': 5,
        'الكمية_المتاحة': 50,
        'شروط_وملاحظات_الخصم': 'خصم توريدات الكابلات'
      },
      {
        'كود_المنتج': 'PRD-103',
        'اسم_المنتج': 'لوحة تحكم ATS أتوماتيك 250A',
        'العائلة_القسم': 'لوحات التحكم',
        'السعر_الأساسي': 32000,
        'نسبة_الخصم_العائلة_%': 8,
        'الكمية_المتاحة': 15,
        'شروط_وملاحظات_الخصم': 'خصم لوحات التحكم'
      }
    ];

    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'لستة_الأسعار_والخصومات');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ProTec_PriceList_Discount_Template.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ أثناء إنشاء نموذج الإكسيل: ' + err.message });
  }
});

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

// Bulk Delete Products
router.post('/bulk-delete', authenticateToken, (req, res) => {
  const { ids, deleteAll } = req.body;

  if (deleteAll) {
    db.run("DELETE FROM products", [], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'تم مسح كافة المنتجات في لستة الأسعار بنجاح' });
    });
  } else if (Array.isArray(ids) && ids.length > 0) {
    db.run("DELETE FROM products WHERE ids IN (?)", [ids], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: `تم حذف ${ids.length} منتج بنجاح` });
    });
  } else {
    res.status(400).json({ success: false, message: 'لم يتم تحديد منتجات للحذف' });
  }
});

// Discount Rules Routes
router.get('/discount-rules', authenticateToken, (req, res) => {
  db.all("SELECT * FROM discount_rules ORDER BY id DESC", [], (err, rules) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, rules: rules || [] });
  });
});

router.post('/discount-rules', authenticateToken, (req, res) => {
  const { target, min_quantity, discount_percent, terms } = req.body;
  if (!target || discount_percent === undefined) {
    return res.status(400).json({ success: false, message: 'اسم القسم/الكود ونسبة الخصم مطلوبان' });
  }

  db.run(
    "INSERT INTO discount_rules (target, min_quantity, discount_percent, terms) VALUES (?, ?, ?, ?)",
    [target.trim(), parseInt(min_quantity) || 1, parseFloat(discount_percent) || 0, terms || ''],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'تم إضافة شرط الخصم التلقائي بنجاح', ruleId: this.lastID });
    }
  );
});

router.delete('/discount-rules/:id', authenticateToken, (req, res) => {
  db.run("DELETE FROM discount_rules WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'تم حذف شرط الخصم' });
  });
});

// Upload price list & discount policy (Excel / CSV / PDF)
router.post('/upload-pricelist', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'يرجى اختيار ملف لستة الأسعار والخصومات (Excel / CSV / PDF)'
    });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname.toLowerCase();
  
  // Supported Extensions Check
  const validExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
  const hasValidExt = validExtensions.some(ext => originalName.endsWith(ext));
  
  if (!hasValidExt) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(400).json({
      success: false,
      message: 'صيغة الملف غير مدعومة. يرجى اختيار ملف إكسيل (.xlsx, .xls) أو CSV أو PDF'
    });
  }

  let importedItems = [];
  let familyDiscountRules = [];
  let errorLogs = [];
  let skippedRowsCount = 0;

  // Arabic-Indic to Western Digit converter and Number parser
  const parseNumber = (val) => {
    if (val === undefined || val === null) return 0;
    let str = String(val).trim();
    if (!str) return 0;
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let d = 0; d < 10; d++) {
      str = str.split(arabicDigits[d]).join(String(d));
    }
    const cleaned = str.replace(/,/g, '').replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // String sanitizer
  const sanitizeStr = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  try {
    if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls') || originalName.endsWith('.csv')) {
      const workbook = xlsx.readFile(filePath);

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        if (!data || data.length < 2) continue;

        let codeIdx = -1, nameIdx = -1, catIdx = -1, priceIdx = -1, discIdx = -1, stockIdx = -1, termsIdx = -1;
        let startRowIdx = 0;

        // Scan first 15 rows to detect header row
        for (let r = 0; r < Math.min(15, data.length); r++) {
          if (!data[r] || !Array.isArray(data[r])) continue;
          const rowStr = data[r].map(c => String(c).toLowerCase()).join(' ');

          if (
            rowStr.includes('كود') || rowStr.includes('code') || rowStr.includes('sku') || rowStr.includes('ref') ||
            rowStr.includes('صنف') || rowStr.includes('اسم') || rowStr.includes('سعر') || rowStr.includes('بيان') ||
            rowStr.includes('مهمات') || rowStr.includes('مادة') || rowStr.includes('price') || rowStr.includes('item')
          ) {
            startRowIdx = r + 1;
            const headerRow = data[r].map(c => String(c).toLowerCase());
            headerRow.forEach((col, idx) => {
              if (codeIdx === -1 && (col.includes('كود') || col.includes('code') || col.includes('sku') || col.includes('ref') || col.includes('part') || col.includes('مرجع') || col.includes('رقم الصنف') || col.includes('رمز'))) codeIdx = idx;
              if (nameIdx === -1 && (col.includes('اسم') || col.includes('name') || col.includes('منتج') || col.includes('وصف') || col.includes('desc') || col.includes('بيان') || col.includes('مادة') || col.includes('مهمات') || col.includes('تفاصيل'))) nameIdx = idx;
              if (catIdx === -1 && (col.includes('عائلة') || col.includes('قسم') || col.includes('تصنيف') || col.includes('family') || col.includes('category') || col.includes('range') || col.includes('مجموعة') || col.includes('قطاع'))) catIdx = idx;
              if (priceIdx === -1 && (col.includes('سعر') || col.includes('price') || col.includes('مبلغ') || col.includes('list') || col.includes('قيمة') || col.includes('تكلفة') || col.includes('ثمن') || col.includes('rate'))) priceIdx = idx;
              if (discIdx === -1 && (col.includes('خصم') || col.includes('disc') || col.includes('discount') || col.includes('نسبة'))) discIdx = idx;
              if (stockIdx === -1 && (col.includes('كمية') || col.includes('مخزون') || col.includes('stock') || col.includes('qty') || col.includes('عدد'))) stockIdx = idx;
              if (termsIdx === -1 && (col.includes('ملاحظ') || col.includes('شرط') || col.includes('term') || col.includes('note'))) termsIdx = idx;
            });
            break;
          }
        }

        // Default index fallbacks if header detection didn't match certain columns
        if (codeIdx === -1) codeIdx = 0;
        if (nameIdx === -1) nameIdx = (codeIdx === 0 ? 1 : 0);
        if (catIdx === -1) catIdx = 2;
        if (priceIdx === -1) priceIdx = 3;
        if (discIdx === -1) discIdx = 4;
        if (stockIdx === -1) stockIdx = 5;
        if (termsIdx === -1) termsIdx = 6;

        for (let i = startRowIdx; i < data.length; i++) {
          const row = data[i];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          let rawCode = (row[codeIdx] !== undefined && row[codeIdx] !== null) ? sanitizeStr(row[codeIdx]) : '';
          let rawName = (row[nameIdx] !== undefined && row[nameIdx] !== null) ? sanitizeStr(row[nameIdx]) : '';
          let category = (row[catIdx] !== undefined && row[catIdx] !== null) ? sanitizeStr(row[catIdx]) : 'عام';

          // Fallback name search across row if name is missing or header title
          if (!rawName || rawName.length < 2) {
            for (let cell of row) {
              if (cell !== undefined && cell !== null) {
                const cellStr = sanitizeStr(cell);
                if (
                  cellStr.length > 2 &&
                  isNaN(cellStr) &&
                  !/^\d+$/.test(cellStr) &&
                  !/^(كود|سعر|خصم|كمية|ملاحظات|م|ت|رقم|بيان|اسم_المنتج|كود_المنتج)$/i.test(cellStr)
                ) {
                  rawName = cellStr;
                  break;
                }
              }
            }
          }

          const lowerName = rawName.toLowerCase();
          // Skip header row if caught in data loop
          if (
            !rawName ||
            lowerName === 'كود' || lowerName === 'اسم' || lowerName === 'اسم المنتج' ||
            lowerName === 'كود_المنتج' || lowerName === 'اسم_المنتج' || lowerName === 'البيان' ||
            lowerName === 'المواصفات' || lowerName === 'وصف المنتج' || lowerName === 'name' ||
            lowerName === 'product name' || lowerName === 'code' || lowerName === 'sku'
          ) {
            skippedRowsCount++;
            continue;
          }

          const code = rawCode.length > 0 ? rawCode : `PRD-${importedItems.length + 1}-${Date.now().toString().slice(-4)}`;

          let priceVal = 0;
          if (row[priceIdx] !== undefined && row[priceIdx] !== null) {
            priceVal = parseNumber(row[priceIdx]);
          }

          // Fallback price search across all cells in the row if priceVal is 0
          if (priceVal === 0) {
            for (let colVal of row) {
              if (colVal !== undefined && colVal !== null) {
                const p = parseNumber(colVal);
                if (p > 0 && p !== parseInt(code)) {
                  priceVal = p;
                  break;
                }
              }
            }
          }

          let discount = 0;
          if (row[discIdx] !== undefined && row[discIdx] !== null) {
            discount = parseNumber(row[discIdx]);
          }

          let stock = 50;
          if (row[stockIdx] !== undefined && row[stockIdx] !== null) {
            const parsedStock = parseNumber(row[stockIdx]);
            if (parsedStock > 0) stock = parseInt(parsedStock);
          }

          const terms = (row[termsIdx] !== undefined && row[termsIdx] !== null) ? sanitizeStr(row[termsIdx]) : '';

          importedItems.push({ code, name: rawName, unit_price: priceVal, category, stock_quantity: stock });

          if (discount > 0) {
            familyDiscountRules.push({
              target: category,
              min_quantity: 1,
              discount_percent: discount,
              terms: terms || `خصم عائلة ${category} تلقائي`
            });
          }
        }
      }
    } else if (originalName.endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const lines = pdfData.text.split('\n');

      let counter = 1;
      for (let line of lines) {
        line = sanitizeStr(line);
        if (!line) continue;

        const matches = line.match(/([A-Z0-9_-]+)?\s*([^\d]+)\s+([\d,.]+)/i);
        if (matches) {
          const code = matches[1] ? sanitizeStr(matches[1]) : `PDF-${counter++}`;
          const name = matches[2] ? sanitizeStr(matches[2]) : '';
          const price = parseNumber(matches[3]);

          if (name.length > 2 && price > 0) {
            importedItems.push({
              code: code.toUpperCase(),
              name,
              unit_price: price,
              category: 'عام',
              stock_quantity: 50
            });
          }
        }
      }
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (importedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم العثور على منتجات صالحة في الملف للاستيراد. يرجى التأكد من احتواء الملف على أعمدة الأسعار والأسماء.'
      });
    }

    // Upsert items into DB synchronously
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

      // Upsert Family Discount Rules
      familyDiscountRules.forEach(rule => {
        db.run(
          "INSERT INTO discount_rules (target, min_quantity, discount_percent, terms) VALUES (?, ?, ?, ?)",
          [rule.target, rule.min_quantity, rule.discount_percent, rule.terms]
        );
      });

      // Synchronize database to disk immediately
      if (typeof db.saveSync === 'function') {
        db.saveSync();
      }
    });

    res.json({
      success: true,
      message: `تم استيراد ${importedItems.length} منتج وحفظ ${familyDiscountRules.length} شرط خصم بنجاح من الملف!`,
      importedCount: importedItems.length,
      rulesCount: familyDiscountRules.length,
      skippedCount: skippedRowsCount,
      errors: errorLogs
    });

  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ غير متوقع أثناء معالجة وقراءة الملف: ' + error.message
    });
  }
});

module.exports = router;
