export const $ = sel => document.querySelector(sel);

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const roundTo = (v, step) => Math.round(v / step) * step;

// 12 -> "12", 12.5 -> "12.5", 12.04 -> "12"
export const fmtNum = (v, digits = 1) => String(Number(Number(v).toFixed(digits)));

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(k, n) {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

export function prettyDate(k, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return parseKey(k).toLocaleDateString(undefined, opts);
}
