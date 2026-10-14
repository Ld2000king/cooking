// Screens. Each view returns { el, cleanup? }. Pages are rendered fresh on navigation.
import { CATEGORIES, RECIPE_OF_THE_DAY } from './data.js';
import { store, allRecipes, getRecipe, isFav, isMine, toggleFav, addToShopping, deleteRecipe, unreadCount } from './store.js';
import { h, $, $$, esc, icon, mascotBlock, toast, haptic, fmtIng, fmtTime, timeAgo, mmss, reducedMotion } from './ui.js';
import { openCreate, openSettings, openShopping, openEditName } from './sheets.js';

const catLabel = id => CATEGORIES.find(c => c.id === id)?.label || '';
const initial = name => (name || '?').trim().charAt(0);
const go = hash => { location.hash = hash; };

function greeting() {
  const hr = new Date().getHours();
  if (hr < 5) return 'לילה טוב';
  if (hr < 12) return 'בוקר טוב';
  if (hr < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

/* ---------- shared: recipe card ---------- */
export function card(r, i = 0) {
  return `<article class="rcard" style="--i:${i}">
    <button class="card-hit" data-open="${esc(r.id)}" aria-label="${esc(r.title)}" style="position:absolute;inset:0;border-radius:inherit;z-index:0"></button>
    <div class="ill" style="--c:${esc(r.color)}"><span>${esc(r.emoji)}</span></div>
    <button class="fav-btn" data-fav="${esc(r.id)}" aria-pressed="${isFav(r.id)}" aria-label="שמירה">${icon('heart')}</button>
    <h3>${esc(r.title)}</h3>
    <p class="meta">${icon('clock', 'tiny')} ${fmtTime(r.time)} · ${esc(r.level)}</p>
    <div class="foot"><span>${r.servings} מנות</span>
      <button class="plus-btn" data-add="${esc(r.id)}" aria-label="הוספת המצרכים לרשימת הקניות" style="position:relative;z-index:1">${icon('plus')}</button></div>
  </article>`;
}

// delegated handlers used by any page that shows cards
function wireCards(root) {
  root.addEventListener('click', e => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      const on = toggleFav(fav.dataset.fav);
      fav.setAttribute('aria-pressed', on); fav.classList.remove('pop'); void fav.offsetWidth; fav.classList.add('pop');
      haptic(8); toast(on ? 'נשמר למתכונים שלך ❤️' : 'הוסר מהשמורים');
      return;
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      const r = getRecipe(add.dataset.add);
      const n = addToShopping(r);
      add.classList.remove('bump'); void add.offsetWidth; add.classList.add('bump');
      haptic(10); toast(n ? `${n} מצרכים נוספו לרשימת הקניות 🛒` : 'המצרכים כבר ברשימה');
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) go('#/recipe/' + open.dataset.open);
  });
}

