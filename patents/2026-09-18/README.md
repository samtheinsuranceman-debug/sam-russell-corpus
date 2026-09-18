# Patent Archive — 18 September 2026

Work from the patent reconciliation session, backed up because none of it was on
`master`. The `Patent360/` application at the repo root is a different thing — that
is the running app; this is the research and the document build.

## `master-patent-document/`

`Master_Patent_Document.pdf` (441 KB) and its HTML source, **plus the generators
that produced them** — `build.py`, `adjust.py`, and the three data modules. The
generators matter more than the PDF: the document can be rebuilt and extended from
them, and a PDF alone would have been a dead end.

Run: `python3 build.py`

## `source-scans/`

The ten raw scans the reconciliation ran against, in the 5th-grade language format.
These are what resolved the count discrepancy — 97 in a filename against 90 in a
document title against 88 seeds, 78 files, 76 applications, 57 in the registry, 20
families, and 6 actually drafted. Every one of those numbers came from a different
artifact, and they are all here rather than described.

## `uploaded-extracts/`

Text extracted from the PDFs uploaded during that session, kept because the
originals were attachments rather than files in a repo.

## `scale-readiness.html`

The scale-blocker readiness page built earlier in the session.

## `../patent360-build-2026-09-18.zip` (root, 15 MB)

The 342-file PATENT360-BUILD tree — source, compiled web, and the two interior
design systems. Zipped rather than expanded so the repo tree stays navigable;
the root already holds `patent360-master.zip` and `rcs-deploy-2026-09-06.zip`
under the same convention.

---

## A caution carried forward from that session

The patent counts in these documents are **claim counts, not granted patents**.
Six were actually drafted. Roughly half of the model-proposed candidates failed one
of the four verification gates — prior art, verification against the real source
code, or a §101 Alice attack — and the Alice scores were revised down from a 7.4
mean to 5.4 after an adversarial pass.

Anything published outward should say "patent pending" only where an application
genuinely exists. 35 U.S.C. §292 sets a false-marking penalty per offense, and
marking a product with a patent number that does not cover it is the exact conduct
it targets.
