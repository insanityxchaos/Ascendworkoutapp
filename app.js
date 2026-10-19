import { $, esc, plural, clamp, roundTo, fmtNum, dateKey, addDays, daysBetween, prettyDate } from './util.js';
import {
  EQUIPMENT, EQUIPMENT_PRESETS, GOALS, EXPERIENCE, PATTERNS, TEMPLATES, SPLIT_NAMES, STATS, RANKS,
  WORKOUT_TYPES, SUGGESTIONS, DOW, WEEK_ORDER, SHOP, THEMES, TITLES, AVATAR_OPTIONS,
} from './data.js';
import * as C from './calc.js';
import * as P from './plan.js';
import * as Photos from './photos.js';
import * as Game from './game.js';
import { G } from './game.js';
import { scene, emblem, badge, icon, coin, figure, ring, setRing, avatar } from './art.js';
import { sfx, setSoundEnabled } from './sound.js';

const S = () => G.state;

/* ================= Toast ================= */

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ================= Modals ================= */

const modalQueue = [];
let currentModal = null;

// html may be a string or a function (for modals that re-render, like forms).
function queueModal(html, cls = '', sound = null) {
  modalQueue.push({ html, cls, sound });
  if (!currentModal) nextModal();
}

function nextModal() {
  currentModal = modalQueue.shift() || null;
  const ov = $('#overlay');
  if (!currentModal) {
    ov.className = '';
    ov.innerHTML = '';
    return;
  }
  ov.className = `show${currentModal.cls.includes('celebrate') ? ' full' : ''}`;
  ov.innerHTML = `<div class="modal ${currentModal.cls}" id="modal" role="dialog" aria-modal="true"></div>`;
  refreshModal();
  ov.scrollTop = 0;
  if (currentModal.sound) sfx(currentModal.sound);
}

function refreshModal() {
  if (!currentModal) return;
  const m = $('#modal');
  const scroll = m.scrollTop;
  m.innerHTML = typeof currentModal.html === 'function' ? currentModal.html() : currentModal.html;
  m.scrollTop = scroll;
}

const refreshForm = () => (currentModal ? refreshModal() : render());

// Turns game notices (quest complete, level up...) into screens, merging back-to-back level-ups.
function pump() {
  const list = Game.takeNotices();
  const levels = list.filter(n => n.type === 'level');
  for (const n of list) {
    if (n.type === 'toast') toast(n.text);
    else if (n.type === 'mini') {
      toast(`Quest ${n.n}/${n.total} cleared · +${n.xp} XP · +${n.gold} Gold`);
      sfx('unlock');
    } else if (n.type === 'side') {
      toast(`Bonus quest cleared · +${n.xp} XP · +${n.gold} Gold`);
      sfx('coin');
    } else if (n.type === 'quest') queueModal(questCompleteHtml(n), 'celebrate', 'quest');
    else if (n.type === 'level' && n === levels[0]) {
      queueModal(levelUpHtml(levels[0].from, levels[levels.length - 1].to), 'celebrate', 'level');
    } else if (n.type === 'rank') queueModal(rankUpHtml(n.rank), 'celebrate rank', 'rank');
    else if (n.type === 'achievements') queueModal(achievementHtml(n.list), 'celebrate small', 'unlock');
    else if (n.type === 'penalty') queueModal(penaltyHtml(n), 'penalty', 'penalty');
  }
}

/* ================= Routing ================= */

const TABS = ['home', 'quests', 'stats', 'awards', 'more'];
const PARENT = { body: 'more', history: 'more', shop: 'more', settings: 'more', workout: 'quests' };
const FULLSCREEN = new Set(['splash', 'intro', 'onboard', 'workout']);
let route = 'home';
let workoutReturn = 'home';

function go(r) {
  route = r;
  window.scrollTo(0, 0);
  render();
}

function back() {
  if (route === 'workout') go(workoutReturn);
  else go(PARENT[route] || 'home');
}

function applyTheme() {
  document.documentElement.dataset.theme = (S() && S().theme) || 'blue';
}

function render() {
  if (!S() && !['splash', 'intro', 'onboard'].includes(route)) route = 'splash';
  const screens = {
    splash: splashScreen, intro: introScreen, onboard: onboardScreen,
    home: homeScreen, quests: questsScreen, workout: workoutScreen, stats: statsScreen, awards: awardsScreen,
    more: moreScreen, body: bodyScreen, history: historyScreen, shop: shopScreen, settings: settingsScreen,
  };
  document.body.classList.toggle('no-tabs', FULLSCREEN.has(route));
  $('#view').innerHTML = screens[route]();
  const tab = TABS.includes(route) ? route : PARENT[route];
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  updateCountdown();
  updateTimers();
}

/* ================= Shared bits ================= */

const goldChip = () => `<span class="gold-chip">${coin(16)}<b>${S().gold.toLocaleString()}</b></span>`;

function pageHead(title, right) {
  return `<header class="pagehead"><h1 class="title">${title}</h1><div class="pagehead-right">${right ?? goldChip()}</div></header>`;
}

function subHead(title, right = '') {
  return `<header class="pagehead sub">
    <button class="back" data-action="back" aria-label="Back">${icon('back', 22)}</button>
    <h1 class="title">${title}</h1><div class="pagehead-right">${right}</div></header>`;
}

function seg(action, options, current) {
  return `<div class="seg">${options.map(([v, label]) =>
    `<button class="${String(current) === String(v) ? 'on' : ''}" data-action="${action}" data-v="${v}">${label}</button>`).join('')}</div>`;
}

const pct = (cur, prev) => {
  if (!prev) return cur ? 'New' : '—';
  const p = Math.round(((cur - prev) / prev) * 100);
  return `${p >= 0 ? '+' : ''}${p}%`;
};

const fmtSec = t => (t >= 120 ? `${fmtNum(t / 60)} min` : `${t} s`);

function prescriptionText(e, ex) {
  if (ex.kind === 'time') return `${e.sets} × ${fmtSec(e.hi)}${ex.pattern === 'cond' ? ' work' : ''}${ex.perSide ? ' per side' : ''}`;
  const reps = e.lo === e.hi ? e.hi : `${e.lo}–${e.hi}`;
  const load = ex.kind === 'load' ? ` @ ${C.fmtW(S(), e.w)}${ex.perHand ? ' each' : ''}` : '';
  return `${e.sets} × ${reps}${ex.perSide ? ' per side' : ''}${load}`;
}

const questTitle = q => (q.type === 'workout' ? TEMPLATES[q.template].name : 'Recovery Day');
const questDesc = q => {
  if (q.type !== 'workout') return 'Light movement so your muscles can rebuild.';
  if (q.light) return `${plural(q.exercises.length, 'quest')} · easy cardio, core and mobility · ~15 min`;
  return `${plural(q.exercises.length, 'quest')} · ~${S().sessionMin} min`;
};

// "Complete 3 sets of goblet squats" style mini quest names.
function miniTitle(e, ex) {
  if (ex.pattern === 'cardio') return `${ex.name}: ${fmtSec(e.hi)}`;
  return `Complete ${plural(e.sets, 'set')} of ${ex.name}`;
}

function rewardsHtml(q) {
  const boost = Game.boostActive();
  return `<div class="rewards">
    <span class="reward">${icon('star', 16)} +${Math.round(q.reward * (boost ? 1.5 : 1))} XP${boost ? ' <em>boosted</em>' : ''}</span>
    <span class="reward gold">${coin(16)} +${Game.questGold(q)} Gold</span>
  </div>`;
}

const miniReward = e => `<span class="mini-reward">+${Math.round((e.xp || 0) * (Game.boostActive() ? 1.5 : 1))} XP · +${e.gold || 0} ${coin(12)}</span>`;

function rankTier(level) {
  const i = 5 - RANKS.indexOf(Game.rankFor(level)); // E=0 … S=5
  return i < 2 ? 1 : i < 4 ? 2 : 3;
}

// Set at boot to the default character image (player.jpg or player.png) if the app folder has one.
let defaultPortrait = null;

// Real character art (uploaded by the player, or the default player.png) beats the drawn character.
function portraitHtml(src, size, level) {
  return `<img class="pimg" src="${src}" width="${size}" height="${Math.round(size * 1.2)}" alt="Your character" style="--rc:${Game.rankFor(level).color}">`;
}

function playerAvatar(size, look = S().avatar, level = S().level, portrait = S().portrait) {
  const src = portrait || defaultPortrait;
  if (src) return portraitHtml(src, size, level);
  return avatar(look, { size, tier: rankTier(level), rankColor: Game.rankFor(level).color });
}

function sideQuestsHtml(compact = false) {
  const list = Game.todaySide();
  return `
    <section class="card">
      <div class="row-between"><span class="eyebrow">Bonus Quests</span><span class="muted small">Optional · no penalty</span></div>
      ${list.map((q, i) => {
        const d = Game.sideDef(q.id);
        const pctDone = Math.min(100, (q.progress / q.target) * 100);
        return `
          <div class="side${q.done ? ' done' : ''}">
            <div class="row-between"><b>${d.text.replace('{n}', q.target)}</b><span class="mini-reward">+${q.xp} XP · +${q.gold} ${coin(12)}</span></div>
            <div class="bar${q.done ? ' ok' : ''}"><i style="width:${pctDone}%"></i></div>
            ${q.done ? `<span class="side-done">${icon('check', 14)} Cleared</span>` : `
              <div class="side-controls">
                <span class="muted small">${q.progress} / ${q.target} ${d.unit}</span>
                ${compact ? '' : `<button class="mini" data-action="side-step" data-v="${i}" data-dir="-1">−${d.step}</button>`}
                <button class="mini" data-action="side-step" data-v="${i}" data-dir="1">+${d.step}</button>
                <button class="mini" data-action="side-step" data-v="${i}" data-dir="2">+${d.step * 2}</button>
                <button class="mini ok" data-action="side-done" data-v="${i}">Done</button>
              </div>`}
          </div>`;
      }).join('')}
    </section>`;
}

function updateCountdown() {
  const els = document.querySelectorAll('.countdown');
  if (!els.length) return;
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((end - now) / 1000));
  const pad = n => String(n).padStart(2, '0');
  const text = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  els.forEach(el => { el.textContent = text; });
}

/* ================= Splash, intro, onboarding ================= */

function splashScreen() {
  return `
    <section class="splash" data-action="go" data-v="intro">
      <div class="full-art">${scene({ seed: 21, w: 400, h: 860, bolts: 2, figure: true, figureY: 0.56, sparks: 30 })}</div>
      <div class="splash-content">
        <p class="eyebrow glow">[ System Notice ]</p>
        <h1 class="display">The System<br><span>Is Now Active</span></h1>
        <p class="lead">Your journey to a stronger you starts today.</p>
        <button class="btn" data-action="go" data-v="intro">Tap to Continue</button>
      </div>
    </section>`;
}

function previewLevelCard() {
  return `<div class="preview card">
    <div class="row-between"><b class="lv-big">Lv. 1</b><span class="muted small">0 / 100 XP</span></div>
    <div class="xpbar"><i style="width:8%"></i></div>
    <h3>Attributes</h3>
    ${STATS.map(st => `<div class="attr">${icon(st.icon, 16)}<span class="attr-name">${st.name}</span><b>10</b></div>`).join('')}
  </div>`;
}

function previewQuestCard() {
  return `<div class="preview card">
    <span class="eyebrow">Daily Quest</span>
    <h3 class="quest-title">Full Body A</h3>
    <div class="bar"><i style="width:0%"></i></div>
    <div class="preview-scene">${scene({ seed: 8, w: 400, h: 150, picto: 'hpush', moon: false, sparks: 8 })}</div>
    <div class="rewards"><span class="reward">${icon('star', 16)} +65 XP</span><span class="reward gold">${coin(16)} +10 Gold</span></div>
  </div>`;
}

function previewRankCard() {
  return `<div class="preview card center">
    <div class="rank-preview">${emblem('E', RANKS[5].color, { size: 96 })}<div><span class="muted small">Current Rank</span><b class="lv-big">E</b><span class="muted small">Next: D at level 10</span></div></div>
    <div class="rank-row">${[...RANKS].reverse().map(r => emblem(r.rank, r.color, { size: 40 })).join('')}</div>
  </div>`;
}

const INTRO = [
  { title: 'Step Into the System', text: 'This isn\'t just a workout app. Every rep earns XP, every day builds your attributes, and every week makes you stronger.',
    art: () => `<div class="intro-art">${scene({ seed: 33, w: 400, h: 360, island: true, figure: true, bolts: 1, sparks: 18 })}</div>` },
  { title: 'Level Up', text: 'Clear workouts to earn XP and raise your level. Your attributes grow from the training you actually do.', art: previewLevelCard },
  { title: 'Daily Quests', text: 'Each day the System assigns a quest built from your goal, equipment and schedule. Fail it and you pay a penalty.', art: previewQuestCard },
  { title: 'Ranks & Rewards', text: 'Climb from E-Rank to S-Rank, unlock achievements, and earn gold to spend in the shop.', art: previewRankCard },
];
let introStep = 0;

