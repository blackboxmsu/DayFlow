// controllers/leaveController.js
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { emitToUser, emitToRole } = require('../websocket/socket');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (Employee)
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Check leave balance
    if (leaveType !== 'unpaid') {
      const balanceKey = leaveType === 'paid' ? 'paid' : 'sick';
      if (employee.leaveBalance[balanceKey] < numberOfDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${employee.leaveBalance[balanceKey]} days`
        });
      }
    }
    
    // Create leave request
    const leave = await Leave.create({
      employeeId: employee._id,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason
    });
    
    // Create notification for admins/HR
    const notification = await Notification.create({
      userId: req.user._id,
      title: 'New Leave Request',
      message: `${employee.firstName} ${employee.lastName} has applied for ${numberOfDays} day(s) of ${leaveType} leave`,
      type: 'leave',
      link: `/leaves/${leave._id}`
    });
    
    // Emit real-time notification to admin/HR
    emitToRole(['admin', 'hr'], 'leave:new', {
      leave,
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get leave requests
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res) => {
  try {
    const { status, employeeId, startDate, endDate } = req.query;
    
    let query = {};
    
    // Employees can only see their own leaves
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      query.employeeId = employee._id;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName department designation')
      .populate('approvedBy', 'email role')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/status
// @access  Private (Admin/HR)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }
    
    const leave = await Leave.findById(req.params.id).populate('employeeId');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }
    
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been processed'
      });
    }
    
    // Update leave status
    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvalComments = comments || '';
    leave.approvedAt = new Date();
    await leave.save();
    
    // Update leave balance if approved
    if (status === 'approved' && leave.leaveType !== 'unpaid') {
      const employee = await Employee.findById(leave.employeeId);
      const balanceKey = leave.leaveType === 'paid' ? 'paid' : 'sick';
      employee.leaveBalance[balanceKey] -= leave.numberOfDays;
      await employee.save();
    }
    
    // Create notification for employee
    await Notification.create({
      userId: leave.employeeId.userId,
      title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your ${leave.leaveType} leave request from ${leave.startDate.toDateString()} has been ${status}`,
      type: 'leave',
      link: `/leaves/${leave._id}`
    });
    
    // Emit real-time update to employee
    emitToUser(leave.employeeId.userId.toString(), 'leave:status', {
      leave,
      status
    });
    
    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};