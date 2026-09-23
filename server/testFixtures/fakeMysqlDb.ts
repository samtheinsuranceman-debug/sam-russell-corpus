/**
 * A small in-memory stand-in for the drizzle MySQL database, for tests that
 * need to see which rows a query really touches. Tables are plain arrays of
 * rows keyed by column name. WHERE and JOIN conditions are rendered by
 * drizzle's own MySQL dialect and evaluated here; only `and` of `=`
 * comparisons (column = value, column = column) and `column in (…)` is understood, and anything
 * else throws, so a test can never pass on a condition it did not evaluate.
 *
 * Use: vi.mock("drizzle-orm/mysql2", () => ({ drizzle: () => fake.db })) and
 * set DATABASE_URL, so every helper in server/db.ts runs against it.
 */
import { getTableName, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";

type Row = Record<string, unknown>;
type Combo = Record<string, Row>;
type Atom = { table: string; column: string; value?: unknown; values?: unknown[]; otherTable?: string; otherColumn?: string };

const dialect = new MySqlDialect();

function atoms(cond: SQL | undefined): Atom[] {
  if (!cond) return [];
  const { sql, params } = dialect.sqlToQuery(cond);
  if (/\bor\b|\bnot\b|\blike\b|<|>/i.test(sql.replace(/`[^`]*`/g, ""))) {
    throw new Error(`fakeMysqlDb: unsupported condition ${sql}`);
  }
  const out: Atom[] = [];
  let p = 0;
  const re = /`(\w+)`\.`(\w+)` (?:= (?:\?|`(\w+)`\.`(\w+)`)|in \(((?:\?, )*\?)\))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    if (m[5]) {
      const n = m[5].split(",").length;
      out.push({ table: m[1]!, column: m[2]!, values: params.slice(p, p + n) });
      p += n;
    } else if (m[3]) out.push({ table: m[1]!, column: m[2]!, otherTable: m[3], otherColumn: m[4] });
    else out.push({ table: m[1]!, column: m[2]!, value: params[p++] });
  }
  const leftover = sql.replace(re, "").replace(/[()\s]|and/g, "");
  if (leftover.length || p !== params.length) throw new Error(`fakeMysqlDb: could not evaluate ${sql}`);
  return out;
}

function holds(combo: Combo, list: Atom[], strict = true): boolean {
  return list.every(a => {
    const row = combo[a.table];
    if (!row) {
      // A join condition may name a table joined later; a WHERE may not name a missing one.
      if (strict) throw new Error(`fakeMysqlDb: condition on \`${a.table}\`, which is not in the query`);
      return true;
    }
    const left = row[a.column];
    if (a.otherTable) {
      const other = combo[a.otherTable];
      if (!other && strict) throw new Error(`fakeMysqlDb: condition on \`${a.otherTable}\`, which is not in the query`);
      return other ? left === other[a.otherColumn!] : true;
    }
    const norm = (v: unknown) => (v instanceof Date ? v.getTime() : v);
    if (a.values) return a.values.map(norm).includes(norm(left));
    return norm(left) === norm(a.value);
  });
}

export type FakeOp = { kind: "insert" | "update" | "delete"; table: string; values?: Row; where?: Atom[] };

export function createFakeMysqlDb(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = {};
  const nextId: Record<string, number> = {};
  const ops: FakeOp[] = [];
  const reset = (data: Record<string, Row[]>) => {
    for (const k of Object.keys(tables)) delete tables[k];
    for (const [k, rows] of Object.entries(data)) tables[k] = rows.map(r => ({ ...r }));
    for (const k of Object.keys(nextId)) delete nextId[k];
    ops.length = 0;
  };
  reset(seed);
  const rowsOf = (t: string) => (tables[t] ??= []);

  function select(fields?: Record<string, { name: string; table: unknown }>) {
    let from = "";
    const joins: Array<{ table: string; on: Atom[] }> = [];
    let where: Atom[] = [];
    let limit = Infinity;
    const run = () => {
      let combos: Combo[] = rowsOf(from).map(r => ({ [from]: r }));
      for (const j of joins) {
        const next: Combo[] = [];
        for (const c of combos) for (const r of rowsOf(j.table)) {
          const cand = { ...c, [j.table]: r };
          if (holds(cand, j.on, false)) next.push(cand);
        }
        combos = next;
      }
      combos = combos.filter(c => holds(c, where)).slice(0, limit);
      return combos.map(c => {
        if (fields) {
          const out: Row = {};
          for (const [k, col] of Object.entries(fields)) out[k] = c[getTableName(col.table as never)]?.[col.name];
          return out;
        }
        return joins.length ? c : { ...c[from] };
      });
    };
    const q: any = {
      from(t: unknown) { from = getTableName(t as never); return q; },
      innerJoin(t: unknown, on: SQL) { joins.push({ table: getTableName(t as never), on: atoms(on) }); return q; },
      where(c: SQL | undefined) { where = atoms(c); return q; },
      orderBy() { return q; },
      groupBy() { return q; },
      limit(n: number) { limit = n; return q; },
      offset() { return q; },
      then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) { try { return Promise.resolve(run()).then(res, rej); } catch (e) { return Promise.reject(e).then(res, rej); } },
    };
    return q;
  }

  function insert(t: unknown) {
    const table = getTableName(t as never);
    let inserted: Row[] = [];
    const q: any = {
      values(v: Row | Row[]) {
        inserted = (Array.isArray(v) ? v : [v]).map(r => {
          const id = (r.id as number | undefined) ?? (nextId[table] = (nextId[table] ?? Math.max(1000, ...rowsOf(table).map(x => Number(x.id) || 0)) ) + 1);
          const row = { ...r, id };
          rowsOf(table).push(row);
          ops.push({ kind: "insert", table, values: row });
          return row;
        });
        return q;
      },
      $returningId() { return Promise.resolve(inserted.map(r => ({ id: r.id }))); },
      onDuplicateKeyUpdate() { return q; },
      then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) { return Promise.resolve([{ insertId: inserted[0]?.id, affectedRows: inserted.length }]).then(res, rej); },
    };
    return q;
  }

  function update(t: unknown) {
    const table = getTableName(t as never);
    let values: Row = {};
    const q: any = {
      set(v: Row) { values = v; return q; },
      where(c: SQL) {
        const list = atoms(c);
        ops.push({ kind: "update", table, values, where: list });
        let n = 0;
        for (const r of rowsOf(table)) if (holds({ [table]: r }, list)) { Object.assign(r, values); n++; }
        return Promise.resolve([{ affectedRows: n }]);
      },
    };
    return q;
  }

  function del(t: unknown) {
    const table = getTableName(t as never);
    return {
      where(c: SQL) {
        const list = atoms(c);
        ops.push({ kind: "delete", table, where: list });
        const keep = rowsOf(table).filter(r => !holds({ [table]: r }, list));
        const n = rowsOf(table).length - keep.length;
        tables[table] = keep;
        return Promise.resolve([{ affectedRows: n }]);
      },
    };
  }

  const db = { select, insert, update, delete: del };
  return { db, tables, ops, reset };
}
