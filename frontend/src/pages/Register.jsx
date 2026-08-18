import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const { eventId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    collegeId: '',
    year: '1st',
    branch: 'CSE'
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get('/events');
        const found = res.data.find(e => e.id === parseInt(eventId));
        if (found) setEvent(found);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      if (formData.collegeId) data.append('collegeId', formData.collegeId);
      data.append('year', formData.year);
      data.append('branch', formData.branch);
      data.append('eventId', eventId);
      
      if (paymentScreenshot) {
        data.append('paymentScreenshot', paymentScreenshot);
      }

      const response = await api.post('/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setRegistrationData(response.data.registration);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success && registrationData) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100 text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        </motion.div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Registration Received!</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          We've received your details. A confirmation email will be sent once your payment is verified by the admin.
        </p>
        
        <div className="bg-green-50 p-6 rounded-lg mb-8 inline-block border border-green-100 shadow-inner">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Registration ID</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{registrationData.registrationId}</p>
        </div>
        
        <div>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto mt-10 p-6 sm:p-8 bg-white rounded-xl shadow-lg border border-gray-100 mb-10"
    >
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>
      </div>

      <div className="border-b border-gray-200 pb-5 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          Register {event ? `for ${event.name}` : ''}
        </h2>
        <p className="mt-1 text-sm text-gray-500">Please fill out all required fields carefully.</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex items-start">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input 
              type="text" name="name" required value={formData.name} onChange={handleChange}
              placeholder="John Doe"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <input 
              type="email" name="email" required value={formData.email} onChange={handleChange}
              placeholder="john@example.com"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
            <input 
              type="tel" name="phone" required value={formData.phone} onChange={handleChange}
              placeholder="+91 9876543210"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white" 
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">College ID (Optional)</label>
            <input 
              type="text" name="collegeId" value={formData.collegeId} onChange={handleChange}
              placeholder="e.g. 21BCE0001"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Year <span className="text-red-500">*</span></label>
            <select 
              name="year" required value={formData.year} onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white cursor-pointer"
            >
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Branch <span className="text-red-500">*</span></label>
            <select 
              name="branch" required value={formData.branch} onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border transition-colors bg-gray-50 focus:bg-white cursor-pointer"
            >
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="IT">IT</option>
              <option value="AI&ML">AI&ML</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Screenshot <span className="text-red-500">*</span></label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-indigo-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-indigo-700 font-semibold">{paymentScreenshot ? paymentScreenshot.name : "Click to upload"}</p>
                <p className="text-xs text-indigo-500">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/jpeg, image/jpg, image/png"
                required
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Registration...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default Register;
