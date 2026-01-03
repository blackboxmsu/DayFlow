// controllers/employeeController.js
const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin/HR)
exports.getAllEmployees = async (req, res) => {
  try {
    const { department, designation, search } = req.query;
    
    let query = {};
    
    // Filter by department
    if (department) {
      query.department = department;
    }
    
    // Filter by designation
    if (designation) {
      query.designation = designation;
    }
    
    // Search by name
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const employees = await Employee.find(query)
      .populate('userId', 'employeeId email role isActive')
      .populate('reportingTo', 'firstName lastName designation')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'employeeId email role')
      .populate('reportingTo', 'firstName lastName designation');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Employees can only view their own profile unless they're admin/hr
    if (req.user.role === 'employee' && employee.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this profile'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
exports.updateEmployee = async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Employees can only update limited fields
    if (req.user.role === 'employee') {
      if (employee.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this profile'
        });
      }
      
      // Only allow certain fields for employees
      const allowedFields = ['phone', 'address', 'profilePicture'];
      const updates = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      employee = await Employee.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );
    } else {
      // Admin/HR can update all fields
      employee = await Employee.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin/HR)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Deactivate user account instead of deleting
    await User.findByIdAndUpdate(employee.userId, { isActive: false });
    
    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};