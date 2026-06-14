import pool, { query } from '../config/database.js';
import SmsService from './SmsService.js';
import { v4 as uuidv4 } from 'uuid';

interface CreateLeadInput {
  platformId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  serviceInterest?: string;
  budgetRange?: string;
  dealValue?: number;
  confidenceLevel?: string;
  decisionMaker?: boolean;
  leadSourceProfileUrl?: string;
  leadSourceProfileId?: string;
  rawData: any;
  status?: string;
}

class LeadService {
  async createLead(input: CreateLeadInput): Promise<any> {
    const leadUuid = uuidv4();

    try {
      // Check for duplicates (same email + phone + platform within 24 hours)
      if (input.email || input.phone) {
        const duplicateCheck = await this.checkForDuplicates(
          input.platformId,
          input.email,
          input.phone
        );

        if (duplicateCheck) {
          console.log(`⚠️ Duplicate lead detected: ${input.email || input.phone}`);
          return duplicateCheck;
        }
      }

      const result = await query(
        `INSERT INTO leads (
          uuid, platform_id, first_name, last_name, email, phone, company,
          message, service_interest, budget_range, deal_value, confidence_level,
          decision_maker, lead_source_profile_url, lead_source_profile_id, raw_data, status, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          leadUuid,
          input.platformId,
          input.firstName || null,
          input.lastName || null,
          input.email || null,
          input.phone || null,
          input.company || null,
          input.message || null,
          input.serviceInterest || null,
          input.budgetRange || null,
          input.dealValue || null,
          input.confidenceLevel || 'medium',
          input.decisionMaker !== false ? true : false,
          input.leadSourceProfileUrl || null,
          input.leadSourceProfileId || null,
          JSON.stringify(input.rawData),
          input.status || 'new',
          'medium',
        ]
      );

      const lead = result.rows[0];
      console.log(`✅ Lead created: ${lead.uuid}`);

      // Auto-assign lead
      await this.assignLead(lead.id);

      // Send SMS notification to owner
      const platformName = await this.getPlatformName(input.platformId);
      const displayName = input.firstName
        ? `${input.firstName} ${input.lastName || ''}`
        : input.email || input.phone || 'Unknown';

      await SmsService.sendLeadNotificationToOwner(
        lead.id,
        displayName,
        platformName,
        input.message
      );

      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  private async checkForDuplicates(platformId: number, email?: string, phone?: string): Promise<any> {
    if (!email && !phone) return null;

    const whereConditions: string[] = ['platform_id = $1'];
    const params: any[] = [platformId];
    let paramIndex = 2;

    if (email) {
      whereConditions.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (phone) {
      whereConditions.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    whereConditions.push(`created_at > NOW() - INTERVAL '24 hours'`);

    const result = await query(
      `SELECT * FROM leads WHERE ${whereConditions.join(' OR ')} LIMIT 1`,
      params
    );

    return result.rows[0] || null;
  }

  async assignLead(leadId: number): Promise<void> {
    try {
      // Get available team members (not owner, ordered by current load)
      const result = await query(
        `SELECT tm.id, COUNT(l.id) as current_leads
         FROM team_members tm
         LEFT JOIN leads l ON l.assigned_to = tm.id AND l.status != 'closed_won' AND l.status != 'closed_lost'
         WHERE tm.is_active = true AND tm.role = 'assistant'
         GROUP BY tm.id
         ORDER BY current_leads ASC
         LIMIT 1`,
        []
      );

      if (result.rows.length === 0) {
        console.warn('No available team members for assignment');
        return;
      }

      const assignedTo = result.rows[0].id;

      // Create assignment record
      await query(
        `INSERT INTO lead_assignments (lead_id, assigned_to, assignment_reason, is_current)
         VALUES ($1, $2, $3, $4)`,
        [leadId, assignedTo, 'auto_round_robin', true]
      );

      // Update lead assigned_to
      await query(
        `UPDATE leads SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [assignedTo, leadId]
      );

      // Log activity
      await this.logActivity(leadId, 'assigned', null, assignedTo, 'Auto-assigned to team member');

      console.log(`📌 Lead ${leadId} assigned to team member ${assignedTo}`);
    } catch (error) {
      console.error('Error auto-assigning lead:', error);
    }
  }

