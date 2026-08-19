import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Check, X, Loader2, Image as ImageIcon,
  CheckCircle2, AlertCircle, Search, Filter,
  Users, UserCheck, DollarSign, QrCode, Send, Calendar, Clock
} from 'lucide-react';

const EventRegistrations = () => {
  const { eventId } = useParams();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'pending'

  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState({ total: 0, entered: 0, confirmed: 0 });
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [qrJobs, setQrJobs] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modal state
  const [selectedImage, setSelectedImage] = useState(null);

  // QR Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    timing: 'now',
    customDateTime: '',
    rateLimitPerMin: 10,
    limitCount: ''
  });
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const eventsRes = await api.get('/events');
      const found = eventsRes.data.find(e => e.id === parseInt(eventId));
      setEvent(found);

      // Fetch pending
      const pendingRes = await api.get(`/admin/registrations/${eventId}/pending`);
      setPendingRegistrations(pendingRes.data);

      // Fetch stats
      const statsRes = await api.get(`/admin/registrations/${eventId}/stats`);
      setStats(statsRes.data);

      // Fetch all registrations
      await fetchAllRegistrations();

      // Fetch QR Jobs
      const jobsRes = await api.get(`/admin/events/${eventId}/qr-jobs`);
      setQrJobs(jobsRes.data);
    } catch (err) {
      setError('Failed to fetch dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRegistrations = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (branchFilter) queryParams.append('branch', branchFilter);

      const allRes = await api.get(`/admin/registrations/${eventId}?${queryParams.toString()}`);
      setAllRegistrations(allRes.data);
    } catch (err) {
      console.error('Failed to fetch all registrations', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [eventId]);

  // Debounced search for all registrations
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading && activeTab === 'overview') {
        fetchAllRegistrations();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, branchFilter, activeTab]);

  // Polling for QR Jobs
  useEffect(() => {
    let intervalId;
    if (activeTab === 'qrjobs') {
      intervalId = setInterval(async () => {
        try {
          const jobsRes = await api.get(`/admin/events/${eventId}/qr-jobs`);
          setQrJobs(jobsRes.data);
        } catch (err) {
          console.error('Failed to poll QR jobs', err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, eventId]);

  const handleVerify = async (id, action) => {
    let reason = '';

    if (action === 'reject') {
      reason = window.prompt("Please provide a reason for rejection (optional):");
      if (reason === null) return;
    }

    setActionLoading(id);
    try {
      await api.put(`/admin/registrations/${id}/verify`, { action, reason });

      setActionSuccess({ id, action });

      setTimeout(() => {
        setPendingRegistrations(prev => prev.filter(r => r.id !== id));
        // Also update allRegistrations and stats
        fetchAllRegistrations();
        api.get(`/admin/registrations/${eventId}/stats`).then(res => setStats(res.data));
        setActionSuccess(null);
      }, 1500);

    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update registration status.');
    } finally {
      setActionLoading(null);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleLoading(true);
    try {
      const payload = {
        ...scheduleForm,
        limitCount: scheduleForm.limitCount ? parseInt(scheduleForm.limitCount, 10) : null
      };
      await api.post(`/admin/events/${eventId}/schedule-qr-send`, payload);
      alert('Job scheduled successfully!');
      setShowScheduleModal(false);
      // Refresh jobs
      const jobsRes = await api.get(`/admin/events/${eventId}/qr-jobs`);
      setQrJobs(jobsRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule job');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleInstantTrigger = async () => {
    if (!window.confirm("Are you sure you want to instantly send QR codes to all eligible users? This will happen immediately and cannot be stopped.")) return;

    setTriggerLoading(true);
    try {
      const res = await api.post(`/admin/events/${eventId}/trigger-qr-send`);
      alert(`Triggered! Sent: ${res.data.result.sent}, Failed: ${res.data.result.failed}`);

      const statsRes = await api.get(`/admin/registrations/${eventId}/stats`);
      setStats(statsRes.data);
      await fetchAllRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger QR send');
    } finally {
      setTriggerLoading(false);
    }
  };

  if (loading && !allRegistrations.length && !pendingRegistrations.length) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto mt-10 p-4 sm:p-6 lg:p-8"
    >
      <div className="mb-6">
        <Link to="/admin" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Event Registrations
          </h2>
          <p className="text-gray-500 mt-1">{event ? event.name : ''}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Overview & Search
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Pending Verification ({pendingRegistrations.length})
          </button>
          <button
            onClick={() => setActiveTab('qrjobs')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'qrjobs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            QR Jobs & Delivery
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Registered</p>
                <h4 className="text-2xl font-bold text-gray-900">{stats.total}</h4>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Entered</p>
                <h4 className="text-2xl font-bold text-gray-900">{stats.entered}</h4>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Confirmed (Paid)</p>
                <h4 className="text-2xl font-bold text-gray-900">{stats.confirmed}</h4>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="Search by Name or Registration ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="Filter by Branch..."
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              />
            </div>
          </div>

          {/* All Registrations Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reg ID & Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch & Year</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entered</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {allRegistrations.length > 0 ? (
                    allRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-mono text-gray-500 mb-1">{reg.registrationId}</div>
                          <div className="text-sm font-bold text-gray-900">{reg.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reg.email}</div>
                          <div className="text-sm text-gray-500">{reg.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reg.branch || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{reg.year ? `${reg.year} Year` : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${reg.paymentStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                              reg.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'}`}>
                            {reg.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reg.entered ? (
                            <span className="inline-flex items-center text-green-600"><CheckCircle2 className="w-5 h-5" /></span>
                          ) : (
                            <span className="inline-flex items-center text-gray-400"><X className="w-5 h-5" /></span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No registrations found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <>
          {pendingRegistrations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No pending registrations</h3>
              <p className="text-gray-500 max-w-sm">All caught up! There are no registrations waiting for payment verification.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Academic Info</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered At</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Proof</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pendingRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{reg.name}</div>
                          <div className="text-sm text-gray-500">{reg.email}</div>
                          <div className="text-sm text-gray-400">{reg.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">{reg.year} Year, {reg.branch}</div>
                          <div className="text-sm text-gray-500">ID: {reg.collegeId || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{format(new Date(reg.registeredAt), 'MMM d, yyyy')}</div>
                          <div className="text-xs text-gray-400">{format(new Date(reg.registeredAt), 'HH:mm')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reg.paymentScreenshot ? (
                            <button
                              onClick={() => setSelectedImage(getImageUrl(reg.paymentScreenshot))}
                              className="inline-block relative group rounded overflow-hidden shadow-sm"
                            >
                              <img
                                src={getImageUrl(reg.paymentScreenshot)}
                                alt="Payment Proof"
                                className="h-16 w-24 object-cover transition-transform transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-1 rounded">No Image</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {actionSuccess?.id === reg.id ? (
                            <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white ${actionSuccess.action === 'confirm' ? 'bg-green-500' : 'bg-red-500'}`}>
                              <CheckCircle2 className="w-4 h-4" />
                              {actionSuccess.action === 'confirm' ? 'Approved!' : 'Rejected!'}
                            </div>
                          ) : (
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleVerify(reg.id, 'confirm')}
                                disabled={actionLoading === reg.id}
                                className="inline-flex items-center gap-1.5 px-3 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
                              >
                                {actionLoading === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerify(reg.id, 'reject')}
                                disabled={actionLoading === reg.id}
                                className="inline-flex items-center gap-1.5 px-3 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 transition-colors"
                              >
                                {actionLoading === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'qrjobs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <QrCode className="w-5 h-5 mr-2 text-indigo-600" />
                  QR Code Delivery
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Schedule background jobs to securely email QR entry passes to confirmed students.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleInstantTrigger}
                  disabled={triggerLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {triggerLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Instant Trigger
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Job
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled At</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Audience</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {qrJobs.length > 0 ? (
                    qrJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(job.scheduledAt), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                              job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.rateLimitPerMin}/min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.limitCount ? `First ${job.limitCount}` : 'All Eligible'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Sent: {job.sentCount} | Failed: {job.failedCount} {job.totalToSend ? `/ Total: ${job.totalToSend}` : ''}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No QR jobs scheduled yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-900">Schedule QR Delivery</h3>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timing</label>
                  <select
                    value={scheduleForm.timing}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, timing: e.target.value })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  >
                    <option value="now">Send Now</option>
                    <option value="1hr">In 1 Hour</option>
                    <option value="2hr">In 2 Hours</option>
                    <option value="custom">Custom Date & Time</option>
                  </select>
                </div>

                {scheduleForm.timing === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Date/Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduleForm.customDateTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, customDateTime: e.target.value })}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pace (Rate Limit)</label>
                  <select
                    value={scheduleForm.rateLimitPerMin}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, rateLimitPerMin: Number(e.target.value) })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  >
                    <option value={10}>10 emails per minute</option>
                    <option value={20}>20 emails per minute</option>
                    <option value={30}>30 emails per minute</option>
                    <option value={60}>60 emails per minute</option>
                    <option value={0}>Max Pace (No delay)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit Target Audience (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={scheduleForm.limitCount}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, limitCount: e.target.value })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border transition-colors bg-white focus:bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave blank to send to all eligible confirmed students.</p>
                </div>

                <div className="mt-6 pt-2">
                  <button
                    type="submit"
                    disabled={scheduleLoading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors"
                  >
                    {scheduleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {scheduleLoading ? 'Scheduling...' : 'Schedule Job'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-3xl max-h-[90vh] w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors bg-black/50 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedImage}
                alt="Payment Receipt"
                className="w-full h-auto max-h-[85vh] object-contain bg-black rounded-lg shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EventRegistrations;
