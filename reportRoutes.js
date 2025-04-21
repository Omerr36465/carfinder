const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// استيراد نموذج التقرير
const Report = require('../models/Report');
const Car = require('../models/Car');

// استيراد وسيط المصادقة
const auth = require('../middleware/auth');

// إعداد تخزين الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'report-' + uniqueSuffix + ext);
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

// إضافة تقرير مشاهدة جديد
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      carId,
      location,
      date,
      description,
      contactPhone,
      contactEmail,
      isAnonymous
    } = req.body;
    
    // التحقق من وجود السيارة
    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({ message: 'السيارة غير موجودة' });
    }
    
    // إنشاء تقرير جديد
    const report = new Report({
      car: carId,
      reporter: req.user._id,
      location,
      date: date || new Date(),
      description,
      contactPhone: contactPhone || req.user.phone,
      contactEmail: contactEmail || req.user.email,
      isAnonymous: isAnonymous === 'true'
    });
    
    // إضافة الصور
    if (req.files && req.files.length > 0) {
      report.images = req.files.map(file => `/uploads/reports/${file.filename}`);
    }
    
    await report.save();
    
    // إضافة التقرير إلى السيارة
    car.reports.push(report._id);
    await car.save();
    
    res.status(201).json({
      message: 'تم إضافة التقرير بنجاح',
      report
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة التقرير', error: error.message });
  }
});

// الحصول على تقارير سيارة محددة
router.get('/car/:carId', async (req, res) => {
  try {
    const reports = await Report.find({ car: req.params.carId, isVerified: true })
      .populate('reporter', 'name')
      .sort({ date: -1 });
    
    res.status(200).json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب التقارير', error: error.message });
  }
});

// الحصول على تقرير محدد
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name phone')
      .populate('car');
    
    if (!report) {
      return res.status(404).json({ message: 'التقرير غير موجود' });
    }
    
    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات التقرير', error: error.message });
  }
});

// تحديث حالة تقرير
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    // التحقق من صلاحية المستخدم
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بتحديث حالة التقرير' });
    }
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'التقرير غير موجود' });
    }
    
    // تحديث حالة التقرير
    report.status = status;
    
    if (adminNotes) {
      report.adminNotes = adminNotes;
    }
    
    // تحديث حالة التحقق
    if (status === 'confirmed') {
      report.isVerified = true;
    }
    
    await report.save();
    
    // تحديث حالة السيارة إذا تم تأكيد التقرير
    if (status === 'confirmed') {
      const car = await Car.findById(report.car);
      
      if (car) {
        car.status = 'found';
        await car.save();
      }
    }
    
    res.status(200).json({
      message: 'تم تحديث حالة التقرير بنجاح',
      report
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث حالة التقرير', error: error.message });
  }
});

// الحصول على التقارير الخاصة بالمستخدم الحالي
router.get('/user/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .populate('car', 'plateNumber make model')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب التقارير الخاصة بك', error: error.message });
  }
});

// الحصول على إحصائيات التقارير
router.get('/stats/summary', async (req, res) => {
  try {
    // إجمالي عدد التقارير
    const totalReports = await Report.countDocuments();
    
    // عدد التقارير حسب الحالة
    const reportsByStatus = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // عدد التقارير المضافة حسب الشهر
    const reportsByMonth = await Report.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);
    
    res.status(200).json({
      totalReports,
      reportsByStatus,
      reportsByMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الإحصائيات', error: error.message });
  }
});

module.exports = router;
