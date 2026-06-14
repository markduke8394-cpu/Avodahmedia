import { Router, Request, Response } from 'express';
import pool, { query } from '../config/database.js';
import { authMiddleware } from './auth.js';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get today's leads count
    const todayResult = await query(
      `SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = CURRENT_DATE`,
      []
    );

    // Get new (uncontacted) leads
    const newResult = await query(
      `SELECT COUNT(*) as count FROM leads WHERE status = 'new'`,
      []
    );

    // Get qualified leads
    const qualifiedResult = await query(
      `SELECT COUNT(*) as count FROM leads WHERE status = 'qualified'`,
      []
    );

    // Get closed won deals
    const wonResult = await query(
      `SELECT COUNT(*) as count FROM leads WHERE status = 'closed_won'`,
      []
    );

    // Calculate conversion rate (closed_won / total that are done)
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM leads WHERE status IN ('closed_won', 'closed_lost')`,
      []
    );

    const total = parseInt(totalResult.rows[0].count);
    const won = parseInt(wonResult.rows[0].count);
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;

    res.json({
      total_leads_today: parseInt(todayResult.rows[0].count),
      new_leads: parseInt(newResult.rows[0].count),
      qualified_leads: parseInt(qualifiedResult.rows[0].count),
      closed_won: won,
      conversion_rate: parseFloat(conversionRate as any),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Leads by status
router.get('/leads-by-status', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT status, COUNT(*) as count FROM leads GROUP BY status`,
      []
    );

    const data = result.rows.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    res.json(data);
  } catch (error) {
    console.error('Error fetching leads by status:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Leads by platform
router.get('/leads-by-platform', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT p.display_name, COUNT(l.id) as count
       FROM leads l
       JOIN platforms p ON l.platform_id = p.id
       GROUP BY p.display_name`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads by platform:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Team performance
router.get('/team-performance', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
        tm.id,
        tm.name,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END) as closed_won,
        COUNT(CASE WHEN l.status = 'closed_lost' THEN 1 END) as closed_lost,
        AVG(EXTRACT(EPOCH FROM (l.contacted_at - l.created_at))/60)::integer as avg_response_time_minutes
       FROM team_members tm
       LEFT JOIN leads l ON l.assigned_to = tm.id
       WHERE tm.role = 'assistant'
       GROUP BY tm.id, tm.name`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team performance:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;
