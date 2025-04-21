const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: [true, 'رقم اللوحة مطلوب'],
    trim: true,
    unique: true
  },
  make: {
    type: String,
    required: [true, 'ماركة السيارة مطلوبة'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'موديل السيارة مطلوب'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'سنة الصنع مطلوبة'],
    min: [1950, 'سنة الصنع غير صالحة'],
    max: [new Date().getFullYear() + 1, 'سنة الصنع غير صالحة']
  },
  color: {
    type: String,
    required: [true, 'لون السيارة مطلوب'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['stolen', 'found', 'investigating', 'closed'],
    default: 'stolen'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  stolenDate: {
    type: Date,
    required: [true, 'تاريخ السرقة مطلوب'],
    default: Date.now
  },
  stolenLocation: {
    type: String,
    required: [true, 'موقع السرقة مطلوب'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'وصف السيارة مطلوب'],
    trim: true,
    minlength: [10, 'يجب أن يكون الوصف على الأقل 10 أحرف'],
    maxlength: [1000, 'يجب أن لا يتجاوز الوصف 1000 حرف']
  },
  images: [{
    type: String
  }],
  features: {
    type: String,
    trim: true
  },
  engineNumber: {
    type: String,
    trim: true
  },
  chassisNumber: {
    type: String,
    trim: true
  },
  additionalDetails: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    required: [true, 'رقم الهاتف للتواصل مطلوب'],
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  rewardAmount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }]
}, {
  timestamps: true
});

// إنشاء فهرس نصي للبحث
carSchema.index({
  plateNumber: 'text',
  make: 'text',
  model: 'text',
  color: 'text',
  stolenLocation: 'text',
  description: 'text',
  engineNumber: 'text',
  chassisNumber: 'text'
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
