import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/store';
import DashboardPage from './pages/DashboardPage';
import LeadListPage from './pages/LeadListPage';
import LeadDetailPage from './pages/LeadDetailPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import './App.css';

function App() {
  const { isAuthenticated, checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/leads" element={<LeadListPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
