/**
 * Server-rendered HTML for the public NFC tap pages. Rendered by Express (not
 * the React SPA) so Open Graph previews and `noindex` work for crawlers that
 * don't run JS. Every interpolated value is HTML-escaped; only whitelisted,
 * public fields are ever passed in.
 *
 * The unknown/lost/unassigned case renders an identical, information-free 404,
 * so a scanner can't tell a disabled card from a nonexistent one.
 */

/** HTML-escape text content. */
function h(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Make a URL safe to drop into a double-quoted href. The URLs are already valid
 * (and forced to a safe scheme by ensureHttp), so we only HTML-escape, never
 * re-encode, otherwise an already-percent-encoded query gets double-encoded.
 */
const attr = h;

const digits = (v) => String(v ?? '').replace(/[^\d]/g, '');
const ensureHttp = (url) => (!url ? '' : /^https?:\/\//i.test(url) ? url : `https://${url}`);
const safeHex = (c) => (/^#[0-9a-fA-F]{6}$/.test(c || '') ? c : '#4F46E5');

/** Two-letter initials for the avatar. */
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

/** SVG icon paths (24x24 outline, Heroicons-style). */
const ICON = {
  phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  whatsapp: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 1.72.446 3.336 1.228 4.74L2.25 21.75l5.13-1.2A9.7 9.7 0 0012 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z',
  email: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  web: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0a8.949 8.949 0 004.951-1.488A3.987 3.987 0 0013 16h-2a3.987 3.987 0 00-3.951 3.512A8.949 8.949 0 0012 21zm0-18v18M3 12h18',
  linkedin: 'M6.5 8.25A1.75 1.75 0 106.5 4.75a1.75 1.75 0 000 3.5zM5 10.5h3v9H5v-9zm5 0h2.9v1.23h.04c.4-.76 1.38-1.56 2.85-1.56 3.05 0 3.61 2 3.61 4.61v4.72h-3v-4.18c0-1 0-2.28-1.39-2.28-1.39 0-1.6 1.09-1.6 2.21v4.25h-3v-9z',
  location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  save: 'M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9',
};

function iconSvg(path) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${path}"/></svg>`;
}

/** One tappable row. `track` is the link target key (analytics hook, Phase B). */
function row(icon, label, sub, href, extraAttr = '') {
  if (!href) return '';
  return `<a class="row" href="${attr(href)}"${extraAttr}>
    <span class="row-ic">${iconSvg(icon)}</span>
    <span class="row-tx"><span class="row-lb">${h(label)}</span>${sub ? `<span class="row-sub">${h(sub)}</span>` : ''}</span>
    <span class="row-ch">&rsaquo;</span>
  </a>`;
}

const PAGE_HEAD = (title, description, url, brand) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${h(title)}</title>
<meta name="description" content="${h(description)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${h(title)}">
<meta property="og:description" content="${h(description)}">
${url ? `<meta property="og:url" content="${h(url)}">` : ''}
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="${h(brand)}">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Arial,sans-serif;background:#0f1222;color:#12142b;-webkit-font-smoothing:antialiased;min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{width:100%;max-width:420px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px -20px rgba(10,10,40,.5)}
.hero{background:var(--brand);color:#fff;padding:40px 24px 64px;text-align:center;position:relative}
.avatar{width:104px;height:104px;border-radius:50%;background:rgba(255,255,255,.18);border:3px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:700;margin:0 auto 16px;backdrop-filter:blur(4px)}
.name{font-size:24px;font-weight:700;letter-spacing:-.02em}
.title{font-size:15px;opacity:.92;margin-top:4px}
.org{font-size:14px;opacity:.8;margin-top:2px}
.body{padding:20px 18px 26px;margin-top:-28px}
.save{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:var(--brand);color:#fff;border:none;border-radius:16px;padding:16px;font-size:16px;font-weight:600;text-decoration:none;box-shadow:0 10px 24px -8px var(--brand);margin-bottom:18px}
.save svg{width:22px;height:22px}
.save:active{transform:scale(.98)}
.bio{font-size:14px;line-height:1.5;color:#4a4d63;background:#f4f5fb;border-radius:14px;padding:14px 16px;margin-bottom:16px;white-space:pre-wrap}
.rows{display:flex;flex-direction:column;gap:10px}
.row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:#f4f5fb;border-radius:14px;text-decoration:none;color:#12142b;transition:background .15s}
.row:active{background:#e9ebf5}
.row-ic{width:40px;height:40px;flex:0 0 40px;border-radius:12px;background:var(--brand);color:#fff;display:flex;align-items:center;justify-content:center}
.row-ic svg{width:20px;height:20px}
.row-tx{flex:1;min-width:0;display:flex;flex-direction:column}
.row-lb{font-size:15px;font-weight:600}
.row-sub{font-size:13px;color:#6b6f87;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.row-ch{color:#b9bccd;font-size:22px;line-height:1}
.foot{text-align:center;font-size:11px;color:#9a9db2;padding:18px}
@media(prefers-color-scheme:dark){
 .card{background:#171a2e}.body .bio{background:#20233b;color:#c9ccdd}
 .row{background:#20233b;color:#eceeffe6}.row:active{background:#282c47}.row-sub{color:#9a9db2}
 .name,.title,.org{color:#fff}
}
</style>
</head>`;

/** The full profile page. `data` = { employee, company, vcardUrl, cardUrl }. */
export function renderProfilePage({ employee, company, vcardUrl, cardUrl }) {
  const brand = safeHex(company?.brandColour);
  const title = employee.name;
  const description = [employee.jobTitle, company?.companyName].filter(Boolean).join(' · ');

  const website = ensureHttp(company?.website);
  const linkedin = ensureHttp(employee.linkedin);
  const mapHref =
    ensureHttp(company?.mapLink) ||
    (company?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}` : '');

  const telHref = employee.phone ? `tel:${employee.phone.replace(/[^\d+]/g, '')}` : '';
  const waNumber = employee.whatsapp || employee.phone;
  const rows = [
    row(ICON.phone, 'Call', employee.phone, telHref),
    row(ICON.whatsapp, 'WhatsApp', waNumber, waNumber ? `https://wa.me/${digits(waNumber)}` : ''),
    row(ICON.email, 'Email', employee.email, employee.email ? `mailto:${employee.email}` : ''),
    row(ICON.web, 'Website', company?.website, website, ' target="_blank" rel="noopener"'),
    row(ICON.linkedin, 'LinkedIn', 'View profile', linkedin, ' target="_blank" rel="noopener"'),
    row(ICON.location, 'Location', company?.address || 'Open in Maps', mapHref, ' target="_blank" rel="noopener"'),
  ].join('');

  return `${PAGE_HEAD(title, description, cardUrl, brand)}
<body style="--brand:${h(brand)}">
<main class="card">
  <header class="hero">
    <div class="avatar">${h(initials(employee.name))}</div>
    <div class="name">${h(employee.name)}</div>
    ${employee.jobTitle ? `<div class="title">${h(employee.jobTitle)}</div>` : ''}
    ${company?.companyName ? `<div class="org">${h(company.companyName)}</div>` : ''}
  </header>
  <div class="body">
    <a class="save" href="${attr(vcardUrl)}">${iconSvg(ICON.save)} Save Contact</a>
    ${employee.bio ? `<p class="bio">${h(employee.bio)}</p>` : ''}
    <div class="rows">${rows}</div>
  </div>
</main>
</body></html>`;
}

/** Identical, information-free 404 for unknown / lost / disabled / unassigned. */
export function renderNotFoundPage() {
  return `${PAGE_HEAD('Not found', 'This page is not available.', '', '#4F46E5')}
<body style="--brand:#4F46E5">
<main class="card">
  <div class="body" style="margin-top:0;padding:56px 24px;text-align:center">
    <div style="font-size:44px;margin-bottom:12px">🔗</div>
    <h1 style="font-size:20px;margin-bottom:8px">This card isn't available</h1>
    <p style="font-size:14px;color:#6b6f87">The link may be inactive or no longer exists.</p>
  </div>
</main>
</body></html>`;
}
