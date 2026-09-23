// ============================================================
// STORAGE KEY OWNERSHIP — who may read a /files/{key} object.
//
// Every upload and export is written under a key whose second path segment
// names its owner (security review P11-A, C-3):
//   workspace-owned   docs/<ws>/…  tax-returns/<ws>/…  illustrations/<ws>/…
//                     knowledge/<ws>/…  reports/<ws>/…  agendas/<ws>/…
//                     strategy-exports/<ws>/…
//   user-owned        slides/<user>/…  mortgage-statements/<user>/…
//                     avatars/<user>/…  bulk-reports/<user>/… (legacy:
//                     bulk-reports/<user>-<date>…)  generated/avatars/<user>/…
//                     generated/owner/<user>/…
// A signed-in caller may read a key only when that owner is their own
// workspace or themselves. The admin (host) may read any key. A key with no
// recognised owner (an unknown prefix, or an export written before keys
// carried an owner) is refused to everyone but the admin.
// ============================================================

export type StorageKeyOwner =
  | { kind: "workspace"; id: number }
  | { kind: "user"; id: number };

const WORKSPACE_PREFIXES = ["docs", "tax-returns", "illustrations", "knowledge", "reports", "agendas", "strategy-exports"] as const;
const USER_PREFIXES = ["slides", "mortgage-statements", "avatars", "bulk-reports"] as const;
const GENERATED_USER_PREFIXES = ["avatars", "owner"] as const;

const ID = /^[1-9]\d{0,9}$/;

function toId(segment: string | undefined): number | null {
  if (!segment || !ID.test(segment)) return null;
  const n = Number(segment);
  return Number.isSafeInteger(n) ? n : null;
}

/** The owner a storage key names, or null when the key names none that we recognise. */
export function storageKeyOwner(key: string): StorageKeyOwner | null {
  if (!key || key.length > 512 || key.startsWith("/") || key.includes("..") || key.includes("\\") || key.includes("\0")) return null;
  const parts = key.split("/");
  if (parts.length < 3 || parts.some(p => p === "")) return null;
  const [top, second, third] = parts;

  if ((WORKSPACE_PREFIXES as readonly string[]).includes(top!)) {
    const id = toId(second);
    return id === null ? null : { kind: "workspace", id };
  }
  if ((USER_PREFIXES as readonly string[]).includes(top!)) {
    const id = toId(second);
    return id === null ? null : { kind: "user", id };
  }
  if (top === "generated" && (GENERATED_USER_PREFIXES as readonly string[]).includes(second!)) {
    if (parts.length < 4) return null;
    const id = toId(third);
    return id === null ? null : { kind: "user", id };
  }
  return null;
}

/** Legacy bulk-report keys: bulk-reports/<userId>-<date>-<ms>.pdf (one segment after the prefix). */
function legacyBulkReportOwner(key: string): StorageKeyOwner | null {
  const m = /^bulk-reports\/([1-9]\d{0,9})-[^/]+$/.exec(key);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isSafeInteger(id) ? { kind: "user", id } : null;
}

export type StorageCaller = {
  userId: number;
  role?: string | null;
  /** The caller's own workspace id, from the session; null when they have none. */
  workspaceId: number | null;
};

/** May this signed-in caller read `key`? Admin: yes. Others: only keys their workspace or they own. */
export function callerMayReadStorageKey(key: string, caller: StorageCaller): boolean {
  if (caller.role === "admin") return true;
  const owner = storageKeyOwner(key) ?? legacyBulkReportOwner(key);
  if (!owner) return false;
  if (owner.kind === "user") return owner.id === caller.userId;
  return caller.workspaceId !== null && owner.id === caller.workspaceId;
}
