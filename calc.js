/* Body, nutrition and strength math. Everything is stored in kg / cm and converted for display. */

import { STANDARDS, REP_STANDARDS, LEVEL_NAMES, EXP_LEVEL } from './data.js';
import { clamp, roundTo, fmtNum } from './util.js';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

/* ---------- Units ---------- */

export const imperial = s => s.units === 'imperial';
export const wUnit = s => (imperial(s) ? 'lb' : 'kg');
export const lUnit = s => (imperial(s) ? 'in' : 'cm');
export const toDispW = (s, kg) => (imperial(s) ? kg / KG_PER_LB : kg);
export const fromDispW = (s, v) => (imperial(s) ? v * KG_PER_LB : v);
export const toDispL = (s, cm) => (imperial(s) ? cm / CM_PER_IN : cm);
export const fromDispL = (s, v) => (imperial(s) ? v * CM_PER_IN : v);

export const fmtW = (s, kg, step = 0.5) => `${fmtNum(roundTo(toDispW(s, kg), step))} ${wUnit(s)}`;
export const fmtL = (s, cm) => `${fmtNum(toDispL(s, cm))} ${lUnit(s)}`;

export function fmtHeight(s) {
  if (!imperial(s)) return `${Math.round(s.heightCm)} cm`;
  const inches = Math.round(s.heightCm / CM_PER_IN);
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
}

// Weight-plate / dumbbell steps in display units.
export function loadStep(s, ex) {
  if (imperial(s)) return 5;
  if (ex.eq.includes('kb')) return 4;
  if (ex.perHand || (ex.any && ex.any.includes('db'))) return 2;
  return 2.5;
}

export const roundLoad = (s, ex, kg) => fromDispW(s, Math.max(loadStep(s, ex), roundTo(toDispW(s, kg), loadStep(s, ex))));

/* ---------- Body composition ---------- */

export const bmi = s => s.weightKg / (s.heightCm / 100) ** 2;

// U.S. Navy circumference method (metric form).
export function navyBodyFat(sex, heightCm, waist, neck, hips) {
  if (sex === 'male') {
    if (!(waist > neck)) return null;
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450;
  }
  if (!hips || !(waist + hips > neck)) return null;
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.221 * Math.log10(heightCm)) - 450;
}

// Deurenberg BMI formula: a rough fallback until tape measurements are logged.
const deurenberg = s => 1.2 * bmi(s) + 0.23 * s.age - 10.8 * (s.sex === 'male' ? 1 : 0) - 5.4;

export function bodyFat(s) {
  const m = s.measures && s.measures[s.measures.length - 1];
  if (m) {
    const v = navyBodyFat(s.sex, s.heightCm, m.waist, m.neck, m.hips);
    if (v && Number.isFinite(v)) return { pct: clamp(v, 3, 60), source: 'tape', date: m.date };
  }
  return { pct: clamp(deurenberg(s), 5, 60), source: 'estimate' };
}

export function bodyFatLabel(sex, pct) {
  const t = sex === 'male' ? [6, 14, 18, 25] : [14, 21, 25, 32];
  if (pct < t[0]) return 'Essential';
  if (pct < t[1]) return 'Athletic';
  if (pct < t[2]) return 'Fit';
  if (pct < t[3]) return 'Average';
  return 'Above average';
}

// Realistic natural fat-free mass index ceiling (most naturals top out around here).
const FFMI_CEILING = { male: 24, female: 20.5 };
export const leanKg = s => s.weightKg * (1 - bodyFat(s).pct / 100);
export const ffmi = s => leanKg(s) / (s.heightCm / 100) ** 2;
export const maxLeanKg = s => FFMI_CEILING[s.sex] * (s.heightCm / 100) ** 2;

/* ---------- Nutrition ---------- */

// Mifflin-St Jeor
export const bmr = s => 10 * s.weightKg + 6.25 * s.heightCm - 5 * s.age + (s.sex === 'male' ? 5 : -161);

