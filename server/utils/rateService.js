'use strict';
const { createClient } = require('redis');

// ─── Redis Client ─────────────────────────────────────────────────────────────
// Reuse the same connection pattern as rateLimiter.js
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
});

redisClient.on('error', (err) => console.warn('[RateService] Redis error:', err.message));
redisClient.connect().catch((err) => console.warn('[RateService] Redis connect failed:', err.message));

// ─── Constants ────────────────────────────────────────────────────────────────
const CACHE_KEY = 'exchange_rates';
const CACHE_TTL = 1800; // 30 minutes in seconds

// ─── Fetch from Open Exchange Rates (primary) ─────────────────────────────────
const fetchFromOER = async () => {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (!appId || appId === 'mock_exchange_api_id') {
    throw new Error('OER: No valid API key configured.');
  }
  const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (res.status === 429) throw new Error('OER: Rate limited (429).');
  if (!res.ok) throw new Error(`OER: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.rates) throw new Error('OER: Invalid response shape.');
  return data.rates; // { USD: 1, EUR: 0.92, ... }
};

// ─── Fetch from ExchangeRate-API (fallback) ───────────────────────────────────
const fetchFromExchangeRateAPI = async () => {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key || key === 'your_exchange_rate_api_key') {
    throw new Error('ExchangeRate-API: No valid API key configured.');
  }
  const url = `https://v6.exchangerate-api.com/v6/${key}/latest/USD`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`ExchangeRate-API: HTTP ${res.status}`);
  const data = await res.json();
  if (data.result !== 'success' || !data.conversion_rates) {
    throw new Error(`ExchangeRate-API: ${data['error-type'] || 'Unknown error'}`);
  }
  return data.conversion_rates; // Same shape: { USD: 1, EUR: 0.92, ... }
};

// ─── Main exported function ───────────────────────────────────────────────────
/**
 * getRates() — Returns USD-based exchange rates with Redis caching.
 *
 * Strategy:
 *  1. Check Redis cache (TTL 30 min)
 *  2. Primary:  Open Exchange Rates API
 *  3. Fallback: ExchangeRate-API
 *  4. Both APIs use USD as base — response shape is identical
 *
 * @returns {Promise<{ rates: object, source: string, cached: boolean }>}
 * @throws  {Error} if both APIs fail and no cache is available
 */
const getRates = async () => {
  // 1. Try Redis cache ──────────────────────────────────────────────────────
  try {
    if (redisClient.isReady) {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        return { rates: JSON.parse(cached), source: 'cache', cached: true };
      }
    }
  } catch (cacheErr) {
    console.warn('[RateService] Cache read failed:', cacheErr.message);
  }

  // 2. Try primary API — Open Exchange Rates ───────────────────────────────
  let rates = null;
  let source = null;

  try {
    rates = await fetchFromOER();
    source = 'openexchangerates';
    console.log('[RateService] Rates fetched from Open Exchange Rates.');
  } catch (oerErr) {
    console.warn('[RateService] OER failed:', oerErr.message, '— trying fallback…');

    // 3. Try fallback API — ExchangeRate-API ─────────────────────────────
    try {
      rates = await fetchFromExchangeRateAPI();
      source = 'exchangerate-api';
      console.log('[RateService] Rates fetched from ExchangeRate-API (fallback).');
    } catch (fallbackErr) {
      console.error('[RateService] Both APIs failed:', fallbackErr.message);
      // 4. Both failed — throw so the route can return 503 ───────────────
      throw new Error('Exchange rate services are temporarily unavailable. Please try again later.');
    }
  }

  // Cache whichever result succeeded ───────────────────────────────────────
  try {
    if (redisClient.isReady) {
      await redisClient.set(CACHE_KEY, JSON.stringify(rates), { EX: CACHE_TTL });
    }
  } catch (cacheWriteErr) {
    console.warn('[RateService] Cache write failed (non-fatal):', cacheWriteErr.message);
  }

  return { rates, source, cached: false };
};

module.exports = { getRates };
