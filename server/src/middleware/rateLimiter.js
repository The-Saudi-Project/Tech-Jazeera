/**
 * Rate limiting — first line of defense against brute force and abuse.
 *
 * One general limiter covers the whole API. It is deliberately generous:
 * this is an internal ERP where one office IP serves many staff, and a
 * normal dashboard load fires many requests. Auth routes get a much
 * stricter limiter in M2, because login is the endpoint attackers hammer.
 */
import rateLimit from 'express-rate-limit';

/** Standard envelope so even rate-limited responses match the API contract. */
const limitReached = {
  success: false,
  message: 'Too many requests. Please wait a moment and try again.',
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 600, // per IP per window — roomy for an office sharing one IP
  standardHeaders: 'draft-7', // send RateLimit-* headers so clients can back off
  legacyHeaders: false,
  message: limitReached,
});
