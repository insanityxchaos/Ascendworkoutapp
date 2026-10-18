/* Procedural artwork: night-city scenes, emblems, exercise figures and icons. All original, drawn as SVG. */

let uidCounter = 0;
const uid = prefix => `${prefix}${++uidCounter}`;
const f1 = n => n.toFixed(1);

// Small seeded random generator so a scene looks the same every time it renders.
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- Icons (24×24 line icons) ---------- */

const ICONS = {
  home: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
  quest: 'M6 3h10l3 3v15H6zM9 9h7M9 13h7M9 17h4',
  stats: 'M4 20V11M10 20V5M16 20v-7M21 20H3',
  trophy: 'M7 3h10v5a5 5 0 0 1-10 0zM7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 21v-3h6v3',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  dumbbell: 'M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11',
  shield: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z',
  bolt: 'M13 2L4.5 13.5H11L10 22l8.5-11.5H12z',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
  flame: 'M12 2.5c.8 3.6-3.5 5.2-3.5 9.2a3.5 3.5 0 0 0 7 0c0-1.2-.4-2.1-.9-2.8 2.4 1.2 4.4 3.8 4.4 6.6A7 7 0 0 1 5 15.5C5 9.6 10.8 7.4 12 2.5z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  crown: 'M3 18h18M4 15l-1-9 5.5 4L12 4l3.5 6L21 6l-1 9z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z',
  tape: 'M4 16L16 4l4 4L8 20zM8 12l1.5 1.5M11 9l1.5 1.5M14 6l1.5 1.5',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  potion: 'M9 3h6M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3M7.5 14h9',
  palette: 'M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.6 0-1-.8-1.4-.8-2.3 0-.9.7-1.3 1.6-1.3H17a4 4 0 0 0 4-4c0-4.9-4-8.8-9-8.8zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  body: 'M12 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 9l7 1.5L19 9M12 10.5V15M9 21l3-6 3 6',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  shop: 'M4 7h16l-1.5 13h-13zM9 7V5a3 3 0 0 1 6 0v2',
  sound: 'M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  chevron: 'M9 5l7 7-7 7',
  back: 'M15 5l-7 7 7 7',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  lock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  timer: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4l2.5 1.5M9 2h6',
  chest: 'M3 10h18v10H3zM3 10l2-5h14l2 5M10.5 13.5h3',
  gift: 'M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-2.5 0-4.5-1-4.5-2.8S9.5 3.8 12 9c2.5-5.2 4.5-4.6 4.5-2.8S14.5 9 12 9z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
};

export function icon(name, size = 20) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] || ICONS.star}"/></svg>`;
}

export function coin(size = 16) {
  return `<svg class="coin" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#f2b33d" stroke="#ffe29a" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="6.2" fill="none" stroke="#b27512" stroke-width="1.6"/>
    <path d="M12 8.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 14.5l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="#b27512"/></svg>`;
}

/* ---------- Hexagon emblems ---------- */

