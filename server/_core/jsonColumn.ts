// MySQL 8 returns JSON columns already parsed; MariaDB (where JSON is an alias
// for LONGTEXT) returns the raw string, and drizzle's mysql `json()` column
// does not parse on read. Normalise both so the app behaves the same on either.
export function jsonColumn<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}
