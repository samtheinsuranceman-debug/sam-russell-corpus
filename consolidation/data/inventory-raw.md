# Capability inventory — raw data
Generated 2026-09-20

| Metric | base (live) | russell-capital-app | russell-capital |
|---|---:|---:|---:|
| Page components | 325 | 722 | 687 |
| Registered routes | 330 | 612 | 620 |
| shared/ modules | 187 | 63 | 63 |
| server/ modules (non-test) | 147 | 49 | 49 |
| Schema tables | 155 | 116 | 116 |

## Page union
- base: **325**
- add from russell-capital-app (not in base): **462**
- add from russell-capital (not in base, not already counted): **9**
- **naive union: 796**

## Route collisions (same path, different component)
### russell-capital-app
- collides with base on **7** paths
- introduces **385** paths base does not have

### russell-capital
- collides with base on **6** paths
- introduces **391** paths base does not have

## Module collisions (present in both, content differs)
- **shared / russell-capital-app** — identical 47, **differs 12**, donor-only 4
- **shared / russell-capital** — identical 47, **differs 12**, donor-only 4
- **server / russell-capital-app** — identical 9, **differs 37**, donor-only 3
- **server / russell-capital** — identical 11, **differs 35**, donor-only 3

## Schema tables
- russell-capital-app: 116 tables, **7** not in base
- russell-capital: 116 tables, **7** not in base
- base: 155 tables