import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { downloadFile } from "@huggingface/hub";
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet";
import {
  DATASET_REPO,
  DATASET_REVISION,
  PASSAGES_FILE,
  QUESTIONS_FILE,
} from "./dataset.js";
import {
  createSchema,
  insertPassages,
  insertQuestions,
  openDatabase,
  recordRevision,
  shortestPassageLength,
  type PassageRow,
  type QuestionRow,
} from "./db.js";
import { keepPassage, repairMojibake } from "./text.js";

export type IngestResult = {
  revision: string;
  passagesKept: number;
  passagesDropped: number;
  questions: number;
  shortest: number | null;
};

export async function ingest(dbPath: string): Promise<IngestResult> {
  const cacheDir = path.join(path.dirname(dbPath), "hf");
  await mkdir(cacheDir, { recursive: true });
  const passagesPath = await downloadParquet(PASSAGES_FILE, path.join(cacheDir, "passages.parquet"));
  const questionsPath = await downloadParquet(QUESTIONS_FILE, path.join(cacheDir, "questions.parquet"));

  const passages = await readRows(passagesPath);
  const questions = await readRows(questionsPath);
  const kept: PassageRow[] = [];
  let dropped = 0;
  for (const row of passages) {
    const passage = repairMojibake(cellString(row, "passage")).trim();
    if (!keepPassage(passage)) {
      dropped += 1;
      continue;
    }
    kept.push({ id: cellId(row), passage });
  }

  const exam: QuestionRow[] = questions.map((row) => ({
    id: cellId(row),
    question: repairMojibake(cellString(row, "question")).trim(),
    answer: repairMojibake(cellString(row, "answer")).trim(),
  }));

  await rm(dbPath, { force: true });
  await rm(`${dbPath}-wal`, { force: true });
  await rm(`${dbPath}-shm`, { force: true });
  const db = openDatabase(dbPath);
  try {
    createSchema(db);
    insertPassages(db, kept);
    insertQuestions(db, exam);
    recordRevision(db, DATASET_REVISION);
    return {
      revision: DATASET_REVISION,
      passagesKept: kept.length,
      passagesDropped: dropped,
      questions: exam.length,
      shortest: shortestPassageLength(db),
    };
  } finally {
    db.close();
  }
}

async function downloadParquet(repoPath: string, dest: string): Promise<string> {
  const blob = await downloadFile({
    repo: DATASET_REPO,
    path: repoPath,
    revision: DATASET_REVISION,
  });
  if (!blob) {
    throw new Error(`Dataset file not found at ${DATASET_REVISION}: ${repoPath}`);
  }
  await writeFile(dest, Buffer.from(await blob.arrayBuffer()));
  return dest;
}

async function readRows(filePath: string): Promise<Record<string, unknown>[]> {
  const file = await asyncBufferFromFile(filePath);
  const rows = await parquetReadObjects({ file });
  return rows.map((row) => {
    const record: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) record[key] = value;
    return record;
  });
}

function cellString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string") {
    throw new Error(`Expected string column ${key}`);
  }
  return value;
}

function cellId(row: Record<string, unknown>): number {
  const value = row.id;
  const id = typeof value === "bigint" ? Number(value) : value;
  if (typeof id !== "number" || !Number.isInteger(id)) {
    throw new Error(`Expected integer id, got ${String(value)}`);
  }
  return id;
}
