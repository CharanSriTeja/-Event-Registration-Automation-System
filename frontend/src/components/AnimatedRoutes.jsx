import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import ProtectedRoute from './ProtectedRoute';
import Home from '../pages/Home';
import Register from '../pages/Register';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import EventForm from '../pages/admin/EventForm';
import EventRegistrations from '../pages/admin/EventRegistrations';
import ManageVolunteers from '../pages/admin/ManageVolunteers';
import VolunteerScanPage from '../pages/VolunteerScanPage';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register/:eventId" element={<Register />} />

        {/* Login (unified admin + volunteer) */}
        <Route path="/login" element={<LoginPage />} />
        {/* Legacy redirect so any old bookmarks still work */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Admin Routes — role: admin only */}
        <Route
          path="/admin"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/events/new"
          element={<ProtectedRoute allowedRoles={['admin']}><EventForm /></ProtectedRoute>}
        />
        <Route
          path="/admin/events/:id/edit"
          element={<ProtectedRoute allowedRoles={['admin']}><EventForm /></ProtectedRoute>}
        />
        <Route
          path="/admin/events/:eventId/registrations"
          element={<ProtectedRoute allowedRoles={['admin']}><EventRegistrations /></ProtectedRoute>}
        />
        <Route
          path="/admin/volunteers"
          element={<ProtectedRoute allowedRoles={['admin']}><ManageVolunteers /></ProtectedRoute>}
        />

        {/* Volunteer Routes — role: volunteer or admin */}
        <Route
          path="/volunteer/scan"
          element={<ProtectedRoute allowedRoles={['admin', 'volunteer']}><VolunteerScanPage /></ProtectedRoute>}
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
