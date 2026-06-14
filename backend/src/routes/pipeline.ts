import { Router, Request, Response } from 'express';
import pool, { query } from '../config/database.js';
import { authMiddleware } from './auth.js';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Get pipeline data with deal values
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get pipeline stages with deal values
    const pipelineResult = await query(
      `SELECT
        l.status,
        COUNT(l.id) as count,
        COALESCE(SUM(l.deal_value), 0) as total_value,
        COALESCE(AVG(l.deal_value), 0) as avg_deal_size
       FROM leads l
       WHERE l.status != 'closed_lost'
       GROUP BY l.status
       ORDER BY CASE
         WHEN l.status = 'new' THEN 1
         WHEN l.status = 'contacted' THEN 2
         WHEN l.status = 'in_progress' THEN 3
         WHEN l.status = 'qualified' THEN 4
         WHEN l.status = 'closed_won' THEN 5
         ELSE 6
       END`,
      []
    );

    // Get conversion data by platform
    const conversionResult = await query(
      `SELECT
        p.display_name as platform,
        COUNT(l.id) as total,
        COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END) as converted,
        ROUND(
          COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END)::numeric /
          COUNT(l.id) * 100, 2
        ) as conversion_rate,
        COALESCE(SUM(CASE WHEN l.status = 'closed_won' THEN l.deal_value ELSE 0 END), 0) as revenue
       FROM leads l
       JOIN platforms p ON l.platform_id = p.id
       GROUP BY p.display_name
       ORDER BY revenue DESC`,
      []
    );

    res.json({
      pipeline: pipelineResult.rows,
      conversion: conversionResult.rows,
    });
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline data' });
  }
});

// Get pipeline summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
        COUNT(l.id) as total_leads,
        COALESCE(SUM(l.deal_value), 0) as total_pipeline_value,
        COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END) as closed_won,
        ROUND(
          COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END)::numeric /
          COUNT(l.id) * 100, 2
        ) as conversion_rate,
        COALESCE(
          SUM(l.deal_value *
            CASE
              WHEN l.status = 'new' THEN 0.1
              WHEN l.status = 'contacted' THEN 0.25
              WHEN l.status = 'in_progress' THEN 0.5
              WHEN l.status = 'qualified' THEN 0.75
              WHEN l.status = 'closed_won' THEN 1.0
              ELSE 0
            END
          ), 0
        ) as weighted_pipeline_value
       FROM leads l`,
      []
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching pipeline summary:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline summary' });
  }
});

// Get forecast for next N days
router.get('/forecast/:days', async (req: Request, res: Response) => {
  const days = parseInt(req.params.days) || 30;

  try {
    const result = await query(
      `SELECT
        DATE(l.created_at) as date,
        COUNT(l.id) as leads_created,
        COALESCE(SUM(l.deal_value), 0) as total_value,
        COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END) as deals_closed
       FROM leads l
       WHERE l.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(l.created_at)
       ORDER BY date DESC`,
      []
    );

    res.json({
      period_days: days,
      data: result.rows,
      summary: {
        total_leads: result.rows.reduce((sum, row) => sum + parseInt(row.leads_created), 0),
        total_value: result.rows.reduce((sum, row) => sum + parseFloat(row.total_value), 0),
        deals_closed: result.rows.reduce((sum, row) => sum + parseInt(row.deals_closed), 0),
        avg_daily_leads:
          result.rows.length > 0
            ? result.rows.reduce((sum, row) => sum + parseInt(row.leads_created), 0) /
              result.rows.length
            : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

export default router;
