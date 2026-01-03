// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceSummary,
  updateAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/', protect, getAttendance);
router.get('/summary', protect, getAttendanceSummary);
router.put('/:id', protect, authorize('admin', 'hr'), updateAttendance);

module.exports = router;