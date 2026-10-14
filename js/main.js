// App entry: theme, splash → login → app, hash router with native-feeling transitions, tab bar.
import { store, unreadCount } from './store.js';
import { h, $, $$, esc, icon, mascot, mascotBlock, wordmark, toast, haptic, reducedMotion } from './ui.js';
import { Home, Search, Activity, Profile, Recipe, Cook } from './views.js';
import { openCreate } from './sheets.js';

/* ---------------- theme ---------------- */
const sysDark = matchMedia('(prefers-color-scheme: dark)');
export function applyTheme() {
  const pref = store.get().settings.dark;
  const dark = pref == null ? sysDark.matches : pref;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#0F1714' : '#F6FAF7'));
}
sysDark.addEventListener('change', applyTheme);
applyTheme();

/* ---------------- tab bar (topapp: 5 tabs; RTL so home sits on the right edge, profile on the left) ---------------- */
const TABS = [
  { id: 'home', label: 'בית', icon: 'home' },
  { id: 'search', label: 'חיפוש', icon: 'search' },
  { id: 'create', label: 'מתכון חדש', icon: 'plus' },
  { id: 'activity', label: 'פעילות', icon: 'bell' },
  { id: 'profile', label: 'פרופיל', icon: 'user' },
];
const tabbar = $('#tabbar');
function renderTabbar(active) {
  const n = unreadCount();
  tabbar.innerHTML = TABS.map(t => t.id === 'create'
    ? `<button class="tab tab-create" data-tab="create" aria-label="${t.label}"><span class="fab">${icon('plus')}</span></button>`
    : `<button class="tab" data-tab="${t.id}" aria-label="${t.label}" ${t.id === active ? 'aria-current="page"' : ''}>${icon(t.icon)}${t.id === 'activity' && n ? `<span class="count">${n}</span>` : ''}</button>`).join('');
}
tabbar.addEventListener('click', e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  haptic(6);
  if (b.dataset.tab === 'create') return openCreate();
  const target = '#/' + b.dataset.tab;
  if (location.hash === target) { cur?.el.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); return; }
  location.hash = target;
});
store.subscribe(() => { const a = cur?.route.tab; if (a) renderTabbar(a); });

/* ---------------- router ---------------- */
const viewEl = $('#view');
let cur = null; // { route, el, cleanup, depth }
const scrollMemo = {};

