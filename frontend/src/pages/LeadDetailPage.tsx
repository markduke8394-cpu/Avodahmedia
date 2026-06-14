import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import './LeadDetailPage.css';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedLead, fetchLead, updateLeadStatus, loading } = useStore();
  const [statusDropdown, setStatusDropdown] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLead(parseInt(id));
    }
  }, [id]);

  if (loading) {
    return <div className="loading">Loading lead details...</div>;
  }

  if (!selectedLead) {
    return (
      <div className="not-found">
        <p>Lead not found</p>
        <button onClick={() => navigate('/leads')} className="back-btn">
          ← Back to Leads
        </button>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    if (selectedLead.id) {
      await updateLeadStatus(selectedLead.id, newStatus);
      setStatusDropdown(false);
    }
  };

  const fullName = `${selectedLead.first_name || ''} ${selectedLead.last_name || ''}`.trim();

  return (
    <div className="lead-detail-page">
      <div className="detail-header">
        <button onClick={() => navigate('/leads')} className="back-btn">
          ← Back
        </button>
        <h1>{fullName || 'Unknown Lead'}</h1>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="detail-section">
            <h2>📞 Contact Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Email</label>
                <p>{selectedLead.email || '-'}</p>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <p>{selectedLead.phone || '-'}</p>
              </div>
              <div className="info-item">
                <label>Company</label>
                <p>{selectedLead.company || '-'}</p>
              </div>
              <div className="info-item">
                <label>Platform</label>
                <p>{selectedLead.platform_name || '-'}</p>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>💬 Message</h2>
            <div className="message-box">
              {selectedLead.message || 'No message provided'}
            </div>
          </section>

          <section className="detail-section">
            <h2>📝 Notes</h2>
            <div className="notes-container">
              <textarea
                placeholder="Add internal notes about this lead..."
                className="notes-textarea"
              />
              <button className="add-note-btn">+ Add Note</button>
            </div>
          </section>

          <section className="detail-section">
            <h2>📋 Activity Timeline</h2>
            <div className="activity-timeline">
              <div className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p className="activity-text">Lead created</p>
                  <span className="activity-date">
                    {new Date(selectedLead.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="detail-sidebar">
          <section className="sidebar-section">
            <h3>Status</h3>
            <div className="status-dropdown-wrapper">
              <button
                onClick={() => setStatusDropdown(!statusDropdown)}
                className={`status-button ${selectedLead.status}`}
              >
                {selectedLead.status.replace('_', ' ')}
                <span className="dropdown-icon">▼</span>
              </button>
              {statusDropdown && (
                <div className="dropdown-menu">
                  <button onClick={() => handleStatusChange('new')}>New</button>
                  <button onClick={() => handleStatusChange('contacted')}>Contacted</button>
                  <button onClick={() => handleStatusChange('in_progress')}>In Progress</button>
                  <button onClick={() => handleStatusChange('qualified')}>Qualified</button>
                  <button onClick={() => handleStatusChange('closed_won')}>Closed Won</button>
                  <button onClick={() => handleStatusChange('closed_lost')}>Closed Lost</button>
                </div>
              )}
            </div>
          </section>

          <section className="sidebar-section">
            <h3>Priority</h3>
            <div className={`priority-badge ${selectedLead.priority}`}>
              {selectedLead.priority}
            </div>
          </section>

          <section className="sidebar-section">
            <h3>Assigned To</h3>
            <p>{selectedLead.assigned_to_name || 'Unassigned'}</p>
          </section>

          <section className="sidebar-section">
            <h3>Dates</h3>
            <div className="dates-list">
              <div className="date-item">
                <label>Created</label>
                <p>{new Date(selectedLead.created_at).toLocaleDateString()}</p>
              </div>
              {selectedLead.contacted_at && (
                <div className="date-item">
                  <label>Contacted</label>
                  <p>{new Date(selectedLead.contacted_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </section>

          <section className="sidebar-section">
            <h2>💬 Quick Actions</h2>
            <button className="action-button">📞 Call</button>
            <button className="action-button">💬 Send SMS</button>
            <button className="action-button">📧 Send Email</button>
          </section>
        </div>
      </div>
    </div>
  );
}
