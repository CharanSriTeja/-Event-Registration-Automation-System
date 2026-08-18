import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import EventCard from '../../components/EventCard';
import { motion } from 'framer-motion';
import { Plus, CalendarDays, AlertCircle } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        setEvents(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch events.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[80vh]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your events and registrations.</p>
        </div>
        <Link 
          to="/admin/events/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-gray-100 animate-pulse">
              <div className="w-full h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-8 flex flex-col items-center justify-center text-center border border-red-100 mt-10">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load dashboard</h3>
          <p className="text-red-600">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl bg-white border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center mt-8">
          <CalendarDays className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 max-w-sm mb-6">You haven't created any events yet. Click the button below to get started.</p>
          <Link 
            to="/admin/events/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Event
          </Link>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {events.map(event => (
            <EventCard key={event.id} event={event} isAdmin={true} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminDashboard;
