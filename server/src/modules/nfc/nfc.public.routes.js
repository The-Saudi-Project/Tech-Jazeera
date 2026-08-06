/**
 * Public NFC tap routes — served by Express (not the SPA) so Open Graph and
 * `noindex` work for crawlers. Unauthenticated, rate-limited, and deliberately
 * information-free: any bad/inactive/unassigned token renders the SAME 404 page.
 */
import { Router } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { publicCardLimiter } from '../../middleware/rateLimiter.js';
import { getPublicCardByToken, cardUrl } from './nfc.service.js';
import { renderProfilePage, renderNotFoundPage } from './nfc.publicPage.js';
import { buildVCard } from './nfc.vcard.js';

const router = Router();
router.use(publicCardLimiter);

const TOKEN_RE = /^[A-Za-z0-9]{6,24}$/;

function notFound(res) {
  res.status(404).type('html').send(renderNotFoundPage());
}

/** GET /c/:token — the mobile profile page. */
router.get('/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!TOKEN_RE.test(token)) return notFound(res);
  const data = await getPublicCardByToken(token);
  if (!data) return notFound(res);
  const html = renderProfilePage({ ...data, cardUrl: cardUrl(token), vcardUrl: `${cardUrl(token)}/vcard` });
  return res.status(200).type('html').send(html);
}));

/** GET /c/:token/vcard — one-tap Save Contact (.vcf). */
router.get('/:token/vcard', asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!TOKEN_RE.test(token)) return notFound(res);
  const data = await getPublicCardByToken(token);
  if (!data) return notFound(res);
  const safeName = (data.employee.name || 'contact').replace(/[^\w]+/g, '_');
  res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.vcf"`);
  return res.send(buildVCard(data));
}));

export default router;
