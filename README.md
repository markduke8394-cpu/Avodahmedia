# 🚀 Avodahmedia Lead Notification System

A comprehensive lead management and notification system for Avodahmedia that captures leads from multiple platforms (LinkedIn, Facebook, Instagram, Yelp, Email) and sends immediate SMS notifications to the owner.

## Features

- **Multi-Platform Lead Capture**: LinkedIn, Facebook, Instagram, Yelp, and Email integration
- **Real-time SMS Notifications**: Receive text alerts immediately when new leads arrive
- **Team Dashboard**: Collaborative interface for 3-4 assistants to manage leads
- **Lead Lifecycle Management**: Track leads from new → contacted → qualified → closed
- **Automatic Assignment**: Round-robin lead assignment to available team members
- **Activity Tracking**: Complete audit trail of all lead interactions
- **Real-time Updates**: WebSocket integration for live dashboard updates

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (database)
- Redis (caching & real-time)
- Socket.io (WebSocket communication)
- Twilio (SMS notifications)
- TypeScript

**Frontend:**
- React 18
- React Router
- Zustand (state management)
- Vite (build tool)
- TypeScript

**Infrastructure:**
- Docker & Docker Compose (local development)
- AWS (production deployment recommended)

## Project Structure

```
avodahmedia/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── database/        # DB schema & migrations
│   │   ├── services/        # Business logic
│   │   ├── webhooks/        # Platform webhook handlers
│   │   ├── routes/          # API routes
│   │   └── index.ts         # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── store/           # Zustand state management
│   │   ├── api/             # API client
│   │   └── App.tsx          # Main app component
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── docker-compose.yml       # Local dev environment
├── package.json             # Root package.json
└── README.md
```

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone & Install

```bash
cd /home/user/Avodahmedia
npm install
```

### 2. Start Database & Cache

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

Database will be initialized with the schema automatically.

### 3. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
# Twilio SMS (REQUIRED for SMS notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
OWNER_PHONE_NUMBER=+1234567890  # Your phone to receive alerts

# Database (local defaults work for docker-compose)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=avodahmedia_leads
DB_USER=postgres
DB_PASSWORD=postgres

# JWT & Security
JWT_SECRET=dev_secret_key_change_in_production
ENCRYPTION_KEY=32_character_key_here_________

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Start Development Servers

```bash
npm run dev
```

This starts:
- **Backend API**: `http://localhost:3001`
- **Frontend Dashboard**: `http://localhost:3000`

### 5. Login to Dashboard

The system uses JWT authentication. For development, you can create team members:

```bash
# Run seeding script to create test users
npm run db:seed
```

Or manually create via the API:
```bash
curl -X POST http://localhost:3001/api/v1/team/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your@email.com",
    "password": "password123",
    "role": "owner"
  }'
```

Login at `http://localhost:3000` with your created credentials.

## Platform Integration Setup

### Email Webhook

To receive contact form submissions as leads:

**Option A: Zapier**
1. Create a Zap that triggers on form submission
2. Set webhook URL: `http://your-api.com/api/v1/webhooks/email`
3. Map form fields to standard lead format

**Option B: Email Service API**
Forward emails to: `contact@avodahmedia.com` → configured email handler

### LinkedIn Lead Forms

1. Create Lead Form in LinkedIn Campaign Manager
2. Go to "Lead Gen Forms" → Select your form → "Manage Lead Notifications"
3. Set webhook URL: `http://your-api.com/api/v1/webhooks/linkedin`
4. Store access token in database config

**API Setup:**
```bash
POST http://localhost:3001/api/v1/platforms/linkedin/config
{
  "config_key": "access_token",
  "config_value": "your_linkedin_token"
}
```

### Facebook Lead Ads

1. Go to Meta Business Suite → Leads → Lead Ads
2. Configure webhook: `http://your-api.com/api/v1/webhooks/facebook`
3. Verify token: Use `FACEBOOK_WEBHOOK_VERIFY_TOKEN` from `.env`

### Instagram

Uses Meta Graph API (same account as Facebook):
- Configure Meta Business Account
- Webhook receives Instagram DMs & Story mentions
- URL: `http://your-api.com/api/v1/webhooks/instagram`

### Yelp

1. Get Yelp API key from Business Account
2. Enable Message Requests & Reviews API
3. Webhook for new 5/4-star reviews: `http://your-api.com/api/v1/webhooks/yelp`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user

### Leads
- `GET /api/v1/leads` - List leads (with filters)
- `GET /api/v1/leads/:id` - Get lead details
- `POST /api/v1/leads` - Create lead
- `PATCH /api/v1/leads/:id/status` - Update status
- `PATCH /api/v1/leads/:id/assign` - Reassign lead
- `PATCH /api/v1/leads/:id/priority` - Update priority

### SMS
- `POST /api/v1/sms/send` - Send SMS to lead
- `GET /api/v1/sms/log/:leadId` - Get SMS history
- `POST /api/v1/webhooks/twilio/status` - SMS delivery status callback

### Webhooks
- `POST /api/v1/webhooks/email` - Email form submissions
- `POST /api/v1/webhooks/linkedin` - LinkedIn leads
- `POST /api/v1/webhooks/facebook` - Facebook leads
- `POST /api/v1/webhooks/instagram` - Instagram messages
- `POST /api/v1/webhooks/yelp` - Yelp reviews/messages

