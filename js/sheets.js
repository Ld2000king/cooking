// Bottom sheets: create recipe, settings, shopping list, edit name.
import { CATEGORIES, EMOJIS, COLORS } from './data.js';
import { store, createRecipe, addActivity } from './store.js';
import { h, $, $$, esc, icon, openSheet, toast, haptic, fmtQty } from './ui.js';
import { applyTheme, logout } from './main.js';

/* ---------- parsing helpers for the create form ---------- */
const FRAC = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3 };
function parseIngredient(line) {
  const m = line.trim().match(/^(\d+(?:[.,]\d+)?(?:\s*[½¼¾⅓⅔])?|[½¼¾⅓⅔])\s+(.+)$/);
  if (!m) return { q: null, u: '', n: line.trim() };
  let qs = m[1].replace(',', '.'), q = 0;
  for (const [ch, v] of Object.entries(FRAC)) if (qs.includes(ch)) { q += v; qs = qs.replace(ch, ''); }
  q += parseFloat(qs) || 0;
  const rest = m[2].trim();
  const unit = rest.match(/^(כוסות|כוס|כפות|כף|כפיות|כפית|גרם|ק״ג|קילו|מ״ל|ליטר|שיני|צרור|פחית|גביע|חבילה|יחידות)\s+(.+)$/);
  return unit ? { q, u: unit[1], n: unit[2] } : { q, u: '', n: rest };
}
function parseStep(line) {
  const m = line.match(/(\d+)\s*(?:דקות|דק׳|דק'|דק)/);
  return { t: line.trim(), m: m ? Math.min(240, +m[1]) : 0 };
}

/* ================= CREATE ================= */
export function openCreate() {
  let emoji = '🍲', cat = 'soups', level = 'קל';
  const body = h(`<form novalidate>
    <div class="field"><span>אייקון למנה</span></div>
    <div class="emoji-pick" role="group" aria-label="בחירת אייקון">${EMOJIS.map(e => `<button type="button" data-emoji="${e}" aria-pressed="${e === emoji}">${e}</button>`).join('')}</div>
    <label class="field" id="f-title"><span>שם המתכון</span><input class="input" id="c-title" maxlength="60" placeholder="למשל: פשטידת ירקות" autocomplete="off">
      <div class="err-msg"><span>תנו למתכון שם (לפחות 2 תווים)</span></div></label>
    <div class="two">
      <label class="field"><span>זמן הכנה (דקות)</span><input class="input" id="c-time" type="number" inputmode="numeric" min="1" max="600" value="30"></label>
      <label class="field"><span>מנות</span><input class="input" id="c-serv" type="number" inputmode="numeric" min="1" max="40" value="4"></label>
    </div>
    <div class="field"><span>קטגוריה</span></div>
    <div class="chips" role="group" aria-label="קטגוריה" style="margin-bottom:16px">${CATEGORIES.map(c => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${c.id === cat}">${c.emoji} ${c.label}</button>`).join('')}</div>
    <div class="field"><span>רמת קושי</span></div>
    <div class="segmented" role="group" aria-label="רמת קושי" style="margin-bottom:16px">${['קל', 'בינוני', 'מאתגר'].map(l => `<button type="button" class="chip" data-level="${l}" aria-pressed="${l === level}">${l}</button>`).join('')}</div>
    <label class="field" id="f-ing"><span>מצרכים – שורה לכל מצרך</span><textarea class="textarea" id="c-ing" placeholder="2 כוסות קמח&#10;3 ביצים&#10;מלח ופלפל"></textarea>
      <div class="err-msg"><span>הוסיפו לפחות מצרך אחד</span></div><p class="hint">מספר בתחילת השורה הופך לכמות, כך שאפשר לשנות את מספר המנות.</p></label>
    <label class="field" id="f-steps"><span>שלבי הכנה – שורה לכל שלב</span><textarea class="textarea" id="c-steps" placeholder="מחממים תנור ל־180 מעלות&#10;אופים 25 דקות"></textarea>
      <div class="err-msg"><span>הוסיפו לפחות שלב אחד</span></div><p class="hint">שלב שמופיע בו זמן ("25 דקות") יקבל טיימר במצב בישול.</p></label>
    <button class="btn btn-primary btn-block" type="submit" style="margin-top:6px">פרסום המתכון</button>
  </form>`);
  const sheet = openSheet({ title: 'מתכון חדש', body, action: 'פרסום', cancel: 'ביטול', tall: true, onAction: () => submit() });
  body.addEventListener('click', e => {
    const em = e.target.closest('[data-emoji]'); if (em) { emoji = em.dataset.emoji; $$('[data-emoji]', body).forEach(b => b.setAttribute('aria-pressed', b === em)); haptic(6); }
    const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; $$('[data-cat]', body).forEach(b => b.setAttribute('aria-pressed', b === c)); }
    const l = e.target.closest('[data-level]'); if (l) { level = l.dataset.level; $$('[data-level]', body).forEach(b => b.setAttribute('aria-pressed', b === l)); }
  });
  body.addEventListener('submit', e => { e.preventDefault(); submit(); });
  body.addEventListener('input', e => e.target.closest('.field')?.classList.remove('err'));
  function submit() {
    const title = $('#c-title', body).value.trim();
    const ings = $('#c-ing', body).value.split('\n').map(s => s.trim()).filter(Boolean);
    const steps = $('#c-steps', body).value.split('\n').map(s => s.trim()).filter(Boolean);
    const errs = [['#f-title', title.length < 2], ['#f-ing', !ings.length], ['#f-steps', !steps.length]];
    errs.forEach(([sel, bad]) => $(sel, body).classList.toggle('err', bad));
    const firstBad = errs.find(([, bad]) => bad);
    if (firstBad) { const f = $(firstBad[0], body); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); haptic([20, 40, 20]); f.querySelector('input,textarea').focus(); return; }
    const recipe = createRecipe({
      title, emoji, cat, level, color: COLORS[Math.floor(Math.random() * COLORS.length)],
      time: Math.max(1, +$('#c-time', body).value || 30), servings: Math.max(1, +$('#c-serv', body).value || 4),
      ingredients: ings.map(parseIngredient), steps: steps.map(parseStep),
    });
    haptic([10, 40, 10]); toast('המתכון פורסם! 🎉');
    sheet.close();
    setTimeout(() => { location.hash = '#/recipe/' + recipe.id; }, 250);
  }
}

/* ================= SETTINGS ================= */
export function openSettings() {
  const s = store.get(), dark = document.documentElement.dataset.theme === 'dark';
  const body = h(`<div>
    <div class="group">
      <button class="srow" data-name>${icon('user')}פרטים אישיים<span class="v">${esc(s.user?.name || '')} ${icon('chev')}</span></button>
      <button class="srow" data-shop>${icon('cart')}רשימת קניות<span class="v">${s.shopping.filter(x => !x.done).length} ${icon('chev')}</span></button>
    </div>
    <div class="group">
      <button class="srow" role="switch" aria-checked="${s.settings.notif}" data-notif>${icon('bell')}התראות<span class="switch"></span></button>
      <button class="srow" role="switch" aria-checked="${dark}" data-dark>${icon('moon')}מצב כהה<span class="switch"></span></button>
      <div class="srow">${icon('globe')}שפה<span class="v">עברית</span></div>
    </div>
    <div class="group">
      <button class="srow" data-logout>${icon('out')}${s.user?.guest ? 'יציאה ממצב אורח' : 'התנתקות'}</button>
      <button class="srow danger" data-reset>${icon('trash')}<span>איפוס כל הנתונים במכשיר</span></button>
    </div>
    <p class="about">שף בכיס · גרסה 1.0 · הנתונים נשמרים במכשיר הזה בלבד</p>
  </div>`);
  const sheet = openSheet({ title: 'הגדרות', body, action: 'סיום', onAction: sh => sh.close() });
  let resetArmed = false;
  body.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-name]')) return openEditName();
    if (t.closest('[data-shop]')) return openShopping();
    const sw = t.closest('[role="switch"]');
    if (sw) {
      const on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', on); haptic(8);
      if (sw.hasAttribute('data-dark')) { store.update(st => { st.settings.dark = on; }); applyTheme(); }
      if (sw.hasAttribute('data-notif')) store.update(st => { st.settings.notif = on; });
      return;
    }
    if (t.closest('[data-logout]')) { sheet.close(); return setTimeout(logout, 300); }
    const rs = t.closest('[data-reset]');
    if (rs) {
      if (!resetArmed) { resetArmed = true; rs.querySelector('span').textContent = 'לחצו שוב כדי למחוק מתכונים, שמורים ורשימה'; setTimeout(() => { resetArmed = false; rs.querySelector('span').textContent = 'איפוס כל הנתונים במכשיר'; }, 3500); return; }
      store.reset(); applyTheme(); sheet.close(); toast('הנתונים אופסו'); location.hash = '#/home';
    }
  });
}

/* ================= SHOPPING LIST ================= */
export function openShopping() {
  const body = h(`<div>
    <form class="add-row"><input class="input" id="shop-add" placeholder="הוספת פריט, למשל: 1 ליטר חלב" autocomplete="off" aria-label="פריט חדש">
      <button class="btn btn-primary" type="submit" aria-label="הוספה">${icon('plus')}</button></form>
    <div class="group shop-list"></div>
    <button class="btn btn-ghost btn-block" data-clear hidden>מחיקת הפריטים שסומנו</button>
  </div>`);
  openSheet({ title: 'רשימת קניות', body, tall: true });
  const render = () => {
    const items = store.get().shopping;
    const list = $('.shop-list', body);
    list.hidden = !items.length;
    list.innerHTML = [...items.filter(i => !i.done), ...items.filter(i => i.done)].map(it => `<div class="shop">
      <button class="ing" role="checkbox" aria-checked="${it.done}" data-toggle="${it.id}" style="flex:1">
        <span class="ck">${icon('check')}</span><span class="nm">${esc(it.n)}${it.from ? `<small>${esc(it.from)}</small>` : ''}</span>
        <span class="q">${it.q != null ? fmtQty(it.q) + (it.u ? ' ' + esc(it.u) : '') : ''}</span></button>
      <button class="del" data-del="${it.id}" aria-label="מחיקה">${icon('x')}</button></div>`).join('');
    $('[data-clear]', body).hidden = !items.some(i => i.done);
    if (!items.length && !$('.empty', body)) list.insertAdjacentHTML('afterend', `<div class="empty"><b>הרשימה ריקה</b><span>לחצו על + בכרטיס מתכון כדי להוסיף את כל המצרכים שלו</span></div>`);
    if (items.length) $('.empty', body)?.remove();
  };
  render();
  $('form', body).addEventListener('submit', e => {
    e.preventDefault(); const inp = $('#shop-add', body), v = inp.value.trim(); if (!v) return;
    const m = v.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
    store.update(s => s.shopping.unshift({ id: 's' + Date.now(), n: m ? m[2] : v, q: m ? parseFloat(m[1].replace(',', '.')) : null, u: '', done: false, from: '' }));
    inp.value = ''; haptic(6); render();
  });
  body.addEventListener('click', e => {
    const tg = e.target.closest('[data-toggle]');
    if (tg) { store.update(s => { const it = s.shopping.find(x => x.id === tg.dataset.toggle); it.done = !it.done; }); haptic(6); return render(); }
    const d = e.target.closest('[data-del]');
    if (d) { store.update(s => { s.shopping = s.shopping.filter(x => x.id !== d.dataset.del); }); return render(); }
    if (e.target.closest('[data-clear]')) { store.update(s => { s.shopping = s.shopping.filter(x => !x.done); }); toast('הפריטים שסומנו נמחקו'); render(); }
  });
}

/* ================= EDIT NAME ================= */
export function openEditName() {
  const u = store.get().user || {};
  const body = h(`<form novalidate><label class="field" id="f-name"><span>השם שיופיע במתכונים שלכם</span>
    <input class="input" id="e-name" maxlength="30" value="${esc(u.name || '')}" autocomplete="name"><div class="err-msg"><span>השם צריך להכיל לפחות 2 תווים</span></div></label>
    <button class="btn btn-primary btn-block" type="submit">שמירה</button></form>`);
  const sheet = openSheet({ title: 'פרטים אישיים', body, cancel: 'ביטול' });
  setTimeout(() => $('#e-name', body).focus(), 350);
  body.addEventListener('submit', e => {
    e.preventDefault(); const v = $('#e-name', body).value.trim();
    if (v.length < 2) { const f = $('#f-name', body); f.classList.add('err'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); return; }
    store.update(s => { s.user = { ...(s.user || {}), name: v }; s.mine.forEach(r => { r.author = v; }); });
    addActivity('✏️', `השם עודכן ל־${v}`);
    toast('נשמר'); sheet.close();
  });
}
