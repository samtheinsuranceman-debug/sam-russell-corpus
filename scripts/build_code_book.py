#!/usr/bin/env python3
"""Generate the Russell Capital Systems plain-Markdown source code book."""
import os
import re
import sys
import json

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # russell-capital-systems/
OUT = os.path.join(os.path.dirname(APP), "rcs-code-book")            # <repo root>/rcs-code-book
MAX_PART = 1_900_000
HEADER_RESERVE = 60_000  # room for the per-part heading + file list

TEXT_EXT = {".ts", ".tsx", ".css", ".sql", ".md", ".html", ".mjs", ".cjs", ".js", ".py", ".sh"}
JSON_MAX = 40 * 1024
EXCLUDE_SEGMENTS = {"node_modules", "dist", ".git", "audit"}
LANG = {
    ".ts": "ts", ".tsx": "tsx", ".css": "css", ".sql": "sql", ".md": "md",
    ".html": "html", ".mjs": "js", ".cjs": "js", ".js": "js", ".json": "json",
    ".py": "python", ".sh": "bash",
}


def wanted(rel: str, size: int) -> bool:
    parts = rel.split("/")
    if any(seg in EXCLUDE_SEGMENTS for seg in parts):
        return False
    if rel.startswith("drizzle/meta/"):
        return False
    base = parts[-1]
    if base in ("pnpm-lock.yaml", "PARTS_MANIFEST.json"):
        return False
    if base.endswith(".test.ts") or base.endswith(".test.tsx"):
        return False
    if base == ".gitignore":
        return True
    ext = os.path.splitext(base)[1].lower()
    if ext == ".json":
        if rel.startswith("docs/"):
            return False
        return size <= JSON_MAX
    return ext in TEXT_EXT


def is_binary(data: bytes) -> bool:
    if b"\x00" in data[:8192]:
        return True
    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        return True
    return False


ROOT_CONFIG_ORDER = ["package.json", "tsconfig", "vite.config.ts", "drizzle.config.ts",
                     "components.json", ".gitignore"]
CLIENT_ENTRY_ORDER = ["client/index.html", "client/src/main.tsx", "client/src/App.tsx",
                      "client/src/index.css", "client/src/lib/", "client/src/_core/"]


def sort_key(rel: str):
    base = os.path.basename(rel)
    is_root = "/" not in rel
    if rel == "LAUNCH.md":
        return (0, 0, rel)
    if is_root and not base.endswith(".md"):
        for i, pfx in enumerate(ROOT_CONFIG_ORDER):
            if base == pfx or (pfx == "tsconfig" and base.startswith("tsconfig")):
                return (1, i, rel)
        return (1, len(ROOT_CONFIG_ORDER), rel)  # other root config (vitest, template.json)
    if is_root and base.endswith(".md"):
        return (2, 0, rel)
    if rel.startswith("scripts/"):
        return (3, 0, rel)
    if rel.startswith("drizzle/"):
        return (4, 0, rel)
    if rel.startswith("shared/"):
        return (5, 0, rel)
    if rel.startswith("server/_core/"):
        return (6, 0, rel)
    if rel.startswith("server/"):
        return (7, 0, rel)
    for i, pfx in enumerate(CLIENT_ENTRY_ORDER):
        if rel == pfx or (pfx.endswith("/") and rel.startswith(pfx)):
            return (8, i, rel)
    if rel.startswith("client/src/components/"):
        return (9, 0, rel)
    if rel.startswith("client/src/pages/"):
        return (10, 0, rel)
    if rel.startswith("client/"):
        return (11, 0, rel)
    return (12, 0, rel)


def render(rel: str, text: str) -> str:
    runs = re.findall(r"`+", text)
    longest = max((len(r) for r in runs), default=0)
    fence = "`" * max(3, longest + 1)
    ext = os.path.splitext(rel)[1].lower()
    lang = "" if os.path.basename(rel) == ".gitignore" else LANG.get(ext, "")
    body = text if text.endswith("\n") else text + "\n"
    return f"## `{rel}`\n\n{fence}{lang}\n{body}{fence}\n\n"


