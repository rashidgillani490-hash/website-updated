import { describe, expect, it } from "vitest";
import {
  clamp01,
  houseDriftFor,
  interp,
  poseFor,
  poseForTrack,
  SCENE_SPLIT,
  SCENES,
  trapezoid,
} from "./story";

describe("clamp01", () => {
  it("clamps to the unit interval", () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.3)).toBe(0.3);
    expect(clamp01(5)).toBe(1);
  });
});

describe("interp", () => {
  it("maps within range and clamps the ends", () => {
    expect(interp(-1, [0, 1], [10, 20])).toBe(10);
    expect(interp(0.5, [0, 1], [10, 20])).toBe(15);
    expect(interp(2, [0, 1], [10, 20])).toBe(20);
  });

  it("handles multi-segment inputs", () => {
    expect(interp(0.25, [0, 0.5, 1], [0, 100, 0])).toBe(50);
    expect(interp(0.75, [0, 0.5, 1], [0, 100, 0])).toBe(50);
  });
});

describe("trapezoid", () => {
  it("ramps up, holds at 1, then ramps down", () => {
    expect(trapezoid(0, 0.2, 0.4, 0.6, 0.8)).toBe(0);
    expect(trapezoid(0.3, 0.2, 0.4, 0.6, 0.8)).toBeCloseTo(0.5);
    expect(trapezoid(0.5, 0.2, 0.4, 0.6, 0.8)).toBe(1);
    expect(trapezoid(0.7, 0.2, 0.4, 0.6, 0.8)).toBeCloseTo(0.5);
    expect(trapezoid(1, 0.2, 0.4, 0.6, 0.8)).toBe(0);
  });
});

describe("poseFor — cinematic", () => {
  it("holds still before the rotate window and completes one full turn", () => {
    expect(poseFor(0).spin).toBe(0);
    expect(poseFor(SCENES.rotate[0]).spin).toBe(0);
    expect(poseFor(SCENES.rotate[1]).spin).toBeCloseTo(Math.PI * 2);
    expect(poseFor(1).spin).toBeCloseTo(Math.PI * 2);
  });

  it("spin is monotonic non-decreasing across the whole track", () => {
    let prev = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const s = poseFor(p).spin;
      expect(s).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = s;
    }
  });

  it("lifts the cap only after the rotate window, and keeps it lifted", () => {
    expect(poseFor(SCENES.cap[0]).capLift).toBe(0);
    expect(poseFor(SCENES.cap[1]).capLift).toBeCloseTo(1);
    expect(poseFor(1).capLift).toBeCloseTo(1);
  });

  it("sprays only inside the spray window", () => {
    expect(poseFor(0).spray).toBe(0);
    expect(poseFor(SCENES.spray[0]).spray).toBe(0);
    expect(poseFor(0.66).spray).toBeGreaterThan(0.2);
    expect(poseFor(SCENES.spray[1]).spray).toBe(0);
    expect(poseFor(1).spray).toBe(0);
  });

  it("dolly stays within [0,1] and never fully zooms", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const d = poseFor(p).dolly;
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(1);
    }
    expect(poseFor(1).dolly).toBeLessThan(0.6);
  });

  it("keeps translation, scale and emphasis inside a restrained band", () => {
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const { posX, posY, scale, emphasis } = poseFor(p);
      expect(posX).toBeGreaterThanOrEqual(0);
      expect(posX).toBeLessThanOrEqual(0.5);
      expect(Math.abs(posY)).toBeLessThanOrEqual(0.08);
      expect(scale).toBeGreaterThanOrEqual(0.96);
      expect(scale).toBeLessThanOrEqual(1.08);
      expect(emphasis).toBeGreaterThanOrEqual(0);
      expect(emphasis).toBeLessThanOrEqual(1);
    }
  });

  it("drifts the flacon from just off the type toward centre", () => {
    expect(poseFor(0).posX).toBeGreaterThan(poseFor(0.5).posX);
    expect(poseFor(SCENES.rotate[1]).posX).toBeCloseTo(0);
    expect(poseFor(1).posX).toBeCloseTo(0);
  });

  it("keeps the camera FOV within a restrained, non-distorting range", () => {
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const fov = poseFor(p).fov;
      // Widened for the luminous/aggressive rework's 40°→32° peak swing —
      // still a hard band well short of anything that would distort the
      // object (a true fisheye look starts well under 20°).
      expect(fov).toBeGreaterThanOrEqual(30);
      expect(fov).toBeLessThanOrEqual(42);
    }
  });

  it("narrows the FOV through the detail beats, then eases back out", () => {
    const hero = poseFor(0).fov;
    const detail = poseFor((SCENES.cap[0] + SCENES.cap[1]) / 2).fov;
    const brand = poseFor(1).fov;
    expect(detail).toBeLessThan(hero);
    expect(brand).toBeGreaterThan(detail);
  });

  it("holds the camera centred (camX = 0) through every object beat", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(poseFor(p).camX).toBe(0);
    }
  });
});

