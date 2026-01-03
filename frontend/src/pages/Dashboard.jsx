// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../store/slices/authSlice';
import EmployeeDashboard from '../components/EmployeeDashboard';
import AdminDashboard from '../components/AdminDashboard';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import socketService from '../services/socket';
import { Loader } from 'lucide-react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, employee, isAuthenticated, token, loading } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    // Fetch current user if not loaded
    if (!user || !employee) {
      dispatch(getCurrentUser());
    }

    // Connect to WebSocket
    if (token && !socketService.isConnected) {
      socketService.connect(token);
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [isAuthenticated, user, employee, token, dispatch, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

