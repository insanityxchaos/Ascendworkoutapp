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
  mobility: { head: [52, 12], lines: [[52, 18, 48, 40], [48, 40, 66, 50, 66, 67], [48, 40, 34, 56, 20, 64], [51, 23, 64, 8], [51, 23, 44, 38]], floor: 68 },
  cardio: { head: [60, 11], lines: [[60, 17, 58, 41], [58, 41, 66, 54, 70, 67], [58, 41, 52, 55, 46, 66], [60, 23, 67, 34], [60, 23, 53, 34]], floor: 68 },
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

/* ---------- Player character (anime-style bust, 200×240) ---------- */

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) + 255 * amt)));
  return `#${[16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

// Hair is built from individual pointed locks, manhwa style.
function lock(ax, ay, bx, by, tx, ty, bend = 3) {
  const m1x = (ax + tx) / 2 - bend;
  const m2x = (bx + tx) / 2 + bend * 0.4;
  return `M${f1(ax)} ${f1(ay)}Q${f1(m1x)} ${f1((ay + ty) / 2)} ${f1(tx)} ${f1(ty)}Q${f1(m2x)} ${f1((by + ty) / 2)} ${f1(bx)} ${f1(by)}Z`;
}

// Front fringe locks: [baseA x,y, baseB x,y, tip x,y, bend]. Tips stop above the eyes except the centre strand.
const FRINGE = [
  [74, 82, 82, 72, 73, 114, 2],
  [80, 73, 90, 68, 82, 97, 3],
  [88, 68, 98, 66, 90.5, 94, 3],
  [92, 67, 100, 66, 95.5, 88, 2],
  [97, 66, 106, 66, 100.5, 105, 1.5],
  [102, 66, 110, 67, 106, 89, -2],
  [104, 66, 114, 68, 111.5, 94, -3],
  [112, 68, 122, 72, 120, 97, -3],
  [120, 72, 128, 82, 129, 114, -2],
];

// Spikes radiating from the crown, from angle `from` to `to` (degrees, 180 = left, 270 = up).
function crownSpikes(n, rIn, rOut, from, to, curl) {
  const cx = 101;
  const cy = 82;
  const rad = a => (a * Math.PI) / 180;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = from + ((to - from) * i) / n;
    const a1 = from + ((to - from) * (i + 1)) / n;
    const am = (a0 + a1) / 2 + curl;
    const len = rOut + ((i * 7) % 3) * 4;
    d += lock(cx + rIn * Math.cos(rad(a0)), cy + rIn * Math.sin(rad(a0)), cx + rIn * Math.cos(rad(a1)), cy + rIn * Math.sin(rad(a1)),
      cx + len * Math.cos(rad(am)), cy + len * Math.sin(rad(am)), 2);
  }
  return d;
}

const HAIR_CAP = 'M72 102C64 62 82 40 102 40C124 40 140 62 131 102C128 84 118 70 102 68C86 68 76 82 72 102Z';
// Solid volume behind the head so the spikes read as one messy mass, not a crown.
const HAIR_MASS = 'M67 110C56 70 76 34 102 33C131 33 149 68 136 110C133 90 124 72 102 70C82 70 71 88 67 110Z';
const sideLocks = (len, spread) => lock(71, 90, 80, 88, 70 - spread, 90 + len, 2) + lock(131, 90, 122, 88, 132 + spread, 90 + len, -2);

const HAIR_STYLES = {
  spiky: { back: () => HAIR_MASS + crownSpikes(9, 36, 50, 192, 348, 22) + sideLocks(36, 2), shift: 0, scale: 1 },
  swept: { back: () => HAIR_MASS + crownSpikes(6, 36, 48, 200, 340, 30) + sideLocks(30, 1), shift: -8, scale: 1.05 },
  long: {
    back: () => HAIR_MASS + crownSpikes(5, 36, 46, 205, 335, 10)
      + lock(68, 96, 78, 92, 54, 202, 6) + lock(74, 100, 84, 98, 68, 216, 4)
      + lock(134, 96, 124, 92, 148, 202, -6) + lock(128, 100, 118, 98, 134, 216, -4),
    shift: 0, scale: 1.08,
  },
  short: { back: () => HAIR_MASS + crownSpikes(8, 36, 44, 200, 340, 10), shift: 0, scale: 0.62 },
};

/*
 * The player's character. look: { hair, hairColor, eyes, skin }. tier 1–3 upgrades the outfit;
 * rankColor tints trims, eye glow and aura.
 */
export function avatar(look, { size = 160, tier = 1, rankColor = '#8fb0ff', aura = true } = {}) {
  const id = uid('av');
  const style = HAIR_STYLES[look.hair] || HAIR_STYLES.spiky;
  const hc = look.hairColor;
  const skin = look.skin;
  const eye = look.eyes;
  const trim = rankColor;
  const line = shade(hc, -0.32);

  const fringe = FRINGE.map(([ax, ay, bx, by, tx, ty, bend]) => {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const x = mx + (tx - mx) * style.scale + style.shift * ((ty - my) / 40);
    return lock(ax, ay, bx, by, x, my + (ty - my) * style.scale, bend);
  }).join('');

  // Narrow, sharp manhwa eyes with a small glowing iris under a heavy upper lid.
  const eyeL = 'M82 104.5C86 100.5 93 99.5 97.5 102.5C94.5 105.8 88 106.8 82 104.5Z';
  const eyeR = 'M120 104.5C116 100.5 109 99.5 104.5 102.5C107.5 105.8 114 106.8 120 104.5Z';
  const iris = (cx, clip) => `
    <g clip-path="url(#${id}${clip})">
      <circle cx="${cx}" cy="103.6" r="3.7" fill="url(#${id}iris)"/>
      <circle cx="${cx}" cy="103.6" r="1.5" fill="${shade(eye, -0.5)}"/>
      <circle cx="${cx + 1.3}" cy="102.4" r=".85" fill="#fff"/>
    </g>
    <circle cx="${cx}" cy="103.6" r="${tier >= 2 ? 5.5 : 4.2}" fill="${eye}" opacity="${tier >= 3 ? 0.75 : tier === 2 ? 0.55 : 0.3}" filter="url(#${id}blur)"/>`;

  let outfit = `
    <path d="M22 240C24 204 50 184 84 176L118 176C152 184 178 204 180 240Z" fill="url(#${id}coat)" stroke="#000" stroke-opacity=".5"/>
    <path d="M86 176L101 212L116 176Z" fill="#04050b"/>
    <path d="M58 204C62 216 64 228 62 240M144 204C140 216 138 228 140 240M76 214C80 224 80 232 78 240M126 214C122 224 122 232 124 240" stroke="#000" stroke-opacity=".45" stroke-width="2" fill="none"/>`;
  if (tier === 1) {
    outfit += `
      <path d="M64 188C68 166 134 166 138 188C128 176 74 176 64 188Z" fill="#1b2142" stroke="#000" stroke-opacity=".4"/>
      <path d="M101 212L101 240" stroke="#7f8bbf" stroke-width="1.2" opacity=".6"/>`;
  } else {
    outfit += `
      <path d="M86 177L73 146L92 159L99 197Z" fill="#090c1e" stroke="${trim}" stroke-width="1.3"/>
      <path d="M116 177L129 146L110 159L103 197Z" fill="#090c1e" stroke="${trim}" stroke-width="1.3"/>
      <path d="M99 197L94 240M103 197L108 240" stroke="${trim}" stroke-width="1.1" opacity=".55"/>
      <path d="M44 198C58 187 73 181 86 178M158 198C144 187 129 181 116 178" stroke="${trim}" stroke-width="1" fill="none" opacity=".45"/>`;
  }
  if (tier === 3) {
    outfit += `
      <path d="M28 214C32 190 54 180 79 178L81 195C60 197 45 205 38 220Z" fill="#0b0e26" stroke="${trim}" stroke-width="1.5"/>
      <path d="M174 214C170 190 148 180 123 178L121 195C142 197 157 205 164 220Z" fill="#0b0e26" stroke="${trim}" stroke-width="1.5"/>
      <path d="M101 214L95 222L101 230L107 222Z" fill="none" stroke="${trim}" stroke-width="1.6" filter="url(#${id}glow)"/>`;
  }

  return `<svg class="avatar" width="${size}" height="${Math.round(size * 1.2)}" viewBox="0 0 200 240" aria-label="Your character">
    <defs>
      <radialGradient id="${id}aura" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="${trim}" stop-opacity="${0.16 + tier * 0.1}"/><stop offset="1" stop-color="${trim}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}hair" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${shade(hc, 0.14)}"/><stop offset=".55" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc, -0.14)}"/></linearGradient>
      <linearGradient id="${id}skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(skin, -0.05)}"/><stop offset=".6" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, 0.03)}"/></linearGradient>
      <radialGradient id="${id}iris" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${shade(eye, 0.35)}"/><stop offset=".6" stop-color="${eye}"/><stop offset="1" stop-color="${shade(eye, -0.3)}"/></radialGradient>
      <linearGradient id="${id}coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier === 1 ? '#1d2445' : '#121630'}"/><stop offset="1" stop-color="#05060f"/></linearGradient>
      <clipPath id="${id}cl"><path d="${eyeL}"/></clipPath>
      <clipPath id="${id}cr"><path d="${eyeR}"/></clipPath>
      <filter id="${id}blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.8"/></filter>
      <filter id="${id}glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    ${aura ? `<ellipse cx="100" cy="140" rx="${92 + tier * 6}" ry="${104 + tier * 6}" fill="url(#${id}aura)"/>` : ''}
    ${tier === 3 ? `<g fill="${trim}" opacity=".22" filter="url(#${id}blur)"><path d="M30 240C24 206 42 192 36 168C52 186 50 204 60 214Z"/><path d="M172 240C178 206 160 192 166 168C150 186 152 204 142 214Z"/></g>` : ''}
    <path d="${style.back()}" fill="url(#${id}hair)" stroke="${line}" stroke-width=".8" stroke-linejoin="round"/>
    ${outfit}
    <path d="M92.5 138L92 175C97 180 105 180 110 175L109.5 138Z" fill="${shade(skin, -0.1)}"/>
    <path d="M92 141C97 152 105 152 110 141L110 158C105 162 97 162 92 158Z" fill="${shade(skin, -0.3)}" opacity=".5"/>
    <path d="M78 100C72 97 71 108 75 114C77 116 78.5 114 78.5 110ZM124 100C130 97 131 108 127 114C125 116 123.5 114 123.5 110Z" fill="${shade(skin, -0.08)}"/>
    <path d="M77 96C77 70 88 57 101 57C114 57 125 70 125 96L124.5 111C123.5 123 118 135 110 143L104 149.5C102 151.5 100 151.5 98 149.5L92 143C84 135 78.5 123 77.5 111Z" fill="url(#${id}skin)" stroke="${shade(skin, -0.42)}" stroke-width=".7"/>
    <path d="M83.5 112Q87 115 90.5 114.5" fill="none" stroke="${shade(skin, -0.25)}" stroke-width=".8" opacity=".6"/>
    <path d="M77.5 100L77.5 111C78.5 123 84 135 92 143L98 149.5C94 141 89.5 129 88 117C87 109 84 102 77.5 100Z" fill="${shade(skin, -0.2)}" opacity=".45"/>
    <path d="M78 86C88 80 114 80 124 86L124 95C114 89 88 89 78 95Z" fill="${shade(skin, -0.25)}" opacity=".35"/>
    <path d="M125 96L124.5 111C123.5 123 118 135 110 143" fill="none" stroke="${trim}" stroke-width="1.1" opacity=".45"/>
    <path d="M79 97.5L91 93.6L98.5 96.6L91 95.6ZM123 97.5L111 93.6L103.5 96.6L111 95.6Z" fill="${shade(hc, -0.25)}"/>
    <path d="${eyeL}" fill="#eef0f8"/><path d="${eyeR}" fill="#eef0f8"/>
    ${iris(90, 'cl')}${iris(112, 'cr')}
    <path d="M80.5 104.6C85 99.8 92.5 98.8 98.2 102.4M121.5 104.6C117 99.8 109.5 98.8 103.8 102.4" fill="none" stroke="#0e0c15" stroke-width="2.3" stroke-linecap="round"/>
    <path d="M80.5 104.6L77.5 103.4M121.5 104.6L124.5 103.4" fill="none" stroke="#0e0c15" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M84.5 106.3Q90 107.6 96 105.6M117.5 106.3Q112 107.6 106 105.6" fill="none" stroke="#0e0c15" stroke-width=".8" opacity=".35"/>
    ${tier === 3 ? `<path d="M121 103.5L136 100" stroke="${eye}" stroke-width="1.2" stroke-linecap="round" opacity=".7" filter="url(#${id}glow)"/>` : ''}
    <path d="M100.4 108L98.4 120.6C99.8 121.7 101.4 121.7 102.6 120.9" fill="none" stroke="${shade(skin, -0.27)}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M95.6 133.2Q100.6 132.3 106 133" fill="none" stroke="${shade(skin, -0.45)}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M98.6 136.4Q101.2 137 103.6 136.4" fill="none" stroke="${shade(skin, -0.22)}" stroke-width="1" stroke-linecap="round" opacity=".6"/>
    <path d="${HAIR_CAP}" fill="url(#${id}hair)"/>
    <path d="${fringe}" fill="url(#${id}hair)" stroke="${line}" stroke-width=".8" stroke-linejoin="round"/>
    <path d="M86 50Q96 45.5 108 48.5M80 61Q84 56.5 90 55.5M112 55Q118 57 122.5 62M92 70Q93 78 91.5 86M108 70Q108.5 77 107 84" fill="none" stroke="${shade(hc, 0.4)}" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>
    <path d="M128 60Q138 80 131 106" fill="none" stroke="${trim}" stroke-width="1.2" opacity=".45"/>
  </svg>`;
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
