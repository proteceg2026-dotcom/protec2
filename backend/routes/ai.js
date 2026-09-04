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
  // Example: "عرض سعر لشركة الأمل لعدد 2 من PRD-101 بخصم 10%"
  if (queryText.includes('عرض سعر') || queryText.includes('كوتيشن') || queryText.includes('احسب') || queryText.includes('طلب عرض')) {
    // Extract discount if specified e.g., 10%
    const discMatch = queryText.match(/(\d+)\s*%/);
    const discount = discMatch ? parseFloat(discMatch[1]) : 0;

    // Extract numbers (quantity)
    const qtyMatch = queryText.match(/(?:عدد|كمية|بعدد)?\s*(\d+)/);
    const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

    // Find all product codes in DB to match
    return db.all("SELECT * FROM products", [], (err, products) => {
      if (err) return res.status(500).json({ success: false, message: err.message });

      const matchedProducts = products.filter(p => 
        queryText.includes(p.code.toLowerCase()) || 
        queryText.includes(p.name.toLowerCase()) ||
        queryText.includes(p.category.toLowerCase())
      );

      if (matchedProducts.length === 0) {
        return res.json({
          success: true,
          reply: `فهمت أنك ترغب بإنشاء عرض سعر 📝. يرجى تحديد كود المنتج (مثل PRD-101) واسم العميل لتجهيز عرض السعر بدقة.`
        });
      }

      const item = matchedProducts[0];
      const totalBeforeDisc = item.unit_price * quantity;
      const discAmt = (totalBeforeDisc * discount) / 100;
      const finalAmt = totalBeforeDisc - discAmt;

      const isOverLimit = discount > user.max_discount_percent && !user.can_approve;

      let reply = `تم إعداد مسودة عرض السعر المخصص بنجاح 📋:\n\n` +
        `• **المنتج:** ${item.name} (${item.code})\n` +
        `• **الكمية:** ${quantity} قطعة\n` +
        `• **سعر الوحدة:** ${item.unit_price.toLocaleString()} EGP\n` +
        `• **الإجمالي قبل الخصم:** ${totalBeforeDisc.toLocaleString()} EGP\n` +
        `• **الخصم المطبق:** ${discount}% (${discAmt.toLocaleString()} EGP)\n` +
        `• **الإجمالي الصافي:** **${finalAmt.toLocaleString()} EGP**\n\n`;

      if (isOverLimit) {
        reply += `⚠️ **تنبيه:** الخصم (${discount}%) يتجاوز حدك المسموح (${user.max_discount_percent}%). عند الاعتماد سيتم رفع الطلب للمدير للموافقة عليها.`;
      } else {
        reply += `✅ هذا الخصم ضمن حدك المسموح به ويمكنك تصدير عرض السعر فوراً لـ PDF.`;
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

module.exports = router;