/* ================= HOME ================= */
let homeCat = 'all';
export function Home({ first }) {
  const s = store.get(), rod = getRecipe(RECIPE_OF_THE_DAY), unread = unreadCount();
  const el = h(`<div class="page">
    <div class="edge"></div>
    <header class="topbar" style="${first ? 'animation:downIn .35s var(--ease-out) both' : ''}">
      <a class="avatar" href="#/profile" aria-label="לפרופיל">${esc(initial(s.user?.name))}</a>
      <div class="who"><span class="eyebrow">${greeting()}, מה מבשלים היום?</span><b>היי, ${esc(s.user?.name || 'שף')}</b></div>
      <a class="icon-btn" href="#/activity" aria-label="פעילות" style="position:relative">${icon('bell')}${unread ? '<i class="badge-dot"></i>' : ''}</a>
    </header>
    <button class="hero" data-open="${rod.id}" style="${first ? 'animation:popIn .4s var(--ease-out) .1s both' : ''}">
      <div class="txt"><span class="eyebrow">המתכון של היום</span><h2>${esc(rod.title)}</h2>
        <span class="btn btn-primary btn-sm">בואו נבשל</span></div>
      ${mascotBlock('m-steam m-stir', false).replace('mascot-wrap', 'mascot-wrap')}
    </button>
    <div class="chips" role="group" aria-label="קטגוריות"></div>
    <div class="sec-head"><h2></h2><span></span></div>
    <div class="grid"></div>
  </div>`);
  // put the mascot in the hero's art slot
  const hero = $('.hero', el); $('.mascot-wrap', hero).style.cssText = 'position:absolute;left:0;bottom:-4px;width:46%;height:100%';

  const chips = $('.chips', el);
  const opts = [{ id: 'all', label: 'הכל', emoji: '✨' }, ...CATEGORIES];
  chips.innerHTML = opts.map((c, i) => `<button class="chip" data-cat="${c.id}" aria-pressed="${c.id === homeCat}"
     style="${first ? `animation:popIn .32s var(--spring) ${0.2 + i * 0.04}s both` : ''}">${c.emoji} ${c.label}</button>`).join('');

  const renderGrid = (animate) => {
    const list = allRecipes().filter(r => homeCat === 'all' || r.cat === homeCat);
    $('.sec-head h2', el).textContent = homeCat === 'all' ? 'כל המתכונים' : catLabel(homeCat);
    $('.sec-head span', el).textContent = `${list.length} מתכונים`;
    const grid = $('.grid', el);
    grid.className = 'grid' + (animate ? ' stagger' : '');
    grid.innerHTML = list.length ? list.map(card).join('')
      : `<div class="empty" style="grid-column:1/-1">${mascotBlock('m-steam')}<b>עוד אין כאן מתכונים</b><span>היו הראשונים לפרסם מתכון בקטגוריה הזו</span></div>`;
  };
  renderGrid(first);

  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    homeCat = b.dataset.cat;
    $$('.chip', chips).forEach(c => c.setAttribute('aria-pressed', c === b));
    renderGrid(true);
  });
  wireCards(el);
  return { el };
}

/* ================= SEARCH ================= */
let lastQuery = '';
export function Search() {
  const el = h(`<div class="page">
    <div class="edge"></div>
    <div class="page-head"><h1>חיפוש</h1></div>
    <label class="search-field">${icon('search')}<span class="vh">חיפוש מתכון</span>
      <input id="q" type="search" placeholder="מתכון, מצרך או קטגוריה" autocomplete="off" enterkeyhint="search"></label>
    <div class="chips" role="group" aria-label="חיפוש מהיר">${CATEGORIES.map(c => `<button class="chip" data-q="${c.label}">${c.emoji} ${c.label}</button>`).join('')}</div>
    <div class="sec-head"><h2></h2><span></span></div>
    <div class="rows"></div>
  </div>`);
  const input = $('#q', el);
  input.value = lastQuery;
  const mark = (text, q) => {
    const t = esc(text); if (!q) return t;
    const i = text.indexOf(q); if (i < 0) return t;
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  };
  const render = () => {
    const q = input.value.trim(); lastQuery = q;
    let list = allRecipes();
    if (q) list = list.filter(r => r.title.includes(q) || catLabel(r.cat).includes(q) || r.ingredients.some(i => i.n.includes(q)));
    else list = [...list].sort((a, b) => b.likes - a.likes).slice(0, 6);
    $('.sec-head h2', el).textContent = q ? 'תוצאות' : 'הכי אהובים השבוע';
    $('.sec-head span', el).textContent = q ? `${list.length} נמצאו` : '';
    $('.rows', el).innerHTML = list.length ? list.map(r => {
      const hit = q && !r.title.includes(q) ? r.ingredients.find(i => i.n.includes(q)) : null;
      return `<button class="row" data-open="${esc(r.id)}">
        <span class="tile" style="--c:${esc(r.color)}">${esc(r.emoji)}</span>
        <span class="txt"><b>${mark(r.title, q)}</b><small>${hit ? 'מכיל ' + mark(hit.n, q) : `${catLabel(r.cat)} · ${fmtTime(r.time)} · ${esc(r.level)}`}</small></span>
        <span class="chev">${icon('chev')}</span></button>`;
    }).join('') : `<div class="empty">${mascotBlock('m-steam')}<b>לא מצאנו מתכון כזה</b><span>נסו מילה אחרת, או פרסמו אותו בעצמכם</span>
        <button class="btn btn-soft btn-sm" data-create>יצירת מתכון</button></div>`;
  };
  render();
  input.addEventListener('input', render);
  $('.chips', el).addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { input.value = b.dataset.q; render(); } });
  el.addEventListener('click', e => {
    if (e.target.closest('[data-create]')) return openCreate();
    const o = e.target.closest('[data-open]'); if (o) go('#/recipe/' + o.dataset.open);
  });
  return { el, focus: () => !lastQuery && input.focus({ preventScroll: true }) };
}

