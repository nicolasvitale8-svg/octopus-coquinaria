import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

// ============================================
// LAZY LOADED - Paginas Publicas
// ============================================
const Home = lazy(() => import('./pages/Home'));
const QuickDiagnostic = lazy(() => import('./pages/QuickDiagnostic'));
const DeepDiagnostic = lazy(() => import('./pages/DeepDiagnostic'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Methodology = lazy(() => import('./pages/Methodology'));
const Academy = lazy(() => import('./pages/Academy'));
const ResourceDetail = lazy(() => import('./pages/ResourceDetail'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const HubCalendar = lazy(() => import('./pages/HubCalendar'));
const ClientProjectRedirect = lazy(() => import('./pages/ClientProjectRedirect'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));

// ============================================
// LAZY LOADED MODULES (Code Splitting)
// ============================================
// Admin Module - Lazy loaded
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLeads = lazy(() => import('./pages/AdminLeads'));
const AdminCalendar = lazy(() => import('./pages/AdminCalendar'));
const AdminAcademy = lazy(() => import('./pages/AdminAcademy'));
const AcademyDocumentGenerator = lazy(() => import('./academy/pages/DocumentGenerator'));
const AdminProjects = lazy(() => import('./pages/AdminProjects'));
const AdminProjectHub = lazy(() => import('./pages/AdminProjectHub'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminBoard = lazy(() => import('./pages/AdminBoard'));
const ConsultantDashboard = lazy(() => import('./pages/ConsultantDashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminConfig = lazy(() => import('./pages/AdminPages').then(m => ({ default: m.AdminConfig })));

// Finance Module - Lazy loaded (incluye FinanzaProvider)
const FinanzaProvider = lazy(() => import('./finance/context/FinanzaContext').then(m => ({ default: m.FinanzaProvider })));
const FinanceLayout = lazy(() => import('./finance/components/FinanceLayout'));
const FinanceDashboard = lazy(() => import('./finance/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const FinanceAnnualSummary = lazy(() => import('./finance/pages/AnnualSummary').then(m => ({ default: m.AnnualSummary })));
const FinanceTransactions = lazy(() => import('./finance/pages/Transactions').then(m => ({ default: m.Transactions })));
const FinanceBudget = lazy(() => import('./finance/pages/Budget').then(m => ({ default: m.Budget })));
const FinanceJars = lazy(() => import('./finance/pages/Jars').then(m => ({ default: m.Jars })));
const FinanceAccounts = lazy(() => import('./finance/pages/Accounts').then(m => ({ default: m.Accounts })));
const FinanceImport = lazy(() => import('./finance/pages/Import').then(m => ({ default: m.ImportPage })));
const FinanceSettings = lazy(() => import('./finance/pages/Settings').then(m => ({ default: m.SettingsPage })));
const FinanceCheques = lazy(() => import('./finance/pages/Cheques').then(m => ({ default: m.Cheques })));
const FinanceCashFlow = lazy(() => import('./finance/pages/CashFlow').then(m => ({ default: m.CashFlow })));
const FinanceLoans = lazy(() => import('./finance/pages/Loans').then(m => ({ default: m.Loans })));

// Procurement / Gatekeeper
const OrdersList = lazy(() => import('./procurement/pages/OrdersList').then(m => ({ default: m.OrdersList })));
const OrderForm = lazy(() => import('./procurement/pages/OrderForm').then(m => ({ default: m.OrderForm })));
const OrderDetail = lazy(() => import('./procurement/pages/OrderDetail').then(m => ({ default: m.OrderDetail })));
const SupplyItemsPage = lazy(() => import('./procurement/pages/SupplyItems').then(m => ({ default: m.SupplyItemsPage })));
const StockAlerts = lazy(() => import('./procurement/pages/StockAlerts').then(m => ({ default: m.StockAlerts })));
const StockMovements = lazy(() => import('./procurement/pages/StockMovements').then(m => ({ default: m.StockMovements })));

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
        <Router>
          <ScrollToTop />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quick-diagnostic" element={<QuickDiagnostic />} />
              <Route path="/deep-diagnostic" element={<DeepDiagnostic />} />

              {/* Pantalla visible solo para usuarios autenticados SIN rol aprobado */}
              <Route path="/pending-approval" element={
                <ProtectedRoute>
                  <PendingApproval />
                </ProtectedRoute>
              } />

              {/* Dashboard requiere rol aprobado */}
              <Route element={<ProtectedRoute requireApproved={true} />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              {/* Rutas ADMINISTRADOR (Modulo Consultor/Admin) */}
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
                  <Route path="academy/documents" element={<AcademyDocumentGenerator />} />
                  <Route path="board" element={<AdminBoard />} />
                  <Route path="config" element={<AdminConfig />} />
                  <Route path="profile" element={<UserProfile />} />
                  {/* Procurement Routes (Admin) */}
                  <Route path="procurement" element={<OrdersList />} />
                  <Route path="procurement/new" element={<OrderForm />} />
                  <Route path="procurement/alerts" element={<StockAlerts />} />
                  <Route path="procurement/movements" element={<StockMovements />} />
                  <Route path="procurement/:id" element={<OrderDetail />} />
                  <Route path="supply" element={<SupplyItemsPage />} />
                </Route>
              </Route>

              {/* New Hub Routes for Clients/Managers - ahora con requireApproved */}
              <Route path="/hub/profile" element={
                <ProtectedRoute requireApproved={true}>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/hub/calendar" element={
                <ProtectedRoute requireApproved={true}>
                  <HubCalendar />
                </ProtectedRoute>
              } />
              <Route path="/hub/my-project" element={
                <ProtectedRoute requireApproved={true}>
                  <ClientProjectRedirect />
                </ProtectedRoute>
              } />
              {/* Reuse AdminProjectHub for Clients (Read Only logic handled inside) */}
              <Route path="/hub/projects/:id" element={
                <ProtectedRoute requireApproved={true}>
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

              {/* Finance Module Routes - FinanzaProvider SOLO envuelve las rutas de finance.
                  requireApproved=true blinda toda la info financiera de usuarios en espera */}
              <Route element={
                <ProtectedRoute requireApproved={true}>
                  <FinanzaProvider><FinanceLayout /></FinanzaProvider>
                </ProtectedRoute>
              }>
                <Route path="/finance" element={<FinanceDashboard />} />
                <Route path="/finance/annual" element={<FinanceAnnualSummary />} />
                <Route path="/finance/transactions" element={<FinanceTransactions />} />
                <Route path="/finance/budget" element={<FinanceBudget />} />
                <Route path="/finance/jars" element={<FinanceJars />} />
                <Route path="/finance/accounts" element={<FinanceAccounts />} />
                <Route path="/finance/import" element={<FinanceImport />} />
                <Route path="/finance/settings" element={<FinanceSettings />} />
                <Route path="/finance/cheques" element={<FinanceCheques />} />
                <Route path="/finance/cashflow" element={<FinanceCashFlow />} />
                <Route path="/finance/loans" element={<FinanceLoans />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
