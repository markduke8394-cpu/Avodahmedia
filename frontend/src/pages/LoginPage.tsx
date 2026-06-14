import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🚀 Avodahmedia</h1>
        <h2>Lead Management System</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="demo-note">
          Demo: Use any email/password to login during development
        </p>
      </div>
    </div>
  );
}
