const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// استيراد نموذج المستخدم
const User = require('../models/User');

// إعداد تخزين الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/users');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'user-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 ميجابايت
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('يجب أن تكون الصورة بتنسيق jpeg أو jpg أو png فقط'));
  }
});

// التحقق من رمز المصادقة
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'الوصول مرفوض، يرجى تسجيل الدخول' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'المستخدم غير موجود أو غير نشط' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'الرمز غير صالح أو منتهي الصلاحية' });
  }
};

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, location } = req.body;
    
    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    // إنشاء مستخدم جديد
    const user = new User({
      name,
      email,
      phone,
      password,
      location
    });
    
    await user.save();
    
    // إنشاء رمز المصادقة
    const token = user.generateAuthToken();
    
    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الحساب', error: error.message });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // البحث عن المستخدم
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }
    
    // التحقق من كلمة المرور
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }
    
    // التحقق من حالة الحساب
    if (!user.isActive) {
      return res.status(401).json({ message: 'الحساب معطل، يرجى التواصل مع الإدارة' });
    }
    
    // إنشاء رمز المصادقة
    const token = user.generateAuthToken();
    
    // تحديث رمز FCM إذا كان موجودًا
    if (req.body.fcmToken) {
      user.fcmToken = req.body.fcmToken;
      await user.save();
    }
    
    res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول', error: error.message });
  }
});

// تسجيل الخروج
router.post('/logout', auth, async (req, res) => {
  try {
    // إزالة رمز FCM
    req.user.fcmToken = '';
    await req.user.save();
    
    res.status(200).json({ message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الخروج', error: error.message });
  }
});

// الحصول على بيانات المستخدم الحالي
router.get('/me', auth, async (req, res) => {
  try {
    res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        location: req.user.location,
        profileImage: req.user.profileImage,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات المستخدم', error: error.message });
  }
});

// تحديث بيانات المستخدم
router.put('/update', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'phone', 'location'];
    const updateFields = {};
    
    // التحقق من الحقول المسموح بتحديثها
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateFields[key] = updates[key];
      }
    });
    
    // إضافة الصورة الشخصية إذا كانت موجودة
    if (req.file) {
      updateFields.profileImage = `/uploads/users/${req.file.filename}`;
    }
    
    // تحديث بيانات المستخدم
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    res.status(200).json({
      message: 'تم تحديث البيانات بنجاح',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث البيانات', error: error.message });
  }
});

// تغيير كلمة المرور
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // التحقق من كلمة المرور الحالية
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }
    
    // التحقق من طول كلمة المرور الجديدة
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'يجب أن تكون كلمة المرور الجديدة على الأقل 6 أحرف' });
    }
    
    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تغيير كلمة المرور', error: error.message });
  }
});

// تحديث رمز FCM
router.put('/update-fcm-token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ message: 'رمز FCM مطلوب' });
    }
    
    req.user.fcmToken = fcmToken;
    await req.user.save();
    
    res.status(200).json({ message: 'تم تحديث رمز FCM بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث رمز FCM', error: error.message });
  }
});

module.exports = router;
