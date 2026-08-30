// Wires the pure rules (rules.ts) to the graveyard (backdrop.ts) and the
// things that move (sprites.ts) into a playable round of Wake.
//
// State machine: IDLE -> PLAYING -> DEAD -> IDLE. The first pointer movement
// starts a round; touching a wraith ends one; the pointer movement that ends
// the post-death grace period both resets and starts the next round —
// wordlessly, with no button.

import type { Point, Wraith } from "./rules";
import { RULES, arcLengths, wraithAt, isCaught, pickTarget } from "./rules";
import { buildBackdrop } from "./backdrop";
import type { FogWisp } from "./sprites";
import { drawLantern, drawWisp, drawWraith, createFog, drawFog } from "./sprites";

type GameState = "idle" | "playing" | "dead";

// A route becomes a wraith only once it's an actual route, not a reset's
// single starting point.
const MIN_ROUTE_POINTS = 2;

// How quickly the lantern eases toward the pointer — deliberate lag, not a snap.
const EASE_RATE = 11;

// How long after death a pointer movement is ignored, before it wordlessly resets.
const DEATH_GRACE_MS = 1000;

interface LiveWraith {
  wraith: Wraith;
  born: number;
  seed: number;
  pos: Point;
}

interface WakeDebug {
  peek: () => {
    state: GameState;
    score: number;
    wraiths: number;
    player: Point;
    target: Point;
  };
  RULES: typeof RULES;
  isCaught: typeof isCaught;
  wraithAt: typeof wraithAt;
}

declare global {
  interface Window {
    __wake?: WakeDebug;
  }
}

function makeGrainTile(): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = 128;
  tile.height = 128;
  const ctx = tile.getContext("2d");
  if (!ctx) throw new Error("2d canvas context unavailable");
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 13;
  }
  ctx.putImageData(img, 0, 0);
  return tile;
}

