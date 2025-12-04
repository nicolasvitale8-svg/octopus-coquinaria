
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import QuickDiagnostic from './pages/QuickDiagnostic';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Methodology from './pages/Methodology';
import DeepDiagnostic from './pages/DeepDiagnostic';
import Academy from './pages/Academy';
import ResourceDetail from './pages/ResourceDetail';
import AdminLeads from './pages/AdminLeads';
import About from './pages/About';
import Services from './pages/Services';
import CalendarPage from './pages/Calendar';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quick-diagnostic" element={<QuickDiagnostic />} />
        <Route path="/deep-diagnostic" element={<DeepDiagnostic />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/methodology" element={<Methodology />} />
        <Route path="/resources" element={<Academy />} />
        <Route path="/academy/:id" element={<ResourceDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/leads" element={<AdminLeads />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/admin" element={<Login />} /> {/* Placeholder reuse for demo */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
