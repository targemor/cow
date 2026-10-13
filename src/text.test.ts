import { describe, expect, it } from "vitest";
import { keepPassage, repairMojibake } from "./text.js";

describe("repairMojibake", () => {
  it("repairs latin-1 misread as utf-8", () => {
    const broken = Buffer.from("Río de la Plata", "utf8").toString("latin1");
    expect(repairMojibake(broken)).toBe("Río de la Plata");
  });

  it("leaves clean text alone", () => {
    expect(repairMojibake("Abraham Lincoln")).toBe("Abraham Lincoln");
  });

  it("leaves a row alone when the repair would be invalid utf-8", () => {
    const broken = "RÃ\u00EDo";
    expect(repairMojibake(broken)).toBe(broken);
  });
});

describe("keepPassage", () => {
  it("drops stubs shorter than 80 characters", () => {
    expect(keepPassage("Map of Uruguay")).toBe(false);
    expect(keepPassage(`  ${"a".repeat(79)}  `)).toBe(false);
  });

  it("keeps a passage of 80 characters", () => {
    expect(keepPassage("a".repeat(80))).toBe(true);
  });
});
