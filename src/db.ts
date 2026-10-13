import Database from "better-sqlite3";

export type PassageHit = {
  id: number;
  passage: string;
  score: number;
};

export type PassageRow = {
  id: number;
  passage: string;
};

export type QuestionRow = {
  id: number;
  question: string;
  answer: string;
};

const SCHEMA = `
CREATE TABLE passages (
  id INTEGER PRIMARY KEY,
  passage TEXT NOT NULL
);

CREATE VIRTUAL TABLE passages_fts USING fts5(
  passage,
  content='passages',
  content_rowid='id',
  tokenize='porter unicode61'
);

CREATE TRIGGER passages_ai AFTER INSERT ON passages BEGIN
  INSERT INTO passages_fts(rowid, passage) VALUES (new.id, new.passage);
END;

CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

CREATE TABLE dataset (
  revision TEXT PRIMARY KEY
);
`;

export function openDatabase(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  return db;
}

export function createSchema(db: Database.Database): void {
  db.exec(SCHEMA);
}

export function insertPassages(db: Database.Database, rows: PassageRow[]): void {
  const insert = db.prepare("INSERT INTO passages (id, passage) VALUES (?, ?)");
  const write = db.transaction((batch: PassageRow[]) => {
    for (const row of batch) insert.run(row.id, row.passage);
  });
  write(rows);
}

export function insertQuestions(db: Database.Database, rows: QuestionRow[]): void {
  const insert = db.prepare(
    "INSERT INTO questions (id, question, answer) VALUES (?, ?, ?)",
  );
  const write = db.transaction((batch: QuestionRow[]) => {
    for (const row of batch) insert.run(row.id, row.question, row.answer);
  });
  write(rows);
}

export function recordRevision(db: Database.Database, revision: string): void {
  db.prepare("INSERT INTO dataset (revision) VALUES (?)").run(revision);
}

export function searchPassages(
  db: Database.Database,
  ftsQuery: string,
  limit: number,
): PassageHit[] {
  return db
    .prepare(
      `SELECT passages.id AS id, passages.passage AS passage, bm25(passages_fts) AS score
       FROM passages_fts
       JOIN passages ON passages.id = passages_fts.rowid
       WHERE passages_fts MATCH ?
       ORDER BY score
       LIMIT ?`,
    )
    .all(ftsQuery, limit) as PassageHit[];
}

export function shortestPassageLength(db: Database.Database): number | null {
  const row = db
    .prepare(
      "SELECT MIN(length(trim(passage))) AS length FROM passages",
    )
    .get() as { length: number | null };
  return row.length;
}
