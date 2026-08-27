// The things in Wake that move.
//
// Warm and glowing is the player's lantern and the wisp it's chasing; cold
// and glowing is a wraith. Fog is the one decoration allowed to drift, and it
// is drawn so it never reads as a creature. Nothing here holds game state
// beyond what's handed in, and nothing here decides the rules — that's
// `rules.ts`.

import type { Point } from "./rules";
import { RULES } from "./rules";

export interface FogWisp {
  x: number;
  y: number;
  r: number;
  v: number;
  a: number;
}

/** A stacked radial-gradient bloom, the light-pool effect behind every glow. */
export function bloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rgb: string,
  strength: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 3; i >= 1; i--) {
    const rr = r * i * 0.9;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, `rgba(${rgb},${strength / (i * 1.5)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The player's lantern: warm, breathing while idle, flickering always. */
export function drawLantern(ctx: CanvasRenderingContext2D, p: Point, t: number, idle: boolean): void {
  const flick = 1 + Math.sin(t * 17) * 0.045 + Math.sin(t * 6.3) * 0.05;
  const breathe = idle ? 1 + Math.sin(t * 2.4) * 0.14 : 1;
  const R = RULES.PLAYER_R * breathe;

  bloom(ctx, p.x, p.y, R * 9 * flick, "255,196,120", 0.3);
  bloom(ctx, p.x, p.y, R * 3 * flick, "255,224,168", 0.75);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,247,230,.98)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, R * flick, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (idle) {
    ctx.strokeStyle = `rgba(255,206,140,${0.26 + Math.sin(t * 2.4) * 0.1})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 28 + Math.sin(t * 2.4) * 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** The light the player is chasing: warm, bobbing, teardrop-shaped. */
export function drawWisp(ctx: CanvasRenderingContext2D, p: Point, t: number): void {
  const bob = Math.sin(t * 2.6) * 3;
  const y = p.y + bob;
  const pulse = 1 + Math.sin(t * 4.1) * 0.15;

  bloom(ctx, p.x, y, RULES.TARGET_R * 5 * pulse, "255,206,130", 0.42);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.moveTo(p.x, y - RULES.TARGET_R * 1.5 * pulse);
  ctx.bezierCurveTo(
    p.x + RULES.TARGET_R,
    y - RULES.TARGET_R * 0.2,
    p.x + RULES.TARGET_R * 0.7,
    y + RULES.TARGET_R * 0.9,
    p.x,
    y + RULES.TARGET_R * 0.9,
  );
  ctx.bezierCurveTo(
    p.x - RULES.TARGET_R * 0.7,
    y + RULES.TARGET_R * 0.9,
    p.x - RULES.TARGET_R,
    y - RULES.TARGET_R * 0.2,
    p.x,
    y - RULES.TARGET_R * 1.5 * pulse,
  );
  ctx.fillStyle = "rgba(255,226,164,.95)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x, y + RULES.TARGET_R * 0.15, RULES.TARGET_R * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,252,240,.95)";
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = `rgba(255,206,130,${0.3 + Math.sin(t * 4.1) * 0.12})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(p.x, y, RULES.TARGET_R * 2.1 + Math.sin(t * 4.1) * 4, 0, Math.PI * 2);
  ctx.stroke();
}

/** A wraith walking its recorded route: cold, tattered, hollow-eyed. */
export function drawWraith(ctx: CanvasRenderingContext2D, p: Point, t: number, seed: number): void {
  const sway = Math.sin(t * 1.7 + seed) * 3.2;
  const R = RULES.GHOST_R;

  bloom(ctx, p.x, p.y, R * 3.2, "150,215,255", 0.55);

  ctx.save();
  ctx.translate(p.x + sway, p.y);

  ctx.beginPath();
  ctx.moveTo(-R * 1.25, R * 0.25);
  ctx.bezierCurveTo(-R * 1.4, -R * 1.5, R * 1.4, -R * 1.5, R * 1.25, R * 0.25);
  const tails = 7;
  for (let i = tails; i >= 0; i--) {
    const fx = -R * 1.25 + (R * 2.5) * (i / tails);
    const wob = Math.sin(t * 3.4 + i * 1.25 + seed) * 4.5;
    const len = R * (1.5 + (i % 2 ? 0.9 : 0.35)) + wob;
    ctx.lineTo(fx, R * 0.25 + len);
    ctx.lineTo(fx - R * 0.18, R * 0.25 + len * 0.55);
  }
  ctx.closePath();
  const shroud = ctx.createLinearGradient(0, -R * 1.5, 0, R * 3);
  shroud.addColorStop(0, "rgba(206,240,255,.92)");
  shroud.addColorStop(0.45, "rgba(130,190,230,.55)");
  shroud.addColorStop(1, "rgba(90,150,200,0)");
  ctx.fillStyle = shroud;
  ctx.fill();

  ctx.fillStyle = "rgba(6,12,20,.92)";
  ctx.beginPath();
  ctx.ellipse(-R * 0.42, -R * 0.2, R * 0.24, R * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(R * 0.42, -R * 0.2, R * 0.24, R * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(190,245,255,.75)";
  ctx.beginPath();
  ctx.arc(-R * 0.42, -R * 0.16, R * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(R * 0.42, -R * 0.16, R * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/** Fresh fog wisps for a viewport of this size — the only decoration that drifts. */
export function createFog(width: number, height: number, count = 16): FogWisp[] {
  const fog: FogWisp[] = [];
  for (let i = 0; i < count; i++) {
    fog.push({
      x: Math.random() * width,
      y: height * (0.55 + Math.random() * 0.45),
      r: 120 + Math.random() * 220,
      v: 4 + Math.random() * 11,
      a: 0.018 + Math.random() * 0.03,
    });
  }
  return fog;
}

/** Advance and draw fog in place. Never a creature: it only ever drifts sideways. */
export function drawFog(ctx: CanvasRenderingContext2D, fog: FogWisp[], width: number, dt: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const f of fog) {
    f.x += f.v * dt;
    if (f.x - f.r > width) f.x = -f.r;
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
    g.addColorStop(0, `rgba(120,150,185,${f.a})`);
    g.addColorStop(1, "rgba(120,150,185,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
