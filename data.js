/* Static game data: exercises, plans, strength standards, ranks. */

export const EQUIPMENT = {
  bar:     'Pull-up bar',
  bands:   'Resistance bands',
  db:      'Dumbbells',
  kb:      'Kettlebell',
  bench:   'Bench',
  barbell: 'Barbell & rack',
  machine: 'Cables & machines',
};

export const EQUIPMENT_PRESETS = {
  bodyweight: { name: 'Bodyweight only', desc: 'No equipment. Train anywhere.', eq: [] },
  home:       { name: 'Home gym', desc: 'Dumbbells, bands, pull-up bar, bench', eq: ['bar', 'bands', 'db', 'bench'] },
  gym:        { name: 'Full gym', desc: 'Barbells, machines, everything', eq: Object.keys(EQUIPMENT) },
};

export const GOALS = {
  fatloss:  { name: 'Lose fat', desc: 'Drop body fat while keeping your muscle.' },
  muscle:   { name: 'Build muscle', desc: 'Add size with a small calorie surplus.' },
  recomp:   { name: 'Recomp', desc: 'Lose fat and build muscle at the same time (slower).' },
  strength: { name: 'Get stronger', desc: 'Heavier weights, lower reps, max strength.' },
};

export const EXPERIENCE = {
  new:         { name: 'New', desc: 'Less than 6 months of regular training' },
  some:        { name: 'Some', desc: '6 months to 2 years of regular training' },
  experienced: { name: 'Experienced', desc: '2+ years of consistent training' },
};

export const PATTERNS = {
  squat: 'Squat', hinge: 'Hinge', lunge: 'Single-leg', hpush: 'Push', vpush: 'Overhead push',
  hpull: 'Row', vpull: 'Pull-up / pulldown', core: 'Core', arms: 'Arms', cond: 'Conditioning',
};

export const LOWER_BODY = new Set(['squat', 'hinge', 'lunge']);

/*
 * kind: 'load' (weights), 'reps' (bodyweight/bands) or 'time' (seconds).
 * eq: all required. any: at least one required.
 * lvl: position on the bodyweight progression ladder for its pattern.
 * ref: [standard lift, ratio] -> this exercise's 1RM ~= standard 1RM x ratio (per hand if perHand).
 */
