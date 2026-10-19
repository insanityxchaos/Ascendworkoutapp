/* Game state and rules: XP, gold, levels, quests, penalties, attributes, achievements, shop. No UI here. */

import { dateKey, addDays, parseKey } from './util.js';
import {
  RANKS, PATTERN_STAT, SHOP, THEMES, TITLES, SIDE_QUESTS, DAILY_QUEST, WORKOUT_LIBRARY, WORKOUT_REWARDS, RANK_ORDER, TEMPLATES,
} from './data.js';
import * as C from './calc.js';
import * as P from './plan.js';

export const STORE_KEY = 'ascend.v2';
export const APP_VERSION = '3.2'; // bump with each update so players see "What's New"
const BACKUP_EVERY_DAYS = 7;
export const STAT_POINTS_PER_LEVEL = 3;
export const EXTRA_DAILY_CAP = 100;   // max XP per day from extra activities
export const DAILY_BONUS = 5;         // gold for opening the app each day
export const CHEST_GOAL = 5;          // quests cleared in a week to open the weekly chest
export const CHEST_GOLD = 60;
const MAX_PENALTY_DAYS = 7;           // penalties stop stacking after a week away
const STAT_XP_PER_POINT = 20;         // attribute XP needed for +1 to an attribute

export const G = { state: null, photos: [] };

/*
 * Things the UI should show after an action (quest complete, level up, achievements...).
 * The UI drains this list with takeNotices() and turns each one into a screen.
 */
const notices = [];
const notify = n => notices.push(n);
export const takeNotices = () => notices.splice(0);

/* ================= State ================= */

export function newState(profile) {
  const today = dateKey();
  return {
    version: 3,
    ...profile,
    created: today,
    level: 1,
    xp: 0,            // progress inside the current level
    totalXp: 0,
    statPoints: 0,
    stats: { str: 10, end: 10, agi: 10, vit: 10, int: 10 },
    statXp: {},       // attribute -> progress toward the next automatic +1
    statLog: [],      // { date, key } for each automatic attribute gain
    gold: 0,
    goldTotal: 0,
    bestStreak: 0,
    lastChecked: today, // days before this have been checked for penalties
    quests: {},       // dateKey -> workout or recovery quest
    logs: [],         // extra activities
    xpByDay: {},      // dateKey -> net XP
    penalties: [],
    shields: 0,
    shielded: {},     // dateKey -> true when a Streak Shield covered a missed day
    boostDate: null,
    unlocked: {},     // achievementId -> dateKey
    owned: { themes: ['blue'], titles: [] },
    theme: 'blue',
    title: null,
    sound: true,
    purchases: 0,
    dailyClaim: null,
    chestWeek: null,
    intDay: {},       // once-a-day Intelligence gains for tracking your body
    lifts: {},        // exerciseId -> { w, last, hi, t } progression memory
    bwLevel: {},      // pattern -> bodyweight progression level
    swaps: {},        // slotKey -> exerciseId chosen by the user
    tests: {},        // 'pushup' | 'pullup' -> { reps, date }
    weights: [{ date: today, kg: profile.weightKg }],
    measures: [],     // { date, waist, neck, hips } in cm
    sessions: {},     // dateKey -> finished workouts (library or My Program)
    active: null,     // the workout in progress
    side: {},         // dateKey -> bonus side quests
    sideDone: 0,
    lastBackup: null, // dateKey of the last export
    backupSnooze: null,
    seenVersion: APP_VERSION,
    avatar: profile.avatar || defaultAvatar(profile.sex),
  };
}

export function defaultAvatar(sex) {
  return { hair: sex === 'female' ? 'long' : 'spiky', hairColor: '#14151f', eyes: '#2d6bff', skin: '#f2c9a5' };
}

export function isValidState(s) {
  return !!s && typeof s === 'object' && typeof s.name === 'string' && typeof s.level === 'number'
    && typeof s.heightCm === 'number' && typeof s.weightKg === 'number' && Array.isArray(s.trainingDays)
    && !!s.equipment && typeof s.quests === 'object' && Array.isArray(s.logs);
}

export function migrate(s) {
  const base = newState(s);
  const m = { ...base, ...s, stats: { ...base.stats, ...s.stats }, owned: { ...base.owned, ...(s.owned || {}) } };
  if (m.stats.per != null) { // v2 had Perception instead of Intelligence
    m.stats.int = Math.max(m.stats.int, m.stats.per);
    delete m.stats.per;
  }
  m.version = 3;
  return m;
}

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    G.state = isValidState(s) ? migrate(s) : null;
  } catch {
    G.state = null;
  }
  return G.state;
}