export function startGame(canvas: HTMLCanvasElement, scoreEl: HTMLElement): void {
  const ctx: CanvasRenderingContext2D = (() => {
    const c = canvas.getContext("2d");
    if (!c) throw new Error("2d canvas context unavailable");
    return c;
  })();

  const grainTile = makeGrainTile();

  let W = 0;
  let H = 0;
  let dpr = 1;
  let backdrop: HTMLCanvasElement = buildBackdrop(1, 1, 1);
  let fog: FogWisp[] = [];

  let state: GameState = "idle";
  let player: Point = { x: 0, y: 0 };
  let aim: Point = { x: 0, y: 0 };
  let target: Point = { x: 0, y: 0 };
  let wraiths: LiveWraith[] = [];
  let recording: Point[] = [];
  let score = 0;
  let deadAt = 0;
  let shake = 0;

  function resize(): void {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    backdrop = buildBackdrop(W, H, dpr);
    fog = createFog(W, H);
  }

  function reset(): void {
    state = "idle";
    player = { x: W / 2, y: H * 0.66 };
    aim = { ...player };
    wraiths = [];
    recording = [{ ...player }];
    score = 0;
    deadAt = 0;
    scoreEl.textContent = "0";
    scoreEl.classList.remove("big");
    target = pickTarget(W, H, [], player);
  }

  function collect(now: number): void {
    score += 1;
    scoreEl.textContent = String(score);
    scoreEl.classList.add("big");
    window.setTimeout(() => scoreEl.classList.remove("big"), 260);

    if (recording.length > MIN_ROUTE_POINTS) {
      const path = recording.slice();
      const wraith: Wraith = { path, acc: arcLengths(path), offset: 0 };
      wraiths.push({ wraith, born: now, seed: wraiths.length * 97 + 13, pos: wraithAt(wraith, 0) });
    }
    recording = [{ x: player.x, y: player.y }];
    target = pickTarget(
      W,
      H,
      wraiths.map((w) => w.wraith),
      player,
    );
  }

  function die(now: number): void {
    state = "dead";
    deadAt = now;
    shake = 16;
  }

  function update(now: number): void {
    if (state !== "playing") return;

    const dt = Math.min(0.05, (now - lastFrameT) / 1000);

    // 1. move player toward aim
    const ease = Math.min(1, dt * EASE_RATE);
    player.x += (aim.x - player.x) * ease;
    player.y += (aim.y - player.y) * ease;

    // 2. record route samples
    const last = recording[recording.length - 1]!;
    if (Math.hypot(player.x - last.x, player.y - last.y) > RULES.SAMPLE_MIN) {
      recording.push({ x: player.x, y: player.y });
    }

    // 3. calculate positions of EXISTING wraiths
    const positions: Point[] = wraiths.map((w) => wraithAt(w.wraith, (now - w.born) / 1000));
    wraiths.forEach((w, i) => {
      w.pos = positions[i]!;
    });

    // 4. existing-wraith collision beats collection on the same frame
    if (isCaught(player, positions)) {
      die(now);
      return;
    }

    // 5. otherwise, reaching the target collects it
    if (Math.hypot(player.x - target.x, player.y - target.y) < RULES.PLAYER_R + RULES.TARGET_R) {
      collect(now);
    }
  }

  function render(now: number, dt: number): void {
    const t = now / 1000;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!reducedMotion && shake > 0) {
      shake *= 0.88;
      if (shake < 0.4) shake = 0;
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    } else {
      shake = 0;
    }

    // 1. static backdrop
    ctx.clearRect(-30, -30, W + 60, H + 60);
    ctx.drawImage(backdrop, 0, 0, W, H);

    // 2. fog — the only decoration allowed to drift, damped rather than moved under reduced motion
    drawFog(ctx, fog, W, reducedMotion ? 0 : dt);

    // 3. walked wraith paths — dim, but readable: this is strategic information
    for (const w of wraiths) {
      const path = w.wraith.path;
      ctx.beginPath();
      ctx.moveTo(path[0]!.x, path[0]!.y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i]!.x, path[i]!.y);
      ctx.strokeStyle = "rgba(140,205,245,.15)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    // 4. target / wisp
    if (state !== "dead") drawWisp(ctx, target, t);

    // 5. wraiths
    for (const w of wraiths) drawWraith(ctx, w.pos, t, w.seed);

    // 6. minimal impact feedback — a fading ring at the point of the catch
    if (state === "dead") {
      const k = Math.min(1, (now - deadAt) / 450);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,90,90,${0.5 * (1 - k)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, RULES.CATCH_DIST + k * 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 7. lantern
    if (state !== "dead") drawLantern(ctx, player, t, state === "idle");

    // 8. vignette
    const vignette = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.32,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.78,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.72)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // 9. restrained grain, and a death flash that fades out
    if (!reducedMotion) {
      const pattern = ctx.createPattern(grainTile, "repeat");
      if (pattern) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.translate(((now * 0.03) % 128) - 128, ((now * 0.017) % 128) - 128);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, W + 256, H + 256);
        ctx.restore();
      }
    }
    if (state === "dead") {
      const k = Math.min(1, (now - deadAt) / 500);
      ctx.fillStyle = `rgba(150,20,25,${0.3 * (1 - k)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function onPointer(e: PointerEvent): void {
    const touch = e.pointerType === "touch";

    if (state === "dead" && performance.now() - deadAt > DEATH_GRACE_MS) {
      reset();
      aim.x = e.clientX;
      aim.y = e.clientY - (touch ? 40 : 0);
      state = "playing";
      return;
    }

    aim.x = e.clientX;
    aim.y = e.clientY - (touch ? 40 : 0);
    if (state === "idle") state = "playing";
  }

  let lastFrameT = performance.now();
  function frame(now: number): void {
    update(now);
    render(now, Math.min(0.05, (now - lastFrameT) / 1000));
    lastFrameT = now;
    requestAnimationFrame(frame);
  }

  resize();
  reset();

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });

  requestAnimationFrame(frame);

  window.__wake = {
    peek: () => ({
      state,
      score,
      wraiths: wraiths.length,
      player: { ...player },
      target: { ...target },
    }),
    RULES,
    isCaught,
    wraithAt,
  };
}
