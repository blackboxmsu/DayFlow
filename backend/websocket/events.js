// websocket/events.js
// Predefined event types for consistency

module.exports = {
  // Connection events
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  
  // Attendance events
  ATTENDANCE_CHECKIN: 'attendance:checkin',
  ATTENDANCE_CHECKOUT: 'attendance:checkout',
  ATTENDANCE_UPDATED: 'attendance:updated',
  
  // Leave events
  LEAVE_NEW: 'leave:new',
  LEAVE_STATUS: 'leave:status',
  LEAVE_APPROVED: 'leave:approved',
  LEAVE_REJECTED: 'leave:rejected',
  
  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  
  // Employee events
  EMPLOYEE_UPDATED: 'employee:updated',
  EMPLOYEE_ADDED: 'employee:added',
  EMPLOYEE_REMOVED: 'employee:removed',
  
  // System events
  SYSTEM_ANNOUNCEMENT: 'system:announcement',
  SYSTEM_MAINTENANCE: 'system:maintenance',
  
  // Real-time updates
  USER_TYPING: 'user:typing',
  USER_STOPPED_TYPING: 'user:stopped-typing',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline'
};