export const EXERCISES = [
  // Squat
  { id: 'bw_squat', name: 'Bodyweight squat', pattern: 'squat', eq: [], kind: 'reps', lvl: 1, cue: 'Sit back and down, chest up, knees track over toes.' },
  { id: 'tempo_squat', name: 'Tempo squat (3 s down)', pattern: 'squat', eq: [], kind: 'reps', lvl: 2, cue: 'Take 3 full seconds on the way down and pause at the bottom.' },
  { id: 'jump_squat', name: 'Jump squat', pattern: 'squat', eq: [], kind: 'reps', lvl: 3, cue: 'Land softly and go straight into the next rep.' },
  { id: 'assisted_pistol', name: 'Assisted pistol squat', pattern: 'squat', eq: [], kind: 'reps', lvl: 4, perSide: true, cue: 'Hold a door frame for balance and control the descent on one leg.' },
  { id: 'pistol', name: 'Pistol squat', pattern: 'squat', eq: [], kind: 'reps', lvl: 5, perSide: true, cue: 'One leg, other leg straight out front, full depth.' },
  { id: 'bb_squat', name: 'Barbell back squat', pattern: 'squat', eq: ['barbell'], kind: 'load', ref: ['squat', 1], cue: 'Brace hard, break at hips and knees together, hit parallel.' },
  { id: 'goblet_squat', name: 'Goblet squat', pattern: 'squat', eq: [], any: ['db', 'kb'], kind: 'load', ref: ['squat', 0.4], cue: 'Hold the weight at your chest, elbows inside your knees at the bottom.' },
  { id: 'leg_press', name: 'Leg press', pattern: 'squat', eq: ['machine'], kind: 'load', ref: ['squat', 1.5], cue: 'Lower until your knees hit ~90° without your lower back rounding.' },

  // Hinge
  { id: 'glute_bridge', name: 'Glute bridge', pattern: 'hinge', eq: [], kind: 'reps', lvl: 1, cue: 'Drive through your heels and squeeze your glutes for 1 s at the top.' },
  { id: 'sl_glute_bridge', name: 'Single-leg glute bridge', pattern: 'hinge', eq: [], kind: 'reps', lvl: 2, perSide: true, cue: 'Keep your hips level as you drive up.' },
  { id: 'sl_rdl', name: 'Single-leg Romanian deadlift', pattern: 'hinge', eq: [], kind: 'reps', lvl: 3, perSide: true, cue: 'Hinge at the hip with a flat back, back leg in line with your torso.' },
  { id: 'sl_hip_thrust', name: 'Elevated single-leg hip thrust', pattern: 'hinge', eq: [], kind: 'reps', lvl: 4, perSide: true, cue: 'Shoulders on a couch, full hip extension at the top.' },
  { id: 'bb_deadlift', name: 'Deadlift', pattern: 'hinge', eq: ['barbell'], kind: 'load', ref: ['deadlift', 1], cue: 'Bar over mid-foot, brace, push the floor away.' },
  { id: 'bb_rdl', name: 'Romanian deadlift', pattern: 'hinge', eq: ['barbell'], kind: 'load', ref: ['deadlift', 0.65], cue: 'Soft knees, push hips back until you feel a hamstring stretch.' },
  { id: 'db_rdl', name: 'Dumbbell Romanian deadlift', pattern: 'hinge', eq: ['db'], kind: 'load', ref: ['deadlift', 0.3], perHand: true, cue: 'Push hips back, weights close to your legs, flat back.' },
  { id: 'kb_swing', name: 'Kettlebell swing', pattern: 'hinge', eq: ['kb'], kind: 'load', ref: ['deadlift', 0.3], cue: 'Snap your hips forward; your arms just guide the bell.' },

  // Single-leg
  { id: 'reverse_lunge', name: 'Reverse lunge', pattern: 'lunge', eq: [], kind: 'reps', lvl: 1, perSide: true, cue: 'Step back and lower the back knee toward the floor.' },
  { id: 'split_squat', name: 'Bulgarian split squat', pattern: 'lunge', eq: [], kind: 'reps', lvl: 2, perSide: true, cue: 'Back foot on a chair, front shin close to vertical.' },
  { id: 'jump_lunge', name: 'Jumping lunge', pattern: 'lunge', eq: [], kind: 'reps', lvl: 3, perSide: true, cue: 'Switch legs in the air and land softly.' },
  { id: 'db_split_squat', name: 'Dumbbell Bulgarian split squat', pattern: 'lunge', eq: ['db'], kind: 'load', ref: ['squat', 0.2], perHand: true, cue: 'Back foot on a bench, stay tall, drive through the front heel.' },
  { id: 'db_lunge', name: 'Dumbbell walking lunge', pattern: 'lunge', eq: ['db'], kind: 'load', ref: ['squat', 0.22], perHand: true, cue: 'Long steps, back knee just above the floor.' },

  // Horizontal push
  { id: 'incline_pushup', name: 'Incline push-up', pattern: 'hpush', eq: [], kind: 'reps', lvl: 1, cue: 'Hands on a counter or couch, body in one straight line.' },
  { id: 'pushup', name: 'Push-up', pattern: 'hpush', eq: [], kind: 'reps', lvl: 2, cue: 'Elbows about 45° from your body, chest to the floor.' },
  { id: 'decline_pushup', name: 'Decline push-up', pattern: 'hpush', eq: [], kind: 'reps', lvl: 3, cue: 'Feet on a chair, core tight, full range.' },
  { id: 'archer_pushup', name: 'Archer push-up', pattern: 'hpush', eq: [], kind: 'reps', lvl: 4, perSide: true, cue: 'Shift your weight to one arm; the other stays straight.' },
  { id: 'bb_bench', name: 'Bench press', pattern: 'hpush', eq: ['barbell', 'bench'], kind: 'load', ref: ['bench', 1], cue: 'Shoulder blades pinched, bar to lower chest, feet planted.' },
  { id: 'db_bench', name: 'Dumbbell bench press', pattern: 'hpush', eq: ['db', 'bench'], kind: 'load', ref: ['bench', 0.38], perHand: true, cue: 'Lower to chest level with elbows about 45° out.' },
  { id: 'db_floor_press', name: 'Dumbbell floor press', pattern: 'hpush', eq: ['db'], kind: 'load', ref: ['bench', 0.35], perHand: true, cue: 'Lie on the floor, pause when your upper arms touch down.' },
  { id: 'machine_press', name: 'Machine chest press', pattern: 'hpush', eq: ['machine'], kind: 'load', ref: ['bench', 0.9], cue: 'Handles at mid-chest, control the way back.' },

  // Vertical push
  { id: 'pike_pushup', name: 'Pike push-up', pattern: 'vpush', eq: [], kind: 'reps', lvl: 1, cue: 'Hips high, lower the top of your head toward the floor.' },
  { id: 'elevated_pike', name: 'Elevated pike push-up', pattern: 'vpush', eq: [], kind: 'reps', lvl: 2, cue: 'Feet on a chair so your torso is more vertical.' },
  { id: 'hspu_negative', name: 'Wall handstand push-up negative', pattern: 'vpush', eq: [], kind: 'reps', lvl: 3, cue: 'Kick up to the wall and lower yourself over 3–5 s.' },
  { id: 'bb_ohp', name: 'Overhead press', pattern: 'vpush', eq: ['barbell'], kind: 'load', ref: ['ohp', 1], cue: 'Squeeze glutes, press straight up, head through at the top.' },
  { id: 'db_ohp', name: 'Dumbbell shoulder press', pattern: 'vpush', eq: ['db'], kind: 'load', ref: ['ohp', 0.4], perHand: true, cue: 'Press up and slightly in, don’t arch your lower back.' },
  { id: 'band_ohp', name: 'Band overhead press', pattern: 'vpush', eq: ['bands'], kind: 'reps', cue: 'Stand on the band, press overhead to full lockout.' },

  // Horizontal pull
  { id: 'doorway_row', name: 'Doorway row', pattern: 'hpull', eq: [], kind: 'reps', lvl: 1, cue: 'Grip a door frame, lean back, pull your chest to the frame.' },
  { id: 'inverted_row', name: 'Inverted row', pattern: 'hpull', eq: ['bar'], kind: 'reps', lvl: 2, cue: 'Bar set low, body straight, pull your chest to the bar.' },
  { id: 'bb_row', name: 'Barbell row', pattern: 'hpull', eq: ['barbell'], kind: 'load', ref: ['bench', 0.8], cue: 'Torso about 45°, pull the bar to your belly button.' },
  { id: 'db_row', name: 'One-arm dumbbell row', pattern: 'hpull', eq: ['db'], kind: 'load', ref: ['bench', 0.45], perHand: true, cue: 'Brace on a bench, pull the weight to your hip.' },
  { id: 'cable_row', name: 'Seated cable row', pattern: 'hpull', eq: ['machine'], kind: 'load', ref: ['bench', 0.8], cue: 'Chest up, squeeze your shoulder blades together.' },
  { id: 'band_row', name: 'Band row', pattern: 'hpull', eq: ['bands'], kind: 'reps', cue: 'Anchor the band at chest height, pull elbows back.' },

  // Vertical pull
  { id: 'prone_yt', name: 'Prone Y-T raise', pattern: 'vpull', eq: [], kind: 'reps', lvl: 1, cue: 'Lie face down, lift arms into a Y then a T, thumbs up.' },
  { id: 'pullup_negative', name: 'Pull-up negative', pattern: 'vpull', eq: ['bar'], kind: 'reps', lvl: 2, cue: 'Jump to the top and lower yourself slowly over 3–5 s.' },
  { id: 'chinup', name: 'Chin-up', pattern: 'vpull', eq: ['bar'], kind: 'reps', lvl: 3, cue: 'Palms facing you, chin over the bar, full hang at the bottom.' },
  { id: 'pullup', name: 'Pull-up', pattern: 'vpull', eq: ['bar'], kind: 'reps', lvl: 4, cue: 'Palms away, drive elbows down to your ribs.' },
  { id: 'lat_pulldown', name: 'Lat pulldown', pattern: 'vpull', eq: ['machine'], kind: 'load', ref: ['bench', 0.85], cue: 'Pull the bar to your upper chest, lean back slightly.' },
  { id: 'band_pulldown', name: 'Band lat pulldown', pattern: 'vpull', eq: ['bands'], kind: 'reps', cue: 'Anchor the band high and pull your elbows down to your sides.' },

  // Core
  { id: 'plank', name: 'Plank', pattern: 'core', eq: [], kind: 'time', lvl: 1, cue: 'Squeeze glutes and abs, body in one straight line.' },
  { id: 'leg_raise', name: 'Lying leg raise', pattern: 'core', eq: [], kind: 'reps', lvl: 2, cue: 'Lower back pressed into the floor, lower slowly.' },
  { id: 'hollow_hold', name: 'Hollow body hold', pattern: 'core', eq: [], kind: 'time', lvl: 3, cue: 'Arms overhead, shoulders and legs just off the floor.' },
  { id: 'hanging_knee_raise', name: 'Hanging knee raise', pattern: 'core', eq: ['bar'], kind: 'reps', lvl: 4, cue: 'No swinging, knees to chest.' },
  { id: 'hanging_leg_raise', name: 'Hanging leg raise', pattern: 'core', eq: ['bar'], kind: 'reps', lvl: 5, cue: 'Straight legs up to the bar or as high as you can.' },

  // Arms
  { id: 'bench_dip', name: 'Bench dip', pattern: 'arms', eq: [], kind: 'reps', lvl: 1, cue: 'Hands on a chair behind you, elbows straight back.' },
  { id: 'diamond_pushup', name: 'Diamond push-up', pattern: 'arms', eq: [], kind: 'reps', lvl: 2, cue: 'Hands together under your chest, elbows tight.' },
  { id: 'db_curl', name: 'Dumbbell curl', pattern: 'arms', eq: ['db'], kind: 'load', ref: ['bench', 0.2], perHand: true, cue: 'Elbows pinned to your sides, no swinging.' },
  { id: 'cable_pushdown', name: 'Cable triceps pushdown', pattern: 'arms', eq: ['machine'], kind: 'load', ref: ['bench', 0.35], cue: 'Elbows tucked, full lockout at the bottom.' },
  { id: 'band_curl', name: 'Band curl', pattern: 'arms', eq: ['bands'], kind: 'reps', cue: 'Stand on the band, curl with elbows pinned.' },

  // Conditioning (intervals: work seconds per round)
  { id: 'high_knees', name: 'High knees', pattern: 'cond', eq: [], kind: 'time', lvl: 1, cue: 'Fast feet, knees to hip height. Rest 30 s between rounds.' },
  { id: 'mountain_climbers', name: 'Mountain climbers', pattern: 'cond', eq: [], kind: 'time', lvl: 2, cue: 'Hips low, drive knees fast. Rest 30 s between rounds.' },
  { id: 'burpees', name: 'Burpees', pattern: 'cond', eq: [], kind: 'time', lvl: 3, cue: 'Chest to floor, jump at the top. Rest 30 s between rounds.' },
];