function introScreen() {
  const step = INTRO[introStep];
  return `
    <section class="intro">
      <div class="full-art dim">${scene({ seed: 61, w: 400, h: 860, sparks: 16, city: true })}</div>
      <button class="skip" data-action="intro-skip">Skip</button>
      <div class="intro-body">
        ${step.art()}
        <h1 class="display sm">${step.title}</h1>
        <p class="lead">${step.text}</p>
      </div>
      <div class="intro-foot">
        <div class="dots">${INTRO.map((_, i) => `<i class="${i === introStep ? 'on' : ''}"></i>`).join('')}</div>
        <button class="btn" data-action="intro-next">${introStep === INTRO.length - 1 ? 'Get Started' : 'Next'}</button>
      </div>
    </section>`;
}

/* ---------- Profile forms (shared by onboarding and settings) ---------- */

let sdraft = {};

function blankDraft() {
  return {
    name: '', sex: 'male', age: '', units: 'imperial', hFt: '', hIn: '', hCm: '', w: '', target: '',
    goal: null, experience: null, equipment: {}, trainingDays: [1, 3, 5], sessionMin: '45', avatar: null,
  };
}

function setDraftBody(d, heightCm, weightKg) {
  if (d.units === 'imperial') {
    const inches = Math.round(heightCm / C.CM_PER_IN);
    d.hFt = heightCm ? String(Math.floor(inches / 12)) : '';
    d.hIn = heightCm ? String(inches % 12) : '';
    d.w = weightKg ? fmtNum(weightKg / C.KG_PER_LB, 0) : '';
  } else {
    d.hCm = heightCm ? String(Math.round(heightCm)) : '';
    d.w = weightKg ? fmtNum(weightKg, 1) : '';
  }
}

const draftHeightCm = d => (d.units === 'imperial' ? ((+d.hFt || 0) * 12 + (+d.hIn || 0)) * C.CM_PER_IN : +d.hCm || 0);
const draftWeightKg = d => C.fromDispW(d, +d.w || 0);

function draftFromState(s) {
  const d = {
    name: s.name, sex: s.sex, age: String(s.age), units: s.units, goal: s.goal, experience: s.experience,
    equipment: { ...s.equipment }, trainingDays: [...s.trainingDays], sessionMin: String(s.sessionMin),
    avatar: { ...s.avatar },
    portrait: s.portrait || null,
  };
  setDraftBody(d, s.heightCm, s.weightKg);
  d.target = s.targetKg ? fmtNum(C.toDispW(d, s.targetKg), 0) : '';
  return d;
}

function draftProfile(d) {
  return {
    name: d.name.trim() || 'Player', sex: d.sex, age: Math.round(+d.age), units: d.units,
    heightCm: draftHeightCm(d), weightKg: draftWeightKg(d), goal: d.goal, experience: d.experience,
    equipment: { ...d.equipment }, trainingDays: [...d.trainingDays].sort(), sessionMin: +d.sessionMin,
    targetKg: +d.target > 0 ? C.fromDispW(d, +d.target) : null,
    avatar: d.avatar ? { ...d.avatar } : Game.defaultAvatar(d.sex),
    portrait: d.portrait || null,
  };
}

// Calc helpers also read measures/tests; give previews safe defaults.
const previewProfile = d => ({ measures: S() ? S().measures : [], tests: S() ? S().tests : {}, ...draftProfile(d) });

function switchUnits(units) {
  const cm = draftHeightCm(sdraft);
  const kg = draftWeightKg(sdraft);
  const target = +sdraft.target > 0 ? C.fromDispW(sdraft, +sdraft.target) : 0;
  sdraft.units = units;
  setDraftBody(sdraft, cm, kg);
  sdraft.target = target ? fmtNum(C.toDispW(sdraft, target), 0) : '';
}

function validateSection(i) {
  const d = sdraft;
  if (i === 0 && !(+d.age >= 13 && +d.age <= 100)) return 'Enter your age (13 or older)';
  if (i === 1) {
    if (!(draftHeightCm(d) >= 120 && draftHeightCm(d) <= 230)) return 'Enter your height';
    if (!(draftWeightKg(d) >= 30 && draftWeightKg(d) <= 300)) return 'Enter your weight';
  }
  if (i === 2 && !d.goal) return 'Pick a goal';
  if (i === 2 && !d.experience) return 'Pick your experience level';
  if (i === 4 && !d.trainingDays.length) return 'Pick at least one training day';
  return null;
}

function draftSeg(field, options) {
  return `<div class="seg">${options.map(([v, label]) =>
    `<button class="${String(sdraft[field]) === v ? 'on' : ''}" data-action="sset" data-field="${field}" data-v="${v}">${label}</button>`).join('')}</div>`;
}

function profileFields() {
  return `
    <label class="field"><span>Display Name</span><input type="text" data-sbind="name" maxlength="24" value="${esc(sdraft.name)}" placeholder="Your name" autocomplete="off"></label>
    <div class="row">
      <div class="field"><span>Sex</span>${draftSeg('sex', [['male', 'Male'], ['female', 'Female']])}</div>
      <label class="field" style="flex:0 0 96px"><span>Age</span><input type="number" inputmode="numeric" data-sbind="age" value="${esc(sdraft.age)}"></label>
    </div>
    <p class="hint">Used for calorie, body-fat and strength estimates.</p>`;
}

function bodyFields() {
  const imp = sdraft.units === 'imperial';
  const height = imp
    ? `<div class="row">
         <label class="field"><span>Height (ft)</span><input type="number" inputmode="numeric" data-sbind="hFt" value="${esc(sdraft.hFt)}" placeholder="5"></label>
         <label class="field"><span>(in)</span><input type="number" inputmode="numeric" data-sbind="hIn" value="${esc(sdraft.hIn)}" placeholder="10"></label>
       </div>`
    : `<label class="field"><span>Height (cm)</span><input type="number" inputmode="numeric" data-sbind="hCm" value="${esc(sdraft.hCm)}" placeholder="178"></label>`;
  return `
    <div class="field"><span>Units</span>${draftSeg('units', [['imperial', 'lb / ft'], ['metric', 'kg / cm']])}</div>
    ${height}
    <div class="row">
      <label class="field"><span>Weight (${imp ? 'lb' : 'kg'})</span><input type="number" inputmode="decimal" data-sbind="w" value="${esc(sdraft.w)}" placeholder="${imp ? '170' : '77'}"></label>
      <label class="field"><span>Goal weight (opt.)</span><input type="number" inputmode="decimal" data-sbind="target" value="${esc(sdraft.target)}" placeholder="auto"></label>
    </div>
    <p class="hint">Leave goal weight blank and the System will suggest a realistic one.</p>`;
}

function goalFields() {
  return `
    <div class="options">${Object.entries(GOALS).map(([k, g]) => `
      <button class="option${sdraft.goal === k ? ' on' : ''}" data-action="sset" data-field="goal" data-v="${k}"><b>${g.name}</b><span>${g.desc}</span></button>`).join('')}</div>
    <div class="field"><span>Experience Level</span>${draftSeg('experience', Object.entries(EXPERIENCE).map(([k, e]) => [k, e.name]))}</div>
    ${sdraft.experience ? `<p class="hint">${EXPERIENCE[sdraft.experience].desc}</p>` : ''}`;
}

function currentPreset(eq) {
  const on = Object.keys(EQUIPMENT).filter(k => eq[k]).sort().join();
  return Object.keys(EQUIPMENT_PRESETS).find(p => [...EQUIPMENT_PRESETS[p].eq].sort().join() === on) || null;
}

function equipmentFields() {
  const preset = currentPreset(sdraft.equipment);
  return `
    <div class="options">${Object.entries(EQUIPMENT_PRESETS).map(([k, p]) => `
      <button class="option${preset === k ? ' on' : ''}" data-action="preset" data-v="${k}"><b>${p.name}</b><span>${p.desc}</span></button>`).join('')}</div>
    <div class="field"><span>What do you have? ${preset ? '' : '(custom)'}</span><div class="toggles">${Object.entries(EQUIPMENT).map(([k, name]) =>
      `<button class="toggle${sdraft.equipment[k] ? ' on' : ''}" data-action="seq" data-v="${k}">${name}</button>`).join('')}</div></div>
    <p class="hint">Only exercises you can do with this equipment will show up in your plan.</p>`;
}

function scheduleFields() {
  const n = sdraft.trainingDays.length;
  return `
    <div class="field"><span>Training days · ${n}/week</span><div class="toggles days">${WEEK_ORDER.map(d =>
      `<button class="toggle${sdraft.trainingDays.includes(d) ? ' on' : ''}" data-action="sday" data-v="${d}">${DOW[d]}</button>`).join('')}</div></div>
    <div class="field"><span>Workout length</span>${draftSeg('sessionMin', [['30', '30 min'], ['45', '45 min'], ['60', '60 min']])}</div>
    <p class="hint">${n ? `${SPLIT_NAMES[n]} split. ` : ''}Other days get a light recovery quest (walk, stretch, protein).</p>`;
}

function etaText(p) {
  if (p.goal !== 'fatloss' && p.goal !== 'muscle') {
    return p.goal === 'recomp'
      ? 'Your weight stays about the same while you swap fat for muscle.'
      : 'Your weight stays about the same while your lifts go up.';
  }
  const { reachedWeek } = C.projectBody(p, 104);
  const target = C.fmtW(p, C.targetKg(p), 1);
  if (reachedWeek === null) return `${target} will take over 2 years at a healthy pace. Consider a closer goal.`;
  return `Reach ${target} around ${prettyDate(addDays(dateKey(), reachedWeek * 7), { month: 'short', day: 'numeric', year: 'numeric' })} (~${plural(reachedWeek, 'week')}).`;
}

function equipSummary(eq) {
  const preset = currentPreset(eq);
  if (preset) return EQUIPMENT_PRESETS[preset].name;
  const on = Object.keys(EQUIPMENT).filter(k => eq[k]).map(k => EQUIPMENT[k]);
  return on.length ? on.join(', ') : 'Bodyweight only';
}

function summaryHtml(p) {
  const days = WEEK_ORDER.filter(d => p.trainingDays.includes(d)).map(d => DOW[d]).join(', ');
  return `
    <div class="summary">
      <div class="sum-row"><span>Plan</span><b>${SPLIT_NAMES[p.trainingDays.length]}</b></div>
      <div class="sum-row"><span>Training days</span><b>${days}</b></div>
      <div class="sum-row"><span>Workouts</span><b>~${p.sessionMin} min</b></div>
      <div class="sum-row"><span>Equipment</span><b>${equipSummary(p.equipment)}</b></div>
      <div class="sum-row"><span>Body fat (est.)</span><b>${fmtNum(C.bodyFat(p).pct, 0)}%</b></div>
      <div class="sum-row"><span>Daily calories</span><b>${C.calorieTarget(p).toLocaleString()} kcal</b></div>
      <div class="sum-row"><span>Daily protein</span><b>${C.proteinTarget(p)} g</b></div>
      <div class="sum-row"><span>Goal</span><b>${GOALS[p.goal].name}</b></div>
    </div>
    <p class="hint center">${etaText(p)}</p>
    ${p.age < 18 ? '<p class="hint center">Under 18: calorie targets are kept gentle because you\'re still growing.</p>' : ''}`;
}

function avatarFields() {
  if (!sdraft.avatar) sdraft.avatar = Game.defaultAvatar(sdraft.sex);
  const a = sdraft.avatar;
  const level = S() ? S().level : 1;
  const swatches = (field, colors) => `<div class="swatches">${colors.map(c =>
    `<button class="sw${a[field] === c ? ' on' : ''}" style="--c:${c}" data-action="av-set" data-field="${field}" data-v="${c}" aria-label="${c}"></button>`).join('')}</div>`;
  const shown = sdraft.portrait || defaultPortrait; // an image beats the drawn character
  return `
    <div class="av-preview${shown ? ' has-img' : ''}">${shown
      ? portraitHtml(shown, 170, level)
      : avatar(a, { size: 170, tier: rankTier(level), rankColor: Game.rankFor(level).color })}</div>
    <div class="field"><span>Character artwork</span>
      <div class="row">
        <button class="btn ghost" data-action="portrait-pick">${icon('camera', 16)} ${sdraft.portrait ? 'Change Image' : 'Upload Your Own'}</button>
        ${sdraft.portrait ? '<button class="btn ghost" data-action="portrait-clear">Remove</button>' : ''}
      </div>
      <input type="file" id="portrait-file" accept="image/*" hidden>
      <p class="hint">${!sdraft.portrait && defaultPortrait ? 'You\'re using the default character. ' : ''}Upload a character image you made or have the rights to (for example from an AI image app) to use your own. A waist-up portrait on a dark background works best.</p>
    </div>
    ${shown ? '' : `
      <div class="field"><span>Hair style</span><div class="seg">${AVATAR_OPTIONS.hair.map(([v, label]) =>
        `<button class="${a.hair === v ? 'on' : ''}" data-action="av-set" data-field="hair" data-v="${v}">${label}</button>`).join('')}</div></div>
      <div class="field"><span>Hair color</span>${swatches('hairColor', AVATAR_OPTIONS.hairColor)}</div>
      <div class="field"><span>Eye color</span>${swatches('eyes', AVATAR_OPTIONS.eyes)}</div>
      <div class="field"><span>Skin tone</span>${swatches('skin', AVATAR_OPTIONS.skin)}</div>
      <p class="hint">Your outfit and aura upgrade as you rank up: a jacket at C-Rank, armored coat at A-Rank.</p>`}`;
}

function openAvatarEditor() {
  sdraft = { sex: S().sex, avatar: { ...S().avatar }, portrait: S().portrait || null };
  queueModal(() => `
    <h2 class="modal-title">Your Character</h2>
    ${avatarFields()}
    <button class="btn" data-action="save-avatar">Save</button>
    <button class="btn ghost" data-action="close">Cancel</button>`);
}