  async getLead(leadId: number): Promise<any> {
    const result = await query(
      `SELECT l.*, p.display_name as platform_name
       FROM leads l
       JOIN platforms p ON l.platform_id = p.id
       WHERE l.id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      throw new Error('Lead not found');
    }

    return result.rows[0];
  }

  async listLeads(filters?: any): Promise<any[]> {
    let query_text = `
      SELECT l.*, p.display_name as platform_name, tm.name as assigned_to_name
      FROM leads l
      JOIN platforms p ON l.platform_id = p.id
      LEFT JOIN team_members tm ON l.assigned_to = tm.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query_text += ` AND l.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.assignedTo) {
      query_text += ` AND l.assigned_to = $${paramIndex}`;
      params.push(filters.assignedTo);
      paramIndex++;
    }

    if (filters?.platformId) {
      query_text += ` AND l.platform_id = $${paramIndex}`;
      params.push(filters.platformId);
      paramIndex++;
    }

    if (filters?.priority) {
      query_text += ` AND l.priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters?.search) {
      query_text += ` AND (
        l.first_name ILIKE $${paramIndex}
        OR l.last_name ILIKE $${paramIndex}
        OR l.email ILIKE $${paramIndex}
        OR l.phone ILIKE $${paramIndex}
      )`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      paramIndex += 4;
    }

    query_text += ` ORDER BY l.created_at DESC LIMIT 100`;

    const result = await query(query_text, params);
    return result.rows;
  }

  async updateLeadStatus(leadId: number, newStatus: string): Promise<any> {
    const lead = await this.getLead(leadId);
    const oldStatus = lead.status;

    const result = await query(
      `UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newStatus, leadId]
    );

    await this.logActivity(leadId, 'status_changed', oldStatus, newStatus);

    console.log(`✅ Lead ${leadId} status updated: ${oldStatus} → ${newStatus}`);

    return result.rows[0];
  }

  async updateLeadPriority(leadId: number, newPriority: string): Promise<any> {
    const lead = await this.getLead(leadId);

    const result = await query(
      `UPDATE leads SET priority = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newPriority, leadId]
    );

    await this.logActivity(leadId, 'priority_changed', lead.priority, newPriority);

    return result.rows[0];
  }

  async reassignLead(leadId: number, newAssigneeId: number, assignedBy?: number): Promise<any> {
    const lead = await this.getLead(leadId);

    // Mark previous assignment as not current
    await query(
      `UPDATE lead_assignments SET is_current = false WHERE lead_id = $1 AND is_current = true`,
      [leadId]
    );

    // Create new assignment
    await query(
      `INSERT INTO lead_assignments (lead_id, assigned_by, assigned_to, assignment_reason, is_current)
       VALUES ($1, $2, $3, $4, $5)`,
      [leadId, assignedBy || null, newAssigneeId, 'manual', true]
    );

    // Update lead
    const result = await query(
      `UPDATE leads SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newAssigneeId, leadId]
    );

    await this.logActivity(
      leadId,
      'assigned',
      lead.assigned_to?.toString(),
      newAssigneeId.toString(),
      'Reassigned'
    );

    return result.rows[0];
  }

  private async logActivity(
    leadId: number,
    activityType: string,
    oldValue?: any,
    newValue?: any,
    description?: string
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO lead_activities (lead_id, activity_type, old_value, new_value, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [leadId, activityType, oldValue, newValue, description]
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  private async getPlatformName(platformId: number): Promise<string> {
    const result = await query(`SELECT display_name FROM platforms WHERE id = $1`, [platformId]);
    return result.rows[0]?.display_name || 'Unknown Platform';
  }

  async getLeadActivity(leadId: number): Promise<any[]> {
    const result = await query(
      `SELECT * FROM lead_activities WHERE lead_id = $1 ORDER BY created_at DESC`,
      [leadId]
    );
    return result.rows;
  }
}

export default new LeadService();
