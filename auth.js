const jwt = require('jsonwebtoken');
const User = require('../models/User');

// وسيط التحقق من رمز المصادقة
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

module.exports = auth;
