import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

// Pages
import Landing from './pages/Landing/index.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import Onboarding from './pages/Auth/Onboarding.jsx';
import Dashboard from './pages/Dashboard/index.jsx';
import Invoices from './pages/Invoices/index.jsx';
import InvoiceForm from './pages/Invoices/InvoiceForm.jsx';
import InvoiceDetail from './pages/Invoices/InvoiceDetail.jsx';
import Customers from './pages/Customers/index.jsx';
import CustomerDetail from './pages/Customers/CustomerDetail.jsx';
import Expenses from './pages/Expenses/index.jsx';
import Accounting from './pages/Accounting/index.jsx';
import Payroll from './pages/Payroll/index.jsx';
import Reports from './pages/Reports/index.jsx';
import Settings from './pages/Settings/index.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--background)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid var(--primary)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'var(--text-2)', fontSize:14 }}>Loading Klivora...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!user.profile?.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App (protected, with sidebar layout) */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font)',
            borderRadius: '10px',
            fontSize: '14px',
            boxShadow: 'var(--shadow-md)',
          },
          success: { iconTheme: { primary: '#00C896', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