const OB_STEPS = [
  { title: 'Create Your Profile', sub: 'Let\'s set up your character.', body: profileFields },
  { title: 'Your Body', sub: 'Used for calories, body fat and goal estimates.', body: bodyFields },
  { title: 'Your Goal', sub: 'What are you training for?', body: goalFields },
  { title: 'Equipment', sub: 'Only exercises you can do will appear.', body: equipmentFields },
  { title: 'Schedule', sub: 'Pick the days you\'ll train.', body: scheduleFields },
  { title: 'Your Character', sub: 'Make your Player look like you.', body: avatarFields },
  { title: 'Your Plan', sub: 'The System has built your training plan.', body: () => summaryHtml(previewProfile(sdraft)) },
];
let obStep = 0;

function onboardScreen() {
  const step = OB_STEPS[obStep];
  const last = obStep === OB_STEPS.length - 1;
  return `
    <section class="onboard">
      <div class="onboard-art">${scene({ seed: 44, w: 400, h: 210, figure: true, sparks: 12 })}</div>
      <div class="onboard-body">
        <div class="dots left">${OB_STEPS.map((_, i) => `<i class="${i <= obStep ? 'on' : ''}"></i>`).join('')}</div>
        <h1 class="display sm left">${step.title}</h1>
        <p class="lead left">${step.sub}</p>
        <div class="card form-card">${step.body()}</div>
        <div class="row nav-row">
          ${obStep > 0 ? '<button class="btn ghost" data-action="ob-back">Back</button>' : ''}
          <button class="btn" data-action="ob-next">${last ? 'Accept' : 'Continue'}</button>
        </div>
      </div>
    </section>`;
}

function onboardNext() {
  const err = validateSection(obStep);
  if (err) return toast(err);
  if (obStep < OB_STEPS.length - 1) {
    obStep++;
    go('onboard');
    return;
  }
  Game.start(draftProfile(sdraft));
  applyTheme();
  sfx('level');
  go('home');
  toast('Welcome, Player. Your first quest is ready.');
}

/* ================= Home ================= */

function homeScreen() {
  const s = S();
  const r = Game.rankFor(s.level);
  const need = Game.xpNeeded(s.level);
  const q = Game.todayQuest();
  const { done, total } = Game.questProgress(q);
  const streak = Game.computeStreak();
  const started = done > 0;
  const action = q.type === 'workout' ? 'start-workout' : 'go';

  const banners = [];
  if (s.statPoints) banners.push(`<button class="banner-row" data-action="go" data-v="stats">${icon('star', 18)}<span>You have <b>${plural(s.statPoints, 'stat point')}</b> to allocate</span>${icon('chevron', 16)}</button>`);
  if (Game.dailyClaimable()) banners.push(`<button class="banner-row gold" data-action="claim-daily">${icon('gift', 18)}<span>Daily bonus ready: <b>+${Game.DAILY_BONUS} Gold</b></span>${icon('chevron', 16)}</button>`);
  if (Game.chestClaimable()) banners.push(`<button class="banner-row gold" data-action="claim-chest">${icon('chest', 18)}<span>Weekly chest unlocked: <b>+${Game.CHEST_GOLD} Gold</b></span>${icon('chevron', 16)}</button>`);

  return `
    <header class="hero-head">
      <button class="who-emblem" data-action="go" data-v="stats" aria-label="Character">${emblem(r.rank, r.color, { size: 56 })}</button>
      <div class="who">
        <b class="who-name">${esc(s.name)}</b>
        <span class="who-sub">Lv. ${s.level} · ${esc(Game.titleFor())}</span>
        <div class="xpbar"><i style="width:${Math.min(100, (s.xp / need) * 100)}%"></i></div>
        <span class="who-xp">${s.xp} / ${need} XP</span>
      </div>
      <div class="who-side">
        ${goldChip()}
        <button class="icon-btn" data-action="go" data-v="settings" aria-label="Settings">${icon('gear', 20)}</button>
      </div>
    </header>

    <section class="banner">
      ${scene({ seed: 3, w: 400, h: 190, bolts: 1, island: true, sparks: 14 })}
      <button class="banner-avatar" data-action="go" data-v="stats" aria-label="Your character">${playerAvatar(150)}</button>
      <div class="banner-chips">
        <span class="chip">${icon('flame', 14)} ${plural(streak, 'day')} streak</span>
        ${Game.boostActive() ? `<span class="chip boost">${icon('bolt', 14)} XP Boost active</span>` : ''}
        ${s.shields ? `<span class="chip">${icon('shield', 14)} ${s.shields}</span>` : ''}
      </div>
    </section>

    <section class="statrow">${STATS.map(st => `
      <div class="stat-tile">${icon(st.icon, 18)}<span>${st.name}</span><b>${s.stats[st.key]}</b></div>`).join('')}
    </section>

    ${banners.join('')}

    <section class="card quest-card${q.complete ? ' cleared' : ''}">
      <div class="row-between"><span class="eyebrow">Today's Quests · ${Game.miniCleared(q)}/${q.type === 'workout' ? q.exercises.length : 1}</span><span class="muted small">${icon('timer', 14)} <span class="countdown"></span></span></div>
      <h2 class="quest-title">${questTitle(q)}</h2>
      <p class="muted small">${questDesc(q)}</p>
      <div class="bar"><i style="width:${(done / total) * 100}%"></i></div>
      ${q.type === 'workout' ? `<div class="mini-list">${q.exercises.map((e, i) => {
        const ex = P.exById(e.id);
        const cleared = e.done.every(Boolean);
        return `<button class="mini-quest${cleared ? ' done' : ''}" data-action="start-workout" data-v="${i}" ${q.complete ? 'disabled' : ''}>
          <span class="mq-check">${cleared ? icon('check', 14) : i + 1}</span>
          <span class="mq-text">${miniTitle(e, ex)}</span>
          ${cleared ? '' : miniReward(e)}
        </button>`;
      }).join('')}</div>` : ''}
      ${q.complete ? '<div class="stamp">Quest Clear</div>' : `
        <p class="hint">Clear every quest for a bonus: <b class="accent">+${q.bonusXp ?? q.reward} XP</b>${(q.bonusGold ?? Game.questGold(q)) ? ` · <b class="gold-text">+${q.bonusGold ?? Game.questGold(q)} Gold</b>` : ''}</p>
        <button class="btn" data-action="${action}" data-v="quests">${started ? 'Continue Workout' : 'Start Workout'}</button>
        <p class="warn">Uncleared quests at midnight = XP penalty</p>`}
    </section>

    ${sideQuestsHtml(true)}

    <section class="card">
      <div class="row-between"><span class="eyebrow">Weekly Chest</span><span class="muted small">${Math.min(Game.weekCleared(), Game.CHEST_GOAL)} / ${Game.CHEST_GOAL} quests</span></div>
      <div class="bar gold"><i style="width:${Math.min(100, (Game.weekCleared() / Game.CHEST_GOAL) * 100)}%"></i></div>
      <p class="hint">Clear ${Game.CHEST_GOAL} quests this week (Mon–Sun) to open it for ${Game.CHEST_GOLD} Gold.</p>
    </section>`;
}

/* ================= Quests ================= */

let openDay = null;
const extraDraft = { name: '', type: 'cardio', minutes: 30 };

function questsScreen() {
  const s = S();
  const q = Game.todayQuest();
  const workout = q.type === 'workout';
  const { done, total } = Game.questProgress(q);
  const pic = workout ? q.exercises[0] && q.exercises[0].pattern : 'stand';

  const desc = workout
    ? q.exercises.map((e, i) => {
      const ex = P.exById(e.id);
      const sets = e.done.filter(Boolean).length;
      const cleared = sets === e.sets;
      return `<div class="mq-card${cleared ? ' done' : ''}">
        <div class="ex-fig">${figure(e.pattern, 54)}</div>
        <div class="ex-main">
          <span class="mq-label">Quest ${i + 1}${cleared ? ' · Cleared' : ''}</span>
          <b>${miniTitle(e, ex)}</b>
          <span>${prescriptionText(e, ex)}</span>
          ${cleared ? '' : miniReward(e)}
        </div>
        <span class="ex-count">${sets}/${e.sets}</span>
        ${q.complete ? '' : `<button class="mini-btn" data-action="start-workout" data-v="${i}" aria-label="Start ${ex.name}">${icon('chevron', 16)}</button>`}
      </div>`;
    }).join('')
    : q.tasks.map(t => `
      <button class="task${t.done ? ' on' : ''}" data-action="task" data-id="${t.id}" ${q.complete ? 'disabled' : ''}>
        <i>${t.done ? icon('check', 16) : ''}</i><span>${esc(t.name)}</span>
      </button>`).join('');

  return `
    ${pageHead('Daily Quest')}
    <section class="card hero-card">
      <div class="hero-scene">${scene({ seed: 12, w: 400, h: 190, picto: pic, moon: false, sparks: 12 })}</div>
      <div class="hero-body">
        <span class="eyebrow">${prettyDate(dateKey(), { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        <h2 class="quest-title">${questTitle(q)}</h2>
        <p class="muted small">${questDesc(q)}</p>
        <div class="row-between small"><span>${workout ? `${Game.miniCleared(q)} / ${q.exercises.length} quests` : `${done} / ${total} tasks`}</span><span class="muted">${icon('timer', 14)} <span class="countdown"></span></span></div>
        <div class="bar"><i style="width:${(done / total) * 100}%"></i></div>
        <h3>Total Rewards</h3>
        ${rewardsHtml(q)}
        ${workout && !q.complete ? `<p class="hint" style="margin-top:6px">Each quest pays its share as you clear it. Clearing all of them adds a bonus of +${q.bonusXp} XP and +${q.bonusGold} Gold.</p>` : ''}
        <h3>${workout ? 'Quests' : 'Tasks'}</h3>
        <div class="${workout ? '' : 'tasks'}">${desc}</div>
        ${q.complete ? '<div class="stamp">Quest Clear</div>'
          : workout ? `<button class="btn" data-action="start-workout">${done ? 'Continue Quests' : 'Start Quests'}</button>`
            : '<p class="hint center">Tap each task when it\'s done. Recovery days let your muscles rebuild.</p>'}
      </div>
    </section>

    ${sideQuestsHtml()}

    <section class="card">
      <div class="row-between"><h3>This Week</h3><button class="link" data-action="open-profile">Edit plan</button></div>
      ${weekHtml(q)}
    </section>

    ${extraHtml()}`;
}

function weekHtml(q) {
  const todayDow = new Date().getDay();
  return WEEK_ORDER.map(d => {
    const t = P.templateForDay(S(), d);
    const isToday = d === todayDow;
    let detail = '';
    if (openDay === d) {
      const dayKey = addDays(Game.weekStart(), (d + 6) % 7);
      const list = isToday && q.type === 'workout' ? q.exercises
        : t ? P.buildWorkout(S(), t) : P.buildRecoveryWorkout(S(), dayKey);
      detail = `<div class="day-detail">${list.map(e => {
        const ex = P.exById(e.id);
        return `<div class="day-ex"><b>${ex.name}</b><span>${prescriptionText(e, ex)}</span></div>`;
      }).join('')}</div>`;
    }
    return `
      <button class="day${isToday ? ' today' : ''}${t ? ' train' : ''}" data-action="day" data-v="${d}">
        <span class="day-name">${DOW[d]}${isToday ? ' · Today' : ''}</span>
        <span class="day-what">${t ? TEMPLATES[t].name : 'Active Recovery'}</span>
        <span class="chev${openDay === d ? ' open' : ''}">${icon('chevron', 16)}</span>
      </button>${detail}`;
  }).join('');
}

function extraHtml() {
  const k = dateKey();
  const logs = S().logs.filter(l => l.date === k).reverse();
  return `
    <section class="card">
      <h3>Extra Activity</h3>
      <p class="hint" style="margin-top:0">Played a sport or went for a run? Log it for bonus XP (${Game.extraXpToday()} / ${Game.EXTRA_DAILY_CAP} today).</p>
      <label class="field"><span>Activity</span><input type="text" list="act-suggest" data-bind="name" value="${esc(extraDraft.name)}" placeholder="e.g. Basketball" autocomplete="off"></label>
      <datalist id="act-suggest">${SUGGESTIONS.map(x => `<option value="${x}">`).join('')}</datalist>
      <div class="field"><span>Type</span>${seg('xtype', Object.entries(WORKOUT_TYPES), extraDraft.type)}</div>
      <label class="field"><span>Minutes</span><input type="number" inputmode="numeric" data-bind="minutes" value="${esc(extraDraft.minutes)}"></label>
      <button class="btn" data-action="log-extra">Log Activity</button>
      ${logs.map(l => `
        <div class="list-item">
          <div class="li-main"><b>${esc(l.name)}</b><span>${WORKOUT_TYPES[l.type] || ''} · ${l.minutes} min</span></div>
          <span class="li-xp">+${l.xp} XP</span>
          <button class="del" data-action="del-extra" data-id="${l.id}" aria-label="Remove ${esc(l.name)}">×</button>
        </div>`).join('')}
    </section>`;
}

/* ================= Workout ================= */

let wIdx = 0;
let rest = null;  // { until, total }
let timer = null; // { until, total }