export const TEMPLATES = {
  fullA:  { name: 'Full Body A',  v: 0, slots: ['squat', 'hpush', 'hpull', 'hinge', 'vpush', 'core'] },
  fullB:  { name: 'Full Body B',  v: 1, slots: ['hinge', 'vpush', 'vpull', 'lunge', 'hpush', 'core'] },
  fullC:  { name: 'Full Body C',  v: 2, slots: ['squat', 'vpull', 'hpush', 'lunge', 'hpull', 'core'] },
  upperA: { name: 'Upper Body A', v: 0, slots: ['hpush', 'hpull', 'vpush', 'vpull', 'arms', 'core'] },
  upperB: { name: 'Upper Body B', v: 1, slots: ['vpush', 'vpull', 'hpush', 'hpull', 'arms', 'core'] },
  lowerA: { name: 'Lower Body A', v: 0, slots: ['squat', 'hinge', 'lunge', 'core', 'cond'] },
  lowerB: { name: 'Lower Body B', v: 1, slots: ['hinge', 'squat', 'lunge', 'core', 'cond'] },
};

// Number of training days -> workout for each training day, in week order.
export const SPLITS = {
  1: ['fullA'],
  2: ['fullA', 'fullB'],
  3: ['fullA', 'fullB', 'fullC'],
  4: ['upperA', 'lowerA', 'upperB', 'lowerB'],
  5: ['upperA', 'lowerA', 'fullA', 'upperB', 'lowerB'],
  6: ['upperA', 'lowerA', 'fullA', 'upperB', 'lowerB', 'fullB'],
};

