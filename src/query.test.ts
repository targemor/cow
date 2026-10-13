import { describe, expect, it } from "vitest";
import { toFtsQuery } from "./query.js";

describe("toFtsQuery", () => {
  it("quotes each word so punctuation cannot change the query", () => {
    expect(toFtsQuery("Who assassinated Lincoln?")).toBe(
      '"Who" AND "assassinated" AND "Lincoln"',
    );
  });

  it("rejects a query with no words", () => {
    expect(() => toFtsQuery("???")).toThrow(/no searchable words/);
  });
});
