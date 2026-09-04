const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// AI Assistant Chat endpoint
router.post('/chat', authenticateToken, (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'رسالة فارغة' });
  }

  const queryText = message.trim().toLowerCase();
  const user = req.user;

  // Intent 1: Check user permissions / discount limit
  if (queryText.includes('خصم') && (queryText.includes('حدي') || queryText.includes('صلاحياتي') || queryText.includes('كم') || queryText.includes('مسموح'))) {
    return res.json({
      success: true,
      reply: `أهلاً بك يا ${user.name} 👋🏻\n` +
        `• الحد الأقصى للخصم المباشر المسموح لك به هو: **${user.max_discount_percent}%**.\n` +
        `• دورك الوظيفي: **${user.role === 'admin' ? 'مدير النظام' : (user.role === 'manager' ? 'مدير مبيعات' : 'مندوب مبيعات')}**.\n` +
        `• صلاحية اعتماد عروض الأسعار: **${user.can_approve ? 'متاحة' : 'غير متاحة (يتطلب موافقة المدير)'}**.\n` +
        `• صلاحية رفع لستة الأسعار: **${user.can_upload_price ? 'متاحة' : 'غير متاحة'}**.`
    });
  }

  // Intent 2: Search products / Price query
  if (queryText.includes('سعر') || queryText.includes('منتج') || queryText.includes('كود') || queryText.includes('بحث') || queryText.includes('اسعار') || queryText.includes('لستة')) {
    // Extract search term if any
    const searchWords = queryText
      .replace(/سعر|منتج|كود|بحث|عن|كام|كم|اسعار|لستة|مولد|كابل|محول/g, '')
      .trim();

    let sql = "SELECT * FROM products";
    let params = [];
    if (searchWords.length > 0) {
      sql += " WHERE code LIKE ? OR name LIKE ? OR category LIKE ?";
      const term = `%${searchWords}%`;
      params.push(term, term, term);
    }
    sql += " LIMIT 6";

    return db.all(sql, params, (err, products) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      if (products.length === 0) {
        return res.json({
          success: true,
          reply: `لم أجد منتجات تطابق الكلمة المطلوبة "${searchWords}". يمكنك البحث بكود المنتج (مثل PRD-101) أو باسم كـ "مولد"`
        });
      }

      let reply = `إليك المنتجات المتاحة في قاعدة البيانات 📦:\n\n`;
      products.forEach(p => {
        reply += `🔹 **[${p.code}]** ${p.name}\n` +
          `   - السعر: **${p.unit_price.toLocaleString()} ${p.currency}**\n` +
          `   - المخزون الحالي: ${p.stock_quantity} قطعة | القسم: ${p.category}\n\n`;
      });
      reply += `💡 يمكنك الضغط على أي كود منتج أو إضافته مباشرة لعرض السعر.`;

      return res.json({
        success: true,
        reply,
        action: 'PRODUCT_LIST',
        data: products
      });
    });
  }

  // Intent 3: Auto Create Quote command
  if (queryText.includes('عرض سعر') || queryText.includes('كوتيشن') || queryText.includes('احسب') || queryText.includes('طلب عرض')) {
    const discMatch = queryText.match(/(\d+)\s*%/);
    let discount = discMatch ? parseFloat(discMatch[1]) : 0;

    const qtyMatch = queryText.match(/(?:عدد|كمية|بعدد)?\s*(\d+)/);
    const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

    return db.all("SELECT * FROM products", [], (err, products) => {
      if (err) return res.status(500).json({ success: false, message: err.message });

      db.all("SELECT * FROM discount_rules", [], (err2, rules) => {
        const discountRules = rules || [];

        const matchedProducts = products.filter(p => 
          queryText.includes(p.code.toLowerCase()) || 
          queryText.includes(p.name.toLowerCase()) ||
          queryText.includes(p.category.toLowerCase())
        );

        if (matchedProducts.length === 0) {
          return res.json({
            success: true,
            reply: `فهمت أنك ترغب بإنشاء عرض سعر 📝. يرجى تحديد كود المنتج (مثل PRD-101) أو اسم العائلة لتجهيز عرض السعر بدقة.`
          });
        }

        const item = matchedProducts[0];

        // Check if there is an automatic family discount rule if no manual discount provided
        if (discount === 0) {
          const familyRule = discountRules.find(r => 
            (r.target.toLowerCase() === item.code.toLowerCase() || r.target.toLowerCase() === (item.category || '').toLowerCase()) &&
            quantity >= (r.min_quantity || 1)
          );
          if (familyRule) {
            discount = familyRule.discount_percent;
          }
        }

        const totalBeforeDisc = item.unit_price * quantity;
        const discAmt = (totalBeforeDisc * discount) / 100;
        const finalAmt = totalBeforeDisc - discAmt;

        const isOverLimit = discount > user.max_discount_percent && !user.can_approve;

        let reply = `تم إعداد مسودة عرض السعر المخصص بالذكاء الاصطناعي 📋:\n\n` +
          `• **المنتج:** ${item.name} (${item.code})\n` +
          `• **العائلة / القسم:** ${item.category}\n` +
          `• **الكمية:** ${quantity} قطعة\n` +
          `• **سعر الوحدة:** ${item.unit_price.toLocaleString()} EGP\n` +
          `• **الإجمالي قبل الخصم:** ${totalBeforeDisc.toLocaleString()} EGP\n` +
          `• **الخصم المطبق (عائلة/مباشر):** ${discount}% (${discAmt.toLocaleString()} EGP)\n` +
          `• **الإجمالي الصافي النهائي:** **${finalAmt.toLocaleString()} EGP**\n\n`;

        if (isOverLimit) {
          reply += `⚠️ **تنبيه:** الخصم (${discount}%) يتجاوز حدك المسموح (${user.max_discount_percent}%). عند الاعتماد سيتم رفع الطلب للمدير للموافقة عليها.`;
        } else {
          reply += `✅ هذا الخصم ضمن حدك المسموح ويمكنك تصدير عرض السعر فوراً لـ PDF.`;
        }

        return res.json({
          success: true,
          reply,
          action: 'CREATE_QUOTE_DRAFT',
          draftQuote: {
            product: item,
            quantity,
            discount_percent: discount,
            totalBeforeDisc,
            discAmt,
            finalAmt
          }
        });
      });
    });
  }

  // Intent 4: General CRM & System info query
  if (queryText.includes('عملاء') || queryText.includes('crm') || queryText.includes('شركة')) {
    return db.all("SELECT * FROM customers LIMIT 5", [], (err, customers) => {
      if (err) return res.status(500).json({ success: false, message: err.message });

      let reply = `إليك أبرز العملاء المسجلين في نظام الـ CRM 👥:\n\n`;
      customers.forEach(c => {
        reply += `👤 **${c.name}** (${c.company || 'فردي'})\n` +
          `   - هاتف: ${c.phone || 'غير مسجل'} | الحالة: ${c.status}\n`;
      });
      reply += `\nيمكنك إضافة عملاء جدد أو متابعة صفقاتهم من قسم الـ CRM.`;

      return res.json({ success: true, reply });
    });
  }

  // Default Fallback
  return res.json({
    success: true,
    reply: `أهلاً بك يا ${user.name}! أنا مساعد المبيعات الذكي 🤖. كيف يمكنني مساعدتك اليوم؟\n\n` +
      `يمكنك طلب أي مما يلي:\n` +
      `1️⃣ "استعلام عن أسعار الكابلات والمولدات"\n` +
      `2️⃣ "عمل عرض سعر لمنتج PRD-101 بخصم 10%"\n` +
      `3️⃣ "عرض خصمي المسموح وصلاحياتي"\n` +
      `4️⃣ "استعراض قائمة العملاء المتاحة"`
  });
});