export function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(G.state));
  } catch {
    notify({ type: 'toast', text: 'Could not save progress' });
  }
}

/* ---------- Backups & updates ---------- */

export const needsWhatsNew = () => G.state.seenVersion !== APP_VERSION;

export function markSeenVersion() {
  G.state.seenVersion = APP_VERSION;
  save();
}

export function backupDue() {
  const s = G.state;
  const today = dateKey();
  if (s.backupSnooze && today < s.backupSnooze) return false;
  const since = s.lastBackup || s.created;
  return addDays(since, BACKUP_EVERY_DAYS) <= today;
}

export function markBackup() {
  G.state.lastBackup = dateKey();
  G.state.backupSnooze = null;
  save();
}

export function snoozeBackup(days = 3) {
  G.state.backupSnooze = addDays(dateKey(), days);
  save();
}

export function start(profile) {
  G.state = newState(profile);
  save();
}

/* ================= XP, gold, levels ================= */

export const xpNeeded = level => 100 + (level - 1) * 40;
export const rankFor = level => RANKS.find(r => level >= r.min);
export const nextRank = level => [...RANKS].reverse().find(r => r.min > level) || null;
export const boostActive = () => G.state.boostDate === dateKey();

export function titleFor(s = G.state) {
  const t = s.title && TITLES.find(x => x.id === s.title);
  return t ? t.name : rankFor(s.level).title;
}

export function grantXp(amount, day = dateKey(), boostable = true) {
  const s = G.state;
  const amt = Math.round(amount * (boostable && boostActive() ? 1.5 : 1));
  const before = s.level;
  s.xp += amt;
  s.totalXp += amt;
  s.xpByDay[day] = (s.xpByDay[day] || 0) + amt;
  while (s.xp >= xpNeeded(s.level)) {
    s.xp -= xpNeeded(s.level);
    s.level++;
    s.statPoints += STAT_POINTS_PER_LEVEL;
  }
  if (s.level > before) {
    notify({ type: 'level', from: before, to: s.level });
    if (rankFor(before).rank !== rankFor(s.level).rank) notify({ type: 'rank', rank: rankFor(s.level) });
  }
  return amt;
}

// XP loss never drops you a level, only empties the current bar.
export function loseXp(amount, day) {
  const s = G.state;
  const lost = Math.min(amount, s.xp);
  s.xp -= lost;
  s.totalXp -= lost;
  s.xpByDay[day] = (s.xpByDay[day] || 0) - lost;
  return lost;
}

export function grantGold(n) {
  G.state.gold += n;
  G.state.goldTotal = (G.state.goldTotal || 0) + n;
  return n;
}

/* ================= Attributes ================= */

function trainStat(key, points, day = dateKey()) {
  const s = G.state;
  s.statXp[key] = (s.statXp[key] || 0) + points;
  let gained = 0;
  while (s.statXp[key] >= STAT_XP_PER_POINT) {
    s.statXp[key] -= STAT_XP_PER_POINT;
    s.stats[key]++;
    gained++;
    s.statLog.push({ date: day, key });
  }
  if (s.statLog.length > 300) s.statLog.splice(0, s.statLog.length - 300);
  return gained;
}

// Tracking your body (weigh-ins, measurements, photos, max tests) trains Intelligence, once per type per day.
export function trainIntelligence(kind) {
  const s = G.state;
  const today = dateKey();
  if (s.intDay[kind] === today) return 0;
  s.intDay[kind] = today;
  return trainStat('int', 5, today);
}

export function recentStatGains(days = 7) {
  const from = addDays(dateKey(), -(days - 1));
  const out = {};
  for (const g of G.state.statLog) if (g.date >= from) out[g.key] = (out[g.key] || 0) + 1;
  return out;
}

export const statProgress = key => (G.state.statXp[key] || 0) / STAT_XP_PER_POINT;

export function addStat(key) {
  const s = G.state;
  if (s.statPoints <= 0 || !(key in s.stats)) return false;
  s.stats[key]++;
  s.statPoints--;
  save();
  return true;
}

/* ================= Quests ================= */

export const isCleared = k => !!(G.state.quests[k] && G.state.quests[k].complete);
export const questGold = q => q.gold ?? (q.type === 'workout' ? P.workoutGold(G.state.level) : P.recoveryGold(G.state.level));