const activityFactor = days => (days <= 1 ? 1.3 : days <= 3 ? 1.45 : days <= 5 ? 1.55 : 1.65);
export const maintenance = s => bmr(s) * activityFactor(s.trainingDays.length);

const GOAL_CALORIES = { fatloss: -0.2, muscle: 0.1, recomp: -0.1, strength: 0.05 };

export function calorieTarget(s) {
  let adj = GOAL_CALORIES[s.goal];
  if (s.age < 18) adj = Math.max(adj, -0.1); // teens are still growing: gentle deficits only
  const floor = s.sex === 'male' ? 1500 : 1200;
  return Math.round(Math.max(floor, maintenance(s) * (1 + adj)) / 10) * 10;
}

export function proteinTarget(s) {
  const perKg = s.goal === 'fatloss' || s.goal === 'recomp' ? 2.0 : 1.8;
  // Above BMI 30, base protein on the weight at BMI 25 instead of total weight.
  const refKg = bmi(s) > 30 ? 25 * (s.heightCm / 100) ** 2 : s.weightKg;
  return Math.round((perKg * refKg) / 5) * 5;
}

/* ---------- Body projection ---------- */

// Typical natural lean-mass gain per month, as a fraction of bodyweight (Aragon model).
const LEAN_RATE = { new: 0.01, some: 0.005, experienced: 0.0025 };
const GOAL_LEAN = { muscle: 1, strength: 0.7, recomp: 0.6, fatloss: 0.35 };
const LEAN_GOAL_BF = { male: 15, female: 24 };
const MIN_BF = { male: 10, female: 18 };

export function suggestTargetKg(s) {
  const bf = bodyFat(s).pct;
  const lean = leanKg(s);
  switch (s.goal) {
    case 'fatloss': {
      const goalBf = Math.max(MIN_BF[s.sex] + 1, Math.min(LEAN_GOAL_BF[s.sex], bf - 3));
      return Math.max(lean / (1 - goalBf / 100), s.weightKg * 0.8);
    }
    case 'muscle':
      return s.weightKg * (1 + LEAN_RATE[s.experience] * 6 * 1.6);
    default:
      return s.weightKg;
  }
}

export const targetKg = s => s.targetKg || suggestTargetKg(s);

/*
 * Simulates weekly body changes if the plan is followed.
 * Returns { weeks: [{ kg, bf, lean }], reachedWeek }.
 */
export function projectBody(s, totalWeeks) {
  const bf0 = bodyFat(s).pct / 100;
  let lean = s.weightKg * (1 - bf0);
  let fat = s.weightKg * bf0;
  const leanMax = maxLeanKg(s);
  const target = targetKg(s);
  const freq = Math.min(1, s.trainingDays.length / 3);
  const teen = s.age < 18 ? 0.6 : 1;
  const minBf = MIN_BF[s.sex] / 100;
  const weeks = [{ kg: lean + fat, bf: bf0 * 100, lean }];
  let reachedWeek = null;

  for (let wk = 1; wk <= totalWeeks; wk++) {
    const kg = lean + fat;
    const room = clamp((leanMax - lean) / (leanMax * 0.15), 0, 1); // gains slow down near the ceiling
    const leanGain = ((LEAN_RATE[s.experience] * kg) / 4.345) * GOAL_LEAN[s.goal] * freq * room;
    let fatChange;
    if (reachedWeek !== null && (s.goal === 'fatloss' || s.goal === 'muscle')) {
      fatChange = -leanGain * 0.5; // maintenance: weight roughly stable
    } else if (s.goal === 'fatloss') {
      fatChange = -0.0075 * kg * teen - leanGain; // ~0.75% bodyweight per week
    } else if (s.goal === 'recomp') {
      fatChange = -0.0025 * kg * teen;
    } else if (s.goal === 'muscle') {
      fatChange = leanGain * 0.6;
    } else {
      fatChange = leanGain * 0.3;
    }
    lean += leanGain;
    fat = Math.max(fat + fatChange, (lean * minBf) / (1 - minBf));
    const now = lean + fat;
    weeks.push({ kg: now, bf: (fat / now) * 100, lean });
    if (reachedWeek === null) {
      if (s.goal === 'fatloss' && now <= target) reachedWeek = wk;
      if (s.goal === 'muscle' && now >= target) reachedWeek = wk;
    }
  }
  return { weeks, reachedWeek };
}

