/* Builds the weekly plan and daily quests from the user's profile, and applies progressive overload. */

import { EXERCISES, TEMPLATES, SPLITS, SCHEMES, BW_RANGES, SLOTS_PER_SESSION, LOWER_BODY, STANDARDS, EXP_LEVEL, WEEK_ORDER } from './data.js';
import { parseKey } from './util.js';
import { roundLoad, fromDispW, toDispW, loadStep, proteinTarget, fmtW } from './calc.js';

const BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
export const exById = id => BY_ID[id];

export const workoutReward = level => 60 + level * 5;
export const recoveryReward = level => 30 + level * 2;
export const workoutGold = level => 10 + Math.floor(level / 2);
export const recoveryGold = level => 5 + Math.floor(level / 5);

const LOAD_PRIORITY = { barbell: 4, db: 3, kb: 2.5, machine: 2 };
const loadScore = ex => Math.max(0, ...[...ex.eq, ...(ex.any || [])].map(e => LOAD_PRIORITY[e] || 0));
const START_LEVEL = { new: 1, some: 2, experienced: 3 };
const TIME_START = { new: 20, some: 30, experienced: 40 };

function hasEquipment(ex, eq) {
  return ex.eq.every(e => eq[e]) && (!ex.any || ex.any.some(e => eq[e]));
}

export function candidates(s, pattern) {
  const avail = EXERCISES.filter(e => e.pattern === pattern && hasEquipment(e, s.equipment));
  const loads = avail.filter(e => e.kind === 'load').sort((a, b) => loadScore(b) - loadScore(a));
  const ladder = avail.filter(e => e.lvl).sort((a, b) => a.lvl - b.lvl);
  const other = avail.filter(e => e.kind !== 'load' && !e.lvl);
  return { loads, ladder, other, all: [...loads, ...ladder, ...other] };
}

// The bodyweight variation matching the user's current level for this movement.
function ladderPick(s, pattern, ladder) {
  if (!ladder.length) return null;
  const want = s.bwLevel[pattern] ?? START_LEVEL[s.experience];
  return ladder.reduce((pick, e) => (e.lvl <= want ? e : pick), ladder[0]);
}

export function pickExercise(s, pattern, variant, slotKey) {
  const c = candidates(s, pattern);
  const swapped = s.swaps[slotKey] && c.all.find(e => e.id === s.swaps[slotKey]);
  if (swapped) return swapped;
  const lad = ladderPick(s, pattern, c.ladder);
  if (pattern === 'core' || pattern === 'cond') return lad || c.loads[0] || c.other[0] || null;
  if (pattern === 'vpull') {
    if (lad && lad.lvl >= 3) return lad; // real chin-ups / pull-ups beat machines
    return c.loads[0] || (lad && lad.lvl >= 2 ? lad : c.other[0] || lad) || null;
  }
  if (c.loads.length) return c.loads[variant % c.loads.length];
  return lad || c.other[0] || null;
}

export function startWeight(s, ex, reps) {
  const [lift, ratio] = ex.ref;
  const oneRm = STANDARDS[s.sex][lift][EXP_LEVEL[s.experience]] * s.weightKg * ratio;
  const working = (oneRm / (1 + reps / 30)) * 0.9; // leaves ~2 reps in the tank
  return roundLoad(s, ex, working);
}

export function prescribe(s, ex, main) {
  const rec = s.lifts[ex.id] || {};
  let [sets, lo, hi] = main ? SCHEMES[s.goal].main : SCHEMES[s.goal].acc;
  if (s.experience === 'new') sets = Math.min(sets, 3);
  if (ex.kind === 'time') {
    const t = rec.t || (ex.pattern === 'cond' ? 30 : TIME_START[s.experience]);
    return { sets: ex.pattern === 'cond' ? 4 : 3, lo: t, hi: t, w: null, cur: t };
  }
  if (ex.kind === 'reps') {
    [lo, hi] = BW_RANGES[s.goal];
    if (rec.hi) hi = rec.hi;
    return { sets, lo, hi, w: null, cur: Math.min(hi, Math.max(lo, rec.last || lo)) };
  }
  return { sets, lo, hi, w: rec.w ?? startWeight(s, ex, lo), cur: lo };
}

