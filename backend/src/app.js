const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();
const path = require('path');

const app = express();

// Trust proxy for proper IP handling with rate limiting
app.set('trust proxy', true);

// Secure CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 'http://localhost:3001',
      'http://127.0.0.1:3000', 'http://127.0.0.1:3001',
      'http://localhost:5000', 'http://127.0.0.1:5000'
    ];
    
    // Add any additional origins from environment
    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN);
    }
    
          // Check if origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Security headers with Helmet
app.use(helmet({
  // Remove X-Powered-By header
  hidePoweredBy: true,
  
  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // Prevent MIME sniffing
  noSniff: true,
  
  // Enable XSS protection
  xssFilter: false, // We'll set this manually
  
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Permissions Policy
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: []
    }
  }
}));

  // Additional custom security headers
  app.use((req, res, next) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
  });

// Request logger removed for cleaner output
// Uncomment the line below if you need debugging in the future
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'} - Host: ${req.headers.host}`);
//   next();
// });

// Rate limiting ONLY for security-critical endpoints

// Strict rate limiting for authentication endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Rate limiting for file uploads (prevent abuse)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 uploads per windowMs
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting ONLY to security-critical endpoints
// Rate limit ONLY login/register, NOT admin functions
app.use('/api/auth/login', authLimiter);        // Login only - prevent brute force
app.use('/api/auth/register', authLimiter);    // Register only - prevent brute force
app.use('/api/csv', uploadLimiter);       // CSV uploads - prevent abuse

// Rate limit ONLY file uploads, NOT card CRUD operations
// We'll handle this at the route level instead of middleware level
// app.use('/api/card/:employee_code/photo', uploadLimiter);  // Photo uploads only
app.use('/api/csv/upload', uploadLimiter);                 // CSV uploads only

// REMOVED: Global rate limiting and dashboard rate limiting
// Dashboard endpoints are internal company usage - no rate limiting needed

// Serve static files with proper MIME types
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const protectedRoutes = require('./routes/protected');
app.use('/api/protected', protectedRoutes);

const csvRoutes = require('./routes/csv');
app.use('/api/csv', csvRoutes);

const cardRoutes = require('./routes/card');
app.use('/api/card', cardRoutes);

const companyRoutes = require('./routes/company');
app.use('/api/company', companyRoutes);

app.get('/', (req, res) => {
  res.send('Kaynes Digital Card Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