/* ================= ACTIVITY ================= */
export function Activity() {
  const acts = store.get().activity;
  const el = h(`<div class="page">
    <div class="edge"></div>
    <div class="page-head"><h1>פעילות</h1>${acts.some(a => !a.read) ? '<button class="btn btn-ghost btn-sm" data-read>סימון הכל כנקרא</button>' : ''}</div>
    <div class="rows stagger">${acts.length ? acts.map((a, i) => `<div class="act ${a.read ? '' : 'unread'}" style="--i:${i}">
      <span class="em">${esc(a.em)}</span><div><p>${esc(a.text)}</p><time>${timeAgo(a.at)}</time></div></div>`).join('')
      : `<div class="empty">${mascotBlock('m-steam')}<b>אין עדכונים חדשים</b><span>כשמישהו ישמור מתכון שלכם, זה יופיע כאן</span></div>`}</div>
  </div>`);
  const markAll = () => store.update(s => s.activity.forEach(a => { a.read = true; }));
  el.addEventListener('click', e => { if (e.target.closest('[data-read]')) { markAll(); $$('.act', el).forEach(a => a.classList.remove('unread')); e.target.closest('[data-read]').remove(); } });
  const tmr = setTimeout(markAll, 1500);
  return { el, cleanup() { clearTimeout(tmr); markAll(); } };
}

/* ================= PROFILE ================= */
let profileTab = 0;
export function Profile() {
  const s = store.get(), u = s.user || {};
  const el = h(`<div class="page">
    <div class="edge"></div>
    <header class="p-head"><span style="width:42px"></span><h1>הפרופיל שלי</h1>
      <button class="icon-btn" data-settings aria-label="הגדרות">${icon('gear')}</button></header>
    <div class="p-block"><div class="avatar lg">${esc(initial(u.name))}</div>
      <div class="txt"><h2>${esc(u.name || 'אורח')}</h2><p>${esc(u.guest ? 'מצב אורח · הנתונים נשמרים במכשיר' : (u.email || ''))}</p></div>
      <button class="icon-btn" data-edit aria-label="עריכת שם" style="background:var(--accent);color:var(--accent-ink)">${icon('pen')}</button></div>
    <div class="stats"><div><b>${s.mine.length}</b><span>מתכונים שלי</span></div><div><b>${s.favs.length}</b><span>שמורים</span></div>
      <div><b>${s.shopping.filter(x => !x.done).length}</b><span>ברשימת קניות</span></div></div>
    <div class="p-actions"><button class="btn btn-primary" data-shop>${icon('cart')} רשימת קניות</button>
      <button class="btn btn-soft" data-share>${icon('share')} שיתוף</button></div>
    <div class="seg" role="tablist" data-i="${profileTab}"><span class="thumb"></span>
      <button role="tab" aria-selected="${profileTab === 0}" data-tab="0">המתכונים שלי</button>
      <button role="tab" aria-selected="${profileTab === 1}" data-tab="1">שמורים</button></div>
    <div class="grid"></div>
  </div>`);
  const renderGrid = () => {
    const list = profileTab === 0 ? s.mine : s.favs.map(getRecipe).filter(Boolean);
    const grid = $('.grid', el);
    grid.className = 'grid stagger';
    grid.innerHTML = list.length ? list.map(card).join('') : (profileTab === 0
      ? `<div class="empty" style="grid-column:1/-1">${mascotBlock('m-steam m-lid')}<b>עוד לא פרסמתם מתכון</b><span>המתכון הראשון שלכם יופיע כאן</span><button class="btn btn-primary btn-sm" data-create>יצירת מתכון</button></div>`
      : `<div class="empty" style="grid-column:1/-1">${mascotBlock('m-steam')}<b>אין מתכונים שמורים</b><span>לחצו על ❤️ במתכון כדי לשמור אותו</span></div>`);
  };
  renderGrid();
  el.addEventListener('click', async e => {
    const t = e.target;
    if (t.closest('[data-settings]')) return openSettings();
    if (t.closest('[data-edit]')) return openEditName();
    if (t.closest('[data-shop]')) return openShopping();
    if (t.closest('[data-create]')) return openCreate();
    if (t.closest('[data-share]')) {
      const data = { title: 'שף בכיס', text: `${u.name || 'אני'} מבשל/ת עם שף בכיס 🍲`, url: location.href.split('#')[0] };
      try { if (navigator.share) { await navigator.share(data); return; } await navigator.clipboard.writeText(data.url); toast('הקישור הועתק'); }
      catch { /* user cancelled */ }
      return;
    }
    const tab = t.closest('[data-tab]');
    if (tab) { profileTab = +tab.dataset.tab; $('.seg', el).dataset.i = profileTab; $$('[data-tab]', el).forEach(b => b.setAttribute('aria-selected', b === tab)); renderGrid(); }
  });
  wireCards(el);
  const unsub = store.subscribe(() => { /* keep stats fresh after sheets */
    const ns = store.get(); const b = $$('.stats b', el);
    b[0].textContent = ns.mine.length; b[1].textContent = ns.favs.length; b[2].textContent = ns.shopping.filter(x => !x.done).length;
    $('.p-block h2', el).textContent = ns.user?.name || 'אורח'; $('.p-block .avatar', el).textContent = initial(ns.user?.name);
    if (profileTab === 0 || profileTab === 1) { s.mine = ns.mine; s.favs = ns.favs; }
  });
  return { el, cleanup: unsub };
}

