import { describe, expect, it } from "vitest";
import { formatPrice, splitLines, toParagraphs } from "./utils";

describe("formatPrice", () => {
  it("formats whole amounts in the given currency, no minor units", () => {
    expect(formatPrice(245, "USD")).toBe("$245");
    expect(formatPrice(245, "EUR")).toBe("€245");
  });
});

describe("toParagraphs", () => {
  it("splits on blank lines and trims", () => {
    expect(toParagraphs("one\n\n  two  \n\n\nthree")).toEqual([
      "one",
      "two",
      "three",
    ]);
  });
});

describe("splitLines", () => {
  it("splits a headline into trimmed non-empty lines", () => {
    expect(splitLines("The scent of\na room at dusk", "x")).toEqual([
      "The scent of",
      "a room at dusk",
    ]);
  });

  it("falls back when the value is empty, missing, or blank", () => {
    expect(splitLines("", "A\nB")).toEqual(["A", "B"]);
    expect(splitLines(undefined, "A\nB")).toEqual(["A", "B"]);
    expect(splitLines("   \n  ", "A\nB")).toEqual(["A", "B"]);
  });

  it("keeps a single-line headline as one entry", () => {
    expect(splitLines("Just one line", "fallback")).toEqual(["Just one line"]);
  });
});
