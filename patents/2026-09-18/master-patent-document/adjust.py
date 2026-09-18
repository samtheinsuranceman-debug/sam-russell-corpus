# Panel recalibration. Grok 4.3 reviewed the first-pass Alice estimates and
# called most of them over-optimistic. Scores below are the revised ones.
# Where I held a score higher than the panel wanted, the reason is recorded.
REVISED = {
 "DR-01":(5,"Panel: an architectural negative limitation ('cannot run the engines it shows') may add no inventive concept on its own. Lowered."),
 "DR-02":(6,"Panel: reads as data gating. Held above the floor because blocking GENERATION differs materially from flagging output, but lowered."),
 "DR-03":(5,"Panel: token-driven interface selection is conventional customisation. Lowered."),
 "DR-04":(4,"Panel named this among the three weakest: 'mere attribution display'. Lowered sharply."),
 "SE-017":(6,"Panel: correlation checking. Held mid because the gating is between two independently trained time-series, not a threshold on one."),
 "SE-018":(6,"Panel: selective display. Held mid because suppression occurs before the line exists, not after."),
 "SE-019":(5,"Panel: monotonic tracking is an improved data structure, still abstract. Lowered."),
 "SE-020":(4,"Panel named this among the three weakest: 'standard RBAC rendering'. Lowered sharply."),
 "SE-021":(6,"Panel: correlation. Held mid because preserving disagreement changes the output type, not just its accuracy."),
 "SE-022":(5,"Coupled simulation, but the financial framing invites an abstract reading. Lowered."),
 "SE-023":(6,"Same reasoning as DR-02, to which it is closely related."),
 "SE-024":(5,"Synchronised capture is real; the provenance half drags it down. Lowered."),
 "SE-025":(5,"Panel: sign-on is crowded art. The ordered recomputation is the only defensible part. Lowered."),
 "SE-026":(6,"Inline per-step provenance is stronger than after-the-fact citation, but the panel's attribution critique applies. Lowered."),
 "SE-027":(7,"Held highest in the set. Atomic multi-engine state transition is a genuine computing problem with a genuine technical solution; this is the least abstract claim here."),
 "SE-028":(5,"Outcome-weighted contributor scoring is interesting but reads as a business rule. Lowered."),
 "SE-029":(5,"The scheduler is technical; the financial strategies underneath are not. Lowered."),
 "SE-030":(6,"Frame-aligned synthesis holds up better than most, but the panel's correlation critique lands. Lowered."),
 "SE-031":(6,"Feedback-controlled release is closer to control systems than to business method. Held mid."),
 "SE-032":(6,"Panel: data gating. Held mid because a provable non-crossing guarantee is an architectural property, not a policy."),
 "SE-033":(4,"Panel: lifecycle activation is conventional configuration. Lowered sharply."),
 "SE-034":(6,"Distributed atomic commit with domain vetoes is real distributed-systems work. Held mid despite breadth risk."),
 "SE-035":(6,"Panel: state replay is logging. Held mid because retroactive re-execution of NEW engines against OLD states is not something a log supports."),
}
PANEL_DISSENT = """Grok 4.3 reviewed every score in this document before it was finalised and
called the first pass over-optimistic almost across the board. Its exact objection: most of
these "reduce to data gating, correlation checks, or selective display -- classic post-solution
activity or field-of-use limitations; Alice treats them as abstract." It named three as weakest:
Patent 360 ("mere attribution display"), The Plan That Reads The Room ("standard RBAC
rendering"), and the Licensed Delivery Shell ("architectural negative limitation adds no inventive
concept").

Every score in this document was lowered in response. None of the original estimates survived
unchanged. Three claims were held above where the panel would put them, and each of those
three says so and explains why in its own entry.

This disagreement is printed rather than resolved because the honest position is that reasonable
reviewers differ on software eligibility, and you are spending real money on filing decisions. Treat
every number here as an estimate from software engineers, not an opinion from counsel. A
registered patent attorney should re-score this list before a single application is filed."""