/* ================= RECIPE DETAIL ================= */
export function Recipe({ id }) {
  const r = getRecipe(id);
  if (!r) return NotFound();
  let servings = r.servings;
  const checked = new Set();
  const el = h(`<div class="page push" style="padding-bottom:0">
    <div class="d-hero" style="--c:${esc(r.color)}"><span class="emoji">${esc(r.emoji)}</span></div>
    <div class="d-top"><button class="icon-btn glass" data-back aria-label="חזרה">${icon('back')}</button>
      <button class="icon-btn glass fav-btn" style="position:static;color:var(--danger)" data-fav="${esc(r.id)}" aria-pressed="${isFav(r.id)}" aria-label="שמירה">${icon('heart')}</button></div>
    <div class="d-body">
      <h1>${esc(r.title)}</h1>
      <p class="d-by">מאת ${esc(r.author)}${r.likes ? ` · ❤️ ${r.likes.toLocaleString('he-IL')} שמרו` : ''}</p>
      <div class="pills"><span class="pill">${icon('clock')} ${fmtTime(r.time)}</span><span class="pill">${icon('flame')} ${esc(r.level)}</span><span class="pill">${esc(catLabel(r.cat))}</span></div>
      <section class="box">
        <div class="box-head"><h2>מצרכים</h2>
          <div class="stepper" aria-label="מספר מנות"><button data-sv="1" aria-label="עוד מנה">${icon('plus')}</button>
            <output aria-live="polite"></output><button data-sv="-1" aria-label="פחות מנות">${icon('minus')}</button></div></div>
        <div class="ings"></div>
        <button class="btn btn-soft btn-block" data-shop style="margin:8px 0 12px">${icon('cart')} הוספה לרשימת הקניות</button>
      </section>
      <section class="box"><div class="box-head"><h2>אופן ההכנה</h2><span class="muted" style="font-size:13px">${r.steps.length} שלבים</span></div>
        <ol class="steps">${r.steps.map(st => `<li><div>${esc(st.t)}${st.m ? `<div class="tmr">${icon('clock')} טיימר ${fmtTime(st.m)}</div>` : ''}</div></li>`).join('')}</ol></section>
      ${isMine(r.id) ? '<button class="danger-link" data-del>מחיקת המתכון</button>' : ''}
      <div class="cta-bar"><a class="btn btn-hero btn-block" href="#/cook/${esc(r.id)}">${icon('play')} מתחילים לבשל</a></div>
    </div>
  </div>`);
  const renderIngs = () => {
    const f = servings / r.servings;
    $('output', el).textContent = `${servings} מנות`;
    $('.ings', el).innerHTML = r.ingredients.map((ing, i) => `<button class="ing" role="checkbox" aria-checked="${checked.has(i)}" data-ing="${i}">
      <span class="ck">${icon('check')}</span><span class="nm">${esc(ing.n)}</span><span class="q">${fmtIng(ing, f)}</span></button>`).join('');
  };
  renderIngs();
  let delArmed = false;
  el.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-back]')) return back();
    const sv = t.closest('[data-sv]');
    if (sv) { servings = Math.min(40, Math.max(1, servings + +sv.dataset.sv)); haptic(6); return renderIngs(); }
    const ing = t.closest('[data-ing]');
    if (ing) { const i = +ing.dataset.ing; checked.has(i) ? checked.delete(i) : checked.add(i); ing.setAttribute('aria-checked', checked.has(i)); haptic(6); return; }
    if (t.closest('[data-shop]')) { const n = addToShopping(r, servings / r.servings); haptic(10); return toast(n ? `${n} מצרכים נוספו לרשימת הקניות 🛒` : 'המצרכים כבר ברשימה'); }
    const del = t.closest('[data-del]');
    if (del) {
      if (!delArmed) { delArmed = true; del.textContent = 'לחצו שוב כדי למחוק לצמיתות'; setTimeout(() => { delArmed = false; del.textContent = 'מחיקת המתכון'; }, 3500); return; }
      deleteRecipe(r.id); toast('המתכון נמחק'); return go('#/profile');
    }
  });
  wireCards(el); // handles the heart
  return { el };
}

