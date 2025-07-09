# Scripts

## إنشاء مدير نظام

### الطريقة الأولى: استخدام npm script
```bash
npm run create-admin
```

### الطريقة الثانية: تشغيل مباشر
```bash
node scripts/create-admin.js
```

### الطريقة الثالثة: مع متغيرات البيئة
```bash
MONGODB_URI="mongodb://localhost:27017/arabic_erp" npm run create-admin
```

## المتطلبات

- Node.js
- MongoDB متاح ويعمل
- متغير البيئة `MONGODB_URI` (اختياري)

## الاستخدام

1. شغل الأمر `npm run create-admin`
2. أدخل رابط MongoDB (أو اتركه فارغاً للاستخدام الافتراضي)
3. أدخل اسم المدير
4. أدخل البريد الإلكتروني
5. أدخل كلمة المرور (ستظهر كنجوم للأمان)

## ملاحظات

- كلمة المرور يجب أن تكون 6 أحرف على الأقل
- البريد الإلكتروني يجب أن يكون صحيحاً وغير مستخدم
- المدير المُنشأ سيحصل على جميع صلاحيات النظام
- يمكن إلغاء العملية بالضغط على Ctrl+C

## أمثلة

### إنشاء مدير محلي
```bash
npm run create-admin
# MongoDB URI: (اتركه فارغاً)
# الاسم: أحمد محمد
# البريد: admin@company.com
# كلمة المرور: admin123
```

### إنشاء مدير مع قاعدة بيانات خارجية
```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/arabic_erp" npm run create-admin
```