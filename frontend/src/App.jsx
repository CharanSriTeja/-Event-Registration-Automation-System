import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AnimatedRoutes from './components/AnimatedRoutes';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar />
          <main>
            <AnimatedRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
