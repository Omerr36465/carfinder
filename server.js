const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// تحميل متغيرات البيئة
dotenv.config();

// استيراد توصيل قاعدة البيانات
const connectDB = require('./config/db');

// توصيل قاعدة البيانات
connectDB();

// إنشاء تطبيق Express
const app = express();

// الإعدادات الأساسية
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// إنشاء مجلد التحميلات إذا لم يكن موجودًا
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  fs.mkdirSync(path.join(uploadDir, 'cars'));
  fs.mkdirSync(path.join(uploadDir, 'reports'));
  fs.mkdirSync(path.join(uploadDir, 'users'));
}

// إعداد المجلد الثابت للملفات المرفوعة
app.use(`/${uploadDir}`, express.static(path.join(__dirname, uploadDir)));

// إعداد المجلد الثابت للوحة التحكم
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// تسجيل مسارات API
const userRoutes = require('./api/routes/userRoutes');
const carRoutes = require('./api/routes/carRoutes');
const reportRoutes = require('./api/routes/reportRoutes');
const adminRoutes = require('./api/routes/adminRoutes');

app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// مسار الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    message: 'مرحبًا بك في واجهة برمجة تطبيقات إيجاد السيارات المسروقة في السودان',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      cars: '/api/cars',
      reports: '/api/reports',
      admin: '/api/admin'
    }
  });
});

// التعامل مع المسارات غير الموجودة
app.use((req, res) => {
  res.status(404).json({ message: 'المسار غير موجود' });
});

// التعامل مع الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// تشغيل الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});

module.exports = app;
