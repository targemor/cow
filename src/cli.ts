import { mkdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { openDatabase, searchPassages } from "./db.js";
import { ingest } from "./ingest.js";
import { toFtsQuery } from "./query.js";

const dbPath = path.join(process.cwd(), "data", "rag.db");

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    limit: { type: "string", default: "5" },
  },
});

const command = positionals[0];

if (command === "ingest") {
  await mkdir(path.dirname(dbPath), { recursive: true });
  const result = await ingest(dbPath);
  console.log(`revision ${result.revision}`);
  console.log(`passages kept ${result.passagesKept} dropped ${result.passagesDropped}`);
  console.log(`questions ${result.questions}`);
  console.log(`shortest passage ${result.shortest ?? "none"}`);
  console.log(`wrote ${dbPath}`);
} else if (command === "search") {
  const phrase = positionals.slice(1).join(" ");
  const limit = Number(values.limit);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("--limit must be a positive integer");
  }
  const db = openDatabase(dbPath);
  try {
    const hits = searchPassages(db, toFtsQuery(phrase), limit);
    if (hits.length === 0) {
      console.log("No passages matched.");
    }
    for (const hit of hits) {
      console.log(`${hit.id}\t${hit.score.toFixed(4)}`);
      console.log(hit.passage);
      console.log("");
    }
  } finally {
    db.close();
  }
} else {
  console.error("Usage: npm run ingest");
  console.error("       npm run search -- Lincoln");
  process.exitCode = 1;
}
