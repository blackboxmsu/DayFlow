// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Users, CheckCircle, Clock, Calendar } from 'lucide-react';
import { getAllEmployees } from '../store/slices/employeeSlice';
import { getLeaves, updateLeaveStatus } from '../store/slices/leaveSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.employee);
  const { leaves } = useSelector((state) => state.leave);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeToday: 0,
    pendingLeaves: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch employees
      dispatch(getAllEmployees());
      
      // Fetch leaves
      dispatch(getLeaves({ status: 'pending' }));
      
      // Fetch admin dashboard stats
      const response = await api.get('/dashboard/admin');
      setStats(response.data.data.stats);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    }
  };

  const pendingLeaves = leaves.filter(leave => leave.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your workforce efficiently</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Users className="w-6 h-6" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Today"
          value={stats.activeToday}
          icon={<CheckCircle className="w-6 h-6" />}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          icon={<Clock className="w-6 h-6" />}
          color="bg-yellow-500"
        />
      </div>

      {/* Pending Leave Requests */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Pending Leave Requests</h2>
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {pendingLeaves.length} Pending
          </span>
        </div>

        <div className="space-y-4">
          {pendingLeaves.length > 0 ? (
            pendingLeaves.map((leave) => (
              <LeaveRequestCard key={leave._id} leave={leave} onUpdate={fetchDashboardData} />
            ))
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No pending leave requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Employees</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Designation</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map((employee) => (
                <tr key={employee._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{employee.userId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{employee.department}</td>
                  <td className="py-3 px-4 text-gray-700">{employee.designation}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      employee.userId?.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.userId?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`${color} p-3 rounded-xl text-white`}>{icon}</div>
    </div>
  </div>
);

const LeaveRequestCard = ({ leave, onUpdate }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    try {
      await dispatch(updateLeaveStatus({
        id: leave._id,
        status: 'approved',
        comments: comment || 'Approved'
      })).unwrap();
      toast.success('Leave approved successfully');
      onUpdate();
    } catch (error) {
      toast.error(error || 'Failed to approve leave');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    try {
      await dispatch(updateLeaveStatus({
        id: leave._id,
        status: 'rejected',
        comments: comment
      })).unwrap();
      toast.success('Leave rejected');
      onUpdate();
    } catch (error) {
      toast.error(error || 'Failed to reject leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {leave.employeeId?.firstName} {leave.employeeId?.lastName}
          </h3>
          <p className="text-sm text-gray-600">{leave.employeeId?.department}</p>
        </div>
        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
          {leave.leaveType}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-700 mb-1">
          <strong>Duration:</strong> {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d, yyyy')} ({leave.numberOfDays} days)
        </p>
        <p className="text-sm text-gray-700">
          <strong>Reason:</strong> {leave.reason}
        </p>
      </div>

      <div className="mb-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add comments (optional for approval, required for rejection)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          rows="2"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;