import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { aiRouter } from './routes/ai.routes.js';
import { authorityRouter } from './routes/authority.routes.js';
import { complaintRouter } from './routes/complaint.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { mockAuthorityRouter } from './routes/mockAuthority.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: [config.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body parsing with limits
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please try again later.'
    }
  }
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CivicSnap Backend API',
    timestamp: new Date().toISOString(),
    gemmaConfigured: !!config.GEMINI_API_KEY,
    supabaseConfigured: !!(config.SUPABASE_URL && (config.SUPABASE_ANON_KEY || config.SUPABASE_SERVICE_ROLE_KEY))
  });
});

// API Routes
app.use('/api/ai', aiRouter);
app.use('/api/authorities', authorityRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/mock-authority', mockAuthorityRouter);

// Centralized error handling
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    console.log(`🚀 CivicSnap Server running on port ${config.PORT}`);
    console.log(`📍 Client Origin: ${config.CLIENT_ORIGIN}`);
    console.log(`🤖 Gemma 4 Model ID: ${config.GEMMA_MODEL_ID}`);
  });
}

export default app;