const hexPoints = (r, cx = 50, cy = 50) => [0, 1, 2, 3, 4, 5]
  .map(i => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${f1(cx + r * Math.cos(a))},${f1(cy + r * Math.sin(a))}`;
  }).join(' ');

function ornament() {
  let out = '';
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI / 180) * (30 * i - 90);
    const long = i % 2 === 0;
    const r1 = 47;
    const r2 = long ? 64 : 56;
    const w = long ? 5 : 3;
    const px = Math.cos(a + Math.PI / 2) * w;
    const py = Math.sin(a + Math.PI / 2) * w;
    const bx = 50 + r1 * Math.cos(a);
    const by = 50 + r1 * Math.sin(a);
    out += `<polygon points="${f1(bx + px)},${f1(by + py)} ${f1(50 + r2 * Math.cos(a))},${f1(50 + r2 * Math.sin(a))} ${f1(bx - px)},${f1(by - py)}" fill="currentColor" opacity="${long ? 0.9 : 0.55}"/>`;
  }
  return out;
}

// Rank emblem: glowing hexagon with a letter. ornate adds the spiked frame used on the rank-up screen.
export function emblem(letter, color, { size = 48, ornate = false, dim = false } = {}) {
  const id = uid('em');
  const vb = ornate ? '-18 -18 136 136' : '0 0 100 100';
  return `<svg class="emblem${dim ? ' dim' : ''}" width="${size}" height="${size}" viewBox="${vb}" style="color:${color}" aria-label="${letter} rank">
    <defs>
      <radialGradient id="${id}g" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="currentColor" stop-opacity=".55"/><stop offset=".6" stop-color="#0a0f2c" stop-opacity=".95"/><stop offset="1" stop-color="#05070f"/></radialGradient>
      <filter id="${id}f" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${ornate ? 3.5 : 2.2}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    ${ornate ? `<g filter="url(#${id}f)">${ornament()}</g>` : ''}
    <polygon points="${hexPoints(46)}" fill="url(#${id}g)" stroke="currentColor" stroke-width="3.2" filter="url(#${id}f)"/>
    <polygon points="${hexPoints(38)}" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.4"/>
    <text x="50" y="51" dy=".36em" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="${letter.length > 1 ? 30 : 46}" fill="#f4f7ff" filter="url(#${id}f)">${letter}</text>
  </svg>`;
}

// Achievement badge: hexagon with an icon. Locked badges are grey.
export function badge(iconName, { size = 48, locked = false, color = 'var(--accent)' } = {}) {
  const id = uid('bd');
  const c = locked ? '#3a4566' : color;
  return `<svg class="badge${locked ? ' locked' : ''}" width="${size}" height="${size}" viewBox="0 0 100 100" style="color:${c}" aria-hidden="true">
    <defs><radialGradient id="${id}" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="currentColor" stop-opacity="${locked ? 0.15 : 0.45}"/><stop offset="1" stop-color="#070a1a"/></radialGradient></defs>
    <polygon points="${hexPoints(45)}" fill="url(#${id})" stroke="currentColor" stroke-width="3"/>
    <polygon points="${hexPoints(37)}" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/>
    <g transform="translate(28 28) scale(1.83)" fill="none" stroke="${locked ? '#56618a' : '#eef3ff'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[locked ? 'lock' : iconName] || ICONS.star}"/></g>
  </svg>`;
}

/* ---------- Exercise figures (stick figures, 120×72 box) ---------- */

const FIGURES = {
  hpush: { head: [20, 40], lines: [[28, 44, 104, 58], [29, 45, 27, 62], [100, 58, 106, 62]], floor: 63 },
  core: { head: [20, 42], lines: [[28, 46, 104, 58], [29, 47, 31, 61, 44, 61]], floor: 62 },
  squat: { head: [56, 14], lines: [[56, 20, 48, 42], [48, 42, 68, 44, 63, 66], [54, 26, 78, 30], [63, 66, 72, 66]], floor: 67 },
  hinge: { head: [38, 24], lines: [[44, 28, 72, 36], [72, 36, 70, 52, 72, 68], [47, 30, 49, 52]], extra: [[49, 55, 4]], floor: 69 },
  lunge: { head: [58, 10], lines: [[58, 16, 58, 38], [58, 38, 76, 50, 76, 68], [58, 38, 46, 56, 32, 64], [58, 22, 50, 34], [58, 22, 66, 34]], floor: 69 },
  vpush: { head: [60, 22], lines: [[60, 28, 60, 50], [60, 50, 54, 68], [60, 50, 66, 68], [60, 31, 47, 20, 46, 7], [60, 31, 73, 20, 74, 7], [36, 7, 84, 7]], floor: 69 },
  hpull: { head: [36, 28], lines: [[42, 32, 72, 38], [72, 38, 70, 52, 72, 68], [46, 33, 56, 46, 64, 42]], extra: [[66, 41, 4]], floor: 69 },
  vpull: { head: [60, 16], lines: [[30, 5, 90, 5], [60, 23, 60, 46], [60, 46, 56, 66], [60, 46, 64, 66], [58, 25, 50, 16, 50, 5], [62, 25, 70, 16, 70, 5]] },
  arms: { head: [60, 13], lines: [[60, 19, 60, 45], [60, 45, 55, 68], [60, 45, 65, 68], [60, 23, 67, 37, 74, 27], [60, 23, 53, 37, 53, 48]], extra: [[75, 25, 4]], floor: 69 },
  cond: { head: [64, 11], lines: [[64, 17, 57, 38], [57, 38, 71, 48, 67, 63], [57, 38, 46, 50, 33, 49], [62, 23, 74, 29, 80, 21], [62, 23, 51, 29, 45, 38]], floor: 65 },
  stand: { head: [60, 12], lines: [[60, 18, 60, 44], [60, 44, 54, 68], [60, 44, 66, 68], [60, 22, 52, 38], [60, 22, 68, 38]], floor: 69 },
};

function figureSvg(name, x, y, scale) {
  const fig = FIGURES[name] || FIGURES.stand;
  const pts = l => {
    const out = [];
    for (let i = 0; i < l.length; i += 2) out.push(`${l[i]},${l[i + 1]}`);
    return out.join(' ');
  };
  const draw = (width, stroke, opacity) => `
    <g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">
      ${fig.lines.map(l => `<polyline points="${pts(l)}"/>`).join('')}
      <circle cx="${fig.head[0]}" cy="${fig.head[1]}" r="5.5"/>
      ${(fig.extra || []).map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('')}
    </g>`;
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${scale})">
    ${fig.floor ? `<line x1="8" x2="112" y1="${fig.floor}" y2="${fig.floor}" stroke="var(--accent)" stroke-opacity=".35" stroke-width="1"/>` : ''}
    <g class="figure-glow">${draw(6, 'var(--accent)', 0.55)}</g>
    ${draw(2.6, '#e9f1ff', 0.95)}
  </g>`;
}

