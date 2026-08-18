import { useState, useEffect } from 'react';
import api from '../api/axios';
import EventCard from '../components/EventCard';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarX } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const Home = () => {
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
        setError('Failed to fetch events. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Upcoming Events</h1>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-gray-100 animate-pulse">
              <div className="w-full h-48 bg-gray-200"></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
                
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                
                <div className="h-10 bg-gray-200 rounded w-full mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-6 flex flex-col items-center justify-center text-center border border-red-100 mt-10">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Oops! Something went wrong.</h3>
          <p className="text-red-600">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center mt-10">
          <CalendarX className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 max-w-sm">We couldn't find any upcoming events at the moment. Please check back later!</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Home;
