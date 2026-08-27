// The rules of Wake, as pure functions.
//
// Everything here is deterministic and side-effect free so the game's core
// contract can be asserted without a canvas, a clock or a browser. The
// renderer and input layer import these; they never reimplement them.

export interface Point {
  x: number;
  y: number;
}

export interface Wraith {
  /** the path the player walked, sampled */
  path: Point[];
  /** cumulative arc length, same length as path */
  acc: number[];
  /** starting offset along the path, in px */
  offset: number;
}

export const RULES = {
  PLAYER_R: 9,
  GHOST_R: 10,
  TARGET_R: 14,
  /** centre-to-centre distance at which a wraith catches the player */
  CATCH_DIST: 18,
  /** how fast a wraith walks its recorded path, px/sec */
  GHOST_SPEED: 165,
  /** the player must move this far before a new point is recorded */
  SAMPLE_MIN: 6,
  /** a new light must be at least this far from every recorded path */
  TARGET_CLEARANCE: 62,
  /** ...and this far from the player, so it is never a freebie */
  TARGET_MIN_FROM_PLAYER: 150,
} as const;

/** Cumulative arc lengths along a polyline. */
export function arcLengths(path: Point[]): number[] {
  const acc = [0];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    acc.push(acc[i - 1]! + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return acc;
}

/** The point at arc-length `s` along a polyline, clamped at both ends. */
export function pointAtLength(path: Point[], acc: number[], s: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return { ...path[0]! };
  const total = acc[acc.length - 1]!;
  if (s <= 0) return { ...path[0]! };
  if (s >= total) return { ...path[path.length - 1]! };
  let lo = 0;
  let hi = acc.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (acc[mid]! <= s) lo = mid;
    else hi = mid;
  }
  const span = acc[hi]! - acc[lo]! || 1;
  const t = (s - acc[lo]!) / span;
  const a = path[lo]!;
  const b = path[hi]!;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Fold a distance into a forward-then-backward walk of length `total`.
 * A wraith never teleports back to its start; it paces.
 */
export function pingPong(s: number, total: number): number {
  if (total <= 0) return 0;
  const cycle = total * 2;
  const m = ((s % cycle) + cycle) % cycle;
  return m <= total ? m : cycle - m;
}

/** Where a wraith is, `seconds` after it was raised. */
export function wraithAt(wraith: Wraith, seconds: number): Point {
  const total = wraith.acc[wraith.acc.length - 1] ?? 0;
  return pointAtLength(wraith.path, wraith.acc, pingPong(wraith.offset + seconds * RULES.GHOST_SPEED, total));
}

/**
 * THE RULE OF THE GAME.
 * The round ends the instant a wraith is touching the player.
 */
export function isCaught(player: Point, wraiths: Point[], dist: number = RULES.CATCH_DIST): boolean {
  return wraiths.some((w) => Math.hypot(w.x - player.x, w.y - player.y) < dist);
}

/** Shortest distance from a point to a polyline. */
export function distToPath(p: Point, path: Point[]): number {
  if (path.length === 0) return Infinity;
  if (path.length === 1) return Math.hypot(p.x - path[0]!.x, p.y - path[0]!.y);
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    best = Math.min(best, Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t)));
  }
  return best;
}

/**
 * Choose where the next light appears: far enough from the player that it is
 * never a freebie, and clear of existing wraith paths so it is never a trap.
 * Falls back to the roomiest candidate rather than failing.
 */
export function pickTarget(
  width: number,
  height: number,
  wraiths: Wraith[],
  player: Point,
  rng: () => number = Math.random,
): Point {
  const pad = 54;
  let best: Point | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < 90; i++) {
    const p = { x: pad + rng() * (width - pad * 2), y: pad + rng() * (height - pad * 2) };
    const fromPlayer = Math.hypot(p.x - player.x, p.y - player.y);
    if (fromPlayer < RULES.TARGET_MIN_FROM_PLAYER) continue;
    let clear = Infinity;
    for (const w of wraiths) clear = Math.min(clear, distToPath(p, w.path));
    if (clear >= RULES.TARGET_CLEARANCE) return p;
    const score = clear + fromPlayer * 0.08;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best ?? { x: width / 2, y: height / 2 };
}
