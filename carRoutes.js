const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// استيراد نموذج السيارة
const Car = require('../models/Car');
const Report = require('../models/Report');

// استيراد وسيط المصادقة
const auth = require('../middleware/auth');

// إعداد تخزين الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/cars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'car-' + uniqueSuffix + ext);
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

// الحصول على جميع السيارات المسروقة
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = 'createdAt', order = 'desc' } = req.query;
    
    // إنشاء مرشح البحث
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    // إنشاء خيارات الترتيب
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // حساب التخطي
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // الحصول على السيارات
    const cars = await Car.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name phone');
    
    // حساب إجمالي عدد السيارات
    const total = await Car.countDocuments(filter);
    
    res.status(200).json({
      cars,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalCars: total
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب السيارات', error: error.message });
  }
});

// البحث عن السيارات المسروقة
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'يرجى إدخال كلمة بحث' });
    }
    
    // إنشاء مرشح البحث
    const filter = {
      $text: { $search: query }
    };
    
    // حساب التخطي
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // الحصول على السيارات
    const cars = await Car.find(filter)
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name phone');
    
    // حساب إجمالي عدد السيارات
    const total = await Car.countDocuments(filter);
    
    res.status(200).json({
      cars,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalCars: total
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء البحث عن السيارات', error: error.message });
  }
});

// الحصول على سيارة محددة
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('owner', 'name phone')
      .populate('reports');
    
    if (!car) {
      return res.status(404).json({ message: 'السيارة غير موجودة' });
    }
    
    // زيادة عدد المشاهدات
    car.views += 1;
    await car.save();
    
    res.status(200).json({ car });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات السيارة', error: error.message });
  }
});

// إضافة سيارة مسروقة جديدة
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      plateNumber,
      make,
      model,
      year,
      color,
      stolenDate,
      stolenLocation,
      description,
      features,
      engineNumber,
      chassisNumber,
      additionalDetails,
      contactPhone,
      contactEmail,
      rewardAmount
    } = req.body;
    
    // التحقق من وجود السيارة
    const existingCar = await Car.findOne({ plateNumber });
    
    if (existingCar) {
      return res.status(400).json({ message: 'رقم اللوحة مسجل بالفعل' });
    }
    
    // إنشاء سيارة جديدة
    const car = new Car({
      plateNumber,
      make,
      model,
      year,
      color,
      owner: req.user._id,
      stolenDate: stolenDate || new Date(),
      stolenLocation,
      description,
      features,
      engineNumber,
      chassisNumber,
      additionalDetails,
      contactPhone: contactPhone || req.user.phone,
      contactEmail: contactEmail || req.user.email,
      rewardAmount: rewardAmount || 0
    });
    
    // إضافة الصور
    if (req.files && req.files.length > 0) {
      car.images = req.files.map(file => `/uploads/cars/${file.filename}`);
    }
    
    await car.save();
    
    res.status(201).json({
      message: 'تم إضافة السيارة بنجاح',
      car
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة السيارة', error: error.message });
  }
});

// تحديث بيانات سيارة
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'السيارة غير موجودة' });
    }
    
    // التحقق من ملكية السيارة
    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بتحديث هذه السيارة' });
    }
    
    const updates = req.body;
    const allowedUpdates = [
      'make', 'model', 'year', 'color', 'stolenLocation', 'description',
      'features', 'engineNumber', 'chassisNumber', 'additionalDetails',
      'contactPhone', 'contactEmail', 'rewardAmount'
    ];
    
    // تحديث الحقول المسموح بها
    allowedUpdates.forEach(update => {
      if (updates[update] !== undefined) {
        car[update] = updates[update];
      }
    });
    
    // إضافة الصور الجديدة
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/cars/${file.filename}`);
      car.images = [...car.images, ...newImages];
    }
    
    // حذف الصور المحددة
    if (updates.deleteImages && Array.isArray(updates.deleteImages)) {
      car.images = car.images.filter(img => !updates.deleteImages.includes(img));
    }
    
    await car.save();
    
    res.status(200).json({
      message: 'تم تحديث بيانات السيارة بنجاح',
      car
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث بيانات السيارة', error: error.message });
  }
});

// حذف سيارة
router.delete('/:id', auth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'السيارة غير موجودة' });
    }
    
    // التحقق من ملكية السيارة
    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذه السيارة' });
    }
    
    // حذف التقارير المرتبطة بالسيارة
    await Report.deleteMany({ car: car._id });
    
    // حذف السيارة
    await car.remove();
    
    res.status(200).json({ message: 'تم حذف السيارة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف السيارة', error: error.message });
  }
});

// الحصول على إحصائيات السيارات المسروقة
router.get('/stats/summary', async (req, res) => {
  try {
    // إجمالي عدد السيارات المسروقة
    const totalCars = await Car.countDocuments();
    
    // عدد السيارات حسب الحالة
    const carsByStatus = await Car.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // عدد السيارات حسب الماركة
    const carsByMake = await Car.aggregate([
      {
        $group: {
          _id: '$make',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // عدد السيارات حسب اللون
    const carsByColor = await Car.aggregate([
      {
        $group: {
          _id: '$color',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // عدد السيارات حسب السنة
    const carsByYear = await Car.aggregate([
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // عدد السيارات المضافة حسب الشهر
    const carsByMonth = await Car.aggregate([
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
      totalCars,
      carsByStatus,
      carsByMake,
      carsByColor,
      carsByYear,
      carsByMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الإحصائيات', error: error.message });
  }
});

// الحصول على السيارات الخاصة بالمستخدم الحالي
router.get('/user/my-cars', auth, async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ cars });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب السيارات الخاصة بك', error: error.message });
  }
});

module.exports = router;
