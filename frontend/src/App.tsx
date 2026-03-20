import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/RegisterPage';
import { AuthProvider, useAuth } from './context/authContext';
import DashboardPage from './pages/dashboard/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import WeekPage from './pages/week/WeekPage';
import MonthPage from './pages/month/MonthPage';
import YearPage from './pages/year/YearPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/profile/ProfilePage';
import ArenasPage from './pages/arenas/ArenasPage';
import PublicProfilePage from './pages/public/PublicProfilePage';
import PricingPage from './pages/pricing/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import LandingPage from './pages/landing/LandingPage';

const RootRoute = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  const isSubscribed = user?.subscription_status === 'active' || user?.subscription_status === 'lifetime';
  return isSubscribed ? <Navigate to="/dashboard" /> : <LandingPage />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="dashboard/week" element={
            <ProtectedRoute>
              <WeekPage />
            </ProtectedRoute>
          } />
          <Route path="dashboard/month" element={
            <ProtectedRoute>
              <MonthPage />
            </ProtectedRoute>
          } />
          <Route path="dashboard/year" element={
            <ProtectedRoute>
              <YearPage />
            </ProtectedRoute>
          } />
          <Route path="dashboard/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="dashboard/arenas" element={
            <ProtectedRoute>
              <ArenasPage />
            </ProtectedRoute>
          } />
          <Route path="/u/:publicId" element={<PublicProfilePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
