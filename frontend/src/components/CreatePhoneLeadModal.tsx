import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './CreatePhoneLeadModal.css';

interface CreatePhoneLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

export default function CreatePhoneLeadModal({
  isOpen,
  onClose,
  onLeadCreated,
}: CreatePhoneLeadModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    serviceInterest: 'website_design',
    budgetRange: '$3K-$5K',
    dealValue: '',
    decisionMaker: true,
    confidenceLevel: 'medium',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/leads', {
        platformId: 1, // Phone platform
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        serviceInterest: formData.serviceInterest,
        budgetRange: formData.budgetRange,
        dealValue: formData.dealValue ? parseFloat(formData.dealValue) : null,
        decisionMaker: formData.decisionMaker,
        confidenceLevel: formData.confidenceLevel,
        message: formData.notes,
        status: 'contacted', // Already talked to them
        rawData: {
          source: 'phone_call',
          timestamp: new Date().toISOString(),
        },
      });

      onLeadCreated();
      onClose();
      navigate(`/leads/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📞 Log Phone Call Lead</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="phone-lead-form">
          <div className="form-section">
            <h3>Contact Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Project Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="serviceInterest">Service Interested In</label>
                <select
                  id="serviceInterest"
                  name="serviceInterest"
                  value={formData.serviceInterest}
                  onChange={handleChange}
                >
                  <option value="website_design">Website Design</option>
                  <option value="branding">Branding</option>
                  <option value="marketing">Marketing</option>
                  <option value="social_media">Social Media Management</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="budgetRange">Budget Range</label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleChange}
                >
                  <option value="$2K-$3K">$2K-$3K (Small - 2 weeks)</option>
                  <option value="$3K-$5K">$3K-$5K (Medium - 1 month)</option>
                  <option value="$5K-$8K">$5K-$8K (Larger - 1 month)</option>
                  <option value="$8K-$12K">$8K-$12K (Large - 6 weeks)</option>
                  <option value="$12K+">$12K+ (Custom - discuss)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dealValue">Estimated Deal Value ($)</label>
                <input
                  type="number"
                  id="dealValue"
                  name="dealValue"
                  value={formData.dealValue}
                  onChange={handleChange}
                  placeholder="e.g., 12000"
                  min="0"
                  step="500"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confidenceLevel">Your Confidence Level</label>
                <select
                  id="confidenceLevel"
                  name="confidenceLevel"
                  value={formData.confidenceLevel}
                  onChange={handleChange}
                >
                  <option value="low">Low (might not happen)</option>
                  <option value="medium">Medium (decent chance)</option>
                  <option value="high">High (very likely)</option>
                </select>
              </div>
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="decisionMaker"
                name="decisionMaker"
                checked={formData.decisionMaker}
                onChange={handleChange}
              />
              <label htmlFor="decisionMaker">This person is the decision maker</label>
            </div>
          </div>

          <div className="form-section">
            <h3>Call Notes</h3>
            <div className="form-group">
              <label htmlFor="notes">Notes from Call</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="What did they say? Any specific requirements? Timeline? Challenges?"
                rows={4}
              />
              <div className="notes-hint">
                💡 Tip: Include budget discussed, timeline, and any specific needs they mentioned
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating...' : '✓ Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
