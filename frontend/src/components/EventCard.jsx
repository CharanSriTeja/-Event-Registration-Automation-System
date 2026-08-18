import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Edit, ClipboardList, Trash2 } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const EventCard = ({ event, isAdmin = false, onDelete }) => {
  const imageUrl = event.coverImageUrl 
    ? `http://localhost:5000${event.coverImageUrl}` 
    : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  const eventDate = new Date(event.date).toLocaleDateString(undefined, { 
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
  });

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col transition-shadow"
    >
      <div className="relative h-48 overflow-hidden group">
        <img 
          src={imageUrl} 
          alt={event.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        <h3 className="absolute bottom-4 left-4 right-4 text-xl font-bold text-white drop-shadow-md truncate">
          {event.name}
        </h3>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-3">
          {event.description || "No description available."}
        </p>
        
        <div className="text-sm text-gray-700 mb-6 space-y-2 font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="truncate">{eventDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>Capacity: {event.capacity}</span>
          </div>
        </div>
        
        {isAdmin ? (
          <div className="flex space-x-2 w-full mt-auto">
            <Link 
              to={`/admin/events/${event.id}/registrations`}
              className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ClipboardList className="w-4 h-4" />
              Manage
            </Link>
            <Link 
              to={`/admin/events/${event.id}/edit`}
              className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Edit Event"
            >
              <Edit className="w-4 h-4" />
            </Link>
            {onDelete && (
              <button 
                onClick={() => onDelete(event.id, event.name)}
                className="inline-flex justify-center items-center px-3 py-2 border border-red-200 text-sm font-medium rounded-lg shadow-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Delete Event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <Link 
            to={`/register/${event.id}`}
            className="w-full mt-auto inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Register Now
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
