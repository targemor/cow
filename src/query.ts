const WORD = /[A-Za-z0-9]+/g;

export function toFtsQuery(input: string): string {
  const tokens = input.match(WORD);
  if (!tokens || tokens.length === 0) {
    throw new Error("Query has no searchable words.");
  }
  return tokens.map((token) => `"${token}"`).join(" AND ");
}