export function computeStreak() {
  const s = G.state;
  let k = dateKey();
  let n = 0;
  if (!isCleared(k)) k = addDays(k, -1); // today isn't over yet
  while (k >= s.created) {
    if (isCleared(k)) n++;
    else if (!s.shielded[k]) break;
    k = addDays(k, -1);
  }
  return n;
}

/* ---------- The Daily Quest ---------- */

const round1 = v => Math.round(v * 10) / 10;

// Targets grow from your starting level toward the legendary 100 / 100 / 100 / 10 km at S-Rank (level 70).
export function dailyTarget(d, level, experience) {
  const base = d.base[experience] ?? d.base.new;
  const t = base + (d.max - base) * Math.pow(Math.min(1, (level - 1) / 69), 1.15);
  return d.unit === 'km' ? Math.round(t * 2) / 2 : Math.round(t);
}

function buildDaily(s) {
  const reward = P.workoutReward(s.level);
  const gold = P.workoutGold(s.level);
  const xpEach = Math.round((reward * 0.6) / DAILY_QUEST.length);
  const goldEach = Math.max(1, Math.floor((gold * 0.5) / DAILY_QUEST.length));
  return {
    type: 'daily',
    items: DAILY_QUEST.map(d => ({ id: d.id, target: dailyTarget(d, s.level, s.experience), progress: 0, xp: xpEach, gold: goldEach, cleared: false })),
    reward, gold,
    bonusXp: reward - xpEach * DAILY_QUEST.length,
    bonusGold: Math.max(0, gold - goldEach * DAILY_QUEST.length),
    complete: false,
  };
}

// The quest is generated once per day, so mid-day level-ups don't move the goalposts.
export function todayQuest() {
  const s = G.state;
  const k = dateKey();
  const q = s.quests[k];
  if (!q || (q.type !== 'daily' && !q.complete)) { // older saves used plan-based quests
    s.quests[k] = buildDaily(s);
    save();
  }
  return s.quests[k];
}

export const dailyDef = id => DAILY_QUEST.find(d => d.id === id);
export const isLight = q => q.type === 'recovery' || !!q.light;
export function miniCleared(q) {
  if (q.type === 'daily') return q.items.filter(i => i.cleared).length;
  if (q.type === 'workout') return q.exercises.filter(e => e.done.every(Boolean)).length;
  return 0;
}
const miniTotal = q => (q.type === 'daily' ? q.items.length : q.type === 'workout' ? q.exercises.length : 1);

// Fraction of today's quest done (0–1), counting partial reps.
export function questFraction(q) {
  if (q.type === 'daily') return q.items.reduce((sum, i) => sum + Math.min(1, i.progress / i.target), 0) / q.items.length;
  return q.complete ? 1 : 0;
}

export const rebuildTodayQuest = () => {}; // the Daily Quest no longer depends on the plan

export const questProgress = q => ({ done: miniCleared(q), total: miniTotal(q) });

function finishQuestIfDone(q, k) {
  if (q.complete || miniCleared(q) < miniTotal(q)) return;
  const s = G.state;
  q.complete = true;
  q.completedAt = Date.now();
  const gains = {};
  for (const item of q.items) {
    const key = dailyDef(item.id).stat;
    const n = trainStat(key, 5, k);
    if (n) gains[key] = (gains[key] || 0) + n;
  }
  // Each task already paid its share; this is the clear bonus.
  const xp = Math.round(q.bonusXp * (boostActive() ? 1.5 : 1));
  const gold = grantGold(q.bonusGold);
  q.xpEarned = (q.xpEarned || 0) + xp;
  q.goldEarned = (q.goldEarned || 0) + gold;
  const streak = computeStreak();
  s.bestStreak = Math.max(s.bestStreak, streak);
  const bonus = streak > 0 && streak % 7 === 0 ? 1 : 0;
  s.statPoints += bonus;
  notify({ type: 'quest', q, xp, gold, totalXp: q.xpEarned, totalGold: q.goldEarned, streak, bonus, notes: [], gains });
  grantXp(xp, k, false);
  checkAchievements();
}

