import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  vx: number;
  vy: number;
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;       // 0 → 1
  decay: number;
  active: boolean;
}

const STAR_COLORS = [
  'rgba(255, 240, 200, ',
  'rgba(200, 220, 255, ',
  'rgba(255, 200, 255, ',
  'rgba(220, 200, 255, ',
];

// ── Constellations ───────────────────────────────────────────────────────────
interface ConstellationDef {
  name: string;
  emoji: string;
  stars: [number, number][]; // normalized 0–1
  lines: [number, number][];
}

interface ActiveConstellation {
  def: ConstellationDef;
  cx: number;
  cy: number;
  scale: number;
  timer: number;
}

const ZODIAC: ConstellationDef[] = [
  { name: 'Bélier', emoji: '♈',
    stars: [[0.72,0.15],[0.55,0.38],[0.42,0.56],[0.25,0.78]],
    lines: [[0,1],[1,2],[2,3]] },
  { name: 'Taureau', emoji: '♉',
    stars: [[0.08,0.28],[0.32,0.48],[0.52,0.48],[0.73,0.28],[0.9,0.12],[0.48,0.68],[0.48,0.9]],
    lines: [[0,1],[1,2],[2,3],[3,4],[1,5],[5,6]] },
  { name: 'Gémeaux', emoji: '♊',
    stars: [[0.25,0.08],[0.75,0.08],[0.28,0.32],[0.72,0.32],[0.22,0.56],[0.78,0.56],[0.18,0.8],[0.72,0.8]],
    lines: [[0,2],[1,3],[2,3],[2,4],[3,5],[4,6],[5,7]] },
  { name: 'Cancer', emoji: '♋',
    stars: [[0.5,0.12],[0.5,0.44],[0.22,0.66],[0.5,0.72],[0.78,0.66]],
    lines: [[0,1],[1,2],[1,3],[1,4],[2,3],[3,4]] },
  { name: 'Lion', emoji: '♌',
    stars: [[0.14,0.5],[0.22,0.26],[0.42,0.12],[0.62,0.2],[0.74,0.42],[0.6,0.56],[0.38,0.62],[0.24,0.82],[0.56,0.82]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[5,6],[6,7],[7,8],[8,6]] },
  { name: 'Vierge', emoji: '♍',
    stars: [[0.5,0.08],[0.5,0.3],[0.3,0.48],[0.22,0.65],[0.12,0.8],[0.55,0.5],[0.7,0.6],[0.82,0.72],[0.82,0.5]],
    lines: [[0,1],[1,2],[2,3],[3,4],[1,5],[5,6],[6,7],[6,8]] },
  { name: 'Balance', emoji: '♎',
    stars: [[0.5,0.1],[0.22,0.42],[0.78,0.42],[0.5,0.6],[0.1,0.62],[0.9,0.62]],
    lines: [[0,1],[0,2],[1,3],[2,3],[1,4],[2,5],[4,5]] },
  { name: 'Scorpion', emoji: '♏',
    stars: [[0.18,0.12],[0.34,0.24],[0.52,0.3],[0.64,0.46],[0.56,0.62],[0.42,0.72],[0.35,0.85],[0.48,0.92],[0.62,0.85]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]] },
  { name: 'Sagittaire', emoji: '♐',
    stars: [[0.5,0.1],[0.78,0.36],[0.5,0.44],[0.22,0.36],[0.38,0.68],[0.62,0.68],[0.5,0.88]],
    lines: [[0,1],[0,3],[2,1],[2,3],[2,4],[2,5],[4,6],[5,6]] },
  { name: 'Capricorne', emoji: '♑',
    stars: [[0.12,0.22],[0.38,0.12],[0.65,0.22],[0.86,0.44],[0.72,0.66],[0.5,0.78],[0.25,0.68],[0.12,0.45]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]] },
  { name: 'Verseau', emoji: '♒',
    stars: [[0.08,0.35],[0.3,0.18],[0.52,0.35],[0.74,0.18],[0.92,0.35],[0.08,0.65],[0.3,0.48],[0.52,0.65],[0.74,0.48],[0.92,0.65]],
    lines: [[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9]] },
  { name: 'Poissons', emoji: '♓',
    stars: [[0.15,0.18],[0.3,0.36],[0.15,0.52],[0.3,0.65],[0.15,0.82],[0.85,0.18],[0.7,0.36],[0.85,0.52],[0.7,0.65],[0.85,0.82],[0.5,0.5]],
    lines: [[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[1,10],[6,10]] },
];

function spawnConstellation(w: number, h: number, idx: number): ActiveConstellation {
  const margin = 150;
  return {
    def: ZODIAC[idx],
    cx: margin + Math.random() * (w - margin * 2),
    cy: 110 + Math.random() * (h - 230),
    scale: 140 + Math.random() * 80,
    timer: 0,
  };
}

