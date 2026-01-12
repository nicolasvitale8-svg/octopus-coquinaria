import React, { Suspense, lazy } from 'react';
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
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { FinanzaProvider } from './finance/context/FinanzaContext';
import HubCalendar from './pages/HubCalendar';
import ClientProjectRedirect from './pages/ClientProjectRedirect';

// ============================================
// LAZY LOADED MODULES (Code Splitting)
// ============================================

// Admin Module - Lazy loaded
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLeads = lazy(() => import('./pages/AdminLeads'));
const AdminCalendar = lazy(() => import('./pages/AdminCalendar'));
const AdminAcademy = lazy(() => import('./pages/AdminAcademy'));
const AdminProjects = lazy(() => import('./pages/AdminProjects'));
const AdminProjectHub = lazy(() => import('./pages/AdminProjectHub'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminBoard = lazy(() => import('./pages/AdminBoard'));
const ConsultantDashboard = lazy(() => import('./pages/ConsultantDashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminConfig = lazy(() => import('./pages/AdminPages').then(m => ({ default: m.AdminConfig })));

// Finance Module - Lazy loaded
const FinanceLayout = lazy(() => import('./finance/components/FinanceLayout'));
const FinanceDashboard = lazy(() => import('./finance/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const FinanceTransactions = lazy(() => import('./finance/pages/Transactions').then(m => ({ default: m.Transactions })));
const FinanceBudget = lazy(() => import('./finance/pages/Budget').then(m => ({ default: m.Budget })));
const FinanceJars = lazy(() => import('./finance/pages/Jars').then(m => ({ default: m.Jars })));
const FinanceAccounts = lazy(() => import('./finance/pages/Accounts').then(m => ({ default: m.Accounts })));
const FinanceImport = lazy(() => import('./finance/pages/Import').then(m => ({ default: m.ImportPage })));
const FinanceSettings = lazy(() => import('./finance/pages/Settings').then(m => ({ default: m.SettingsPage })));
const FinanceCheques = lazy(() => import('./finance/pages/Cheques').then(m => ({ default: m.Cheques })));
const FinanceCashFlow = lazy(() => import('./finance/pages/CashFlow').then(m => ({ default: m.CashFlow })));

// Procurement / Gatekeeper
const GatekeeperDashboard = lazy(() => import('./procurement/pages/GatekeeperDashboard').then(m => ({ default: m.GatekeeperDashboard })));
const SupplyItemsPage = lazy(() => import('./procurement/pages/SupplyItems').then(m => ({ default: m.SupplyItemsPage })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-amber-400 text-lg font-medium">Cargando...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FinanzaProvider>
          <Router>
            <ScrollToTop />
            <Suspense fallback={<LoadingFallback />}>
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


                    {/* Procurement Routes (Admin) */}
                    <Route path="procurement" element={<GatekeeperDashboard />} />
                    <Route path="supply" element={<SupplyItemsPage />} />
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
                  <Route path="/finance/cashflow" element={<FinanceCashFlow />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </FinanzaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
