// Shared UI helpers: icons, mascot, toasts, bottom sheets, formatting.

const P = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-6.8 0-4.4-3.5-7-4.5-10.2-2 1.6-2.4 3.7-2.5 5-1.3-1-2-2.4-2-4C6.5 8 5 11.6 5 15.2 5 19.3 8 22 12 22z"/>',
  back: '<path d="M9 6l6 6-6 6"/>',           // RTL "back" points right
  chev: '<path d="M15 6l-6 6 6 6"/>',         // RTL disclosure points left
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  cart: '<path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M4 4v6h6"/><path d="M4.5 15a8 8 0 1 0 1.9-8.3L4 10"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M11 18h2"/>',
};
export const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- formatting ---------- */
const FR = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };
export function fmtQty(q) {
  if (q == null) return '';
  const whole = Math.floor(q + 1e-9), frac = Math.round((q - whole) * 100) / 100;
  if (frac < 0.05) return String(whole);
  const key = Object.keys(FR).find(k => Math.abs(k - frac) < 0.06);
  if (key) return (whole ? whole + ' ' : '') + FR[key];
  return (Math.round(q * 10) / 10).toString();
}
export function fmtIng(ing, factor = 1) {
  if (ing.q == null) return '';
  const q = ing.q * factor;
  return `${fmtQty(q)}${ing.u ? ' ' + ing.u : ''}`;
}
export function timeAgo(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'עכשיו';
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
}
export const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const fmtTime = m => m >= 60 ? `${Math.floor(m / 60)} ש׳${m % 60 ? ' ' + (m % 60) + ' דק׳' : ''}` : `${m} דק׳`;

/* ---------- mascot: original chef-pot, parts grouped for animation ---------- */
export function mascot(cls = '') {
  return `<svg class="mascot ${cls}" viewBox="-30 -24 270 230" aria-hidden="true">
  <g fill="none" stroke="#8FD3B6" stroke-width="5" stroke-linecap="round">
    <path class="st st1" d="M86 26 q-8 -9 0 -18 q8 -9 0 -18"/>
    <path class="st st2" d="M110 20 q-8 -9 0 -18 q8 -9 0 -18"/>
    <path class="st st3" d="M134 26 q-8 -9 0 -18 q8 -9 0 -18"/>
  </g>
  <ellipse class="foot foot1" cx="86" cy="178" rx="15" ry="8" fill="#1A4D3D"/>
  <ellipse class="foot foot2" cx="134" cy="178" rx="15" ry="8" fill="#1A4D3D"/>
  <rect x="18" y="106" width="28" height="15" rx="7.5" fill="#276B55"/>
  <rect x="174" y="106" width="28" height="15" rx="7.5" fill="#276B55"/>
  <g class="ladle">
    <path d="M28 113 Q8 108 2 86" fill="none" stroke="#F1C7A3" stroke-width="9" stroke-linecap="round"/>
    <path d="M2 88 L-6 32" stroke="#C99B6E" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="-7" cy="26" rx="11" ry="8" fill="#C99B6E"/>
  </g>
  <rect x="40" y="84" width="140" height="92" rx="32" fill="#2F7D64"/>
  <rect x="54" y="98" width="16" height="52" rx="8" fill="#4E9C82" opacity=".65"/>
  <rect x="34" y="78" width="152" height="16" rx="8" fill="#276B55"/>
  <g class="lid">
    <path d="M40 80 C46 44 174 44 180 80 Z" fill="#3DDC97"/>
    <path d="M58 70 C72 54 104 50 120 52" fill="none" stroke="#A8F3D0" stroke-width="5" stroke-linecap="round"/>
    <rect x="98" y="34" width="24" height="14" rx="7" fill="#276B55"/>
  </g>
  <g class="eye"><ellipse cx="92" cy="120" rx="10" ry="11" fill="#fff"/><circle cx="89" cy="122" r="5" fill="#16261F"/><circle cx="87" cy="119" r="1.6" fill="#fff"/></g>
  <g class="eye"><ellipse cx="128" cy="120" rx="10" ry="11" fill="#fff"/><circle cx="125" cy="122" r="5" fill="#16261F"/><circle cx="123" cy="119" r="1.6" fill="#fff"/></g>
  <ellipse cx="74" cy="142" rx="9" ry="5.5" fill="#F7B6C6"/>
  <ellipse cx="146" cy="142" rx="9" ry="5.5" fill="#F7B6C6"/>
  <path d="M96 140 Q110 154 124 140" fill="none" stroke="#16261F" stroke-width="4" stroke-linecap="round"/>
</svg>`;
}
export const mascotBlock = (cls = '', blob = true) => `<div class="mascot-wrap">${blob ? '<div class="blob"></div>' : ''}${mascot(cls)}</div>`;

