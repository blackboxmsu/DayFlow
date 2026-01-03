const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Personal Details
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  profilePicture: {
    type: String,
    default: null
  },
  
  // Job Details
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  reportingTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  
  // Salary Structure
  salary: {
    basicSalary: {
      type: Number,
      required: true,
      default: 0
    },
    allowances: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Documents
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Leave Balance
  leaveBalance: {
    paid: {
      type: Number,
      default: 20
    },
    sick: {
      type: Number,
      default: 10
    },
    unpaid: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Calculate net salary before saving
employeeSchema.pre('save', function(next) {
  if (this.salary) {
    this.salary.netSalary = this.salary.basicSalary + this.salary.allowances - this.salary.deductions;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);