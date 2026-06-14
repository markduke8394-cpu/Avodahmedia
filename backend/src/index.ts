import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import leadsRoutes from './routes/leads.js';
import webhooksRoutes from './routes/webhooks.js';
import dashboardRoutes from './routes/dashboard.js';
import pipelineRoutes from './routes/pipeline.js';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 routes
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leads', leadsRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/dashboard/pipeline', pipelineRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 New WebSocket connection:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket disconnected:', socket.id);
  });
});

// Store io instance for use in route handlers
app.set('io', io);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };
