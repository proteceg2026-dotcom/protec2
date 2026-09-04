const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'sales', -- admin, manager, sales
        max_discount_percent REAL DEFAULT 10.0,
        can_approve INTEGER DEFAULT 0,
        can_upload_price INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        unit_price REAL NOT NULL,
        min_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        currency TEXT DEFAULT 'EGP',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table (CRM)
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        tax_id TEXT,
        status TEXT DEFAULT 'lead', -- lead, contacted, active, inactive
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quotes table
    db.run(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        customer_name TEXT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        discount_percent REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        final_amount REAL NOT NULL,
        status TEXT DEFAULT 'draft', -- draft, submitted, approved, rejected
        notes TEXT,
        items_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Activity Logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default data if empty
    seedData();
  });
}

function seedData() {
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) return;
    if (row.count === 0) {
      console.log('Seeding default users...');
      const adminPass = bcrypt.hashSync('admin123', 10);
      const salesPass = bcrypt.hashSync('emp123', 10);

      db.run(
        `INSERT INTO users (username, password, name, role, max_discount_percent, can_approve, can_upload_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin', adminPass, 'مدير النظام الرئيسي', 'admin', 100, 1, 1]
      );

      db.run(
        `INSERT INTO users (username, password, name, role, max_discount_percent, can_approve, can_upload_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['emp1', salesPass, 'أحمد محمود (مبيعات)', 'sales', 15, 0, 0]
      );
    }
  });

  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (err) return;
    if (row.count === 0) {
      console.log('Seeding sample products...');
      const sampleProducts = [
        ['PRD-101', 'مولد كهربائي 50 كيلو واط', 'مولد ديزل كاتربيلر كات 50 KVA صامت', 'المولدات', 125000, 110000, 8, 'EGP'],
        ['PRD-102', 'محول كهربائي 100 KVA', 'محول خفض جهد ثلاثي الأوجه', 'المحولات', 85000, 78000, 15, 'EGP'],
        ['PRD-103', 'كابل مسلح 4x16 ملم (100 متر)', 'كابل نحاس مسلّح عالي الجودة متوافق مع الكود المصري', 'الكابلات', 14500, 13000, 50, 'EGP'],
        ['PRD-104', 'لوحة تحكم ATS أتوماتيك 250A', 'لوحة نقل القدرة التلقائية للمولدات', 'لوحات التحكم', 32000, 29000, 12, 'EGP'],
        ['PRD-105', 'بطارية مولد 12V 100Ah', 'بطارية جافة عالية الاعتمادية للمولدات', 'إكسسوارات', 4800, 4200, 100, 'EGP'],
        ['PRD-106', 'قاطع كهربائي ثلاثي 400A Schneider', 'قاطع تيار مدمج عالي الجودة', 'المقاطعات', 18500, 16800, 25, 'EGP']
      ];

      const stmt = db.prepare(`
        INSERT INTO products (code, name, description, category, unit_price, min_price, stock_quantity, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      sampleProducts.forEach(p => stmt.run(p));
      stmt.finalize();
    }
  });

  db.get("SELECT COUNT(*) as count FROM customers", (err, row) => {
    if (err) return;
    if (row.count === 0) {
      console.log('Seeding sample customers...');
      const sampleCustomers = [
        ['شركة الأمل للمقاولات', 'شركة الأمل ش.م.م', '01012345678', 'info@alamal-const.com', 'القاهرة - التجمع الخامس', '123-456-789', 'active', 'عميل مميز - مشاريع إنشائية كبيرة'],
        ['مؤسسة النور للإلكترونيات', 'مؤسسة النور التجاري', '01198765432', 'sales@alnoor-eg.com', 'الجيزة - شارع الهرم', '987-654-321', 'contacted', 'مهتم بمولدات الكهرباء للمصانع'],
        ['المصرية للتطوير العقاري', 'المصرية للتعمير', '01255554444', 'contact@egy-dev.com', 'الإسكندرية - سموحة', '456-789-123', 'lead', 'طلب استفسار عن أسعار الكابلات المسلحة']
      ];

      const stmt = db.prepare(`
        INSERT INTO customers (name, company, phone, email, address, tax_id, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      sampleCustomers.forEach(c => stmt.run(c));
      stmt.finalize();
    }
  });
}

module.exports = db;
