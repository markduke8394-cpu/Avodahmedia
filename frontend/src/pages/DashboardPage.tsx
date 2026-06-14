import { useEffect } from 'react';
import { useStore } from '../store/store';
import './DashboardPage.css';

export default function DashboardPage() {
  const { stats, fetchStats } = useStore();

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard-page">
      <h1>📊 Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_leads_today || 0}</div>
          <div className="stat-label">Leads Today</div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-value">{stats?.new_leads || 0}</div>
          <div className="stat-label">🔔 New Leads</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats?.qualified_leads || 0}</div>
          <div className="stat-label">✅ Qualified</div>
        </div>

        <div className="stat-card success">
          <div className="stat-value">{stats?.closed_won || 0}</div>
          <div className="stat-label">🎉 Closed Won</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats?.conversion_rate || 0}%</div>
          <div className="stat-label">Conversion Rate</div>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>📈 Getting Started</h2>
        <div className="getting-started">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Configure Platforms</h3>
              <p>Set up API credentials for LinkedIn, Facebook, Instagram, Yelp, and Email</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Add Team Members</h3>
              <p>Invite your assistants to manage leads and assign responsibilities</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Monitor Leads</h3>
              <p>Receive SMS notifications and track leads in real-time</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
