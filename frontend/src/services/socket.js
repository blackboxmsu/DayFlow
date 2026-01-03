
// src/services/socket.js
import { io } from 'socket.io-client';
import { store } from '../store/store';
import { updateTodayAttendance } from '../store/slices/attendanceSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { addLeave, updateLeave } from '../store/slices/leaveSlice';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Connection events
    this.socket.on('connected', (data) => {
      console.log('✅ Connected to WebSocket:', data);
      this.isConnected = true;
      toast.success('Connected to real-time updates');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket:', reason);
      this.isConnected = false;
      toast.error('Disconnected from real-time updates');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('Failed to connect to server');
    });

    // Attendance events
    this.socket.on('attendance:checkin', (data) => {
      console.log('Attendance check-in:', data);
      store.dispatch(updateTodayAttendance(data));
      toast.success('Checked in successfully!');
    });

    this.socket.on('attendance:checkout', (data) => {
      console.log('Attendance check-out:', data);
      store.dispatch(updateTodayAttendance(data));
      toast.success('Checked out successfully!');
    });

    this.socket.on('attendance:updated', (data) => {
      console.log('Attendance updated:', data);
      toast.info(`${data.userName} updated their attendance`);
    });

    // Leave events
    this.socket.on('leave:new', (data) => {
      console.log('New leave request:', data);
      store.dispatch(addLeave(data.leave));
      toast.info(`New leave request from ${data.employee.firstName}`);
    });

    this.socket.on('leave:status', (data) => {
      console.log('Leave status updated:', data);
      store.dispatch(updateLeave(data.leave));
      
      if (data.status === 'approved') {
        toast.success('Your leave request has been approved!');
      } else if (data.status === 'rejected') {
        toast.error('Your leave request has been rejected');
      }
    });

    this.socket.on('leave:new-request', (data) => {
      console.log('New leave request (admin view):', data);
      toast.info(`New leave request from ${data.userName}`);
    });

    // Notification events
    this.socket.on('notification:new', (notification) => {
      console.log('New notification:', notification);
      store.dispatch(addNotification(notification));
      toast.info(notification.title);
    });

    // General events
    this.socket.on('system:announcement', (data) => {
      console.log('System announcement:', data);
      toast(data.message, {
        icon: '📢',
        duration: 5000,
      });
    });
  }

  // Emit events
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected');
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

export default new SocketService();