import { MIN_PASSAGE_CHARS } from "./dataset.js";

const MOJIBAKE_MARK = /[ÃÂ]/;

export function repairMojibake(text: string): string {
  if (!MOJIBAKE_MARK.test(text)) return text;
  const repaired = Buffer.from(text, "latin1").toString("utf8");
  if (repaired.includes("\uFFFD")) return text;
  return repaired;
}

export function keepPassage(text: string): boolean {
  return text.trim().length >= MIN_PASSAGE_CHARS;
}
