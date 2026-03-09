import {BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/RegisterPage';
import { AuthProvider } from './context/authContext';
import DashboardPage from './pages/dashboard/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import WeekPage from './pages/week/WeekPage';
import MonthPage from './pages/month/MonthPage';
import YearPage from './pages/year/YearPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }/>
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
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>    
    </BrowserRouter>
  );
}

export default App;