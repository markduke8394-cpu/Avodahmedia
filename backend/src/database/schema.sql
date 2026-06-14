-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Platforms table
CREATE TABLE platforms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  api_key_encrypted VARCHAR(500),
  webhook_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team members table
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'assistant',
  is_active BOOLEAN DEFAULT true,
  max_concurrent_leads INT DEFAULT 20,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  platform_id INT NOT NULL REFERENCES platforms(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  company VARCHAR(150),
  message TEXT,
  service_interest VARCHAR(255),
  budget_range VARCHAR(50),
  lead_source_profile_url VARCHAR(500),
  lead_source_profile_id VARCHAR(255),
  raw_data JSONB,
  status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to INT REFERENCES team_members(id),
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMP,
  sms_to_number VARCHAR(20),
  contacted_at TIMESTAMP,
  qualified_at TIMESTAMP,
  closed_at TIMESTAMP,
  notes TEXT,
  tags VARCHAR(255)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('new', 'contacted', 'in_progress', 'qualified', 'closed_won', 'closed_lost')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Lead assignments table
CREATE TABLE lead_assignments (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_by INT REFERENCES team_members(id),
  assigned_to INT NOT NULL REFERENCES team_members(id),
  assignment_reason VARCHAR(255),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unassigned_at TIMESTAMP,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead activities table
CREATE TABLE lead_activities (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  actor_id INT REFERENCES team_members(id),
  old_value VARCHAR(500),
  new_value VARCHAR(500),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS log table
CREATE TABLE sms_log (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  recipient_phone VARCHAR(20) NOT NULL,
  message_body TEXT NOT NULL,
  message_sid VARCHAR(100),
  status VARCHAR(50),
  direction VARCHAR(10),
  cost_cents INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead notes table
CREATE TABLE lead_notes (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by INT NOT NULL REFERENCES team_members(id),
  note_type VARCHAR(50) DEFAULT 'general',
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follow-ups table
CREATE TABLE follow_ups (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to INT REFERENCES team_members(id),
  follow_up_type VARCHAR(50),
  scheduled_for TIMESTAMP NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead source configs table
CREATE TABLE lead_source_configs (
  id SERIAL PRIMARY KEY,
  platform_id INT NOT NULL REFERENCES platforms(id),
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT NOT NULL,
  is_sensitive BOOLEAN DEFAULT false,
  last_updated_by INT REFERENCES team_members(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform_id, config_key)
);

-- Metrics table
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  metric_date DATE NOT NULL,
  platform_id INT REFERENCES platforms(id),
  total_leads INT DEFAULT 0,
  qualified_leads INT DEFAULT 0,
  closed_won INT DEFAULT 0,
  avg_response_time_minutes INT,
  conversion_rate NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(metric_date, platform_id)
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_platform_id ON leads(platform_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX idx_sms_log_lead_id ON sms_log(lead_id);
CREATE INDEX idx_follow_ups_scheduled_for ON follow_ups(scheduled_for);
CREATE INDEX idx_team_members_email ON team_members(email);

-- Insert default platforms
INSERT INTO platforms (name, display_name, is_active) VALUES
('email', 'Email', true),
('linkedin', 'LinkedIn', true),
('facebook', 'Facebook', true),
('instagram', 'Instagram', true),
('yelp', 'Yelp', true),
('tiktok', 'TikTok', false);
