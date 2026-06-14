import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import './LeadListPage.css';

export default function LeadListPage() {
  const { leads, fetchLeads, loading } = useStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  useEffect(() => {
    fetchLeads({
      status: statusFilter || undefined,
      platform: platformFilter || undefined,
    });
  }, [statusFilter, platformFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'badge-new';
      case 'contacted':
        return 'badge-contacted';
      case 'qualified':
        return 'badge-qualified';
      case 'closed_won':
        return 'badge-won';
      case 'closed_lost':
        return 'badge-lost';
      default:
        return 'badge-default';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-default';
    }
  };

  return (
    <div className="lead-list-page">
      <h1>📋 Leads</h1>

      <div className="filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="in_progress">In Progress</option>
          <option value="qualified">Qualified</option>
          <option value="closed_won">Closed Won</option>
          <option value="closed_lost">Closed Lost</option>
        </select>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Platforms</option>
          <option value="email">Email</option>
          <option value="linkedin">LinkedIn</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="yelp">Yelp</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <p>No leads found. They will appear here when you receive them from your platforms.</p>
        </div>
      ) : (
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="lead-name">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td>{lead.email || '-'}</td>
                  <td>
                    <span className="badge-platform">{lead.platform_name}</span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityBadgeClass(lead.priority)}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td>{lead.assigned_to_name || '-'}</td>
                  <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/leads/${lead.id}`} className="action-link">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