function setDailyProgress(i, value) {
  const k = dateKey();
  const q = todayQuest();
  const item = q.items[i];
  if (!item || q.complete || item.cleared) return;
  item.progress = Math.max(0, round1(value));
  if (item.progress >= item.target) {
    item.progress = item.target;
    item.cleared = true;
    const xp = grantXp(item.xp, k);
    const gold = grantGold(item.gold);
    q.xpEarned = (q.xpEarned || 0) + xp;
    q.goldEarned = (q.goldEarned || 0) + gold;
    if (miniCleared(q) < q.items.length) notify({ type: 'mini', id: item.id, xp, gold, n: miniCleared(q), total: q.items.length });
    finishQuestIfDone(q, k);
  }
  save();
}

export function dailyStep(i, amount) {
  const item = todayQuest().items[i];
  if (item) setDailyProgress(i, item.progress + amount);
}

export function dailyFinish(i) {
  const item = todayQuest().items[i];
  if (item) setDailyProgress(i, item.target);
}

/* ---------- Workout sessions (library workouts and My Program) ---------- */

export const activeSession = () => G.state.active || null;
export const sessionsOn = k => G.state.sessions[k] || [];
export const paidToday = (kind, id) => sessionsOn(dateKey()).some(x => x.kind === kind && x.id === id && x.paid);

export function workoutLocked(w) {
  const mine = RANK_ORDER.indexOf(rankFor(G.state.level).rank);
  return RANK_ORDER.indexOf(w.rank) > mine + 1; // you can always try one rank above your own
}

export function programToday() {
  const s = G.state;
  const p = P.buildProgramSession(s, dateKey());
  const reward = p.light ? P.recoveryReward(s.level) : P.workoutReward(s.level);
  const gold = p.light ? P.recoveryGold(s.level) : P.workoutGold(s.level);
  return { ...p, name: p.light ? 'Active Recovery' : TEMPLATES[p.template].name, reward, gold };
}

export function startSession(kind, id) {
  const s = G.state;
  let sess;
  if (kind === 'program') {
    const p = programToday();
    sess = { kind, id: p.template, name: p.name, rank: null, light: p.light, exercises: p.exercises, reward: p.reward, gold: p.gold };
  } else {
    const w = WORKOUT_LIBRARY.find(x => x.id === id);
    if (!w || workoutLocked(w)) return null;
    const [reward, gold] = WORKOUT_REWARDS[w.rank];
    sess = {
      kind: 'library', id, name: w.name, rank: w.rank, reward, gold,
      exercises: w.exercises.map(([exId, sets, target], i) => P.fixedEntry(P.exById(exId), `lib:${id}:${i}`, sets, target)),
    };
  }
  sess.date = dateKey();
  sess.startedAt = Date.now();
  s.active = sess;
  save();
  return sess;
}

export function abandonSession() {
  G.state.active = null;
  save();
}

export const sessionStarted = sess => sess.exercises.some(e => e.done.some(Boolean));

function finishSessionIfDone(sess) {
  if (sess.exercises.some(e => e.done.some(d => !d))) return;
  const s = G.state;
  const k = dateKey();
  const paid = !paidToday(sess.kind, sess.id);
  const notes = sess.kind === 'program' ? P.applyProgression(s, sess) : [];
  const gains = {};
  for (const e of sess.exercises) {
    const key = PATTERN_STAT[e.pattern] || 'str';
    const n = trainStat(key, e.done.length, k);
    if (n) gains[key] = (gains[key] || 0) + n;
  }
  const xp = paid ? grantXp(sess.reward, k) : 0;
  const gold = paid ? grantGold(sess.gold) : 0;
  s.sessions[k] = s.sessions[k] || [];
  s.sessions[k].push({ kind: sess.kind, id: sess.id, name: sess.name, rank: sess.rank, light: !!sess.light, exercises: sess.exercises, xp, gold, paid, completedAt: Date.now() });
  s.active = null;
  notify({ type: 'session', name: sess.name, rank: sess.rank, xp, gold, paid, notes, gains });
  checkAchievements();
}

function openEntry(i) {
  const sess = activeSession();
  return sess ? sess.exercises[i] : null;
}

// Logs the next set of exercise i with the current reps/weight. Returns the set index, or -1.
export function completeSet(i, reps) {
  const e = openEntry(i);
  if (!e) return -1;
  const j = e.done.findIndex(d => !d);
  if (j < 0) return -1;
  e.done[j] = { r: reps ?? e.cur, w: e.w };
  finishSessionIfDone(activeSession());
  save();
  return j;
}

export function adjustCurrent(i, dir) {
  const e = openEntry(i);
  if (!e) return;
  const step = P.exById(e.id).kind === 'time' ? (e.hi >= 120 ? 60 : 5) : 1;
  e.cur = Math.max(0, Math.min(3600, e.cur + dir * step));
  save();
}

