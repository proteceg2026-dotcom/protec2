const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbFilePath = path.resolve(__dirname, 'database.json');

let store = {
  users: [],
  products: [],
  customers: [],
  quotes: [],
  activity_logs: [],
  discount_rules: [],
  autoIds: { users: 1, products: 1, customers: 1, quotes: 1, activity_logs: 1, discount_rules: 1 }
};

function loadStore() {
  if (fs.existsSync(dbFilePath)) {
    try {
      const content = fs.readFileSync(dbFilePath, 'utf8');
      store = JSON.parse(content);
      if (!store.autoIds) {
        store.autoIds = { users: 1, products: 1, customers: 1, quotes: 1, activity_logs: 1 };
      }
    } catch (e) {
      console.error('Error loading database.json', e);
    }
  } else {
    saveStore();
  }
}

let saveTimer = null;
function saveStore() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving database.json', e);
    }
  }, 150);
}

function saveStoreSync() {
  if (saveTimer) clearTimeout(saveTimer);
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving database.json', e);
  }
}

loadStore();

// Seed initial data if empty
function seedData() {
  let changed = false;

  if (store.users.length === 0) {
    const adminPass = bcrypt.hashSync('admin123', 10);
    const salesPass = bcrypt.hashSync('emp123', 10);

    store.users.push({
      id: store.autoIds.users++,
      username: 'admin',
      password: adminPass,
      name: 'مدير النظام الرئيسي',
      role: 'admin',
      max_discount_percent: 100,
      can_approve: 1,
      can_upload_price: 1,
      created_at: new Date().toISOString()
    });

    store.users.push({
      id: store.autoIds.users++,
      username: 'emp1',
      password: salesPass,
      name: 'أحمد محمود (مبيعات)',
      role: 'sales',
      max_discount_percent: 15,
      can_approve: 0,
      can_upload_price: 0,
      created_at: new Date().toISOString()
    });
    changed = true;
  }

  if (store.products.length === 0) {
    const sampleProducts = [
      ['PRD-101', 'مولد كهربائي 50 كيلو واط', 'مولد ديزل كاتربيلر كات 50 KVA صامت', 'المولدات', 125000, 110000, 8, 'EGP'],
      ['PRD-102', 'محول كهربائي 100 KVA', 'محول خفض جهد ثلاثي الأوجه', 'المحولات', 85000, 78000, 15, 'EGP'],
      ['PRD-103', 'كابل مسلح 4x16 ملم (100 متر)', 'كابل نحاس مسلّح عالي الجودة متوافق مع الكود المصري', 'الكابلات', 14500, 13000, 50, 'EGP'],
      ['PRD-104', 'لوحة تحكم ATS أتوماتيك 250A', 'لوحة نقل القدرة التلقائية للمولدات', 'لوحات التحكم', 32000, 29000, 12, 'EGP'],
      ['PRD-105', 'بطارية مولد 12V 100Ah', 'بطارية جافة عالية الاعتمادية للمولدات', 'إكسسوارات', 4800, 4200, 100, 'EGP'],
      ['PRD-106', 'قاطع كهربائي ثلاثي 400A Schneider', 'قاطع تيار مدمج عالي الجودة', 'المقاطعات', 18500, 16800, 25, 'EGP']
    ];

    sampleProducts.forEach(p => {
      store.products.push({
        id: store.autoIds.products++,
        code: p[0],
        name: p[1],
        description: p[2],
        category: p[3],
        unit_price: p[4],
        min_price: p[5],
        stock_quantity: p[6],
        currency: p[7],
        updated_at: new Date().toISOString()
      });
    });
    changed = true;
  }

  if (store.customers.length === 0) {
    const sampleCustomers = [
      ['شركة الأمل للمقاولات', 'شركة الأمل ش.م.م', '01012345678', 'info@alamal-const.com', 'القاهرة - التجمع الخامس', '123-456-789', 'active', 'عميل مميز - مشاريع إنشائية كبيرة'],
      ['مؤسسة النور للإلكترونيات', 'مؤسسة النور التجاري', '01198765432', 'sales@alnoor-eg.com', 'الجيزة - شارع الهرم', '987-654-321', 'contacted', 'مهتم بمولدات الكهرباء للمصانع'],
      ['المصرية للتطوير العقاري', 'المصرية للتعمير', '01255554444', 'contact@egy-dev.com', 'الإسكندرية - سموحة', '456-789-123', 'lead', 'طلب استفسار عن أسعار الكابلات المسلحة']
    ];

    sampleCustomers.forEach(c => {
      store.customers.push({
        id: store.autoIds.customers++,
        name: c[0],
        company: c[1],
        phone: c[2],
        email: c[3],
        address: c[4],
        tax_id: c[5],
        status: c[6],
        notes: c[7],
        created_at: new Date().toISOString()
      });
    });
    changed = true;
  }

  if (changed) saveStore();
}

