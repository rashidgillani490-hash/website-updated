import { describe, expect, it } from "vitest";
import { clamp01, interp, poseFor, SCENES, trapezoid } from "./story";

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