function restSeconds(e) {
  const ex = P.exById(e.id);
  if (ex.pattern === 'mobility' || ex.pattern === 'cardio') return 15;
  if (ex.pattern === 'cond') return 30;
  if (ex.kind === 'time') return 45;
  if (ex.kind === 'load') return e.main ? (S().goal === 'strength' ? 150 : 105) : 75;
  return 60;
}

function startWorkout(i) {
  const q = Game.todayQuest();
  if (q.type !== 'workout') return go('quests');
  const firstOpen = q.exercises.findIndex(e => e.done.some(d => !d));
  wIdx = Number.isInteger(i) ? i : Math.max(0, firstOpen);
  rest = null;
  timer = null;
  if (route !== 'workout') workoutReturn = route;
  go('workout');
}

function workoutScreen() {
  const q = Game.todayQuest();
  if (q.type !== 'workout') return questsScreen();
  const n = q.exercises.length;
  wIdx = clamp(wIdx, 0, n - 1);
  const e = q.exercises[wIdx];
  const ex = P.exById(e.id);
  const { done, total } = Game.questProgress(q);
  const exDone = q.exercises.filter(x => x.done.every(Boolean)).length;
  const setIdx = e.done.findIndex(d => !d);
  const time = ex.kind === 'time';
  const last = Game.lastPerformance(e.id);

  let body;
  if (rest) {
    const rem = Math.max(0, Math.ceil((rest.until - Date.now()) / 1000));
    body = `
      <div class="rest">
        <p class="eyebrow center">Rest</p>
        <div class="ring-wrap">${ring(rem, rest.total, 'seconds', 'rring')}</div>
        <p class="muted center">Up next: ${setIdx < 0 ? 'next exercise' : `Set ${setIdx + 1} of ${e.sets}`}</p>
        <div class="row"><button class="btn ghost" data-action="rest-add">+15 s</button><button class="btn" data-action="rest-skip">Skip Rest</button></div>
      </div>`;
  } else if (setIdx < 0) {
    body = `
      <div class="ex-cleared">${icon('check', 28)}<b>Exercise cleared</b></div>
      <button class="btn" data-action="w-next">Next Exercise</button>`;
  } else {
    const shown = timer ? Math.max(0, Math.ceil((timer.until - Date.now()) / 1000)) : e.cur;
    body = `
      <div class="ring-wrap">${ring(shown, time ? (timer ? timer.total : e.hi) : e.hi, time ? 'seconds' : `/ ${e.hi} ${ex.perSide ? 'per side' : 'reps'}`, 'wring')}</div>
      <div class="ring-controls">
        <button class="round" data-action="cur" data-v="-1" aria-label="Less">${icon('minus', 22)}</button>
        <span class="ring-hint">${time ? 'Seconds' : 'Reps you did'}</span>
        <button class="round" data-action="cur" data-v="1" aria-label="More">${icon('plus', 22)}</button>
      </div>
      ${ex.kind === 'load' ? `
        <div class="weight-row">
          <button class="round sm" data-action="w" data-v="-1" aria-label="Lighter">${icon('minus', 18)}</button>
          <div><small>Weight${ex.perHand ? ' (each hand)' : ''}</small><b>${C.fmtW(S(), e.w)}</b></div>
          <button class="round sm" data-action="w" data-v="1" aria-label="Heavier">${icon('plus', 18)}</button>
        </div>` : ''}
      <div class="setdots">${e.done.map((d, j) => `<span class="${d ? 'on' : ''}${j === setIdx ? ' cur' : ''}">${d ? d.r : j + 1}</span>`).join('')}</div>
      ${time ? `<button class="btn ghost" data-action="w-timer">${timer ? 'Stop Timer' : `Start ${e.cur}s Timer`}</button>` : ''}
      <button class="btn" data-action="w-complete">Complete Set</button>`;
  }

  return `
    <section class="workout">
      <header class="pagehead sub">
        <button class="back" data-action="back" aria-label="Back">${icon('back', 22)}</button>
        <h1 class="title">Quest <span class="accent">${wIdx + 1}/${n}</span></h1>
        <div class="pagehead-right"><button class="icon-btn" data-action="w-list" aria-label="All exercises">${icon('list', 20)}</button></div>
      </header>
      <div class="bar thin"><i style="width:${(done / total) * 100}%"></i></div>
      <div class="pips">${q.exercises.map((x, k) => `<button class="pip${k === wIdx ? ' cur' : ''}${x.done.every(Boolean) ? ' done' : ''}" data-action="w-go" data-v="${k}" aria-label="Exercise ${k + 1}"></button>`).join('')}</div>
      <p class="mq-label center">${miniTitle(e, ex)} ${e.done.every(Boolean) ? '· Cleared' : miniReward(e)}</p>
      <h2 class="ex-title">${ex.name}</h2>
      <p class="ex-sub">${setIdx < 0 ? 'All sets done' : `Set ${setIdx + 1} of ${e.sets}`} · ${prescriptionText(e, ex)} · ${exDone}/${n} cleared</p>
      <div class="ex-scene">${scene({ seed: 50 + wIdx, w: 400, h: 180, picto: e.pattern, moon: false, sparks: 10 })}</div>
      ${body}
      <div class="links">
        <button class="link" data-action="w-prev">${icon('back', 14)} Previous</button>
        ${!rest && setIdx >= 0 && !e.done.some(Boolean) ? `<button class="link" data-action="swap" data-ex="${wIdx}">${icon('swap', 14)} Swap</button>` : ''}
        <button class="link" data-action="w-next">Skip ${icon('chevron', 14)}</button>
      </div>
      <p class="cue">${ex.cue}</p>
      ${last ? `<p class="cue">Last time (${prettyDate(last.date, { month: 'short', day: 'numeric' })}): ${last.sets.map(d => d.r).join(', ')}${ex.kind === 'load' ? ` @ ${C.fmtW(S(), last.sets[0].w)}` : ''}</p>` : ''}
    </section>`;
}

function completeCurrentSet(reps) {
  const q = Game.todayQuest();
  const e = q.exercises[wIdx];
  if (!e) return;
  const j = Game.completeSet(wIdx, reps);
  if (j < 0) return;
  sfx('set');
  timer = null;
  if (q.complete) {
    rest = null;
    go('home');
    pump();
    return;
  }
  if (!e.done.some(d => !d)) {
    const next = q.exercises.findIndex((x, k) => k > wIdx && x.done.some(d => !d));
    const any = next >= 0 ? next : q.exercises.findIndex(x => x.done.some(d => !d));
    if (any >= 0) wIdx = any;
  }
  const secs = restSeconds(e);
  rest = { until: Date.now() + secs * 1000, total: secs };
  render();
  pump();
}

function updateTimers() {
  if (route !== 'workout') return;
  const now = Date.now();
  if (rest) {
    const rem = Math.ceil((rest.until - now) / 1000);
    if (rem <= 0) {
      rest = null;
      sfx('rest');
      render();
    } else {
      setRing('rring', rem, rest.total);
    }
  } else if (timer) {
    const rem = Math.ceil((timer.until - now) / 1000);
    if (rem <= 0) {
      const total = timer.total;
      timer = null;
      sfx('rest');
      completeCurrentSet(total);
    } else {
      setRing('wring', rem, timer.total);
    }
  }
}

function workoutListHtml() {
  const q = Game.todayQuest();
  return `
    <h2 class="modal-title">${questTitle(q)}</h2>
    <div class="options">${q.exercises.map((e, k) => {
      const ex = P.exById(e.id);
      return `<button class="option${k === wIdx ? ' on' : ''}" data-action="w-go" data-v="${k}"><b>${ex.name} · ${e.done.filter(Boolean).length}/${e.sets}</b><span>${prescriptionText(e, ex)}</span></button>`;
    }).join('')}</div>
    <button class="btn ghost" data-action="close">Close</button>`;
}

function openSwap(i) {
  const q = Game.todayQuest();
  const e = q.exercises[i];
  if (!e || e.done.some(Boolean)) return toast('Undo the logged sets first');
  const options = P.candidates(S(), e.pattern).all.filter(x => x.id !== e.id);
  if (!options.length) return toast('No other options with your equipment');
  const equip = ex => {
    const parts = ex.eq.map(k => EQUIPMENT[k]);
    if (ex.any) parts.push(ex.any.map(k => EQUIPMENT[k]).join(' or '));
    return parts.length ? parts.join(' + ') : 'No equipment';
  };
  queueModal(`
    <h2 class="modal-title">Swap Exercise</h2>
    <p class="sub">${PATTERNS[e.pattern]} options for your equipment</p>
    <div class="options">${options.map(x => `
      <button class="option" data-action="swap-to" data-ex="${i}" data-id="${x.id}"><b>${x.name}</b><span>${equip(x)}</span></button>`).join('')}</div>
    <button class="btn ghost" data-action="close">Cancel</button>`);
}

/* ================= Stats ================= */

let allocMode = false;
let progPeriod = 7;

function statsScreen() {
  const s = S();
  const r = Game.rankFor(s.level);
  const need = Game.xpNeeded(s.level);
  const gains = Game.recentStatGains(7);
  const next = Game.nextRank(s.level);
  return `
    ${pageHead('Character')}
    <section class="card char-card">
      <div class="char-portrait">
        <div class="char-scene">${scene({ seed: 77, w: 400, h: 230, moon: true, sparks: 14, city: true })}</div>
        <div class="char-avatar">${playerAvatar(190)}</div>
        <button class="mini char-edit" data-action="edit-avatar">${icon('palette', 14)} Customize</button>
      </div>
      <div class="char-top">
        <div><b class="lv-big">${esc(s.name)} · Lv. ${s.level}</b><span class="muted small">${esc(Game.titleFor())} · ${next ? `${next.rank}-Rank at Lv. ${next.min}` : 'Max rank'}</span></div>
        ${emblem(r.rank, r.color, { size: 54 })}
      </div>
      ${s.portrait || defaultPortrait ? '' : '<p class="hint" style="margin-top:4px">Your outfit and aura evolve at C-Rank and A-Rank.</p>'}
      <div class="xpbar"><i style="width:${Math.min(100, (s.xp / need) * 100)}%"></i></div>
      <div class="row-between small muted"><span>${s.totalXp.toLocaleString()} total XP</span><span>${s.xp} / ${need} XP</span></div>
    </section>

    <section class="card">
      <h3>Attributes</h3>
      ${STATS.map(st => `
        <div class="attr">
          ${icon(st.icon, 18)}
          <span class="attr-name">${st.name}</span>
          <span class="attr-bar" title="Progress to next automatic point"><i style="width:${Game.statProgress(st.key) * 100}%"></i></span>
          <b>${s.stats[st.key]}</b>
          <em class="gain">${gains[st.key] ? `(+${gains[st.key]})` : ''}</em>
          ${allocMode && s.statPoints ? `<button class="plus" data-action="stat" data-key="${st.key}" aria-label="Add a point to ${st.name}">${icon('plus', 16)}</button>` : ''}
        </div>`).join('')}
      <div class="points-row"><span>Available Points</span><b>${icon('star', 16)} ${s.statPoints}</b></div>
      ${s.statPoints ? `<button class="btn" data-action="alloc">${allocMode ? 'Done' : 'Allocate Points'}</button>` : ''}
      <p class="hint">Attributes also grow on their own: lifting raises STR, single-leg and conditioning work raise AGI, core and every workout raise END, recovery days raise VIT, and tracking your body raises INT. (+N) = gained this week.</p>
    </section>

    ${progressHtml()}
    ${potentialHtml()}
    ${recordHtml()}`;
}

function progressHtml() {
  const { cur, prev } = Game.periodStats(progPeriod);
  return `
    <section class="card">
      <div class="row-between"><h3>Progress</h3></div>
      ${seg('period', [[7, 'Weekly'], [30, 'Monthly']], progPeriod)}
      <div class="kpi"><div><span class="muted small">XP Gained</span><b>${cur.xp.toLocaleString()} XP</b></div><em class="${cur.xp >= prev.xp ? 'up' : 'down'}">${pct(cur.xp, prev.xp)}</em></div>
      <div class="chart">${barChart(progPeriod)}</div>
      <div class="kpi"><div><span class="muted small">Workouts Completed</span><b>${cur.workouts}</b></div><em class="${cur.workouts >= prev.workouts ? 'up' : 'down'}">${pct(cur.workouts, prev.workouts)}</em></div>
    </section>`;
}

