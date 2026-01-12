import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import QuickDiagnostic from './pages/QuickDiagnostic';
import DeepDiagnostic from './pages/DeepDiagnostic';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
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
import AdminProjects from './pages/AdminProjects';
import AdminProjectHub from './pages/AdminProjectHub';
import AdminUsers from './pages/AdminUsers';
import AdminBoard from './pages/AdminBoard';
import ConsultantDashboard from './pages/ConsultantDashboard';
import UserProfile from './pages/UserProfile';
import ScrollToTop from './components/ScrollToTop';
import { AdminConfig } from './pages/AdminPages';
import { FinanzaProvider } from './finance/context/FinanzaContext';
import { Dashboard as FinanceDashboard } from './finance/pages/Dashboard';
import { Transactions as FinanceTransactions } from './finance/pages/Transactions';
import { Budget as FinanceBudget } from './finance/pages/Budget';
import { Jars as FinanceJars } from './finance/pages/Jars';
import { Accounts as FinanceAccounts } from './finance/pages/Accounts';
import { ImportPage as FinanceImport } from './finance/pages/Import';
import { SettingsPage as FinanceSettings } from './finance/pages/Settings';
import { Cheques as FinanceCheques } from './finance/pages/Cheques';
import FinanceLayout from './finance/components/FinanceLayout';


import { AuthProvider } from './contexts/AuthContext';
// import { useEffect } from 'react'; // REMOVE DUPLICATE
import { syncLocalProjects } from './services/projectService';
import { syncLocalLeads } from './services/storage';
import HubCalendar from './pages/HubCalendar';
import ClientProjectRedirect from './pages/ClientProjectRedirect';

const App = () => {
  useEffect(() => {
    // syncLocalProjects(); 
    // syncLocalLeads(); 
  }, []);
  return (
    <AuthProvider>
      <FinanzaProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quick-diagnostic" element={<QuickDiagnostic />} />
            <Route path="/deep-diagnostic" element={<DeepDiagnostic />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Rutas ADMINISTRADOR (Módulo Consultor/Admin) */}
            <Route element={<ProtectedRoute requirePrivileged={true} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="consultant-dashboard" element={<ConsultantDashboard />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="projects/:id" element={<AdminProjectHub />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="calendar" element={<AdminCalendar />} />
                <Route path="academy" element={<AdminAcademy />} />
                <Route path="board" element={<AdminBoard />} />
                <Route path="config" element={<AdminConfig />} />
                <Route path="profile" element={<UserProfile />} />
              </Route>
            </Route>

            {/* New Hub Routes for Clients/Managers */}
            <Route path="/hub/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/hub/calendar" element={
              <ProtectedRoute>
                <HubCalendar />
              </ProtectedRoute>
            } />

            <Route path="/hub/my-project" element={
              <ProtectedRoute>
                <ClientProjectRedirect />
              </ProtectedRoute>
            } />

            {/* Reuse AdminProjectHub for Clients (Read Only logic handled inside) */}
            <Route path="/hub/projects/:id" element={
              <ProtectedRoute>
                <AdminProjectHub />
              </ProtectedRoute>
            } />

            <Route path="/methodology" element={<Methodology />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/academy/:id" element={<ResourceDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/calendar" element={<CalendarPage />} />

            {/* Finance Module Routes */}
            <Route element={<ProtectedRoute><FinanceLayout /></ProtectedRoute>}>
              <Route path="/finance" element={<FinanceDashboard />} />
              <Route path="/finance/transactions" element={<FinanceTransactions />} />
              <Route path="/finance/budget" element={<FinanceBudget />} />
              <Route path="/finance/jars" element={<FinanceJars />} />
              <Route path="/finance/accounts" element={<FinanceAccounts />} />
              <Route path="/finance/import" element={<FinanceImport />} />
              <Route path="/finance/settings" element={<FinanceSettings />} />
              <Route path="/finance/cheques" element={<FinanceCheques />} />
            </Route>


            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </FinanzaProvider>
    </AuthProvider>
  );
};

export default App;