export function adjustWeight(i, dir) {
  const e = openEntry(i);
  if (!e) return;
  const s = G.state;
  const ex = P.exById(e.id);
  e.w = C.fromDispW(s, Math.max(0, C.toDispW(s, e.w) + dir * C.loadStep(s, ex)));
  save();
}

export function swapExercise(i, id) {
  const sess = activeSession();
  const old = sess && sess.exercises[i];
  if (!old || old.done.some(Boolean)) return false;
  const ex = P.exById(id);
  if (sess.kind === 'program') {
    G.state.swaps[old.slotKey] = id;
    sess.exercises[i] = P.makeEntry(G.state, ex, old.slotKey, old.main);
  } else {
    const target = ex.kind === 'time' ? (P.exById(old.id).kind === 'time' ? old.hi : 30) : (P.exById(old.id).kind === 'time' ? 10 : old.hi);
    sess.exercises[i] = P.fixedEntry(ex, old.slotKey, old.sets, target);
  }
  save();
  return true;
}

// Every finished workout: library/program sessions plus workouts from older saves.
export function allSessions() {
  const s = G.state;
  const out = [];
  for (const [k, list] of Object.entries(s.sessions)) for (const x of list) out.push({ ...x, date: k });
  for (const [k, q] of Object.entries(s.quests)) {
    if (q.type === 'workout' && q.complete) {
      out.push({ kind: 'program', id: q.template, name: TEMPLATES[q.template].name, rank: null, light: !!q.light, exercises: q.exercises, xp: q.xpEarned ?? q.reward, gold: q.goldEarned ?? 0, paid: true, completedAt: q.completedAt, date: k });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.completedAt || 0) - (b.completedAt || 0));
}

export function processMissedDays() {
  const s = G.state;
  const today = dateKey();
  const yesterday = addDays(today, -1);
  const missed = [];
  for (let k = s.lastChecked; k <= yesterday; k = addDays(k, 1)) {
    if (k >= s.created && !isCleared(k) && !s.shielded[k]) missed.push(k);
  }
  s.lastChecked = today;
  if (missed.length) {
    let total = 0;
    let shieldedN = 0;
    for (const k of missed.slice(-MAX_PENALTY_DAYS)) {
      if (s.shields > 0) {
        s.shields--;
        s.shielded[k] = true;
        shieldedN++;
        continue;
      }
      const q = s.quests[k] || buildDaily(s);
      // Partial credit: the penalty shrinks with every Daily Quest task you did clear.
      const share = 1 - miniCleared(q) / miniTotal(q);
      const lost = loseXp(Math.round(q.reward * 0.5 * share), k);
      total += lost;
      if (lost) s.penalties.push({ date: k, xp: lost });
    }
    notify({ type: 'penalty', missed: missed.length, failed: missed.length - shieldedN, shieldedN, total, first: missed[0] });
  }
  save();
}

/* ================= History helpers ================= */

export function liftHistory() {
  const h = {};
  for (const sess of allSessions()) {
    for (const e of sess.exercises) {
      for (const d of e.done) {
        if (!d) continue;
        const rec = (h[e.id] = h[e.id] || { e1rm: 0, reps: 0 });
        if (d.w) rec.e1rm = Math.max(rec.e1rm, C.oneRepMax(d.w, d.r));
        rec.reps = Math.max(rec.reps, d.r);
      }
    }
  }
  return h;
}

export function lastPerformance(id) {
  const list = allSessions();
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i].exercises.find(x => x.id === id && x.done.some(Boolean));
    if (e) return { date: list[i].date, sets: e.done.filter(Boolean) };
  }
  return null;
}

// XP and workouts for the last `days` days vs the period before it.
export function periodStats(days) {
  const s = G.state;
  const today = dateKey();
  const sum = (from, to) => {
    let xp = 0;
    let workouts = 0;
    for (let k = from; k <= to; k = addDays(k, 1)) {
      xp += Math.max(0, s.xpByDay[k] || 0);
      const q = s.quests[k];
      if (q && q.complete && q.type === 'workout' && !isLight(q)) workouts++;
      workouts += sessionsOn(k).length;
    }
    return { xp, workouts };
  };
  return {
    cur: sum(addDays(today, -(days - 1)), today),
    prev: sum(addDays(today, -(2 * days - 1)), addDays(today, -days)),
  };
}

