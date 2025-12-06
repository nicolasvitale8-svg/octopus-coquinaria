import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import QuickDiagnostic from './pages/QuickDiagnostic';
import DeepDiagnostic from './pages/DeepDiagnostic';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Methodology from './pages/Methodology';
import Academy from './pages/Academy';
import ResourceDetail from './pages/ResourceDetail';
import About from './pages/About';
import Services from './pages/Services';
import CalendarPage from './pages/Calendar';
import ProtectedRoute from './components/ProtectedRoute';

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminLeads from './pages/AdminLeads';
import AdminCalendar from './pages/AdminCalendar';
import AdminAcademy from './pages/AdminAcademy';
import AdminUsers from './pages/AdminUsers';
import { AdminConfig } from './pages/AdminPages';


import { AuthProvider } from './contexts/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quick-diagnostic" element={<QuickDiagnostic />} />
          <Route path="/deep-diagnostic" element={<DeepDiagnostic />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Rutas ADMINISTRADOR (Módulo Consultor) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="users" element={<AdminUsers />} /> {/* Nueva Ruta */}
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="academy" element={<AdminAcademy />} />
              <Route path="config" element={<AdminConfig />} />
            </Route>
          </Route>

          <Route path="/methodology" element={<Methodology />} />
          <Route path="/resources" element={<Academy />} />
          <Route path="/academy/:id" element={<ResourceDetail />} />
          <Route path="/login" element={<Login />} />

          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/calendar" element={<CalendarPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