### Dashboard
- `GET /api/v1/dashboard/stats` - Overview statistics
- `GET /api/v1/reports/*` - Various reports

## Database Schema

See `backend/src/database/schema.sql` for complete schema including:

- **leads**: Core lead data from all platforms
- **platforms**: Configured lead sources
- **team_members**: Your staff and their workload
- **sms_log**: All SMS communications
- **lead_activities**: Audit trail of all changes
- **lead_notes**: Collaborative notes
- **follow_ups**: Scheduled tasks
- **metrics**: Daily aggregated statistics

## SMS Notifications

When a new lead arrives:
1. System creates lead record in database
2. **Immediately sends SMS** to owner with:
   - Lead name
   - Platform source (LinkedIn, Email, etc.)
   - First 100 chars of message
3. Lead auto-assigns to available team member
4. Dashboard updates in real-time for all users

Example SMS:
```
🔔 New email lead: John Smith
Interested in website design services for...
```

## Team Workflow

### Typical Lead Flow

1. **Lead Arrives** → SMS to owner → Auto-assigned to team
2. **Team Views** → Lead appears on dashboard (real-time)
3. **Initial Contact** → Team member marks as "Contacted"
4. **Qualification** → More details gathered, marked "Qualified"
5. **Proposal** → Quote sent, marked "In Progress"
6. **Closure** → Won or Lost

### Roles

- **Owner** (you): Receives SMS alerts, full access, can't be assigned leads
- **Assistant** (team members): Can view assigned leads, update status, add notes, schedule follow-ups

## Testing

### Manual Testing

1. **Create a test lead:**
```bash
curl -X POST http://localhost:3001/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "platformId": 1,
    "firstName": "Test",
    "lastName": "Lead",
    "email": "test@example.com",
    "phone": "+1234567890",
    "message": "I am interested in your services",
    "rawData": {}
  }'
```

2. **Check SMS was sent** (if Twilio configured)

3. **Verify in dashboard** at `http://localhost:3000`

### Unit Tests

```bash
npm run test
```

## Production Deployment

### AWS Deployment (Recommended)

**Infrastructure:**
- ECS Fargate (containers)
- RDS PostgreSQL (managed)
- ElastiCache Redis (managed)
- CloudFront CDN
- Route 53 DNS

**Setup:**
1. Prepare terraform/CloudFormation configs (see `/infrastructure`)
2. Configure RDS PostgreSQL
3. Set environment variables in Systems Manager Parameter Store
4. Deploy containers to ECS
5. Configure ALB with health checks
6. Enable CloudWatch monitoring

**Deployment command:**
```bash
npm run build
docker build -t avodahmedia-api backend/
docker push your-registry/avodahmedia-api:latest
# Deploy via ECS/CloudFormation
```

### Alternative: Heroku Deployment

**Faster, but more expensive:**

```bash
heroku create avodahmedia-api
heroku addons:create heroku-postgresql:standard-0 --app avodahmedia-api
heroku addons:create heroku-redis:premium-0 --app avodahmedia-api

git push heroku main

# Frontend via Vercel
vercel frontend/
```

## Environment Checklist

Before going live, ensure:

- [ ] Twilio account configured with real credentials
- [ ] Owner phone number verified in Twilio
- [ ] All platform API credentials set
- [ ] Database backups automated
- [ ] SSL/TLS certificates configured
- [ ] CORS domain updated to production URL
- [ ] JWT secret changed from default
- [ ] Encryption key set (32 characters)
- [ ] Rate limiting configured
- [ ] Monitoring & alerts set up (CloudWatch, DataDog)
- [ ] Error tracking enabled (Sentry)
- [ ] Logging retention configured

## Troubleshooting

### SMS not sending

Check:
```bash
# View SMS logs
curl http://localhost:3001/api/v1/sms/log/1

# Check Twilio config
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN

# Test Twilio credentials
npm run test:twilio
```

### Webhooks not receiving leads

1. Verify webhook URL is publicly accessible
2. Check firewall rules
3. Verify auth tokens match
4. Check webhook signature validation

### Database connection issues

```bash
# Test DB connection
PGPASSWORD=postgres psql -h localhost -U postgres -d avodahmedia_leads -c "SELECT NOW();"

# Check Docker containers
docker-compose ps
```

### Real-time updates not working

```bash
# Verify WebSocket connection
# Open browser console and check:
# Socket.io should connect to ws://localhost:3001/socket.io/

# Check Redis
redis-cli -p 6379 PING  # Should return PONG
```

## Contributing

When adding features:
1. Create feature branch from `main`
2. Follow TypeScript strict mode
3. Add tests for new functionality
4. Update API documentation
5. Create pull request with description

## Support

For issues, questions, or feature requests:
1. Check existing documentation in `/docs`
2. Review API documentation in swagger/OpenAPI format
3. Check database schema comments in `schema.sql`
4. Contact team lead for configuration questions

## License

Internal use only. Proprietary software for Avodahmedia.

---

**Last Updated:** June 2026
**Version:** 1.0.0 (MVP)