/* ================= Extra activities, body tracking ================= */

export const extraXpToday = () => G.state.logs.filter(l => l.date === dateKey()).reduce((sum, l) => sum + l.xp, 0);

export function logExtra(name, type, minutes) {
  const s = G.state;
  const k = dateKey();
  const base = Math.max(0, Math.min(Math.round(minutes), 60, EXTRA_DAILY_CAP - extraXpToday()));
  const xp = base ? grantXp(base, k) : 0;
  s.logs.push({ id: Date.now().toString(36), date: k, ts: Date.now(), name, type, minutes, xp });
  if (type === 'cardio' || type === 'sport') trainStat('end', 2, k);
  if (type === 'mobility') trainStat('agi', 2, k);
  checkAchievements();
  save();
  return xp;
}

export function deleteExtra(id) {
  const s = G.state;
  const i = s.logs.findIndex(l => l.id === id);
  if (i < 0) return;
  const [entry] = s.logs.splice(i, 1);
  if (entry.xp) loseXp(entry.xp, entry.date);
  save();
}

export function recordWeight(kg) {
  const s = G.state;
  const k = dateKey();
  s.weights = s.weights.filter(w => w.date !== k);
  s.weights.push({ date: k, kg });
  s.weights.sort((a, b) => a.date.localeCompare(b.date));
  s.weightKg = kg;
  trainIntelligence('weight');
  checkAchievements();
  save();
}

export function recordMeasures(m) {
  const s = G.state;
  s.measures = s.measures.filter(x => x.date !== m.date);
  s.measures.push(m);
  trainIntelligence('measure');
  checkAchievements();
  save();
}

export function recordTest(key, reps) {
  G.state.tests[key] = { reps, date: dateKey() };
  trainIntelligence('test');
  save();
}

/* ================= Achievements ================= */

export const ACHIEVEMENTS = [
  { id: 'first_workout', name: 'First Step', desc: 'Clear your first Daily Quest or workout', xp: 50, gold: 20, icon: 'dumbbell', test: c => c.workouts >= 1 || c.dailies >= 1 },
  { id: 'streak_3', name: 'Momentum', desc: 'Reach a 3-day streak', xp: 80, gold: 20, icon: 'flame', test: c => c.bestStreak >= 3 },
  { id: 'streak_7', name: 'Streak Master', desc: 'Reach a 7-day streak', xp: 200, gold: 50, icon: 'flame', test: c => c.bestStreak >= 7 },
  { id: 'streak_30', name: 'Unbreakable', desc: 'Reach a 30-day streak', xp: 1000, gold: 250, icon: 'flame', test: c => c.bestStreak >= 30 },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', xp: 150, gold: 30, icon: 'star', test: c => c.level >= 5 },
  { id: 'rank_d', name: 'D-Rank', desc: 'Reach D-Rank (level 10)', xp: 300, gold: 75, icon: 'crown', test: c => c.level >= 10 },
  { id: 'rank_c', name: 'C-Rank', desc: 'Reach C-Rank (level 20)', xp: 600, gold: 150, icon: 'crown', test: c => c.level >= 20 },
  { id: 'rank_b', name: 'B-Rank', desc: 'Reach B-Rank (level 35)', xp: 1000, gold: 250, icon: 'crown', test: c => c.level >= 35 },
  { id: 'rank_a', name: 'A-Rank', desc: 'Reach A-Rank (level 50)', xp: 1500, gold: 400, icon: 'crown', test: c => c.level >= 50 },
  { id: 'rank_s', name: 'S-Rank', desc: 'Reach S-Rank (level 70)', xp: 3000, gold: 1000, icon: 'crown', test: c => c.level >= 70 },
  { id: 'workouts_10', name: 'Dedicated', desc: 'Complete 10 workouts', xp: 200, gold: 50, icon: 'dumbbell', test: c => c.workouts >= 10 },
  { id: 'workouts_50', name: 'Beast Mode', desc: 'Complete 50 workouts', xp: 1000, gold: 200, icon: 'bolt', test: c => c.workouts >= 50 },
  { id: 'workouts_100', name: 'Centurion', desc: 'Complete 100 workouts', xp: 2000, gold: 500, icon: 'trophy', test: c => c.workouts >= 100 },
  { id: 'sets_250', name: 'Grinder', desc: 'Log 250 sets', xp: 400, gold: 80, icon: 'target', test: c => c.sets >= 250 },
  { id: 'recovery_10', name: 'Disciplined', desc: 'Clear 10 Daily Quests', xp: 150, gold: 40, icon: 'quest', test: c => c.dailies >= 10 },
  { id: 'daily_100', name: 'Unstoppable', desc: 'Clear 100 Daily Quests', xp: 1500, gold: 400, icon: 'quest', test: c => c.dailies >= 100 },
  { id: 'hero_daily', name: 'The Full Hundred', desc: 'Clear the Daily Quest at 100 / 100 / 100 / 10 km', xp: 2000, gold: 500, icon: 'crown', test: c => c.fullDaily },
  { id: 's_workout', name: 'S-Rank Clear', desc: 'Finish an S-rank workout', xp: 800, gold: 200, icon: 'crown', test: c => c.sRank },
  { id: 'side_10', name: 'Side Hustle', desc: 'Complete 10 bonus quests', xp: 200, gold: 50, icon: 'target', test: c => c.sides >= 10 },
  { id: 'side_50', name: 'Overachiever', desc: 'Complete 50 bonus quests', xp: 800, gold: 200, icon: 'target', test: c => c.sides >= 50 },
  { id: 'photo', name: 'Mirror Check', desc: 'Take your first progress photo', xp: 50, gold: 15, icon: 'camera', test: c => c.photos >= 1 },
  { id: 'measure', name: 'Know Thyself', desc: 'Log your body measurements', xp: 50, gold: 15, icon: 'tape', test: c => c.measures >= 1 },
  { id: 'goal', name: 'Goal Crusher', desc: 'Reach your goal weight', xp: 1000, gold: 300, icon: 'trophy', test: c => c.goalReached },
  { id: 'extra_10', name: 'All-Rounder', desc: 'Log 10 extra activities', xp: 150, gold: 40, icon: 'bolt', test: c => c.extras >= 10 },
  { id: 'specialist', name: 'Specialist', desc: 'Raise any attribute to 30', xp: 300, gold: 60, icon: 'star', test: c => c.maxStat >= 30 },
  { id: 'shopper', name: 'First Purchase', desc: 'Buy something from the shop', xp: 30, gold: 0, icon: 'shop', test: c => c.purchases >= 1 },
  { id: 'night_owl', name: 'Night Owl', desc: 'Clear a workout after 10 PM', xp: 100, gold: 25, icon: 'moon', hidden: true, test: c => c.night },
  { id: 'early_riser', name: 'Early Riser', desc: 'Clear a workout before 7 AM', xp: 100, gold: 25, icon: 'sun', hidden: true, test: c => c.early },
];