/* ---------- Scene pieces ---------- */

function skyline(r, w, baseY, maxH, fill, winFill, winRate, minW, maxW) {
  let out = '';
  let x = -6;
  while (x < w + 6) {
    const bw = minW + r() * (maxW - minW);
    const bh = maxH * (0.3 + r() * 0.7);
    const top = baseY - bh;
    out += `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(bw)}" height="${f1(bh + 2)}" fill="${fill}"/>`;
    if (r() < 0.25) out += `<polygon points="${f1(x + bw * 0.25)},${f1(top)} ${f1(x + bw / 2)},${f1(top - bh * 0.18)} ${f1(x + bw * 0.75)},${f1(top)}" fill="${fill}"/>`;
    if (r() < 0.15) out += `<rect x="${f1(x + bw / 2 - 0.5)}" y="${f1(top - bh * 0.3)}" width="1" height="${f1(bh * 0.3)}" fill="${fill}"/>`;
    for (let wy = top + 4; wy < baseY - 3; wy += 5) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 4) {
        if (r() < winRate) out += `<rect x="${f1(wx)}" y="${f1(wy)}" width="1.6" height="2" style="fill:${winFill}" opacity="${f1(0.4 + r() * 0.6)}"/>`;
      }
    }
    x += bw + r() * 3;
  }
  return out;
}

function ridge(r, w, baseY, amp, fill) {
  let d = `M0 ${baseY}`;
  const steps = 9;
  for (let i = 0; i <= steps; i++) d += ` L${f1((w / steps) * i)} ${f1(baseY - amp * (0.3 + r() * 0.7))}`;
  return `<path d="${d} L${w} ${baseY + 200} L0 ${baseY + 200}Z" fill="${fill}"/>`;
}

function island(r, cx, cy, wd, id) {
  let towers = '';
  let x = cx - wd * 0.38;
  while (x < cx + wd * 0.36) {
    const tw = wd * (0.05 + r() * 0.07);
    const th = wd * (0.12 + r() * 0.35);
    towers += `<rect x="${f1(x)}" y="${f1(cy - th)}" width="${f1(tw)}" height="${f1(th)}" fill="#120d33"/>`;
    towers += `<polygon points="${f1(x)},${f1(cy - th)} ${f1(x + tw / 2)},${f1(cy - th - wd * 0.08)} ${f1(x + tw)},${f1(cy - th)}" fill="#120d33"/>`;
    if (r() < 0.7) towers += `<rect x="${f1(x + tw / 2 - 0.8)}" y="${f1(cy - th * 0.7)}" width="1.6" height="2.4" style="fill:var(--accent2)" opacity=".8"/>`;
    x += tw + wd * 0.02;
  }
  const rocks = [0, 1, 2].map(() => {
    const rx = cx + (r() - 0.5) * wd * 0.9;
    const ry = cy + wd * (0.35 + r() * 0.3);
    const s = wd * (0.03 + r() * 0.04);
    return `<polygon points="${f1(rx - s)},${f1(ry)} ${f1(rx + s)},${f1(ry)} ${f1(rx)},${f1(ry + s * 1.8)}" fill="#160f3a"/>`;
  }).join('');
  return `<g>
    <ellipse cx="${f1(cx)}" cy="${f1(cy + wd * 0.2)}" rx="${f1(wd * 0.7)}" ry="${f1(wd * 0.3)}" fill="url(#${id}isl)"/>
    ${towers}
    <polygon points="${f1(cx - wd / 2)},${f1(cy)} ${f1(cx + wd / 2)},${f1(cy)} ${f1(cx + wd * 0.22)},${f1(cy + wd * 0.32)} ${f1(cx)},${f1(cy + wd * 0.62)} ${f1(cx - wd * 0.26)},${f1(cy + wd * 0.3)}" fill="#160f3a" stroke="var(--accent)" stroke-opacity=".35" stroke-width="1"/>
    ${rocks}
  </g>`;
}

