import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { applyLeave, getLeaves } from '../store/slices/leaveSlice';
import { Calendar, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Leaves = () => {
  const dispatch = useDispatch();
  const { leaves, loading } = useSelector((state) => state.leave);
  const { employee, user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    leaveType: 'paid',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    dispatch(getLeaves());
  }, [dispatch]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      await dispatch(applyLeave(formData)).unwrap();
      toast.success('Leave request submitted successfully');
      setShowModal(false);
      setFormData({
        leaveType: 'paid',
        startDate: '',
        endDate: '',
        reason: '',
      });
    } catch (error) {
      toast.error(error || 'Failed to apply for leave');
    }
  };

  const filteredLeaves = leaves.filter(leave => 
    filter === 'all' ? true : leave.status === filter
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
              <p className="text-gray-600 mt-1">Manage your time off requests</p>
            </div>
            {user?.role === 'employee' && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                Apply for Leave
              </button>
            )}
          </div>

          {/* Leave Balance */}
          {employee && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <LeaveBalanceCard
                title="Paid Leave"
                balance={employee.leaveBalance?.paid || 0}
                color="bg-blue-500"
              />
              <LeaveBalanceCard
                title="Sick Leave"
                balance={employee.leaveBalance?.sick || 0}
                color="bg-orange-500"
              />
              <LeaveBalanceCard
                title="Unpaid Leave"
                balance={employee.leaveBalance?.unpaid || 0}
                color="bg-gray-500"
              />
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    filter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Leave Requests List */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Leave Requests</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading...</p>
              </div>
            ) : filteredLeaves.length > 0 ? (
              <div className="space-y-4">
                {filteredLeaves.map((leave) => (
                  <LeaveCard key={leave._id} leave={leave} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leave requests found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Apply for Leave</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="paid">Paid Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Please provide a reason for your leave..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LeaveBalanceCard = ({ title, balance, color }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{balance} days</p>
      </div>
      <div className={`${color} p-3 rounded-xl`}>
        <Calendar className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const LeaveCard = ({ leave }) => {
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
    <div className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 capitalize">{leave.leaveType} Leave</h3>
          <p className="text-sm text-gray-600 mt-1">
            {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
          {leave.status}
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-2">
        <strong>Duration:</strong> {leave.numberOfDays} day{leave.numberOfDays > 1 ? 's' : ''}
      </p>
      
      <p className="text-sm text-gray-700 mb-2">
        <strong>Reason:</strong> {leave.reason}
      </p>

      {leave.approvalComments && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Comments:</strong> {leave.approvalComments}
          </p>
        </div>
      )}

      {leave.approvedAt && (
        <p className="text-xs text-gray-500 mt-2">
          {leave.status === 'approved' ? 'Approved' : 'Rejected'} on {format(new Date(leave.approvedAt), 'MMM d, yyyy')}
        </p>
      )}
    </div>
  );
};

export default Leaves;