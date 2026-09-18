/**
 * Whether a database is reachable for tests.
 *
 * A large part of this suite drives tRPC procedures that read and write MySQL.
 * Without DATABASE_URL those tests fail with "DB unavailable" — not because
 * anything is broken, but because there is no database on the machine running
 * them. Fifty-eight permanently-red tests is worse than none: a suite that is
 * always red is a suite nobody reads, and the whole point of the guards in
 * this repo is that somebody reads the red.
 *
 * So those tests declare `it.skipIf(!hasDatabase)` and report as skipped
 * locally. On Railway, in CI, or against a local MySQL they run exactly as
 * before and will still catch a real regression. This hides nothing: it moves
 * an environmental failure out of the way of a real one.
 *
 * The same pattern is already used for credentials — see
 * server/mistral.secret.test.ts.
 */
export const hasDatabase = Boolean((process.env.DATABASE_URL ?? "").trim());
