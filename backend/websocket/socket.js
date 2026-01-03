// websocket/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const userSockets = new Map(); // Map userId to socket instances

// Initialize WebSocket
const initializeWebSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      if (!user.isActive) {
        return next(new Error('User account is deactivated'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.email} (${socket.id})`);
    
    // Store user's socket connection
    const userId = socket.user._id.toString();
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket);
    
    // Join user to their personal room
    socket.join(`user:${userId}`);
    
    // Join role-based rooms
    socket.join(`role:${socket.user.role}`);
    
    // Send connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to Dayflow HRMS',
      user: {
        id: socket.user._id,
        email: socket.user.email,
        role: socket.user.role
      }
    });
    
    // Handle attendance updates
    socket.on('attendance:update', (data) => {
      console.log(`Attendance update from ${socket.user.email}:`, data);
      
      // Broadcast to admin/HR
      io.to('role:admin').to('role:hr').emit('attendance:updated', {
        userId: socket.user._id,
        userName: socket.user.email,
        data
      });
    });
    
    // Handle leave request updates
    socket.on('leave:apply', (data) => {
      console.log(`Leave application from ${socket.user.email}:`, data);
      
      // Notify admin/HR
      io.to('role:admin').to('role:hr').emit('leave:new-request', {
        userId: socket.user._id,
        userName: socket.user.email,
        data
      });
    });
    
    // Handle notification acknowledgment
    socket.on('notification:read', (notificationId) => {
      console.log(`Notification ${notificationId} read by ${socket.user.email}`);
    });
    
    // Handle typing indicators (optional feature)
    socket.on('typing:start', (data) => {
      socket.broadcast.emit('user:typing', {
        userId: socket.user._id,
        userName: socket.user.email
      });
    });
    
    socket.on('typing:stop', () => {
      socket.broadcast.emit('user:stopped-typing', {
        userId: socket.user._id
      });
    });
    
    // Handle custom events
    socket.on('custom:event', (data) => {
      console.log('Custom event received:', data);
      // Handle custom business logic
    });
    
    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.user.email} (Reason: ${reason})`);
      
      // Remove socket from user's connections
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
    
    // Error handler
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.user.email}:`, error);
    });
  });
  
  return io;
};

// Emit to specific user (all their connections)
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`📤 Emitted '${event}' to user ${userId}`);
  }
};

// Emit to specific role
const emitToRole = (roles, event, data) => {
  if (io) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    roleArray.forEach(role => {
      io.to(`role:${role}`).emit(event, data);
    });
    console.log(`📤 Emitted '${event}' to roles: ${roleArray.join(', ')}`);
  }
};

// Emit to all connected users
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
    console.log(`📤 Emitted '${event}' to all users`);
  }
};

// Get online users count
const getOnlineUsersCount = () => {
  return userSockets.size;
};

// Get online users by role
const getOnlineUsersByRole = (role) => {
  const onlineUsers = [];
  userSockets.forEach((sockets, userId) => {
    const socket = Array.from(sockets)[0];
    if (socket && socket.user.role === role) {
      onlineUsers.push({
        userId,
        email: socket.user.email
      });
    }
  });
  return onlineUsers;
};

// Check if user is online
const isUserOnline = (userId) => {
  return userSockets.has(userId.toString());
};

module.exports = {
  initializeWebSocket,
  emitToUser,
  emitToRole,
  emitToAll,
  getOnlineUsersCount,
  getOnlineUsersByRole,
  isUserOnline
};
