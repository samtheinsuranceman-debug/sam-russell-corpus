// ============================================================
// Intelligence Archetype Profiles — the evidence case
// ============================================================
// This is NOT a prescription page. It documents, with real research, what happens
// when a person is HIGH on one intelligence line and STARVED on others — or is
// ISOLATED from peers who share their high line. Standard testing measures only
// g/IQ; this page shows the human consequences of the other 31 lines being ignored,
// and builds the evidence case for connection (the matching network).
//
// Honesty rule (same as the Research Library): every source is a real, verifiable
// study or book. Much of this literature is observational, longitudinal, or classic —
// each entry says so. Nothing here is fabricated.

export type ArchetypeSource = {
  cite: string;      // Author, A. (Year). Title. Journal/Publisher.
  finding: string;   // what it actually showed + an honest limitation
  kind: "doi" | "scholar";
  ref: string;       // DOI url OR a scholar search string
};

export type Archetype = {
  id: string;
  kind: "archetype" | "isolation" | "connection" | "starvation";
  name: string;
  highLines: string[];          // our-model line names
  lowLines: string[];           // the starved lines (archetype entries)
  pattern: string;              // the configuration in a sentence or two
  untreatedTrajectory: string;  // what the research says happens, unidentified/untreated/isolated
  connectionCase: string;       // what connection with same-line peers / development does
  growthMeasures: string;       // measured improvements where studies quantify them
  sources: ArchetypeSource[];
};

