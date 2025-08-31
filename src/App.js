import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentView from './pages/DocumentView';
import ProcessingScreen from './pages/ProcessingScreen';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// App Component
const AppContent = () => {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/document/:docId" 
            element={
              <ProtectedRoute>
                <DocumentView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/processing/:docId" 
            element={
              <ProtectedRoute>
                <ProcessingScreen />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 