function barChart(days) {
  const W = 340, H = 150, top = 14, bottom = 20;
  const keys = [];
  for (let i = days - 1; i >= 0; i--) keys.push(addDays(dateKey(), -i));
  const vals = keys.map(k => Math.max(0, S().xpByDay[k] || 0));
  const max = Math.max(50, ...vals);
  const bw = W / keys.length;
  const id = `bg${Date.now() % 100000}`;
  let out = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent2)"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity=".35"/></linearGradient></defs>
    <line x1="0" x2="${W}" y1="${H - bottom}" y2="${H - bottom}" stroke="var(--line)"/>`;
  keys.forEach((k, i) => {
    const v = vals[i];
    const h = (v / max) * (H - top - bottom);
    const x = i * bw + bw * (days > 7 ? 0.15 : 0.25);
    const w = bw * (days > 7 ? 0.7 : 0.5);
    if (v) out += `<rect x="${x.toFixed(1)}" y="${(H - bottom - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="url(#${id})"/>`;
    if (days <= 7 && v) out += `<text x="${(x + w / 2).toFixed(1)}" y="${(H - bottom - h - 4).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--accent2)">${v}</text>`;
    if (days <= 7 || i % 5 === 4) {
      const label = days <= 7 ? DOW[new Date(keys[i] + 'T12:00').getDay()] : Number(k.slice(8));
      out += `<text x="${(x + w / 2).toFixed(1)}" y="${H - 5}" text-anchor="middle" font-size="9" fill="var(--muted)">${label}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="XP per day">${out}</svg>`;
}

function potValue(row, v) {
  if (row.kind !== 'load') return String(Math.floor(v));
  return fmtNum(roundTo(C.toDispW(S(), v), C.imperial(S()) ? 5 : 2.5));
}

function potentialHtml() {
  const rows = C.potentialRows(S(), P.planExercises(S()), Game.liftHistory());
  return `
    <section class="card">
      <h3>Strength Potential</h3>
      ${rows.map(r => `
        <div class="pot">
          <div class="pot-name"><b>${r.name}</b><span>${r.kind === 'load' ? `1-rep max${r.perHand ? ' per hand' : ''} (${C.wUnit(S())})` : 'reps in one set'} · ${r.level}${r.estimated ? ' · estimated' : ''}</span></div>
          <div class="pot-grid">${['Now', '3 mo', '6 mo', '1 yr', 'Max'].map((h, i) => `<div class="${i === 4 ? 'max' : ''}"><small>${h}</small><b>${potValue(r, r.values[i])}</b></div>`).join('')}</div>
        </div>`).join('')}
      <div class="row">
        <button class="btn ghost" data-action="test" data-id="pushup">Test Push-ups</button>
        ${S().equipment.bar ? '<button class="btn ghost" data-action="test" data-id="pullup">Test Pull-ups</button>' : ''}
      </div>
      <p class="hint"><b>Max</b> is a realistic natural ceiling after 5+ years of consistent training. "Estimated" numbers firm up once you log workouts or take a max test.</p>
    </section>`;
}

function recordHtml() {
  const s = S();
  const workouts = Object.values(s.quests).filter(q => q.complete && !Game.isLight(q));
  let sets = 0;
  let volume = 0;
  for (const q of workouts) {
    for (const e of q.exercises) {
      for (const d of e.done) {
        sets++;
        if (d.w) volume += C.toDispW(s, d.w) * d.r;
      }
    }
  }
  return `
    <section class="card">
      <h3>Record</h3>
      <div class="tiles cols-2">
        <div class="tile"><b>${workouts.length}</b><span>Workouts</span></div>
        <div class="tile"><b>${Math.max(s.bestStreak, Game.computeStreak())}</b><span>Best streak</span></div>
        <div class="tile"><b>${sets}</b><span>Sets logged</span></div>
        <div class="tile"><b>${volume >= 10000 ? `${fmtNum(volume / 1000, 0)}k` : fmtNum(volume, 0)}</b><span>Volume (${C.wUnit(s)})</span></div>
      </div>
    </section>`;
}

/* ================= Achievements ================= */

let awardFilter = 'all';

function awardsScreen() {
  const s = S();
  const all = Game.ACHIEVEMENTS;
  const list = all.filter(a => awardFilter === 'all' || (awardFilter === 'unlocked') === !!s.unlocked[a.id]);
  const count = all.filter(a => s.unlocked[a.id]).length;
  return `
    ${pageHead('Achievements')}
    ${seg('award-filter', [['all', 'All'], ['unlocked', 'Unlocked'], ['locked', 'Locked']], awardFilter)}
    <p class="hint center">${count} / ${all.length} unlocked</p>
    <section class="card list">
      ${list.length ? list.map(a => {
        const un = s.unlocked[a.id];
        const hide = a.hidden && !un;
        return `
          <div class="ach${un ? ' on' : ''}">
            ${badge(hide ? 'eye' : a.icon, { size: 50, locked: !un })}
            <div class="ach-main">
              <b>${hide ? 'Hidden Achievement' : a.name}</b>
              <span>${hide ? '???' : a.desc}</span>
              <em>${hide ? '???' : `+${a.xp} XP${a.gold ? ` · +${a.gold} Gold` : ''}`}</em>
            </div>
            ${un ? `<small>${prettyDate(un, { month: 'short', day: 'numeric' })}</small>` : ''}
          </div>`;
      }).join('') : '<p class="empty">Nothing here yet.</p>'}
    </section>`;
}

/* ================= More ================= */

function moreScreen() {
  const s = S();
  const r = Game.rankFor(s.level);
  const rows = [
    ['body', 'body', 'Body & Goals', 'Weight, body fat, calories, projections, photos'],
    ['history', 'history', 'Workout History', 'Every quest you\'ve cleared'],
    ['shop', 'shop', 'Rewards Shop', `${s.gold.toLocaleString()} gold to spend`],
    ['settings', 'gear', 'Settings', 'Profile, plan, sound, theme, backup'],
  ];
  return `
    ${pageHead('More')}
    <section class="card profile-card">
      <span class="profile-avatar">${playerAvatar(72)}</span>
      <div><b>${esc(s.name)}</b><span>Lv. ${s.level} · ${esc(Game.titleFor())}</span><span>${GOALS[s.goal].name} · ${s.trainingDays.length} days/week</span></div>
    </section>
    <section class="card menu">
      ${rows.map(([r2, ic, title, sub]) => `
        <button class="menu-row" data-action="go" data-v="${r2}">
          <span class="menu-ic">${icon(ic, 20)}</span>
          <span class="menu-text"><b>${title}</b><small>${sub}</small></span>
          ${r2 === 'shop' && (Game.dailyClaimable() || Game.chestClaimable()) ? '<span class="dot"></span>' : ''}
          ${icon('chevron', 16)}
        </button>`).join('')}
    </section>`;
}

/* ================= Body ================= */

let projMonths = 6;
let comparePose = 'front';

function bodyScreen() {
  const s = S();
  const bf = C.bodyFat(s);
  const lean = C.leanKg(s);
  const unit = C.wUnit(s);
  const weeks = Math.round(projMonths * 4.345);
  const proj = C.projectBody(s, Math.max(weeks, 104));
  const then = proj.weeks[weeks];
  const leanMax = C.maxLeanKg(s);
  const fitBf = s.sex === 'male' ? 12 : 20;
  const dW = then.kg - s.weightKg;
  const sign = v => (v > 0 ? '+' : v < 0 ? '−' : '±');
  const pot = C.potentialRows(s, P.planExercises(s), Game.liftHistory())[0];
  const potLine = pot ? `${pot.name}: ${potValue(pot, pot.values[0])} → <b>${potValue(pot, pot.values[projMonths >= 12 ? 3 : projMonths >= 6 ? 2 : 1])}</b>${pot.kind === 'load' ? ` ${unit} (1-rep max)` : ' reps'}` : '';
  const showTarget = s.goal === 'fatloss' || s.goal === 'muscle';

  return `
    ${subHead('Body & Goals')}
    <section class="card">
      <div class="tiles">
        <div class="tile"><b>${fmtNum(C.toDispW(s, s.weightKg))}</b><span>Weight (${unit})</span></div>
        <div class="tile"><b>${fmtNum(bf.pct)}%</b><span>Body fat${bf.source === 'estimate' ? ' (est.)' : ''}</span></div>
        <div class="tile"><b>${fmtNum(C.toDispW(s, lean), 0)}</b><span>Lean (${unit})</span></div>
      </div>
      <p class="hint center">${C.fmtHeight(s)} · BMI ${fmtNum(C.bmi(s))} · ${C.bodyFatLabel(s.sex, bf.pct)}<br>${bf.source === 'estimate'
        ? 'Body fat is a rough guess from BMI. Add measurements to make it accurate.'
        : `Body fat from tape measurements, ${prettyDate(bf.date)}`}</p>
      <div class="row"><button class="btn ghost" data-action="log-weight">Log Weight</button><button class="btn ghost" data-action="log-measures">Measurements</button></div>
    </section>

    <section class="card">
      <h3>Goal · ${GOALS[s.goal].name}</h3>
      <div class="summary">
        ${showTarget ? `<div class="sum-row"><span>Goal weight</span><b>${C.fmtW(s, C.targetKg(s), 1)} <button class="mini" data-action="edit-target">Edit</button></b></div>` : ''}
        <div class="sum-row"><span>Daily calories</span><b>${C.calorieTarget(s).toLocaleString()} kcal</b></div>
        <div class="sum-row"><span>Daily protein</span><b>${C.proteinTarget(s)} g</b></div>
        <div class="sum-row"><span>Maintenance</span><b>${(Math.round(C.maintenance(s) / 10) * 10).toLocaleString()} kcal</b></div>
      </div>
      <p class="hint center">${etaText(s)}</p>
      ${s.goal === 'muscle' && bf.pct >= (s.sex === 'male' ? 20 : 30)
        ? `<p class="hint center" style="color:var(--gold)">At ${fmtNum(bf.pct, 0)}% body fat, a Recomp or Lose fat phase first usually makes new muscle show sooner.</p>` : ''}
    </section>

    <section class="card">
      <h3>Where You Could Be</h3>
      ${seg('proj', [[1, '1 mo'], [3, '3 mo'], [6, '6 mo'], [12, '1 year']], projMonths)}
      <div class="tiles" style="margin-top:12px">
        <div class="tile"><b>${fmtNum(C.toDispW(s, then.kg), 0)}</b><span>${sign(dW)}${fmtNum(Math.abs(C.toDispW(s, dW)), 0)} ${unit}</span></div>
        <div class="tile"><b>${fmtNum(then.bf, 0)}%</b><span>Body fat</span></div>
        <div class="tile"><b>${sign(then.lean - lean)}${fmtNum(Math.abs(C.toDispW(s, then.lean - lean)), 1)}</b><span>Muscle ${unit}</span></div>
      </div>
      ${potLine ? `<p class="hint center">${potLine}</p>` : ''}
      <div class="chart">${weightChart(proj, weeks)}</div>
      <p class="hint"><b>Natural muscle potential:</b> your frame can realistically carry about ${C.fmtW(s, leanMax, 1)} of lean mass (you're at ${fmtNum((lean / leanMax) * 100, 0)}%). At ${fitBf}% body fat that's roughly ${C.fmtW(s, leanMax / (1 - fitBf / 100), 1)}.</p>
      <p class="hint">Projections assume you follow the plan and hit your calories and protein. Real progress varies with sleep, genetics and consistency. Estimates only, not medical advice.</p>
    </section>

    <section class="card">
      <h3>Progress Photos</h3>
      ${photosHtml()}
    </section>`;
}

function photosHtml() {
  const add = '<button class="btn" data-action="photo-add">Add Progress Photo</button>';
  const photos = G.photos;
  if (!photos.length) {
    return `<p class="hint" style="margin-top:0">Take front, side and back photos every 2–4 weeks in the same spot and lighting, then compare them side by side. They stay on this phone.</p>${add}`;
  }
  const list = photos.filter(p => p.pose === comparePose);
  let compare;
  if (list.length >= 2) {
    const a = list[0];
    const b = list[list.length - 1];
    const dKg = C.toDispW(S(), b.kg - a.kg);
    compare = `
      <div class="compare">
        <figure><img src="${a.data}" alt="First ${a.pose} photo"><figcaption>${prettyDate(a.date, { month: 'short', day: 'numeric', year: '2-digit' })} · ${C.fmtW(S(), a.kg, 1)}</figcaption></figure>
        <figure><img src="${b.data}" alt="Latest ${b.pose} photo"><figcaption>${prettyDate(b.date, { month: 'short', day: 'numeric', year: '2-digit' })} · ${C.fmtW(S(), b.kg, 1)}</figcaption></figure>
      </div>
      <p class="hint center">${plural(daysBetween(a.date, b.date), 'day')} apart · ${dKg > 0 ? '+' : dKg < 0 ? '−' : '±'}${fmtNum(Math.abs(dKg))} ${C.wUnit(S())}</p>`;
  } else {
    compare = `<p class="hint center">Add ${list.length ? 'another' : 'two'} ${comparePose} photo${list.length ? '' : 's'} on different days to compare.</p>`;
  }
  return `
    ${seg('cmp-pose', [['front', 'Front'], ['side', 'Side'], ['back', 'Back']], comparePose)}
    ${compare}
    <div class="thumbs">${[...photos].reverse().map(p => `
      <button class="thumb" data-action="photo-view" data-id="${p.id}"><img src="${p.data}" alt="${p.pose} photo ${p.date}"><span>${prettyDate(p.date, { month: 'short', day: 'numeric' })}</span></button>`).join('')}</div>
    ${add}`;
}

function weightChart(proj, weeks) {
  const s = S();
  const W = 340, H = 170, L = 34, R = 10, T = 14, B = 24;
  const today = dateKey();
  const logs = s.weights.filter(w => daysBetween(w.date, today) <= 365);
  const start = logs.length ? logs[0].date : today;
  const past = daysBetween(start, today);
  const total = Math.max(1, past + weeks * 7);
  const projPts = proj.weeks.slice(0, weeks + 1).map((p, i) => [past + i * 7, p.kg]);
  const histPts = logs.map(w => [daysBetween(start, w.date), w.kg]);
  const showTarget = s.goal === 'fatloss' || s.goal === 'muscle';
  const target = C.targetKg(s);
  const ys = [...projPts, ...histPts].map(p => p[1]).concat(showTarget ? [target] : []);
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  const pad = Math.max(1, (hi - lo) * 0.15);
  lo -= pad;
  hi += pad;
  const sx = d => L + (d / total) * (W - L - R);
  const sy = kg => T + ((hi - kg) / (hi - lo)) * (H - T - B);
  const path = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join('');
  const label = kg => fmtNum(C.toDispW(s, kg), 0);
  const short = k => prettyDate(k, { month: 'short', day: 'numeric' });
  let out = `
    <line x1="${L}" x2="${W - R}" y1="${sy(hi - pad)}" y2="${sy(hi - pad)}" stroke="var(--line)" stroke-dasharray="2 4"/>
    <line x1="${L}" x2="${W - R}" y1="${sy(lo + pad)}" y2="${sy(lo + pad)}" stroke="var(--line)" stroke-dasharray="2 4"/>
    <text x="${L - 6}" y="${sy(hi - pad) + 3}" text-anchor="end" font-size="9" fill="var(--muted)">${label(hi - pad)}</text>
    <text x="${L - 6}" y="${sy(lo + pad) + 3}" text-anchor="end" font-size="9" fill="var(--muted)">${label(lo + pad)}</text>`;
  if (showTarget) {
    out += `<line x1="${L}" x2="${W - R}" y1="${sy(target)}" y2="${sy(target)}" stroke="var(--gold)" stroke-opacity=".6" stroke-dasharray="5 4"/>
      <text x="${W - R}" y="${sy(target) - 4}" text-anchor="end" font-size="9" fill="var(--gold)">goal ${label(target)}</text>`;
  }
  out += `<path d="${path(projPts)}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 4"/>`;
  if (histPts.length > 1) out += `<path d="${path(histPts)}" fill="none" stroke="var(--accent2)" stroke-width="2.5"/>`;
  histPts.forEach(p => { out += `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="2.5" fill="var(--accent2)"/>`; });
  out += `<line x1="${sx(past)}" x2="${sx(past)}" y1="${T}" y2="${H - B}" stroke="var(--accent)" stroke-opacity=".5"/>
    <text x="${sx(past)}" y="${H - 8}" text-anchor="${past ? 'middle' : 'start'}" font-size="9" fill="var(--accent2)">today</text>
    <text x="${W - R}" y="${H - 8}" text-anchor="end" font-size="9" fill="var(--muted)">${short(addDays(today, weeks * 7))}</text>`;
  if (past > 20) out += `<text x="${L}" y="${H - 8}" font-size="9" fill="var(--muted)">${short(start)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight history and projection">${out}</svg>`;
}

/* ================= History ================= */

let histFilter = 'all';
let histOpen = null;
let calMonth = null;

function historyScreen() {
  const s = S();
  const items = [];
  for (const [k, q] of Object.entries(s.quests)) {
    if (!q.complete) continue;
    const light = Game.isLight(q);
    if (histFilter !== 'all' && histFilter !== (light ? 'recovery' : 'workout')) continue;
    const sets = q.type === 'workout' ? q.exercises.reduce((n, e) => n + e.done.length, 0) : 0;
    items.push({
      k, ts: q.completedAt || 0, key: k, icon: light ? 'moon' : 'dumbbell', title: questTitle(q),
      detail: q.type === 'workout' ? `${plural(q.exercises.length, 'exercise')} · ${plural(sets, 'set')}` : 'Recovery quest',
      xp: q.xpEarned ?? q.reward, gold: q.goldEarned ?? Game.questGold(q), q,
    });
  }
  if (histFilter === 'all' || histFilter === 'extra') {
    for (const l of s.logs) items.push({ k: l.date, ts: l.ts, key: l.id, icon: 'bolt', title: l.name, detail: `${WORKOUT_TYPES[l.type] || 'Activity'} · ${l.minutes} min`, xp: l.xp, gold: 0 });
  }
  items.sort((a, b) => b.k.localeCompare(a.k) || b.ts - a.ts);

  return `
    ${subHead('Workout History')}
    <section class="card">${calendarHtml()}</section>
    ${seg('hist-filter', [['all', 'All'], ['workout', 'Workouts'], ['recovery', 'Recovery'], ['extra', 'Extra']], histFilter)}
    <section class="card list">
      ${items.length ? items.slice(0, 60).map(i => `
        <button class="hist" data-action="hist-open" data-id="${i.key}">
          ${badge(i.icon, { size: 44 })}
          <div class="hist-main">
            <b>${esc(i.title)}</b>
            <span>${esc(i.detail)}</span>
            <em>+${i.xp} XP${i.gold ? ` · +${i.gold} Gold` : ''}</em>
            <small>${prettyDate(i.k)}${i.ts ? ` · ${new Date(i.ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : ''}</small>
          </div>
          <span class="check">${icon('check', 16)}</span>
        </button>
        ${histOpen === i.key && i.q && i.q.type === 'workout' ? `<div class="day-detail">${i.q.exercises.map(e => {
          const ex = P.exById(e.id);
          return `<div class="day-ex"><b>${ex.name}</b><span>${e.done.map(d => d.r).join(', ')}${ex.kind === 'time' ? ' s' : ' reps'}${ex.kind === 'load' ? ` @ ${C.fmtW(S(), e.done[0].w)}` : ''}</span></div>`;
        }).join('')}</div>` : ''}`).join('') : '<p class="empty">No cleared quests yet. Your first one is waiting on the Home tab.</p>'}
    </section>`;
}

function calendarHtml() {
  const s = S();
  const now = new Date();
  if (!calMonth) calMonth = { y: now.getFullYear(), m: now.getMonth() };
  const { y, m } = calMonth;
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const today = dateKey();
  let cells = DOW.map(d => `<div class="dow">${d[0]}</div>`).join('');
  for (let i = 0; i < first.getDay(); i++) cells += '<div class="d blank"></div>';
  for (let d = 1; d <= days; d++) {
    const k = dateKey(new Date(y, m, d));
    const q = s.quests[k];
    let cls = 'd';
    if (q && q.complete) cls += Game.isLight(q) ? ' rec' : ' done';
    else if (s.shielded[k]) cls += ' shield';
    else if (k < today && k >= s.created) cls += ' miss';
    if (k === today) cls += ' today';
    cells += `<div class="${cls}">${d}</div>`;
  }
  return `
    <div class="cal-head">
      <button class="cal-nav" data-action="cal" data-v="-1" aria-label="Previous month">${icon('back', 16)}</button>
      <b>${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
      <button class="cal-nav" data-action="cal" data-v="1" aria-label="Next month">${icon('chevron', 16)}</button>
    </div>
    <div class="cal">${cells}</div>
    <div class="legend">
      <span><i class="lg done"></i>Workout</span><span><i class="lg rec"></i>Recovery</span><span><i class="lg miss"></i>Missed</span><span><i class="lg shield"></i>Shielded</span>
    </div>`;
}

/* ================= Shop ================= */

let shopTab = 'shop';

function shopScreen() {
  const s = S();
  const itemState = it => {
    if (it.id === 'boost' && Game.boostActive()) return 'Active today';
    if (it.id === 'shield') return `${s.shields}/2 held`;
    return '';
  };
  const buyBtn = (kind, id, price) => `<button class="buy" data-action="buy" data-kind="${kind}" data-id="${id}" ${s.gold < price ? 'disabled' : ''}>${coin(14)} ${price}</button>`;

  const shop = `
    <section class="card list">
      <h3>Items</h3>
      ${SHOP.map(it => `
        <div class="shop-row">
          ${badge(it.icon, { size: 50 })}
          <div class="shop-main"><b>${it.name}</b><span>${it.desc}</span>${itemState(it) ? `<em>${itemState(it)}</em>` : ''}</div>
          ${buyBtn('item', it.id, it.price)}
        </div>`).join('')}
    </section>
    <section class="card list">
      <h3>Themes</h3>
      ${Object.entries(THEMES).map(([id, t]) => {
        const owned = s.owned.themes.includes(id);
        return `
          <div class="shop-row">
            <span class="swatch" style="--sw:${t.swatch}"></span>
            <div class="shop-main"><b>${t.name}</b><span>${owned ? (s.theme === id ? 'Equipped' : 'Owned') : 'Recolors the whole app'}</span></div>
            ${owned ? (s.theme === id ? `<span class="owned">${icon('check', 16)}</span>` : `<button class="buy ghost" data-action="equip-theme" data-id="${id}">Equip</button>`) : buyBtn('theme', id, t.price)}
          </div>`;
      }).join('')}
    </section>
    <section class="card list">
      <h3>Titles</h3>
      <p class="hint" style="margin-top:0">Shown under your name instead of your rank title.</p>
      ${TITLES.map(t => {
        const owned = s.owned.titles.includes(t.id);
        return `
          <div class="shop-row">
            ${badge('tag', { size: 50 })}
            <div class="shop-main"><b>${t.name}</b><span>${owned ? (s.title === t.id ? 'Equipped' : 'Owned') : 'Cosmetic title'}</span></div>
            ${owned ? (s.title === t.id ? `<button class="buy ghost" data-action="equip-title" data-id="">Unequip</button>` : `<button class="buy ghost" data-action="equip-title" data-id="${t.id}">Equip</button>`) : buyBtn('title', t.id, t.price)}
          </div>`;
      }).join('')}
    </section>`;

  const rewards = `
    <section class="card list">
      <div class="shop-row">
        ${badge('gift', { size: 50 })}
        <div class="shop-main"><b>Daily Bonus</b><span>Open the app each day for ${Game.DAILY_BONUS} gold.</span></div>
        ${Game.dailyClaimable() ? '<button class="buy" data-action="claim-daily">Claim</button>' : `<span class="owned">${icon('check', 16)}</span>`}
      </div>
      <div class="shop-row">
        ${badge('chest', { size: 50 })}
        <div class="shop-main"><b>Weekly Chest</b><span>Clear ${Game.CHEST_GOAL} quests this week (${Math.min(Game.weekCleared(), Game.CHEST_GOAL)}/${Game.CHEST_GOAL}) for ${Game.CHEST_GOLD} gold.</span></div>
        ${Game.chestClaimable() ? '<button class="buy" data-action="claim-chest">Claim</button>'
          : s.chestWeek === Game.weekStart() ? `<span class="owned">${icon('check', 16)}</span>` : `<span class="muted small">${Math.min(Game.weekCleared(), Game.CHEST_GOAL)}/${Game.CHEST_GOAL}</span>`}
      </div>
    </section>
    <section class="card">
      <h3>How to Earn Gold</h3>
      <div class="summary">
        <div class="sum-row"><span>Workout quest</span><b>${coin(14)} ${P.workoutGold(s.level)}</b></div>
        <div class="sum-row"><span>Recovery quest</span><b>${coin(14)} ${P.recoveryGold(s.level)}</b></div>
        <div class="sum-row"><span>Achievements</span><b>${coin(14)} 15–1,000</b></div>
        <div class="sum-row"><span>Daily bonus</span><b>${coin(14)} ${Game.DAILY_BONUS}</b></div>
        <div class="sum-row"><span>Weekly chest</span><b>${coin(14)} ${Game.CHEST_GOLD}</b></div>
      </div>
      <p class="hint">Quest gold grows with your level. Lifetime gold earned: ${(s.goldTotal || 0).toLocaleString()}.</p>
    </section>`;

  return `
    ${subHead('Rewards', goldChip())}
    ${seg('shop-tab', [['shop', 'Shop'], ['rewards', 'Rewards']], shopTab)}
    ${shopTab === 'shop' ? shop : rewards}`;
}

/* ================= Settings ================= */

function settingsScreen() {
  const s = S();
  const row = (ic, title, sub, action, right = icon('chevron', 16)) => `
    <button class="menu-row" data-action="${action}">
      <span class="menu-ic">${icon(ic, 20)}</span>
      <span class="menu-text"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>
      ${right}
    </button>`;
  return `
    ${subHead('Settings')}
    <section class="card menu">
      ${row('user', 'Profile & Plan', 'Name, body, goal, equipment, training days', 'open-profile')}
      ${row('palette', 'Character Appearance', 'Hair, eyes and skin tone', 'edit-avatar')}
      ${row('sound', 'Sound Effects', s.sound ? 'On' : 'Off', 'toggle-sound', `<span class="switch${s.sound ? ' on' : ''}"><i></i></span>`)}
    </section>
    <section class="card">
      <h3>Appearance</h3>
      <div class="theme-row">${Object.entries(THEMES).map(([id, t]) => {
        const owned = s.owned.themes.includes(id);
        return `<button class="theme-pick${s.theme === id ? ' on' : ''}${owned ? '' : ' locked'}" data-action="${owned ? 'equip-theme' : 'go'}" data-id="${id}" data-v="shop">
          <span class="swatch" style="--sw:${t.swatch}"></span><small>${owned ? t.name : `${icon('lock', 12)} ${t.price}`}</small></button>`;
      }).join('')}</div>
      <p class="hint">Unlock more themes and titles in the Rewards shop.</p>
    </section>
    <section class="card menu">
      ${row('data', 'Export Backup', `Saves progress and photos to a file · ${s.lastBackup ? `last ${prettyDate(s.lastBackup, { month: 'short', day: 'numeric' })}` : 'never backed up'}`, 'export')}
      ${row('data', 'Import Backup', 'Restore from a backup file', 'import')}
      ${row('info', 'Reset All Progress', 'Deletes everything on this phone', 'reset', '')}
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </section>
    <section class="card menu">
      ${row('help', 'How It Works', '', 'help')}
      ${row('info', 'About', '', 'about')}
    </section>`;
}

function helpHtml() {
  return `
    <h2 class="modal-title">How It Works</h2>
    <div class="prose">
      <p><b>Daily Quest.</b> On training days your quest is that day's workout. Other days it's a light recovery quest. Clear it before midnight or lose XP.</p>
      <p><b>Logging sets.</b> Tap Start Workout, set the reps you actually did, and tap Complete Set. A rest timer starts automatically.</p>
      <p><b>Progression.</b> Hit the top of the rep range on every set and next time the weight goes up, or you move to a harder bodyweight version.</p>
      <p><b>XP & ranks.</b> Levels give 3 stat points each. Ranks go E → D (Lv 10) → C (20) → B (35) → A (50) → S (70).</p>
      <p><b>Attributes</b> grow automatically from what you train, plus the points you allocate.</p>
      <p><b>Gold</b> comes from quests, achievements, the daily bonus and the weekly chest. Spend it in the Rewards shop.</p>
      <p><b>Streak Shields</b> automatically protect you from one missed day's penalty.</p>
      <p><b>Your data</b> stays on this phone. Use Settings → Export Backup to save it.</p>
    </div>
    <button class="btn" data-action="close">Got it</button>`;
}

function aboutHtml() {
  return `
    <div class="center">${emblem('A', 'var(--accent)', { size: 72 })}</div>
    <h2 class="modal-title">Ascend</h2>
    <p class="sub">A free, gamified training app. Version 3.</p>
    <p class="hint center">Calorie, body-fat, strength and body projections are estimates from published formulas (Mifflin-St Jeor, U.S. Navy method, Epley, common strength standards). They aren't medical advice. Check with a doctor before starting a new training program if you have health concerns.</p>
    <button class="btn ghost" data-action="close">Close</button>`;
}

function openProfile() {
  sdraft = draftFromState(S());
  queueModal(() => `
    <h2 class="modal-title">Profile & Plan</h2>
    <h3 class="step-title">Player</h3>${profileFields()}
    <h3 class="step-title">Body</h3>${bodyFields()}
    <h3 class="step-title">Goal</h3>${goalFields()}
    <h3 class="step-title">Equipment</h3>${equipmentFields()}
    <h3 class="step-title">Schedule</h3>${scheduleFields()}
    <button class="btn" data-action="save-profile">Save</button>
    <button class="btn ghost" data-action="close">Cancel</button>`);
}

function saveProfile() {
  for (let i = 0; i < 5; i++) {
    const err = validateSection(i);
    if (err) return toast(err);
  }
  const s = S();
  const profile = draftProfile(sdraft);
  const weightChanged = Math.abs(profile.weightKg - s.weightKg) > 0.05;
  Object.assign(s, profile);
  if (weightChanged) Game.recordWeight(profile.weightKg);
  nextModal();
  Game.rebuildTodayQuest();
  Game.save();
  render();
  pump();
  toast('Plan updated');
}

async function exportData() {
  let pics = [];
  try {
    pics = await Photos.allPhotos();
  } catch { /* photos unavailable: export the rest */ }
  const name = `ascend-backup-${dateKey()}.json`;
  const file = new File([JSON.stringify({ app: 'ascend', version: 3, state: S(), photos: pics })], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Ascend backup' });
      backupDone();
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  backupDone();
}

function backupDone() {
  Game.markBackup();
  toast('Backup saved. Keep it in Files or iCloud Drive.');
  render();
}

const WHATS_NEW = [
  ['quest', 'Every day is a workout', 'Off days are now a short Active Recovery workout instead of a checklist.'],
  ['target', 'Mini quests', 'Each exercise is its own quest with its own XP and Gold, plus a bonus for clearing them all.'],
  ['star', 'Bonus quests', 'Two optional daily challenges for extra rewards. No penalty for skipping.'],
  ['user', 'Your character', 'A new anime-style Player character. Want your own look? Upload your own art in Character → Customize.'],
  ['data', 'Backup reminders', 'A weekly nudge to save your progress to Files or iCloud Drive.'],
];

function whatsNewHtml() {
  return `
    <p class="eyebrow glow center">[ System Update ]</p>
    <h2 class="modal-title">What's New in ${Game.APP_VERSION}</h2>
    <div class="news">${WHATS_NEW.map(([ic, title, text]) => `
      <div class="news-row"><span class="menu-ic">${icon(ic, 18)}</span><div><b>${title}</b><span>${text}</span></div></div>`).join('')}</div>
    <p class="hint center">Updates never reset your progress. Just don't delete the app icon from your Home Screen, since that erases its saved data.</p>
    <button class="btn" data-action="close">Continue</button>`;
}

function backupHtml() {
  const s = S();
  return `
    <div class="center">${badge('data', { size: 72 })}</div>
    <h2 class="modal-title">Protect Your Progress</h2>
    <p class="sub">Level ${s.level} · ${plural(Game.computeStreak(), 'day')} streak · ${s.gold.toLocaleString()} Gold</p>
    <p class="sub">Your progress is saved only on this phone. Save a backup file to Files or iCloud Drive so a lost phone or a deleted icon can't wipe it out.</p>
    <p class="hint center">${s.lastBackup ? `Last backup: ${prettyDate(s.lastBackup)}` : 'You haven\'t made a backup yet.'}</p>
    <button class="btn" data-action="backup-now">Back Up Now</button>
    <button class="btn ghost" data-action="backup-later">Remind Me Later</button>`;
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    let data = null;
    try {
      data = JSON.parse(reader.result);
    } catch { /* handled below */ }
    const s = data && data.state;
    if (!Game.isValidState(s)) return toast('That file is not an Ascend backup');
    if (!confirm(`Replace your current progress with this backup (${s.name}, level ${s.level})?`)) return;
    G.state = Game.migrate(s);
    const pics = Array.isArray(data.photos) ? data.photos.filter(p => p && p.id && typeof p.data === 'string' && p.data.startsWith('data:image/')) : [];
    try {
      await Photos.clearPhotos();
      for (const p of pics) await Photos.putPhoto(p);
      G.photos = await Photos.allPhotos();
    } catch {
      toast('Progress restored, but photos could not be saved');
    }
    Game.save();
    applyTheme();
    setSoundEnabled(S().sound);
    Game.processMissedDays();
    go('home');
    pump();
    toast('Backup restored');
  };
  reader.readAsText(file);
}

async function resetAll() {
  if (!confirm('Reset ALL progress and delete all photos? This cannot be undone.')) return;
  localStorage.removeItem(Game.STORE_KEY);
  try {
    await Photos.clearPhotos();
  } catch { /* nothing to clear */ }
  G.photos = [];
  G.state = null;
  modalQueue.length = 0;
  nextModal();
  sdraft = blankDraft();
  obStep = 0;
  introStep = 0;
  applyTheme();
  go('splash');
}

/* ---------- Body logging modals ---------- */

function openWeightLog() {
  sdraft = { units: S().units, w: '' };
  queueModal(() => `
    <h2 class="modal-title">Log Weight</h2>
    <p class="sub">Weigh in first thing in the morning for the most consistent numbers.</p>
    <label class="field"><span>Weight (${C.wUnit(S())})</span><input type="number" inputmode="decimal" data-sbind="w" value="${esc(sdraft.w)}" placeholder="${fmtNum(C.toDispW(S(), S().weightKg))}"></label>
    <button class="btn" data-action="save-weight">Save</button>
    <button class="btn ghost" data-action="close">Cancel</button>`);
}

function saveWeight() {
  const kg = C.fromDispW(S(), +sdraft.w);
  if (!(kg >= 30 && kg <= 300)) return toast('Enter your weight');
  Game.recordWeight(kg);
  nextModal();
  render();
  pump();
  toast('Weight logged');
}

function openMeasureLog() {
  const s = S();
  const last = s.measures[s.measures.length - 1];
  const show = cm => (cm ? fmtNum(C.toDispL(s, cm)) : '');
  sdraft = { units: s.units, waist: show(last && last.waist), neck: show(last && last.neck), hips: show(last && last.hips) };
  const u = C.lUnit(s);
  queueModal(() => `
    <h2 class="modal-title">Measurements</h2>
    <p class="sub">Use a soft tape measure, snug but not squeezing. This gives a much better body-fat estimate than weight alone (U.S. Navy method).</p>
    <label class="field"><span>Waist (${u})</span><input type="number" inputmode="decimal" data-sbind="waist" value="${esc(sdraft.waist)}"></label>
    <p class="hint">${s.sex === 'male' ? 'Around your belly button.' : 'At the narrowest point.'}</p>
    <label class="field"><span>Neck (${u})</span><input type="number" inputmode="decimal" data-sbind="neck" value="${esc(sdraft.neck)}"></label>
    <p class="hint">Just below the Adam's apple.</p>
    ${s.sex === 'female' ? `<label class="field"><span>Hips (${u})</span><input type="number" inputmode="decimal" data-sbind="hips" value="${esc(sdraft.hips)}"></label><p class="hint">At the widest point.</p>` : ''}
    <button class="btn" data-action="save-measures">Save</button>
    <button class="btn ghost" data-action="close">Cancel</button>`);
}

function saveMeasures() {
  const s = S();
  const cm = v => C.fromDispL(s, +v);
  const m = { date: dateKey(), waist: cm(sdraft.waist), neck: cm(sdraft.neck) };
  if (s.sex === 'female') m.hips = cm(sdraft.hips);
  const bf = C.navyBodyFat(s.sex, s.heightCm, m.waist, m.neck, m.hips);
  if (!(m.waist > 40 && m.neck > 20) || !bf || !(bf > 2 && bf < 65)) return toast('Those numbers don’t look right. Check them.');
  Game.recordMeasures(m);
  nextModal();
  render();
  pump();
  toast(`Body fat: ${fmtNum(bf)}%`);
}

function openTargetEdit() {
  const s = S();
  sdraft = { units: s.units, target: s.targetKg ? fmtNum(C.toDispW(s, s.targetKg), 0) : '' };
  queueModal(() => `
    <h2 class="modal-title">Goal Weight</h2>
    <p class="sub">Suggested for you: <b>${C.fmtW(s, C.suggestTargetKg(s), 1)}</b></p>
    <label class="field"><span>Goal weight (${C.wUnit(s)})</span><input type="number" inputmode="decimal" data-sbind="target" value="${esc(sdraft.target)}" placeholder="auto"></label>
    <button class="btn" data-action="save-target">Save</button>
    <button class="btn ghost" data-action="target-auto">Use Suggested</button>`);
}

function saveTarget(auto) {
  const kg = C.fromDispW(S(), +sdraft.target);
  if (!auto && !(kg >= 30 && kg <= 300)) return toast('Enter a goal weight');
  S().targetKg = auto ? null : kg;
  Game.save();
  nextModal();
  render();
}

function runMaxTest(key) {
  const name = key === 'pullup' ? 'pull-ups' : 'push-ups';
  const answer = prompt(`Max ${name} in one set with good form?`);
  if (answer === null) return;
  const reps = Math.round(Number(answer));
  if (!Number.isFinite(reps) || reps < 0 || reps > 500) return toast('Enter a number of reps');
  Game.recordTest(key, reps);
  render();
  pump();
  toast(`Saved: ${reps} ${name}`);
}

/* ---------- Photos ---------- */

function openPhotoAdd() {
  sdraft = { pose: 'front' };
  queueModal(() => `
    <h2 class="modal-title">Progress Photo</h2>
    <p class="sub">Same spot, same lighting, same time of day each time. Photos never leave this phone.</p>
    <div class="field"><span>Pose</span>${draftSeg('pose', [['front', 'Front'], ['side', 'Side'], ['back', 'Back']])}</div>
    <button class="btn" data-action="photo-pick">Take or Choose Photo</button>
    <button class="btn ghost" data-action="close">Cancel</button>
    <input type="file" id="photo-file" accept="image/*" hidden>`);
}

async function savePhoto(file) {
  try {
    const data = await Photos.resizeImage(file);
    await Photos.putPhoto({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, date: dateKey(), ts: Date.now(), pose: sdraft.pose, kg: S().weightKg, data });
    G.photos = await Photos.allPhotos();
    comparePose = sdraft.pose;
    Game.trainIntelligence('photo');
    Game.checkAchievements();
    Game.save();
    nextModal();
    render();
    pump();
    toast('Photo saved');
  } catch (e) {
    toast(e.message || 'Could not save photo');
  }
}

function viewPhoto(id) {
  const p = G.photos.find(x => x.id === id);
  if (!p) return;
  queueModal(`
    <h2 class="modal-title">${prettyDate(p.date, { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
    <img class="photo-full" src="${p.data}" alt="${p.pose} progress photo">
    <p class="sub">${p.pose[0].toUpperCase() + p.pose.slice(1)} · ${C.fmtW(S(), p.kg)}</p>
    <button class="btn ghost" data-action="close">Close</button>
    <button class="btn danger" data-action="photo-del" data-id="${p.id}">Delete Photo</button>`);
}

async function removePhoto(id) {
  if (!confirm('Delete this photo?')) return;
  await Photos.deletePhoto(id);
  G.photos = await Photos.allPhotos();
  nextModal();
  render();
}

/* ================= Celebration screens ================= */

function questCompleteHtml(n) {
  const gains = Object.entries(n.gains || {}).filter(([, v]) => v);
  return `
    <div class="burst"></div>
    <div class="celebrate-body">
      <p class="eyebrow glow">${n.q.type === 'workout' ? TEMPLATES[n.q.template].name : 'Recovery Quest'}</p>
      <h1 class="display big">Quest<br>Complete!</h1>
      ${n.q.type === 'workout' ? '<p class="muted" style="margin:10px 0 0">All quests cleared · Clear bonus</p>' : ''}
      <div class="reward-big">${icon('star', 22)} +${n.xp} XP</div>
      <div class="reward-big gold">${coin(22)} +${n.gold} Gold</div>
      ${n.totalXp && n.totalXp !== n.xp ? `<p class="muted small">Today's total: ${n.totalXp} XP · ${n.totalGold} Gold</p>` : ''}
      ${n.bonus ? '<p class="gold-text">7-day streak bonus: +1 stat point</p>' : ''}
      ${gains.length ? `<div class="gain-row">${gains.map(([k, v]) => `<span>${STATS.find(x => x.key === k).abbr} +${v}</span>`).join('')}</div>` : ''}
      ${n.notes.length ? `<div class="notes">${n.notes.map(t => `<p>▲ ${esc(t)}</p>`).join('')}</div>` : ''}
      <p class="muted">${icon('flame', 14)} Streak: ${plural(n.streak, 'day')}</p>
      <button class="btn" data-action="close">Continue</button>
    </div>`;
}

function levelUpHtml(from, to) {
  return `
    <div class="burst"></div>
    <div class="celebrate-body">
      <p class="eyebrow glow">[ System Notice ]</p>
      <h1 class="display big">Level Up</h1>
      <div class="celebrate-avatar">${playerAvatar(170, S().avatar, to)}</div>
      <div class="level-num">Lv. ${to}</div>
      <p class="lead">You gained ${(to - from) * Game.STAT_POINTS_PER_LEVEL} stat points.</p>
      <button class="btn" data-action="close-to" data-v="stats">Allocate Points</button>
      <button class="btn ghost" data-action="close">Continue</button>
    </div>`;
}

function rankUpHtml(r) {
  return `
    <div class="burst rank"></div>
    <div class="celebrate-body">
      <h1 class="display big">Rank Up</h1>
      <div class="rank-emblem">${emblem(r.rank, r.color, { size: 200, ornate: true })}</div>
      <p class="lead">You have reached <b style="color:${r.color}">Rank ${r.rank}</b>!</p>
      <p class="muted">Title unlocked: ${r.title}</p>
      <button class="btn" data-action="close">Continue</button>
    </div>`;
}

function achievementHtml(list) {
  return `
    <div class="celebrate-body">
      <p class="eyebrow glow">Achievement Unlocked</p>
      ${list.map(a => `
        <div class="ach on big">
          ${badge(a.icon, { size: 64 })}
          <div class="ach-main"><b>${a.name}</b><span>${a.desc}</span><em>+${a.xp} XP${a.gold ? ` · +${a.gold} Gold` : ''}</em></div>
        </div>`).join('')}
      <button class="btn" data-action="close">Continue</button>
    </div>`;
}

function penaltyHtml(n) {
  if (!n.failed) {
    return `
      <h2 class="modal-title">Shield Activated</h2>
      <div class="center">${badge('shield', { size: 80 })}</div>
      <p class="sub">You missed ${plural(n.missed, 'day')}, but your Streak Shield${n.shieldedN > 1 ? 's' : ''} blocked the penalty. Your streak is safe.</p>
      <button class="btn" data-action="close">Continue</button>`;
  }
  return `
    <h2 class="modal-title danger">Penalty</h2>
    <p class="center" style="margin-top:14px">You failed the Daily Quest on <b>${plural(n.failed, 'day')}</b>${n.missed === 1 ? ` (${prettyDate(n.first)})` : ''}.</p>
    <div class="big-num danger">−${n.total} XP</div>
    ${n.shieldedN ? `<p class="sub">${plural(n.shieldedN, 'Streak Shield')} absorbed part of it.</p>` : ''}
    <p class="sub">Your streak has been reset. Clear today's quest to start a new one.</p>
    <button class="btn danger" data-action="close">Accept</button>`;
}

/* ================= Events ================= */

document.addEventListener('click', e => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    if (!S()) return;
    sfx('tap');
    go(tabBtn.dataset.tab);
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const { action, v, id, key, field, kind } = el.dataset;
  const exI = Number(el.dataset.ex);
  switch (action) {
    // Navigation
    case 'go': go(v); break;
    case 'back': back(); break;
    case 'intro-next':
      if (introStep < INTRO.length - 1) { introStep++; render(); } else { sdraft = blankDraft(); obStep = 0; go('onboard'); }
      break;
    case 'intro-skip': sdraft = blankDraft(); obStep = 0; go('onboard'); break;
    case 'ob-next': onboardNext(); break;
    case 'ob-back': obStep--; go('onboard'); break;

    // Quest & workout
    case 'start-workout': startWorkout(v === undefined ? undefined : Number(v)); break;
    case 'task': Game.toggleTask(id); sfx('set'); render(); pump(); break;
    case 'cur': Game.adjustCurrent(wIdx, Number(v)); render(); break;
    case 'w': Game.adjustWeight(wIdx, Number(v)); render(); break;
    case 'w-complete': completeCurrentSet(); break;
    case 'w-timer': {
      const e2 = Game.todayQuest().exercises[wIdx];
      timer = timer ? null : { until: Date.now() + e2.cur * 1000, total: e2.cur };
      render();
      break;
    }
    case 'w-next': wIdx = (wIdx + 1) % Game.todayQuest().exercises.length; rest = null; timer = null; render(); break;
    case 'w-prev': {
      const n = Game.todayQuest().exercises.length;
      wIdx = (wIdx - 1 + n) % n;
      rest = null;
      timer = null;
      render();
      break;
    }
    case 'w-go': wIdx = Number(v); rest = null; timer = null; if (currentModal) nextModal(); render(); break;
    case 'w-list': queueModal(workoutListHtml); break;
    case 'rest-skip': rest = null; render(); break;
    case 'rest-add': if (rest) { rest.until += 15000; rest.total += 15; } updateTimers(); break;
    case 'swap': openSwap(exI); break;
    case 'swap-to': Game.swapExercise(exI, id); nextModal(); render(); break;
    case 'day': openDay = openDay === Number(v) ? null : Number(v); render(); break;
    case 'xtype': extraDraft.type = v; render(); break;
    case 'log-extra': {
      const name = extraDraft.name.trim();
      if (!name) { toast('Enter an activity'); break; }
      if (!(+extraDraft.minutes > 0)) { toast('Enter minutes'); break; }
      const xp = Game.logExtra(name, extraDraft.type, +extraDraft.minutes);
      extraDraft.name = '';
      sfx('set');
      toast(xp ? `+${xp} XP` : 'Logged (daily bonus XP cap reached)');
      render();
      pump();
      break;
    }
    case 'del-extra': if (confirm('Remove this activity? Its XP will be taken back.')) { Game.deleteExtra(id); render(); } break;

    // Stats & achievements
    case 'alloc': allocMode = !allocMode; render(); break;
    case 'stat': if (Game.addStat(key)) { sfx('tap'); if (!S().statPoints) allocMode = false; render(); pump(); } break;
    case 'period': progPeriod = Number(v); render(); break;
    case 'test': runMaxTest(id); break;
    case 'award-filter': awardFilter = v; render(); break;

    // Body
    case 'log-weight': openWeightLog(); break;
    case 'save-weight': saveWeight(); break;
    case 'log-measures': openMeasureLog(); break;
    case 'save-measures': saveMeasures(); break;
    case 'edit-target': openTargetEdit(); break;
    case 'save-target': saveTarget(false); break;
    case 'target-auto': saveTarget(true); break;
    case 'proj': projMonths = Number(v); render(); break;
    case 'photo-add': openPhotoAdd(); break;
    case 'photo-pick': $('#photo-file').click(); break;
    case 'photo-view': viewPhoto(id); break;
    case 'photo-del': removePhoto(id); break;
    case 'cmp-pose': comparePose = v; render(); break;

    // History
    case 'hist-filter': histFilter = v; render(); break;
    case 'hist-open': histOpen = histOpen === id ? null : id; render(); break;
    case 'cal': {
      let m = calMonth.m + Number(v);
      let y = calMonth.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      calMonth = { y, m };
      render();
      break;
    }

    // Shop
    case 'shop-tab': shopTab = v; render(); break;
    case 'buy': {
      const err = Game.buy(kind, id);
      if (err) { toast(err); break; }
      sfx('coin');
      applyTheme();
      toast('Purchased!');
      render();
      pump();
      break;
    }
    case 'equip-theme': S().theme = id; Game.save(); applyTheme(); render(); break;
    case 'equip-title': S().title = id || null; Game.save(); render(); break;
    case 'claim-daily': { const g = Game.claimDaily(); if (g) { sfx('coin'); toast(`+${g} Gold`); } render(); break; }
    case 'claim-chest': { const g = Game.claimChest(); if (g) { sfx('coin'); toast(`Chest opened: +${g} Gold`); } render(); break; }

    // Settings
    case 'open-profile': openProfile(); break;
    case 'save-profile': saveProfile(); break;
    case 'edit-avatar': openAvatarEditor(); break;
    case 'av-set':
      if (!sdraft.avatar) sdraft.avatar = Game.defaultAvatar(sdraft.sex);
      sdraft.avatar = { ...sdraft.avatar, [field]: v };
      refreshForm();
      break;
    case 'save-avatar':
      S().avatar = { ...sdraft.avatar };
      S().portrait = sdraft.portrait || null;
      Game.save();
      nextModal();
      render();
      toast('Character updated');
      break;
    case 'portrait-pick': $('#portrait-file').click(); break;
    case 'portrait-clear': sdraft.portrait = null; refreshForm(); break;
    case 'backup-now': nextModal(); exportData(); break;
    case 'backup-later': Game.snoozeBackup(3); nextModal(); break;
    case 'side-step': Game.sideStep(Number(v), Number(el.dataset.dir)); sfx('tap'); render(); pump(); break;
    case 'side-done': Game.sideFinish(Number(v)); render(); pump(); break;
    case 'toggle-sound': S().sound = !S().sound; setSoundEnabled(S().sound); Game.save(); sfx('tap'); render(); break;
    case 'help': queueModal(helpHtml()); break;
    case 'about': queueModal(aboutHtml()); break;
    case 'export': exportData(); break;
    case 'import': $('#import-file').click(); break;
    case 'reset': resetAll(); break;

    // Modals & forms
    case 'close': nextModal(); break;
    case 'close-to': nextModal(); go(v); break;
    case 'sset':
      if (field === 'units') switchUnits(v);
      else sdraft[field] = v;
      refreshForm();
      break;
    case 'preset':
      sdraft.equipment = Object.fromEntries(EQUIPMENT_PRESETS[v].eq.map(k => [k, true]));
      refreshForm();
      break;
    case 'seq':
      sdraft.equipment = { ...sdraft.equipment, [v]: !sdraft.equipment[v] };
      refreshForm();
      break;
    case 'sday': {
      const d = Number(v);
      if (sdraft.trainingDays.includes(d)) sdraft.trainingDays = sdraft.trainingDays.filter(x => x !== d);
      else if (sdraft.trainingDays.length >= 6) toast('Keep at least one recovery day');
      else sdraft.trainingDays = [...sdraft.trainingDays, d];
      refreshForm();
      break;
    }
  }
});

document.addEventListener('input', e => {
  const { bind, sbind } = e.target.dataset;
  if (bind) extraDraft[bind] = e.target.value;
  else if (sbind) sdraft[sbind] = e.target.value;
});

document.addEventListener('change', e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (e.target.id === 'import-file') importData(file);
  if (e.target.id === 'photo-file') savePhoto(file);
  if (e.target.id === 'portrait-file') {
    Photos.resizeImage(file, 720, 0.85)
      .then(data => { sdraft.portrait = data; refreshForm(); })
      .catch(err => toast(err.message || 'Could not read that image'));
  }
});

// Timers: rest/exercise countdowns, the midnight countdown, and rolling over to a new day.
let currentDay = dateKey();
let lastSecond = 0;
setInterval(() => {
  updateTimers();
  const sec = Math.floor(Date.now() / 1000);
  if (sec === lastSecond) return;
  lastSecond = sec;
  updateCountdown();
  if (S() && dateKey() !== currentDay) {
    currentDay = dateKey();
    Game.processMissedDays();
    render();
    pump();
  }
}, 250);

/* ================= Boot ================= */

Game.load();
if (S()) {
  setSoundEnabled(S().sound);
  Game.processMissedDays();
  Game.checkAchievements();
  route = 'home';
} else {
  route = 'splash';
}
applyTheme();
render();
pump();
if (S()) {
  if (Game.needsWhatsNew()) {
    queueModal(whatsNewHtml(), '', 'unlock');
    Game.markSeenVersion();
  }
  if (Game.backupDue()) queueModal(backupHtml);
}

(async () => {
  for (const name of ['player.jpg', 'player.png']) {
    try {
      const r = await fetch(name); // a normal GET so the service worker caches it for offline use
      if (r.ok && (r.headers.get('content-type') || '').startsWith('image')) {
        defaultPortrait = name;
        if (S()) render();
        return;
      }
    } catch { /* offline or missing */ }
  }
})();

Photos.allPhotos()
  .then(list => {
    G.photos = list;
    if (S()) {
      Game.checkAchievements();
      if (route === 'body') render();
      pump();
    }
  })
  .catch(() => {});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