function achievementContext() {
  const s = G.state;
  const cleared = Object.values(s.quests).filter(q => q.complete);
  const workouts = allSessions().filter(w => !w.light);
  const hours = workouts.map(w => (w.completedAt ? new Date(w.completedAt).getHours() : 12));
  const target = C.targetKg(s);
  return {
    level: s.level,
    bestStreak: Math.max(s.bestStreak, computeStreak()),
    workouts: workouts.length,
    dailies: cleared.length,
    fullDaily: cleared.some(q => q.type === 'daily' && q.items.every(i => i.target >= dailyDef(i.id).max)),
    sRank: workouts.some(w => w.rank === 'S'),
    sets: workouts.reduce((n, w) => n + w.exercises.reduce((m, e) => m + e.done.filter(Boolean).length, 0), 0),
    photos: G.photos.length,
    measures: s.measures.length,
    extras: s.logs.length,
    purchases: s.purchases || 0,
    night: hours.some(h => h >= 22),
    early: hours.some(h => h < 7),
    goalReached: !!s.targetKg && s.weights.length > 1
      && ((s.goal === 'fatloss' && s.weightKg <= target) || (s.goal === 'muscle' && s.weightKg >= target)),
    maxStat: Math.max(...Object.values(s.stats)),
    sides: s.sideDone || 0,
  };
}

export function checkAchievements() {
  const s = G.state;
  if (!s) return;
  const c = achievementContext();
  const fresh = ACHIEVEMENTS.filter(a => !s.unlocked[a.id] && a.test(c));
  if (!fresh.length) return;
  for (const a of fresh) s.unlocked[a.id] = dateKey();
  notify({ type: 'achievements', list: fresh });
  for (const a of fresh) {
    grantGold(a.gold);
    grantXp(a.xp, dateKey(), false);
  }
  checkAchievements(); // XP from these may unlock level achievements
  save();
}

/* ================= Bonus side quests ================= */

