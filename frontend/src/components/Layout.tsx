import { Outlet, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/store';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="logo">
          <h1>🚀 Avodahmedia</h1>
        </div>

        <div className="nav-menu">
          <Link
            to="/"
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/leads"
            className={`nav-item ${isActive('/leads') ? 'active' : ''}`}
          >
            📋 Leads
          </Link>
        </div>

        <div className="user-section">
          <div className="user-info">
            <p className="user-name">{user?.name || 'User'}</p>
            <p className="user-email">{user?.email}</p>
          </div>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