export function makeEntry(s, ex, slotKey, main) {
  const p = prescribe(s, ex, main);
  return { id: ex.id, slotKey, pattern: ex.pattern, main, ...p, done: Array(p.sets).fill(null) };
}

export function templateForDay(s, dow) {
  const days = WEEK_ORDER.filter(d => s.trainingDays.includes(d));
  const i = days.indexOf(dow);
  return i < 0 ? null : SPLITS[days.length][i];
}

export function buildWorkout(s, templateId) {
  const t = TEMPLATES[templateId];
  let slots = t.slots.slice(0, SLOTS_PER_SESSION[s.sessionMin] || 5);
  if (s.goal === 'fatloss' && !slots.includes('cond')) slots = [...slots, 'cond'];
  const out = [];
  slots.forEach((pattern, i) => {
    const slotKey = `${templateId}:${pattern}`;
    const ex = pickExercise(s, pattern, t.v, slotKey);
    if (ex && !out.some(e => e.id === ex.id)) out.push(makeEntry(s, ex, slotKey, i < 2));
  });
  return out;
}

export function buildRecovery(s) {
  return [
    { id: 'walk', name: `Walk ${s.goal === 'fatloss' ? 30 : 20} minutes`, done: false },
    { id: 'mobility', name: 'Stretch or mobility work, 10 minutes', done: false },
    { id: 'protein', name: `Eat ${proteinTarget(s)} g of protein`, done: false },
  ];
}

export function buildQuest(s, dayKey) {
  const template = templateForDay(s, parseKey(dayKey).getDay());
  if (template) {
    return { type: 'workout', template, exercises: buildWorkout(s, template), reward: workoutReward(s.level), gold: workoutGold(s.level), complete: false };
  }
  return { type: 'recovery', tasks: buildRecovery(s), reward: recoveryReward(s.level), gold: recoveryGold(s.level), complete: false };
}

export const questStarted = q => (q.type === 'workout' ? q.exercises.some(e => e.done.some(Boolean)) : q.tasks.some(t => t.done));

// Distinct exercises across the weekly plan (used for strength potential).
export function planExercises(s) {
  const ids = new Set();
  for (const d of s.trainingDays) {
    const t = templateForDay(s, d);
    if (t) buildWorkout(s, t).forEach(e => ids.add(e.id));
  }
  return [...ids].map(exById);
}

// Double progression: hit the top of the rep range on every set -> heavier weight or harder variation.
export function applyProgression(s, quest) {
  const notes = [];
  for (const e of quest.exercises) {
    const ex = exById(e.id);
    const rec = (s.lifts[e.id] = s.lifts[e.id] || {});
    const reps = e.done.map(d => d.r);
    const allTop = reps.every(r => r >= e.hi);

    if (ex.kind === 'load') {
      rec.w = e.w;
      if (allTop) {
        const steps = LOWER_BODY.has(ex.pattern) && ex.eq.includes('barbell') ? 2 : 1;
        rec.w = fromDispW(s, toDispW(s, e.w) + loadStep(s, ex) * steps);
        notes.push(`${ex.name}: up to ${fmtW(s, rec.w)}${ex.perHand ? ' each' : ''}`);
      }
      continue;
    }

    if (ex.kind === 'reps') rec.last = Math.max(...reps);
    if (ex.kind === 'time' && allTop) rec.t = Math.min(120, e.hi + (ex.pattern === 'cond' ? 5 : 10));
    const maxed = ex.kind === 'reps' ? allTop : allTop && rec.t > (ex.pattern === 'cond' ? 45 : 60);
    if (!maxed) {
      if (ex.kind === 'time' && allTop) notes.push(`${ex.name}: up to ${rec.t} s`);
      continue;
    }
    const next = ex.lvl && candidates(s, ex.pattern).ladder.find(x => x.lvl > ex.lvl);
    if (next) {
      s.bwLevel[ex.pattern] = next.lvl;
      if (s.swaps[e.slotKey] === ex.id) delete s.swaps[e.slotKey];
      notes.push(`${ex.name} mastered → ${next.name}`);
    } else if (ex.kind === 'reps') {
      rec.hi = Math.min(50, e.hi + 5);
      notes.push(`${ex.name}: rep goal up to ${rec.hi}`);
    }
  }
  return notes;
}
