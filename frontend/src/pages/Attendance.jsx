import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAttendance, getAttendanceSummary } from '../store/slices/attendanceSlice';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Attendance = () => {
  const dispatch = useDispatch();
  const { records, summary, loading } = useSelector((state) => state.attendance);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    dispatch(getAttendance());
    dispatch(getAttendanceSummary({ month: selectedMonth, year: selectedYear }));
  }, [dispatch, selectedMonth, selectedYear]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'half-day': return 'bg-yellow-100 text-yellow-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Attendance Tracker</h1>
            <p className="text-gray-600 mt-1">Track your work hours and attendance</p>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <SummaryCard title="Present" value={summary.summary?.present || 0} icon={<Clock />} color="bg-green-500" />
              <SummaryCard title="Absent" value={summary.summary?.absent || 0} icon={<Calendar />} color="bg-red-500" />
              <SummaryCard title="Half Day" value={summary.summary?.halfDay || 0} icon={<TrendingUp />} color="bg-yellow-500" />
              <SummaryCard title="On Leave" value={summary.summary?.leave || 0} icon={<Calendar />} color="bg-blue-500" />
            </div>
          )}

          {/* Month/Year Selector */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - i}>
                      {new Date().getFullYear() - i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance History</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check In</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check Out</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Work Hours</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{format(new Date(record.date), 'MMM d, yyyy')}</td>
                        <td className="py-3 px-4">
                          {record.checkIn ? format(new Date(record.checkIn), 'h:mm a') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {record.checkOut ? format(new Date(record.checkOut), 'h:mm a') : '-'}
                        </td>
                        <td className="py-3 px-4">{record.workHours?.toFixed(2) || '0.00'} hrs</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No attendance records found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }) => (
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

export default Attendance;