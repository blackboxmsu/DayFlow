const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkOut: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave'],
    default: 'absent'
  },
  workHours: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Create compound index for employee and date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Calculate work hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diff = this.checkOut - this.checkIn;
    this.workHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
    
    if (this.workHours >= 8) {
      this.status = 'present';
    } else if (this.workHours >= 4) {
      this.status = 'half-day';
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);