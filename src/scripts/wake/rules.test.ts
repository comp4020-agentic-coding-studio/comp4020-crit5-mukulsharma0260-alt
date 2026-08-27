import { describe, expect, it } from "vitest";

import { RULES, arcLengths, distToPath, wraithAt, isCaught, pickTarget, pingPong } from "./rules";

// The focused test for crit 5 covers ONE rule: a wraith touching the player
// ends the round. Everything else here exists to make that rule trustworthy —
// a wraith that sits in the wrong place would make the rule fire at the wrong
// time, so where a wraith *is* is part of the same contract.

const straight = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

describe("the rule: a wraith touching you ends the round", () => {
  it("ends the round when a wraith is inside the catch distance", () => {
    const player = { x: 200, y: 200 };
    const wraith = { x: 200 + RULES.CATCH_DIST - 1, y: 200 };
    expect(isCaught(player, [wraith])).toBe(true);
  });

  it("does not end the round when a wraith is outside the catch distance", () => {
    const player = { x: 200, y: 200 };
    const wraith = { x: 200 + RULES.CATCH_DIST + 1, y: 200 };
    expect(isCaught(player, [wraith])).toBe(false);
  });

  it("is exclusive at exactly the catch distance, so grazing is survivable", () => {
    const player = { x: 0, y: 0 };
    expect(isCaught(player, [{ x: RULES.CATCH_DIST, y: 0 }])).toBe(false);
  });

  it("cannot end the round when there are no wraiths — the first light is always safe", () => {
    expect(isCaught({ x: 10, y: 10 }, [])).toBe(false);
  });

  it("ends the round if ANY echo is touching, not just the first", () => {
    const player = { x: 0, y: 0 };
    const far = { x: 900, y: 900 };
    const near = { x: 5, y: 0 };
    expect(isCaught(player, [far, far, near])).toBe(true);
  });
});

describe("a wraith paces its path instead of teleporting", () => {
  it("mirrors past the end rather than wrapping to the start", () => {
    expect(pingPong(25, 100)).toBe(25);
    expect(pingPong(100, 100)).toBe(100);
    expect(pingPong(175, 100)).toBe(25);
    expect(pingPong(200, 100)).toBe(0);
  });

  it("never leaves the recorded path", () => {
    const wraith = { path: straight, acc: arcLengths(straight), offset: 0 };
    for (let t = 0; t < 12; t += 0.137) {
      const p = wraithAt(wraith, t);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBe(0);
    }
  });

  it("starts at the far end of the path from where the player just arrived", () => {
    const wraith = { path: straight, acc: arcLengths(straight), offset: 0 };
    expect(wraithAt(wraith, 0)).toEqual({ x: 0, y: 0 });
  });
});

describe("a new light is never a trap and never a freebie", () => {
  it("keeps clear of existing echo paths", () => {
    const wraiths = [{ path: straight, acc: arcLengths(straight), offset: 0 }];
    const player = { x: 500, y: 500 };
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 40; i++) {
      const t = pickTarget(800, 600, wraiths, player, rng);
      expect(distToPath(t, straight)).toBeGreaterThanOrEqual(RULES.TARGET_CLEARANCE);
    }
  });

  it("never lands on top of the player", () => {
    const player = { x: 400, y: 300 };
    let seed = 7;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 40; i++) {
      const t = pickTarget(800, 600, [], player, rng);
      expect(Math.hypot(t.x - player.x, t.y - player.y)).toBeGreaterThanOrEqual(
        RULES.TARGET_MIN_FROM_PLAYER,
      );
    }
  });
});
