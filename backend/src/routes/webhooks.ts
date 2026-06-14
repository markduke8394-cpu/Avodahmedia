import { Router, Request, Response } from 'express';
import LeadService from '../services/LeadService.js';
import crypto from 'crypto';

const router = Router();

// Verify webhook signature (optional, for security)
const verifyWebhookSignature = (req: Request, secret: string): boolean => {
  const signature = req.headers['x-webhook-signature'] as string;
  if (!signature) return true; // Skip if no signature provided (development)

  const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
  return hash === signature;
};

// Email webhook (Zapier, AWS SES, etc.)
router.post('/email', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, message, subject } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [firstName, ...lastNameParts] = (name || '').split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const lead = await LeadService.createLead({
      platformId: 1, // Email platform ID
      firstName,
      lastName,
      email,
      phone,
      company,
      message: message || subject,
      rawData: req.body,
    });

    res.status(200).json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
});

// LinkedIn webhook
router.post('/linkedin', async (req: Request, res: Response) => {
  try {
    // LinkedIn Lead Form API payload
    const { first_name, last_name, email, phone_number, company, message } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const lead = await LeadService.createLead({
      platformId: 2, // LinkedIn platform ID
      firstName: first_name,
      lastName: last_name,
      email,
      phone: phone_number,
      company,
      message,
      leadSourceProfileId: req.body.linkedin_profile_id,
      leadSourceProfileUrl: req.body.linkedin_profile_url,
      rawData: req.body,
    });

    res.status(200).json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error('LinkedIn webhook error:', error);
    res.status(500).json({ error: 'Failed to process LinkedIn lead' });
  }
});

// Facebook Lead Ads webhook
router.post('/facebook', async (req: Request, res: Response) => {
  // Verify token for security
  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (req.method === 'GET') {
    if (token === verifyToken) {
      return res.send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  try {
    const { entry } = req.body;

    if (!Array.isArray(entry)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    for (const item of entry) {
      for (const change of item.changes || []) {
        const { field, value } = change;

        if (field === 'leadgen') {
          const leadData = value.leadgen_data || {};
          const fieldData = (value.field_data || []).reduce((acc: any, field: any) => {
            acc[field.name] = field.values?.[0];
            return acc;
          }, {});

          const lead = await LeadService.createLead({
            platformId: 3, // Facebook platform ID
            firstName: fieldData.first_name,
            lastName: fieldData.last_name,
            email: fieldData.email,
            phone: fieldData.phone_number,
            company: fieldData.company,
            message: fieldData.comments,
            leadSourceProfileId: value.lead_id,
            rawData: req.body,
          });
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.status(500).json({ error: 'Failed to process Facebook lead' });
  }
});

// Instagram webhook (via Meta API)
router.post('/instagram', async (req: Request, res: Response) => {
  try {
    const { entry } = req.body;

    if (!Array.isArray(entry)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    for (const item of entry) {
      for (const change of item.changes || []) {
        const { field, value } = change;

        if (field === 'messages') {
          // Extract name from Instagram profile or message
          const message = value.message;
          const senderName = value.sender_name || 'Instagram User';

          const lead = await LeadService.createLead({
            platformId: 4, // Instagram platform ID
            firstName: senderName,
            email: null,
            phone: null,
            message,
            leadSourceProfileId: value.sender_id,
            rawData: req.body,
          });
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).json({ error: 'Failed to process Instagram message' });
  }
});

// Yelp webhook
router.post('/yelp', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (type === 'review.new' || type === 'message.new') {
      const { reviewer_name, reviewer_email, text, business_id } = data;

      if (!reviewer_name) {
        return res.status(400).json({ error: 'Reviewer name is required' });
      }

      const lead = await LeadService.createLead({
        platformId: 5, // Yelp platform ID
        firstName: reviewer_name,
        email: reviewer_email,
        message: text,
        leadSourceProfileId: business_id,
        rawData: req.body,
      });

      return res.status(200).json({ success: true, leadId: lead.id });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Yelp webhook error:', error);
    res.status(500).json({ error: 'Failed to process Yelp message' });
  }
});

// Twilio SMS Status callback
router.post('/twilio/status', async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus } = req.body;

    // Update SMS log with delivery status
    // TODO: Implement SMS status update in database

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Twilio status callback error:', error);
    res.status(500).json({ error: 'Failed to process status' });
  }
});

export default router;
