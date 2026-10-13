import { describe, expect, it } from "vitest";
import { createSchema, insertPassages, openDatabase, searchPassages } from "./db.js";

describe("searchPassages", () => {
  it("returns a stored passage and does not search questions", () => {
    const db = openDatabase(":memory:");
    createSchema(db);
    insertPassages(db, [
      {
        id: 28,
        passage: `${"Lincoln signed the Emancipation Proclamation. ".repeat(3)}`,
      },
      {
        id: 4,
        passage: `${"Uruguay exports beef and relies on world trade. ".repeat(3)}`,
      },
    ]);
    db.prepare("INSERT INTO questions (id, question, answer) VALUES (1, ?, ?)").run(
      "Who assassinated Lincoln?",
      "John Wilkes Booth",
    );

    const hits = searchPassages(db, '"Lincoln"', 5);
    expect(hits.map((hit) => hit.id)).toEqual([28]);
    expect(hits[0]?.passage).toContain("Lincoln");
    db.close();
  });
});