function drawConstellation(ctx: CanvasRenderingContext2D, ac: ActiveConstellation): boolean {
  const { def, cx, cy, scale, timer } = ac;
  const ns = def.stars.length;
  const nl = def.lines.length;

  const T_stars = ns * 6;          // 6 frames per star  (~0.1s)
  const T_lines = T_stars + nl * 10; // 10 frames per line (~0.17s)
  const T_hold  = T_lines + 45;    // hold ~0.75s
  const T_fade  = T_hold  + 50;    // fade ~0.8s

  if (timer >= T_fade) return true;

  const gAlpha = timer > T_hold
    ? Math.max(0, 1 - (timer - T_hold) / 50)
    : 1;

  const ss = def.stars.map(([sx, sy]) => ({
    x: cx + (sx - 0.5) * scale,
    y: cy + (sy - 0.5) * scale,
  }));

  // Lines — drawn progressively, dashed
  for (let j = 0; j < nl; j++) {
    const ls = T_stars + j * 10;
    const p = Math.max(0, Math.min(1, (timer - ls) / 10));
    if (p <= 0) continue;
    const [ai, bi] = def.lines[j];
    const a = ss[ai]; const b = ss[bi];
    ctx.save();
    ctx.globalAlpha = gAlpha * 0.45;
    ctx.strokeStyle = 'rgba(195, 160, 255, 1)';
    ctx.lineWidth = 0.9;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Stars — fade in one by one with pulsing glow
  for (let i = 0; i < ns; i++) {
    const sa = Math.max(0, Math.min(1, (timer - i * 6) / 6));
    if (sa <= 0) continue;
    const { x, y } = ss[i];
    const pulse = 0.7 + 0.3 * Math.sin(timer * 0.09 + i * 1.3);
    const a = gAlpha * sa;
    const r = 12 * pulse;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, `rgba(215, 190, 255, ${(a * 0.6 * pulse).toFixed(3)})`);
    glow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 250, 230, ${(a * 0.95).toFixed(3)})`;
    ctx.fill();
  }

  // Label — appears after all stars
  if (timer > T_stars + 4) {
    const la = Math.min(1, (timer - T_stars - 4) / 15) * gAlpha;
    if (la > 0.01) {
      const minY = Math.min(...ss.map(s => s.y));
      ctx.save();
      ctx.globalAlpha = la;
      ctx.fillStyle = 'rgba(212, 175, 55, 1)';
      ctx.font = '600 13px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fillText(`${def.emoji}  ${def.name}`, cx, Math.max(22, minY - 18));
      ctx.restore();
    }
  }

  return false;
}

// Tailles de météores : 0=fine, 1=normale, 2=grosse
function makeMeteor(w: number, h: number): Meteor {
  const tier = Math.random();
  const isBig   = tier > 0.80;  // 20% grosses
  const isMicro = tier < 0.25;  // 25% micro
  const angle = (Math.random() * 35 + 15) * (Math.PI / 180); // 15–50°
  const speed  = isBig ? Math.random() * 10 + 12
               : isMicro ? Math.random() * 4  + 4
               : Math.random() * 8  + 7;
  const length = isBig ? Math.random() * 180 + 140
               : isMicro ? Math.random() * 50  + 30
               : Math.random() * 110 + 70;
  return {
    x: Math.random() * w,
    y: Math.random() * h * 0.55,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    length,
    opacity: isMicro ? Math.random() * 0.4 + 0.3 : Math.random() * 0.5 + 0.5,
    life: 0,
    decay: isBig ? Math.random() * 0.007 + 0.005
         : isMicro ? Math.random() * 0.022 + 0.016
         : Math.random() * 0.013 + 0.009,
    active: true,
  };
}

function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 3 depth layers — speeds noticeably different
    const makeLayer = (count: number, sizeMax: number, speedMax: number): Star[] =>
      Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * sizeMax + 0.2,
        opacity: Math.random() * 0.6 + 0.25,
        twinkleSpeed: Math.random() * 0.06 + 0.02,   // faster twinkle
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * speedMax,
        vy: Math.random() * speedMax * 0.7 + speedMax * 0.2,  // strong downward drift
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      }));

    const stars = [
      ...makeLayer(200, 0.8,  0.12),  // far — slow
      ...makeLayer(100, 1.5,  0.28),  // mid
      ...makeLayer(35,  2.4,  0.55),  // close — fast + big
    ];

    const meteors: Meteor[] = [];
    // Spawn 2 meteors at start for immediate effect
    meteors.push(makeMeteor(window.innerWidth, window.innerHeight));
    meteors.push(makeMeteor(window.innerWidth, window.innerHeight));
    let nextMeteor = 40 + Math.random() * 60;

    // ── Constellation state ─────────────────────────────────────────────────
    let zodiacIndex = 0;
    let activeConst: ActiveConstellation | null = null;
    let constGapTimer = 60;

    const draw = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // ── Milky Way band (faster oscillation) ──────────────────────────────
      const shift = Math.sin(frame * 0.012) * 0.09; // ±9% — clearly visible wave
      const band = ctx.createLinearGradient(0, h * (0.03 + shift), w, h * (0.92 + shift));
      band.addColorStop(0,    'transparent');
      band.addColorStop(0.22, 'rgba(90, 30, 160, 0.04)');
      band.addColorStop(0.42, 'rgba(140, 70, 220, 0.08)');
      band.addColorStop(0.50, 'rgba(165, 95, 240, 0.13)');
      band.addColorStop(0.58, 'rgba(212, 175, 55,  0.06)');
      band.addColorStop(0.78, 'rgba(90, 30, 160,  0.04)');
      band.addColorStop(1,    'transparent');
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, w, h);

      const coreShift = Math.sin(frame * 0.018 + 1) * 0.07;
      const core = ctx.createLinearGradient(w * 0.1, h * (0.08 + coreShift), w * 0.9, h * (0.88 + coreShift));
      core.addColorStop(0,    'transparent');
      core.addColorStop(0.38, 'transparent');
      core.addColorStop(0.47, 'rgba(185, 130, 255, 0.05)');
      core.addColorStop(0.50, 'rgba(205, 165, 255, 0.09)');
      core.addColorStop(0.53, 'rgba(185, 130, 255, 0.05)');
      core.addColorStop(0.62, 'transparent');
      core.addColorStop(1,    'transparent');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      // ── Stars ────────────────────────────────────────────────────────────
      for (const star of stars) {
        star.twinklePhase += star.twinkleSpeed;
        star.x += star.vx;
        star.y += star.vy;
        // wrap
        if (star.x < -4) star.x = w + 4;
        if (star.x > w + 4) star.x = -4;
        if (star.y > h + 4) star.y = -4;
        if (star.y < -4) star.y = h + 4;

        const tw = 0.45 + 0.55 * Math.sin(star.twinklePhase);
        const alpha = star.opacity * tw;

        // Glow halo
        if (star.size > 1.0) {
          const radius = star.size * (3.5 + 1.5 * tw);
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, radius);
          glow.addColorStop(0, `${star.color}${(alpha * 0.55).toFixed(3)})`);
          glow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${alpha.toFixed(3)})`;
        ctx.fill();

        // Cross-flare on brightest stars
        if (star.size > 1.9) {
          ctx.save();
          ctx.globalAlpha = alpha * 0.4;
          ctx.strokeStyle = `${star.color}1)`;
          ctx.lineWidth = 0.6;
          const fl = star.size * (5 + 3 * tw);
          ctx.beginPath();
          ctx.moveTo(star.x - fl, star.y);
          ctx.lineTo(star.x + fl, star.y);
          ctx.moveTo(star.x, star.y - fl);
          ctx.lineTo(star.x, star.y + fl);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── Meteors (shooting stars) ─────────────────────────────────────────
      nextMeteor--;
      if (nextMeteor <= 0) {
        // Spawn 1 to 3 meteors at a time
        const burst = Math.random() < 0.25 ? 3 : Math.random() < 0.5 ? 2 : 1;
        for (let b = 0; b < burst; b++) meteors.push(makeMeteor(w, h));
        nextMeteor = 55 + Math.random() * 85; // ~1–2.5s between bursts
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life += m.decay;
        if (m.life >= 1) { meteors.splice(i, 1); continue; }

        const fade = m.life < 0.3
          ? m.life / 0.3
          : 1 - (m.life - 0.3) / 0.7;
        const alpha = m.opacity * fade;

        const speed = Math.hypot(m.vx, m.vy);
        const nx = m.vx / speed;
        const ny = m.vy / speed;
        const tailX = m.x - nx * m.length;
        const tailY = m.y - ny * m.length;

        // Line width & head size scale with meteor size
        const lw   = m.length > 120 ? 2.5 : m.length > 70 ? 1.5 : 0.8;
        const hRad = m.length > 120 ? 7   : m.length > 70 ? 4   : 2;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0,   'transparent');
        grad.addColorStop(0.5, `rgba(210, 185, 255, ${(alpha * 0.35).toFixed(3)})`);
        grad.addColorStop(1,   `rgba(255, 255, 255, ${alpha.toFixed(3)})`);

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // bright head
        const head = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, hRad);
        head.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
        head.addColorStop(0.4, `rgba(220, 200, 255, ${(alpha * 0.6).toFixed(3)})`);
        head.addColorStop(1, 'transparent');
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.arc(m.x, m.y, hRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── Constellation rendering ────────────────────────────────────────────
      if (activeConst === null) {
        constGapTimer--;
        if (constGapTimer <= 0) {
          activeConst = spawnConstellation(w, h, zodiacIndex);
          zodiacIndex = (zodiacIndex + 1) % ZODIAC.length;
        }
      } else {
        activeConst.timer++;
        const isDone = drawConstellation(ctx, activeConst);
        if (isDone) {
          activeConst = null;
          constGapTimer = 20 + Math.random() * 30; // ~0.3–0.8s gap
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

export default Starfield;
