import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import api from '../api/client';
import './PipelinePage.css';

interface PipelineData {
  status: string;
  count: number;
  total_value: number;
  avg_deal_size: number;
}

interface ConversionData {
  platform: string;
  total: number;
  converted: number;
  conversion_rate: number;
  revenue: number;
}

export default function PipelinePage() {
  const { leads } = useStore();
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelineData();
  }, [leads]);

  const fetchPipelineData = async () => {
    try {
      const response = await api.get('/dashboard/pipeline');
      setPipelineData(response.data.pipeline);
      setConversionData(response.data.conversion);
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPipelineValue = () => {
    return pipelineData.reduce((sum, stage) => sum + (stage.total_value || 0), 0);
  };

  const calculateWeightedPipelineValue = () => {
    const stageProbability: { [key: string]: number } = {
      new: 0.1,
      contacted: 0.25,
      in_progress: 0.5,
      qualified: 0.75,
      closed_won: 1.0,
    };

    return pipelineData.reduce((sum, stage) => {
      const probability = stageProbability[stage.status] || 0;
      return sum + (stage.total_value || 0) * probability;
    }, 0);
  };

  const getStageColor = (status: string) => {
    const colors: { [key: string]: string } = {
      new: '#64c8ff',
      contacted: '#ffc107',
      in_progress: '#9c27b0',
      qualified: '#4caf50',
      closed_won: '#2196f3',
      closed_lost: '#f44336',
    };
    return colors[status] || '#999';
  };

  if (loading) {
    return <div className="pipeline-page loading">Loading pipeline...</div>;
  }

  const totalPipelineValue = calculateTotalPipelineValue();
  const weightedPipelineValue = calculateWeightedPipelineValue();
  const totalLeads = leads.length;
  const closedWonCount = leads.filter((l) => l.status === 'closed_won').length;
  const conversionRate = totalLeads > 0 ? ((closedWonCount / totalLeads) * 100).toFixed(1) : 0;

  return (
    <div className="pipeline-page">
      <h1>📈 Sales Pipeline</h1>

      <div className="pipeline-metrics">
        <div className="metric-card">
          <div className="metric-value">${(totalPipelineValue / 1000).toFixed(1)}K</div>
          <div className="metric-label">Total Pipeline Value</div>
          <div className="metric-subtitle">All leads + potential</div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-value">${(weightedPipelineValue / 1000).toFixed(1)}K</div>
          <div className="metric-label">Weighted Pipeline Value</div>
          <div className="metric-subtitle">Probability-adjusted forecast</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{totalLeads}</div>
          <div className="metric-label">Total Leads in Pipeline</div>
          <div className="metric-subtitle">All stages combined</div>
        </div>

        <div className="metric-card success">
          <div className="metric-value">{conversionRate}%</div>
          <div className="metric-label">Overall Conversion Rate</div>
          <div className="metric-subtitle">{closedWonCount} closed deals</div>
        </div>
      </div>

      <section className="pipeline-section">
        <h2>Pipeline by Stage</h2>
        <div className="pipeline-stages">
          {pipelineData.map((stage) => {
            const percentage = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
            const avgDeal = stage.count > 0 ? (stage.total_value / stage.count).toFixed(0) : 0;

            return (
              <div
                key={stage.status}
                className="pipeline-stage"
                style={{ borderLeftColor: getStageColor(stage.status) }}
              >
                <div className="stage-header">
                  <h3>{stage.status.replace('_', ' ')}</h3>
                  <span className="stage-count">{stage.count}</span>
                </div>

                <div className="stage-metrics">
                  <div className="metric">
                    <span className="metric-name">Total Value:</span>
                    <span className="metric-value">${stage.total_value?.toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-name">Avg Deal:</span>
                    <span className="metric-value">${Number(avgDeal).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-name">% of Pipeline:</span>
                    <span className="metric-value">{percentage.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getStageColor(stage.status),
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pipeline-section">
        <h2>Conversion by Source</h2>
        <div className="conversion-table-wrapper">
          <table className="conversion-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Total Leads</th>
                <th>Converted</th>
                <th>Conversion %</th>
                <th>Revenue</th>
                <th>Avg Deal Size</th>
              </tr>
            </thead>
            <tbody>
              {conversionData.map((source) => (
                <tr key={source.platform}>
                  <td className="platform-cell">{source.platform}</td>
                  <td>{source.total}</td>
                  <td>{source.converted}</td>
                  <td>
                    <span className={`conversion-badge ${source.conversion_rate > 50 ? 'high' : ''}`}>
                      {source.conversion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="revenue-cell">${source.revenue?.toLocaleString()}</td>
                  <td>${(source.revenue / (source.converted || 1)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pipeline-section">
        <h2>Revenue Forecast (Next 30 Days)</h2>
        <div className="forecast-box">
          <div className="forecast-item">
            <div className="forecast-label">Conservative (25% of weighted)</div>
            <div className="forecast-value">${(weightedPipelineValue * 0.25).toLocaleString()}</div>
          </div>
          <div className="forecast-item">
            <div className="forecast-label">Moderate (50% of weighted)</div>
            <div className="forecast-value">${(weightedPipelineValue * 0.5).toLocaleString()}</div>
          </div>
          <div className="forecast-item">
            <div className="forecast-label">Optimistic (75% of weighted)</div>
            <div className="forecast-value">${(weightedPipelineValue * 0.75).toLocaleString()}</div>
          </div>
          <div className="forecast-item">
            <div className="forecast-label">Best Case (100% of weighted)</div>
            <div className="forecast-value">${weightedPipelineValue.toLocaleString()}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