/* ================= COOKING MODE ================= */
export function Cook({ id }) {
  const r = getRecipe(id);
  if (!r) return NotFound();
  let idx = 0, tick = null, wake = null, finished = false;
  const timers = r.steps.map(st => ({ total: st.m * 60, left: st.m * 60, running: false, end: 0 }));
  const el = h(`<div class="page push cook" style="padding-bottom:0">
    <div class="cook-top"><button class="icon-btn" data-close aria-label="יציאה ממצב בישול">${icon('x')}</button>
      <h1>${esc(r.title)}</h1><span style="width:42px"></span></div>
    <div class="progress"><small></small><div class="track"><i></i></div></div>
    <div class="cook-card">
      ${mascotBlock('m-steam m-blink', false)}
      <p class="step-text" aria-live="polite"></p>
      <div class="timer"></div>
    </div>
    <div class="cook-nav"><button class="btn btn-soft" data-prev>הקודם</button><button class="btn btn-primary" data-next>הבא</button></div>
  </div>`);
  const card = $('.cook-card', el), mw = $('.mascot', el);
  const hop = () => { mw.classList.remove('m-hop'); void mw.getBoundingClientRect(); mw.classList.add('m-hop'); };

  const renderTimer = () => {
    const tm = timers[idx], box = $('.timer', el);
    if (!tm.total) { box.innerHTML = ''; return; }
    const C = 2 * Math.PI * 58, frac = tm.left / tm.total;
    box.innerHTML = `<div class="ring ${tm.left <= 0 ? 'done' : ''}"><svg viewBox="0 0 136 136"><circle cx="68" cy="68" r="58" fill="none" stroke="var(--surface-3)" stroke-width="12"/>
      <circle cx="68" cy="68" r="58" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${(C * (1 - frac)).toFixed(1)}" style="transition:stroke-dashoffset .3s linear"/></svg>
      <div class="t">${tm.left <= 0 ? '✓' : mmss(Math.ceil(tm.left))}</div></div>
      <div class="timer-ctl">${tm.left > 0 ? `<button class="btn btn-primary btn-sm" data-tt>${tm.running ? icon('pause') + ' השהיה' : icon('play') + (tm.left < tm.total ? ' המשך' : ' הפעלת טיימר')}</button>` : ''}
        <button class="btn btn-soft btn-sm" data-tr aria-label="איפוס טיימר">${icon('reset')}</button></div>`;
  };
  const beep = () => {
    try { const a = new (window.AudioContext || window.webkitAudioContext)(); [0, .28, .56].forEach(d => { const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.18, a.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + d + .22);
      o.start(a.currentTime + d); o.stop(a.currentTime + d + .24); }); } catch { /* audio blocked */ }
  };
  const loop = () => {
    let changed = false;
    timers.forEach((tm, i) => {
      if (!tm.running) return;
      tm.left = Math.max(0, (tm.end - Date.now()) / 1000); changed = changed || i === idx;
      if (tm.left <= 0) { tm.running = false; haptic([200, 100, 200]); beep(); toast(`⏰ הטיימר של שלב ${i + 1} הסתיים`); if (i === idx) hop(); }
    });
    if (changed) renderTimer();
    if (!timers.some(t => t.running)) { clearInterval(tick); tick = null; }
  };
  const startTick = () => { if (!tick) tick = setInterval(loop, 250); };

  const render = (dir) => {
    if (finished) return;
    $('.progress small', el).textContent = `שלב ${idx + 1} מתוך ${r.steps.length}`;
    $('.track i', el).style.width = `${((idx + 1) / r.steps.length) * 100}%`;
    const p = $('.step-text', el); p.textContent = r.steps[idx].t;
    p.classList.remove('in-next', 'in-prev'); if (dir) { void p.offsetWidth; p.classList.add(dir > 0 ? 'in-next' : 'in-prev'); }
    $('[data-prev]', el).disabled = idx === 0;
    $('[data-next]', el).innerHTML = idx === r.steps.length - 1 ? 'סיימתי! 🎉' : 'הבא';
    renderTimer();
  };
  const step = d => {
    if (d > 0 && idx === r.steps.length - 1) return finish();
    const n = Math.min(r.steps.length - 1, Math.max(0, idx + d)); if (n === idx) return;
    idx = n; haptic(8); hop(); render(d);
  };
  const finish = () => {
    finished = true; clearInterval(tick);
    const colors = ['#3DDC97', '#27B675', '#F7B6C6', '#FFD166', '#8FD3B6'];
    el.innerHTML = `<div class="confetti">${Array.from({ length: reducedMotion() ? 0 : 36 }, (_, i) =>
      `<i style="left:${Math.random() * 100}%;background:${colors[i % 5]};animation-delay:${Math.random() * .6}s"></i>`).join('')}</div>
      <div class="finish">${mascotBlock('m-steam m-lid')}<h2>בתיאבון!</h2><p class="muted">סיימתם להכין את ${esc(r.title)}.</p>
      <div style="display:flex;gap:10px;margin-top:10px"><a class="btn btn-soft" href="#/recipe/${esc(r.id)}">חזרה למתכון</a><a class="btn btn-primary" href="#/home">לדף הבית</a></div></div>`;
    haptic([30, 60, 30]);
  };

  el.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-close]')) return back();
    if (t.closest('[data-next]')) return step(1);
    if (t.closest('[data-prev]')) return step(-1);
    const tm = timers[idx];
    if (t.closest('[data-tt]')) {
      if (tm.running) { tm.running = false; tm.left = Math.max(0, (tm.end - Date.now()) / 1000); }
      else { tm.running = true; tm.end = Date.now() + tm.left * 1000; startTick(); }
      haptic(8); return renderTimer();
    }
    if (t.closest('[data-tr]')) { tm.running = false; tm.left = tm.total; return renderTimer(); }
  });
  // swipe between steps (RTL: dragging right reveals the next step)
  let sx = null, sy = 0;
  card.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; });
  card.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx > 0 ? 1 : -1); });
  const onKey = e => { if (e.key === 'ArrowLeft') step(1); if (e.key === 'ArrowRight') step(-1); if (e.key === 'Escape') back(); };
  document.addEventListener('keydown', onKey);
  (async () => { try { wake = await navigator.wakeLock?.request('screen'); } catch { /* not allowed */ } })();
  render();
  return { el, cleanup() { clearInterval(tick); document.removeEventListener('keydown', onKey); try { wake?.release(); } catch { /* already released */ } } };
}

function NotFound() {
  const el = h(`<div class="page push"><div class="empty" style="margin-top:30vh">${mascotBlock('m-steam')}<b>המתכון לא נמצא</b>
    <a class="btn btn-primary btn-sm" href="#/home">לדף הבית</a></div></div>`);
  return { el };
}

export function back() {
  if (history.length > 1 && sessionStorage.getItem('sb:nav')) history.back(); else go('#/home');
}