export const sideDef = id => SIDE_QUESTS.find(x => x.id === id);

function hashKey(k) {
  let h = 2166136261;
  for (const ch of k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function buildSide(s, k) {
  const pool = SIDE_QUESTS.filter(q => !q.eq || s.equipment[q.eq]);
  const h = hashKey(k);
  const first = h % pool.length;
  let second = (first + 1 + ((h >>> 8) % (pool.length - 1))) % pool.length;
  if (second === first) second = (first + 1) % pool.length;
  const mult = { new: 1, some: 1.6, experienced: 2.3 }[s.experience] * (1 + (s.level - 1) * 0.02);
  return [pool[first], pool[second]].map(d => {
    const target = Math.max(d.step, Math.min(d.cap || Infinity, Math.round((d.base * mult) / d.step) * d.step));
    return { id: d.id, target, progress: 0, done: false, xp: 25 + s.level * 2, gold: 8 };
  });
}

export function todaySide() {
  const s = G.state;
  const k = dateKey();
  s.side = s.side || {};
  if (!s.side[k]) {
    s.side[k] = buildSide(s, k);
    const cutoff = addDays(k, -14);
    for (const key of Object.keys(s.side)) if (key < cutoff) delete s.side[key];
    save();
  }
  return s.side[k];
}

export function sideStep(i, dir) {
  const q = todaySide()[i];
  if (!q || q.done) return;
  q.progress = Math.max(0, q.progress + dir * sideDef(q.id).step);
  if (q.progress >= q.target) completeSide(q);
  save();
}

export function sideFinish(i) {
  const q = todaySide()[i];
  if (!q || q.done) return;
  q.progress = q.target;
  completeSide(q);
  save();
}

function completeSide(q) {
  const s = G.state;
  q.done = true;
  const d = sideDef(q.id);
  const xp = grantXp(q.xp);
  const gold = grantGold(q.gold);
  trainStat(d.stat, 4);
  s.sideDone = (s.sideDone || 0) + 1;
  notify({ type: 'side', text: d.text.replace('{n}', q.target), xp, gold });
  checkAchievements();
}

/* ================= Shop & rewards ================= */

// Returns an error message, or null on success.
export function buy(kind, id) {
  const s = G.state;
  let price;
  let apply;
  if (kind === 'item') {
    const item = SHOP.find(x => x.id === id);
    if (!item) return 'Unknown item';
    if (id === 'shield' && s.shields >= 2) return 'You can hold 2 shields at most';
    if (id === 'boost' && boostActive()) return 'A boost is already active today';
    price = item.price;
    apply = () => {
      if (id === 'boost') s.boostDate = dateKey();
      if (id === 'shield') s.shields++;
      if (id === 'potion') s.statPoints++;
    };
  } else if (kind === 'theme') {
    if (!THEMES[id]) return 'Unknown theme';
    if (s.owned.themes.includes(id)) return 'Already owned';
    price = THEMES[id].price;
    apply = () => { s.owned.themes.push(id); s.theme = id; };
  } else if (kind === 'title') {
    const t = TITLES.find(x => x.id === id);
    if (!t) return 'Unknown title';
    if (s.owned.titles.includes(id)) return 'Already owned';
    price = t.price;
    apply = () => { s.owned.titles.push(id); s.title = id; };
  } else {
    return 'Unknown purchase';
  }
  if (s.gold < price) return `You need ${price - s.gold} more gold`;
  s.gold -= price;
  s.purchases = (s.purchases || 0) + 1;
  apply();
  checkAchievements();
  save();
  return null;
}

export const dailyClaimable = () => G.state.dailyClaim !== dateKey();

export function claimDaily() {
  if (!dailyClaimable()) return 0;
  G.state.dailyClaim = dateKey();
  grantGold(DAILY_BONUS);
  save();
  return DAILY_BONUS;
}

export function weekStart(k = dateKey()) {
  return addDays(k, -((parseKey(k).getDay() + 6) % 7));
}

export const weekCleared = () => {
  const ws = weekStart();
  return Object.entries(G.state.quests).filter(([k, q]) => k >= ws && q.complete).length;
};

export const chestClaimable = () => G.state.chestWeek !== weekStart() && weekCleared() >= CHEST_GOAL;

export function claimChest() {
  if (!chestClaimable()) return 0;
  G.state.chestWeek = weekStart();
  grantGold(CHEST_GOLD);
  save();
  return CHEST_GOLD;
}