seedData();

// Generic SQL query simulation for SQLite interface compatibility
class DatabaseDriver {
  serialize(callback) {
    if (callback) callback();
  }

  get(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    try {
      const rows = this._executeQuery(sql, params);
      const res = rows.length > 0 ? rows[0] : null;
      if (callback) callback(null, res);
      return res;
    } catch (err) {
      if (callback) callback(err, null);
    }
  }

  all(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    try {
      const rows = this._executeQuery(sql, params);
      if (callback) callback(null, rows);
      return rows;
    } catch (err) {
      if (callback) callback(err, []);
      return [];
    }
  }

  run(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    try {
      const result = this._executeUpdate(sql, params);
      saveStore();
      if (callback) callback.call(result, null);
      return result;
    } catch (err) {
      if (callback) callback(err);
    }
  }

  prepare(sql) {
    const self = this;
    return {
      run(params, callback) {
        self.run(sql, params, callback);
      },
      finalize() {}
    };
  }

  _executeQuery(sql, params) {
    const lowerSql = sql.toLowerCase();

    // SELECT COUNT
    if (lowerSql.includes('select count(*)')) {
      if (lowerSql.includes('from users')) return [{ count: store.users.length }];
      if (lowerSql.includes('from products')) return [{ count: store.products.length }];
      if (lowerSql.includes('from customers')) return [{ count: store.customers.length }];
      if (lowerSql.includes('from quotes')) return [{ count: store.quotes.length }];
    }

    // SELECT FROM USERS
    if (lowerSql.includes('from users')) {
      let list = [...store.users];
      if (lowerSql.includes('where username = ?')) {
        list = list.filter(u => u.username === params[0]);
      } else if (lowerSql.includes('where id = ?')) {
        list = list.filter(u => String(u.id) === String(params[0]));
      }
      return list;
    }

    // SELECT FROM PRODUCTS
    if (lowerSql.includes('from products')) {
      let list = [...store.products];
      if (lowerSql.includes('where code = ?')) {
        list = list.filter(p => p && p.code && p.code.toUpperCase() === String(params[0]).toUpperCase());
      } else if (lowerSql.includes('code like') || lowerSql.includes('name like')) {
        const rawTerm = params[0] ? params[0].replace(/%/g, '').toLowerCase().trim() : '';
        const words = rawTerm.split(/\s+/).filter(w => w.length > 0);
        list = list.filter(p => {
          if (!p) return false;
          const targetStr = `${p.code || ''} ${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
          return words.every(w => targetStr.includes(w));
        });
      }
      if (lowerSql.includes('category = ?')) {
        const catVal = params[params.length - 1];
        if (catVal) list = list.filter(p => p && p.category === catVal);
      }
      if (lowerSql.includes('order by id desc')) {
        list = [...list].reverse();
      }
      return list;
    }

    // SELECT FROM CUSTOMERS
    if (lowerSql.includes('from customers')) {
      let list = [...store.customers];
      if (lowerSql.includes('where id = ?')) {
        list = list.filter(c => String(c.id) === String(params[0]));
      } else if (lowerSql.includes('name like') || lowerSql.includes('company like')) {
        const term = params[0] ? params[0].replace(/%/g, '').toLowerCase() : '';
        list = list.filter(c =>
          c.name.toLowerCase().includes(term) ||
          (c.company && c.company.toLowerCase().includes(term)) ||
          (c.phone && c.phone.toLowerCase().includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term))
        );
      }
      return list;
    }

    // SELECT FROM QUOTES
    if (lowerSql.includes('from quotes')) {
      let list = [...store.quotes];
      if (lowerSql.includes('where id = ?')) {
        list = list.filter(q => String(q.id) === String(params[0]));
      } else if (lowerSql.includes('where customer_id = ?')) {
        list = list.filter(q => String(q.customer_id) === String(params[0]));
      } else if (lowerSql.includes('where user_id = ?')) {
        list = list.filter(q => String(q.user_id) === String(params[0]));
      }

      if (lowerSql.includes('and status = ?') || lowerSql.includes('where status = ?')) {
        const statusVal = params[params.length - 1];
        if (statusVal) list = list.filter(q => q.status === statusVal);
      }
      return list;
    }

    // SELECT FROM DISCOUNT_RULES
    if (lowerSql.includes('from discount_rules')) {
      return [...store.discount_rules];
    }

    return [];
  }

  _executeUpdate(sql, params) {
    const lowerSql = sql.toLowerCase();

    // INSERT INTO DISCOUNT_RULES
    if (lowerSql.includes('insert into discount_rules')) {
      const id = store.autoIds.discount_rules++;
      const newRule = {
        id,
        target: params[0], // Category or Product SKU
        min_quantity: params[1] || 1,
        discount_percent: params[2] || 0,
        terms: params[3] || '',
        created_at: new Date().toISOString()
      };
      store.discount_rules.push(newRule);
      return { lastID: id, changes: 1 };
    }

    // INSERT INTO USERS
    if (lowerSql.includes('insert into users')) {
      const exists = store.users.find(u => u.username === params[0]);
      if (exists) throw new Error('UNIQUE constraint failed: users.username');

      const id = store.autoIds.users++;
      const newUser = {
        id,
        username: params[0],
        password: params[1],
        name: params[2],
        role: params[3],
        max_discount_percent: params[4],
        can_approve: params[5],
        can_upload_price: params[6],
        created_at: new Date().toISOString()
      };
      store.users.push(newUser);
      return { lastID: id, changes: 1 };
    }

    // INSERT INTO PRODUCTS
    if (lowerSql.includes('insert into products')) {
      const rawCode = params[0] !== undefined && params[0] !== null ? String(params[0]).trim() : '';
      const code = rawCode.length > 0 ? rawCode : `PRD-${store.autoIds.products}`;
      const existingIdx = store.products.findIndex(p => p && p.code && p.code.toUpperCase() === code.toUpperCase());

      // Detect parameter positions based on query or param count
      let name, description, category, unit_price, min_price, stock_quantity, currency;
      
      if (params.length >= 8) {
        name = params[1] ? String(params[1]).trim() : '';
        description = params[2] || '';
        category = params[3] || 'عام';
        unit_price = parseFloat(params[4]) || 0;
        min_price = parseFloat(params[5]) || 0;
        stock_quantity = parseInt(params[6]) || 10;
        currency = params[7] || 'EGP';
      } else {
        name = params[1] ? String(params[1]).trim() : '';
        unit_price = parseFloat(params[2]) || 0;
        category = params[3] || 'عام';
        stock_quantity = parseInt(params[4]) || 10;
        description = '';
        min_price = 0;
        currency = 'EGP';
      }

      if (existingIdx > -1) {
        store.products[existingIdx] = {
          ...store.products[existingIdx],
          code,
          name: name || store.products[existingIdx].name,
          category: category || store.products[existingIdx].category,
          unit_price: unit_price > 0 ? unit_price : store.products[existingIdx].unit_price,
          stock_quantity: stock_quantity > 0 ? stock_quantity : store.products[existingIdx].stock_quantity,
          updated_at: new Date().toISOString()
        };
        saveStore();
        return { lastID: store.products[existingIdx].id, changes: 1 };
      }

      const id = store.autoIds.products++;
      const newProd = {
        id,
        code,
        name: name || `منتج ${code}`,
        description,
        category: category || 'عام',
        unit_price,
        min_price,
        stock_quantity,
        currency,
        updated_at: new Date().toISOString()
      };
      store.products.push(newProd);
      saveStore();
      return { lastID: id, changes: 1 };
    }

    // INSERT INTO CUSTOMERS
    if (lowerSql.includes('insert into customers')) {
      const id = store.autoIds.customers++;
      const newCust = {
        id,
        name: params[0],
        company: params[1],
        phone: params[2],
        email: params[3],
        address: params[4],
        tax_id: params[5],
        status: params[6] || 'lead',
        notes: params[7] || '',
        created_at: new Date().toISOString()
      };
      store.customers.push(newCust);
      return { lastID: id, changes: 1 };
    }

    // INSERT INTO QUOTES
    if (lowerSql.includes('insert into quotes')) {
      const id = store.autoIds.quotes++;
      const newQuote = {
        id,
        quote_number: params[0],
        customer_id: params[1],
        customer_name: params[2],
        user_id: params[3],
        user_name: params[4],
        total_amount: params[5],
        discount_percent: params[6],
        discount_amount: params[7],
        final_amount: params[8],
        status: params[9],
        notes: params[10],
        items_json: params[11],
        created_at: new Date().toISOString()
      };
      store.quotes.push(newQuote);
      return { lastID: id, changes: 1 };
    }

    // UPDATE USERS
    if (lowerSql.includes('update users')) {
      const userId = params[params.length - 1];
      const idx = store.users.findIndex(u => String(u.id) === String(userId));
      if (idx > -1) {
        store.users[idx].name = params[0];
        store.users[idx].role = params[1];
        store.users[idx].max_discount_percent = params[2];
        store.users[idx].can_approve = params[3];
        store.users[idx].can_upload_price = params[4];
        if (params.length > 6) store.users[idx].password = params[5];
        return { lastID: userId, changes: 1 };
      }
    }

    // UPDATE PRODUCTS
    if (lowerSql.includes('update products')) {
      const prodId = params[params.length - 1];
      const idx = store.products.findIndex(p => String(p.id) === String(prodId));
      if (idx > -1) {
        store.products[idx] = {
          ...store.products[idx],
          code: params[0],
          name: params[1],
          description: params[2],
          category: params[3],
          unit_price: params[4],
          min_price: params[5],
          stock_quantity: params[6],
          currency: params[7],
          updated_at: new Date().toISOString()
        };
        return { lastID: prodId, changes: 1 };
      }
    }

    // UPDATE CUSTOMERS
    if (lowerSql.includes('update customers')) {
      const custId = params[params.length - 1];
      const idx = store.customers.findIndex(c => String(c.id) === String(custId));
      if (idx > -1) {
        store.customers[idx] = {
          ...store.customers[idx],
          name: params[0],
          company: params[1],
          phone: params[2],
          email: params[3],
          address: params[4],
          tax_id: params[5],
          status: params[6],
          notes: params[7]
        };
        return { lastID: custId, changes: 1 };
      }
    }

    // UPDATE QUOTES STATUS
    if (lowerSql.includes('update quotes set status = ?')) {
      const quoteId = params[params.length - 1];
      const idx = store.quotes.findIndex(q => String(q.id) === String(quoteId));
      if (idx > -1) {
        store.quotes[idx].status = params[0];
        if (params[1]) store.quotes[idx].notes = params[1];
        return { lastID: quoteId, changes: 1 };
      }
    }

    // DELETE STATEMENTS
    if (lowerSql.includes('delete from discount_rules')) {
      if (lowerSql.includes('where id = ?')) {
        store.discount_rules = store.discount_rules.filter(r => String(r.id) !== String(params[0]));
      } else {
        store.discount_rules = [];
      }
      return { changes: 1 };
    }
    if (lowerSql.includes('delete from users')) {
      store.users = store.users.filter(u => String(u.id) !== String(params[0]));
      return { changes: 1 };
    }
    if (lowerSql.includes('delete from products')) {
      if (lowerSql.includes('where ids in')) {
        const idList = (params[0] || []).map(id => String(id));
        const initialCount = store.products.length;
        store.products = store.products.filter(p => !idList.includes(String(p.id)));
        return { changes: initialCount - store.products.length };
      } else if (lowerSql.includes('where id =')) {
        store.products = store.products.filter(p => String(p.id) !== String(params[0]));
        return { changes: 1 };
      } else {
        const count = store.products.length;
        store.products = [];
        return { changes: count };
      }
    }
    if (lowerSql.includes('delete from customers')) {
      store.customers = store.customers.filter(c => String(c.id) !== String(params[0]));
      return { changes: 1 };
    }
    if (lowerSql.includes('delete from quotes')) {
      store.quotes = store.quotes.filter(q => String(q.id) !== String(params[0]));
      return { changes: 1 };
    }

    return { changes: 0 };
  }
  saveSync() {
    saveStoreSync();
  }
}

const db = new DatabaseDriver();
console.log('Connected to Pure JS Database Engine at', dbFilePath);

module.exports = db;
