import { Router, Request, Response } from 'express';
import LeadService from '../services/LeadService.js';
import { authMiddleware } from './auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// List leads with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      assignedTo: req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined,
      platformId: req.query.platformId ? parseInt(req.query.platformId as string) : undefined,
      priority: req.query.priority as string,
      search: req.query.search as string,
    };

    const leads = await LeadService.listLeads(filters);
    res.json(leads);
  } catch (error) {
    console.error('Error listing leads:', error);
    res.status(500).json({ error: 'Failed to list leads' });
  }
});

// Get single lead
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await LeadService.getLead(parseInt(req.params.id));
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(404).json({ error: 'Lead not found' });
  }
});

// Create lead (manual entry)
router.post('/', async (req: Request, res: Response) => {
  const {
    platformId,
    firstName,
    lastName,
    email,
    phone,
    company,
    message,
    serviceInterest,
    budgetRange,
    dealValue,
    confidenceLevel,
    decisionMaker,
    status,
    rawData,
  } = req.body;

  if (!platformId) {
    return res.status(400).json({ error: 'platformId is required' });
  }

  try {
    const lead = await LeadService.createLead({
      platformId,
      firstName,
      lastName,
      email,
      phone,
      company,
      message,
      serviceInterest,
      budgetRange,
      dealValue: dealValue ? parseFloat(dealValue) : undefined,
      confidenceLevel,
      decisionMaker,
      status,
      rawData: rawData || {},
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update lead status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const lead = await LeadService.updateLeadStatus(parseInt(req.params.id), status);
    res.json(lead);
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// Update lead priority
router.patch('/:id/priority', async (req: Request, res: Response) => {
  const { priority } = req.body;

  if (!priority) {
    return res.status(400).json({ error: 'priority is required' });
  }

  try {
    const lead = await LeadService.updateLeadPriority(parseInt(req.params.id), priority);
    res.json(lead);
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ error: 'Failed to update priority' });
  }
});

// Reassign lead
router.patch('/:id/assign', async (req: Request, res: Response) => {
  const { assignedTo } = req.body;

  if (!assignedTo) {
    return res.status(400).json({ error: 'assignedTo is required' });
  }

  try {
    const lead = await LeadService.reassignLead(parseInt(req.params.id), assignedTo);
    res.json(lead);
  } catch (error) {
    console.error('Error reassigning lead:', error);
    res.status(500).json({ error: 'Failed to reassign lead' });
  }
});

// Get lead activity history
router.get('/:id/activity', async (req: Request, res: Response) => {
  try {
    const activities = await LeadService.getLeadActivity(parseInt(req.params.id));
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router;