export const wordmark = () => 'שף בכ<span>יס</span><b>.</b>';

/* ---------- toasts ---------- */
export function toast(msg, ms = 2200) {
  const box = document.getElementById('toasts');
  const el = h(`<div class="toast">${esc(msg)}</div>`);
  box.appendChild(el);
  if (box.children.length > 2) box.firstElementChild.remove();
  setTimeout(() => { el.classList.add('out'); el.addEventListener('animationend', () => el.remove(), { once: true }); }, ms);
}

export function haptic(pattern = 10) { try { navigator.vibrate?.(pattern); } catch { /* not supported */ } }

/* ---------- bottom sheets (one at a time) ---------- */
let current = null;
export function openSheet({ title, body, action, onAction, cancel = 'סגירה', tall = false, onClose }) {
  if (current) current.close(true);
  const layer = h(`<div class="sheet-layer">
    <div class="scrim"></div>
    <section class="sheet ${tall ? 'tall' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-grab"><i></i></div>
      <header class="sheet-head">
        <button class="s-cancel" type="button">${esc(cancel)}</button>
        <h2>${esc(title)}</h2>
        ${action ? `<button class="s-act" type="button">${esc(action)}</button>` : '<span></span>'}
      </header>
      <div class="sheet-body"></div>
    </section></div>`);
  const sheet = $('.sheet', layer), bodyEl = $('.sheet-body', layer);
  if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.appendChild(body);
  document.getElementById('sheets').appendChild(layer);
  document.body.classList.add('sheet-open');
  requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('open')));

  let closed = false;
  const api = {
    el: layer, body: bodyEl,
    close(instant = false) {
      if (closed) return; closed = true;
      if (current === api) current = null;
      document.body.classList.remove('sheet-open');
      sheet.style.transform = '';
      layer.classList.remove('open');
      const done = () => { layer.remove(); onClose?.(); };
      if (instant || reducedMotion()) done(); else setTimeout(done, 420);
    },
  };
  current = api;
  $('.scrim', layer).addEventListener('click', () => api.close());
  $('.s-cancel', layer).addEventListener('click', () => api.close());
  if (action) $('.s-act', layer).addEventListener('click', () => onAction?.(api));
  const onKey = e => { if (e.key === 'Escape') { api.close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);

  // drag to dismiss: tracks the finger 1:1, uses release velocity to decide
  const handles = [$('.sheet-grab', layer), $('.sheet-head', layer)];
  let startY = 0, dy = 0, hist = [], dragging = false;
  const down = e => {
    if (e.target.closest('button')) return;
    dragging = true; startY = e.clientY; dy = 0; hist = [[e.timeStamp, e.clientY]];
    sheet.classList.add('dragging'); e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = e => {
    if (!dragging) return;
    dy = e.clientY - startY;
    const y = dy > 0 ? dy : -Math.sqrt(-dy) * 2; // rubber-band upward
    sheet.style.transform = `translateY(${y}px)`;
    hist.push([e.timeStamp, e.clientY]); if (hist.length > 5) hist.shift();
  };
  const up = () => {
    if (!dragging) return; dragging = false; sheet.classList.remove('dragging');
    const [t0, y0] = hist[0], [t1, y1] = hist[hist.length - 1];
    const v = (y1 - y0) / Math.max(1, t1 - t0); // px/ms
    if (dy > 140 || v > 0.6) api.close(); else sheet.style.transform = '';
  };
  handles.forEach(el => { el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); });
  return api;
}
export const closeSheet = () => current?.close();
