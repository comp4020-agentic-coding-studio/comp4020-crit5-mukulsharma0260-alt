// The procedural graveyard behind Wake.
//
// Everything here is static and dark, painted once per resize onto an
// offscreen canvas that `game.ts` blits every frame. Nothing in this file
// moves, holds gameplay state, or reads the clock.

function createRng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawSkull(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#0f1219";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, 7);
  ctx.lineTo(-5, 12);
  ctx.lineTo(5, 12);
  ctx.lineTo(6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#05070b";
  ctx.beginPath();
  ctx.ellipse(-3.9, -1, 2.7, 3.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3.9, -1, 2.7, 3.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(-1.6, 6);
  ctx.lineTo(1.6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(150,190,220,.16)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 9, 0, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();
}

function drawGravestone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
): void {
  const rng = createRng(seed);
  const lean = (rng() - 0.5) * 0.13;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.fillStyle = "#0d1017";
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(-w / 2, -h + w / 2);
  ctx.arc(0, -h + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(w / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(150,195,225,.20)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(-w / 2, -h + w / 2);
  ctx.arc(0, -h + w / 2, w / 2, Math.PI, Math.PI * 1.45);
  ctx.stroke();
  if (rng() > 0.55) {
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.7);
    ctx.lineTo(w * 0.05, -h * 0.45);
    ctx.lineTo(-w * 0.1, -h * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDeadTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, seed: number): void {
  const rng = createRng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#0b0e14";
  ctx.lineCap = "round";
  const branch = (x0: number, y0: number, angle: number, len: number, width: number, depth: number): void => {
    if (depth === 0 || len < 6) return;
    const x1 = x0 + Math.cos(angle) * len;
    const y1 = y0 + Math.sin(angle) * len;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    branch(x1, y1, angle - 0.34 - rng() * 0.3, len * (0.68 + rng() * 0.12), width * 0.66, depth - 1);
    branch(x1, y1, angle + 0.34 + rng() * 0.3, len * (0.68 + rng() * 0.12), width * 0.66, depth - 1);
  };
  branch(0, 0, -Math.PI / 2, 58, 9, 6);
  ctx.restore();
}

function drawWeb(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, quadrant: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(170,200,225,.10)";
  ctx.lineWidth = 0.8;
  const a0 = (quadrant * Math.PI) / 2;
  const a1 = a0 + Math.PI / 2;
  for (let i = 0; i <= 6; i++) {
    const a = a0 + (a1 - a0) * (i / 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    ctx.stroke();
  }
  for (let ring = 1; ring <= 5; ring++) {
    const rr = (radius * ring) / 5;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (a1 - a0) * (i / 6);
      const sag = rr * 0.055;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i) ctx.quadraticCurveTo(Math.cos(a - 0.13) * (rr - sag), Math.sin(a - 0.13) * (rr - sag), px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSnake(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = "#0c1016";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-26, 10);
  ctx.bezierCurveTo(-6, -14, 16, 20, 30, -2);
  ctx.bezierCurveTo(38, -14, 22, -22, 12, -14);
  ctx.stroke();
  ctx.strokeStyle = "rgba(150,195,225,.13)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-26, 7);
  ctx.bezierCurveTo(-6, -17, 16, 17, 30, -5);
  ctx.stroke();
  ctx.restore();
}

/** Paint the graveyard onto a fresh offscreen canvas sized for this viewport. */
export function buildBackdrop(width: number, height: number, dpr: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas context unavailable");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rng = createRng(1337);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#080c14");
  sky.addColorStop(0.55, "#0a0e15");
  sky.addColorStop(1, "#05070b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 130; i++) {
    const x = rng() * width;
    const y = rng() * height * 0.62;
    const a = rng() * 0.5 + 0.06;
    ctx.fillStyle = `rgba(200,225,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, rng() * 1.1 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const mx = width * 0.82;
  const my = height * 0.15;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
  halo.addColorStop(0, "rgba(170,205,235,.18)");
  halo.addColorStop(1, "rgba(170,205,235,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(mx, my, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(214,232,248,.85)";
  ctx.beginPath();
  ctx.arc(mx, my, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(10,14,20,.28)";
  ctx.beginPath();
  ctx.arc(mx - 7, my - 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx + 8, my + 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx + 2, my - 11, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#070a10";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.62);
  for (let x = 0; x <= width; x += 26) {
    ctx.lineTo(x, height * 0.62 - 14 - Math.sin(x * 0.012) * 10 - rng() * 22);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  drawDeadTree(ctx, width * 0.08, height * 0.7, 1.15, 21);
  drawDeadTree(ctx, width * 0.93, height * 0.66, 0.85, 42);

  const stones = Math.max(7, Math.round(width / 165));
  for (let i = 0; i < stones; i++) {
    const x = (i + 0.5) * (width / stones) + (rng() - 0.5) * 40;
    const depth = 0.62 + rng() * 0.34;
    const y = height * depth + 40;
    const w = 26 + rng() * 20;
    const h = 46 + rng() * 46;
    drawGravestone(ctx, x, y, w * (0.6 + depth * 0.6), h * (0.6 + depth * 0.6), 100 + i);
  }

  const ground = ctx.createLinearGradient(0, height * 0.72, 0, height);
  ground.addColorStop(0, "rgba(9,12,18,0)");
  ground.addColorStop(1, "rgba(4,6,10,.9)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, height * 0.72, width, height * 0.28);

  for (let i = 0; i < 6; i++) {
    drawSkull(
      ctx,
      40 + rng() * (width - 80),
      height * 0.8 + rng() * (height * 0.17),
      0.55 + rng() * 0.5,
      0.5 + rng() * 0.3,
    );
  }

  drawSnake(ctx, width * 0.22, height * 0.9, 1.05);
  drawWeb(ctx, 0, 0, Math.min(190, width * 0.3), 0);
  drawWeb(ctx, width, 0, Math.min(160, width * 0.26), 1);
  drawWeb(ctx, width, height, Math.min(130, width * 0.22), 2);

  return canvas;
}