const multer = require('multer');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// Smart AI File & Image-to-Quote Converter Endpoint (Supports PDF, Excel, TXT, PNG, JPG, WEBP, BMP)
router.post('/parse-file-quote', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'يرجى اختيار ملف طلب أو صورة عرض سعر' });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname.toLowerCase();

  try {
    let extractedTextLines = [];

    if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls') || originalName.endsWith('.csv')) {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      data.forEach(row => {
        if (row && row.length > 0) {
          const lineStr = row.join(' ').trim();
          if (lineStr.length > 2) extractedTextLines.push(lineStr);
        }
      });
    } else if (originalName.endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedTextLines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    } else if (/\.(png|jpg|jpeg|webp|bmp|tiff)$/i.test(originalName)) {
      // Perform Image OCR Recognition
      const result = await Tesseract.recognize(filePath, 'eng+ara');
      const text = result && result.data ? result.data.text : '';
      extractedTextLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    } else {
      const content = fs.readFileSync(filePath, 'utf8');
      extractedTextLines = content.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (extractedTextLines.length === 0) {
      return res.status(400).json({ success: false, message: 'تعذر قراءة نصوص من الملف أو الصورة المرفقة' });
    }

    // Fetch catalog products to match
    db.all("SELECT * FROM products", [], (err, products) => {
      if (err) return res.status(500).json({ success: false, message: err.message });

      const parsedItems = [];

      extractedTextLines.forEach((line, index) => {
        // Skip common header words
        if (/invoice|quotation|date|total|مبلغ|إجمالي|التاريخ|التفاصيل|عرض سعر/i.test(line)) return;

        // Try SKU / Code or Name match
        const lowerLine = line.toLowerCase();
        let matchedProd = products.find(p => 
          lowerLine.includes(p.code.toLowerCase()) || 
          lowerLine.includes(p.name.toLowerCase())
        );

        // Try extracting quantity
        const qtyMatch = line.match(/(?:عدد|كمية|بعدد)?\s*(\d+)/i);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

        if (matchedProd) {
          parsedItems.push({
            id: matchedProd.id,
            code: matchedProd.code,
            name: matchedProd.name,
            unit_price: matchedProd.unit_price,
            quantity: quantity > 0 ? quantity : 1,
            item_discount_percent: 0,
            isMatched: true,
            notes: 'مطابق لكتالوج لستة الأسعار'
          });
        } else {
          // Unmatched / Unclear item -> leave as manual pricing
          parsedItems.push({
            id: `manual-${Date.now()}-${index}`,
            code: `MANUAL-${index + 1}`,
            name: line.length > 60 ? line.slice(0, 60) + '...' : line,
            unit_price: 0,
            quantity: quantity > 0 ? quantity : 1,
            item_discount_percent: 0,
            isMatched: false,
            isManual: true,
            notes: '⚠️ بند غير واضح/خارج الكتالوج - يرجى التسعير وتحديد الخصم يدوياً'
          });
        }
      });

      res.json({
        success: true,
        message: `تم تحليل المستند بنجاح بالذكاء الاصطناعي وتحويله لـ ${parsedItems.length} بند بعرض السعر!`,
        items: parsedItems
      });
    });

  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ success: false, message: 'خطأ أثناء تحليل الملف بالذكاء الاصطناعي: ' + error.message });
  }
});

module.exports = router;
