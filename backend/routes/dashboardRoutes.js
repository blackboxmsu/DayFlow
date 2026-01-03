// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
router.get('/employee', protect, async (req, res) => {
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
    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: today }
    });
    
    const recentLeaves = await Leave.find({ employeeId: employee._id })
      .sort('-createdAt')
      .limit(5);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthAttendance = await Attendance.find({
      employeeId: employee._id,
      date: { $gte: startOfMonth }
    });
    
    const attendanceSummary = {
      present: monthAttendance.filter(a => a.status === 'present').length,
      absent: monthAttendance.filter(a => a.status === 'absent').length,
      halfDay: monthAttendance.filter(a => a.status === 'half-day').length,
      leave: monthAttendance.filter(a => a.status === 'leave').length
    };
    
    res.status(200).json({
      success: true,
      data: {
        employee,
        todayAttendance,
        recentLeaves,
        attendanceSummary,
        leaveBalance: employee.leaveBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get admin/HR dashboard data
router.get('/admin', protect, authorize('admin', 'hr'), async (req, res) => {
  try {
    // Total employees
    const totalEmployees = await Employee.countDocuments();
    
    // Active employees (checked in today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await Attendance.countDocuments({
      date: { $gte: today },
      status: 'present'
    });
    
    const pendingLeaves = await Leave.find({ status: 'pending' })
      .populate('employeeId', 'firstName lastName department')
      .sort('-createdAt')
      .limit(10);
    const recentAttendance = await Attendance.find()
      .populate('employeeId', 'firstName lastName department')
      .sort('-date')
      .limit(10);
    
    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          activeToday,
          pendingLeaves: pendingLeaves.length
        },
        pendingLeaves,
        recentAttendance,
        departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;