def main():
    files = []
    for dirpath, dirnames, filenames in os.walk(APP):
        rel_dir = os.path.relpath(dirpath, APP)
        rel_dir = "" if rel_dir == "." else rel_dir
        # prune excluded directories early
        dirnames[:] = sorted(d for d in dirnames if d not in EXCLUDE_SEGMENTS)
        for fn in filenames:
            rel = f"{rel_dir}/{fn}" if rel_dir else fn
            full = os.path.join(dirpath, fn)
            if not os.path.isfile(full) or os.path.islink(full):
                continue
            size = os.path.getsize(full)
            if not wanted(rel, size):
                continue
            with open(full, "rb") as fh:
                data = fh.read()
            if is_binary(data):
                print(f"skip binary: {rel}", file=sys.stderr)
                continue
            files.append((rel, data.decode("utf-8")))

    files.sort(key=lambda t: sort_key(t[0]))
    blocks = [(rel, render(rel, text)) for rel, text in files]

    # drop any single file too large to fit in one part (a file is never split)
    oversized = [(rel, len(blk.encode("utf-8"))) for rel, blk in blocks
                 if len(blk.encode("utf-8")) + HEADER_RESERVE > MAX_PART]
    for rel, b in oversized:
        print(f"excluded (exceeds part cap): {rel} ({b} bytes)", file=sys.stderr)
    oversized_set = {rel for rel, _ in oversized}
    blocks = [(rel, blk) for rel, blk in blocks if rel not in oversized_set]
    files = [(rel, t) for rel, t in files if rel not in oversized_set]

    # greedy grouping, never splitting a file
    groups, cur, cur_size = [], [], 0
    for rel, blk in blocks:
        b = len(blk.encode("utf-8"))
        if cur and cur_size + b + HEADER_RESERVE > MAX_PART:
            groups.append(cur)
            cur, cur_size = [], 0
        cur.append((rel, blk))
        cur_size += b
    if cur:
        groups.append(cur)

    M = len(groups)
    os.makedirs(OUT, exist_ok=True)
    for old in os.listdir(OUT):
        os.remove(os.path.join(OUT, old))

    part_names, file_map, sizes = [], {}, []
    for i, grp in enumerate(groups, 1):
        name = f"RCS_CODE_BOOK_part{i:02d}_of_{M:02d}.md"
        part_names.append(name)
        header = (
            f"# Russell Capital Systems — Source Code Book (Part {i} of {M})\n\n"
            f"This is one part of the complete, plain-Markdown source of the Russell Capital Systems "
            f"web app (React 19 + Vite client, Express + tRPC server, Drizzle ORM / MySQL), split so an "
            f"assistant that cannot open archives can read every file. `LAUNCH.md` (in Part 1) is the "
            f"runbook for installing, configuring, building, migrating, and running the app; read it first. "
            f"Each file below is shown verbatim under its path relative to `russell-capital-systems/`. "
            f"The source of truth is GitHub `samtheinsuranceman-debug/sam-russell-corpus` "
            f"(branch `claude/claude-md-docs-0qgcvw`, folder `russell-capital-systems/`); the book is a "
            f"derived snapshot generated on 2026-09-05. See `RCS_CODE_BOOK_00_INDEX.md` for the full "
            f"file-to-part map and the list of intentionally excluded paths.\n\n"
            f"### Files in this part\n\n"
            + "".join(f"- `{rel}`\n" for rel, _ in grp)
            + "\n---\n\n"
        )
        content = header + "".join(blk for _, blk in grp)
        path = os.path.join(OUT, name)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        size = os.path.getsize(path)
        sizes.append(size)
        assert size <= MAX_PART, f"{name} is {size} bytes (> {MAX_PART})"
        for rel, _ in grp:
            file_map[rel] = name

    total_files = len(files)
    index = [
        "# Russell Capital Systems — Source Code Book (INDEX)\n\n",
        "**What this is:** the complete, human/AI-readable source of the Russell Capital Systems web app "
        "(React 19 + Vite client, Express + tRPC server, Drizzle ORM / MySQL), delivered as plain Markdown "
        f"in {M} parts so any assistant can read it without unzipping anything. Every included file is "
        "rendered verbatim under a `## \\`relative/path\\`` heading inside a fenced code block.\n\n",
        "**Source of truth:** GitHub `samtheinsuranceman-debug/sam-russell-corpus`, branch "
        "`claude/claude-md-docs-0qgcvw`, folder `russell-capital-systems/`. This book is a derived snapshot "
        "generated on 2026-09-05 (after the homepage rebuild); when it and the repo disagree, the repo wins.\n\n",
        "## How to launch\n\n",
        "Read **`LAUNCH.md`** (the first file in Part 1). It is the complete runbook: prerequisites, install, "
        "environment variables (keys live ONLY in the host environment — never in code), database migration, "
        "build, run, keep-alive, domain + TLS, verification, and troubleshooting. The production deploy bundle "
        "(`rcs-deploy-2026-09-05.zip` at the repo root) contains the prebuilt `dist/` plus a `DEPLOY.md` for "
        "the cPanel Node.js path.\n\n",
        "## What is intentionally NOT included (all still in the repo)\n\n",
        "- `node_modules/` and `dist/` (rebuild with `pnpm install` + `pnpm build`)\n",
        "- `pnpm-lock.yaml` (needed for `pnpm install --frozen-lockfile`; in the repo and in the deploy zip)\n",
        "- large data JSON: any `.json` over 40 KB (e.g. `PARTS_MANIFEST.json`, `client/src/data/*.json`) "
        "and every `.json` under `docs/`\n",
        "- `drizzle/meta/` snapshot files\n",
        "- `audit/` test reports and `*.test.ts` / `*.test.tsx` test files\n",
        "- binary assets (`.webp`, `.png`, `.zip`, etc.) — they are in the repo, e.g. under `client/public/`\n",
        "- anything without a source-code extension (`.yaml`, `.patch`, `.log`, `.prettierrc`, ...)\n",
    ] + [
        f"- `{rel}` ({b:,} bytes) — a rendered build output (the template with images embedded as data "
        f"URIs) larger than a single part; its source, `live/rcs-live-homepage.template.html`, is included\n"
        for rel, b in oversized
    ] + [
        "\n",
        f"## Parts ({M})\n\n",
    ]
    for name, size, grp in zip(part_names, sizes, groups):
        index.append(f"- `{name}` — {len(grp)} files, {size:,} bytes\n")
    index.append(f"\n**Total: {total_files} files across {M} parts.**\n\n")
    index.append("## File → part map\n\n")
    for rel, _ in blocks:
        index.append(f"- `{rel}` → `{file_map[rel]}`\n")
    with open(os.path.join(OUT, "RCS_CODE_BOOK_00_INDEX.md"), "w", encoding="utf-8") as fh:
        fh.write("".join(index))

    print(json.dumps({"files": total_files, "parts": M,
                      "sizes": dict(zip(part_names, sizes))}, indent=2))


if __name__ == "__main__":
    main()