// Populated from the archetypes research batches (batch_gifted / batch_darkside /
// batch_isolation / batch_synthesis). Archetype-kind entries render as "before → after"
// profile cards; isolation/connection entries render as the science case for matching.
export const ARCHETYPES: Archetype[] = [
  {
    id: "the-derailed-executive", kind: "archetype",
    name: "The Derailed Executive",
    highLines: ["Logical", "Strategic", "Leadership"],
    lowLines: ["Interpersonal", "Empathic", "Emotional"],
    pattern: "A high-potential, unmistakably bright leader with an outstanding early track record who plateaus or is fired near the top — not for lack of ability but for insensitivity, arrogance, and troubled relationships that a narrow, over-used strength never had to compensate for.",
    untreatedTrajectory: "In the foundational CCL studies, 'arrivers' and 'derailers' were nearly identical on brightness, ambition, and early success; what separated the derailers was interpersonal problems (insensitivity, abrasiveness, arrogance), failure to build and lead a team, and over-dependence on a single strength that became a liability in a new context. Van Velsor & Leslie replicated this across seven countries and two decades: 'troubled interpersonal relationships' remained the most common derailment theme in both European and U.S. samples. Hogan's later syntheses estimate a majority of managers eventually derail, usually through the erosion of trust and loyalty rather than technical failure.",
    connectionCase: "The same research programs are explicitly developmental: derailment factors are behavioral and coachable, not fixed traits. CCL's Benchmarks 360 instrument was built directly from the derailment scales so leaders can see the interpersonal blind spots peers and reports already perceive; structured feedback plus 'diversity in the track record' (varied assignments that force the leader off the over-used strength) distinguishes those who arrive from those who derail.",
    growthMeasures: "Largely qualitative/observational (interview and case comparison of arrivers vs. derailers); the derailment factor structure has been quantified into six flaw scales but outcome studies do not report standardized effect sizes for reversal.",
    sources: [
      { cite: "McCall, M. W., & Lombardo, M. M. (1983). Off the Track: Why and How Successful Executives Get Derailed. Technical Report No. 21, Center for Creative Leadership.", finding: "Derailed and successful executives were equally bright and ambitious; derailers were distinguished by insensitivity/abrasiveness, betrayal of trust, over-managing, and over-reliance on a single strength. Limitation: small, early qualitative sample of mostly white male U.S. executives.", kind: "scholar", ref: "McCall Lombardo Off the Track successful executives derailed CCL 1983" },
      { cite: "Van Velsor, E., & Leslie, J. B. (1995). Why executives derail: Perspectives across time and cultures. Academy of Management Executive, 9(4), 62-72.", finding: "Replicated derailment themes across 39 organizations in six European countries and the U.S.; 'problems with interpersonal relationships' and 'inability to build/lead a team' generalized across cultures and time. Limitation: interview-based, cross-sectional.", kind: "scholar", ref: "https://www.jstor.org/stable/4165289" },
      { cite: "Lombardo, M. M., & McCauley, C. D. (1988). The Dynamics of Management Derailment. CCL Report No. 34.", finding: "Quantified derailment into six flaw scales including problems with interpersonal relationships and overdependence on a single strength. Limitation: derived from managerial ratings, not longitudinal outcomes.", kind: "scholar", ref: "Lombardo McCauley dynamics management derailment six flaw scales" },
    ],
  },
  {
    id: "the-dark-side-under-pressure", kind: "archetype",
    name: "The Dark Side Under Pressure",
    highLines: ["Leadership", "Strategic", "Logical"],
    lowLines: ["Interpersonal", "Emotional", "Volitional"],
    pattern: "A capable leader whose everyday strengths — bold, self-confident, imaginative, colorful — curdle into arrogance, volatility, and manipulation precisely when stress removes their self-monitoring, the 'dark side' that stays hidden in interviews and surfaces on the job.",
    untreatedTrajectory: "Hogan's model holds that dark-side tendencies are strengths under normal conditions but become 'reputation-ruining interpersonal flaws' when a person stops self-managing under pressure, complacency, or fatigue. The Hogan Development Survey groups 11 derailers into Moving Away (distancing/skepticism), Moving Against (dominating, charming, manipulating), and Moving Toward (ingratiating). Kaiser and colleagues found these traits relate to extreme, ineffective leader behavior; in Hogan's leader samples, failed leaders scored higher on the Mischievous, Colorful, and Imaginative scales.",
    connectionCase: "Because dark-side traits are 'invisible to the person and visible to everyone else,' the intervention is other-rated feedback plus coached self-monitoring: the HDS is used developmentally so a leader learns their specific stress triggers and installs guardrails (peers, pauses, delegation) before the derailer fires. The traits are not eliminated but managed situationally.",
    growthMeasures: "Psychometric (HDS scales predict rated derailment/extreme behavior); intervention outcomes are reported as coaching case results rather than controlled effect sizes.",
    sources: [
      { cite: "Kaiser, R. B., LeBreton, J. M., & Hogan, J. (2015). The Dark Side of Personality and Extreme Leader Behavior. Applied Psychology, 64(1), 55-92.", finding: "Dark-side personality scales predicted rated ineffective and extreme (too much/too little) leader behavior beyond bright-side traits. Limitation: relies on observer ratings; direction of some effects is nonlinear.", kind: "scholar", ref: "Kaiser LeBreton Hogan dark side personality extreme leader behavior 2015" },
      { cite: "Hogan, R., & Hogan, J. (1997/2009). Hogan Development Survey Manual. Hogan Assessment Systems.", finding: "Defines 11 derailers in three themes (Moving Away/Against/Toward); traits are adaptive normally but derail under low self-monitoring. Limitation: commercial instrument; independent validation is uneven across scales.", kind: "scholar", ref: "Hogan Development Survey HDS 11 derailers moving away against toward" },
    ],
  },
  {
    id: "the-corporate-psychopath", kind: "archetype",
    name: "The Corporate Psychopath",
    highLines: ["Strategic", "Interpersonal", "Leadership"],
    lowLines: ["Empathic", "Moral", "Emotional"],
    pattern: "High social/strategic and impression-management skill fused with an empty moral and empathic line — charm and boldness read as leadership potential while conscience and remorse are simply absent.",
    untreatedTrajectory: "Babiak & Hare's assessment of 203 corporate professionals in management-development programs found roughly 3.9% at a clinically meaningful psychopathy threshold — about 3-4x the ~1% general-population base rate — and these individuals were rated high on charisma/communication but low on actual leadership, responsibility, and effectiveness. Untreated, the pattern produces manipulation, exploitation of colleagues, and organizational damage that outlasts their tenure. Honest correction to the 'evil genius' myth: intelligence and the Dark Triad are essentially unrelated. O'Boyle et al.'s meta-analysis across 48 samples found negligible correlations (roughly .03 to -.05); dark strategic skill is a social/personality capacity, not a byproduct of high g.",
    connectionCase: "This is the archetype where the 'development case' is weakest and the honest answer matters most: core psychopathy responds poorly to conventional treatment. The evidence-based response is organizational — structured selection, 360 and reference verification, integrity/moral-disengagement screening, and governance that removes the unchecked charm-and-manipulate pathway — rather than a promise of individual transformation.",
    growthMeasures: "Prevalence ~3.9% in a corporate sample vs ~1% general population (Babiak et al.); intelligence–Dark Triad correlations ~.03 to -.05 (O'Boyle et al., meta-analytic, effectively null).",
    sources: [
      { cite: "Babiak, P., Neumann, C. S., & Hare, R. D. (2010). Corporate psychopathy: Talking the walk. Behavioral Sciences & the Law, 28(2), 174-193.", finding: "In 203 management-development participants, ~3.9% met a high psychopathy threshold; higher psychopathy correlated with charisma ratings but poorer rated performance and leadership. Limitation: single non-representative corporate sample; PCL-R adapted for a workplace context.", kind: "scholar", ref: "Babiak Neumann Hare 2010 corporate psychopathy talking the walk 203 executives" },
      { cite: "Babiak, P., & Hare, R. D. (2006). Snakes in Suits: When Psychopaths Go to Work. HarperCollins.", finding: "Argues psychopathic charm/manipulation/risk-taking is misread as leadership talent and thrives in loosely governed organizations. Limitation: largely case-based and theoretical rather than controlled.", kind: "scholar", ref: "Babiak Hare Snakes in Suits when psychopaths go to work" },
      { cite: "O'Boyle, E. H., Forsyth, D., Banks, G. C., & Story, P. A. (2013). A meta-analytic review of the Dark Triad–Intelligence connection. Journal of Research in Personality, 47(6), 789-794.", finding: "Across 48 samples, general mental ability showed no meaningful relation to narcissism, Machiavellianism, or psychopathy (effects ~.03 to -.05), refuting the 'evil genius' hypothesis. Limitation: heterogeneous DT and intelligence measures.", kind: "scholar", ref: "O'Boyle Forsyth Banks Story 2013 meta-analytic Dark Triad intelligence connection" },
    ],
  },
  {
    id: "hubris-syndrome", kind: "archetype",
    name: "The Intoxication of Power (Hubris Syndrome)",
    highLines: ["Leadership", "Strategic", "Volitional"],
    lowLines: ["Empathic", "Interpersonal", "Emotional"],
    pattern: "An acquired change, not a lifelong trait: a capable leader who, after prolonged possession of power, develops grandiosity, contempt for advice, loss of contact with reality, and messianic recklessness — intelligence plus power minus humility.",
    untreatedTrajectory: "Owen (a physician and former UK Foreign Secretary) and Davidson proposed Hubris Syndrome as an acquired personality change in office-holders, drawn from a study of U.S. Presidents and UK Prime Ministers over 100 years, defined by ~14 symptoms (e.g. seeing the world as an arena for self-glory, excessive confidence in one's own judgment and contempt for others' advice, loss of touch with reality, restlessness/recklessness). Crucially, the greater and longer-held the power, the more likely it develops — and leadership need not even be successful for it to emerge. Untreated it drives isolated, disastrous decision-making.",
    connectionCase: "Owen and Davidson frame the antidote as structural humility: term limits, strong dissenting counsel, and people close enough to the leader to puncture the bubble. Because it is acquired, removing or checking the power exposure can arrest or reverse it — the growth case is institutional constraint plus retained peer relationships that survive the rise.",
    growthMeasures: "Qualitative/historical (symptom-count classification of named leaders); explicitly proposed as a hypothesis for a new syndrome, not an epidemiologically validated diagnosis.",
    sources: [
      { cite: "Owen, D., & Davidson, J. (2009). Hubris syndrome: An acquired personality disorder? A study of US Presidents and UK Prime Ministers over the last 100 years. Brain, 132(5), 1396-1406.", finding: "Proposed 14 defining symptoms of an acquired, power-induced personality change; risk rises with the amount and duration of power held. Limitation: retrospective, based on public biographical record of a selected group, not clinical assessment.", kind: "doi", ref: "https://doi.org/10.1093/brain/awp008" },
    ],
  },
  {
    id: "the-alexithymic-analyst", kind: "archetype",
    name: "The Alexithymic Analyst",
    highLines: ["Logical", "Mathematical", "Systems"],
    lowLines: ["Emotional", "Interoceptive", "Empathic"],
    pattern: "High analytical function paired with an inability to identify or describe one's own feelings and a stunted inner emotional life — the emotional/interoceptive line goes dark even as the reasoning line runs hot.",
    untreatedTrajectory: "Alexithymia (difficulty identifying and describing feelings, externally-oriented thinking) is estimated at roughly 8-13% of the general population and is a recognized risk factor in psychosomatic illness. Studies link it to emotion-regulation deficits that route distress into the body and into interpersonal/occupational failure: it predicts the depersonalization component of burnout, is markedly elevated in depression and in conditions like inflammatory bowel disease, and correlates negatively with trait emotional intelligence. The untreated trajectory is somatic complaints, relationship breakdown, and burnout in someone who cannot name what is wrong.",
    connectionCase: "Alexithymia moderates but does not preclude therapeutic gain: because it overlaps with (yet is distinct from) low trait-EI, interventions that build emotion-labeling and interoceptive awareness — emotion-focused and psychodynamic-interpersonal work, and EI-skill training — can raise the starved line. Peers and therapeutic alliance that model naming emotions matter; alexithymia weakens but does not sever the link between alliance and outcome.",
    growthMeasures: "Prevalence ~8-13% general population; ~32% among those with elevated depression scores vs ~4% non-depressed; alexithymia the strongest predictor of depersonalization (burnout) in men in a medical-student sample; negative correlation with trait EI (magnitudes vary by study).",
    sources: [
      { cite: "Taylor, G. J., Bagby, R. M., & Parker, J. D. A. (1997). Disorders of Affect Regulation: Alexithymia in Medical and Psychiatric Illness. Cambridge University Press.", finding: "Establishes alexithymia as an emotion-regulation deficit central to psychosomatic illness; ~10% general-population prevalence via the Toronto Alexithymia Scale. Limitation: much evidence is cross-sectional/correlational.", kind: "scholar", ref: "Taylor Bagby Parker 1997 disorders of affect regulation alexithymia medical psychiatric illness" },
      { cite: "Popa-Velea, O., et al. (2017). Burnout and Its Relationships with Alexithymia, Stress, and Social Support among Romanian Medical Students. Int. J. Environ. Res. Public Health, 14(6), 560.", finding: "Alexithymia was the strongest predictor of depersonalization among men (burnout ~15%); perceived stress predicted exhaustion. Limitation: cross-sectional, single-school student sample.", kind: "scholar", ref: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5486246/" },
      { cite: "Costa, A., et al. (2021). Trait Emotional Intelligence and School Burnout Discriminate Between High and Low Alexithymic Profiles. Frontiers in Psychology, 12, 645215.", finding: "Alexithymia correlated negatively with trait EI and positively with burnout; low-EI/high-burnout profiles marked high-alexithymia individuals. Limitation: adolescent female sample; self-report.", kind: "scholar", ref: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8295538/" },
    ],
  },
  {
    id: "the-tortured-genius", kind: "archetype",
    name: "The Tortured Genius (Honestly)",
    highLines: ["Creative", "Artistic", "Divergent"],
    lowLines: ["Emotional", "Volitional"],
    pattern: "High creative achievement co-occurring with mood and psychiatric vulnerability — real, but far more specific and modest than the romantic myth of madness-as-fuel.",
    untreatedTrajectory: "Andreasen's Iowa Writers' Workshop study found ~80% of writers had a lifetime mood-disorder episode vs ~30% of matched controls, with elevated bipolar spectrum rates and familial clustering of both creativity and affective disorder. But the honest, best-powered evidence narrows the claim: Kyaga et al.'s 40-year Swedish total-population study (~1.2M individuals) found people in creative occupations were NOT generally more likely to have psychiatric disorders — the robust specific associations were bipolar disorder, and, among authors specifically, elevated rates across several disorders plus roughly 50% higher suicide risk. So the untreated risk is real for particular subgroups (writers, bipolar spectrum) and for suicide, not a blanket 'all creatives are ill.'",
    connectionCase: "The familial co-aggregation of creativity and disorder suggests shared, partly heritable traits — meaning the vulnerability is not the price of the gift and can be treated without dulling it. Same-line creative community plus proper mood-disorder treatment addresses the isolation and the untreated illness that carry the actual suicide risk; the creativity is not what needs curing.",
    growthMeasures: "Andreasen: ~80% vs ~30% lifetime mood-disorder rates (small n=30 per group); Kyaga et al.: population-scale, specific elevated risk chiefly for bipolar disorder and, in authors, ~50% higher suicide risk — general creative occupations showed no overall psychiatric excess.",
    sources: [
      { cite: "Andreasen, N. C. (1987). Creativity and mental illness: prevalence rates in writers and their first-degree relatives. American Journal of Psychiatry, 144(10), 1288-1292.", finding: "80% of 30 writers had a lifetime mood disorder vs 30% of controls, with familial clustering of creativity and affective illness. Limitation: very small sample, single elite program, no correction for the myth's over-generalization.", kind: "scholar", ref: "Andreasen 1987 creativity mental illness prevalence writers first-degree relatives Iowa" },
      { cite: "Kyaga, S., Landén, M., Boman, M., Hultman, C. M., Långström, N., & Lichtenstein, P. (2013). Mental illness, suicide and creativity: 40-year prospective total population study. Journal of Psychiatric Research, 47(1), 83-90.", finding: "In ~1.2M Swedes, creative occupations overall showed NO general excess of psychiatric disorder except bipolar; authors specifically had broader elevated risk and ~50% higher suicide rate. Limitation: occupation is a proxy for creativity; registry diagnoses only.", kind: "scholar", ref: "Kyaga Landen 2013 mental illness suicide creativity 40-year total population study Sweden" },
    ],
  },
  {
    id: "asynchronous-child", kind: "archetype",
    name: "The Asynchronous Child",
    highLines: ["Logical", "Linguistic"],
    lowLines: ["Emotional", "Interpersonal", "Bodily-Kinesthetic"],
    pattern: "Advanced cognition paired with age-typical or lagging emotional, social, and motor development — the child's inner life runs years ahead of the body and feelings that must carry it. The higher the intellect, the wider the internal asynchrony.",
    untreatedTrajectory: "The Columbus Group (1991) reframed giftedness itself as 'asynchronous development in which advanced cognitive abilities and heightened intensity combine to create inner experiences...qualitatively different from the norm,' and argued this makes the child 'particularly vulnerable' and requiring modifications in parenting, teaching, and counseling. Silverman documents the resulting mismatch: a child who reasons like an adult but still cries like a 6-year-old is misread as immature, manipulative, or defiant; perfectionism, intense frustration, and existential worry are common, and expectations pinned to the advanced 'age' the child sometimes displays produce chronic shame when the emotional age shows.",
    connectionCase: "Silverman's clinical prescription is to meet each developmental age separately — intellectual challenge at the advanced level, emotional and social support at the chronological level — and to place the child with true intellectual peers (often older) so the inner experience is validated rather than pathologized. Recognizing asynchrony as the definition of giftedness, not a disorder, itself reduces the misattribution of the child's intensity to bad behavior.",
    growthMeasures: "Qualitative / theoretical. The Columbus Group definition is a consensus clinical construct (unpublished, widely cited), not an experimentally validated model; asynchrony is descriptive rather than a measured quantity.",
    sources: [
      { cite: "Silverman, L. K. (1997). The construct of asynchronous development. Peabody Journal of Education, 72(3-4), 36-58.", finding: "Formal articulation of asynchronous development and its vulnerabilities; argues gifted experience is qualitatively (not just quantitatively) different. Limitation: conceptual/clinical, not an empirical outcome study.", kind: "scholar", ref: "Silverman 1997 construct of asynchronous development Peabody Journal of Education" },
      { cite: "Columbus Group (1991, July). Unpublished transcript, Columbus, Ohio (cited in Morelock, 1992; Silverman, 1997).", finding: "Defines giftedness as asynchronous development creating heightened vulnerability requiring modified parenting/teaching/counseling. Limitation: consensus statement, unpublished, no data.", kind: "scholar", ref: "Columbus Group 1991 definition giftedness asynchronous development" },
    ],
  },
  {
    id: "existential-depressive", kind: "archetype",
    name: "The Existential Depressive",
    highLines: ["Philosophical", "Intellectual (Existential)", "Moral"],
    lowLines: ["Interpersonal", "Emotional (regulation)"],
    pattern: "Intense intellectual/imaginational/emotional overexcitability plus early confrontation with meaning, mortality, and injustice — the gifted idealist who sees how things could be, cannot un-see how they are, and finds no peer who shares the disquiet.",
    untreatedTrajectory: "Webb argues gifted people disproportionately suffer 'existential depression' — a distress arising from confronting isolation, freedom, meaninglessness, and death — because the reflection needed to raise these questions comes early and unbidden. In adolescence especially, the gifted idealist may feel 'very alone in an absurd, arbitrary, and meaningless world' they feel powerless to change; Webb warns such depressions can be precursors to suicide. Dabrowski's Theory of Positive Disintegration frames the same crisis as 'disintegration': overexcitabilities (psychomotor, sensual, intellectual, imaginational, emotional — the latter three most tied to inner intensity) drive an internal conflict between how the world is and how it ought to be, experienced as anxiety, depression, and self-doubt.",
    connectionCase: "Dabrowski's key insight is that this disintegration can be POSITIVE — the necessary breakdown before advanced moral and personal reintegration at a higher level, if the person is supported through it rather than medicated into flatness. Webb's counseling recommendations center on connection: helping the person find others who share their intensity and idealism (touch, shared meaning, intellectual community) so the existential questions are metabolized in company rather than in isolation. Naming overexcitability as a trait, not a pathology, reduces the self-labeling of 'something is wrong with me.'",
    growthMeasures: "Qualitative / theoretical. Positive Disintegration is a developmental theory with limited controlled empirical support; overexcitability research shows association with giftedness but is largely correlational and self-report-based. Existential depression is a clinical description, not a formal DSM category.",
    sources: [
      { cite: "Dabrowski, K. (1964). Positive Disintegration. Boston: Little, Brown & Company.", finding: "Founding text of the theory: psychological tension and 'disintegration' as a route to higher-level development; introduces overexcitability. Limitation: theoretical/clinical, developed pre-modern-psychometrics, little controlled validation.", kind: "scholar", ref: "Dabrowski 1964 Positive Disintegration Little Brown" },
      { cite: "Webb, J. T. (2008). Dabrowski's theory and existential depression in gifted children and adults. Proceedings of the 8th International Congress of the Institute for Positive Disintegration in Human Development, 7-9.", finding: "Links giftedness to elevated risk of existential depression (isolation, meaninglessness) and to Dabrowski's framework. Limitation: conference/clinical synthesis, observational, no prevalence data.", kind: "scholar", ref: "Webb 2008 Dabrowski existential depression gifted children adults" },
      { cite: "Mendaglio, S. (Ed.) & Piechowski, M. M. (2008). Dabrowski's Theory of Positive Disintegration. Scottsdale, AZ: Great Potential Press.", finding: "Reviews overexcitability research and its associations with giftedness. Limitation: notes evidence is largely correlational/self-report.", kind: "scholar", ref: "Dabrowski theory positive disintegration overexcitability research findings giftedness" },
    ],
  },
  {
    id: "gifted-underachiever", kind: "archetype",
    name: "The Gifted Underachiever",
    highLines: ["Logical", "General g"],
    lowLines: ["Volitional", "Conscientiousness/Self-Regulation"],
    pattern: "High measured ability paired with weak self-regulation, goal-directedness, and study/effort habits — a persistent gap between what the person could do and what they actually produce, not explained by a diagnosed disability.",
    untreatedTrajectory: "Reis and McCoach's authoritative review defines gifted underachievement as a severe, sustained discrepancy between expected (ability-based) and actual (achievement) performance not attributable to a learning disability. Studies they synthesize implicate low self-efficacy, low self-regulation, weak goal-orientation, and poor study habits — a deficit on the volitional/conscientiousness side rather than the ability side. Untreated, the pattern tends to entrench: disengagement, negative self-concept, and habits formed in unchallenging classrooms can carry into adulthood, and a subset never convert their promise into accomplishment. (Terman's data below echo this: adjustment and drive, not IQ, separated his high and low achievers.)",
    connectionCase: "Interventions that explicitly TEACH self-regulated learning — goal-setting, planning, monitoring, effort attribution — are the evidence-based lever, along with appropriately challenging placement so effort finally matters. The University of Connecticut/Renzulli line of work shows self-regulation strategies and genuine challenge (rather than pressure alone) can reverse underachievement; supportive relationships and a match to interest/ability are recurring themes.",
    growthMeasures: "Mixed. Underachievement definitions vary widely across studies, inflating disagreement about prevalence; intervention effects exist but are often small-sample and hard to sustain. The construct is empirically real but methodologically contested (no single agreed operational cutoff).",
    sources: [
      { cite: "Reis, S. M., & McCoach, D. B. (2000). The underachievement of gifted students: What do we know and where do we go? Gifted Child Quarterly, 44(3), 152-170.", finding: "Landmark review defining gifted underachievement and cataloging its correlates (low self-efficacy, poor self-regulation, weak study skills). Limitation: definitional inconsistency across the literature limits firm prevalence estimates.", kind: "scholar", ref: "Reis McCoach 2000 underachievement of gifted students what do we know Gifted Child Quarterly" },
      { cite: "McCoach, D. B., & Siegle, D. (2003). Factors that differentiate underachieving gifted students from high-achieving gifted students. Gifted Child Quarterly, 47(2), 144-154.", finding: "Empirically, motivation/self-regulation and attitudes toward school (not ability) distinguished under- from high-achievers. Limitation: correlational, self-report survey design.", kind: "scholar", ref: "McCoach Siegle factors differentiate underachieving gifted high-achieving gifted students" },
    ],
  },
  {
    id: "twice-exceptional", kind: "archetype",
    name: "The Twice-Exceptional (2e)",
    highLines: ["Logical", "Creative", "Linguistic"],
    lowLines: ["Executive/Attention", "Reading/Processing", "Interpersonal"],
    pattern: "High ability co-occurring with a disability (e.g., ADHD, dyslexia, autism, an emotional disorder) where each masks the other: the giftedness hides the disability, the disability suppresses the giftedness, and the child looks merely 'average' — or 'lazy.'",
    untreatedTrajectory: "Because strengths and deficits cancel out on the surface, 2e students are chronically under-identified — estimates suggest a meaningful share of gifted children have a co-occurring disability, and many pass through school with neither exceptionality served. Reis, Baum, and Burke document that unidentified 2e learners are frequently mislabeled lazy, unmotivated, or behavior problems; the mismatch breeds anxiety, depression, low self-esteem, and emotional dysregulation, and their genuine talents go undeveloped while their support needs go unmet.",
    connectionCase: "Reis, Baum, and Burke's operational definition argues for simultaneous, dual-differentiated support: identify and nurture the talent AND accommodate the disability, in a strengths-based environment with intellectual peers. When the gift is the entry point (talent development first) rather than remediation alone, engagement, self-concept, and achievement improve; correct identification reframes the child from 'lazy' to 'gifted with a specific need.'",
    growthMeasures: "Qualitative / descriptive. The 5-6% school-population estimate and outcome claims come largely from field studies and expert consensus rather than randomized trials; masking makes prevalence inherently hard to measure and likely undercounted.",
    sources: [
      { cite: "Reis, S. M., Baum, S. M., & Burke, E. (2014). An operational definition of twice-exceptional learners: Implications and applications. Gifted Child Quarterly, 58(3), 217-230.", finding: "Provides a rigorous 2e definition and documents under-identification, mislabeling (lazy/behavioral), and the case for dual differentiation. Limitation: conceptual synthesis; prevalence undercounted due to masking.", kind: "scholar", ref: "Reis Baum Burke 2014 operational definition twice-exceptional learners Gifted Child Quarterly" },
      { cite: "Foley-Nicpon, M., Allmon, A., Sieck, B., & Stinson, R. D. (2011). Empirical investigation of twice-exceptionality: Where have we been and where are we going? Gifted Child Quarterly, 55(1), 3-17.", finding: "Reviews the empirical 2e base, confirming identification challenges and emotional/behavioral risk. Limitation: highlights how thin the rigorous outcome evidence still is.", kind: "scholar", ref: "Foley-Nicpon empirical investigation twice-exceptionality where have we been Gifted Child Quarterly 2011" },
    ],
  },
  {
    id: "high-iq-low-eq", kind: "isolation",
    name: "High IQ, Starved EQ — Why Cognitive Ability Alone Under-predicts Leadership",
    highLines: ["Logical", "Mathematical"],
    lowLines: ["Emotional", "Interpersonal", "Empathic"],
    pattern: "Cognitive ability is a threshold, not a summit: past the entry bar for complex roles, additional IQ buys little, and the emotional/relational lines account for most of the gap between competent and outstanding leaders.",
    untreatedTrajectory: "Goleman's data across ~200 large companies found that in senior roles close to 90% of the difference between star and average performers traced to emotional-intelligence competencies rather than IQ or technical skill, with IQ and expertise functioning as 'threshold capabilities.' Honest caveat: the rigorous meta-analytic picture is more modest — Joseph & Newman (2010) found ability-EI's incremental validity for job performance over IQ and the Big Five is small (roughly Δ in the .03–.07 range), larger only in high-emotional-labor jobs. So the claim 'EQ beats IQ' is oversold, but the narrower claim — that raw cognitive ability alone reliably under-predicts real-world leadership and life success — holds.",
    connectionCase: "The corrective is not more IQ but deliberate development of the neglected lines through the ability-EI framework (perceiving, using, understanding, managing emotion), which is trainable and measurable, and through same-role peer feedback that makes emotional blind spots visible.",
    growthMeasures: "Meta-analytic incremental validity of EI over IQ+Big Five ~ .03–.07 for job performance (small but non-zero; larger in high emotional-labor roles); ~90% star/average difference attributed to EI in Goleman's competency-model data (self-reported by employers, likely inflated).",
    sources: [
      { cite: "Joseph, D. L., & Newman, D. A. (2010). Emotional intelligence: An integrative meta-analysis and cascading model. Journal of Applied Psychology, 95(1), 54-78.", finding: "After controlling for IQ and the Big Five, ability-EI added only small incremental validity for job performance; effects were larger in high emotional-labor jobs. Limitation: 'mixed' EI measures overlap with personality, inflating some estimates.", kind: "scholar", ref: "Joseph Newman 2010 emotional intelligence integrative meta-analysis cascading model" },
      { cite: "Goleman, D. (1998/2004). What Makes a Leader? Harvard Business Review.", finding: "In competency analyses of ~200 firms, ~90% of the star-vs-average difference in senior roles was attributed to EI competencies; IQ/skill are 'threshold capabilities.' Limitation: based on employer-built competency models, not controlled prediction; likely overstates EI's unique share.", kind: "scholar", ref: "https://hbr.org/2004/01/what-makes-a-leader" },
      { cite: "Mayer, J. D., Salovey, P., & Caruso, D. R. (2008). Emotional intelligence: New ability or eclectic traits? American Psychologist, 63(6), 503-517.", finding: "Defines EI as a genuine, measurable mental ability (MSCEIT) distinct from personality; ability-EI shows modest but real prediction of social outcomes. Limitation: effect sizes are moderate, and self-report 'trait EI' should not be conflated with ability-EI.", kind: "scholar", ref: "Mayer Salovey Caruso 2008 emotional intelligence new ability eclectic traits" },
    ],
  },
  {
    id: "the-development-case-ei-training-feedback", kind: "connection",
    name: "The Development Case — EI Training and 360 Feedback Grow the Starved Lines",
    highLines: ["Logical", "Strategic", "Leadership"],
    lowLines: ["Emotional", "Interpersonal", "Empathic"],
    pattern: "The unifying counter-evidence to every dark-side archetype here: the neglected emotional/relational lines are trainable, and structured other-rated feedback is what makes the invisible deficits visible enough to close.",
    untreatedTrajectory: "Left alone, the deficits in the archetypes above are self-concealing — dark-side traits and interpersonal blind spots are, by construction, more visible to others than to the person — so ability plateaus into derailment precisely because the leader cannot self-detect the problem. Without external feedback the high line keeps running and the low line stays dark.",
    connectionCase: "Mattingly & Kraiger's meta-analysis of 58 studies found EI can be trained, with a moderate positive effect (treatment-control d ≈ 0.45), robust across gender and EI measure type, and strongest when training uses practice and feedback rather than lecture. Paired with 360-degree instruments built directly from the derailment literature (e.g. CCL's Benchmarks) and Hogan-style dark-side feedback, this gives the mechanism by which a 'competence-only' profile can add the missing lines: see the blind spot through peers' eyes, then practice the skill with feedback.",
    growthMeasures: "EI training effect on EI scores: d ≈ 0.45 (treatment-control) / d ≈ 0.51 range (pre-post) across 58 studies; moderated positively by inclusion of practice + feedback, unaffected by gender or measure type.",
    sources: [
      { cite: "Mattingly, V., & Kraiger, K. (2019). Can emotional intelligence be trained? A meta-analytical investigation. Human Resource Management Review, 29(2), 140-155.", finding: "Across 58 studies, EI training produced a moderate positive effect (treatment-control d ≈ 0.45), stronger with practice and feedback and weaker with lecture. Limitation: most measured EI test-score change, not downstream behavior/performance; publication bias possible.", kind: "scholar", ref: "Mattingly Kraiger 2019 can emotional intelligence be trained meta-analytical investigation" },
      { cite: "Lombardo, M. M., & McCauley, C. D. / Center for Creative Leadership. Benchmarks 360-degree assessment (built from the derailment research).", finding: "Operationalizes derailment factors into a multi-rater instrument so leaders can see interpersonal/derailment blind spots that self-ratings miss. Limitation: developmental tool; outcome effects reported qualitatively rather than as controlled trials.", kind: "scholar", ref: "CCL Benchmarks 360 assessment derailment factors leadership development" },
    ],
  },
  {
    id: "socially-optimal-intelligence", kind: "isolation",
    name: "The Ceiling of Rapport: Hollingworth's 'Socially Optimal' Range",
    highLines: ["Logical", "General g"],
    lowLines: [],
    pattern: "Hollingworth's classic clinical observation that intelligence far above the age-peer norm becomes a social liability: the further above ~160 IQ a child scores, the fewer true peers exist to understand or accept them.",
    untreatedTrajectory: "In her case studies of children above 180 IQ, Hollingworth observed that the majority above ~160 played little with other children because the gulf in interests, vocabulary, and moral reasoning made ordinary social contact 'almost insurmountable.' She described children 'too intelligent to be understood by the general run of persons,' predisposing them to isolation, boredom in school, and difficulty later forming intimacy. She proposed a ~125-155 'socially optimal' band within which a person is bright enough to lead yet not so far ahead as to be unreachable by ordinary peers.",
    connectionCase: "Hollingworth's practical remedy was placement with same-ability peers (she ran special opportunity classes), where the exceptionally gifted child is seen as a valued classmate rather than an oddity, and where friendship, leadership, and social ease become possible.",
    growthMeasures: "Qualitative / observational (early-20th-century clinical case studies, small N, no control group). The '125-155' figures are theoretical constructs from her observations, not a validated cutoff, and IQ-test norms have shifted (Flynn effect) since.",
    sources: [
      { cite: "Hollingworth, L. S. (1942). Children Above 180 IQ Stanford-Binet: Origin and Development. Yonkers-on-Hudson, NY: World Book Company.", finding: "Case studies documenting social isolation and 'insurmountable' peer difficulty in the most extremely gifted children; source of the socially-optimal-range idea. Limitation: tiny, non-representative sample, clinical/observational, no controls.", kind: "scholar", ref: "Hollingworth Children Above 180 IQ Stanford-Binet origin development" },
      { cite: "Silverman, L. K. (1990). The discoveries of Leta Hollingworth. Advanced Development Journal.", finding: "Reviews Hollingworth's finding that ~125-155 is a 'socially optimal' range and that above ~160 IQ social isolation rises sharply. Limitation: secondary/interpretive review of dated observational work.", kind: "scholar", ref: "https://www.positivedisintegration.com/Silverman1990.pdf" },
    ],
  },
  {
    id: "terman-what-actually-predicted-success", kind: "isolation",
    name: "Terman's Termites: IQ Didn't Decide It — Adjustment and Drive Did",
    highLines: ["General g"],
    lowLines: [],
    pattern: "The largest longitudinal study of high-IQ children ever run tested whether a high IQ predicts a flourishing life. It largely did not: among the gifted, IQ barely separated the most from the least successful — personality, adjustment, and conscientiousness did.",
    untreatedTrajectory: "Oden's 40-year follow-up compared the 100 most successful ('A') and 100 least successful ('C') men in Terman's gifted sample. The two groups differed little in average IQ; what set the A's apart was persistence, self-confidence, goal-orientation, and social/emotional adjustment, while the C's showed more instability, lower drive, and poorer adjustment. Follow-ups (Friedman and colleagues) found childhood conscientiousness predicted longevity decades later, and low adjustment tracked worse life and health outcomes — evidence that high g without the volitional and interpersonal lines does not, by itself, produce a good life.",
    connectionCase: "The corollary the Terman data support: for a gifted person, cultivating the non-g lines — conscientiousness, social connection, adjustment, sense of purpose — is what converts raw ability into a flourishing, long life. It is an argument for developing the whole profile, not resting on the IQ score.",
    growthMeasures: "Observational cohort (N≈1,500, begun 1921), not experimental; sample was largely white, middle-class California children hand-selected partly on teacher nomination, limiting generalizability. Findings are correlational — they identify predictors, not proven causes.",
    sources: [
      { cite: "Oden, M. H. (1968). The fulfillment of promise: 40-year follow-up of the Terman gifted group. Genetic Psychology Monographs, 77, 3-93.", finding: "The 100 most vs. 100 least successful gifted men differed little in IQ but sharply in drive, adjustment, and persistence. Limitation: correlational; success operationalized narrowly; non-representative sample.", kind: "scholar", ref: "Oden 1968 fulfillment of promise 40-year follow-up Terman gifted group A C most least successful" },
      { cite: "Terman, L. M., & Oden, M. H. (1947). Genetic Studies of Genius, Vol. IV: The Gifted Child Grows Up. Stanford University Press.", finding: "Foundational longitudinal report; high IQ did not guarantee eminence or happiness. Limitation: selection bias, era-bound, observational.", kind: "scholar", ref: "Terman Oden 1947 Genetic Studies of Genius gifted child grows up" },
      { cite: "Friedman, H. S., Tucker, J. S., Tomlinson-Keasey, C., Schwartz, J. E., Wingard, D. L., & Criqui, M. H. (1993). Does childhood personality predict longevity? Journal of Personality and Social Psychology, 65(1), 176-185.", finding: "In the Terman archive, childhood conscientiousness/social dependability predicted longer life. Limitation: archival, correlational, historical cohort.", kind: "scholar", ref: "Friedman 1993 does childhood personality predict longevity Terman conscientiousness" },
    ],
  },
  {
    id: "ability-grouping-acceleration-benefit", kind: "connection",
    name: "Placed With Peers: A Century of Ability-Grouping and Acceleration Evidence",
    highLines: ["Logical", "General g"],
    lowLines: [],
    pattern: "The connection case in hard numbers: when gifted students are grouped with same-ability peers or accelerated to an appropriate challenge level, achievement rises — and, contrary to the isolation fear, social-emotional outcomes hold up or improve.",
    untreatedTrajectory: "Held in the heterogeneous, age-locked classroom, the gifted student is under-challenged; boredom, disengagement, and underachievement (see the underachiever archetype) are the documented default when ability is not matched to instruction.",
    connectionCase: "Steenbergen-Hu, Makel, and Olszewski-Kubilius's second-order meta-analyses (100 years of research) found special grouping for the gifted (g = 0.37), cross-grade subject grouping (g = 0.26), and within-class grouping (0.19-0.30) all raised achievement, with no harm to lower-ability peers; acceleration produced large gains over same-age non-accelerated peers (g = 0.70) and roughly moderate gains overall (g ≈ 0.42). The Templeton report 'A Nation Deceived' synthesized studies back to 1867 and concluded acceleration causes no social-emotional harm and helps gifted students academically, emotionally, AND socially — directly refuting the myth that placing a gifted child with intellectual (often older) peers damages adjustment.",
    growthMeasures: "Quantified: special gifted grouping g = 0.37; cross-grade grouping g = 0.26; acceleration vs. same-age peers g = 0.70 (overall acceleration g ≈ 0.42). Limitation: g is a standardized mean difference from aggregated K-12 studies of uneven quality; many primary studies are quasi-experimental, and effects vary by implementation.",
    sources: [
      { cite: "Steenbergen-Hu, S., Makel, M. C., & Olszewski-Kubilius, P. (2016). What one hundred years of research says about the effects of ability grouping and acceleration on K-12 students' academic achievement. Review of Educational Research, 86(4), 849-899.", finding: "Two second-order meta-analyses: gifted grouping and acceleration significantly raise achievement (effect sizes above), no harm to others. Limitation: aggregates heterogeneous, largely quasi-experimental primary studies.", kind: "doi", ref: "https://doi.org/10.3102/0034654316675417" },
      { cite: "Colangelo, N., Assouline, S. G., & Gross, M. U. M. (2004). A Nation Deceived: How Schools Hold Back America's Brightest Students (Templeton National Report on Acceleration). Iowa City: Belin-Blank Center, University of Iowa.", finding: "Comprehensive research synthesis: acceleration benefits gifted students academically, socially, and emotionally, with no evidence of harm. Limitation: advocacy report drawing on largely observational/quasi-experimental base.", kind: "scholar", ref: "A Nation Deceived Colangelo Assouline Gross 2004 acceleration Templeton report" },
    ],
  },
  {
    id: "smpy-dose-and-peers", kind: "connection",
    name: "SMPY: Match the Challenge to the Mind, and It Flourishes",
    highLines: ["Mathematical", "Logical"],
    lowLines: [],
    pattern: "Half a century of tracking intellectually precocious youth shows that ability predicts extraordinary accomplishment WHEN it meets educational opportunity dosed to the person's level — and that even within the top 1%, more ability plus more challenge yields more.",
    untreatedTrajectory: "SMPY implies (and its intervention arm assumes) that without dose-appropriate challenge and access to advanced work/peers, precocious talent is under-fed; the study's rationale is precisely that the profoundly gifted have different educational needs that ordinary schooling fails to meet.",
    connectionCase: "Lubinski and Benbow's 35-year report found that among people identified by age 13 (SAT ≥ 700 before 13), those given richer educational opportunities — acceleration, advanced coursework, contact with intellectual peers and mentors — went on to disproportionate rates of doctorates, patents, publications, and STEM leadership. Ability and matched opportunity together, not ability alone, drove the outcomes; the within-top-1% gradient (the top quartile of the top 1% vastly out-produces the bottom quartile) shows challenge dosed to the actual level keeps paying off.",
    growthMeasures: "Quantified at the population level (elevated rates of PhDs, patents, tenure, high income vs. base rates), but the peer/opportunity effect is largely observational within a self-selected talent search sample — not a randomized dose trial. Causation is inferred, not proven.",
    sources: [
      { cite: "Lubinski, D., & Benbow, C. P. (2006). Study of Mathematically Precocious Youth after 35 years: Uncovering antecedents for the development of math-science expertise. Perspectives on Psychological Science, 1(4), 316-345.", finding: "Early-identified profoundly gifted youth given dose-appropriate opportunity show exceptional STEM accomplishment; educational match matters, and ability differences within the top 1% still predict differential achievement. Limitation: longitudinal-observational, self-selected talent-search sample.", kind: "doi", ref: "https://doi.org/10.1111/j.1745-6916.2006.00019.x" },
      { cite: "Bernstein, B. O., Lubinski, D., & Benbow, C. P. (2019). Psychological constellations assessed at age 13 predict distinct forms of eminence 35 years later. Psychological Science, 30(3), 444-454.", finding: "Age-13 ability and interest patterns predicted distinct forms of adult eminence decades later. Limitation: correlational/predictive, not experimental.", kind: "scholar", ref: "Bernstein Lubinski Benbow 2019 psychological constellations age 13 predict eminence" },
    ],
  },
  {
    id: "isolation-mortality-risk", kind: "isolation",
    name: "Isolation Kills: Loneliness as a Mortality Risk Factor",
    highLines: [],
    lowLines: [],
    pattern: "Chronic social isolation and loneliness are not merely unpleasant; across large populations they predict earlier death at magnitudes comparable to established medical risk factors.",
    untreatedTrajectory: "In a meta-analysis of 70 studies (3.4 million participants), social isolation, loneliness, and living alone raised the likelihood of death by 29%, 26%, and 32% respectively (odds ratios 1.29, 1.26, 1.32). The effect held across gender, follow-up length, and world region, and was actually stronger in samples averaging under age 65 — undercutting the assumption that this is only an elderly problem. Holt-Lunstad's earlier work placed the mortality impact of weak social ties on par with smoking and above obesity and physical inactivity.",
    connectionCase: "The same body of work implies the protective side: robust, satisfying social connection is a modifiable factor associated with survival. Both objective isolation (few ties) and subjective isolation (feeling alone) independently drive risk, so the intervention target is genuine felt connection, not just proximity to others.",
    growthMeasures: "29-32% relative reduction in mortality odds associated with being socially connected vs. isolated (inverse of the reported ORs). Observational and correlational — the meta-analysis cannot fully rule out reverse causation (poor health causing isolation), though the authors adjusted for baseline health.",
    sources: [
      { cite: "Holt-Lunstad, J., Smith, T. B., Baker, M., Harris, T., & Stephenson, D. (2015). Loneliness and Social Isolation as Risk Factors for Mortality: A Meta-Analytic Review. Perspectives on Psychological Science, 10(2), 227-237.", finding: "Social isolation OR 1.29, loneliness OR 1.26, living alone OR 1.32 for mortality across 70 studies / 3.4M people; effect comparable to major health risks. Limitation: observational, potential reverse causation.", kind: "doi", ref: "https://doi.org/10.1177/1745691614568352" },
      { cite: "Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social Relationships and Mortality Risk: A Meta-Analytic Review. PLoS Medicine, 7(7), e1000316.", finding: "Strong social relationships associated with 50% increased likelihood of survival (148 studies, 308,000 people). Limitation: correlational, heterogeneous measures of 'social relationship.'", kind: "doi", ref: "https://doi.org/10.1371/journal.pmed.1000316" },
    ],
  },
  {
    id: "loneliness-brain-vigilance", kind: "isolation",
    name: "The Threat-Vigilant Brain: How Loneliness Rewires Cognition",
    highLines: [],
    lowLines: ["Interpersonal"],
    pattern: "Cacioppo's evolutionary model treats loneliness as a biological alarm — like hunger or pain — that signals a survival threat. When chronic, that alarm biases the brain toward hypervigilance for social danger.",
    untreatedTrajectory: "Lonely individuals show implicit hyper-attention to negative social cues, interpret ambiguous social information as hostile, and thereby behave in ways that push others away — a self-reinforcing spiral. Perceived isolation predicts poorer executive function, faster cognitive decline, fragmented sleep, elevated stress physiology, and increased depressive symptoms. A 5-year longitudinal study (ages 50-68) found loneliness predicted rising depressive symptoms, but depression did not predict rising loneliness — indicating loneliness is a driver, not just a byproduct.",
    connectionCase: "Because the mechanism is perceived isolation, connection that the person experiences as genuinely understanding-in-kind can down-regulate the threat-surveillance state. Interventions that change maladaptive social cognition (correcting the negative interpretive bias) outperform interventions that merely increase social contact or teach social skills.",
    growthMeasures: "Cacioppo & colleagues' meta-analysis of loneliness interventions found the largest effects came from addressing maladaptive social cognition rather than increasing opportunities for contact. Largely observational/mechanistic; the directionality evidence is a strength, but neuroimaging correlations do not prove causation.",
    sources: [
      { cite: "Cacioppo, J. T., & Hawkley, L. C. (2009). Perceived social isolation and cognition. Trends in Cognitive Sciences, 13(10), 447-454.", finding: "Perceived isolation biases attention/memory toward social threat and undermines executive control; loneliness predicts poorer cognition over time. Limitation: much is mechanistic/correlational.", kind: "doi", ref: "https://doi.org/10.1016/j.tics.2009.06.005" },
      { cite: "Cacioppo, J. T., Hawkley, L. C., & Thisted, R. A. (2010). Perceived social isolation makes me sad: 5-year cross-lagged analyses of loneliness and depressive symptomatology in the CHASRS Study. Psychology and Aging, 25(2), 453-463.", finding: "Loneliness predicted increases in depressive symptoms but not vice versa, over 5 years. Limitation: single cohort, self-report.", kind: "doi", ref: "https://doi.org/10.1037/a0017216" },
    ],
  },
  {
    id: "relatedness-basic-need", kind: "connection",
    name: "Relatedness Is Not Optional: A Basic Psychological Need",
    highLines: [],
    lowLines: [],
    pattern: "Self-Determination Theory identifies three needs whose satisfaction is essential for motivation and wellbeing: autonomy, competence, and RELATEDNESS — the sense of being connected to and cared about by others.",
    untreatedTrajectory: "When relatedness is thwarted, SDT research documents diminished intrinsic motivation, controlled (rather than autonomous) functioning, ill-being, and reduced vitality. The theory frames these needs as 'essential nutrients' — deprivation produces predictable psychological deficits regardless of the individual's other strengths.",
    connectionCase: "Satisfaction of relatedness (alongside autonomy and competence) promotes autonomous motivation, intrinsic aspirations, psychological health, and 'effective engagement with the world.' Crucially for a matching thesis, relatedness satisfaction is not generic — it depends on connection where the person feels genuinely seen and valued, which same-line peers are best positioned to provide.",
    growthMeasures: "A quarter-century of experimental and field studies link need-satisfying (vs. need-thwarting) environments to higher self-reported motivation, satisfaction, and wellbeing. SDT is one of the most heavily replicated frameworks in motivation science; the relatedness component specifically is the least experimentally isolated of the three needs (a noted limitation).",
    sources: [
      { cite: "Ryan, R. M., & Deci, E. L. (2017). Self-Determination Theory: Basic Psychological Needs in Motivation, Development, and Wellness. New York: Guilford Press.", finding: "Relatedness is one of three innate needs whose satisfaction predicts wellbeing and autonomous motivation across domains and cultures. Limitation: relatedness is harder to manipulate experimentally than autonomy/competence.", kind: "scholar", ref: "Ryan Deci 2017 Self-Determination Theory basic psychological needs" },
      { cite: "Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. American Psychologist, 55(1), 68-78.", finding: "Foundational statement that relatedness support facilitates internalization and wellbeing. Limitation: broad theoretical synthesis.", kind: "doi", ref: "https://doi.org/10.1037/0003-066X.55.1.68" },
    ],
  },
  {
    id: "homophily-birds-of-a-feather", kind: "connection",
    name: "Birds of a Feather: Why Like Connects to Like",
    highLines: [],
    lowLines: [],
    pattern: "Homophily — 'similarity breeds connection' — is a structuring principle of nearly every human tie: friendship, marriage, advice, support, work, co-membership. People's networks are strikingly homogeneous on demographic, behavioral, and intrapersonal traits.",
    untreatedTrajectory: "The same principle explains isolation: when a person's defining traits (e.g. an exceptionally high line of intelligence) are rare in their local environment, homophily works against them — there are few similar others to bond with, so ties fail to form or dissolve. McPherson et al. note homophily powerfully limits the information, attitudes, and interactions available to a person, meaning the mismatched individual is structurally starved of resonant contact.",
    connectionCase: "Homophily is also the engineering principle behind a matching network: deliberately assembling similar others creates the conditions under which sustaining ties reliably form. The research shows like-minded connection is not a preference to be corrected but the default architecture of human bonding — a matching platform simply supplies the similar peers a rare individual's local environment lacks.",
    growthMeasures: "Qualitative/structural — the review synthesizes decades of network studies documenting homophily's pervasiveness across tie types; it establishes the mechanism rather than quantifying a wellbeing gain. Descriptive sociology, not an intervention trial.",
    sources: [
      { cite: "McPherson, M., Smith-Lovin, L., & Cook, J. M. (2001). Birds of a Feather: Homophily in Social Networks. Annual Review of Sociology, 27, 415-444.", finding: "Similarity structures ties of every type; networks are homogeneous, and homophily shapes what information/attitudes/interactions a person can access. Limitation: descriptive review, not causal.", kind: "doi", ref: "https://doi.org/10.1146/annurev.soc.27.1.415" },
    ],
  },
  {
    id: "gifted-peer-grouping", kind: "connection",
    name: "Same-Ability Peers: The Case for Grouping the Gifted Together",
    highLines: ["Logical", "Mathematical"],
    lowLines: [],
    pattern: "High-ability learners placed among true intellectual peers (via special grouping or acceleration) show measurable academic gains versus mixed-ability placement — a direct empirical test of the 'connect with your own line' claim.",
    untreatedTrajectory: "A century-spanning meta-review found no achievement benefit from ordinary between-class tracking (effect size ~0.04-0.06). High-ability students left in undifferentiated settings underperform their potential; qualitative gifted-education literature adds boredom, underachievement, and social disconnection when a bright student has no comparable peers.",
    connectionCase: "Special grouping designed for the gifted produced an achievement effect of ~0.37; cross-grade subject grouping ~0.26; within-class grouping ~0.19-0.30. Acceleration meta-analyses find positive effects on achievement with, on average, no harm to social-emotional development. The benefit comes specifically from matching level — not grouping per se — via higher expectations, peer instruction, and pro-academic norms.",
    growthMeasures: "Meta-analytic effect sizes: gifted special grouping g≈0.37; cross-grade grouping g≈0.26; within-class g≈0.19-0.30; between-class tracking ≈0.04-0.06 (essentially null). Limitation: placement/selection bias is a persistent confound, and some studies find grouping can dent academic self-concept (the 'big-fish-little-pond' effect).",
    sources: [
      { cite: "Steenbergen-Hu, S., Makel, M. C., & Olszewski-Kubilius, P. (2016). What One Hundred Years of Research Says About the Effects of Ability Grouping and Acceleration on K-12 Students' Academic Achievement. Review of Educational Research, 86(4), 849-899.", finding: "Second-order meta-analysis: within-class, cross-grade, and gifted grouping produce positive achievement effects; between-class tracking near zero; acceleration beneficial. Limitation: selection bias, heterogeneous programs.", kind: "doi", ref: "https://doi.org/10.3102/0034654316675417" },
      { cite: "Kulik, J. A., & Kulik, C.-L. C. (1992). Meta-analytic Findings on Grouping Programs. Gifted Child Quarterly, 36(2), 73-77.", finding: "Special grouping for the gifted yields meaningful achievement gains while mixed-ability grouping does not; documents the level-matching mechanism. Limitation: older studies, varied designs.", kind: "doi", ref: "https://doi.org/10.1177/001698629203600204" },
    ],
  },
  {
    id: "peer-effects-achievement", kind: "connection",
    name: "You Rise Toward Your Reference Group: Peer Effects on Trajectory",
    highLines: [],
    lowLines: [],
    pattern: "When peer group composition is randomly assigned (removing self-selection), the peers around you causally shape your behavior and, to a modest degree, your achievement — evidence that reference groups pull individual trajectories.",
    untreatedTrajectory: "The flip side of peer effects is that a low-aspiration or mismatched environment exerts the same causal pull downward: behavior spreads through proximity. An isolated high performer loses the upward peer 'lift' that same-caliber company would provide.",
    connectionCase: "Sacerdote's randomized Dartmouth roommate study found peers causally affect GPA and social-group decisions (e.g. joining fraternities); effects operated at the individual room level and were driven by peers' post-arrival behavior (social contagion), not merely pre-existing traits. The behavioral peer effects were substantial even where the GPA effect was modest — surrounding a person with high-functioning peers changes what they do.",
    growthMeasures: "Causal (random assignment) evidence of peer influence on GPA and social behavior; GPA effects modest in magnitude, behavioral effects (fraternity membership, study habits) larger. Limitation: effects were absent for big decisions like choice of major, and peer-effect estimates vary widely across the broader literature and settings.",
    sources: [
      { cite: "Sacerdote, B. (2001). Peer Effects with Random Assignment: Results for Dartmouth Roommates. The Quarterly Journal of Economics, 116(2), 681-704.", finding: "Random roommate assignment identifies causal peer effects on GPA and on joining social groups, driven by post-arrival behavior. Limitation: modest GPA effect; no effect on major choice; single institution.", kind: "doi", ref: "https://doi.org/10.1162/00335530151144131" },
    ],
  },
  {
    id: "scenius-genius-clusters", kind: "connection",
    name: "Scenius: Genius Comes in Clusters, Not Alone",
    highLines: ["Creative", "Logical"],
    lowLines: [],
    pattern: "Eminent creators do not appear at random through history — they cluster in specific times and places (Athens, Renaissance Florence, Vienna), feeding on dense networks of role models, rivals, and mentors. Simonton's historiometric work treats this as a lawful pattern, not coincidence.",
    untreatedTrajectory: "Simonton's generational time-series analyses show that the availability of role models in the prior generation predicts the number of eminent creators in the next — implying that a talented individual born into a barren period, without visible predecessors or peers of comparable ambition, is statistically less likely to fully develop. Talent isolated from a live tradition tends not to ignite.",
    connectionCase: "The presence of a peer-and-mentor cluster ('scenius,' Brian Eno's term for the collective form of genius) is associated with bursts of exceptional output. Simonton documents that creative eminence tracks the richness of one's developmental network; a matching platform that assembles same-line peers is, in effect, an attempt to manufacture the conditions historiometry finds behind creative golden ages.",
    growthMeasures: "Qualitative/correlational at the level of civilizations and generations: role-model availability in generation N predicts eminent-creator density in generation N+1. Limitation: historiometric and observational — cannot isolate individual causation, and 'scenius'/'Medici Effect' as popular framings are theoretical, not experimentally tested.",
    sources: [
      { cite: "Simonton, D. K. (1988). Scientific Genius: A Psychology of Science. Cambridge University Press.", finding: "Generational analyses link prior-generation role models to the emergence and density of eminent creators; genius clusters in time and place. Limitation: historiometric, correlational.", kind: "scholar", ref: "Simonton scientific genius role models generational clustering historiometry" },
      { cite: "Simonton, D. K. (1984). Genius, Creativity, and Leadership: Historiometric Inquiries. Cambridge, MA: Harvard University Press.", finding: "Zeitgeist and access to peers/mentors shape whether and how genius manifests. Limitation: aggregate historical data, not individual-level experiment.", kind: "scholar", ref: "Simonton 1984 Genius Creativity Leadership Historiometric Inquiries" },
    ],
  },
  {
    id: "communities-of-practice", kind: "connection",
    name: "Communities of Practice: Mastery Is Learned in Company",
    highLines: [],
    lowLines: [],
    pattern: "Lave & Wenger argue that deep skill and professional identity are acquired socially — through 'legitimate peripheral participation' in a community of fellow practitioners — not privately in the individual head.",
    untreatedTrajectory: "By this account, a person cut off from a community of same-domain practitioners lacks the very mechanism through which mastery and identity are formed: the graded path from newcomer to full participant, the shared repertoire, and the negotiation of meaning with old-timers. Learning in isolation is theorized to stall precisely because it is missing the social substrate.",
    connectionCase: "Participation in a shared-domain community moves practitioners from the periphery toward full participation, transforming both their competence and their sense of who they are. Connection with domain peers is framed not as a nicety but as the engine of expertise and belonging — directly supporting the value of a network organized around a shared 'line.'",
    growthMeasures: "Qualitative/ethnographic (apprenticeship studies of tailors, midwives, quartermasters, etc.). Highly influential theory of learning; it is descriptive and interpretive rather than quantified, and does not provide effect sizes — a stated limitation.",
    sources: [
      { cite: "Lave, J., & Wenger, E. (1991). Situated Learning: Legitimate Peripheral Participation. Cambridge University Press.", finding: "Mastery and identity develop through participation in communities of practice; learning is inherently social. Limitation: ethnographic/theoretical, not quantitative.", kind: "scholar", ref: "Lave Wenger 1991 Situated Learning Legitimate Peripheral Participation communities of practice" },
    ],
  },
  {
    id: "collective-effervescence-wellbeing", kind: "connection",
    name: "Collective Effervescence: Belonging as Vital Energy",
    highLines: [],
    lowLines: [],
    pattern: "Durkheim proposed that gathering with others in shared, emotionally synchronized assembly generates 'collective effervescence' — a felt fusion that revives social belonging and, he argued, is periodically necessary for individual wellbeing.",
    untreatedTrajectory: "Durkheim's framework implies that without periodic collective renewal, social integration decays and individual vitality suffers — a theoretical account of why the chronically un-gathered feel depleted and adrift. He tied insufficient integration to distress (his classic work linked low integration to suicide risk).",
    connectionCase: "Modern empirical work now supports the theory: participation in effervescent collective gatherings is associated with heightened social identification, emotional synchrony, prosocial behavior, and a medium-sized boost to 'vital energy.' Gabriel and colleagues found that regularly experiencing collective effervescence predicts wellbeing above and beyond other forms of social connection — i.e., shared, high-synchrony gathering with resonant others adds something ordinary contact does not.",
    growthMeasures: "Rimé & Paez's synthesis reports a medium-size association between effervescent gatherings and vital energy/wellbeing; Gabriel et al. found effervescence predicts wellbeing incrementally over general social connection. Limitation: correlational/self-report; the classic Durkheim theory itself is interpretive, and the modern effect sizes come from cross-sectional designs.",
    sources: [
      { cite: "Gabriel, S., Naidu, E., Paravati, E., Morrison, C. D., & Gainey, K. (2020). Creating the sacred from the profane: Collective effervescence and everyday activities. The Journal of Positive Psychology, 15(1), 129-154.", finding: "Experiencing collective effervescence predicts wellbeing above and beyond other social connection. Limitation: correlational, self-report.", kind: "doi", ref: "https://doi.org/10.1080/17439760.2019.1689412" },
      { cite: "Rimé, B., & Páez, D. (2023). Why We Gather: A New Look, Empirically Documented, at Émile Durkheim's Theory of Collective Assemblies and Collective Effervescence. Perspectives on Psychological Science, 18(6), 1306-1330.", finding: "Empirical review confirms collective gatherings increase social identification, emotional synchrony, prosociality, and vital energy (medium effect). Limitation: synthesis of mostly observational/field data.", kind: "doi", ref: "https://doi.org/10.1177/17456916221146388" },
    ],
  },
  {
    id: "unmatched-prodigy", kind: "isolation",
    name: "The Unmatched Prodigy: When Your Line Has No Local Peers",
    highLines: ["Logical", "Mathematical", "Creative"],
    lowLines: ["Interpersonal"],
    pattern: "An individual whose intelligence on some line runs far above everyone in reach — the exceptionally gifted case — where the very rarity of the trait removes the possibility of same-level peers in ordinary settings.",
    untreatedTrajectory: "Hollingworth's foundational studies distinguished a 'socially optimal' IQ band (~125-155), whose members were socially confident and enjoyed peer friendships, from children at IQ 160+, who faced chronic, involuntary social isolation. She traced the mechanism to communication mismatch beginning in early childhood and to the dawning awareness that others do not perceive the world as they do. Later gifted-education work documents heightened risk of intellectual, social, and emotional problems as intellectual level rises without matched peers.",
    connectionCase: "Hollingworth's remedy was explicitly about being understood: 'to assuage the sense of isolation, we need to convey understanding.' The isolation, she stressed, only wounds once the individual feels it — so supplying peers who genuinely operate on the same wave-band (the express function of a matching network) is the direct antidote. Acceleration and gifted-peer grouping research (above) shows such matching can be delivered without social-emotional harm.",
    growthMeasures: "Qualitative/clinical, and honestly classic-but-dated: Hollingworth's IQ bands (1920s-40s) rest on small samples and early IQ instruments and should be read as historically important observations, not modern effect sizes. The convergent modern signal comes from the gifted-grouping and acceleration meta-analyses cited elsewhere in this set.",
    sources: [
      { cite: "Hollingworth, L. S. (1942). Children Above 180 IQ Stanford-Binet: Origin and Development. Yonkers-on-Hudson, NY: World Book.", finding: "Identified a 'socially optimal' intelligence range and documented severe social isolation among the exceptionally gifted (IQ 160+). Limitation: small samples, early IQ measures, dated norms.", kind: "scholar", ref: "Hollingworth Children Above 180 IQ socially optimal intelligence isolation" },
      { cite: "Silverman, L. K. (1990). The Discoveries of Leta Hollingworth. (review/synthesis of Hollingworth's work on the exceptionally gifted).", finding: "Synthesizes Hollingworth's finding that involuntary isolation stems from communication mismatch and is remedied by conveying understanding. Limitation: secondary review of historical work.", kind: "scholar", ref: "Silverman 1990 The Discoveries of Leta Hollingworth positive disintegration" },
    ],
  },
  {
    id: "founder-at-the-top-alone", kind: "isolation",
    name: "The Founder Alone at the Top",
    highLines: ["Entrepreneurial", "Leadership", "Volitional"],
    lowLines: [],
    pattern: "A high-drive founder carries a high entrepreneurial/leadership line but sits structurally isolated: no peers who share the load, no one to confide the stressors to.",
    untreatedTrajectory: "Freeman's controlled study found entrepreneurs report markedly more mental-health conditions than comparison participants: 49% reported one or more conditions (30% depression, 29% ADHD, 12% substance use, 11% bipolar spectrum), and mental-health differences directly or indirectly touched 72% of the sample. Industry surveys layer isolation on top: roughly half of CEOs report loneliness, a large share say it hinders performance, and in Startup Snapshot's survey ~81% of founders said they do NOT open up about their stress to people in their lives.",
    connectionCase: "The same literatures point to peer connection, mentorship, and coaching as the lever: founders embedded in same-kind peer structures report the stress as more shareable and normalized, and the isolation metrics (loneliness, non-disclosure) are what the interventions target.",
    growthMeasures: "Freeman's prevalence figures are peer-reviewed and quantified; the loneliness/non-disclosure figures (~50% CEO loneliness, 81% non-disclosure) are industry/survey data, not RCTs — directional, not causal.",
    sources: [
      { cite: "Freeman, M. A., Staudenmaier, P. J., Zisser, M. R., & Andresen, L. A. (2019). The prevalence and co-occurrence of psychiatric conditions among entrepreneurs and their families. Small Business Economics, 53(2), 323-342.", finding: "Entrepreneurs (n=242) vs comparison (n=93): 49% reported a mental-health condition and 72% were touched directly or via family history; higher rates of depression, ADHD, substance use, and bipolar. Limitation: self-selected online sample, self-reported diagnoses, cross-sectional — no causal claim that entrepreneurship causes the conditions.", kind: "doi", ref: "https://doi.org/10.1007/s11187-018-0059-8" },
      { cite: "Startup Snapshot (2023). The Untold Toll: The Mental Health of Startup Founders. Industry report.", finding: "Reported ~72% of founders citing mental-health impacts and ~81% not open about stressors with those around them. Limitation: non-peer-reviewed industry survey, convenience sample.", kind: "scholar", ref: "Startup Snapshot founder mental health 81% not open stressors" },
    ],
  },
  {
    id: "peer-advisory-uplift", kind: "connection",
    name: "The Peer-Advisory Uplift (Mastermind / CEO Groups)",
    highLines: ["Entrepreneurial", "Leadership"],
    lowLines: [],
    pattern: "Founders and CEOs cluster into confidential same-kind peer-advisory boards (Vistage/YPO/EO-style masterminds) that meet regularly to work each other's real decisions.",
    untreatedTrajectory: "Without such a structure the isolated-founder pattern above holds: lower disclosure, loneliness reported as performance-hindering, no calibrated outside read on decisions.",
    connectionCase: "Vistage-cited Dun & Bradstreet analysis found member firms grew revenue ~4.6% in 2020 while comparable non-member SMBs declined ~4.7%; members reportedly retain for years and grow faster than size-matched non-members.",
    growthMeasures: "The ~4.6% vs -4.7% revenue swing is the headline figure — but it is a vendor-commissioned observational comparison with heavy self-selection (people who join and pay for peer groups differ from those who don't). Treat as suggestive industry evidence, not a controlled effect size.",
    sources: [
      { cite: "Vistage Worldwide / Dun & Bradstreet (2021). Revenue growth comparison of Vistage member vs non-member small and midsize businesses.", finding: "Member firms grew revenue ~4.6% in 2020 vs a ~4.7% decline for comparable non-members. Limitation: vendor-sponsored, self-selected membership, not randomized — cannot separate the group effect from the type of CEO who joins.", kind: "scholar", ref: "Vistage Dun Bradstreet member revenue 4.6% non-member decline" },
    ],
  },
  {
    id: "teams-dominate-knowledge", kind: "connection",
    name: "Teams Now Own the Frontier",
    highLines: ["Logical", "Creative", "Scientific"],
    lowLines: [],
    pattern: "The production of new knowledge has shifted from the lone genius to collaborating teams across essentially every field.",
    untreatedTrajectory: "Solo authorship, once the source of exceptional-impact work, has steadily lost ground; solo work is now less likely to reach the highest-impact tier.",
    connectionCase: "Analyzing 19.9M papers over five decades and 2.1M patents, Wuchty, Jones & Uzzi showed teams increasingly dominate solo authors, teams produce more highly cited work, and teams now generate the exceptionally high-impact research that used to be solo territory — the team-vs-solo citation advantage grew over time.",
    growthMeasures: "Large-N bibliometric: teams' relative-citation and high-impact advantage over solo authors rose across 50 years across sciences, social sciences, arts/humanities, and patents. Limitation: bibliometric/observational — citation counts are an imperfect proxy for quality, and field norms shifted alongside.",
    sources: [
      { cite: "Wuchty, S., Jones, B. F., & Uzzi, B. (2007). The increasing dominance of teams in production of knowledge. Science, 316(5827), 1036-1039.", finding: "Across 19.9M papers and 2.1M patents, teams produce more highly cited work than solo authors and increasingly monopolize exceptional-impact work; advantage grew over decades. Limitation: observational bibliometrics; citations proxy impact imperfectly.", kind: "doi", ref: "https://doi.org/10.1126/science.1136099" },
    ],
  },
  {
    id: "creative-small-world", kind: "connection",
    name: "The Creative Small World (Broadway's Q)",
    highLines: ["Creative", "Musical", "Interpersonal"],
    lowLines: [],
    pattern: "Creative output depends on the network structure of the collaborators — a mix of familiar and fresh ties, not on lone brilliance.",
    untreatedTrajectory: "At the extremes, artistic collaborations failed: teams with too many strangers couldn't cohere, and — the isolation-relevant tail — teams that were too densely, repeatedly connected suffered groupthink and stagnation. Both financial and critical success dropped at the network extremes.",
    connectionCase: "Uzzi & Spiro analyzed the network of artists behind 2,258 Broadway musicals (1945-1989). They found an inverted-U: as network 'small-world-ness' (Q, the blend of repeat and new collaborators) rose to an intermediate level, both the productions' financial and artistic success increased, then declined when connection got too dense.",
    growthMeasures: "Parabolic relationship between network connectivity (Q) and success — a middle band of same-field connection maximized both box-office and critical performance. Limitation: historical observational study of one industry; correlational network effects, not an experiment.",
    sources: [
      { cite: "Uzzi, B., & Spiro, J. (2005). Collaboration and creativity: The small world problem. American Journal of Sociology, 111(2), 447-504.", finding: "Across 2,258 musicals, an intermediate level of network connectivity (Q) maximized artistic and financial success; too little OR too much connection depressed it. Limitation: single-industry, historical, correlational.", kind: "doi", ref: "https://doi.org/10.1086/432782" },
    ],
  },
  {
    id: "creative-hot-streaks", kind: "connection",
    name: "Hot Streaks Ride on Exploration-then-Focus",
    highLines: ["Creative", "Scientific", "Artistic"],
    lowLines: [],
    pattern: "Individual creative careers are not uniform; they contain concentrated bursts ('hot streaks') of high-impact work.",
    untreatedTrajectory: "Impact is not evenly spread across a career; outside the streak, the same person's output lands with far lower impact despite similar productivity.",
    connectionCase: "Tracking ~30,000 artists, film directors, and scientists, Liu, Wang, Sinatra et al. found ~90% have at least one hot streak of elevated impact; a follow-up showed streaks tend to follow a period of broad EXPLORATION followed by focused EXPLOITATION — a pattern that exposure to diverse collaborators and fields can seed.",
    growthMeasures: "~90% of careers show >=1 hot streak; streak works cluster tightly in time; the exploration-then-exploitation sequence precedes streak onset. Honest caveat: this is about within-career timing, not directly a peer-presence effect — its relevance to 'same-kind peers' is the exploration that broad networks enable, which is inferential.",
    sources: [
      { cite: "Liu, L., Wang, Y., Sinatra, R., Giles, C. L., Song, C., & Wang, D. (2018). Hot streaks in artistic, cultural, and scientific careers. Nature, 559, 396-399.", finding: "~90% of ~30,000 creators had at least one hot streak of clustered high-impact work with no jump in productivity. Limitation: describes temporal patterning, not its social causes.", kind: "doi", ref: "https://doi.org/10.1038/s41586-018-0315-8" },
      { cite: "Liu, L., Dehmamy, N., Chown, J., Giles, C. L., & Wang, D. (2021). Understanding the onset of hot streaks across artistic, cultural, and scientific careers. Nature Communications, 12, 5392.", finding: "Hot streaks are commonly preceded by a period of exploration followed by exploitation. Limitation: observational; mechanism inferred from career records.", kind: "doi", ref: "https://doi.org/10.1038/s41467-021-25477-8" },
    ],
  },
  {
    id: "mentoring-career-psychosocial", kind: "connection",
    name: "The Mentored Ascent",
    highLines: ["Leadership", "Entrepreneurial", "Logical"],
    lowLines: [],
    pattern: "A higher-line individual paired with an experienced same-field mentor who provides both career sponsorship and psychosocial support.",
    untreatedTrajectory: "Unmentored protégés show lower compensation, promotion, and career satisfaction on average across the studies pooled — the gap the meta-analysis measures.",
    connectionCase: "Allen et al.'s meta-analysis of the mentoring literature found mentored protégés enjoyed better objective outcomes (compensation, promotions) and subjective outcomes (career satisfaction, expected advancement) than non-mentored peers, with career and psychosocial mentoring differing in what they most improved.",
    growthMeasures: "Benefits were reliable but effect sizes for OBJECTIVE outcomes (pay, promotions) were SMALL; subjective/attitudinal outcomes (satisfaction, career commitment) showed larger associations. Limitation: mostly correlational studies pooled — mentoring is not randomly assigned, so higher-potential people may both attract mentors and advance.",
    sources: [
      { cite: "Allen, T. D., Eby, L. T., Poteet, M. L., Lentz, E., & Lima, L. (2004). Career benefits associated with mentoring for proteges: A meta-analysis. Journal of Applied Psychology, 89(1), 127-136.", finding: "Mentored protégés had better objective and subjective career outcomes than non-mentored; objective effect sizes were small. Limitation: pooled correlational data — selection into mentoring confounds causal reading.", kind: "doi", ref: "https://doi.org/10.1037/0021-9010.89.1.127" },
    ],
  },
  {
    id: "belonging-identity-safe", kind: "connection",
    name: "The Belonging Switch",
    highLines: ["Logical", "Volitional"],
    lowLines: ["Interpersonal"],
    pattern: "A capable individual in an environment where they doubt they belong — an identity-threat gap that suppresses performance independent of ability.",
    untreatedTrajectory: "In the control condition, marginalized students carried a persistent achievement gap and reported worse health and well-being; belonging uncertainty tracked lower grades over years.",
    connectionCase: "Walton & Cohen's brief social-belonging intervention — reframing early social adversity as common and temporary — raised African-American students' GPA over a 3-year follow-up, HALVED the minority achievement gap, and improved self-reported health and well-being while reducing doctor visits.",
    growthMeasures: "Randomized controlled trial (N=92): 3-year GPA rise for African-American students, achievement gap cut ~50%, better self-reported health, fewer doctor visits. Limitation: small sample, single cohort; the effect is on already-capable students whose belonging (not ability) was the lever — replications show it's context-dependent.",
    sources: [
      { cite: "Walton, G. M., & Cohen, G. L. (2011). A brief social-belonging intervention improves academic and health outcomes of minority students. Science, 331(6023), 1447-1451.", finding: "A one-time belonging intervention raised minority students' 3-year GPA, halved the achievement gap, and improved health/well-being. Limitation: N=92, one institution; benefits concentrated in the identity-threatened group.", kind: "doi", ref: "https://doi.org/10.1126/science.1198364" },
    ],
  },
  {
    id: "kohler-stronger-partner", kind: "connection",
    name: "The Köhler Pull (Working Beside a Stronger Peer)",
    highLines: ["Volitional", "Entrepreneurial"],
    lowLines: [],
    pattern: "Placed in a dyad where the partner is somewhat more capable and the task is conjunctive (the group depends on the weaker member), the individual raises their own effort.",
    untreatedTrajectory: "Working alone or without an indispensable role, effort tracks individual baseline — no motivation gain.",
    connectionCase: "The Köhler effect (from Otto Köhler's 1920s rowing studies) shows the less-capable partner works HARDER when yoked to a moderately stronger one, driven by upward social comparison and feeling indispensable. A 2023 meta-analysis of 19 exercise studies (N=1,912) found a statistically significant overall motivation gain in partnered conjunctive tasks vs. individual performance.",
    growthMeasures: "Meta-analytic motivation gain significant across 19 studies / 1,912 participants; effect is strongest when partner is moderately (not vastly) stronger and the task is conjunctive. Limitation: most evidence is short lab/exercise tasks — durability over long real-world work is less established.",
    sources: [
      { cite: "Kerr, N. L., & Hertel, G. (2011). The Köhler group motivation gain: How to motivate the 'weak links' in a group. Social and Personality Psychology Compass, 5(1), 43-55.", finding: "Reviews the motivation-gain effect: weaker members raise effort via indispensability and upward comparison in conjunctive tasks. Limitation: mostly lab-task evidence.", kind: "doi", ref: "https://doi.org/10.1111/j.1751-9004.2010.00333.x" },
      { cite: "Meta-analysis of the Köhler motivation gain effect with exercise tasks (2023). Kinesiology Review, 12(3), 187-199.", finding: "Across 19 studies (N=1,912), partnered conjunctive exercise produced a significant motivation gain over solo performance. Limitation: exercise-domain, short-duration tasks.", kind: "scholar", ref: "Kohler motivation gain meta-analysis exercise Kinesiology Review 2023 1912 participants" },
    ],
  },
  {
    id: "goal-contagion", kind: "connection",
    name: "Goal Contagion (You Catch the Drive Around You)",
    highLines: ["Volitional", "Entrepreneurial"],
    lowLines: [],
    pattern: "Merely observing another person pursuing a goal automatically activates and can transfer that goal to the observer.",
    untreatedTrajectory: "Absent goal-directed models, the goal is not primed; behavior stays at baseline. And contagion is conditional — a goal pursued in an unacceptable way is NOT caught.",
    connectionCase: "Aarts, Gollwitzer & Hassin demonstrated across six studies that people automatically adopt and pursue a goal implied by another's behavior, with the adopted behavior showing hallmarks of real goal-directedness (sensitivity to goal strength, persistence). Implication: surrounding yourself with same-line, high-drive peers primes your own pursuit.",
    growthMeasures: "Six controlled experiments established goal contagion as goal-directed (persistent, strength-sensitive); crucially, contagion did NOT occur when the modeled pursuit was morally unacceptable. Limitation: short-term lab priming — evidence for durable, real-world life-goal transfer is inferential, not directly tested here.",
    sources: [
      { cite: "Aarts, H., Gollwitzer, P. M., & Hassin, R. R. (2004). Goal contagion: Perceiving is for pursuing. Journal of Personality and Social Psychology, 87(1), 23-37.", finding: "People automatically adopt goals implied by others' behavior; the adopted goal behaves like a real goal but is suppressed when the modeled pursuit is unacceptable. Limitation: lab priming, short-term.", kind: "doi", ref: "https://doi.org/10.1037/0022-3514.87.1.23" },
    ],
  },
  {
    id: "network-emotional-contagion", kind: "connection",
    name: "Your Wave-Band Spreads Three Degrees Out",
    highLines: ["Interpersonal", "Emotional"],
    lowLines: [],
    pattern: "States and behaviors — happiness, habits — cluster and travel through real social networks, so who you are surrounded by measurably shapes your own future state.",
    untreatedTrajectory: "Isolation or embedding in an unhappy/unmotivated cluster raises your own probability of the same state; unhappy and happy people form visible network clusters.",
    connectionCase: "Fowler & Christakis, following 4,739 people over 20 years in the Framingham Heart Study, found happiness spreads through networks up to three degrees of separation; people surrounded by many happy others and those central in the network were more likely to become happy later — and longitudinal models supported spread, not just homophily.",
    growthMeasures: "A friend becoming happy was associated with a meaningfully increased probability (reported ~25% for a directly connected friend) of the person becoming happy; effects detectable to three degrees. Limitation: heavily debated methodologically — critics argue observational network data cannot cleanly separate contagion from shared environment and homophily.",
    sources: [
      { cite: "Fowler, J. H., & Christakis, N. A. (2008). Dynamic spread of happiness in a large social network: longitudinal analysis over 20 years in the Framingham Heart Study. BMJ, 337, a2338.", finding: "Happiness clustered and spread to three degrees of separation over 20 years; being surrounded by happy people predicted future happiness. Limitation: observational; contagion-vs-homophily identification has been contested by later methodologists.", kind: "doi", ref: "https://doi.org/10.1136/bmj.a2338" },
    ],
  },
];

export const archetypeProfiles = () => ARCHETYPES.filter((a) => a.kind === "archetype");
export const isolationFindings = () => ARCHETYPES.filter((a) => a.kind === "isolation" || a.kind === "connection");
export const starvationCards = () => ARCHETYPES.filter((a) => a.kind === "starvation");
/** The one line a starvation card is about (its lowLines[0]), for lookup by lowest axis. */
export const starvationForLine = (line: string) =>
  ARCHETYPES.find((a) => a.kind === "starvation" && a.lowLines?.[0] === line);
