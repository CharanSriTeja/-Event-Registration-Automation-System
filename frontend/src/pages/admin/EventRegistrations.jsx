import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

const EventRegistrations = () => {
  const { eventId } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [actionLoading, setActionLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  // Modal state
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await api.get('/events');
        const found = eventsRes.data.find(e => e.id === parseInt(eventId));
        setEvent(found);

        const regRes = await api.get(`/admin/registrations/${eventId}/pending`);
        setRegistrations(regRes.data);
      } catch (err) {
        setError('Failed to fetch pending registrations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const handleVerify = async (id, action) => {
    let reason = '';
    
    if (action === 'reject') {
      reason = window.prompt("Please provide a reason for rejection (optional):");
      if (reason === null) return;
    }

    setActionLoading(id);
    try {
      await api.put(`/admin/registrations/${id}/verify`, { action, reason });
      
      // Show success state briefly
      setActionSuccess({ id, action });
      
      setTimeout(() => {
        setRegistrations(prev => prev.filter(r => r.id !== id));
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
    return `http://localhost:5000${path}`;
  };

  if (loading) {
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Pending Verification
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

      {registrations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No pending registrations</h3>
          <p className="text-gray-500 max-w-sm">All caught up! There are no registrations waiting for payment verification.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile Stacked Layout */}
          <div className="block md:hidden divide-y divide-gray-100">
            {registrations.map((reg) => (
              <div key={reg.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{reg.name}</h3>
                    <p className="text-sm text-gray-500">{reg.email}</p>
                    <p className="text-sm text-gray-500">{reg.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{format(new Date(reg.registeredAt), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-gray-400">{format(new Date(reg.registeredAt), 'HH:mm')}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{reg.year} Year, {reg.branch}</p>
                    <p className="text-gray-500">ID: {reg.collegeId || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Proof</p>
                  {reg.paymentScreenshot ? (
                    <button 
                      onClick={() => setSelectedImage(getImageUrl(reg.paymentScreenshot))}
                      className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-2 rounded-lg"
                    >
                      <ImageIcon className="w-4 h-4" />
                      View Receipt
                    </button>
                  ) : (
                    <span className="text-sm text-red-500 font-medium">No Image Provided</span>
                  )}
                </div>

                <div className="pt-2 flex gap-2 w-full">
                  {actionSuccess?.id === reg.id ? (
                    <div className={`w-full flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white ${actionSuccess.action === 'confirm' ? 'bg-green-500' : 'bg-red-500'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      {actionSuccess.action === 'confirm' ? 'Approved!' : 'Rejected!'}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleVerify(reg.id, 'confirm')}
                        disabled={actionLoading === reg.id}
                        className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 border border-transparent text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
                      >
                        {actionLoading === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerify(reg.id, 'reject')}
                        disabled={actionLoading === reg.id}
                        className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 border border-transparent text-sm font-bold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 transition-colors"
                      >
                        {actionLoading === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
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
                {registrations.map((reg) => (
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
