const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

// Create Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis connected for rate limiting'));

// Connect to Redis
redisClient.connect().catch(console.error);

// Helper function to create a limiter with Redis store
const createRedisLimiter = (options) => {
  const prefix = options.prefix || 'rl:';
  // Remove prefix from options so it doesn't get passed to rateLimit if it complains, though it shouldn't
  const { prefix: _prefix, ...rateLimitOptions } = options;
  
  return rateLimit({
    ...rateLimitOptions,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: prefix,
    }),
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    // Disable the IPv6 keyGenerator validation — we handle keys safely
    validate: { xForwardedForHeader: false, default: true },
  });
};

// 1. Global Limiter — 500 req / 15 min per IP
const globalLimiter = createRedisLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: 'Too many requests. Please try again shortly.' },
  prefix: 'rl:global:'
});

// 2. Auth Limiter — 20 req / 15 min per IP
const authLimiter = createRedisLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication requests. Please try again in 15 minutes.' },
  prefix: 'rl:auth:'
});

// 3. Login Limiter — 15 req / 15 min per IP
const loginLimiter = createRedisLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  prefix: 'rl:login:'
});

// 4. CVV Limiter — 10 req / 15 min per User ID
const cvvLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many CVV reveal attempts. Please try again in 15 minutes.' },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:cvv:',
  }),
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  // Disable ALL validations for this limiter since we use a custom keyGenerator
  validate: false,
  keyGenerator: (req) => {
    if (req.user && req.user.id) return String(req.user.id);
    return 'anonymous';
  }
});

// 5. Transaction Limiter — 30 req / 15 min per IP
const transactionLimiter = createRedisLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many transaction requests. Please try again in 15 minutes.' },
  prefix: 'rl:transaction:'
});

module.exports = {
  globalLimiter,
  authLimiter,
  loginLimiter,
  cvvLimiter,
  transactionLimiter
};
