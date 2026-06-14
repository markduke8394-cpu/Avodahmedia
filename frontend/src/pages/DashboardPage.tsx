import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import CreatePhoneLeadModal from '../components/CreatePhoneLeadModal';
import './DashboardPage.css';

export default function DashboardPage() {
  const { stats, leads, fetchStats, fetchLeads } = useStore();
  const [showPhoneLeadModal, setShowPhoneLeadModal] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchLeads();
  }, []);

  const handleLeadCreated = () => {
    fetchStats();
    fetchLeads();
  };

  // Financial calculations
  const REVENUE_TARGET = 350000; // $350K annual goal
  const MONTHLY_TARGET = REVENUE_TARGET / 12; // $29,166
  const PAYROLL_COST = 100000; // Sarah, Mike, Jessica combined
  const TOOLS_COST = 10000; // Annual tools/hosting
  const PERSONAL_INCOME_GOAL = 170000; // $170K take-home goal

  // Calculate estimated current annual revenue from leads
  const estimatedAnnualRevenue = leads.reduce((sum, lead) => {
    if (lead.status === 'closed_won' && lead.deal_value) {
      return sum + lead.deal_value;
    }
    return sum;
  }, 0) * 12; // Project based on closed deals

  // Calculate current profitability
  const currentProfit = Math.max(0, estimatedAnnualRevenue - PAYROLL_COST - TOOLS_COST);
  const currentNetIncome = Math.max(0, currentProfit * 0.7); // After 30% taxes
  const closedWonCount = leads.filter((l) => l.status === 'closed_won').length;

  // Calculate monthly pace
  const monthsPassed = Math.max(1, Math.ceil(new Date().getDate() / 30));
  const estimatedYearlyRevenue = (estimatedAnnualRevenue / monthsPassed) * 12;
  const estimatedYearlyNetIncome = (currentNetIncome / monthsPassed) * 12;

  // Determine phase
  const isPhase1 = estimatedYearlyRevenue < 280000;
  const isPhase2 = estimatedYearlyRevenue >= 280000 && estimatedYearlyRevenue < 400000;

  const getPhaseLabel = () => {
    if (isPhase1) return 'Phase 1: Building to $250K';
    if (isPhase2) return 'Phase 2: Growing to $350K ✅';
    return 'Phase 3: At Goal!';
  };

  const getPhaseColor = () => {
    if (isPhase1) return '#ffc107';
    if (isPhase2) return '#4caf50';
    return '#00f2fe';
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <button className="log-call-btn" onClick={() => setShowPhoneLeadModal(true)}>
          ☎️ Log Phone Call
        </button>
      </div>

      <CreatePhoneLeadModal
        isOpen={showPhoneLeadModal}
        onClose={() => setShowPhoneLeadModal(false)}
        onLeadCreated={handleLeadCreated}
      />

      {/* Phase Indicator */}
      <div className="phase-indicator" style={{ borderLeftColor: getPhaseColor() }}>
        <div className="phase-label">{getPhaseLabel()}</div>
        <div className="phase-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, (estimatedYearlyRevenue / REVENUE_TARGET) * 100)}%`,
                backgroundColor: getPhaseColor(),
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Financial Goals */}
      <div className="financial-section">
        <h2>💰 Your Financial Goals</h2>
        <div className="financial-grid">
          <div className="financial-card">
            <div className="financial-label">Business Revenue Target</div>
            <div className="financial-metric">
              ${(estimatedYearlyRevenue / 1000).toFixed(0)}K / $350K
            </div>
            <div className="financial-progress">
              <div className="mini-progress-bar">
                <div
                  className="mini-progress-fill"
                  style={{
                    width: `${Math.min(100, (estimatedYearlyRevenue / REVENUE_TARGET) * 100)}%`,
                    backgroundColor: '#646cff',
                  }}
                ></div>
              </div>
              <span className="progress-percent">
                {Math.min(100, (estimatedYearlyRevenue / REVENUE_TARGET) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="financial-card highlight">
            <div className="financial-label">Your Personal Take-Home</div>
            <div className="financial-metric">
              ${(estimatedYearlyNetIncome / 1000).toFixed(0)}K / $170K
            </div>
            <div className="financial-progress">
              <div className="mini-progress-bar">
                <div
                  className="mini-progress-fill"
                  style={{
                    width: `${Math.min(100, (estimatedYearlyNetIncome / PERSONAL_INCOME_GOAL) * 100)}%`,
                    backgroundColor: '#f5576c',
                  }}
                ></div>
              </div>
              <span className="progress-percent">
                {Math.min(100, (estimatedYearlyNetIncome / PERSONAL_INCOME_GOAL) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="financial-card">
            <div className="financial-label">Monthly Revenue Target</div>
            <div className="financial-metric">${(MONTHLY_TARGET / 1000).toFixed(1)}K</div>
            <div className="financial-subtitle">Need 7-8 clients/month at $3.5-4K avg</div>
          </div>

          <div className="financial-card">
            <div className="financial-label">Profit Margin</div>
            <div className="financial-metric">
              {estimatedYearlyRevenue > 0
                ? Math.round((currentProfit / estimatedYearlyRevenue) * 100) + '%'
                : '0%'}
            </div>
            <div className="financial-subtitle">Very healthy! (Goal: 65%+)</div>
          </div>
        </div>
      </div>

      {/* Team & Operations */}
      <div className="operations-section">
        <h2>👥 Team & Operations</h2>
        <div className="operations-grid">
          <div className="op-card">
            <div className="op-label">Team Payroll (Annual)</div>
            <div className="op-value">${(PAYROLL_COST / 1000).toFixed(0)}K</div>
            <div className="op-detail">Sarah, Mike, Jessica ($33K each)</div>
          </div>

          <div className="op-card">
            <div className="op-label">Tools & Hosting</div>
            <div className="op-value">${(TOOLS_COST / 1000).toFixed(0)}K</div>
            <div className="op-detail">Software, hosting, Twilio, etc.</div>
          </div>

          <div className="op-card">
            <div className="op-label">Gross Profit @ $350K</div>
            <div className="op-value">${((REVENUE_TARGET - PAYROLL_COST - TOOLS_COST) / 1000).toFixed(0)}K</div>
            <div className="op-detail">Before taxes</div>
          </div>

          <div className="op-card success">
            <div className="op-label">Your Net @ $350K</div>
            <div className="op-value">~$168K</div>
            <div className="op-detail">After 30% taxes ✅</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{leads.length}</div>
          <div className="stat-label">Total Leads in Pipeline</div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-value">{closedWonCount}</div>
          <div className="stat-label">🎉 Closed Deals</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats?.qualified_leads || 0}</div>
          <div className="stat-label">✅ Qualified Leads</div>
        </div>

        <div className="stat-card success">
          <div className="stat-value">${(stats?.conversion_rate || 0).toFixed(1)}%</div>
          <div className="stat-label">Conversion Rate</div>
        </div>
      </div>

      {/* Getting Started */}
      <section className="dashboard-section">
        <h2>🚀 Path to $350K Revenue</h2>
        <div className="getting-started">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>You: Take Phone Calls & Log Deals</h3>
              <p>Every call is potential revenue. Log with deal value and confidence level.</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Sarah: Qualify Digital Leads</h3>
              <p>Email, social, SMS leads → Sarah filters and qualifies them quickly.</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Jessica: Create Proposals & Close</h3>
              <p>Qualified leads → Jessica converts to contracts. She drives revenue.</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Hit $29K/Month = $350K Year</h3>
              <p>At 7-8 clients/month avg, you'll hit $350K revenue and $168K personal income.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
