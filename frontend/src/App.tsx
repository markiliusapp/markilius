import {BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login/loginPage';
import RegisterPage from './pages/register/RegisterPage';



function App() {
  return (
    <BrowserRouter>    
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;