function lightning(r, w, h, id) {
  let x = w * (0.1 + r() * 0.8);
  let y = 0;
  const pts = [[x, y]];
  const end = h * (0.45 + r() * 0.3);
  while (y < end) {
    y += h * (0.05 + r() * 0.07);
    x += (r() - 0.5) * w * 0.12;
    pts.push([x, y]);
  }
  const p = pts.map(([a, b]) => `${f1(a)},${f1(b)}`).join(' ');
  return `<g class="bolt" style="animation-delay:${f1(r() * 3)}s">
    <polyline points="${p}" fill="none" stroke="var(--accent)" stroke-width="3.5" filter="url(#${id}blur)" opacity=".8"/>
    <polyline points="${p}" fill="none" stroke="#f1f6ff" stroke-width="1.1"/>
  </g>`;
}

// A generic cloaked, hooded figure seen from behind (100×200 box). ledgeTo draws the rooftop it stands on.
function hooded(cx, baseY, height, ledgeTo = null) {
  const s = height / 200;
  const ledge = ledgeTo ? `
    <rect x="${f1(cx - height * 0.42)}" y="${f1(baseY)}" width="${f1(height * 0.84)}" height="${f1(ledgeTo - baseY + 2)}" fill="#03040b"/>
    <line x1="${f1(cx - height * 0.42)}" x2="${f1(cx + height * 0.42)}" y1="${f1(baseY)}" y2="${f1(baseY)}" stroke="var(--accent)" stroke-opacity=".6" stroke-width="1.2"/>` : '';
  return `${ledge}
    <ellipse cx="${f1(cx)}" cy="${f1(baseY - height * 0.5)}" rx="${f1(height * 0.42)}" ry="${f1(height * 0.6)}" style="fill:var(--accent)" opacity=".1"/>
    <g transform="translate(${f1(cx - 50 * s)} ${f1(baseY - 200 * s)}) scale(${s.toFixed(3)})">
      <path d="M50 6C40 8 34 18 34 30c0 10 4 16 8 20h16c4-4 8-10 8-20 0-12-6-22-16-24z
               M42 50c-12 2-20 6-24 14l-6 54c-1 6 2 8 5 4l7-38 2 42c-2 24-6 52-12 72h30l5-48h2l5 48h30c-6-20-10-48-12-72l2-42 7 38c3 4 6 2 5-4l-6-54c-4-8-12-12-24-14z"
            fill="#03040c" stroke="var(--accent)" stroke-opacity=".8" stroke-width="${(1.4 / s).toFixed(2)}" stroke-linejoin="round"/>
    </g>`;
}

/*
 * A full night scene. Options:
 *   seed, w, h, moon, island, bolts (count), figure (hooded silhouette), figureY (where its feet are, 0–1;
 *   below 0.9 it stands on a rooftop), picto (exercise figure name), sparks (count)
 * Sizes scale from u (the shorter side) so tall phone-shaped scenes don't get giant buildings.
 */
