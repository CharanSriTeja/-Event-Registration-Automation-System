import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, X, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2, UserCheck, Calendar
} from 'lucide-react';
import api from '../../api/axios';
import { format } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

const ManageVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add modal
  const [showModal, setShowModal] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // One-time credentials banner
  const [newCredentials, setNewCredentials] = useState(null);

  // Delete loading
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/volunteers');
      setVolunteers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load volunteers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const openModal = () => {
    setFormUsername('');
    setFormPassword('');
    setCreateError('');
    setShowFormPassword(false);
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await api.post('/admin/volunteers', {
        username: formUsername,
        password: formPassword
      });
      // Show the new volunteer in the list
      setVolunteers((prev) => [res.data.volunteer, ...prev]);
      // Show one-time credentials banner
      setNewCredentials({ username: formUsername, password: formPassword });
      setShowModal(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create volunteer.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Remove this volunteer? They will no longer be able to log in.\n\nVolunteer: ${username}`)) return;
    setDeleteLoadingId(id);
    try {
      await api.delete(`/admin/volunteers/${id}`);
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove volunteer.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[80vh]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            Manage Volunteers
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage volunteer scanner accounts.</p>
        </div>
        <button
          id="add-volunteer-btn"
          onClick={openModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Add Volunteer
        </button>
      </div>

      {/* One-time credentials banner */}
      <AnimatePresence>
        {newCredentials && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 relative"
          >
            <button
              onClick={() => setNewCredentials(null)}
              className="absolute top-4 right-4 text-emerald-500 hover:text-emerald-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-800 text-base">Volunteer Created — Save These Credentials!</h3>
                <p className="text-sm text-emerald-700 mt-1 mb-3">
                  Share these login details with the volunteer. <strong>The password cannot be retrieved again</strong> — it is hashed in the database.
                </p>
                <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 inline-block font-mono text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs w-20">Username</span>
                    <span className="font-semibold text-gray-900">{newCredentials.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs w-20">Password</span>
                    <span className="font-semibold text-gray-900">{newCredentials.password}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-red-50 p-5 flex items-start border border-red-100 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : volunteers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-white border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center"
        >
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No volunteers added yet</h3>
          <p className="text-gray-500 max-w-sm mb-6">
            Add a volunteer account so they can log in and scan QR codes at the event.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add First Volunteer
          </button>
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 text-sm">
              {volunteers.length} volunteer{volunteers.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Created</div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <motion.tbody
                className="bg-white divide-y divide-gray-50"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {volunteers.map((v, i) => (
                  <motion.tr
                    key={v.id}
                    variants={rowVariants}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm uppercase">
                          {v.username[0]}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{v.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(v.createdAt), 'MMM d, yyyy, h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        id={`delete-volunteer-${v.id}`}
                        onClick={() => handleDelete(v.id, v.username)}
                        disabled={deleteLoadingId === v.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {deleteLoadingId === v.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Remove
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Volunteer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-900">Add Volunteer</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence>
                {createError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {createError}
                  </motion.div>
                )}
              </AnimatePresence>

              <form id="add-volunteer-form" onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <input
                    id="volunteer-username"
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="e.g. volunteer_01"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="volunteer-password"
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Set a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">This will be shown to you once after creation.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="create-volunteer-submit"
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {createLoading ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageVolunteers;
