import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import AcquiringClients from '@/pages/AcquiringClients';
import IssuingClients from '@/pages/IssuingClients';
import PendingChanges from '@/pages/PendingChanges';
import AuditTrail from '@/pages/AuditTrail';
import Alerts from '@/pages/Alerts';
import Thresholds from '@/pages/Thresholds';
import BusinessConfigs from '@/pages/BusinessConfigs';
import GitManagement from '@/pages/GitManagement';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/acquiring-clients"
        element={
          <ProtectedRoute>
            <AcquiringClients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issuing-clients"
        element={
          <ProtectedRoute>
            <IssuingClients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending-changes"
        element={
          <ProtectedRoute>
            <PendingChanges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-trail"
        element={
          <ProtectedRoute>
            <AuditTrail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/thresholds"
        element={
          <ProtectedRoute>
            <Thresholds />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business-configs"
        element={
          <ProtectedRoute>
            <BusinessConfigs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/git-management"
        element={
          <ProtectedRoute>
            <GitManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
