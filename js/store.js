// Local, per-device state (localStorage). No server: account, recipes and lists live on this device.
import { RECIPES } from './data.js';

const KEY = 'shefbakis:v1';
const now = () => Date.now();

const seedActivity = () => [
  { id: 'a1', em: '❤️', text: 'מיכל ש. שמרה את "עוגת תפוזים"', at: now() - 1000 * 60 * 42, read: false },
  { id: 'a2', em: '👩‍🍳', text: 'נועה ל. פרסמה מתכון חדש: "מרק עדשים כתומות"', at: now() - 1000 * 60 * 60 * 5, read: false },
  { id: 'a3', em: '🔥', text: '"שניצל אפוי בתנור" במקום הראשון השבוע', at: now() - 1000 * 60 * 60 * 26, read: true },
];

const defaults = () => ({
  user: null,               // { name, email, guest }
  mine: [],                 // recipes the user created
  favs: ['shakshuka'],      // saved recipe ids
  shopping: [],             // { id, n, q, u, done, from }
  settings: { dark: null, notif: true }, // dark: null = follow system
  activity: seedActivity(),
});

let state = load();
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch { return defaults(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked: keep working in memory */ }
}

export const store = {
  get: () => state,
  update(fn) { fn(state); save(); subs.forEach(f => f(state)); },
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  reset() { const keepUser = state.user; state = defaults(); state.user = keepUser; save(); subs.forEach(f => f(state)); },
};

export const allRecipes = () => [...state.mine, ...RECIPES];
export const getRecipe = id => allRecipes().find(r => r.id === id);
export const isMine = id => state.mine.some(r => r.id === id);
export const isFav = id => state.favs.includes(id);

export function toggleFav(id) {
  let on;
  store.update(s => {
    on = !s.favs.includes(id);
    s.favs = on ? [id, ...s.favs] : s.favs.filter(x => x !== id);
  });
  return on;
}

export function addActivity(em, text) {
  store.update(s => { s.activity = [{ id: 'a' + now(), em, text, at: now(), read: false }, ...s.activity].slice(0, 50); });
}

export function addToShopping(recipe, factor = 1) {
  let added = 0;
  store.update(s => {
    for (const ing of recipe.ingredients) {
      const existing = s.shopping.find(x => x.n === ing.n && x.u === ing.u && !x.done);
      const q = ing.q == null ? null : ing.q * factor;
      if (existing) { if (existing.q != null && q != null) existing.q += q; }
      else { s.shopping.push({ id: 's' + now() + Math.random().toString(36).slice(2, 6), n: ing.n, q, u: ing.u, done: false, from: recipe.title }); added++; }
    }
  });
  return added;
}

export function createRecipe(r) {
  const id = 'my-' + now().toString(36);
  const recipe = { ...r, id, author: state.user?.name || 'אני', likes: 0, mine: true };
  store.update(s => { s.mine = [recipe, ...s.mine]; });
  addActivity('🎉', `פרסמת מתכון חדש: "${recipe.title}"`);
  return recipe;
}

export function deleteRecipe(id) {
  store.update(s => { s.mine = s.mine.filter(r => r.id !== id); s.favs = s.favs.filter(x => x !== id); });
}

export const unreadCount = () => state.activity.filter(a => !a.read).length;
