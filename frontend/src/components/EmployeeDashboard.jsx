// src/components/EmployeeDashboard.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Clock, Calendar, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { checkIn, checkOut, getAttendanceSummary } from '../store/slices/attendanceSlice';
import { getLeaves } from '../store/slices/leaveSlice';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { employee } = useSelector((state) => state.auth);
  const { todayAttendance, summary } = useSelector((state) => state.attendance);
  const { leaves } = useSelector((state) => state.leave);

  useEffect(() => {
    // Fetch data on mount
    dispatch(getAttendanceSummary());
    dispatch(getLeaves());
  }, [dispatch]);

  const handleCheckIn = async () => {
    try {
      await dispatch(checkIn()).unwrap();
      toast.success('Checked in successfully!');
    } catch (error) {
      toast.error(error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await dispatch(checkOut()).unwrap();
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error(error || 'Check-out failed');
    }
  };

  const recentLeaves = leaves.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {employee?.firstName}! 👋
        </h1>
        <p className="text-indigo-100">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Present Days"
          value={summary?.summary?.present || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          color="bg-green-500"
        />
        <StatCard
          title="Absent Days"
          value={summary?.summary?.absent || 0}
          icon={<XCircle className="w-6 h-6" />}
          color="bg-red-500"
        />
        <StatCard
          title="Half Days"
          value={summary?.summary?.halfDay || 0}
          icon={<Clock className="w-6 h-6" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="Leave Days"
          value={summary?.summary?.leave || 0}
          icon={<Calendar className="w-6 h-6" />}
          color="bg-blue-500"
        />
      </div>

      {/* Attendance Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Attendance</h2>
        
        <div className="flex items-center gap-4">
          {!todayAttendance?.checkIn ? (
            <button
              onClick={handleCheckIn}
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Check In
            </button>
          ) : !todayAttendance?.checkOut ? (
            <>
              <div className="flex-1 bg-green-100 text-green-800 py-4 rounded-xl font-medium flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Checked In at {format(new Date(todayAttendance.checkIn), 'h:mm a')}
              </div>
              <button
                onClick={handleCheckOut}
                className="flex-1 bg-red-600 text-white py-4 rounded-xl font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Check Out
              </button>
            </>
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-xl font-medium flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Completed for today
            </div>
          )}
        </div>

        {todayAttendance?.workHours && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Work Hours: <span className="font-bold text-gray-900">{todayAttendance.workHours.toFixed(2)} hrs</span>
            </p>
          </div>
        )}
      </div>

      {/* Leave Balance & Recent Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balance */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Leave Balance</h2>
          <div className="space-y-3">
            <LeaveBalanceItem
              type="Paid Leave"
              balance={employee?.leaveBalance?.paid || 0}
              color="text-blue-600"
            />
            <LeaveBalanceItem
              type="Sick Leave"
              balance={employee?.leaveBalance?.sick || 0}
              color="text-orange-600"
            />
            <LeaveBalanceItem
              type="Unpaid Leave"
              balance={employee?.leaveBalance?.unpaid || 0}
              color="text-gray-600"
            />
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Leave Requests</h2>
          <div className="space-y-3">
            {recentLeaves.length > 0 ? (
              recentLeaves.map((leave) => (
                <LeaveRequestItem key={leave._id} leave={leave} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No leave requests yet</p>
            )}
          </div>
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

const LeaveBalanceItem = ({ type, balance, color }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <span className="text-gray-700 font-medium">{type}</span>
    <span className={`${color} font-bold text-lg`}>{balance} days</span>
  </div>
);

const LeaveRequestItem = ({ leave }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900 capitalize">{leave.leaveType} Leave</p>
        <p className="text-sm text-gray-600">
          {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d')}
        </p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
        {leave.status}
      </span>
    </div>
  );
};

export default EmployeeDashboard;