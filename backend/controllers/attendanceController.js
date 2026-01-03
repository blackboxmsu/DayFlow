// controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { emitToUser } = require('../websocket/socket');

// @desc    Check in
// @route   POST /api/attendance/checkin
// @access  Private (Employee)
exports.checkIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already checked in today
    let attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: today }
    });
    
    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }
    
    // Create or update attendance
    if (!attendance) {
      attendance = await Attendance.create({
        employeeId: employee._id,
        date: new Date(),
        checkIn: new Date(),
        status: 'present'
      });
    } else {
      attendance.checkIn = new Date();
      attendance.status = 'present';
      await attendance.save();
    }
    
    // Emit real-time update
    emitToUser(req.user._id.toString(), 'attendance:checkin', attendance);
    
    res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check out
// @route   POST /api/attendance/checkout
// @access  Private (Employee)
exports.checkOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's attendance
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: today }
    });
    
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Please check in first'
      });
    }
    
    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }
    
    // Update checkout time
    attendance.checkOut = new Date();
    await attendance.save();
    
    // Emit real-time update
    emitToUser(req.user._id.toString(), 'attendance:checkout', attendance);
    
    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    
    let query = {};
    
    // If employee role, only show their own attendance
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      query.employeeId = employee._id;
    } else if (employeeId) {
      // Admin/HR can filter by employee
      query.employeeId = employeeId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    const attendance = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeId department')
      .sort('-date');
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance summary
// @route   GET /api/attendance/summary
// @access  Private
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    
    let targetEmployeeId;
    
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      targetEmployeeId = employee._id;
    } else {
      targetEmployeeId = employeeId;
    }
    
    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }
    
    // Calculate date range
    const targetDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    
    const attendance = await Attendance.find({
      employeeId: targetEmployeeId,
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate summary
    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      halfDay: attendance.filter(a => a.status === 'half-day').length,
      leave: attendance.filter(a => a.status === 'leave').length,
      totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0)
    };
    
    res.status(200).json({
      success: true,
      data: {
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
        summary,
        records: attendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update attendance (Admin/HR only)
// @route   PUT /api/attendance/:id
// @access  Private (Admin/HR)
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

