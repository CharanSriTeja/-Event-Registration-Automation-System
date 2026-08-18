import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import ProtectedRoute from './ProtectedRoute';
import Home from '../pages/Home';
import Register from '../pages/Register';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import EventForm from '../pages/admin/EventForm';
import EventRegistrations from '../pages/admin/EventRegistrations';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register/:eventId" element={<Register />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin" 
          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/events/new" 
          element={<ProtectedRoute><EventForm /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/events/:id/edit" 
          element={<ProtectedRoute><EventForm /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/events/:eventId/registrations" 
          element={<ProtectedRoute><EventRegistrations /></ProtectedRoute>} 
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
