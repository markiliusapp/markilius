import {BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/RegisterPage';
import { AuthProvider } from './context/authContext';
import DashboardPage from './pages/dashboard/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }/>
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>    
    </BrowserRouter>
  );
}

export default App;