export function scene({ seed = 7, w = 400, h = 220, moon = true, island: hasIsland = false, bolts = 0, figure = false, figureY = 0.99, picto = null, sparks = 12, city = true } = {}) {
  const r = rng(seed);
  const id = uid('sc');
  const u = Math.min(h, w * 0.6);
  let s = `<svg class="scene" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#040714"/><stop offset=".5" stop-color="#14103a"/><stop offset="1" stop-color="#34206a"/>
      </linearGradient>
      <radialGradient id="${id}glow" cx=".5" cy=".9" r=".7"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.42"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></radialGradient>
      <radialGradient id="${id}isl" cx=".5" cy=".5" r=".5"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></radialGradient>
      <linearGradient id="${id}fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070f" stop-opacity="0"/><stop offset="1" stop-color="#05070f" stop-opacity=".95"/></linearGradient>
      <filter id="${id}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="${id}soft"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#${id}sky)"/>
    <rect width="${w}" height="${h}" fill="url(#${id}glow)"/>`;
  for (let i = 0; i < 45; i++) {
    s += `<circle cx="${f1(r() * w)}" cy="${f1(r() * h * 0.6)}" r="${(r() * 0.9 + 0.2).toFixed(2)}" fill="#d6e2ff" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`;
  }
  if (moon) {
    const mx = w * (0.12 + r() * 0.76);
    const my = Math.min(h * 0.17, u * 0.3);
    s += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="${f1(u * 0.13)}" fill="#c9c2ff" opacity=".18" filter="url(#${id}soft)"/>
          <circle cx="${f1(mx)}" cy="${f1(my)}" r="${f1(u * 0.055)}" fill="#ece8ff" opacity=".9"/>`;
  }
  for (let i = 0; i < bolts; i++) s += lightning(r, w, h, id);
  if (hasIsland) s += island(r, w * (0.35 + r() * 0.3), Math.min(h * 0.3, u * 0.5), Math.min(w, h * 1.6) * 0.3, id);
  if (city) {
    s += ridge(r, w, h * 0.66, u * 0.12, '#1a1342');
    s += skyline(r, w, h * 0.82, u * 0.3, '#110c2c', 'rgba(170,185,255,.9)', 0.05, 10, 24);
    s += skyline(r, w, h + 2, u * 0.4, '#070918', 'var(--accent)', 0.08, 16, 34);
  }
  if (figure) s += hooded(w / 2, h * figureY, Math.min(h * 0.62, w * 0.5), figureY < 0.9 ? h : null);
  if (picto) {
    const scale = Math.min((w * 0.62) / 120, (h * 0.7) / 72);
    s += figureSvg(picto, w / 2 - 60 * scale, h * 0.12, scale);
  }
  s += `<rect y="${f1(h * 0.62)}" width="${w}" height="${f1(h * 0.38)}" fill="url(#${id}fog)"/>`;
  for (let i = 0; i < sparks; i++) {
    s += `<circle class="spark" cx="${f1(r() * w)}" cy="${f1(h * (0.55 + r() * 0.45))}" r="${(r() * 1.3 + 0.5).toFixed(2)}" style="animation-delay:${f1(r() * 5)}s;animation-duration:${f1(3.5 + r() * 3)}s"/>`;
  }
  return `${s}</svg>`;
}

// Just the stick figure, for small cards.
export function figure(name, size = 64) {
  return `<svg class="mini-figure" width="${size}" height="${Math.round(size * 0.6)}" viewBox="0 0 120 72" aria-hidden="true">${figureSvg(name, 0, 0, 1)}</svg>`;
}

/* ---------- Ring counter ---------- */

export function ring(value, max, label, id = 'ring') {
  const R = 58;
  const circ = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return `<svg class="ring" viewBox="0 0 140 140">
    <circle cx="70" cy="70" r="${R}" class="ring-bg"/>
    <circle id="${id}-arc" cx="70" cy="70" r="${R}" class="ring-fg" stroke-dasharray="${f1(circ)}" stroke-dashoffset="${f1(circ * (1 - pct))}" transform="rotate(-90 70 70)"/>
    <text id="${id}-num" x="70" y="70" dy=".35em" class="ring-num">${value}</text>
    <text x="70" y="102" class="ring-label">${label}</text>
  </svg>`;
}

export function setRing(id, value, max) {
  const arc = document.getElementById(`${id}-arc`);
  const num = document.getElementById(`${id}-num`);
  if (!arc || !num) return;
  const circ = 2 * Math.PI * 58;
  arc.setAttribute('stroke-dashoffset', f1(circ * (1 - Math.max(0, Math.min(1, value / max)))));
  num.textContent = value;
}