function parse() {
  const [name = 'home', id] = location.hash.replace(/^#\/?/, '').split('/');
  if (name === 'recipe' && id) return { name, id: decodeURIComponent(id), depth: 1 };
  if (name === 'cook' && id) return { name, id: decodeURIComponent(id), depth: 2 };
  const tab = ['home', 'search', 'activity', 'profile'].includes(name) ? name : 'home';
  return { name: tab, tab, depth: 0 };
}
const build = (r, first) => ({ home: Home, search: Search, activity: Activity, profile: Profile, recipe: Recipe, cook: Cook }[r.name])({ id: r.id, first });

let firstHome = false;
function show() {
  if (!store.get().user) return;
  const r = parse();
  const key = location.hash || '#/home';
  if (cur) { scrollMemo[cur.key] = cur.el.scrollTop; cur.cleanup?.(); }
  const v = build(r, firstHome && r.name === 'home');
  firstHome = false;
  const el = v.el;
  const prev = cur;
  cur = { route: r, el, cleanup: v.cleanup, depth: r.depth, key };
  tabbar.classList.toggle('hidden', r.depth > 0);
  if (r.tab) renderTabbar(r.tab);

  const anim = !reducedMotion() && prev;
  if (!prev) viewEl.replaceChildren(el);
  else if (r.depth > prev.depth) {               // push: new page slides in from the left (RTL), old one parallaxes
    viewEl.appendChild(el);
    if (anim) { el.classList.add('enter-push'); prev.el.classList.add('under-push'); }
    setTimeout(() => prev.el.remove(), anim ? 430 : 0);
  } else if (r.depth < prev.depth) {             // pop: reverse
    viewEl.insertBefore(el, prev.el);
    if (anim) { prev.el.classList.add('leave-push'); el.classList.add('under-pop'); }
    setTimeout(() => { prev.el.remove(); el.classList.remove('under-pop'); }, anim ? 390 : 0);
  } else {                                       // tab switch / same depth: quick cross-fade
    viewEl.replaceChildren(el);
    if (anim) el.classList.add('fade-in');
  }
  if (scrollMemo[key] && r.depth === 0) el.scrollTop = scrollMemo[key];
  v.focus?.();
}
window.addEventListener('hashchange', () => { sessionStorage.setItem('sb:nav', '1'); show(); });

/* ---------------- splash (aniapp stage A) ---------------- */
function splash() {
  return new Promise(resolve => {
    const host = $('#splash');
    const el = h(`<div class="splash" role="img" aria-label="שף בכיס נטען">
      <div class="stage"><div class="blob"></div>
        <div class="exitW"><div class="enterW">
          <div class="speed"><i class="a" style="top:0;width:48px"></i><i class="a" style="top:22px;width:70px"></i><i class="a" style="top:44px;width:36px"></i>
            <i class="b" style="top:0;width:48px"></i><i class="b" style="top:22px;width:70px"></i><i class="b" style="top:44px;width:36px"></i></div>
          <div class="bobW"><div class="sqW">${mascot()}</div></div>
        </div></div></div>
      <div class="word"><div class="wordOut"><div class="wm-in"><div class="wordmark">${wordmark()}</div></div>
        <p class="tag">מתכונים חמים, ישר מהסיר אליכם.</p></div></div>
      <p class="skip">הקישו כדי לדלג</p></div>`);
    host.replaceChildren(el);
    let done = false;
    const finish = () => { if (done) return; done = true; el.classList.add('leave'); setTimeout(() => { host.replaceChildren(); resolve(); }, 250); };
    setTimeout(finish, reducedMotion() ? 600 : 3000);
    el.addEventListener('click', finish);
  });
}

/* ---------------- login (aniapp stage B) ---------------- */
function login() {
  return new Promise(resolve => {
    const host = $('#auth');
    let mode = 'login', remember = true;
    const el = h(`<div class="auth">
      <div class="auth-head"><div class="txt"><div class="wordmark">${wordmark()}</div><p>מתכונים חמים, ישר מהסיר אליכם.</p></div>
        ${mascotBlock('m-steam m-float m-blink')}</div>
      <form class="auth-form" novalidate>
        <h1 class="si" style="--i:0">ברוכים השבים 👋</h1>
        <p class="sub si" style="--i:0">התחברו כדי להמשיך לבשל</p>
        <label class="field icon si" id="f-nm" style="--i:1" hidden>${icon('user')}<span class="vh">שם</span><input class="input" id="a-name" placeholder="איך לקרוא לכם?" autocomplete="name">
          <div class="err-msg"><span>כתבו שם של לפחות 2 תווים</span></div></label>
        <label class="field icon si" id="f-em" style="--i:1">${icon('mail')}<span class="vh">אימייל</span><input class="input" id="a-email" type="email" inputmode="email" placeholder="אימייל" autocomplete="email" dir="ltr" style="text-align:right">
          <div class="err-msg"><span>האימייל לא נראה תקין</span></div></label>
        <label class="field icon si" id="f-pw" style="--i:2">${icon('lock')}<span class="vh">סיסמה</span><input class="input" id="a-pass" type="password" placeholder="סיסמה" autocomplete="current-password">
          <button type="button" class="eye" aria-label="הצגת הסיסמה">${icon('eye')}</button>
          <div class="err-msg"><span>לפחות 6 תווים</span></div></label>
        <div class="row-between si" style="--i:3"><button type="button" class="check" role="checkbox" aria-checked="true" data-remember><span class="box2">${icon('check')}</span>זכור אותי</button>
          <button type="button" class="link" data-forgot>שכחת סיסמה?</button></div>
        <button class="btn btn-hero btn-block si" style="--i:4" type="submit"><span class="lbl">התחברות</span></button>
        <div class="divider si" style="--i:5">או</div>
        <div class="social si" style="--i:6"><button type="button" class="btn btn-outline" data-guest>${icon('user')} המשך כאורח</button></div>
        <p class="auth-foot si" style="--i:7"><span class="q">אין לך חשבון?</span> <button type="button" class="link" data-mode>הרשמה</button></p>
      </form></div>`);
    host.replaceChildren(el);
    const form = $('form', el), f = id => $(id, el);
    const setMode = m => {
      mode = m;
      $('h1', form).textContent = m === 'login' ? 'ברוכים השבים 👋' : 'נעים להכיר 👋';
      $('.sub', form).textContent = m === 'login' ? 'התחברו כדי להמשיך לבשל' : 'פותחים חשבון בכמה שניות';
      f('#f-nm').hidden = m === 'login';
      $('.lbl', form).textContent = m === 'login' ? 'התחברות' : 'יצירת חשבון';
      $('.q', form).textContent = m === 'login' ? 'אין לך חשבון?' : 'כבר רשומים?';
      $('[data-mode]', form).textContent = m === 'login' ? 'הרשמה' : 'התחברות';
      f('#a-pass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    };
    const enter = user => {
      store.update(s => { s.user = user; });
      el.classList.add('leave');
      setTimeout(() => { host.replaceChildren(); resolve(); }, 520);
    };
    form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('err'));
    form.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('.eye')) { const p = f('#a-pass'); p.type = p.type === 'password' ? 'text' : 'password'; return; }
      if (t.closest('[data-remember]')) { remember = !remember; t.closest('[data-remember]').setAttribute('aria-checked', remember); return; }
      if (t.closest('[data-forgot]')) return toast('איפוס סיסמה יתווסף כשיהיה שרת. בינתיים הכל נשמר במכשיר.');
      if (t.closest('[data-mode]')) return setMode(mode === 'login' ? 'signup' : 'login');
      if (t.closest('[data-guest]')) return enter({ name: 'אורח', guest: true });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = f('#a-name').value.trim(), email = f('#a-email').value.trim(), pass = f('#a-pass').value;
      const bad = [];
      if (mode === 'signup' && name.length < 2) bad.push('#f-nm');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push('#f-em');
      if (pass.length < 6) bad.push('#f-pw');
      $$('.field', form).forEach(x => x.classList.remove('err'));
      if (bad.length) {
        bad.forEach(sel => f(sel).classList.add('err'));
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); haptic([20, 40, 20]);
        f(bad[0]).querySelector('input').focus(); return;
      }
      const btn = $('[type="submit"]', form); btn.disabled = true; btn.style.width = btn.offsetWidth + 'px';
      btn.innerHTML = '<span class="spinner" aria-label="מתחבר"></span>';
      $$('input', form).forEach(i => { i.disabled = true; });
      $('.auth-head .mascot', el).classList.add('m-hop');
      const display = name || email.split('@')[0];
      setTimeout(() => enter({ name: display.charAt(0).toUpperCase() + display.slice(1), email, guest: false }), 800);
    });
  });
}

export function logout() {
  store.update(s => { s.user = null; });
  cur?.cleanup?.(); cur = null; viewEl.replaceChildren(); tabbar.classList.add('hidden');
  login().then(startApp);
}

function startApp() {
  firstHome = true;
  if (!location.hash || location.hash === '#/') history.replaceState(null, '', '#/home');
  show();
}

/* ---------------- boot ---------------- */
(async function boot() {
  tabbar.classList.add('hidden');
  if (!sessionStorage.getItem('sb:splash')) { sessionStorage.setItem('sb:splash', '1'); await splash(); }
  if (!store.get().user) await login();
  startApp();
})();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ }));
}
