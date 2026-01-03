
// routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  updateLeaveStatus
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const { leaveValidation, validate } = require('../middleware/validation');

router.route('/')
  .get(protect, getLeaves)
  .post(protect, leaveValidation, validate, applyLeave);

router.put('/:id/status', protect, authorize('admin', 'hr'), updateLeaveStatus);

module.exports = router;