/**
 * Server-rendered HTML for the public NFC tap pages — a premium "foil-and-stock"
 * digital business card. Rendered by Express (not the SPA) so Open Graph and
 * `noindex` work for crawlers. Every interpolated value is HTML-escaped; only
 * whitelisted, public fields are passed in.
 *
 * ADAPTS PER BRAND: the treatment (dark or light stock) is chosen from the
 * company's brand colour so that colour always reads well — a light brand glows
 * on dark stock, a dark brand reads as ink on ivory stock.
 *
 * The unknown/lost/unassigned case renders an identical, information-free 404.
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
/** Only HTML-escape for hrefs (URLs are already valid + safe-schemed). */
const attr = h;

const digits = (v) => String(v ?? '').replace(/[^\d]/g, '');
const ensureHttp = (url) => (!url ? '' : /^https?:\/\//i.test(url) ? url : `https://${url}`);
const safeHex = (c) => (/^#[0-9a-fA-F]{6}$/.test(c || '') ? c : '#1f9e78');

/** sRGB relative luminance (0 dark … 1 light). */
function luminance(hex) {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** Two-letter initials for the monogram fallback. */
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

const ICON = {
  phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  whatsapp: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 1.72.446 3.336 1.228 4.74L2.25 21.75l5.13-1.2A9.7 9.7 0 0012 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z',
  email: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0-8.57 5.27a2.25 2.25 0 01-2.36 0L2.25 6.75',
  web: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5 0 4-4 4-9s-1.5-9-4-9-4 4-4 9 1.5 9 4 9zM3 12h18',
  linkedin: 'M6.5 8.25A1.75 1.75 0 106.5 4.75a1.75 1.75 0 000 3.5zM5 10.5h3v9H5v-9zm5 0h2.9v1.23h.04c.4-.76 1.38-1.56 2.85-1.56 3.05 0 3.61 2 3.61 4.61v4.72h-3v-4.18c0-1 0-2.28-1.39-2.28s-1.6 1.09-1.6 2.21v4.25h-3v-9z',
  location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  save: 'M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9',
};
const iconSvg = (path, filled = false) =>
  `<svg viewBox="0 0 24 24" ${filled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.7"'} aria-hidden="true">${filled ? `<path d="${path}"/>` : `<path stroke-linecap="round" stroke-linejoin="round" d="${path}"/>`}</svg>`;

function action(icon, label, href, filled = false, blank = false) {
  if (!href) return '';
  const t = blank ? ' target="_blank" rel="noopener"' : '';
  return `<a class="act" href="${attr(href)}"${t}><span class="ic">${iconSvg(icon, filled)}</span><span>${h(label)}</span></a>`;
}

/** Palette tokens for each treatment, as inline CSS custom properties. */
function palette(brand, treatment) {
  if (treatment === 'light') {
    return {
      '--brand': brand,
      '--accent': `color-mix(in oklab, ${brand} 88%, #000 12%)`,
      '--ink': '#ece7db', '--ink2': '#f6f2e8', '--stock': '#fbf8f1', '--stock2': '#f3eee2',
      '--text': '#1b201c', '--muted': '#6c7066', '--save-fg': '#ffffff',
      '--hair': 'rgba(20,25,20,.12)', '--hair2': 'rgba(20,25,20,.06)', '--dot': 'rgba(20,25,20,.05)',
    };
  }
  return {
    '--brand': brand,
    '--accent': `color-mix(in oklab, ${brand} 80%, #fff 20%)`,
    '--ink': '#0b0e0d', '--ink2': '#0e1211', '--stock': '#161a19', '--stock2': '#1c211f',
    '--text': '#f1ede4', '--muted': '#9aa39c', '--save-fg': '#07130f',
    '--hair': 'rgba(241,237,228,.12)', '--hair2': 'rgba(241,237,228,.07)', '--dot': 'rgba(241,237,228,.05)',
  };
}

const STYLE = `
*{box-sizing:border-box;margin:0;padding:0}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
:root{--ease:cubic-bezier(.16,1,.3,1)}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif;color:var(--text);
 background:
  radial-gradient(120% 90% at 12% -10%, color-mix(in oklab,var(--brand) 20%, transparent), transparent 55%),
  radial-gradient(120% 90% at 100% 112%, color-mix(in oklab,var(--brand) 14%, transparent), transparent 55%),
  var(--ink);
 min-height:100svh;display:grid;place-items:center;padding:22px;position:relative;overflow-x:hidden}
.bgdots{position:fixed;inset:0;pointer-events:none;opacity:.6;
 background-image:radial-gradient(var(--dot) 1px,transparent 1.4px);background-size:22px 22px;
 -webkit-mask-image:radial-gradient(circle at 50% 38%,#000 28%,transparent 76%);mask-image:radial-gradient(circle at 50% 38%,#000 28%,transparent 76%)}
.grain{position:fixed;inset:0;pointer-events:none;opacity:.045;mix-blend-mode:overlay;
 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.load{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:var(--ink);animation:loadout .5s var(--ease) 1.05s forwards}
.stamp{width:68px;height:68px;border-radius:50%;display:grid;place-items:center;font-family:ui-serif,Georgia,serif;font-size:25px;font-weight:600;color:var(--text);
 border:1px solid var(--hair);background:linear-gradient(145deg,var(--stock2),var(--stock));box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 12px 30px rgba(0,0,0,.4);animation:stampin .7s var(--ease) both}
@keyframes stampin{0%{opacity:0;transform:scale(.6) rotate(-8deg)}60%{opacity:1}100%{opacity:1;transform:scale(1)}}
@keyframes loadout{to{opacity:0;visibility:hidden}}
.card{position:relative;width:min(400px,100%);border-radius:26px;padding:34px 24px 24px;
 background:linear-gradient(180deg,var(--stock2),var(--stock));border:1px solid var(--hair);
 box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 42px 90px -34px rgba(0,0,0,.7),0 8px 22px -12px rgba(0,0,0,.5);
 overflow:hidden;animation:rise 1s var(--ease) 1.1s both;transform-style:preserve-3d;will-change:transform}
@keyframes rise{0%{opacity:0;transform:translateY(26px) scale(.97)}100%{opacity:1;transform:translateY(0) scale(1)}}
.card::after{content:"";position:absolute;top:0;left:-60%;width:55%;height:100%;pointer-events:none;
 background:linear-gradient(105deg,transparent,color-mix(in oklab,var(--accent) 34%,#fff),transparent);opacity:.45;filter:blur(6px);transform:skewX(-14deg);animation:sheen 1.5s var(--ease) 1.8s both}
@keyframes sheen{0%{left:-60%}100%{left:130%}}
.logo{display:block;max-height:40px;max-width:62%;margin:0 auto 18px;object-fit:contain;animation:pop .6s var(--ease) 1.5s both}
.ava{width:96px;height:96px;border-radius:50%;margin:0 auto 15px;display:grid;place-items:center;overflow:hidden;
 font-family:ui-serif,Georgia,serif;font-size:34px;font-weight:600;color:var(--save-fg);
 background:radial-gradient(120% 120% at 30% 20%,color-mix(in oklab,var(--accent) 60%,#fff 6%),var(--accent) 72%);
 box-shadow:inset 0 1px 1px rgba(255,255,255,.35),inset 0 -3px 8px rgba(0,0,0,.28),0 10px 24px -10px color-mix(in oklab,var(--brand) 55%,transparent);animation:floaty 6s ease-in-out 2s infinite}
.ava img{width:100%;height:100%;object-fit:cover}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.name{font-family:ui-serif,Georgia,'Times New Roman',serif;font-weight:600;font-size:29px;line-height:1.06;text-align:center;letter-spacing:-.01em;text-wrap:balance}
.role{text-align:center;opacity:.92;font-size:14.5px;margin-top:6px}
.org{text-align:center;color:var(--muted);font-size:12px;letter-spacing:.09em;text-transform:uppercase;margin-top:3px}
.rule{height:1px;margin:20px 28px;background:linear-gradient(90deg,transparent,color-mix(in oklab,var(--accent) 60%,transparent),transparent)}
.save{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:15px;border-radius:15px;text-decoration:none;font-weight:600;font-size:15.5px;color:var(--save-fg);
 background:linear-gradient(180deg,color-mix(in oklab,var(--accent) 92%,#fff 8%),var(--accent));
 box-shadow:0 10px 26px -10px color-mix(in oklab,var(--brand) 70%,transparent),inset 0 1px 0 rgba(255,255,255,.3);animation:pop .6s var(--ease) 2s both;transition:transform .12s var(--ease),filter .2s}
.save:hover{filter:brightness(1.05)}.save:active{transform:scale(.98)}.save svg{width:19px;height:19px}
.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:15px}
.act{display:flex;flex-direction:column;align-items:center;gap:7px;padding:13px 5px;border-radius:14px;text-decoration:none;color:var(--text);
 background:var(--stock2);border:1px solid var(--hair2);transition:transform .16s var(--ease),border-color .2s,background .2s;animation:pop .5s var(--ease) both}
.act:hover{transform:translateY(-3px);border-color:color-mix(in oklab,var(--accent) 45%,transparent)}
.act:active{transform:scale(.96)}
.act .ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:var(--accent);background:color-mix(in oklab,var(--accent) 14%,transparent)}
.act .ic svg{width:19px;height:19px}
.act span:last-child{font-size:11.5px;color:var(--muted)}
.actions .act:nth-child(1){animation-delay:2.15s}.actions .act:nth-child(2){animation-delay:2.22s}.actions .act:nth-child(3){animation-delay:2.29s}
.actions .act:nth-child(4){animation-delay:2.36s}.actions .act:nth-child(5){animation-delay:2.43s}.actions .act:nth-child(6){animation-delay:2.5s}
@keyframes pop{0%{opacity:0;transform:translateY(10px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
.bio{margin-top:15px;padding:14px 16px;border-radius:14px;font-size:13.5px;line-height:1.55;color:var(--text);opacity:.86;background:var(--ink2);border:1px solid var(--hair2);animation:pop .6s var(--ease) 2.4s both}
.foot{margin-top:16px;text-align:center;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted);opacity:.7}
@media (prefers-reduced-motion:reduce){*{animation:none !important}.load{display:none}.card::after{display:none}}
`;

/** The full profile page. data = { employee, company, cardUrl, vcardUrl, logoUrl, photoUrl }. */
export function renderProfilePage({ employee, company, cardUrl, vcardUrl, logoUrl, photoUrl }) {
  const brand = safeHex(company?.brandColour);
  // Adapt: a light brand wants dark stock; a dark brand wants light stock;
  // mid-vibrant brands default to the dark "evening" treatment.
  const L = luminance(brand);
  const treatment = L > 0.62 ? 'dark' : L < 0.2 ? 'light' : 'dark';
  const vars = palette(brand, treatment);
  const styleVars = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');

  const title = employee.name;
  const description = [employee.jobTitle, company?.companyName].filter(Boolean).join(' · ');
  const ogImage = photoUrl || logoUrl || '';

  const website = ensureHttp(company?.website);
  const linkedin = ensureHttp(employee.linkedin);
  const mapHref =
    ensureHttp(company?.mapLink) ||
    (company?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}` : '');
  const telHref = employee.phone ? `tel:${employee.phone.replace(/[^\d+]/g, '')}` : '';
  const waNumber = employee.whatsapp || employee.phone;

  const rows =
    action(ICON.phone, 'Call', telHref) +
    action(ICON.whatsapp, 'WhatsApp', waNumber ? `https://wa.me/${digits(waNumber)}` : '') +
    action(ICON.email, 'Email', employee.email ? `mailto:${employee.email}` : '') +
    action(ICON.web, 'Website', website, false, true) +
    action(ICON.linkedin, 'LinkedIn', linkedin, true, true) +
    action(ICON.location, 'Location', mapHref, false, true);

  const avatar = photoUrl
    ? `<div class="ava"><img src="${attr(photoUrl)}" alt="${h(employee.name)}"></div>`
    : `<div class="ava">${h(initials(employee.name))}</div>`;

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${h(title)}</title>
<meta name="description" content="${h(description)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${h(title)}">
<meta property="og:description" content="${h(description)}">
${cardUrl ? `<meta property="og:url" content="${h(cardUrl)}">` : ''}
${ogImage ? `<meta property="og:image" content="${h(ogImage)}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="${h(vars['--ink'])}">
<style>${STYLE}</style></head>
<body style="${styleVars}">
<div class="bgdots"></div><div class="grain"></div>
<div class="load"><div class="stamp">${h(initials(employee.name))}</div></div>
<h2 class="sr-only">Digital contact card for ${h(employee.name)}${company?.companyName ? `, ${h(company.companyName)}` : ''}.</h2>
<main class="card" id="card">
  ${logoUrl ? `<img class="logo" src="${attr(logoUrl)}" alt="${h(company?.companyName || 'Logo')}">` : ''}
  ${avatar}
  <h1 class="name">${h(employee.name)}</h1>
  ${employee.jobTitle ? `<p class="role">${h(employee.jobTitle)}</p>` : ''}
  ${company?.companyName ? `<p class="org">${h(company.companyName)}</p>` : ''}
  <div class="rule"></div>
  <a class="save" href="${attr(vcardUrl)}">${iconSvg(ICON.save)} Save Contact</a>
  <div class="actions">${rows}</div>
  ${employee.bio ? `<p class="bio">${h(employee.bio)}</p>` : ''}
  <p class="foot">Tap &middot; Connect</p>
</main>
<script>
(function(){
  var card=document.getElementById('card');
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(card&&!reduce&&matchMedia('(pointer:fine)').matches){
    document.body.addEventListener('pointermove',function(e){
      var r=card.getBoundingClientRect();var x=(e.clientX-r.left)/r.width-.5;var y=(e.clientY-r.top)/r.height-.5;
      card.style.transform='perspective(900px) rotateY('+(x*5)+'deg) rotateX('+(-y*5)+'deg)';
    });
    document.body.addEventListener('pointerleave',function(){card.style.transform='';});
  }
})();
</script>
</body></html>`;
}

/** Identical, information-free 404 for unknown / lost / disabled / unassigned. */
export function renderNotFoundPage() {
  const vars = palette('#1f9e78', 'dark');
  const styleVars = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Not found</title>
<style>${STYLE}</style></head>
<body style="${styleVars}"><div class="bgdots"></div>
<main class="card" style="text-align:center;padding:56px 26px;animation:none">
  <div style="font-size:42px;margin-bottom:12px">🔗</div>
  <h1 class="name" style="font-size:21px">This card isn't available</h1>
  <p class="role" style="color:var(--muted);margin-top:8px">The link may be inactive or no longer exists.</p>
</main></body></html>`;
}
