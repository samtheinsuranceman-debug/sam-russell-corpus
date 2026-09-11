# Member health data — upload, encryption and a provable no-access record (spec, not built)

The founder's idea, recorded so it is not lost: members with a health goal
should be able to upload blood reports and other medical data, have it encrypted
so that the platform itself cannot read it, and be able to request at any time
an immutable record proving their privacy was never violated. This document is
the design sketch. Nothing here is implemented yet.

## What "we have no access" has to mean

1. **Client-side encryption.** The file is encrypted in the member's browser
   with a key derived from a passphrase only they hold (or a key stored in their
   device's platform keystore). The server stores ciphertext and never receives
   the key. A lost passphrase means lost data; the UI must say so before upload.
2. **Zero-knowledge processing.** Any analysis the platform offers on the data
   (for example "your ApoB is above the trial threshold cited on the longevity
   shelf") runs in the browser after decryption, against reference values shipped
   with the app. The server sees neither the values nor the conclusions.
3. **What the server does see.** File size, upload time, the member's id and an
   opaque content hash. Nothing else.

## The provable record

An append-only ledger of every event that touches a member's encrypted objects
(upload, download by the member, deletion, and any administrative access —
which under this design should be zero). Each entry is hashed with the previous
entry's hash so the chain cannot be edited without breaking every later link.
Daily, the head hash is published somewhere the platform does not control
(a public transparency log, or anchored into a public blockchain) so a member
can verify that the ledger they are shown is the one that existed that day.

This is a hash chain with public anchoring, not a smart contract; it gives the
"immutable, requestable at any time" property without putting any member data
on a chain.

## Before building

- Legal review: HIPAA applies only if the platform is a covered entity or
  business associate; state privacy laws (CCPA/CPRA, Washington's My Health My
  Data Act) apply more broadly. The design above minimizes what is held, which
  is the right direction under every regime.
- Key recovery policy decided and written in plain language.
- The longevity and health shelves already cite the reference trials; the
  in-browser analysis would map a member's values onto those, with the same
  "not medical advice" framing the library uses.