describe("houseDriftFor", () => {
  it("is a no-op at the seam so blending in never jumps", () => {
    const d = houseDriftFor(0);
    expect(d.spin).toBe(0);
    expect(d.posX).toBe(0);
    expect(d.posY).toBe(0);
  });

  it("shifts aside then returns to centre by the close", () => {
    expect(houseDriftFor(0.5).posX).toBeGreaterThan(0);
    expect(houseDriftFor(1).posX).toBeCloseTo(0);
  });

  it("keeps the continued turn and breath restrained", () => {
    for (let h = 0; h <= 1.0001; h += 0.05) {
      const d = houseDriftFor(h);
      expect(d.spin).toBeGreaterThanOrEqual(0);
      expect(d.spin).toBeLessThan(Math.PI * 2 * 0.1);
      expect(Math.abs(d.posY)).toBeLessThanOrEqual(0.05);
    }
  });

  it("camX is a no-op at both ends (seam-continuous) and stays restrained", () => {
    expect(houseDriftFor(0).camX).toBe(0);
    expect(houseDriftFor(1).camX).toBe(0);
    for (let h = 0; h <= 1.0001; h += 0.05) {
      expect(Math.abs(houseDriftFor(h).camX)).toBeLessThanOrEqual(0.2);
    }
  });
});

describe("poseForTrack", () => {
  it("matches poseFor's Scene 1 choreography before the split", () => {
    for (let p = 0; p <= SCENE_SPLIT; p += 0.05) {
      const track = poseForTrack(p);
      const scene1 = poseFor(p / SCENE_SPLIT);
      expect(track.spin).toBeCloseTo(scene1.spin);
      expect(track.capLift).toBeCloseTo(scene1.capLift);
      expect(track.dolly).toBeCloseTo(scene1.dolly);
    }
  });

  it("is continuous across the Scene 1 / house seam — no jump", () => {
    const before = poseForTrack(SCENE_SPLIT - 0.001);
    const at = poseForTrack(SCENE_SPLIT);
    const after = poseForTrack(SCENE_SPLIT + 0.001);
    // fov's own ramp is intentionally steep near the seam (8° compressed into
    // the tail of Scene 1, for the aggressive detail-beat push), so a 1‰
    // sampling step there shows more local slope than the other channels —
    // real, continuous slope, not a jump (the seam itself, `at` vs `after`,
    // is 0.0000 below). Give it a wider, still-strict tolerance; keep the
    // other channels tight.
    for (const key of [
      "spin",
      "posX",
      "posY",
      "scale",
      "dolly",
      "emphasis",
      "camX",
    ] as const) {
      expect(Math.abs(after[key] - at[key])).toBeLessThan(0.02);
      expect(Math.abs(at[key] - before[key])).toBeLessThan(0.02);
    }
    expect(Math.abs(after.fov - at.fov)).toBeLessThan(0.1);
    expect(Math.abs(at.fov - before.fov)).toBeLessThan(0.1);
  });

  it("camera pans only in the house window, never during Scene 1", () => {
    for (let p = 0; p <= SCENE_SPLIT; p += 0.05) {
      expect(poseForTrack(p).camX).toBe(0);
    }
    expect(poseForTrack((SCENE_SPLIT + 1) / 2).camX).not.toBe(0);
  });

  it("keeps drifting gently through the house window rather than freezing", () => {
    const mid = poseForTrack((SCENE_SPLIT + 1) / 2);
    const end = poseForTrack(1);
    expect(mid.spin).not.toBeCloseTo(end.spin, 3);
  });

  it("passes showcase straight through, unaffected by the split", () => {
    for (let p = 0; p <= 1.0001; p += 0.1) {
      expect(poseForTrack(p, "showcase")).toEqual(poseFor(p, "showcase"));
    }
  });
});

describe("poseFor — showcase", () => {
  it("never sprays", () => {
    for (let p = 0; p <= 1.0001; p += 0.1) {
      expect(poseFor(p, "showcase").spray).toBe(0);
    }
  });

  it("turns a bounded amount and only teases the cap", () => {
    expect(poseFor(0, "showcase").spin).toBeCloseTo(-0.5);
    expect(poseFor(1, "showcase").spin).toBeLessThan(Math.PI * 2);
    expect(poseFor(0, "showcase").capLift).toBe(0);
    expect(poseFor(1, "showcase").capLift).toBeLessThan(0.3);
  });
});
