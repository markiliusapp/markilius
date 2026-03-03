import {Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login/loginPage';
import RegisterPage from './pages/register/RegisterPage';


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;