export const SPLIT_NAMES = { 1: 'Full body', 2: 'Full body A/B', 3: 'Full body A/B/C', 4: 'Upper / lower', 5: 'Upper / lower / full', 6: 'Upper / lower / full ×2' };

export const SLOTS_PER_SESSION = { 30: 4, 45: 5, 60: 6 };

// [sets, low reps, high reps] for the first two (main) and remaining (accessory) exercises.
export const SCHEMES = {
  strength: { main: [4, 4, 6],  acc: [3, 6, 10] },
  muscle:   { main: [4, 6, 10], acc: [3, 8, 12] },
  recomp:   { main: [3, 6, 10], acc: [3, 10, 12] },
  fatloss:  { main: [3, 8, 12], acc: [3, 12, 15] },
};
export const BW_RANGES = { strength: [6, 10], muscle: [8, 15], recomp: [8, 15], fatloss: [12, 20] };

/*
 * 1-rep max as a multiple of bodyweight: untrained, novice, intermediate, advanced, elite.
 * Rounded from widely used strength-standard tables (e.g. ExRx / Strength Level).
 */
export const LEVEL_NAMES = ['Untrained', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
export const STANDARDS = {
  male:   { squat: [0.75, 1.0, 1.5, 2.0, 2.5], bench: [0.5, 0.75, 1.0, 1.5, 1.9], deadlift: [1.0, 1.25, 1.75, 2.25, 2.75], ohp: [0.35, 0.5, 0.65, 0.85, 1.1] },
  female: { squat: [0.5, 0.75, 1.0, 1.5, 1.9], bench: [0.25, 0.5, 0.75, 1.0, 1.25], deadlift: [0.6, 1.0, 1.25, 1.75, 2.25], ohp: [0.2, 0.35, 0.5, 0.65, 0.85] },
};
export const REP_STANDARDS = {
  male:   { pushup: [5, 15, 30, 50, 70], pullup: [0, 3, 10, 18, 25] },
  female: { pushup: [1, 5, 15, 30, 45],  pullup: [0, 1, 4, 10, 15] },
};
export const EXP_LEVEL = { new: 0, some: 1, experienced: 2 };

export const STATS = [
  { key: 'str', abbr: 'STR', name: 'Strength', icon: 'dumbbell' },
  { key: 'end', abbr: 'END', name: 'Endurance', icon: 'shield' },
  { key: 'agi', abbr: 'AGI', name: 'Agility', icon: 'bolt' },
  { key: 'vit', abbr: 'VIT', name: 'Vitality', icon: 'heart' },
  { key: 'int', abbr: 'INT', name: 'Intelligence', icon: 'bulb' },
];

// Which attribute a movement trains. Every logged set adds attribute XP.
export const PATTERN_STAT = {
  squat: 'str', hinge: 'str', hpush: 'str', vpush: 'str', hpull: 'str', vpull: 'str', arms: 'str',
  lunge: 'agi', cond: 'agi', core: 'end',
};

// Highest first so RANKS.find() returns the current rank.
export const RANKS = [
  { min: 70, rank: 'S', title: 'Legend',     color: '#ffd166' },
  { min: 50, rank: 'A', title: 'Champion',   color: '#ff7ab6' },
  { min: 35, rank: 'B', title: 'Elite',      color: '#b388ff' },
  { min: 20, rank: 'C', title: 'Warrior',    color: '#5a8cff' },
  { min: 10, rank: 'D', title: 'Apprentice', color: '#3fd0ff' },
  { min: 1,  rank: 'E', title: 'Novice',     color: '#8fb0ff' },
];

/* ---------- Gold shop ---------- */

export const SHOP = [
  { id: 'boost',  name: 'XP Boost',      desc: '+50% XP from everything until midnight', price: 100, icon: 'bolt' },
  { id: 'shield', name: 'Streak Shield', desc: 'Blocks one missed-day penalty and keeps your streak alive (hold up to 2)', price: 150, icon: 'shield' },
  { id: 'potion', name: 'Stat Potion',   desc: '+1 stat point to spend on any attribute', price: 200, icon: 'potion' },
];

export const THEMES = {
  blue:    { name: 'System Blue',   price: 0,   swatch: '#3d7bff' },
  violet:  { name: 'Violet Night',  price: 300, swatch: '#9b5cff' },
  crimson: { name: 'Crimson Gate',  price: 300, swatch: '#ff3d5e' },
  gold:    { name: 'Golden Ascent', price: 600, swatch: '#ffbf3d' },
};

export const TITLES = [
  { id: 'iron',     name: 'Iron Will',     price: 150 },
  { id: 'unbroken', name: 'The Unbroken',  price: 250 },
  { id: 'awakened', name: 'Awakened One',  price: 400 },
];

export const WORKOUT_TYPES = { strength: 'Strength', cardio: 'Cardio', mobility: 'Mobility', sport: 'Sport' };
export const SUGGESTIONS = ['Running', 'Cycling', 'Swimming', 'Walk', 'Basketball', 'Soccer', 'Hiking', 'Yoga',
  'Stretching', 'HIIT', 'Jump rope', 'Boxing', 'Rowing', 'Climbing'];

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