/* ---------- Strength ---------- */

export const oneRepMax = (w, reps) => (reps <= 1 ? w : w * (1 + reps / 30)); // Epley

// Monthly rate at which strength closes the gap to its ceiling.
export function strengthRate(s) {
  const days = s.trainingDays.length;
  const freq = days <= 2 ? 0.75 : days >= 4 ? 1.1 : 1;
  const goal = { fatloss: 0.8, strength: 1.15, muscle: 1, recomp: 0.95 }[s.goal];
  return 0.07 * freq * goal;
}

export const strengthAt = (now, ceil, months, k) => ceil - (ceil - now) * Math.exp(-k * months);

const levelIndex = (v, table) => table.reduce((idx, t, i) => (v >= t ? i : idx), 0);

/*
 * Strength potential rows for the lifts in the user's plan plus bodyweight benchmarks.
 * planEx: exercises in the weekly plan. hist: { exerciseId: { e1rm, reps } } from logged sets.
 */
export function potentialRows(s, planEx, hist) {
  const k = strengthRate(s);
  const lvl0 = EXP_LEVEL[s.experience];
  const bwGoal = Math.max(targetKg(s), s.weightKg * 0.85);
  const rows = [];
  const order = ['squat', 'hpush', 'hinge', 'vpush', 'vpull', 'hpull'];
  // Within a movement, prefer the exercise closest to the standard barbell lift (ratio ~1).
  const offStandard = e => Math.abs(Math.log(e.ref[1]));
  const loads = planEx.filter(e => e.kind === 'load' && order.includes(e.pattern))
    .sort((a, b) => order.indexOf(a.pattern) - order.indexOf(b.pattern) || offStandard(a) - offStandard(b));
  const seen = new Set();

  for (const ex of loads) {
    const [lift, ratio] = ex.ref;
    if (seen.has(lift) || rows.length >= 4) continue;
    seen.add(lift);
    const table = STANDARDS[s.sex][lift];
    const logged = hist[ex.id] && hist[ex.id].e1rm;
    const now = logged || table[lvl0] * s.weightKg * ratio;
    let ceil = table[3] * bwGoal * ratio;
    if (now >= ceil * 0.97) ceil = Math.max(table[4] * bwGoal * ratio, now * 1.05);
    rows.push({
      id: ex.id, name: ex.name, kind: 'load', perHand: !!ex.perHand, estimated: !logged,
      level: LEVEL_NAMES[levelIndex(now / (s.weightKg * ratio), table)],
      values: [now, ...[3, 6, 12].map(m => strengthAt(now, ceil, m, k)), ceil],
    });
  }

  const bench = [['pushup', 'Push-ups'], ['pullup', 'Pull-ups']];
  for (const [key, name] of bench) {
    if (key === 'pullup' && !s.equipment.bar) continue;
    const table = REP_STANDARDS[s.sex][key];
    const known = Math.max((hist[key] && hist[key].reps) || 0, (s.tests[key] && s.tests[key].reps) || 0);
    const measured = !!(hist[key] || s.tests[key]);
    const now = measured ? known : table[lvl0];
    let ceil = table[3];
    if (now >= ceil * 0.97) ceil = Math.max(table[4], now + 5);
    rows.push({
      id: key, name: `${name} (max reps)`, kind: 'reps', estimated: !measured,
      level: LEVEL_NAMES[levelIndex(now, table)],
      values: [now, ...[3, 6, 12].map(m => strengthAt(now, ceil, m, k * 0.9)), ceil].map(Math.floor),
    });
  }
  return rows;
}
