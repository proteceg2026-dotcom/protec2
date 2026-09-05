const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

// Read existing database.json
let dbData = {
  users: [],
  products: [],
  customers: [],
  quotes: [],
  activity_logs: [],
  discount_rules: [],
  autoIds: { users: 1, products: 1, customers: 1, quotes: 1, activity_logs: 1, discount_rules: 1 }
};

if (fs.existsSync(dbPath)) {
  try {
    dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!dbData.discount_rules) dbData.discount_rules = [];
    if (!dbData.autoIds) dbData.autoIds = { users: 1, products: 1, customers: 1, quotes: 1, activity_logs: 1, discount_rules: 1 };
    if (!dbData.autoIds.discount_rules) dbData.autoIds.discount_rules = 1;
  } catch (e) {
    console.error('Error reading database.json:', e);
  }
}

const newProductsList = [
  // Page 1
  { code: '1213', name: 'خرطوم 13 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 17.2 مم و قطر داخلي 13 مم طول اللفة 45 متر (رمادى)', price: 1119.99, cat: 'خرطوم حراري', disc: 10 },
  { code: '1216', name: 'خرطوم 16 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 20.6 مم و قطر داخلي 16 مم طول اللفة 45 متر (رمادى)', price: 1463.68, cat: 'خرطوم حراري', disc: 10 },
  { code: '1219', name: 'خرطوم 19 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 23.8 مم و قطر داخلي 19 مم طول اللفة 45 متر (رمادى)', price: 1885.89, cat: 'خرطوم حراري', disc: 10 },
  { code: '1223', name: 'خرطوم 23 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 28.2 مم و قطر داخلي 23 مم طول اللفة 45 متر (رمادى)', price: 2364.41, cat: 'خرطوم حراري', disc: 10 },
  { code: '1229', name: 'خرطوم 29 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 35.6 مم و قطر داخلي 29 مم طول اللفة 45 متر (رمادى)', price: 3678.33, cat: 'خرطوم حراري', disc: 10 },
  { code: '1236', name: 'خرطوم 36 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 43.6 مم و قطر داخلي 36 مم طول اللفة 22.5 متر (رمادى)', price: 2716.24, cat: 'خرطوم حراري', disc: 10 },
  { code: '1248', name: 'خرطوم 48 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 54.5 مم و قطر داخلي 48 مم طول اللفة 25 متر (رمادى)', price: 3208.84, cat: 'خرطوم حراري', disc: 10 },
  { code: '2216', name: 'خرطوم 16 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 16 مم و قطر داخلي 11.7 مم طول اللفة 50 متر (رمادى)', price: 1375.30, cat: 'خرطوم حراري', disc: 10 },
  { code: '2220', name: 'خرطوم 20 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 20 مم و قطر داخلي 15.5 مم طول اللفة 50 متر (رمادى)', price: 1599.34, cat: 'خرطوم حراري', disc: 10 },
  { code: '2225', name: 'خرطوم 25 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 25 مم و قطر داخلي 19.8 مم طول اللفة 50 متر (رمادى)', price: 2335.13, cat: 'خرطوم حراري', disc: 10 },
  { code: '2232', name: 'خرطوم 32 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 32 مم و قطر داخلي 26.4 مم طول اللفة 50 متر (رمادى)', price: 3037.12, cat: 'خرطوم حراري', disc: 10 },
  { code: '2240', name: 'خرطوم 40 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 40 مم و قطر داخلي 34 طول اللفة 25 متر (رمادى)', price: 2127.97, cat: 'خرطوم حراري', disc: 10 },
  { code: '2250', name: 'خرطوم 50 مم بولي ايثيلين(مقاوم للحريق) قطر خارجي 50 مم و قطر داخلي 43.5 مم طول اللفة 25 متر (رمادى)', price: 3039.94, cat: 'خرطوم حراري', disc: 10 },
  { code: '4120', name: 'ماسورة 20 مم UPVC سمك خفيف قطر خارجي 20 قطر داخلي 17.4 مم اللفة= 34 ×3 متر (أبيض)', price: 1777.18, cat: 'UPVC', disc: 17 },
  { code: '4125', name: 'ماسورة 25 مم UPVC سمك خفيف قطر خارجي 25 قطر داخلي 22.1 مم اللفة= 20 ×3 متر (أبيض)', price: 1522.03, cat: 'UPVC', disc: 17 },
  { code: '4132', name: 'ماسورة 32 مم UPVC سمك خفيف قطر خارجي 32 قطر داخلي 28.6 مم اللفة= 15 ×3 متر (أبيض)', price: 1526.90, cat: 'UPVC', disc: 17 },
  { code: '4140', name: 'ماسورة 40 مم UPVC سمك خفيف قطر خارجي 40 قطر داخلي 35.8 مم اللفة= 10 ×3 متر (أبيض)', price: 1549.89, cat: 'UPVC', disc: 17 },

  // Page 2
  { code: '4150', name: 'ماسورة 50 مم UPVC سمك خفيف قطر خارجي 50 قطر داخلي 45.1 مم اللفة= 5 ×3 متر (أبيض)', price: 1122.37, cat: 'UPVC', disc: 17 },
  { code: '4163', name: 'ماسورة 63 مم UPVC سمك خفيف قطر خارجي 63 قطر داخلي 57 مم اللفة= 5 ×3 متر (أبيض)', price: 1752.84, cat: 'UPVC', disc: 17 },
  { code: '4220', name: 'ماسورة 20 مم UPVC سمك متوسط قطر خارجي 20 قطر داخلي 16.9 مم اللفة= 34 ×3 متر (أبيض)', price: 2097.02, cat: 'UPVC', disc: 17 },
  { code: '4225', name: 'ماسورة 25 مم UPVC سمك متوسط قطر خارجي 25 قطر داخلي 21.4 مم اللفة= 20 ×3 متر (أبيض)', price: 1836.72, cat: 'UPVC', disc: 17 },
  { code: '4232', name: 'ماسورة 32 مم UPVC سمك متوسط قطر خارجي 32 قطر داخلي 27.8 مم اللفة= 15 ×3 متر (أبيض)', price: 1888.12, cat: 'UPVC', disc: 17 },
  { code: '4240', name: 'ماسورة 40 مم UPVC سمك متوسط قطر خارجي 40 قطر داخلي 35.4 مم اللفة= 10 ×3 متر (أبيض)', price: 1684.65, cat: 'UPVC', disc: 17 },
  { code: '4250', name: 'ماسورة 50 مم UPVC سمك متوسط قطر خارجي 50 قطر داخلي 44.3 مم اللفة= 5 ×3 متر (أبيض)', price: 1297.44, cat: 'UPVC', disc: 17 },
  { code: '4320/1', name: 'ماسورة 20 مم UPVC سمك ثقيل قطر خارجي 20 قطر داخلي 16.4 مم اللفة= 34 ×3 متر (أبيض)', price: 2407.37, cat: 'UPVC', disc: 17 },
  { code: '4320', name: 'ماسورة 20 مم UPVC سمك ثقيل قطر خارجي 20 قطر داخلي 15.8 مم اللفة= 34 ×3 متر (أبيض)', price: 2576.76, cat: 'UPVC', disc: 17 },
  { code: '4325/1', name: 'ماسورة 25 مم UPVC سمك ثقيل قطر خارجي 25 قطر داخلي 21.1 مم اللفة= 20 ×3 متر (أبيض)', price: 1958.47, cat: 'UPVC', disc: 17 },
  { code: '4325', name: 'ماسورة 25 مم UPVC سمك ثقيل قطر خارجي 25 قطر داخلي 20.6 مم اللفة= 20 ×3 متر (أبيض)', price: 2097.02, cat: 'UPVC', disc: 17 },
  { code: '4332', name: 'ماسورة 32 مم UPVC سمك ثقيل قطر خارجي 32 قطر داخلي 26.6 مم اللفة= 15 ×3 متر (أبيض)', price: 2404.67, cat: 'UPVC', disc: 17 },
  { code: '4340', name: 'ماسورة 40 مم UPVC سمك ثقيل قطر خارجي 40 قطر داخلي 34.4 مم اللفة= 10 ×3 متر (أبيض)', price: 2038.56, cat: 'UPVC', disc: 17 },
  { code: '4350', name: 'ماسورة 50 مم UPVC سمك ثقيل قطر خارجي 50 قطر داخلي 43.2 مم اللفة= 5 ×3 متر (أبيض)', price: 1537.44, cat: 'UPVC', disc: 17 },
  { code: '3113', name: 'ماسورة 13 مم UPVC قطر خارجي 14.4 قطر داخلي 13 مم اللفة= 34 ×3 متر (رمادى)', price: 797.41, cat: 'UPVC', disc: 17 },
  { code: '3116', name: 'ماسورة 16 مم UPVC قطر خارجي 18 قطر داخلي 16 مم اللفة = 34 ×3 متر (رمادى)', price: 1249.56, cat: 'UPVC', disc: 17 },
  { code: '3119', name: 'ماسورة 19 مم UPVC قطر خارجي 21 قطر داخلي 19 مم اللفة= 34 ×3 متر (رمادى)', price: 1588.85, cat: 'UPVC', disc: 17 },

  // Page 3
  { code: '3123', name: 'ماسورة 23 مم UPVC قطر خارجي 25 قطر داخلي 23 مم اللفة = 34 ×3 متر (رمادى)', price: 2144.77, cat: 'UPVC', disc: 17 },
  { code: '3129', name: 'ماسورة 29 مم UPVC قطر خارجي 31.5 قطر داخلي 29 مم اللفة= 34 ×3 متر (رمادى)', price: 2778.06, cat: 'UPVC', disc: 17 },
  { code: '3136', name: 'ماسورة 36 مم UPVC قطر خارجي 39 قطر داخلي 36 مم اللفة = 34 ×3 متر (رمادى)', price: 3697.36, cat: 'UPVC', disc: 17 },
  { code: '3120', name: 'ماسورة 20 مم UPVC قطر خارجي 20 قطر داخلي 17 مم اللفة= 34 ×3 متر (رمادى)', price: 2098.51, cat: 'UPVC', disc: 17 },
  { code: '3125', name: 'ماسورة 25 مم UPVC قطر خارجي 25 قطر داخلي 22 مم اللفة= 20 ×3 متر (رمادى)', price: 1596.90, cat: 'UPVC', disc: 17 },
  { code: '3132', name: 'ماسورة 32 مم UPVC قطر خارجي 32 قطر داخلي 28.4 مم اللفة= 15 ×3 متر (رمادى)', price: 1800.72, cat: 'UPVC', disc: 17 },
  { code: '3140', name: 'ماسورة 40 مم UPVC قطر خارجي 40 قطر داخلي 36.2 مم اللفة= 10 ×3 متر (رمادى)', price: 1608.07, cat: 'UPVC', disc: 17 },
  { code: '3150', name: 'ماسورة 50 مم UPVC قطر خارجي 50 قطر داخلي 45.2 مم اللفة= 5 ×3 متر (رمادى)', price: 1218.98, cat: 'UPVC', disc: 17 },
  { code: '3163', name: 'ماسورة 63 مم UPVC قطر خارجي 63 قطر داخلي 57 مم اللفة= 5 ×3 متر (رمادى)', price: 1988.51, cat: 'UPVC', disc: 17 },
  { code: '5212', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 12 مم وقطر خارجى 16.8 مم طول اللفة 30 متر (رمادى)', price: 573.08, cat: 'UPVC', disc: 17 },
  { code: '5214', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 14 مم وقطر خارجى 18.5 مم طول اللفة 30 متر (رمادى)', price: 675.63, cat: 'UPVC', disc: 17 },
  { code: '5216', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 16 مم وقطر خارجى 21 مم طول اللفة 30 متر (رمادى)', price: 799.29, cat: 'UPVC', disc: 17 },
  { code: '5220', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 20 مم وقطر خارجى 24.7 مم طول اللفة 30 متر (رمادى)', price: 1025.53, cat: 'UPVC', disc: 17 },
  { code: '5222', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 22 مم وقطر خارجى 26.7 مم طول اللفة 30 متر (رمادى)', price: 1085.86, cat: 'UPVC', disc: 17 },
  { code: '5225', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 25 مم وقطر خارجى 31.1 مم طول اللفة 30 متر (رمادى)', price: 1194.41, cat: 'UPVC', disc: 17 },
  { code: '5232', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 32 مم وقطر خارجى 38 مم طول اللفة 30 متر (رمادى)', price: 1809.75, cat: 'UPVC', disc: 17 },
  { code: '5235', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 35 مم وقطر خارجى 41 مم طول اللفة 30 متر (رمادى)', price: 2232.02, cat: 'UPVC', disc: 17 },

  // Page 4
  { code: '5240', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 40 مم وقطر خارجى 46 مم طول اللفة 30 متر (رمادى)', price: 2298.39, cat: 'UPVC', disc: 17 },
  { code: '5250', name: 'لفة فلكسبل UPVC مقاوم للحريق قطر داخلى 50 مم وقطر خارجى 56.5 مم طول اللفة 30 متر (رمادى)', price: 3227.39, cat: 'UPVC', disc: 17 },
  { code: '4420/1', name: 'جلبة ماسورة 20 مم UPVC (أبيض)', price: 3.73, cat: 'UPVC', disc: 17 },
  { code: '4425/1', name: 'جلبة ماسورة 25 مم UPVC (أبيض)', price: 4.17, cat: 'UPVC', disc: 17 },
  { code: '4432/1', name: 'جلبة ماسورة 32 مم UPVC (أبيض)', price: 6.04, cat: 'UPVC', disc: 17 },
  { code: '4440/1', name: 'جلبة ماسورة 40 مم UPVC (أبيض)', price: 10.15, cat: 'UPVC', disc: 17 },
  { code: '4450/1', name: 'جلبة ماسورة 50 مم UPVC (أبيض)', price: 16.62, cat: 'UPVC', disc: 17 },
  { code: '4463/1', name: 'جلبة ماسورة 63 مم UPVC (أبيض)', price: 24.93, cat: 'UPVC', disc: 17 },
  { code: '4425/20', name: 'جلبة UPVC مخفضة 20/25 مم (أبيض)', price: 7.25, cat: 'UPVC', disc: 17 },
  { code: '4432/25', name: 'جلبة UPVC مخفضة 25/32 مم (أبيض)', price: 11.84, cat: 'UPVC', disc: 17 },
  { code: '4440/32', name: 'جلبة UPVC مخفضة 32/40 مم (أبيض)', price: 14.98, cat: 'UPVC', disc: 17 },
  { code: '4450/40', name: 'جلبة UPVC مخفضة 40/50 مم (أبيض)', price: 24.16, cat: 'UPVC', disc: 17 },
  { code: 'EC 20', name: 'جلبة تمدد لماسورة 20 مم PVC (أبيض)', price: 6.76, cat: 'UPVC', disc: 17 },
  { code: 'EC 25', name: 'جلبة تمدد لماسورة 25 مم PVC (أبيض)', price: 9.92, cat: 'UPVC', disc: 17 },
  { code: 'EC 32', name: 'جلبة تمدد لماسورة 32 مم PVC (أبيض)', price: 12.43, cat: 'UPVC', disc: 17 },
  { code: 'EC 40', name: 'جلبة تمدد لماسورة 40 مم PVC (أبيض)', price: 18.36, cat: 'UPVC', disc: 17 },
  { code: 'EC 50', name: 'جلبة تمدد لماسورة 50 مم PVC (أبيض)', price: 24.65, cat: 'UPVC', disc: 17 },
  { code: '4520/2', name: 'كوع ماسورة 20 مم UPVC (أبيض)', price: 5.88, cat: 'UPVC', disc: 17 },
  { code: '4525/2', name: 'كوع ماسورة 25 مم UPVC (أبيض)', price: 9.42, cat: 'UPVC', disc: 17 },
  { code: '4520/1', name: 'كوع ماسورة 20 مم UPVC (أبيض)', price: 8.21, cat: 'UPVC', disc: 17 },
  { code: '4525/1', name: 'كوع ماسورة 25 مم UPVC (أبيض)', price: 12.09, cat: 'UPVC', disc: 17 },
  { code: '4532', name: 'كوع ماسورة 32 مم UPVC (أبيض)', price: 18.89, cat: 'UPVC', disc: 17 },
  { code: '4540', name: 'كوع ماسورة 40 مم UPVC (أبيض)', price: 26.08, cat: 'UPVC', disc: 17 },
  { code: '4550', name: 'كوع ماسورة 50 مم UPVC (أبيض)', price: 37.93, cat: 'UPVC', disc: 17 },
  { code: '4563', name: 'كوع ماسورة 63 مم UPVC (أبيض)', price: 85.76, cat: 'UPVC', disc: 17 },
  { code: '4520/6', name: 'وصلة تقاطع مواسير 20 مم UPVC (أبيض)', price: 8.18, cat: 'UPVC', disc: 17 },
  { code: '4525/6', name: 'وصلة تقاطع مواسير 25 مم UPVC (أبيض)', price: 10.88, cat: 'UPVC', disc: 17 },
  { code: '4601', name: 'غطاء بواط دائري UPVC (أبيض)', price: 3.63, cat: 'UPVC', disc: 17 },
  { code: '4620/1', name: 'بواط اية UPVC لماسورة 20 مم (أبيض)', price: 13.05, cat: 'UPVC', disc: 17 },
  { code: '4625/1', name: 'بواط اية UPVC لماسورة 25 مم (أبيض)', price: 14.26, cat: 'UPVC', disc: 17 },
  { code: '4620/2', name: 'بواط إمتداد UPVC لماسورة 20 مم (أبيض)', price: 14.50, cat: 'UPVC', disc: 17 },
  { code: '4625/2', name: 'بواط إمتداد UPVC لماسورة 25 مم (أبيض)', price: 15.70, cat: 'UPVC', disc: 17 },

  // Page 5
  { code: '4620/12', name: 'بواط زاويّة UPVC لماسورة 20 مم (أبيض)', price: 14.50, cat: 'UPVC', disc: 17 },
  { code: '4625/12', name: 'بواط زاويّة UPVC لماسورة 25 مم (أبيض)', price: 15.70, cat: 'UPVC', disc: 17 },
  { code: '4620/3', name: 'بواط ثلاثي UPVC لماسورة 20 مم (أبيض)', price: 15.70, cat: 'UPVC', disc: 17 },
  { code: '4625/3', name: 'بواط ثلاثي UPVC لماسورة 25 مم (أبيض)', price: 17.40, cat: 'UPVC', disc: 17 },
  { code: '4620/4', name: 'بواط ر عي UPVC لماسورة 20 مم (أبيض)', price: 17.88, cat: 'UPVC', disc: 17 },
  { code: '4625/4', name: 'بواط ر عي UPVC لماسورة 25 مم (أبيض)', price: 19.09, cat: 'UPVC', disc: 17 },
  { code: '4620/U', name: 'بواط UPVC شكل U لماسورة 20 مم (أبيض)', price: 17.52, cat: 'UPVC', disc: 17 },
  { code: '4625/U', name: 'بواط UPVC شكل U لماسورة 25 مم (أبيض)', price: 20.41, cat: 'UPVC', disc: 17 },
  { code: '4620/Y', name: 'بواط UPVC شكل Y لماسورة 20 مم (أبيض)', price: 21.26, cat: 'UPVC', disc: 17 },
  { code: '4625/Y', name: 'بواط UPVC شكل Y لماسورة 25 مم (أبيض)', price: 21.74, cat: 'UPVC', disc: 17 },
  { code: '4620/H', name: 'بواط UPVC شكل H لماسورة 20 مم (أبيض)', price: 22.47, cat: 'UPVC', disc: 17 },
  { code: '4625/H', name: 'بواط UPVC شكل H لماسورة 25 مم (أبيض)', price: 23.68, cat: 'UPVC', disc: 17 },
  { code: '4910', name: 'بواط 10×10 UPVC لغطاء (أبيض)', price: 38.66, cat: 'UPVC', disc: 17 },
  { code: '4720', name: 'أدابتور UPVC لماسورة 20 مم (أبيض)', price: 7.14, cat: 'UPVC', disc: 17 },
  { code: '4725', name: 'أدابتور UPVC لماسورة 25 مم (أبيض)', price: 9.67, cat: 'UPVC', disc: 17 },
  { code: '4732', name: 'أدابتور UPVC لماسورة 32 مم (أبيض)', price: 11.84, cat: 'UPVC', disc: 17 },
  { code: '4740', name: 'أدابتور UPVC لماسورة 40 مم (أبيض)', price: 21.74, cat: 'UPVC', disc: 17 },
  { code: '4750', name: 'أدابتور UPVC لماسورة 50 مم (أبيض)', price: 35.51, cat: 'UPVC', disc: 17 },
  { code: '5716', name: 'ادابتور فلكسبل 16 مم', price: 17.88, cat: 'UPVC', disc: 17 },
  { code: '5720', name: 'ادابتور فلكسبل 20 مم', price: 22.24, cat: 'UPVC', disc: 17 },
  { code: '5725', name: 'ادابتور فلكسبل 25 مم', price: 30.45, cat: 'UPVC', disc: 17 },
  { code: '5732', name: 'ادابتور فلكسبل 32 مم', price: 33.82, cat: 'UPVC', disc: 17 },
  { code: '5740', name: 'ادابتور فلكسبل 40 مم', price: 55.08, cat: 'UPVC', disc: 17 },
  { code: '5750', name: 'ادابتور فلكسبل 50 مم', price: 65.23, cat: 'UPVC', disc: 17 },
  { code: '4800', name: 'حلقة إمتداد بواط UPVC إرتفاع 32 مم (أبيض)', price: 14.01, cat: 'UPVC', disc: 17 },
  { code: '4820', name: 'حلقة إمتداد بواط UPVC إرتفاع 20 مم (أبيض)', price: 9.67, cat: 'UPVC', disc: 17 },
  { code: '4840', name: 'حلقة إمتداد بواط UPVC إرتفاع 40 مم (أبيض)', price: 16.90, cat: 'UPVC', disc: 17 },
  { code: '4907', name: 'علبة ماجيك 7×10 UPVC (أبيض)', price: 17.63, cat: 'UPVC', disc: 17 },
  { code: '4907/1', name: 'علبة مفتاح مقاس 7.4*7.4 UPVC (أبيض)', price: 18.36, cat: 'UPVC', disc: 17 },
  { code: '4907/2', name: 'علبة مفتاح مقاس 7.4*13.43 UPVC (أبيض)', price: 19.09, cat: 'UPVC', disc: 17 },
  { code: '4907/1M', name: 'علبة مفتاح مقاس 7.4*7.4 UPVC عمق 5 سم (أبيض)', price: 22.63, cat: 'UPVC', disc: 17 },
  { code: '4907/2MF', name: 'علبة مفتاح مقاس 7.4*13.43 UPVC عمق 5 سم (أبيض)', price: 36.24, cat: 'UPVC', disc: 17 },
  { code: '4020', name: 'أفيز 20 مم UPVC (أبيض)', price: 6.39, cat: 'UPVC', disc: 17 },
  { code: '4025', name: 'أفيز 25 مم UPVC (أبيض)', price: 9.01, cat: 'UPVC', disc: 17 },

  // Page 6 & 7 & 8 & 9
  { code: '4032', name: 'أفيز 32 مم UPVC (أبيض)', price: 12.32, cat: 'UPVC', disc: 17 },
  { code: '4040', name: 'أفيز 40 مم UPVC (أبيض)', price: 16.90, cat: 'UPVC', disc: 17 },
  { code: '4050', name: 'أفيز 50 مم UPVC (أبيض)', price: 21.26, cat: 'UPVC', disc: 17 },
  { code: '4020/1', name: 'أفيز 20 مم UPVC بدون قاعدة (أبيض)', price: 4.17, cat: 'UPVC', disc: 17 },
  { code: '4025/1', name: 'أفيز 25 مم UPVC بدون قاعدة (أبيض)', price: 4.83, cat: 'UPVC', disc: 17 },
  { code: '4032/1', name: 'أفيز 32 مم UPVC بدون قاعدة (أبيض)', price: 6.57, cat: 'UPVC', disc: 17 },
  { code: '4040/1', name: 'أفيز 40 مم UPVC بدون قاعدة (أبيض)', price: 8.79, cat: 'UPVC', disc: 17 },
  { code: '4050/1', name: 'أفيز 50 مم UPVC بدون قاعدة (أبيض)', price: 12.95, cat: 'UPVC', disc: 17 },

  { code: '34050P', name: 'ماسورة 50 مم UPVC رأس و ذيل قطر خارجي 50 مم سمك 1.8 مم 6 ر الماسورة = 3 متر (رمادي)', price: 196.71, cat: 'مواسير رمادي', disc: 10 },
  { code: '34075P', name: 'ماسورة 50 مم UPVC رأس و ذيل قطر خارجي 50 مم سمك 1.8 مم 6 ر الماسورة = 6 متر (رمادي)', price: 393.69, cat: 'مواسير رمادي', disc: 10 },
  { code: '34090P', name: 'ماسورة 50 مم UPVC رأس و ذيل قطر خارجي 50 مم سمك 1.8 مم 6 ر الماسورة = 3 متر لجوان (رمادي)', price: 201.57, cat: 'مواسير رمادي', disc: 10 },
  { code: '34110P', name: 'ماسورة 50 مم UPVC رأس و ذيل قطر خارجي 50 مم سمك 1.8 مم 6 ر الماسورة = 6 متر لجوان (رمادي)', price: 403.18, cat: 'مواسير رمادي', disc: 10 },
  { code: '34125P', name: 'ماسورة 75 مم UPVC رأس و ذيل قطر خارجي 75 مم سمك 2.2 مم 6 ر الماسورة = 3 متر (رمادي)', price: 372.60, cat: 'مواسير رمادي', disc: 10 },
  { code: '34140P', name: 'ماسورة 75 مم UPVC رأس و ذيل قطر خارجي 75 مم سمك 2.2 مم 6 ر الماسورة = 6 متر (رمادي)', price: 722.46, cat: 'مواسير رمادي', disc: 10 },
  { code: '34160P', name: 'ماسورة 75 مم UPVC رأس و ذيل قطر خارجي 75 مم سمك 2.2 مم 6 ر الماسورة = 3 متر لجوان (رمادي)', price: 384.22, cat: 'مواسير رمادي', disc: 10 },
  { code: '34200P', name: 'ماسورة 75 مم UPVC رأس و ذيل قطر خارجي 75 مم سمك 2.2 مم 6 ر الماسورة = 6 متر لجوان (رمادي)', price: 744.09, cat: 'مواسير رمادي', disc: 10 },
  { code: '34050J', name: 'ماسورة 90 مم UPVC رأس و ذيل قطر خارجي 90 مم سمك 2.7 مم 6 ر الماسورة = 3 متر (رمادي)', price: 546.58, cat: 'مواسير رمادي', disc: 10 },
  { code: '34075J', name: 'ماسورة 90 مم UPVC رأس و ذيل قطر خارجي 90 مم سمك 2.7 مم 6 ر الماسورة = 6 متر (رمادي)', price: 1060.69, cat: 'مواسير رمادي', disc: 10 },
  { code: '34090J', name: 'ماسورة 90 مم UPVC رأس و ذيل قطر خارجي 90 مم سمك 2.7 مم 6 ر الماسورة = 3 متر لجوان (رمادي)', price: 537.92, cat: 'مواسير رمادي', disc: 10 },
  { code: '34110J', name: 'ماسورة 90 مم UPVC رأس و ذيل قطر خارجي 90 مم سمك 2.7 مم 6 ر الماسورة = 6 متر لجوان (رمادي)', price: 1095.31, cat: 'مواسير رمادي', disc: 10 },
  { code: '34125J', name: 'ماسورة 110 مم UPVC رأس و ذيل قطر خارجي 110 مم سمك 3.2 مم 6 ر الماسورة = 3 متر (رمادي)', price: 792.80, cat: 'مواسير رمادي', disc: 10 },
  { code: '34140J', name: 'ماسورة 110 مم UPVC رأس و ذيل قطر خارجي 110 مم سمك 3.2 مم 6 ر الماسورة = 6 متر (رمادي)', price: 1539.61, cat: 'مواسير رمادي', disc: 10 },
  { code: '34160J', name: 'ماسورة 110 مم UPVC رأس و ذيل قطر خارجي 110 مم سمك 3.2 مم 6 ر الماسورة = 3 متر لجوان (رمادي)', price: 773.86, cat: 'مواسير رمادي', disc: 10 },
  { code: '34200J', name: 'ماسورة 110 مم UPVC رأس و ذيل قطر خارجي 110 مم سمك 3.2 مم 6 ر الماسورة = 6 متر لجوان (رمادي)', price: 1588.31, cat: 'مواسير رمادي', disc: 10 },
  { code: '34250J', name: 'ماسورة 125 مم UPVC رأس و ذيل قطر خارجي 125 مم سمك 3.7 مم 6 ر الماسورة = 3 متر (رمادي)', price: 1001.15, cat: 'مواسير رمادي', disc: 10 },

  { code: 'S/4120', name: 'سوستة تكريب ماسورة 20 مم UPVC سمك خفيف', price: 160.03, cat: 'سوسته', disc: 0 },
  { code: 'S/4125', name: 'سوستة تكريب ماسورة 25 مم UPVC سمك خفيف', price: 182.85, cat: 'سوسته', disc: 0 },
  { code: 'S/4132', name: 'سوستة تكريب ماسورة 32 مم UPVC سمك خفيف', price: 274.26, cat: 'سوسته', disc: 0 },
  { code: 'S/4140', name: 'سوستة تكريب ماسورة 40 مم UPVC سمك خفيف', price: 480.09, cat: 'سوسته', disc: 0 },
  { code: 'S/4150', name: 'سوستة تكريب ماسورة 50 مم UPVC سمك خفيف', price: 685.73, cat: 'سوسته', disc: 0 },
  { code: 'S/4220', name: 'سوستة تكريب ماسورة 20 مم UPVC سمك متوسط', price: 160.03, cat: 'سوسته', disc: 0 },
  { code: 'S/4225', name: 'سوستة تكريب ماسورة 25 مم UPVC سمك متوسط', price: 182.85, cat: 'سوسته', disc: 0 },
  { code: 'S/4232', name: 'سوستة تكريب ماسورة 32 مم UPVC سمك متوسط', price: 274.26, cat: 'سوسته', disc: 0 },
  { code: 'S/4240', name: 'سوستة تكريب ماسورة 40 مم UPVC سمك متوسط', price: 480.09, cat: 'سوسته', disc: 0 },
  { code: 'S/4250', name: 'سوستة تكريب ماسورة 50 مم UPVC سمك متوسط', price: 685.73, cat: 'سوسته', disc: 0 }
];

let addedCount = 0;
let updatedCount = 0;

newProductsList.forEach(item => {
  const existingIdx = dbData.products.findIndex(p => p && p.code && p.code.toUpperCase() === item.code.toUpperCase());
  
  if (existingIdx > -1) {
    dbData.products[existingIdx] = {
      ...dbData.products[existingIdx],
      code: item.code,
      name: item.name,
      unit_price: item.price,
      category: item.cat,
      updated_at: new Date().toISOString()
    };
    updatedCount++;
  } else {
    const id = dbData.autoIds.products++;
    dbData.products.push({
      id,
      code: item.code,
      name: item.name,
      description: item.name,
      category: item.cat,
      unit_price: item.price,
      min_price: item.price * 0.9,
      stock_quantity: 50,
      currency: 'EGP',
      updated_at: new Date().toISOString()
    });
    addedCount++;
  }

  // Add Family Discount Rule if discount > 0
  if (item.disc > 0) {
    const ruleExists = dbData.discount_rules.some(r => r.target === item.cat);
    if (!ruleExists) {
      const ruleId = dbData.autoIds.discount_rules++;
      dbData.discount_rules.push({
        id: ruleId,
        target: item.cat,
        min_quantity: 1,
        discount_percent: item.disc,
        terms: `خصم تلقائي عائلة ${item.cat}`,
        created_at: new Date().toISOString()
      });
    }
  }
});

fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
console.log(`Done! Added ${addedCount} new products, updated ${updatedCount} existing products. Total in catalog: ${dbData.products.length}`);
