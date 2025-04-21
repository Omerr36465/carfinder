const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// استيراد النماذج
const User = require('../models/User');
const Car = require('../models/Car');
const Report = require('../models/Report');

// استيراد وسيط المصادقة
const auth = require('../middleware/auth');

// وسيط التحقق من صلاحيات المسؤول
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'غير مصرح لك بالوصول إلى هذه الصفحة' });
  }
  next();
};

// تسجيل دخول المسؤول
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
    
    // التحقق من صلاحيات المسؤول
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'غير مصرح لك بالوصول إلى لوحة التحكم' });
    }
    
    // التحقق من حالة الحساب
    if (!user.isActive) {
      return res.status(401).json({ message: 'الحساب معطل، يرجى التواصل مع الإدارة' });
    }
    
    // إنشاء رمز المصادقة
    const token = user.generateAuthToken();
    
    res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول', error: error.message });
  }
});

// الحصول على لوحة معلومات المسؤول
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    // إحصائيات المستخدمين
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // إحصائيات السيارات
    const totalCars = await Car.countDocuments();
    const stolenCars = await Car.countDocuments({ status: 'stolen' });
    const foundCars = await Car.countDocuments({ status: 'found' });
    const newCars = await Car.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // إحصائيات التقارير
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const confirmedReports = await Report.countDocuments({ status: 'confirmed' });
    const newReports = await Report.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // السيارات الأكثر مشاهدة
    const topViewedCars = await Car.find()
      .sort({ views: -1 })
      .limit(5)
      .select('plateNumber make model color views');
    
    // أحدث التقارير
    const latestReports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('car', 'plateNumber make model')
      .populate('reporter', 'name');
    
    res.status(200).json({
      users: {
        total: totalUsers,
        admins: totalAdmins,
        newUsers
      },
      cars: {
        total: totalCars,
        stolen: stolenCars,
        found: foundCars,
        newCars
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        confirmed: confirmedReports,
        newReports
      },
      topViewedCars,
      latestReports
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات لوحة المعلومات', error: error.message });
  }
});

// الحصول على جميع المستخدمين
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    // إنشاء مرشح البحث
    const filter = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // حساب التخطي
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // الحصول على المستخدمين
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');
    
    // حساب إجمالي عدد المستخدمين
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      users,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalUsers: total
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المستخدمين', error: error.message });
  }
});

// تحديث دور المستخدم
router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    // التحقق من صلاحية الدور
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'الدور غير صالح' });
    }
    
    // التحقق من صلاحية المستخدم
    if (req.user.role !== 'superadmin' && role === 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بتعيين مستخدمين كمسؤولين' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // منع تغيير دور المستخدم نفسه
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك تغيير دورك الخاص' });
    }
    
    // منع تغيير دور المستخدم الأعلى
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'غير مصرح لك بتغيير دور المستخدم الأعلى' });
    }
    
    // تحديث دور المستخدم
    user.role = role;
    await user.save();
    
    res.status(200).json({
      message: 'تم تحديث دور المستخدم بنجاح',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث دور المستخدم', error: error.message });
  }
});

// تفعيل/تعطيل حساب مستخدم
router.put('/users/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // منع تغيير حالة المستخدم نفسه
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك تغيير حالة حسابك الخاص' });
    }
    
    // منع تغيير حالة المستخدم الأعلى
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'غير مصرح لك بتغيير حالة المستخدم الأعلى' });
    }
    
    // تحديث حالة المستخدم
    user.isActive = isActive;
    await user.save();
    
    res.status(200).json({
      message: isActive ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث حالة المستخدم', error: error.message });
  }
});

// التحقق من سيارة مسروقة
router.put('/cars/:id/verify', auth, adminAuth, async (req, res) => {
  try {
    const { isVerified } = req.body;
    
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'السيارة غير موجودة' });
    }
    
    // تحديث حالة التحقق
    car.isVerified = isVerified;
    await car.save();
    
    res.status(200).json({
      message: isVerified ? 'تم التحقق من السيارة بنجاح' : 'تم إلغاء التحقق من السيارة',
      car: {
        _id: car._id,
        plateNumber: car.plateNumber,
        make: car.make,
        model: car.model,
        isVerified: car.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث حالة التحقق', error: error.message });
  }
});

// تحديث حالة سيارة مسروقة
router.put('/cars/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // التحقق من صلاحية الحالة
    if (!['stolen', 'found', 'investigating', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'الحالة غير صالحة' });
    }
    
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'السيارة غير موجودة' });
    }
    
    // تحديث حالة السيارة
    car.status = status;
    await car.save();
    
    res.status(200).json({
      message: 'تم تحديث حالة السيارة بنجاح',
      car: {
        _id: car._id,
        plateNumber: car.plateNumber,
        make: car.make,
        model: car.model,
        status: car.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث حالة السيارة', error: error.message });
  }
});

// إنشاء مستخدم مسؤول جديد
router.post('/create-admin', auth, async (req, res) => {
  try {
    // التحقق من صلاحية المستخدم
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'غير مصرح لك بإنشاء مستخدمين مسؤولين' });
    }
    
    const { name, email, phone, password, role } = req.body;
    
    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    // التحقق من صلاحية الدور
    if (role !== 'admin' && role !== 'superadmin') {
      return res.status(400).json({ message: 'الدور غير صالح' });
    }
    
    // إنشاء مستخدم مسؤول جديد
    const user = new User({
      name,
      email,
      phone,
      password,
      role
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'تم إنشاء المستخدم المسؤول بنجاح',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المستخدم المسؤول', error: error.message });
  }
});

module.exports = router;
