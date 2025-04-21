const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'معرف السيارة مطلوب']
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'معرف المبلغ مطلوب']
  },
  location: {
    type: String,
    required: [true, 'موقع المشاهدة مطلوب'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'تاريخ المشاهدة مطلوب'],
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'وصف المشاهدة مطلوب'],
    trim: true,
    minlength: [10, 'يجب أن يكون الوصف على الأقل 10 أحرف'],
    maxlength: [1000, 'يجب أن لا يتجاوز الوصف 1000 حرف']
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'investigating', 'confirmed', 'false', 'closed'],
    default: 'pending'
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
  isAnonymous: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
