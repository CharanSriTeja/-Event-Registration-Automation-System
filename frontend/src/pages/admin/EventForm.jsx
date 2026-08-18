import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Save, CheckCircle2 } from 'lucide-react';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venue: '',
    capacity: '',
    description: ''
  });
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(isEditMode);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const fetchEvent = async () => {
        try {
          const res = await api.get('/events');
          const event = res.data.find(e => e.id === parseInt(id));
          if (event) {
            const dateObj = new Date(event.date);
            const formattedDate = dateObj.toISOString().slice(0, 16);
            
            setFormData({
              name: event.name,
              date: formattedDate,
              venue: event.venue,
              capacity: event.capacity,
              description: event.description || ''
            });
          }
        } catch (err) {
          setError('Failed to fetch event data.');
        } finally {
          setFetching(false);
        }
      };
      fetchEvent();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('date', formData.date);
      data.append('venue', formData.venue);
      data.append('capacity', formData.capacity);
      data.append('description', formData.description);
      
      if (coverImage) {
        data.append('coverImage', coverImage);
      }

      if (isEditMode) {
        await api.put(`/events/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMsg('Event updated successfully!');
      } else {
        await api.post('/events', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMsg('Event created successfully!');
      }

      setTimeout(() => {
        navigate('/admin');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event.');
      setLoading(false);
    }
  };

  if (fetching) {
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
      className="max-w-3xl mx-auto px-4 py-10"
    >
      <div className="mb-6">
        <Link 
          to="/admin" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h2>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6"
          >
            <p>{error}</p>
          </motion.div>
        )}
        
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="font-medium">{successMsg}</p>
            <p className="text-sm text-green-600 ml-auto">Redirecting...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 shadow-lg rounded-xl border border-gray-100 space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Event Name</label>
            <input 
              type="text" name="name" required value={formData.name} onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date & Time</label>
              <input 
                type="datetime-local" name="date" required value={formData.date} onChange={handleChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Capacity</label>
              <input 
                type="number" name="capacity" required min="1" value={formData.capacity} onChange={handleChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Venue</label>
            <input 
              type="text" name="venue" required value={formData.venue} onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea 
              name="description" rows="4" value={formData.description} onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white resize-y" 
            ></textarea>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Photo</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-200 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-indigo-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-1 text-sm text-indigo-700 font-semibold">{coverImage ? coverImage.name : "Click to upload cover photo"}</p>
                </div>
                <input 
                  type="file" className="hidden" accept="image/jpeg, image/jpg, image/png" onChange={handleFileChange}
                />
              </label>
            </div>
            {isEditMode && !coverImage && (
              <p className="text-xs text-gray-500 mt-2">Leave empty to keep the existing cover photo.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
          <Link
            to="/admin"
            className="inline-flex justify-center items-center px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !!successMsg}
            className="inline-flex justify-center items-center gap-2 px-6 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : 'Save Event'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default EventForm;
