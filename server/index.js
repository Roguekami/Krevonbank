require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const { doubleCsrf } = require('csrf-csrf');
const { connectDB } = require('./config/db');
const { globalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const adminRoutes = require('./routes/admin');
const accountRoutes = require('./routes/account');
const transferRoutes = require('./routes/transfers');
const beneficiaryRoutes = require('./routes/beneficiaries');
const ratesRoutes = require('./routes/rates');
const cardRoutes = require('./routes/cards');
const fundingRoutes = require('./routes/funding');
const supportRoutes = require('./routes/support');
const settingsRoutes = require('./routes/settings');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', process.env.CLIENT_URL].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);
app.set('trust proxy', 1);

// HTTPS Enforcement in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});

// Middleware
app.use('/api', globalLimiter);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.CLIENT_URL
].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF Protection setup
const {
  generateCsrfToken, // Use this in your routes to provide a CSRF hash cookie and token.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET || 'supersecretcsrf', // A function that optionally takes the request and returns a secret
  getSessionIdentifier: () => 'static-session-id', // Required in v4
  cookieName: 'x-csrf-token', // The name of the cookie to be used, recommend using Host prefix.
  cookieOptions: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // A list of request methods that will not be protected.
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'], // A function that returns the token from the request
});

// Endpoint to get CSRF token
const csrfLimiter = require('./middleware/rateLimiter').apiLimiter || globalLimiter;
app.get('/api/csrf-token', csrfLimiter, (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

app.use('/api', (req, res, next) => {
  // Apply CSRF protection to all /api routes except the csrf-token endpoint itself
  if (req.path === '/csrf-token') return next();
  doubleCsrfProtection(req, res, next);
});

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Krevon Banking API is running...');
});

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins their personal room for real-time KYC notifications
  socket.on('join:user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Admin joins admin room for new KYC submission alerts
  socket.on('join:admin', () => {
    socket.join('admin-room');
    console.log(`Admin joined admin-room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
