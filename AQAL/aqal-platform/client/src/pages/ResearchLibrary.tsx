import React, { useState, useMemo, useEffect } from "react";
import {
  Search, ChevronDown, ExternalLink, FileText, ShieldCheck,
  Sparkles, LayoutGrid, ArrowLeft, Brain, TrendingUp, Shield, X,
} from "lucide-react";
import { Link } from "wouter";

// ============================================================
// AQAL — Research Library (standalone page)
// Full 32-line evidence library with real, verified citations.
// Three PDF volumes (132 sources) available for download.
// Two sections: Line Evidence (Vol I + II) and Trainability Evidence (Vol III).
// ============================================================

const INK = "#141009";
const INK2 = "#1B1610";
const INK3 = "#231C14";
const CREAM = "#F1EADB";
const CREAM2 = "#C4B89F";
const MUTED = "#867A66";
const LINE = "rgba(241,234,219,0.10)";
const CHAMPAGNE = "#E0C68C";
const CHAMPAGNE_D = "#C9A24B";
const JADE = "#9BC0B2";
const BRONZE = "#D19A72";

const VOL1_URL = "/manus-storage/AQALResearchLibraryVol1_0c460f0e.pdf";
const VOL2_URL = "/manus-storage/AQALResearchLibraryVol2_77564b0b.pdf";
const VOL3_URL = "/manus-storage/AQALResearchLibraryVol3_6017e939.pdf";
const WEAKNESS_REPORT_URL = "/manus-storage/AQALWeaknessClusterReport_c23fda66.pdf";

const TIER: Record<string, { label: string; c: string; desc: string }> = {
  established: { label: "Established", c: CHAMPAGNE, desc: "Decades of psychometrics behind a dedicated, validated instrument." },
  applied:     { label: "Applied Cluster", c: JADE, desc: "Real, measured constructs assembled from adjacent lines — not one dedicated test." },
  emerging:    { label: "Emerging", c: BRONZE, desc: "Genuine research exists; no single ability test is yet the field standard." },
};

const FAMILIES = [
  { key: "new",       name: "New Lines",                    note: "Added this cycle" },
  { key: "cognitive", name: "Cognitive & Reasoning" },
  { key: "aesthetic", name: "Aesthetic, Sensory & Bodily" },
  { key: "social",    name: "Personal, Social & Moral" },
  { key: "axes",      name: "The Independent Axes",         note: "Carry the profile's dimensionality" },
  { key: "applied",   name: "Applied & Performance" },
];

const LINES = [
  { id:"financial", name:"Financial", family:"new", tier:"established", sources:8,
    blurb:"Financial literacy, capability, and delay-of-gratification choice.",
    cite:"Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. Journal of Economic Literature, 52(1), 5–44.",
    note:"Field-defining review — financial literacy is low everywhere, even in rich, well-educated countries, and it shapes saving, investing, and retirement security over the life cycle.",
    linkLabel:"doi.org/10.1257/jel.52.1.5", linkUrl:"https://doi.org/10.1257/jel.52.1.5", linkKind:"doi" },
  { id:"humor", name:"Humor", family:"new", tier:"established", sources:7,
    blurb:"Sense of humor and humor production ability.",
    cite:"Greengross, G., & Miller, G. (2011). Humor ability reveals intelligence, predicts mating success, and is higher in males. Intelligence, 39(4), 188–192.",
    note:"Both general and verbal intelligence predicted humor-production ability, which in turn predicted mating success — the empirical backbone of this line.",
    linkLabel:"doi.org/10.1016/j.intell.2011.03.006", linkUrl:"https://doi.org/10.1016/j.intell.2011.03.006", linkKind:"doi" },
  { id:"seductive", name:"Seductive", family:"new", tier:"emerging", sources:7,
    blurb:"Mating intelligence and courtship signaling.",
    cite:"O'Brien, D. T., Geher, G., Gallup, A. C., Garcia, J. R., & Kaufman, S. B. (2010). Self-perceived mating intelligence predicts sexual behavior in college students. Imagination, Cognition and Personality, 29(4), 341–362.",
    note:"The key validation study: scores on the Mating Intelligence Scale predicted actual sexual behavior — the strongest single evidence this line is measurable at all.",
    linkLabel:"doi.org/10.2190/IC.29.4.e", linkUrl:"https://doi.org/10.2190/IC.29.4.e", linkKind:"doi" },
  { id:"parental", name:"Parental", family:"new", tier:"applied", sources:7,
    blurb:"Parental self-efficacy and reflective functioning.",
    cite:"Johnston, C., & Mash, E. J. (1989). A measure of parenting satisfaction and efficacy. Journal of Clinical Child Psychology, 18(2), 167–175.",
    note:"Established the modern two-factor Parenting Sense of Competence scale — Satisfaction and Efficacy — still the field's workhorse instrument.",
    linkLabel:"doi.org/10.1207/s15374424jccp1802_8", linkUrl:"https://doi.org/10.1207/s15374424jccp1802_8", linkKind:"doi" },
  { id:"community", name:"Community-Founding", family:"new", tier:"applied", sources:8,
    blurb:"Collective efficacy and sense of community.",
    cite:"Sampson, R. J., Raudenbush, S. W., & Earls, F. (1997). Neighborhoods and violent crime: A multilevel study of collective efficacy. Science, 277(5328), 918–924.",
    note:"One of the most-cited papers in social science — defined and measured collective efficacy, and showed it predicts lower violence across hundreds of neighborhoods.",
    linkLabel:"doi.org/10.1126/science.277.5328.918", linkUrl:"https://doi.org/10.1126/science.277.5328.918", linkKind:"doi" },

  { id:"logical", name:"Logical", family:"cognitive", tier:"established", sources:3,
    blurb:"Deductive, inductive, and conditional reasoning.",
    cite:"Frederick, S. (2005). Cognitive reflection and decision making. Journal of Economic Perspectives, 19(4), 25–42.",
    note:"Introduces the 3-item Cognitive Reflection Test, measuring the tendency to override a wrong gut answer with deliberation.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Frederick+Cognitive+reflection+and+decision+making+2005", linkKind:"scholar" },
  { id:"mathematical", name:"Mathematical", family:"cognitive", tier:"established", sources:3,
    blurb:"Quantitative reasoning and numeracy.",
    cite:"Richardson, F. C., & Suinn, R. M. (1972). The Mathematics Anxiety Rating Scale: Psychometric data. Journal of Counseling Psychology, 19(6), 551–554.",
    note:"The origin instrument for math anxiety, still the field's template — separates the affective barrier from underlying numerical ability.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Richardson+Suinn+Mathematics+Anxiety+Rating+Scale+1972", linkKind:"scholar" },
  { id:"spatial", name:"Spatial", family:"cognitive", tier:"established", sources:3,
    blurb:"Spatial visualization and mental rotation.",
    cite:"Shepard, R. N., & Metzler, J. (1971). Mental rotation of three-dimensional objects. Science, 171(3972), 701–703.",
    note:"The landmark demonstration that people mentally rotate images in real time — response time scales with angle of rotation.",
    linkLabel:"doi.org/10.1126/science.171.3972.701", linkUrl:"https://doi.org/10.1126/science.171.3972.701", linkKind:"doi" },
  { id:"pattern", name:"Pattern-Recognition", family:"cognitive", tier:"established", sources:3,
    blurb:"Fluid, inductive pattern detection.",
    cite:"Raven, J. (2000). The Raven's Progressive Matrices: Change and stability over culture and time. Cognitive Psychology, 41(1), 1–48.",
    note:"Reviews the most widely used culture-reduced measure of inductive, fluid reasoning and its stability across populations.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Raven+Progressive+Matrices+change+and+stability+over+culture+and+time+2000", linkKind:"scholar" },
  { id:"linguistic", name:"Linguistic", family:"cognitive", tier:"established", sources:3,
    blurb:"Verbal range, precision, and comprehension.",
    cite:"Dunn, L. M., & Dunn, D. M. (2007). Peabody Picture Vocabulary Test (4th ed.). Pearson.",
    note:"A widely used, well-normed measure of receptive vocabulary — a practical index of verbal ability across the lifespan.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Dunn+Peabody+Picture+Vocabulary+Test+PPVT-4", linkKind:"scholar" },

  { id:"musical", name:"Musical", family:"aesthetic", tier:"established", sources:3,
    blurb:"Musical aptitude and sophistication.",
    cite:"Müllensiefen, D., Gingras, B., Musil, J., & Stewart, L. (2014). The musicality of non-musicians. PLoS ONE, 9(2), e89642.",
    note:"Introduces the Gold-MSI, validated on 100,000+ people — the modern standard for measuring musicality beyond formal training.",
    linkLabel:"Google Scholar (open access)", linkUrl:"https://scholar.google.com/scholar?q=Mullensiefen+musicality+of+non-musicians+Goldsmiths+Musical+Sophistication+Index+2014", linkKind:"scholar" },
  { id:"bodily", name:"Bodily-Kinesthetic", family:"aesthetic", tier:"established", sources:3,
    blurb:"Motor proficiency and skilled bodily control.",
    cite:"Bruininks, R. H., & Bruininks, B. D. (2005). Bruininks-Oseretsky Test of Motor Proficiency (2nd ed.). Pearson/AGS.",
    note:"The standard normed measure of fine and gross motor proficiency, balance, coordination, and dexterity.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Bruininks-Oseretsky+Test+of+Motor+Proficiency+BOT-2", linkKind:"scholar" },
  { id:"naturalist", name:"Naturalist", family:"aesthetic", tier:"emerging", sources:3,
    blurb:"Sensitivity to living systems.",
    cite:"Gardner, H. (1999). Intelligence Reframed: Multiple Intelligences for the 21st Century. Basic Books.",
    note:"Where naturalist intelligence was formally proposed — and where the honest gap is: no dedicated ability measure exists yet.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Gardner+Intelligence+Reframed+naturalist+intelligence+eighth", linkKind:"scholar" },
  { id:"aesthetic", name:"Aesthetic", family:"aesthetic", tier:"emerging", sources:3,
    blurb:"Discernment of form, proportion, and quality.",
    cite:"Myszkowski, N., & Storme, M. (2017). Measuring 'good taste' with the Visual Aesthetic Sensitivity Test-Revised. Personality and Individual Differences, 117, 91–96.",
    note:"A modern psychometric revival of aesthetic-sensitivity testing, scoring agreement with expert aesthetic judgment.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Myszkowski+Storme+Visual+Aesthetic+Sensitivity+Test+VAST-R+good+taste", linkKind:"scholar" },

  { id:"interpersonal", name:"Interpersonal", family:"social", tier:"established", sources:3,
    blurb:"Modelling and moving other minds.",
    cite:"Baron-Cohen, S., Wheelwright, S., Hill, J., Raste, Y., & Plumb, I. (2001). The 'Reading the Mind in the Eyes' Test revised version. Journal of Child Psychology and Psychiatry, 42(2), 241–251.",
    note:"The standard performance measure of adult mentalizing — sensitive to subtle individual differences in reading others' mental states.",
    linkLabel:"doi.org/10.1111/1469-7610.00715", linkUrl:"https://doi.org/10.1111/1469-7610.00715", linkKind:"doi" },
  { id:"intrapersonal", name:"Intrapersonal", family:"social", tier:"established", sources:3,
    blurb:"Accuracy and coherence of the self-model.",
    cite:"Campbell, J. D., Trapnell, P. D., Heine, S. J., Katz, I. M., Lavallee, L. F., & Lehman, D. R. (1996). Self-concept clarity. Journal of Personality and Social Psychology, 70(1), 141–156.",
    note:"Introduces the Self-Concept Clarity Scale, linking a clear, coherent self-model to well-being and stable self-esteem.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Campbell+Self-concept+clarity+measurement+personality+correlates+1996", linkKind:"scholar" },
  { id:"emotional", name:"Emotional", family:"social", tier:"established", sources:3,
    blurb:"Perceiving, using, understanding, and managing emotion.",
    cite:"Mayer, J. D., Salovey, P., Caruso, D. R., & Sitarenios, G. (2003). Measuring emotional intelligence with the MSCEIT V2.0. Emotion, 3(1), 97–105.",
    note:"The flagship ability test of EI — performance-scored across four branches, the anchor for treating EI as a measurable intelligence.",
    linkLabel:"doi.org/10.1037/1528-3542.3.1.97", linkUrl:"https://doi.org/10.1037/1528-3542.3.1.97", linkKind:"doi" },
  { id:"socialperceptual", name:"Social-Perceptual", family:"social", tier:"established", sources:3,
    blurb:"Reading status, intent, and unspoken states.",
    cite:"Baron-Cohen, S., Wheelwright, S., Hill, J., Raste, Y., & Plumb, I. (2001). The 'Reading the Mind in the Eyes' Test revised version. Journal of Child Psychology and Psychiatry, 42(2), 241–251.",
    note:"Same instrument, different lens here: decoding others' mental states from minimal cues, scored against consensus answers.",
    linkLabel:"doi.org/10.1111/1469-7610.00715", linkUrl:"https://doi.org/10.1111/1469-7610.00715", linkKind:"doi" },
  { id:"moral", name:"Moral", family:"social", tier:"established", sources:3,
    blurb:"Moral reasoning and judgment development.",
    cite:"Rest, J., Narvaez, D., Thoma, S. J., & Bebeau, M. J. (1999). DIT2: Devising and testing a revised instrument of moral judgment. Journal of Educational Psychology, 91(4), 644–659.",
    note:"The revised Defining Issues Test — the most widely used measure of moral-judgment development, grounded in neo-Kohlbergian theory.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Rest+Narvaez+Thoma+Bebeau+DIT2+revised+instrument+of+moral+judgment+1999", linkKind:"scholar" },
  { id:"existential", name:"Existential", family:"social", tier:"emerging", sources:3,
    blurb:"Meaning, mortality, and ultimate questions.",
    cite:"King, D. B., & DeCicco, T. L. (2009). A viable model and self-report measure of spiritual intelligence. International Journal of Transpersonal Studies, 28(1), 68–85.",
    note:"The most-used measure in this space — with the honest caveat that the 'intelligence' framing itself is contested in the literature.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=King+DeCicco+viable+model+self-report+measure+of+spiritual+intelligence+SISRI-24+2009", linkKind:"scholar" },

  { id:"metacognitive", name:"Meta-Cognitive", family:"axes", tier:"established", sources:3,
    blurb:"Knowledge and regulation of one's own cognition.",
    cite:"Schraw, G., & Dennison, R. S. (1994). Assessing metacognitive awareness. Contemporary Educational Psychology, 19(4), 460–475.",
    note:"Introduces the Metacognitive Awareness Inventory, distinguishing knowledge of cognition from regulation of cognition.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Schraw+Dennison+Assessing+metacognitive+awareness+inventory+1994", linkKind:"scholar" },
  { id:"volitional", name:"Volitional", family:"axes", tier:"established", sources:3,
    blurb:"Grit, self-control, and sustained will.",
    cite:"Duckworth, A. L., Peterson, C., Matthews, M. D., & Kelly, D. R. (2007). Grit: Perseverance and passion for long-term goals. Journal of Personality and Social Psychology, 92(6), 1087–1101.",
    note:"Predicts West Point cadet retention and National Spelling Bee ranking, with incremental validity over IQ and conscientiousness.",
    linkLabel:"doi.org/10.1037/0022-3514.92.6.1087", linkUrl:"https://doi.org/10.1037/0022-3514.92.6.1087", linkKind:"doi" },
  { id:"adversarial", name:"Adversarial", family:"axes", tier:"emerging", sources:3,
    blurb:"Skill expressed against an opponent.",
    cite:"Chase, W. G., & Simon, H. A. (1973). Perception in chess. Cognitive Psychology, 4(1), 55–81.",
    note:"The founding study of expertise, showing masters encode board patterns novices cannot — no single dedicated scale exists for this line yet.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Chase+Simon+Perception+in+chess+1973", linkKind:"scholar" },
  { id:"interoceptive", name:"Interoceptive", family:"axes", tier:"established", sources:3,
    blurb:"Accuracy of internal bodily signals.",
    cite:"Schandry, R. (1981). Heartbeat perception and emotional experience. Psychophysiology, 18(4), 483–488.",
    note:"The classic heartbeat-detection paradigm that made interoceptive accuracy objectively measurable, not just self-reported.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Schandry+Heartbeat+perception+and+emotional+experience+1981", linkKind:"scholar" },

  { id:"strategic", name:"Strategic", family:"applied", tier:"applied", sources:3,
    blurb:"Planning and multi-step lookahead.",
    cite:"Shallice, T. (1982). Specific impairments of planning. Philosophical Transactions of the Royal Society B, 298(1089), 199–209.",
    note:"Introduces the Tower of London task, the standard measure of planning ability — though strategic reasoning resists a single dedicated test.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Shallice+Specific+impairments+of+planning+Tower+of+London+1982", linkKind:"scholar" },
  { id:"systemic", name:"Systemic", family:"applied", tier:"emerging", sources:3,
    blurb:"Seeing wholes, loops, and second-order effects.",
    cite:"Davis, A. C., & Stroink, M. L. (2016). The relationship between systems thinking and the New Ecological Paradigm. Systems Research and Behavioral Science, 33(4), 575–586.",
    note:"Develops and applies a measure of systems thinking as an individual difference — still a genuinely emerging construct.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Davis+Stroink+systems+thinking+New+Ecological+Paradigm+scale+2016", linkKind:"scholar" },
  { id:"entrepreneurial", name:"Entrepreneurial", family:"applied", tier:"established", sources:3,
    blurb:"Turning a vision into a shipped venture.",
    cite:"Lumpkin, G. T., & Dess, G. G. (1996). Clarifying the entrepreneurial orientation construct and linking it to performance. Academy of Management Review, 21(1), 135–172.",
    note:"The field-defining articulation of entrepreneurial orientation and its link to venture performance.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Lumpkin+Dess+Clarifying+the+entrepreneurial+orientation+construct+1996", linkKind:"scholar" },
  { id:"creative", name:"Creative", family:"applied", tier:"established", sources:3,
    blurb:"Divergent thinking and idea production.",
    cite:"Mednick, S. A. (1962). The associative basis of the creative process. Psychological Review, 69(3), 220–232.",
    note:"Introduces the associative theory of creativity and the Remote Associates Test — the field's convergent-thinking measure.",
    linkLabel:"doi.org/10.1037/h0048850", linkUrl:"https://doi.org/10.1037/h0048850", linkKind:"doi" },
  { id:"rhetorical", name:"Rhetorical", family:"applied", tier:"applied", sources:3,
    blurb:"Communicative competence and persuasion.",
    cite:"Cacioppo, J. T., & Petty, R. E. (1982). The need for cognition. Journal of Personality and Social Psychology, 42(1), 116–131.",
    note:"Introduces the Need for Cognition scale, central to the Elaboration Likelihood Model of how arguments actually get processed.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Cacioppo+Petty+The+need+for+cognition+scale+1982", linkKind:"scholar" },
  { id:"leadership", name:"Leadership", family:"applied", tier:"established", sources:3,
    blurb:"Eliciting real commitment and coordinated action.",
    cite:"Bass, B. M. (1985). Leadership and Performance Beyond Expectations. Free Press.",
    note:"The foundational theory of transformational leadership and the basis of the Multifactor Leadership Questionnaire.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Bass+Leadership+and+Performance+Beyond+Expectations+transformational+1985", linkKind:"scholar" },
  { id:"mechanical", name:"Mechanical", family:"applied", tier:"established", sources:3,
    blurb:"Practical grasp of how things work.",
    cite:"Bennett, G. K. (2008). Bennett Mechanical Comprehension Test (BMCT-II). Pearson.",
    note:"The long-standing standard measure of mechanical reasoning, used for decades in technical selection.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Bennett+Mechanical+Comprehension+Test+BMCT", linkKind:"scholar" },
  { id:"streetsmarts", name:"Street-Smarts", family:"applied", tier:"applied", sources:3,
    blurb:"Real-world reads under real stakes.",
    cite:"Wagner, R. K., & Sternberg, R. J. (1985). Practical intelligence in real-world pursuits: The role of tacit knowledge. Journal of Personality and Social Psychology, 49(2), 436–458.",
    note:"Introduces tacit knowledge and shows it predicts real-world performance largely independently of IQ.",
    linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Wagner+Sternberg+Practical+intelligence+tacit+knowledge+real-world+pursuits+1985", linkKind:"scholar" },
];

const TOTAL_LINES = LINES.length;
// Sources in the three downloadable PDF volumes (Line Evidence + Trainability).
const VOLUME_SOURCES = 140;

function TierDot({ tier }: { tier: string }) {
  const t = TIER[tier];
  const style =
    tier === "established"
      ? { background: t.c, border: `1px solid ${t.c}` }
      : tier === "applied"
      ? { background: "transparent", border: `1.5px solid ${t.c}` }
      : { background: "transparent", border: `1.5px dashed ${t.c}` };
  return <span className="rl-dot" style={style} />;
}

function LineCard({ line, open, onToggle }: { line: typeof LINES[0]; open: boolean; onToggle: () => void }) {
  const t = TIER[line.tier];
  const moreCount = line.sources - 1;
  const volLabel = line.family === "new" ? "Volume I" : "Volume II";
  return (
    <div className={`rl-card${open ? " is-open" : ""}`}>
      <button type="button" className="rl-card-head" onClick={onToggle} aria-expanded={open}>
        <div className="rl-card-top">
          <span className="rl-card-name">{line.name}</span>
          <ChevronDown className="rl-chev" size={15} />
        </div>
        <div className="rl-card-tier" style={{ color: t.c }}>
          <TierDot tier={line.tier} />
          {t.label}
        </div>
        <p className="rl-card-blurb">{line.blurb}</p>
        <div className="rl-card-meta">{line.sources} source{line.sources !== 1 ? "s" : ""} · {volLabel}</div>
      </button>
      {open && (
        <div className="rl-card-detail">
          <div className="rl-detail-cite">{line.cite}</div>
          <p className="rl-detail-note">{line.note}</p>
          <a className="rl-detail-link" href={line.linkUrl} target="_blank" rel="noreferrer">
            {line.linkKind === "doi" ? <ShieldCheck size={12} /> : <ExternalLink size={12} />}
            {line.linkLabel}
          </a>
          {moreCount > 0 && (
            <div className="rl-detail-more">
              <FileText size={11} /> +{moreCount} more source{moreCount !== 1 ? "s" : ""} in {volLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Trainability evidence data (Vol III — Comprehensive Edition) ----
// 22 DOI-verified sources across 19 sections organized by domain category
const TRAINABILITY_CLUSTERS = [
  // ═══════════════ COGNITIVE & REASONING LINES ═══════════════
  {
    id: "active-trial",
    title: "The ACTIVE Trial: One Course of Training, a Decade of Effects",
    subtitle: "Pattern-Recognition, Logical, and Processing-Speed capacities",
    description: "The largest randomized cognitive-training trial ever conducted. 2,832 adults (mean 73.6) randomized to ten sessions of training in exactly one domain — memory, reasoning, or speed — with boosters, vs. no-contact control, followed ten years. Effects were domain-specific, large, and astonishingly durable: gains persisted at the 10-year mark. Downstream: reduced dementia incidence, lower at-fault crash rates, less difficulty in daily activities. Caveat: sample was 65+.",
    sources: [
      { cite: "Ball, K., Berch, D. B., Helmers, K. F., et al. (2002). Effects of cognitive training interventions with older adults: A randomized controlled trial. JAMA, 288(18), 2271–2281.", note: "The founding ACTIVE paper: ten sessions of single-domain training produced immediate, domain-specific improvements.", link: "https://doi.org/10.1001/jama.288.18.2271", kind: "doi" },
      { cite: "Willis, S. L., Tennstedt, S. L., Marsiske, M., et al. (2006). Long-term effects of cognitive training on everyday functional outcomes in older adults. JAMA, 296(23), 2805–2814.", note: "Five years on: reasoning-trained participants reported less decline in everyday instrumental functioning.", link: "https://doi.org/10.1001/jama.296.23.2805", kind: "doi" },
      { cite: "Rebok, G. W., Ball, K., Guey, L. T., et al. (2014). Ten-year effects of the ACTIVE cognitive training trial on cognition and everyday functioning. Journal of the American Geriatrics Society, 62(1), 16–24.", note: "The decade mark: each trained ability remained improved at 10 years.", link: "https://doi.org/10.1111/jgs.12607", kind: "doi" },
      { cite: "Edwards, J. D., Xu, H., Clark, D. O., Guey, L. T., Ross, L. A., & Unverzagt, F. W. (2017). Speed of processing training results in lower risk of dementia. Alzheimer's & Dementia: TRCI, 3(4), 603–611.", note: "Speed training cut 10-year dementia incidence by 29% — up to 48% among those completing booster sessions.", link: "https://doi.org/10.1016/j.trci.2017.09.002", kind: "doi" },
      { cite: "Ball, K., Edwards, J. D., Ross, L. A., & McGwin, G., Jr. (2010). Cognitive training decreases motor vehicle collision involvement of older drivers. Journal of the American Geriatrics Society, 58(11), 2107–2113.", note: "Speed- and reasoning-trained drivers had substantially lower at-fault crash rates across six years.", link: "https://scholar.google.com/scholar?q=Ball+Edwards+Ross+McGwin+cognitive+training+motor+vehicle+collision+2010", kind: "scholar" },
    ],
  },
  {
    id: "fluid-intelligence",
    title: "Fluid Intelligence & Reasoning — Trainable, With Honest Limits",
    subtitle: "Including the field's own transfer debate",
    description: "Adults trained on adaptive working memory, tested on untrained fluid-reasoning measures. Children (low-SES) given 7–9 weeks of reasoning vs. speed games. Jaeggi reported dose-dependent transfer to fluid intelligence — landmark, and paired here with its skeptics (boundary section). Mackey found reasoning training raised reasoning, speed training raised speed — domain-specific gains in disadvantaged children.",
    sources: [
      { cite: "Jaeggi, S. M., Buschkuehl, M., Jonides, J., & Perrig, W. J. (2008). Improving fluid intelligence with training on working memory. PNAS, 105(19), 6829–6833.", note: "The famous — and contested — demonstration of transfer to fluid intelligence. Presented with its critics on purpose.", link: "https://doi.org/10.1073/pnas.0801268105", kind: "doi" },
      { cite: "Mackey, A. P., Hill, S. S., Stone, S. I., & Bunge, S. A. (2011). Differential effects of reasoning and speed training in children. Developmental Science, 14(3), 582–590.", note: "Targeted reasoning training raised reasoning; speed training raised speed — domain-specific cognitive gains.", link: "https://doi.org/10.1111/j.1467-7687.2010.01005.x", kind: "doi" },
    ],
  },
  {
    id: "spatial",
    title: "Spatial Intelligence — Highly Trainable, Durable, and It Transfers",
    subtitle: "The best-documented buildable intelligence line",
    description: "A meta-analysis of 217 training studies spanning ages and methods: courses, video games, spatial task practice. Average training effect Hedges's g = 0.47 — a solid, half-standard-deviation gain. Effects were stable across delays between training and testing, and transferred to spatial tasks that were never directly trained.",
    sources: [
      { cite: "Uttal, D. H., Meadow, N. G., Tipton, E., et al. (2013). The malleability of spatial skills: A meta-analysis of training studies. Psychological Bulletin, 139(2), 352–402.", note: "217 studies; g = 0.47; durable; transfers. Definitive statement that a core intelligence line is malleable.", link: "https://doi.org/10.1037/a0028446", kind: "doi" },
    ],
  },
  {
    id: "mathematical",
    title: "Mathematical & Mechanical — Trained Perception Builds Expertise",
    subtitle: "The 'trained eye' underlying technical mastery",
    description: "Perceptual-adaptive learning modules (PALMs): learners practice rapid classification of structured stimuli (math representations, ECGs, medical images) with adaptive sequencing; pre/post proficiency and fluency measured. PALM training produced dramatic short- and long-term gains in pattern recognition and fluency — accelerating the expert 'seeing' that normally takes years, in mathematics, and in reading technical/mechanical displays. Evidence the perceptual core of technical lines is directly trainable.",
    sources: [
      { cite: "Kellman, P. J., & Krasne, S. (2018). Accelerating expertise: Perceptual and adaptive learning technology in medical learning. Medical Teacher, 40(8), 797–802.", note: "Perceptual-adaptive learning accelerates the expert pattern recognition underlying technical and mechanical skill — buildable, not just innate.", link: "https://doi.org/10.1080/0142159X.2018.1484897", kind: "doi" },
    ],
  },
  // ═══════════════ PERSONAL, SOCIAL & MORAL LINES ═══════════════
  {
    id: "emotional",
    title: "Emotional Intelligence — Weeks of Training, Spillover Across Life",
    subtitle: "Measured spillover into physical health, relationships, and employability",
    description: "Controlled experimental studies of brief, structured emotional-competence programs in adults (roughly 15–18 hours across several weeks, with follow-up). 18 hours of training significantly improved emotion regulation, emotion understanding, and overall emotional competence — with downstream gains in psychological well-being, subjective physical health, quality of social relationships, and employability. Kotsou: adult gains held at one year, incl. peer-rated relationships, fewer somatic complaints, and lower cortisol — stress-physiology change from an intelligence-line intervention.",
    sources: [
      { cite: "Nelis, D., Kotsou, I., Quoidbach, J., et al. (2011). Increasing emotional competence improves psychological and physical well-being, social relationships, and employability. Emotion, 11(2), 354–366.", note: "A weak emotional line, built in 18 hours, paying out across four life domains — including employability judged by outside raters.", link: "https://doi.org/10.1037/a0021554", kind: "doi" },
      { cite: "Kotsou, I., Nelis, D., Grégoire, J., & Mikolajczak, M. (2011). Emotional plasticity: Improving emotional competence in adulthood. Journal of Applied Psychology, 96(4), 827–839.", note: "Durability: adult gains sustained at one year, with peer-rated relationship improvement and reduced cortisol.", link: "https://doi.org/10.1037/a0023047", kind: "doi" },
    ],
  },
  {
    id: "interpersonal",
    title: "Interpersonal & Social-Perceptual — Social Skills Are Trainable",
    subtitle: "27 RCTs, N=1,437, structured social-skills training",
    description: "A meta-analysis of 27 randomized controlled trials (N=1,437) of structured social-skills training, effect sizes in Hedges's g, with active and treatment-as-usual controls. Social-skills training showed reliable superiority over control for social functioning and related outcomes (g = 0.2–0.4), with social-cognitive approaches strongest. Evidence that the interpersonal line responds to structured practice — studied heavily in clinical samples, so effect sizes for high-functioning professionals need their own confirmation.",
    sources: [
      { cite: "Turner, D. T., McGlanaghy, E., Cuijpers, P., et al. (2018). A meta-analysis of social skills training and related interventions for psychosis. Schizophrenia Bulletin, 44(3), 475–491.", note: "27 RCTs: structured social-skills training reliably improves social functioning — the interpersonal line is buildable. Clinical samples; generalize with care.", link: "https://doi.org/10.1093/schbul/sbx146", kind: "doi" },
    ],
  },
  {
    id: "rhetorical",
    title: "Rhetorical Intelligence — Communication Skills Train and Transfer to Outcomes",
    subtitle: "Randomized trial: trained physicians improved patient outcomes",
    description: "A randomized controlled trial: 35 physicians randomized to a multi-session communication-skills training vs. routine care, with 240 patients; downstream patient health-literacy and clinical outcomes measured. Trained physicians produced measurable improvements in patient health literacy, medication adherence, self-efficacy, and even blood-pressure control — communication skill trained in the professional and moved real downstream outcomes in others, not just self-rated ability.",
    sources: [
      { cite: "Tavakoly Sany, S. B., Behzhad, F., Ferns, G., & Peyman, N. (2020). Communication skills training for physicians improves health literacy and medical outcomes among patients with hypertension: a randomized controlled trial. BMC Health Services Research, 20, 60.", note: "Randomized: communication-skills training transferred to patient literacy, adherence, and clinical outcomes — rhetorical skill is buildable and consequential.", link: "https://doi.org/10.1186/s12913-020-4901-8", kind: "doi" },
    ],
  },
  {
    id: "moral",
    title: "Moral Intelligence — Education Raises Moral-Judgment Development",
    subtitle: "55 studies using the Defining Issues Test",
    description: "A meta-analysis of 55 education-intervention studies, all using the DIT, across school, college, and adult samples and program types. Dilemma-discussion and psychological-development programs produced reliable gains in moral-judgment maturity; effects were larger for adults (24+) than younger participants, with 3–12 weeks optimal. The moral line develops with deliberate, structured intervention — not only with age.",
    sources: [
      { cite: "Schlaefli, A., Rest, J. R., & Thoma, S. J. (1985). Does moral education improve moral judgment? A meta-analysis of intervention studies using the Defining Issues Test. Review of Educational Research, 55(3), 319–352.", note: "55 studies: structured moral education reliably advances moral-judgment development, most in adults. The anchor for training this line.", link: "https://doi.org/10.3102/00346543055003319", kind: "doi" },
    ],
  },
  // ═══════════════ CONATIVE, PERFORMANCE & APPLIED LINES ═══════════════
  {
    id: "volitional",
    title: "Volitional & Emotional-Stability — Even 'Fixed' Traits Move",
    subtitle: "207 intervention studies, d ≈ 0.37 in ~24 weeks",
    description: "A systematic review/meta-analysis of 207 intervention studies tracking personality-trait measures through structured interventions, with longitudinal follow-ups. Marked change — d = 0.37 in ~24 weeks — replicated across designs and persisting after interventions ended. Emotional stability moved most. Half a year of deliberate work produced trait movement comparable to decades of natural adult change.",
    sources: [
      { cite: "Roberts, B. W., Luo, J., Briley, D. A., Chow, P. I., Su, R., & Hill, P. L. (2017). A systematic review of personality trait change through intervention. Psychological Bulletin, 143(2), 117–141.", note: "207 studies; d ≈ .37 in ~24 weeks; changes persist. Strongest general evidence the conative lines respond to work.", link: "https://doi.org/10.1037/bul0000088", kind: "doi" },
    ],
  },
  {
    id: "interoceptive",
    title: "Interoceptive & Meta-Cognitive — Five Days Changes Self-Regulation",
    subtitle: "Attention regulation, bodily/affective self-control",
    description: "A randomized trial: five days (~20 min/day) of integrative body–mind (mindfulness) training vs. active relaxation-training control, tested on attention and stress response. The training group showed significantly better executive attention and self-regulation and lower cortisol stress response than active control — in five days. Same program's later work documented white-matter change, evidence the mechanism is structural.",
    sources: [
      { cite: "Tang, Y.-Y., Ma, Y., Wang, J., et al. (2007). Short-term meditation training improves attention and self-regulation. PNAS, 104(43), 17152–17156.", note: "Randomized, active-controlled: five days improved attention/self-regulation and blunted the cortisol stress response.", link: "https://doi.org/10.1073/pnas.0707678104", kind: "doi" },
    ],
  },
  {
    id: "financial-train",
    title: "Financial Intelligence — Education Moves Behavior, Not Just Knowledge",
    subtitle: "76 RCTs, 160,000+ participants",
    description: "A meta-analysis of 76 randomized controlled trials with more than 160,000 total participants, isolating the causal effects of financial-education programs on measured knowledge and on subsequent, real financial behaviors. Positive causal effects on both knowledge (roughly 0.15–0.2 SD) and downstream behaviors (roughly 0.06–0.1 SD) — economically meaningful, 3x larger than earlier skeptical estimates, robust to publication-bias correction. Building the financial line changes what people do.",
    sources: [
      { cite: "Kaiser, T., Lusardi, A., Menkhoff, L., & Urban, C. (2022). Financial education affects financial knowledge and downstream behaviors. Journal of Financial Economics, 145(2), 255–272.", note: "76 RCTs, 160,000+ people, real behavior change. Pair with Fernandes (2014, Vol I) to show the field's honest self-correction.", link: "https://doi.org/10.1016/j.jfineco.2021.09.022", kind: "doi" },
    ],
  },
  {
    id: "entrepreneurial",
    title: "Entrepreneurial Intelligence — Education Raises Intention, Efficacy, Performance",
    subtitle: "Meta-analysis with an honest note on weak-study inflation",
    description: "A meta-analysis of entrepreneurship-education outcomes across many studies, relating training to entrepreneurship knowledge, intention, self-efficacy, and performance. Entrepreneurship education was positively associated with entrepreneurship outcomes — knowledge, intention, and performance — with academic-focused programs stronger than short training. The authors honestly flag that low-rigor studies overstate effects, a caveat carried here.",
    sources: [
      { cite: "Martin, B. C., McNally, J. J., & Kay, M. J. (2013). Examining the formation of human capital in entrepreneurship: A meta-analysis of entrepreneurship education outcomes. Journal of Business Venturing, 28(2), 211–224.", note: "Meta-analysis: entrepreneurship education raises intention, self-efficacy, and performance — with an honest note that weak studies inflate the effect.", link: "https://doi.org/10.1016/j.jbusvent.2012.03.002", kind: "doi" },
    ],
  },
  {
    id: "leadership",
    title: "Leadership Intelligence — Trainable, With Organizational Returns",
    subtitle: "Training effects measured in team and organizational results, not just test scores",
    description: "A meta-analysis of leadership-training programs across hundreds of independent samples, evaluating outcomes at four levels: participant reactions, learning, transfer to on-the-job behavior, and organizational results. Substantial improvements in learning, transfer to on-the-job behavior, and organizational results, with design factors (needs analysis, spacing, practice, feedback) that multiply the payoff. Delivery design is a measured moderator — relevant to coaching prescriptions.",
    sources: [
      { cite: "Lacerenza, C. N., Reyes, D. L., Marlow, S. L., Joseph, D. L., & Salas, E. (2017). Leadership training design, delivery, and implementation: A meta-analysis. Journal of Applied Psychology, 102(12), 1686–1718.", note: "Leadership training transfers to behavior and results — and which design choices amplify it.", link: "https://doi.org/10.1037/apl0000241", kind: "doi" },
    ],
  },
  {
    id: "creative",
    title: "Creative Intelligence — Training Produces Gains That Generalize",
    subtitle: "70 studies, internal-validity scrutiny",
    description: "A quantitative meta-analysis of 70 creativity-training program evaluations (4,210 participants), across criteria, settings, and populations, with internal-validity controls. Well-designed creativity training produced reliable gains generalizing across criteria, settings, and populations, holding under internal-validity scrutiny. Most effective when it trained cognitive skills and heuristics with realistic, domain-appropriate exercises.",
    sources: [
      { cite: "Scott, G., Leritz, L. E., & Mumford, M. D. (2004). The effectiveness of creativity training: A quantitative review. Creativity Research Journal, 16(4), 361–388.", note: "70 studies: creativity training works and generalizes — strongest when it builds cognitive skills with realistic exercises.", link: "https://doi.org/10.1080/10400410409534549", kind: "doi" },
    ],
  },
  // ═══════════════ AESTHETIC, SENSORY, BODILY & NATURALIST LINES ═══════════════
  {
    id: "musical",
    title: "Musical Intelligence — Twenty Days Transfers to Verbal Intelligence",
    subtitle: "With measured transfer to Linguistic intelligence",
    description: "A randomized study: preschoolers assigned to 20 days of computerized music training vs. matched visual-art training, tested on verbal intelligence and executive function with brain-plasticity measures. Only the music group improved on verbal intelligence — in 90% of children — after 20 days, with correlated brain-function change during an executive-function task. A rare clean demonstration of broad transfer from a music intervention to an untrained cognitive line.",
    sources: [
      { cite: "Moreno, S., Bialystok, E., Barac, R., Schellenberg, E. G., Cepeda, N. J., & Chau, T. (2011). Short-term music training enhances verbal intelligence and executive function. Psychological Science, 22(11), 1425–1433.", note: "20 days of music training; verbal-intelligence gains in 90% of children, with matching brain-function change. Music → language transfer, cleanly shown.", link: "https://doi.org/10.1177/0956797611416999", kind: "doi" },
    ],
  },
  {
    id: "bodily-kinesthetic",
    title: "Bodily-Kinesthetic Intelligence — Skill Training Rewires the Brain",
    subtitle: "Does training change the brain itself?",
    description: "Draganski: adults scanned before/after learning to juggle over three months. Scholz: adults scanned before/after six weeks of a complex visuo-motor skill, using diffusion imaging of white matter. Draganski found grey-matter growth in motion-processing regions after learning to juggle — overturning the view that adult cortical structure is fixed. Scholz found the first evidence of training-induced white-matter change in the healthy adult brain. Building a movement line physically remodels neural tissue.",
    sources: [
      { cite: "Draganski, B., Gaser, C., Busch, V., et al. (2004). Neuroplasticity: Changes in grey matter induced by training. Nature, 427(6972), 311–312.", note: "Learning to juggle grew grey matter in adults — the landmark that structure, not just function, changes with training.", link: "https://doi.org/10.1038/427311a", kind: "doi" },
      { cite: "Scholz, J., Klein, M. C., Behrens, T. E. J., & Johansen-Berg, H. (2009). Training induces changes in white-matter architecture. Nature Neuroscience, 12(11), 1370–1371.", note: "First evidence of training-induced white-matter change in the healthy adult brain — the wiring itself remodels.", link: "https://doi.org/10.1038/nn.2412", kind: "doi" },
    ],
  },
  {
    id: "memory-spatial",
    title: "Memory & Spatial Capacity — Exercise Grows the Hippocampus",
    subtitle: "A prescribable lever the platform can recommend directly",
    description: "A randomized controlled trial: older adults assigned to a year of aerobic walking vs. stretching/toning control, with hippocampal MRI volumetry and spatial-memory testing. Aerobic training increased hippocampal volume ~2%, reversing one-to-two years of age-related shrinkage, with corresponding spatial-memory gains. A concrete, low-cost intervention that physically enlarges a memory structure — the kind a weakness-cluster protocol can actually deliver.",
    sources: [
      { cite: "Erickson, K. I., Voss, M. W., Prakash, R. S., et al. (2011). Exercise training increases size of hippocampus and improves memory. PNAS, 108(7), 3017–3022.", note: "One year of aerobic exercise grew the hippocampus ~2% and improved memory — buildable capacity, prescribable today.", link: "https://doi.org/10.1073/pnas.1015950108", kind: "doi" },
    ],
  },
  {
    id: "naturalist",
    title: "Naturalist Intelligence — Nature Connection Is Buildable (With an Honest Twist)",
    subtitle: "Global meta-analysis: contact and mindfulness raise it; education alone does not",
    description: "A global meta-analysis: 147 correlational studies of human-nature connectedness plus 59 experimental studies testing whether interventions raise it. The 59 experiments showed significant increases in nature-connectedness after nature-contact and mindfulness interventions; high connectedness predicted more pro-nature behavior and better health. The honest twist, stated plainly: environmental 'education alone' did not reliably raise it — contact and experience did. Exactly the kind of boundary that keeps the library credible.",
    sources: [
      { cite: "Barragan-Jason, G., Loreau, M., de Mazancourt, C., Singer, M. C., & Ernestson, H. (2022). Human–nature connectedness as a pathway to sustainability: A global meta-analysis. Conservation Letters, 15(1), e12852.", note: "59 experiments: nature-contact and mindfulness interventions raise nature-connectedness (education alone does not). Buildable — with the mechanism specified.", link: "https://doi.org/10.1111/conl.12852", kind: "doi" },
    ],
  },
  // ═══════════════ THE HONEST BOUNDARY ═══════════════
  {
    id: "boundary",
    title: "The Honest Boundary: Generic 'Brain Games' Do Not Transfer — And Saying So Is the Credibility",
    subtitle: "What the evidence does NOT support",
    description: "Owen: a six-week online trial (with the BBC) in which 11,430 adults practiced brain-training games. Simons et al.: the field's most comprehensive independent review of brain-training claims. Generic games improve the games and do not transfer to untrained tasks, even close ones. The distinction that survives — and that this whole volume rests on — is between generic brain-game practice (which fails to generalize) and validated, line-specific interventions with real-world content (ACTIVE, spatial curricula, structured EI, financial education, leadership training, perceptual-adaptive learning), where durable downstream effects are documented. AQAL prescribes the second and never the first.",
    sources: [
      { cite: "Owen, A. M., Hampshire, A., Grahn, J. A., et al. (2010). Putting brain training to the test. Nature, 465(7299), 775–778.", note: "11,430 adults, six weeks: gains on practiced games, no transfer to untrained tasks. The result every skeptic cites — so the library cites it first.", link: "https://doi.org/10.1038/nature09042", kind: "doi" },
      { cite: "Simons, D. J., Boot, W. R., Charness, N., et al. (2016). Do \"brain-training\" programs work? Psychological Science in the Public Interest, 17(3), 103–186.", note: "The definitive review: robust near transfer, little far transfer from generic programs. This volume\u2019s inclusion criteria follow its standards.", link: "https://doi.org/10.1177/1529100616661983", kind: "doi" },
    ],
  },
];

// ---- Practices & Evidence data (the "AQAL Research Library") ----
// Nearest-construct mappings between real-world ACTIVITIES and the lines/clusters
// each one is closest to. Every study documents what an ACTIVITY does — not proof
// about the 32 proprietary lines. Education and coaching, never prediction.
const scholar = (q: string) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`;

type PracticeSource = { cite: string; note: string; link: string; kind: "doi" | "scholar" };
type PracticeCluster = {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  description: string;
  evidenceTag: "Strong" | "Moderate" | "Emerging" | "Mixed";
  callout?: string;
  sources: PracticeSource[];
};

const PRACTICE_SECTIONS: Record<string, string> = {
  "0": "Cluster Interaction & Systems Science",
  "1": "1 · Physical Training",
  "2": "2 · Strength Training — Cognitive & Psychological Transfer",
  "3": "3 · Social Connection",
  "4": "4 · Contemplative & Nature Walking",
  "5": "5 · Travel & Novel Experiences",
  "6": "6 · Therapy & Counseling",
  "7": "7 · Lifestyle & Contemplative Practices",
  "8": "8 · Integral Life Practice (Ken Wilber)",
  "9": "9 · Physiological & Micro-Practices",
  "10": "10 · Risk Factors & Suppressors",
  "11": "11 · Compounding & Convergence",
  "12": "12 · Interoception — The Cross-Line Keystone",
  "13": "13 · Aerobic Exercise — The Proven Keystone",
  "14": "14 · Sleep — The Foundational System",
  "15": "15 · Breathwork & HRV — Autonomic Self-Regulation",
  "16": "16 · Nature Exposure — Attention Restoration",
  "17": "17 · Thermal Stress — Sauna & Cold",
  "18": "18 · Psychedelic-Assisted Therapy — Deep but Gated",
  "19": "19 · Reading People — Nonverbal Decoding",
  "20": "20 · Couples, Relationships & Parenting",
  "21": "21 · Knowing vs. Doing — Making It Stick",
  "22": "22 · Intermittent Fasting & Time-Restricted Eating",
  "23": "23 · Light & Circadian Rhythm",
  "24": "24 · Cardiorespiratory Fitness — VO₂max",
  "25": "25 · The Gut–Brain Axis",
  "26": "26 · Nutrition for the Brain",
  "27": "27 · Music Training",
  "28": "28 · Bilingualism & Language Learning",
  "29": "29 · Expressive Writing & Journaling",
  "30": "30 · Gratitude",
  "31": "31 · Awe",
  "32": "32 · Purpose & Meaning in Life",
  "33": "33 · Volunteering & Generativity",
  "34": "34 · Reading",
  "35": "35 · Deliberate Practice & Skill Acquisition",
  "36": "36 · Cognitive Reserve & Lifelong Learning",
  "37": "37 · The Honest Frontier — Stacked Daily Protocols",
  "38": "38 · Micro-Saving & Behavioral Momentum",
  "39": "39 · Order & Environment",
  "40": "40 · Grooming & Self-Care",
  "41": "41 · Digital Minimalism & Attention",
};

// Short labels for the section jump-nav chips.
const PRACTICE_SECTION_SHORT: Record<string, string> = {
  "0": "Systems Science",
  "1": "Physical",
  "2": "Cognitive Transfer",
  "3": "Social",
  "4": "Nature",
  "5": "Travel",
  "6": "Therapy",
  "7": "Lifestyle",
  "8": "Integral Practice",
  "9": "Micro-Practices",
  "10": "Risk Factors",
  "11": "Compounding",
  "12": "Interoception",
  "13": "Exercise",
  "14": "Sleep",
  "15": "Breathwork",
  "16": "Nature",
  "17": "Thermal",
  "18": "Psychedelics",
  "19": "Reading People",
  "20": "Couples & Relationships",
  "21": "Making It Stick",
  "22": "Fasting",
  "23": "Light",
  "24": "VO₂max",
  "25": "Gut–Brain",
  "26": "Brain Nutrition",
  "27": "Music",
  "28": "Bilingualism",
  "29": "Journaling",
  "30": "Gratitude",
  "31": "Awe",
  "32": "Purpose",
  "33": "Volunteering",
  "34": "Reading",
  "35": "Deliberate Practice",
  "36": "Cognitive Reserve",
  "37": "The Frontier",
  "38": "Micro-Saving",
  "39": "Order",
  "40": "Grooming",
  "41": "Digital Minimalism",
};

// Consumer-intuitive display order: how-it-works first, then the high-leverage
// keystone practices (what to actually DO), then domain practices, then risks.
// This controls display order without renumbering the underlying data.
const PRACTICE_SECTION_ORDER = ["0", "21", "14", "13", "24", "12", "15", "16", "17", "18", "1", "2", "3", "4", "5", "6", "7", "8", "9", "22", "23", "25", "26", "27", "28", "29", "36", "35", "34", "30", "31", "32", "33", "38", "39", "40", "41", "19", "20", "37", "10", "11"];
const sectionRank = (s: string) => {
  const i = PRACTICE_SECTION_ORDER.indexOf(s);
  return i === -1 ? 999 : i;
};

// Group super-headers so a consumer can scan straight to what they want.
const PRACTICE_GROUP: Record<string, string> = {
  "0": "How it works",
  "21": "Keystone practices — start here",
  "14": "Keystone practices — start here", "13": "Keystone practices — start here",
  "12": "Keystone practices — start here", "15": "Keystone practices — start here",
  "16": "Keystone practices — start here", "17": "Keystone practices — start here",
  "18": "Keystone practices — start here",
  "1": "Practices by domain", "2": "Practices by domain", "3": "Practices by domain",
  "4": "Practices by domain", "5": "Practices by domain", "6": "Practices by domain",
  "7": "Practices by domain", "8": "Practices by domain", "9": "Practices by domain",
  "22": "Practices by domain", "23": "Practices by domain", "25": "Practices by domain",
  "26": "Practices by domain", "27": "Practices by domain", "28": "Practices by domain",
  "29": "Practices by domain", "36": "Practices by domain", "35": "Practices by domain",
  "34": "Practices by domain", "30": "Practices by domain", "31": "Practices by domain",
  "32": "Practices by domain", "33": "Practices by domain", "38": "Practices by domain",
  "39": "Practices by domain", "40": "Practices by domain", "41": "Practices by domain",
  "24": "Keystone practices — start here",
  "19": "Practices by domain", "20": "Practices by domain",
  "37": "The honest frontier — unproven",
  "10": "Risks & compounding", "11": "Risks & compounding",
};

const TAG_COLOR: Record<PracticeCluster["evidenceTag"], string> = {
  Strong: CHAMPAGNE,
  Moderate: JADE,
  Emerging: BRONZE,
  Mixed: MUTED,
};

const PRACTICE_EVIDENCE: PracticeCluster[] = [
  // ═══════════════ SECTION 0 — CLUSTER INTERACTION & SYSTEMS SCIENCE ═══════════════
  // The science behind the platform's core claims: strengths and weaknesses are a
  // network, not a list. Method = established (Tier 1); the specific ranking within
  // the AQAL 32-line model is our hypothesis pending cohort data (Tier 2).
  {
    id: "sys-centrality",
    section: "0",
    title: "Which Weakness Controls the Others — Network Centrality",
    subtitle: "Network psychometrics · expected influence",
    evidenceTag: "Emerging",
    description:
      "Traits behave as a web of mutually reinforcing nodes, not symptoms of one hidden cause. The most central node — highest expected influence — is the one whose change ripples furthest through the rest. This is the rigorous form of “which weakness has the most controlling influence over the others.” Honest boundary: what centrality means in psychological networks is actively debated, so we treat “your most central weakness” as a model-based hypothesis to confirm on our own cohort, not a settled fact.",
    sources: [
      { cite: "Borsboom, D., & Cramer, A. O. J. (2013). Network analysis: An integrative approach to the structure of psychopathology. Annual Review of Clinical Psychology, 9, 91–121.", note: "The foundational network-psychometrics paper: disorders as networks of interacting nodes, where the most-connected node carries the most influence.", link: "https://doi.org/10.1146/annurev-clinpsy-050212-185608", kind: "doi" },
      { cite: "Robinaugh, D. J., Millner, A. J., & McNally, R. J. (2016). Identifying highly influential nodes in the complicated grief network. Journal of Abnormal Psychology, 125(6), 747–757.", note: "Showed expected influence (direction-aware centrality) predicts which nodes actually drive change — the measure we would use to rank a person's weaknesses.", link: scholar("Robinaugh Millner McNally 2016 highly influential nodes complicated grief network"), kind: "scholar" },
      { cite: "Bringmann, L. F., Elmer, T., Epskamp, S., et al. (2019). What do centrality measures measure in psychological networks? Journal of Abnormal Psychology, 128(8), 892–903.", note: "The essential skeptic, cited on purpose: borrowed centrality measures don't always mean what we assume. Any claim about “the controlling node” must survive this.", link: "https://doi.org/10.1037/abn0000446", kind: "doi" },
      { cite: "Hallquist, M. N., Wright, A. G. C., & Molenaar, P. C. M. (2021). Problems with centrality measures in psychopathology symptom networks: Why network psychometrics cannot escape psychometric theory. Multivariate Behavioral Research, 56(2), 199–223.", note: "Counter-evidence we keep on purpose: strength centrality can be redundant with factor loadings, so a “central” node may just reflect an unmodeled latent variable. A guardrail on over-reading centrality.", link: "https://doi.org/10.1080/00273171.2019.1640103", kind: "doi" },
      { cite: "Dablander, F., & Hinne, M. (2019). Node centrality measures are a poor substitute for causal inference. Scientific Reports, 9, 6846.", note: "The sharpest caution: high centrality ≠ high causal influence. Treating the most-central node as the best intervention target can mislead — why we frame the controlling weakness as a hypothesis, not a verdict.", link: "https://doi.org/10.1038/s41598-019-43033-9", kind: "doi" },
      { cite: "Forbes, M. K., Wright, A. G. C., Markon, K. E., & Krueger, R. F. (2017). Evidence that psychopathology symptom networks have limited replicability. Journal of Abnormal Psychology, 126(7), 969–988.", note: "The replication challenge (and the debate it started): symptom-network parameters didn't reproduce well across samples. We cite it because a method's limits belong next to its promise.", link: "https://doi.org/10.1037/abn0000276", kind: "doi" },
      { cite: "Robinaugh, D. J., Millner, A. J., & McNally, R. J. (2016). Identifying highly influential nodes in the complicated grief network. Journal of Abnormal Psychology, 125(6), 747–757.", note: "Introduces expected influence — centrality that respects negative edges — as the measure that best predicts which node actually drives change. The metric behind “the controlling weakness.”", link: "https://doi.org/10.1037/abn0000181", kind: "doi" },
      { cite: "Jones, P. J., Ma, R., & McNally, R. J. (2019). Bridge centrality: A network approach to understanding comorbidity. Multivariate Behavioral Research, 54(5), 698–712.", note: "Defines the “bridge” node that connects one cluster to another — the exact mechanism for a weakness that spreads friction across life domains.", link: "https://doi.org/10.1080/00273171.2019.1614898", kind: "doi" },
      { cite: "Rodebaugh, T. L., Tonge, N. A., Piccirillo, M. L., et al. (2018). Does centrality in a cross-sectional network suggest intervention targets for social anxiety disorder? Journal of Consulting and Clinical Psychology, 86(10), 831–844.", note: "Directly tests our core assumption — do the most-central nodes make the best intervention targets? The honest answer is “sometimes,” which is why we frame it as a hypothesis.", link: "https://doi.org/10.1037/ccp0000336", kind: "doi" },
      { cite: "Haslbeck, J. M. B., & Waldorp, L. J. (2018). How well do network models predict observations? On the importance of predictability in network models. Behavior Research Methods, 50(6), 2521–2543.", note: "Adds “predictability” — how controllable a node is via its neighbors — a more objective complement to centrality for choosing where to intervene.", link: "https://doi.org/10.3758/s13428-018-1010-2", kind: "doi" },
      { cite: "Epskamp, S., Borsboom, D., & Fried, E. I. (2018). Estimating psychological networks and their accuracy: A tutorial paper. Behavior Research Methods, 50(1), 195–212.", note: "The standard for trusting a network at all: bootstrap the edges and centrality for stability before reading anything into them. Our guardrail against over-interpreting a noisy estimate.", link: "https://doi.org/10.3758/s13428-017-0862-1", kind: "doi" },
      { cite: "Epskamp, S., Waldorp, L. J., Mõttus, R., & Borsboom, D. (2018). The Gaussian graphical model in cross-sectional and time-series data. Multivariate Behavioral Research, 53(4), 453–480.", note: "The methodological foundation for estimating trait networks from partial correlations — the machinery underneath the whole cluster.", link: "https://doi.org/10.1080/00273171.2018.1454823", kind: "doi" },
      { cite: "Fried, E. I., & Cramer, A. O. J. (2017). Moving forward: Challenges and directions for psychopathological network analysis. Perspectives on Psychological Science, 12(6), 999–1020.", note: "A candid inventory of the field's own problems — measurement error, heterogeneity, unstable estimates. Kept on purpose so the method's limits stay visible.", link: "https://doi.org/10.1177/1745691617705892", kind: "doi" },
      { cite: "Guloksuz, S., Pries, L.-K., & van Os, J. (2017). Application of network theory to psychopathology: A critical review and conceptual framework. Schizophrenia Bulletin, 43(2), 197–209.", note: "A critical review cautioning against strong causal claims from cross-sectional networks — the skeptic's frame for reading any centrality result.", link: "https://doi.org/10.1093/schbul/sbw099", kind: "doi" },
      { cite: "Robinaugh, D. J., Hoekstra, R. H. A., Toner, E. R., & Borsboom, D. (2020). The network approach to psychopathology: A review of the literature 2010–2019 and an agenda for future research. Psychological Medicine, 50(3), 353–366.", note: "The decade-in-review — where centrality findings stand and what's still contested. Orientation for the whole field.", link: "https://doi.org/10.1017/S0033291719003404", kind: "doi" },
    ],
  },
  {
    id: "sys-weakest-link",
    section: "0",
    title: "The Weakest Link Caps the Whole — Bottleneck & O-Ring",
    subtitle: "Why one weakness can sink strong strengths",
    evidenceTag: "Strong",
    description:
      "A profile is not the average of its lines — a single deficiency can cap the whole outcome no matter how strong the rest. Liebig's Law of the Minimum (growth limited by the scarcest input) and Kremer's O-Ring theory (one faulty component ruins the finished product) are the rigorous forms of “your weakest cluster sinks your best strengths.” This is why weakness-shielding, not just strength-maximizing, is core to the platform.",
    sources: [
      { cite: "Kremer, M. (1993). The O-Ring theory of economic development. The Quarterly Journal of Economics, 108(3), 551–575.", note: "The formal economics of weakest-link production: output depends on the lowest-quality component, so one weakness can dominate many strengths.", link: "https://doi.org/10.2307/2118400", kind: "doi" },
      { cite: "Liebig's Law of the Minimum — limiting-factor theory applied to human performance and organizations.", note: "The 19th-century origin, now applied across management and performance: the scarcest factor sets the ceiling, regardless of surplus elsewhere.", link: scholar("Liebig law of the minimum limiting factor human performance organizations"), kind: "scholar" },
      { cite: "Goldratt, E. M. (1990). What Is This Thing Called Theory of Constraints and How Should It Be Implemented? North River Press.", note: "The founding text of the Theory of Constraints: a system's output is set by its single binding constraint — improving anything else changes nothing. The operational form of “fix the weakest link first.”", link: scholar("Goldratt Theory of Constraints what is this thing called how should it be implemented"), kind: "scholar" },
      { cite: "Blackstone, J. H. (2001). Theory of constraints — a status report. International Journal of Production Research, 39(6), 1053–1080.", note: "Reviews the empirical evidence that concentrating improvement on the constraint — not the non-constraints — is what actually raises total throughput. Support for constraint-first intervention.", link: scholar("Blackstone 2001 Theory of constraints a status report International Journal of Production Research"), kind: "scholar" },
    ],
  },
  {
    id: "sys-mutualism-keystone",
    section: "0",
    title: "One Strength Lifts the Rest — Mutualism & Keystone Effects",
    subtitle: "Why sharpening the right line raises the whole shape",
    evidenceTag: "Moderate",
    description:
      "Strengths don't just co-occur — they pull each other up. The mutualism model shows cognitive abilities reciprocally reinforce each other in development (why strong minds tend to be broadly strong), and “keystone” research shows a single sustained habit spilling over into unrelated domains. Together: sharpening the right strength can raise the entire profile.",
    sources: [
      { cite: "van der Maas, H. L. J., Dolan, C. V., Grasman, R. P. P. P., et al. (2006). A dynamical model of general intelligence: The positive manifold of intelligence by mutualism. Psychological Review, 113(4), 842–861.", note: "The mutualism model: abilities positively interact during development, generating the “positive manifold” without a single g. The basis for strengths lifting strengths.", link: "https://doi.org/10.1037/0033-295X.113.4.842", kind: "doi" },
      { cite: "Oaten, M., & Cheng, K. (2006). Longitudinal gains in self-regulation from regular physical exercise. British Journal of Health Psychology, 11(4), 717–733.", note: "Empirical keystone effect: a single sustained habit (exercise) spilled over into better diet, spending, and study self-regulation — one node cascading across life.", link: scholar("Oaten Cheng 2006 longitudinal gains self-regulation regular physical exercise"), kind: "scholar" },
    ],
  },
  {
    id: "sys-leverage",
    section: "0",
    title: "Where to Intervene, and How to Hold It — Leverage Points & Tracking",
    subtitle: "Re-engineering the probabilities",
    evidenceTag: "Moderate",
    description:
      "Not all interventions are equal — a few nodes are high-leverage (a small change moves everything), most are not. Meadows' leverage-points hierarchy is the map for choosing which node to enhance or deplete. And implementation-intention research (if-then plans) is the evidence base for the tracking that keeps a targeted weakness from unconsciously derailing goals.",
    sources: [
      { cite: "Meadows, D. H. (1999). Leverage Points: Places to Intervene in a System. The Sustainability Institute.", note: "The ranked theory of where a small shift produces the largest system change — the conceptual engine for re-engineering outcomes by moving the most influential node.", link: scholar("Meadows 1999 Leverage Points Places to Intervene in a System"), kind: "scholar" },
      { cite: "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69–119.", note: "94 studies, d = 0.65: if-then plans reliably shield goal pursuit from derailment. The evidence for personalized tracking that stops a weakness from sabotaging strengths.", link: "https://doi.org/10.1016/S0065-2601(06)38002-1", kind: "doi" },
    ],
  },
  {
    id: "sys-matching",
    section: "0",
    title: "Complementary Matching — Collective Intelligence",
    subtitle: "When a partner's strength covers your blind spot",
    evidenceTag: "Moderate",
    description:
      "The network reaches past one person: a partner whose strengths cover your blind spots measurably raises joint performance. The collective-intelligence “c factor” shows group ability depends on composition and social sensitivity, not just individual IQ. Honest boundary: diversity helps on an inverted-U — too much hurts coordination — so matching is tuned, not maximized.",
    sources: [
      { cite: "Woolley, A. W., Chabris, C. F., Pentland, A., Hashmi, N., & Malone, T. W. (2010). Evidence for a collective intelligence factor in the performance of human groups. Science, 330(6004), 686–688.", note: "The landmark c-factor study: a measurable collective-intelligence factor driven by group composition and social sensitivity, not average member IQ. The basis for strength-to-weakness matching.", link: "https://doi.org/10.1126/science.1193147", kind: "doi" },
      { cite: "Aggarwal, I., Woolley, A. W., Chabris, C. F., & Malone, T. W. (2019). The impact of cognitive style diversity on implicit learning in teams. Frontiers in Psychology, 10, 112.", note: "The necessary caveat: cognitive-style diversity helps collective learning up to a point, then hurts coordination. Matching is tuned, not maximized.", link: "https://doi.org/10.3389/fpsyg.2019.00112", kind: "doi" },
    ],
  },

  // ═══════════════ SECTION 1 — PHYSICAL TRAINING ═══════════════
  {
    id: "p-1a",
    section: "1",
    title: "Strength & Resistance Training",
    subtitle: "Nearest lines: Volitional (downstream of all)",
    evidenceTag: "Strong",
    description:
      "Resistance training is among the most robustly evidenced levers for longevity and daily function, and it builds the volitional follow-through that sits downstream of every other line. Bolsters clusters: body-disconnect, burnout-pattern, imposter-complex. Honest note: mortality findings come from large cohorts — associated with better outcomes, never a guarantee for any one person.",
    sources: [
      { cite: "Shailendra, Boyle et al. (2022). Resistance training and mortality. American Journal of Preventive Medicine.", note: "RT linked to lower all-cause, CVD, and cancer mortality. [Strong]", link: scholar("Shailendra Boyle resistance training mortality American Journal of Preventive Medicine 2022"), kind: "scholar" },
      { cite: "Overview of systematic reviews (2021). Applied Physiology, Nutrition, and Metabolism.", note: "RT associated with lower mortality and improved physical functioning. [Strong]", link: scholar("overview of systematic reviews resistance training mortality functioning Applied Physiology Nutrition Metabolism 2021"), kind: "scholar" },
      { cite: "Weight training and mortality in older adults (2024). International Journal of Epidemiology.", note: "Weight training linked to reduced mortality in older adults. [Strong]", link: scholar("weight training mortality older adults International Journal of Epidemiology 2024"), kind: "scholar" },
      { cite: "Combined resistance + cognitive training review, older adults.", note: "Supports strength, bone density, balance, and fewer falls. [Strong]", link: scholar("combined resistance cognitive training older adults strength bone balance falls review"), kind: "scholar" },
      { cite: "Resistance training and all-cause mortality, NHANES 1999–2006 (PMC11562137).", note: "RT associated with lower all-cause mortality. [Moderate]", link: scholar("resistance training all-cause mortality NHANES 1999-2006 PMC11562137"), kind: "scholar" },
    ],
  },
  {
    id: "p-1b",
    section: "1",
    title: "Brazilian Jiu-Jitsu",
    subtitle: "Nearest lines: Adversarial/Resilient, Volitional, Emotional, Interpersonal",
    evidenceTag: "Moderate",
    description:
      "Grappling under live resistance is a structured way to practice staying regulated under pressure — associated with resilience, confidence, and community. Bolsters clusters: armored-heart, isolation-fortress, emotional-flooding, imposter-complex. Honest note: mostly small or single-arm studies, so read as supportive, not definitive.",
    sources: [
      { cite: "Rank-based psychological characteristics in BJJ athletes (PMC11932194).", note: "Higher belt rank associated with resilience, grit, self-efficacy, life satisfaction. [Moderate]", link: scholar("rank-based psychological characteristics Brazilian Jiu-Jitsu athletes resilience grit PMC11932194"), kind: "scholar" },
      { cite: "Effects of a BJJ session on physiological and hormonal responses (2017).", note: "Documents acute physiological and hormonal load of training. [Moderate]", link: scholar("Brazilian Jiu-Jitsu session physiological hormonal responses 2017"), kind: "scholar" },
      { cite: "Veterans and first responders scoping review (2024). The Sport Journal.", note: "BJJ associated with sustained PTSD-symptom management. [Moderate]", link: scholar("Brazilian Jiu-Jitsu veterans first responders PTSD scoping review The Sport Journal 2024"), kind: "scholar" },
      { cite: "\"From Mat to Mastery\" (2025). European Journal of Sport Sciences.", note: "Linked to higher confidence, lower anxiety, and community belonging. [Moderate]", link: scholar("From Mat to Mastery Brazilian Jiu-Jitsu confidence anxiety community European Journal of Sport Sciences 2025"), kind: "scholar" },
      { cite: "Willing et al. (2019). BJJ and PTSD symptoms.", note: "Large reduction in PTSD symptoms after five months of BJJ. [Moderate]", link: scholar("Willing 2019 Brazilian Jiu-Jitsu PTSD symptoms five months"), kind: "scholar" },
    ],
  },
  {
    id: "p-1c",
    section: "1",
    title: "Yoga",
    subtitle: "Nearest lines: Emotional, Interoceptive",
    evidenceTag: "Strong",
    description:
      "Yoga pairs breath, movement, and attention to the body, with strong meta-analytic support for cardio-metabolic and mood benefits. Bolsters clusters: emotional-flooding, burnout-pattern, body-disconnect.",
    sources: [
      { cite: "Chu et al. (2014). European Journal of Preventive Cardiology.", note: "Meta-analysis of 37 RCTs — cardio-metabolic benefits. [Strong]", link: scholar("Chu 2014 yoga meta-analysis 37 RCTs cardiometabolic European Journal of Preventive Cardiology"), kind: "scholar" },
      { cite: "Cramer et al. (2014). International Journal of Cardiology.", note: "Yoga associated with improved CVD risk factors. [Strong]", link: scholar("Cramer 2014 yoga cardiovascular disease risk factors International Journal of Cardiology"), kind: "scholar" },
      { cite: "Hartley et al. (2014). Cochrane review.", note: "Yoga for primary prevention of CVD. [Strong]", link: scholar("Hartley 2014 Cochrane yoga primary prevention cardiovascular disease"), kind: "scholar" },
      { cite: "Buffart et al. (2012). BMC Cancer.", note: "Lower anxiety, depression, and fatigue; higher quality of life. [Strong]", link: scholar("Buffart 2012 yoga cancer anxiety depression fatigue quality of life BMC Cancer"), kind: "scholar" },
      { cite: "Yoga adjunct for chronic heart failure (2023, PMC10550367).", note: "Associated with improved peak VO2. [Moderate]", link: scholar("yoga adjunct chronic heart failure peak VO2 2023 PMC10550367"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 2 — STRENGTH TRAINING: COGNITIVE & PSYCHOLOGICAL TRANSFER ═══════════════
  {
    id: "p-2",
    section: "2",
    title: "Strength Training — Cognitive & Psychological Transfer",
    subtitle: "Nearest lines: Meta-Cognitive, Logical/Strategic, Volitional, Emotional/Intrapersonal, Adversarial/Resilient",
    evidenceTag: "Moderate",
    description:
      "Beyond the body, structured resistance training is linked to gains in executive function, self-efficacy, and mood. Bolsters clusters: analysis-paralysis, imposter-complex, emotional-flooding, purpose-drift. Honest wrinkle: most evidence shows cognitive/EF gains — not proof — and one 2025 review found no executive-function effect.",
    sources: [
      { cite: "Coelho-Junior / Zhang meta-analyses. Resistance training and executive function.", note: "RT associated with improved executive function. [Moderate]", link: scholar("Coelho-Junior Zhang resistance training executive function meta-analysis"), kind: "scholar" },
      { cite: "Network meta-analysis of 58 RCTs / 4,349 adults (PubMed 40717897).", note: "Greatest global-cognition gain (SMD 0.55); optimal ~2×/week, 45 min, 12 weeks. [Strong]", link: scholar("network meta-analysis 58 RCTs resistance training global cognition SMD 0.55 PubMed 40717897"), kind: "scholar" },
      { cite: "Instability Resistance Training RCT (PMC7018952).", note: "Free-weight instability improved working memory, processing speed, inhibition; machine-based did not. [Moderate]", link: scholar("instability resistance training working memory processing speed inhibition RCT PMC7018952"), kind: "scholar" },
      { cite: "Marinelli et al. (2024). Early Intervention in Psychiatry.", note: "RT linked to lower depression/anxiety and higher self-efficacy. [Moderate]", link: scholar("Marinelli 2024 resistance training depression anxiety self-efficacy Early Intervention in Psychiatry"), kind: "scholar" },
      { cite: "\"Effect of Resistance Training on 'The Self' in Youth.\" Sports Medicine – Open meta-analysis.", note: "Associated with improved physical and global self-worth. [Moderate]", link: scholar("effect of resistance training on the self in youth physical global self-worth Sports Medicine Open meta-analysis"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 3 — SOCIAL CONNECTION ═══════════════
  {
    id: "p-3",
    section: "3",
    title: "Social Connection",
    subtitle: "Nearest lines: Meta-Cognitive, Interpersonal, Emotional, Intrapersonal",
    evidenceTag: "Strong",
    description:
      "Family, long friendships, and tending elderly parents are the research spine of the relationships thesis: strong ties are among the most powerful correlates of survival and slower cognitive decline. Bolsters clusters: isolation-fortress, intimacy-avoidance, armored-heart.",
    sources: [
      { cite: "Holt-Lunstad et al. (2010). PLoS Medicine.", note: "148 studies / 300k+ — strong ties linked to ~50% higher survival. [Strong]", link: scholar("Holt-Lunstad 2010 social relationships mortality meta-analysis PLoS Medicine"), kind: "scholar" },
      { cite: "Social connections & cognition, global IPD meta-analysis (2022). Lancet Healthy Longevity.", note: "Associated with slower cognitive and executive-function decline. [Strong]", link: scholar("social connections cognition global IPD meta-analysis Lancet Healthy Longevity 2022"), kind: "scholar" },
      { cite: "Kuiper et al. (2016). International Journal of Epidemiology.", note: "Poorer social ties predict cognitive decline. [Moderate]", link: scholar("Kuiper 2016 social relationships cognitive decline International Journal of Epidemiology"), kind: "scholar" },
      { cite: "Piolatto et al. (2022). BMC Public Health.", note: "Confirms the social-connection / cognition link. [Moderate]", link: scholar("Piolatto 2022 social connection cognition BMC Public Health"), kind: "scholar" },
      { cite: "Effects of social connection on mood and wellbeing.", note: "Linked to lower depression/anxiety and higher life satisfaction. [Strong]", link: scholar("social connection mood wellbeing depression anxiety life satisfaction"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 4 — CONTEMPLATIVE / NATURE WALKING ═══════════════
  {
    id: "p-4",
    section: "4",
    title: "Contemplative & Nature Walking (Green Exercise)",
    subtitle: "Nearest lines: Meta-Cognitive (attention), Emotional, Interoceptive",
    evidenceTag: "Moderate",
    description:
      "Walking in green space is associated with restored attention and improved mood. Bolsters clusters: burnout-pattern, emotional-flooding, analysis-paralysis, body-disconnect. Dose insight: low-intensity walking improved attention and mood better than jogging, without the added fatigue.",
    sources: [
      { cite: "Green exercise & mental well-being meta-analysis (2025). ScienceDirect (26 studies, 120 effect sizes).", note: "Green exercise linked to better mental well-being. [Moderate]", link: scholar("green exercise mental well-being meta-analysis 26 studies 120 effect sizes 2025"), kind: "scholar" },
      { cite: "Urban green exercise & mental health systematic review + meta-analysis (2026). Frontiers.", note: "Greener settings beat indoor for anxiety, depression, attention. [Moderate]", link: scholar("urban green exercise mental health systematic review meta-analysis Frontiers 2026"), kind: "scholar" },
      { cite: "Attention Restoration Theory (Kaplan; Ohly et al. 2016).", note: "Nature exposure associated with restored directed attention. [Moderate]", link: scholar("Attention Restoration Theory Kaplan Ohly 2016 nature directed attention"), kind: "scholar" },
      { cite: "Nature vs urban walk + working memory, OSPAN field studies (PMC10026564; Pasanen et al. 2018).", note: "Nature walks linked to working-memory gains vs urban. [Emerging]", link: scholar("nature versus urban walk working memory OSPAN Pasanen 2018 PMC10026564"), kind: "scholar" },
      { cite: "Green exercise meta-analysis of controlled trials (2022).", note: "Controlled trials support mood and attention benefits. [Moderate]", link: scholar("green exercise meta-analysis controlled trials 2022 mood attention"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 5 — TRAVEL & NOVEL EXPERIENCES ═══════════════
  {
    id: "p-5",
    section: "5",
    title: "Travel & Novel Experiences",
    subtitle: "Nearest lines: Intrapersonal, Emotional, Existential, Reflective, Philosophical, Adaptive, Meta-Cognitive",
    evidenceTag: "Emerging",
    description:
      "Novelty and psychological richness from travel are associated with well-being and meaning. Bolsters clusters: purpose-drift, perfectionist-prison, shadow-denial. Honest framing: this is the thinnest, most observational batch — read strictly as 'associated with,' leaning on novelty and psychological-richness accounts.",
    sources: [
      { cite: "Vacations & subjective well-being, cross-lagged panel (2019). Journal of Happiness Studies.", note: "Vacations associated with higher subjective well-being. [Moderate]", link: scholar("vacations subjective well-being cross-lagged panel Journal of Happiness Studies 2019"), kind: "scholar" },
      { cite: "Vacations & well-being, integrative review (2023). Journal of Leisure Research.", note: "Reviews the vacation / well-being association. [Moderate]", link: scholar("vacations well-being integrative review Journal of Leisure Research 2023"), kind: "scholar" },
      { cite: "Memorable tourism experiences & life meaning (2026). Frontiers in Psychology.", note: "Psychological richness linked to sense of meaning. [Emerging]", link: scholar("memorable tourism experiences life meaning psychological richness Frontiers in Psychology 2026"), kind: "scholar" },
      { cite: "Novelty in tourism (Broaden-and-Build; Fredrickson).", note: "Novel positive experiences associated with broadened resources. [Emerging]", link: scholar("novelty tourism broaden-and-build Fredrickson positive emotion"), kind: "scholar" },
      { cite: "Travel & cognition in older adults (observational).", note: "Travel associated with cognitive engagement; observational only. [Emerging]", link: scholar("travel cognition older adults observational"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 6 — THERAPY & COUNSELING ═══════════════
  {
    id: "p-6",
    section: "6",
    title: "Therapy & Counseling",
    subtitle: "Nearest lines: Emotional, Meta-Cognitive, Interpersonal, Intimacy",
    evidenceTag: "Strong",
    description:
      "CBT has the deepest evidence for individual anxiety and depression; EFT and systemic therapy are strongest for relationship distress, though modality differences are often small ('common factors'). Bolsters clusters: armored-heart, conflict-avoidance, emotional-flooding, intimacy-avoidance, authority-wound. Founder note: Ken Wilber's personal endorsement of weight training belongs beside the research as lived testimony — never as the research itself.",
    sources: [
      { cite: "Transdiagnostic CBT systematic review + meta-analysis (53 studies / 6,705; PMC10963275).", note: "CBT strongly supports anxiety and depression outcomes. [Strong]", link: scholar("transdiagnostic CBT systematic review meta-analysis 53 studies 6705 PMC10963275"), kind: "scholar" },
      { cite: "Carr (2025). Journal of Family Therapy, 25th-anniversary review.", note: "Couple and systemic therapy effective for relationship distress. [Strong]", link: scholar("Carr 2025 Journal of Family Therapy 25th anniversary review couple systemic effectiveness"), kind: "scholar" },
      { cite: "Spengler et al. (2022). EFT meta-analysis (20 studies / 332 couples).", note: "Emotionally Focused Therapy supports couple outcomes. [Strong]", link: scholar("Spengler 2022 emotionally focused therapy EFT meta-analysis 20 studies 332 couples"), kind: "scholar" },
      { cite: "Meta-analysis of treatment outcomes in couple & family therapy (Springer).", note: "Broad support for couple/family therapy effectiveness. [Strong]", link: scholar("meta-analysis treatment outcomes couple family therapy Springer"), kind: "scholar" },
      { cite: "CBT for specific conditions (bipolar RCT meta-analysis, PMC5417606).", note: "CBT associated with improved outcomes in bipolar disorder. [Moderate]", link: scholar("CBT bipolar disorder RCT meta-analysis PMC5417606"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 7 — LIFESTYLE & CONTEMPLATIVE PRACTICES ═══════════════
  {
    id: "p-7a",
    section: "7",
    title: "Meditation / Mindfulness",
    subtitle: "Nearest lines: Emotional, Intrapersonal, Meta-Cognitive",
    evidenceTag: "Strong",
    description:
      "Structured mindfulness programs are reliably associated with lower depression and better emotion regulation. Bolsters clusters: emotional-flooding, analysis-paralysis, burnout-pattern. Honest note: a minority report adverse effects (Farias et al. 2020) — read as generally beneficial, not universally so.",
    sources: [
      { cite: "MBIs with gratitude systematic review + meta-analysis (30 RCTs, 24,000+). Healthcare (2026).", note: "Mindfulness-based interventions linked to improved wellbeing. [Strong]", link: scholar("mindfulness-based interventions gratitude systematic review meta-analysis 30 RCTs Healthcare 2026"), kind: "scholar" },
      { cite: "Breedvelt et al. (2019). Frontiers in Psychiatry (24 RCTs).", note: "Meditation-based interventions associated with reduced symptoms. [Strong]", link: scholar("Breedvelt 2019 meditation yoga mindfulness Frontiers in Psychiatry 24 RCTs"), kind: "scholar" },
      { cite: "Mindfulness meditation & depression meta-analysis (2024). Scientific Reports.", note: "Meditation linked to lower depression. [Strong]", link: scholar("mindfulness meditation depression meta-analysis Scientific Reports 2024"), kind: "scholar" },
      { cite: "MBIs for coronary patients, RCT meta-analysis (2024). Frontiers.", note: "Associated with improved psychological outcomes in cardiac patients. [Moderate]", link: scholar("mindfulness-based interventions coronary patients RCT meta-analysis Frontiers 2024"), kind: "scholar" },
      { cite: "Meditation & metacognitive beliefs (PMC12192271).", note: "Linked to shifts in metacognitive beliefs. [Moderate]", link: scholar("meditation metacognitive beliefs PMC12192271"), kind: "scholar" },
    ],
  },
  {
    id: "p-7b",
    section: "7",
    title: "Sleep Quality",
    subtitle: "Nearest lines: Emotional, Interoceptive, Meta-Cognitive",
    evidenceTag: "Strong",
    description:
      "Sleep quality is strongly linked to mental health, emotion regulation, and cognition. Bolsters clusters: emotional-flooding, analysis-paralysis, burnout-pattern.",
    sources: [
      { cite: "Sleep quality & mental health meta-analysis (54 papers, 10,196). BMC Public Health (2025).", note: "Better sleep quality associated with better mental health. [Strong]", link: scholar("sleep quality mental health meta-analysis 54 papers BMC Public Health 2025"), kind: "scholar" },
      { cite: "Neurocognitive consequences of sleep restriction, meta-analytic review. Neuroscience & Biobehavioral Reviews.", note: "Sleep restriction linked to neurocognitive deficits. [Strong]", link: scholar("neurocognitive consequences sleep restriction meta-analytic review Neuroscience Biobehavioral Reviews"), kind: "scholar" },
      { cite: "Non-pharmacological sleep interventions in MCI, systematic review + meta-analysis (2025).", note: "Sleep interventions associated with cognitive benefit in MCI. [Moderate]", link: scholar("non-pharmacological sleep interventions mild cognitive impairment systematic review meta-analysis 2025"), kind: "scholar" },
      { cite: "Bubu et al. meta-analysis. Sleep disorders and cognitive impairment.", note: "Sleep disorders linked to ~1.68× cognitive-impairment risk. [Strong]", link: scholar("Bubu sleep disorders cognitive impairment Alzheimer risk meta-analysis"), kind: "scholar" },
      { cite: "Sleep & neural circuitry of emotion regulation (PMC3542038).", note: "Sleep loss associated with weaker emotion regulation. [Moderate]", link: scholar("sleep neural circuitry emotion regulation PMC3542038"), kind: "scholar" },
    ],
  },
  {
    id: "p-7c",
    section: "7",
    title: "Nutrition / Diet Quality",
    subtitle: "Nearest lines: Emotional, Interoceptive",
    evidenceTag: "Strong",
    description:
      "Better diet quality is strongly associated with improved mood in people who have depression. Bolsters clusters: body-disconnect, burnout-pattern, emotional-flooding. Honest note: prevention RCTs found no clear effect on onset — diet supports mood, it does not 'prevent depression.'",
    sources: [
      { cite: "Diet quality & depression systematic review + meta-analysis (21 RCTs + 92 cohorts, >700,000). Journal of Affective Disorders (2025).", note: "Higher diet quality associated with lower depression. [Strong]", link: scholar("diet quality depression systematic review meta-analysis 21 RCTs 92 cohorts Journal of Affective Disorders 2025"), kind: "scholar" },
      { cite: "Dietary interventions for depression & anxiety (2025). Annals of Internal Medicine.", note: "Dietary change associated with improved depression/anxiety. [Strong]", link: scholar("dietary interventions depression anxiety Annals of Internal Medicine 2025"), kind: "scholar" },
      { cite: "SMILES trial (Jacka et al. 2017). BMC Medicine.", note: "First RCT — Mediterranean diet improved depression. [Strong]", link: scholar("SMILES trial Jacka 2017 Mediterranean diet depression BMC Medicine"), kind: "scholar" },
      { cite: "HELFIMED (Parletta et al. 2019). Nutritional Neuroscience.", note: "Mediterranean diet + fish oil linked to improved mood. [Moderate]", link: scholar("HELFIMED Parletta 2019 Mediterranean diet mental health Nutritional Neuroscience"), kind: "scholar" },
      { cite: "Mediterranean-diet RCT (PMC10587518).", note: "Associated with improved depressive symptoms. [Moderate]", link: scholar("Mediterranean diet RCT depression PMC10587518"), kind: "scholar" },
    ],
  },
  {
    id: "p-7d",
    section: "7",
    title: "Service / Volunteering",
    subtitle: "Nearest lines: Interpersonal, Existential",
    evidenceTag: "Moderate",
    description:
      "Volunteering is associated with lower mortality and greater wellbeing and purpose. Bolsters clusters: isolation-fortress, purpose-drift, armored-heart. Honest note: these findings are observational — associated with, not causes.",
    sources: [
      { cite: "Jenkinson et al. (2013). BMC Public Health (40 papers).", note: "Volunteering linked to ~22% lower mortality. [Moderate]", link: scholar("Jenkinson 2013 volunteering health mortality BMC Public Health 40 papers"), kind: "scholar" },
      { cite: "Okun et al. (2013). Meta-analysis (14 studies).", note: "Volunteering associated with reduced mortality risk. [Moderate]", link: scholar("Okun 2013 volunteering mortality meta-analysis 14 studies"), kind: "scholar" },
      { cite: "Casiday et al. Systematic review (87 papers).", note: "Reviews volunteering / health associations. [Moderate]", link: scholar("Casiday volunteering health systematic review 87 papers"), kind: "scholar" },
      { cite: "Volunteering & mortality, partner-controlled quasi-experiment (2017). International Journal of Epidemiology.", note: "Quasi-experimental support for the mortality link. [Moderate]", link: scholar("volunteering mortality partner-controlled quasi-experimental International Journal of Epidemiology 2017"), kind: "scholar" },
      { cite: "Purpose-in-life & mortality meta-analysis.", note: "Sense of purpose associated with lower mortality. [Moderate]", link: scholar("purpose in life mortality meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "p-7e",
    section: "7",
    title: "Journaling / Expressive Writing",
    subtitle: "Nearest lines: Intrapersonal, Reflective, Emotional",
    evidenceTag: "Moderate",
    description:
      "Expressive writing can help process emotion and support reflection. Bolsters clusters: shadow-denial, emotional-flooding, analysis-paralysis. Honest note: real but inconsistent — roughly three meta-analyses find benefit and three find null; it depends on genuine engagement, so 'can help,' not 'will.'",
    sources: [
      { cite: "Pavlacic et al. (2019). Review of General Psychology.", note: "Expressive writing associated with modest benefits. [Moderate]", link: scholar("Pavlacic 2019 expressive writing meta-analysis Review of General Psychology"), kind: "scholar" },
      { cite: "Smyth (1998). Journal of Consulting & Clinical Psychology (13 studies, d=0.47).", note: "Moderate average benefit across studies. [Moderate]", link: scholar("Smyth 1998 written emotional expression meta-analysis Journal of Consulting Clinical Psychology"), kind: "scholar" },
      { cite: "Frattaroli (2006). Psychological Bulletin.", note: "Small but reliable expressive-writing effects. [Moderate]", link: scholar("Frattaroli 2006 experimental disclosure meta-analysis Psychological Bulletin"), kind: "scholar" },
      { cite: "Harris (2006). Journal of Consulting & Clinical Psychology.", note: "Mixed effects on health-care utilization. [Moderate]", link: scholar("Harris 2006 expressive writing health care utilization Journal of Consulting Clinical Psychology"), kind: "scholar" },
      { cite: "Lai & Wang (2023). Systematic review + meta-analysis.", note: "Supports modest expressive-writing benefits. [Moderate]", link: scholar("Lai Wang 2023 expressive writing systematic review meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "p-7f",
    section: "7",
    title: "Music Practice",
    subtitle: "Nearest lines: Meta-Cognitive, Logical, Musical",
    evidenceTag: "Moderate",
    description:
      "Instrument training is associated with small gains in executive function and fluid cognition. Bolsters clusters: analysis-paralysis, imposter-complex. Honest note: benefits are real but small, and some earlier claims reflect confounds (Sala & Gobet).",
    sources: [
      { cite: "Musical instrument training & fluid intelligence/EF in older adults, meta-analysis (13 studies, N=502). Neuropsychologia (2024).", note: "Linked to modest EF and fluid-intelligence gains. [Moderate]", link: scholar("musical instrument training fluid intelligence executive function older adults meta-analysis Neuropsychologia 2024"), kind: "scholar" },
      { cite: "Music-based interventions & cognition, meta-analysis (2025).", note: "Associated with small cognitive benefits. [Moderate]", link: scholar("music-based interventions cognition meta-analysis 2025"), kind: "scholar" },
      { cite: "Music training & EF in children 3–12, three-level meta-analysis (46 studies). Frontiers (2025), g=0.35.", note: "Small-to-moderate EF association in children. [Moderate]", link: scholar("music training executive function children three-level meta-analysis 46 studies Frontiers 2025"), kind: "scholar" },
      { cite: "Music training & EF in preschoolers, systematic review + meta-analysis.", note: "Supports small EF benefit in preschoolers. [Moderate]", link: scholar("music training executive function preschoolers systematic review meta-analysis"), kind: "scholar" },
      { cite: "Sala & Gobet (2017). Meta-analysis (38 studies).", note: "Small effect; benefits shrink once confounds are controlled. [Counter-evidence]", link: scholar("Sala Gobet 2017 music training cognitive far transfer meta-analysis 38 studies"), kind: "scholar" },
    ],
  },
  {
    id: "p-7g",
    section: "7",
    title: "Faith / Spiritual Community",
    subtitle: "Nearest lines: Existential, Interpersonal, Intrapersonal",
    evidenceTag: "Strong",
    description:
      "Regular participation in a faith community is associated with lower mortality and depression — driven largely by the communal/social dimension. Bolsters clusters: isolation-fortress, purpose-drift, intimacy-avoidance. Honest note: present as community plus meaning, not a health prescription.",
    sources: [
      { cite: "VanderWeele, meta-analytic estimates. American Journal of Epidemiology commentary (2022).", note: "Weekly attendance linked to ~27% lower mortality, ~33% lower depression. [Strong]", link: scholar("VanderWeele religious service attendance mortality depression American Journal of Epidemiology 2022"), kind: "scholar" },
      { cite: "Li et al. (2016). JAMA Internal Medicine, Nurses' Health Study (n=74,534).", note: "Service attendance associated with 33% lower mortality. [Strong]", link: scholar("Li 2016 religious service attendance mortality Nurses Health Study JAMA Internal Medicine"), kind: "scholar" },
      { cite: "Chida et al. (2009). Systematic quantitative review.", note: "Religiosity/spirituality associated with lower mortality. [Moderate]", link: scholar("Chida 2009 religiosity spirituality mortality systematic quantitative review"), kind: "scholar" },
      { cite: "Religiosity/spirituality & mortality meta-analysis (69 studies), HR=0.82.", note: "Associated with reduced mortality risk. [Moderate]", link: scholar("religiosity spirituality mortality meta-analysis 69 studies hazard ratio 0.82"), kind: "scholar" },
      { cite: "Religion/spirituality & life satisfaction meta-analysis (2022).", note: "Linked to higher life satisfaction. [Moderate]", link: scholar("religion spirituality life satisfaction meta-analysis 2022"), kind: "scholar" },
    ],
  },
  {
    id: "p-7h",
    section: "7",
    title: "Strategic Games (Chess)",
    subtitle: "Nearest lines: Strategic, Logical, Meta-Cognitive (near-transfer skill, not proven general uplift)",
    evidenceTag: "Mixed",
    description:
      "Chess builds near-transfer skill, but chess players are smarter on average mostly by selection, not because chess makes them smarter — broad transfer is weak and contested. Bolsters clusters: analysis-paralysis (double-edged), imposter-complex. Honest headline: present as skill-building, never as a general intelligence boost.",
    sources: [
      { cite: "Sala & Gobet (2016). Educational Research Review, meta-analysis (24 studies).", note: "Modest math (d=0.38) and cognitive (d=0.34) gains; ~25–30h minimum. [Moderate]", link: scholar("Sala Gobet 2016 chess instruction meta-analysis Educational Research Review"), kind: "scholar" },
      { cite: "Sala & Gobet (2017). Current Directions, \"Does Far Transfer Exist?\"", note: "Effects shrink with better study design. [Strong counter-evidence]", link: scholar("Sala Gobet 2017 does far transfer exist Current Directions Psychological Science"), kind: "scholar" },
      { cite: "Burgoyne et al. (2016). Intelligence, meta-analysis (19 studies).", note: "Ability↔chess correlation largely reflects selection. [Strong]", link: scholar("Burgoyne 2016 relationship cognitive ability chess skill meta-analysis Intelligence"), kind: "scholar" },
      { cite: "Sala & Gobet (2017). Frontiers in Psychology review.", note: "Far transfer 'rarely, minimal.' [Strong]", link: scholar("Sala Gobet 2017 far transfer chess music working memory Frontiers in Psychology"), kind: "scholar" },
      { cite: "Chess training & metacognition (ERIC ED608753).", note: "Metacognition effects 'weak and contradictory.' [Mixed]", link: scholar("chess training metacognition ERIC ED608753"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 8 — KEN WILBER'S INTEGRAL LIFE PRACTICE ═══════════════
  {
    id: "p-8a",
    section: "8",
    title: "Shadow Work (3-2-1 Process)",
    subtitle: "Nearest lines: Intrapersonal, Reflective",
    evidenceTag: "Emerging",
    description:
      "The 3-2-1 shadow process maps onto evidence-based psychotherapy (§6) and expressive writing (§7E); the technique itself is not independently validated. Bolsters clusters: shadow-denial, armored-heart. Honest note: Integral Theory is not a validated clinical intervention — cite the disciplines it integrates, not the meta-framework.",
    sources: [
      { cite: "3-2-1 Shadow Process (Integral Life Practice) — maps to psychotherapy (§6) and expressive writing (§7E).", note: "The 3-2-1 technique itself is not independently validated. [Honest]", link: scholar("3-2-1 shadow process Integral Life Practice Wilber shadow work"), kind: "scholar" },
    ],
  },
  {
    id: "p-8b",
    section: "8",
    title: "Loving-Kindness / Compassion Meditation",
    subtitle: "Nearest lines: Empathic, Interpersonal, Emotional",
    evidenceTag: "Moderate",
    description:
      "Loving-kindness and compassion practice is associated with reduced depression and greater empathy/prosociality. Bolsters clusters: armored-heart, intimacy-avoidance. Honest note: effects are real but modest and tend to shrink under RCT conditions.",
    sources: [
      { cite: "Galante et al. (2014). Kindness-based meditation RCT meta-analysis.", note: "Depression g = −0.61 across trials. [Moderate]", link: scholar("Galante 2014 kindness-based meditation RCT meta-analysis depression"), kind: "scholar" },
      { cite: "Gu et al. (2022). Applied Psychology: Health & Well-Being (23 studies).", note: "Compassion practice linked to improved wellbeing. [Moderate]", link: scholar("Gu 2022 loving-kindness compassion meditation Applied Psychology Health Well-Being 23 studies"), kind: "scholar" },
      { cite: "Meditation & empathy/prosocial, systematic review + meta-analysis (26 RCTs, 1,714).", note: "Associated with higher empathy and prosocial behavior. [Moderate]", link: scholar("meditation empathy prosocial systematic review meta-analysis 26 RCTs 1714"), kind: "scholar" },
      { cite: "Loving-kindness interventions & mental health, systematic review + meta-analysis (2024).", note: "Linked to improved mental-health outcomes. [Moderate]", link: scholar("loving-kindness interventions mental health systematic review meta-analysis 2024"), kind: "scholar" },
      { cite: "LKCM in the workplace, meta-analysis (21 trials, 2023).", note: "Workplace loving-kindness/compassion associated with benefit. [Moderate]", link: scholar("loving-kindness compassion meditation workplace meta-analysis 21 trials 2023"), kind: "scholar" },
    ],
  },
  {
    id: "p-8c",
    section: "8",
    title: "Qigong / Tai Chi",
    subtitle: "Nearest lines: Interoceptive, Kinesthetic, Emotional, Meta-Cognitive",
    evidenceTag: "Strong",
    description:
      "Tai Chi and Qigong show solid measured benefits for balance, mood, and cognition. Bolsters clusters: body-disconnect, emotional-flooding, burnout-pattern. Honest note: the 'subtle energy/qi' theory is not scientifically established — present the measured benefits, not the metaphysics.",
    sources: [
      { cite: "Tai Chi & Qigong, cognitive + physical function in older adults, systematic review + meta-analysis + meta-regression (PMC10242998).", note: "Associated with improved cognition and physical function. [Strong]", link: scholar("Tai Chi Qigong cognitive physical function older adults systematic review meta-analysis meta-regression PMC10242998"), kind: "scholar" },
      { cite: "Tai Chi & Qigong for anxiety/depression in older adults (2025).", note: "Linked to lower anxiety and depression. [Moderate]", link: scholar("Tai Chi Qigong anxiety depression older adults 2025"), kind: "scholar" },
      { cite: "Tai Chi for elderly depression, RCT meta-analysis. Frontiers (2024).", note: "Associated with reduced depression in elderly. [Moderate]", link: scholar("Tai Chi elderly depression RCT meta-analysis Frontiers 2024"), kind: "scholar" },
      { cite: "Yin & Dishman (2014) / Wang et al. (2014). Meta-analyses.", note: "Support mood and psychological benefits. [Moderate]", link: scholar("Yin Dishman 2014 Wang 2014 Tai Chi Qigong psychological wellbeing meta-analysis"), kind: "scholar" },
      { cite: "Evidence map of Tai Chi/Qigong — 116 systematic reviews / 44 meta-analyses.", note: "Broad evidence base for measured benefits. [Strong]", link: scholar("evidence map Tai Chi Qigong 116 systematic reviews 44 meta-analyses"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 9 — PHYSIOLOGICAL & MICRO-PRACTICES ═══════════════
  {
    id: "p-9a",
    section: "9",
    title: "Breathwork / Slow-Paced Breathing",
    subtitle: "Nearest lines: Interoceptive, Emotional, Meta-Cognitive",
    evidenceTag: "Moderate",
    description:
      "Slow-paced breathing is an immediate down-regulator, associated with lower stress and anxiety. Bolsters clusters: emotional-flooding, burnout-pattern. Honest note: effects are small-to-medium and heterogeneous — a fast regulator, not a cure.",
    sources: [
      { cite: "Fincham et al. (2023). Scientific Reports, RCT meta-analysis (12 studies, 785).", note: "Stress g = −0.35, anxiety −0.32, depression −0.40. [Moderate]", link: scholar("Fincham 2023 breathwork RCT meta-analysis stress anxiety depression Scientific Reports"), kind: "scholar" },
      { cite: "Zaccaro et al. Slow breathing (~6 bpm), systematic review + meta-analysis.", note: "Slow breathing associated with autonomic/affective benefits. [Moderate]", link: scholar("Zaccaro slow breathing 6 breaths per minute systematic review meta-analysis"), kind: "scholar" },
      { cite: "Slow breathing & anxiety regulation. Scientific Reports (2025).", note: "Linked to improved anxiety regulation. [Moderate]", link: scholar("slow breathing anxiety regulation Scientific Reports 2025"), kind: "scholar" },
      { cite: "HRV biofeedback slow-breathing RCT (PMC3464298).", note: "Associated with improved stress physiology. [Moderate]", link: scholar("heart rate variability biofeedback slow breathing RCT PMC3464298"), kind: "scholar" },
      { cite: "Extended-exhale breathing dosing RCT (Vanderbilt).", note: "Extended-exhale breathing linked to calming effects. [Moderate]", link: scholar("extended exhale breathing dosing RCT Vanderbilt"), kind: "scholar" },
    ],
  },
  {
    id: "p-9b",
    section: "9",
    title: "Gratitude Practice",
    subtitle: "Nearest lines: Intrapersonal, Emotional, Existential",
    evidenceTag: "Moderate",
    description:
      "Gratitude practice reliably gives a small boost to positive affect. Bolsters clusters: purpose-drift, emotional-flooding. Honest note: weaker on clinical depression and anxiety — it lifts mood, it does not 'treat depression.'",
    sources: [
      { cite: "Kirca et al. (2023). International Journal of Applied Positive Psychology, meta-analysis (25 RCTs, 6,745), g=0.22.", note: "Small reliable boost to wellbeing. [Moderate]", link: scholar("Kirca 2023 gratitude interventions meta-analysis International Journal of Applied Positive Psychology"), kind: "scholar" },
      { cite: "Cross-cultural meta-analysis. PNAS (2025), 145 studies / 28 countries.", note: "Gratitude linked to wellbeing across cultures. [Strong]", link: scholar("gratitude cross-cultural meta-analysis PNAS 2025 145 studies 28 countries"), kind: "scholar" },
      { cite: "Gratitude interventions, systematic review + meta-analysis (64 RCTs, 2023).", note: "Associated with improved positive affect. [Moderate]", link: scholar("gratitude interventions systematic review meta-analysis 64 RCTs 2023"), kind: "scholar" },
      { cite: "Cregg & Cheavens (2021). Meta-analysis (27 studies).", note: "Limited effects on depression/anxiety. [Counter-evidence]", link: scholar("Cregg Cheavens 2021 gratitude depression anxiety meta-analysis 27 studies"), kind: "scholar" },
      { cite: "Dickens (2017). Meta-analysis (38 studies).", note: "Gratitude associated with modest wellbeing gains. [Moderate]", link: scholar("Dickens 2017 gratitude interventions meta-analysis 38 studies"), kind: "scholar" },
    ],
  },
  {
    id: "p-9c",
    section: "9",
    title: "Sunlight / Circadian Light",
    subtitle: "Nearest lines: Emotional, Interoceptive, Meta-Cognitive (via sleep)",
    evidenceTag: "Strong",
    description:
      "Light therapy is best established for seasonal depression, with nonseasonal evidence strengthening recently (JAMA 2024). Bolsters clusters: burnout-pattern, emotional-flooding, body-disconnect.",
    sources: [
      { cite: "Golden et al. (2005). American Journal of Psychiatry, meta-analysis.", note: "Seasonal ES 0.84, nonseasonal 0.53. [Strong]", link: scholar("Golden 2005 light therapy mood disorders meta-analysis American Journal of Psychiatry"), kind: "scholar" },
      { cite: "Menegaz de Almeida et al. (2024). JAMA Psychiatry.", note: "Light therapy ~41% vs 23% remission. [Strong]", link: scholar("Menegaz de Almeida 2024 light therapy depression JAMA Psychiatry remission"), kind: "scholar" },
      { cite: "Circadian light-dose meta-analysis (31 articles, 1,031; 2024).", note: "Associated with circadian and mood benefits. [Moderate]", link: scholar("circadian light dose meta-analysis 31 articles 2024"), kind: "scholar" },
      { cite: "Light therapy in older adults, meta-analysis (2024).", note: "Linked to improved mood in older adults. [Moderate]", link: scholar("light therapy older adults meta-analysis 2024"), kind: "scholar" },
      { cite: "Light therapy nonseasonal update, meta-analysis (2020).", note: "Supports nonseasonal depression benefit. [Moderate]", link: scholar("light therapy nonseasonal depression update meta-analysis 2020"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 10 — RISK FACTORS & SUPPRESSORS ═══════════════
  {
    id: "p-10a",
    section: "10",
    title: "Alcohol Use Disorder",
    subtitle: "Nearest lines: Meta-Cognitive, Logical, Volitional",
    evidenceTag: "Strong",
    callout:
      "Risk factors are associated with worse outcomes — NOT proof they lower your lines, and never a prediction of any individual's decline. Three rules govern this whole section: (1) associations are often bidirectional and confounded; (2) many effects are partly reversible; (3) these are risks to watch and recover from, never fear-based selling.",
    description:
      "Alcohol use disorder is linked to real cognitive deficits. Bolsters (as a risk to recover from) clusters: analysis-paralysis, emotional-flooding, body-disconnect. Honest note: deficits are real but largely recover within 6–12 months of abstinence.",
    sources: [
      { cite: "Stavro et al. (2013). Addiction Biology (62 studies).", note: "AUD linked to cognitive deficits that recover over time. [Strong]", link: scholar("Stavro 2013 alcohol use disorder cognition recovery Addiction Biology 62 studies"), kind: "scholar" },
      { cite: "Recovery of neuropsychological function after abstinence (2024). PLOS One (16 studies).", note: "Function largely recovers with sustained abstinence. [Strong]", link: scholar("recovery neuropsychological function alcohol abstinence PLOS One 2024 16 studies"), kind: "scholar" },
      { cite: "Le Berre et al. (2017). Executive function in AUD.", note: "AUD associated with executive-function impairment. [Strong]", link: scholar("Le Berre 2017 executive function alcohol use disorder"), kind: "scholar" },
      { cite: "Executive dysfunction in AUD (PMC9573267).", note: "Documents executive deficits in AUD. [Moderate]", link: scholar("executive dysfunction alcohol use disorder PMC9573267"), kind: "scholar" },
      { cite: "Cognitive impairments in alcohol-dependent subjects. Frontiers (2014).", note: "Associated with broad cognitive impairment. [Moderate]", link: scholar("cognitive impairments alcohol-dependent subjects Frontiers 2014"), kind: "scholar" },
    ],
  },
  {
    id: "p-10b",
    section: "10",
    title: "Tobacco / Smoking",
    subtitle: "Nearest lines: Meta-Cognitive, Logical",
    evidenceTag: "Strong",
    description:
      "Smoking is linked to elevated dementia and cognitive risk, dose-dependently. Bolsters (as a risk to recover from) clusters: body-disconnect, burnout-pattern. Honest note: risk is elevated in current smokers; former smokers are not clearly elevated — quitting returns risk toward baseline.",
    sources: [
      { cite: "Anstey et al. (2007). American Journal of Epidemiology.", note: "Smoking linked to RR 1.79 for Alzheimer's. [Strong]", link: scholar("Anstey 2007 smoking dementia Alzheimer risk American Journal of Epidemiology"), kind: "scholar" },
      { cite: "Zhong et al. (2015). PLOS One.", note: "Smoking associated with higher dementia risk. [Strong]", link: scholar("Zhong 2015 smoking dementia risk meta-analysis PLOS One"), kind: "scholar" },
      { cite: "WHO evidence profile (37 studies).", note: "RR 1.30; +34% per 20 cigarettes/day. [Strong]", link: scholar("WHO evidence profile smoking dementia risk 37 studies"), kind: "scholar" },
      { cite: "Peters et al. (2008). BMC Geriatrics.", note: "Smoking associated with cognitive decline. [Moderate]", link: scholar("Peters 2008 smoking cognitive decline dementia BMC Geriatrics"), kind: "scholar" },
      { cite: "Memory under siege review (2024).", note: "Reviews smoking / cognition associations. [Moderate]", link: scholar("memory under siege smoking cognition review 2024"), kind: "scholar" },
    ],
  },
  {
    id: "p-10c",
    section: "10",
    title: "Vaping / E-Cigarettes",
    subtitle: "Nearest lines: Meta-Cognitive",
    evidenceTag: "Emerging",
    description:
      "Early evidence links vaping to cognitive concerns, but the literature is limited. Bolsters (as a risk to watch) cluster: body-disconnect. Honest note: emerging and limited — do not present as settled.",
    sources: [
      { cite: "E-cigarettes & cognition / dementia risk. Scientific Reports (2026).", note: "Preliminary link to cognitive concerns. [Emerging]", link: scholar("e-cigarettes cognition dementia risk Scientific Reports 2026"), kind: "scholar" },
      { cite: "E-cigarettes & cognitive function, scoping review. Psychopharmacology (2024).", note: "Limited, mixed evidence. [Emerging]", link: scholar("e-cigarettes cognitive function scoping review Psychopharmacology 2024"), kind: "scholar" },
      { cite: "ENDS & blood-brain barrier (PMC7863131).", note: "Mechanistic, preliminary evidence. [Emerging]", link: scholar("electronic nicotine delivery systems blood-brain barrier PMC7863131"), kind: "scholar" },
    ],
  },
  {
    id: "p-10d",
    section: "10",
    title: "Other Drugs / Chemical Dependency",
    subtitle: "Nearest lines: Meta-Cognitive, Logical, Volitional",
    evidenceTag: "Moderate",
    description:
      "Substance dependence is linked to cognitive and decision-making deficits, which are substance-specific. Bolsters (as a risk to recover from) clusters: analysis-paralysis, imposter-complex. Honest note: partly reversible with abstinence.",
    sources: [
      { cite: "Verdejo-García & Rubenis (2020) / Ersche et al.", note: "Substance use associated with cognitive/decision deficits. [Moderate]", link: scholar("Verdejo-Garcia Rubenis 2020 Ersche substance use cognition decision-making"), kind: "scholar" },
      { cite: "Verbal memory in substance-use & gambling addictions. Frontiers (2026, N=515).", note: "Linked to verbal-memory deficits. [Moderate]", link: scholar("verbal memory substance use gambling addictions Frontiers 2026 N=515"), kind: "scholar" },
      { cite: "Review of gambling & SUD (PMC4803266).", note: "Shared cognitive features across addictions. [Moderate]", link: scholar("gambling substance use disorder review PMC4803266"), kind: "scholar" },
      { cite: "Decision-making across SUD/GD/obesity (Iowa Gambling Task).", note: "Associated with impaired decision-making. [Moderate]", link: scholar("decision-making substance use disorder gambling obesity Iowa Gambling Task"), kind: "scholar" },
      { cite: "Pharmacological interventions for decision-making in addictions, review.", note: "Reviews reversibility of decision deficits. [Moderate]", link: scholar("pharmacological interventions decision-making addictions review"), kind: "scholar" },
    ],
  },
  {
    id: "p-10e",
    section: "10",
    title: "Gambling Disorder",
    subtitle: "Nearest lines: Meta-Cognitive, Volitional, Logical",
    evidenceTag: "Strong",
    description:
      "Gambling disorder is linked to impaired decision-making and impulse control. Bolsters (as a risk to recover from) clusters: analysis-paralysis, imposter-complex.",
    sources: [
      { cite: "Ioannidis et al. (2019). Neuropsychopharmacology, meta-analysis.", note: "Cognitive deficits g = 0.39–0.66. [Strong]", link: scholar("Ioannidis 2019 gambling disorder cognition meta-analysis Neuropsychopharmacology"), kind: "scholar" },
      { cite: "Grant et al. (2011).", note: "Associated with impulse-control and cognitive deficits. [Moderate]", link: scholar("Grant 2011 pathological gambling cognition impulsivity"), kind: "scholar" },
      { cite: "Decision-making across SUD/GD/obesity (Iowa Gambling Task).", note: "Linked to impaired decision-making. [Moderate]", link: scholar("decision-making gambling disorder Iowa Gambling Task"), kind: "scholar" },
      { cite: "Cambridge Gambling Task in disordered gambling.", note: "Associated with risky decision-making. [Moderate]", link: scholar("Cambridge Gambling Task disordered gambling"), kind: "scholar" },
      { cite: "Verbal memory in gambling / SUD. Frontiers (2026).", note: "Linked to verbal-memory deficits. [Moderate]", link: scholar("verbal memory gambling substance use disorder Frontiers 2026"), kind: "scholar" },
    ],
  },
  {
    id: "p-10f",
    section: "10",
    title: "Problematic Pornography Use",
    subtitle: "Nearest lines: Volitional, Emotional, Intimacy",
    evidenceTag: "Moderate",
    description:
      "Harm here is tied to problematic USE — distress and compulsivity — not to frequency, and is often maladaptive coping for pre-existing distress. Bolsters (as a risk to watch) clusters: intimacy-avoidance, shadow-denial, pleasure-numbing. Honest note (critical): genuinely contested; there is no DSM-5 'porn addiction,' neuroimaging is inconsistent, and we do not endorse 'no-fap' claims.",
    sources: [
      { cite: "Psychotherapy for PPU, comprehensive meta-analysis (2025, 20 studies, 2,021).", note: "Therapy associated with reduced distress from problematic use. [Moderate]", link: scholar("psychotherapy problematic pornography use comprehensive meta-analysis 2025 20 studies"), kind: "scholar" },
      { cite: "PPU, impulsivity & sensation-seeking, meta-analysis. Journal of Sexual Medicine (2024).", note: "Linked to impulsivity and sensation-seeking. [Moderate]", link: scholar("problematic pornography use impulsivity sensation seeking meta-analysis Journal of Sexual Medicine 2024"), kind: "scholar" },
      { cite: "PPU & mental health, systematic review (2024).", note: "Associated with distress in problematic users. [Moderate]", link: scholar("problematic pornography use mental health systematic review 2024"), kind: "scholar" },
      { cite: "Neuroimaging of compulsive sexual behavior / PPU, coordinate-based synthesis.", note: "Neuroimaging inconsistent and contested. [Emerging/contested]", link: scholar("neuroimaging compulsive sexual behavior problematic pornography use coordinate-based meta-analysis"), kind: "scholar" },
      { cite: "Lived-experience study. Scientific Reports (2023).", note: "Qualitative account of problematic-use distress. [Emerging]", link: scholar("problematic pornography use lived experience Scientific Reports 2023"), kind: "scholar" },
    ],
  },
  {
    id: "p-10g",
    section: "10",
    title: "Problematic Social Media / Scrolling",
    subtitle: "Nearest lines: Meta-Cognitive (attention), Emotional, Intrapersonal",
    evidenceTag: "Moderate",
    description:
      "It's problematic USE and social comparison — not raw screen time — that links to distress, and the relationship is bidirectional. Bolsters (as a risk to watch) clusters: emotional-flooding, isolation-fortress, imposter-complex. Honest note: abstinence experiments show real benefit; objective screen-time effects are weak.",
    sources: [
      { cite: "Shannon et al. (2022). JMIR Mental Health (18 studies, 9,269).", note: "Problematic use associated with worse mental health. [Moderate]", link: scholar("Shannon 2022 problematic social media use mental health JMIR Mental Health"), kind: "scholar" },
      { cite: "Problematic social-media use & depression/anxiety, systematic review (2022).", note: "Linked to depression and anxiety. [Moderate]", link: scholar("problematic social media use depression anxiety systematic review 2022"), kind: "scholar" },
      { cite: "Social comparison & mental health, meta-analysis (98 studies, 102,683).", note: "Upward social comparison associated with worse mood. [Strong]", link: scholar("social comparison mental health meta-analysis 98 studies 102683"), kind: "scholar" },
      { cite: "Objective screen-time & distress (PMC9671480).", note: "Screen time itself weak/near-null. [Counter-evidence]", link: scholar("objective screen time psychological distress PMC9671480"), kind: "scholar" },
      { cite: "14-day social-media abstinence RCTs.", note: "Brief abstinence associated with mood benefit. [Moderate]", link: scholar("14-day social media abstinence RCT wellbeing"), kind: "scholar" },
    ],
  },
  {
    id: "p-10h",
    section: "10",
    title: "Overeating / Ultra-Processed Diet",
    subtitle: "Nearest lines: Emotional, Meta-Cognitive, Interoceptive",
    evidenceTag: "Strong",
    description:
      "Ultra-processed diets are strongly associated with depression and faster cognitive decline. Bolsters (as a risk to recover from) clusters: body-disconnect, burnout-pattern, emotional-flooding. Honest note: the association is strong but observational.",
    sources: [
      { cite: "Lane et al. (2022). Nutrients (17 studies, >380,000).", note: "UPF linked to depression. [Strong]", link: scholar("Lane 2022 ultra-processed food depression Nutrients 17 studies"), kind: "scholar" },
      { cite: "BMJ umbrella review (2024, 45 analyses).", note: "UPF associated with multiple adverse outcomes. [Strong]", link: scholar("ultra-processed food umbrella review BMJ 2024 45 analyses"), kind: "scholar" },
      { cite: "UPF & cognition.", note: "Associated with ~28% faster global cognitive decline. [Moderate]", link: scholar("ultra-processed food cognitive decline 28 percent faster"), kind: "scholar" },
      { cite: "UPF & cognitive domains in older adults (PMC12850515).", note: "Linked to poorer cognitive domains. [Moderate]", link: scholar("ultra-processed food cognitive domains older adults PMC12850515"), kind: "scholar" },
      { cite: "UPF & health status, systematic review + meta-analysis.", note: "Associated with worse health status. [Moderate]", link: scholar("ultra-processed food health status systematic review meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "p-10i",
    section: "10",
    title: "Divorce / Separation (and Marital Conflict)",
    subtitle: "Nearest lines: Emotional, Interpersonal, Intrapersonal",
    evidenceTag: "Strong",
    description:
      "Divorce and marital conflict are linked to elevated distress and mortality risk. Bolsters (as a risk to recover from) clusters: emotional-flooding, intimacy-avoidance, armored-heart. Honest note: the risk is real but the majority recover, and elevated depression concentrates among those with prior depression.",
    sources: [
      { cite: "Sbarra, Law & Portley (2011). Perspectives on Psychological Science (32 studies, 6.5M).", note: "Divorce associated with distress; most recover. [Strong]", link: scholar("Sbarra Law Portley 2011 divorce depression Perspectives on Psychological Science"), kind: "scholar" },
      { cite: "Shor et al. (2012). Social Science & Medicine (104 studies, 600M), HR 1.30.", note: "Marital dissolution linked to higher mortality. [Strong]", link: scholar("Shor 2012 marital dissolution mortality Social Science Medicine 104 studies"), kind: "scholar" },
      { cite: "Sbarra (2015). Current Directions.", note: "~23% higher mortality; most are resilient. [Strong]", link: scholar("Sbarra 2015 divorce health mortality resilience Current Directions"), kind: "scholar" },
      { cite: "Hald et al. (2020). RCT.", note: "Divorce intervention associated with reduced distress. [Moderate]", link: scholar("Hald 2020 divorce intervention RCT distress"), kind: "scholar" },
      { cite: "Kiecolt-Glaser marital-conflict studies.", note: "Conflict linked to physiological stress markers. [Moderate]", link: scholar("Kiecolt-Glaser marital conflict immune physiological stress"), kind: "scholar" },
    ],
  },
  {
    id: "p-10j",
    section: "10",
    title: "Job Loss / Foreclosure / Bankruptcy / Business Failure",
    subtitle: "Nearest lines: Emotional, Meta-Cognitive, Existential",
    evidenceTag: "Strong",
    description:
      "Financial and job loss are linked to distress and elevated suicide risk. Bolsters (as a risk to recover from) clusters: purpose-drift, burnout-pattern, emotional-flooding. Honest note: heavily confounded by prior mental health, and effects largely reverse with re-employment or resolved debt.",
    sources: [
      { cite: "Paul & Moser (2009). Journal of Vocational Behavior (d=0.51).", note: "Unemployment associated with worse mental health. [Strong]", link: scholar("Paul Moser 2009 unemployment mental health meta-analysis Journal of Vocational Behavior"), kind: "scholar" },
      { cite: "Picchio (2024). Journal of Economic Surveys (327 results, 65 articles).", note: "Job loss linked to health decline. [Strong]", link: scholar("Picchio 2024 job loss health Journal of Economic Surveys"), kind: "scholar" },
      { cite: "Roelfs & Shor meta-analysis.", note: "Suicide RR 1.74 (financial stress), 1.87 (unemployment). [Strong]", link: scholar("Roelfs Shor unemployment financial stress suicide meta-analysis"), kind: "scholar" },
      { cite: "Unemployment & suicide meta-analysis.", note: "RR 1.58 → 1.15 after adjustment. [Caveat]", link: scholar("unemployment suicide meta-analysis adjusted relative risk"), kind: "scholar" },
      { cite: "Re-employment, systematic review + meta-analysis.", note: "Re-employment associated with recovery. [Moderate]", link: scholar("re-employment mental health systematic review meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "p-10k",
    section: "10",
    title: "Bereavement (Spouse / Parent / Child)",
    subtitle: "Nearest lines: Emotional, Intrapersonal, Existential",
    evidenceTag: "Strong",
    description:
      "Bereavement is linked to elevated mortality and distress, concentrated in the first months. Bolsters (as a risk to recover from) clusters: emotional-flooding, isolation-fortress, purpose-drift. Honest note: risk attenuates over time, and part of it may reflect selection.",
    sources: [
      { cite: "Moon et al. (2011). PLOS One, widowhood meta-analysis (15 cohorts, 2.26M), RR 1.41.", note: "Widowhood associated with higher mortality. [Strong]", link: scholar("Moon 2011 widowhood mortality meta-analysis PLOS One 15 cohorts"), kind: "scholar" },
      { cite: "Shor et al. (2012) (500M), HR 1.23.", note: "Bereavement linked to elevated mortality. [Strong]", link: scholar("Shor 2012 widowhood bereavement mortality meta-analysis"), kind: "scholar" },
      { cite: "Psychobiology of bereavement, review.", note: "Documents physiological stress of grief. [Moderate]", link: scholar("psychobiology of bereavement review grief physiology"), kind: "scholar" },
      { cite: "Prior et al. (2018). Psychological Medicine.", note: "Bereavement associated with mental-health risk. [Moderate]", link: scholar("Prior 2018 bereavement mental health Psychological Medicine"), kind: "scholar" },
      { cite: "Kristiansen et al. (2019). Meta-analysis.", note: "Linked to elevated post-loss risk. [Moderate]", link: scholar("Kristiansen 2019 bereavement meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "p-10l",
    section: "10",
    title: "Spouse with Dementia (Caregiving)",
    subtitle: "Nearest lines: Emotional, Interpersonal, Meta-Cognitive",
    evidenceTag: "Moderate",
    description:
      "Spousal dementia caregiving is linked to elevated depression and burden. Bolsters (as a risk to recover from) clusters: burnout-pattern, isolation-fortress, emotional-flooding. Honest note: respite, psychoeducation, and peer support measurably reduce burden.",
    sources: [
      { cite: "Meta-analysis of spousal dementia caregivers.", note: "Associated with ~2.5× depression odds. [Moderate]", link: scholar("spousal dementia caregivers depression meta-analysis"), kind: "scholar" },
      { cite: "Ning et al. (2025). Journal of Advanced Nursing.", note: "Caregiving linked to psychological burden. [Moderate]", link: scholar("Ning 2025 dementia caregiving burden Journal of Advanced Nursing"), kind: "scholar" },
      { cite: "Impact of dementia caregiving on spousal-caregiver health. Medicina (2026).", note: "Associated with worse caregiver health. [Moderate]", link: scholar("dementia caregiving spousal caregiver health Medicina 2026"), kind: "scholar" },
      { cite: "COVID caregiver meta-analysis.", note: "Pandemic caregiving linked to higher distress. [Moderate]", link: scholar("COVID dementia caregiver distress meta-analysis"), kind: "scholar" },
      { cite: "Stress-burden pathways (Tele-Savvy, 261 caregivers).", note: "Support programs associated with reduced burden. [Moderate]", link: scholar("Tele-Savvy dementia caregiver stress burden 261 caregivers"), kind: "scholar" },
    ],
  },
  {
    id: "p-10m",
    section: "10",
    title: "Toxic / \"Addictive\" Relationships & IPV",
    subtitle: "Nearest lines: Emotional, Interpersonal, Intrapersonal",
    evidenceTag: "Moderate",
    description:
      "'Addictive relationship' is not a clinical construct; the honest mapping is to relationship distress and intimate-partner violence, which are strongly linked to depression, anxiety, and PTSD. Bolsters (as a risk to recover from) clusters: armored-heart, intimacy-avoidance, emotional-flooding.",
    sources: [
      { cite: "Relationship distress & intimate-partner violence, mental-health literature.", note: "IPV strongly linked to depression, anxiety, PTSD. [Moderate]", link: scholar("intimate partner violence relationship distress depression anxiety PTSD meta-analysis"), kind: "scholar" },
    ],
  },
  // ═══════════════ SECTION 11 — COMPOUNDING & CONVERGENCE ═══════════════
  {
    id: "p-11a",
    section: "11",
    title: "Stacking Protective Practices (Additive Upside)",
    subtitle: "Nearest lines: convergence across all lines (redundancy as insurance)",
    evidenceTag: "Strong",
    callout:
      "People expect 1 + 1 = 10 synergy. Rigorous research shows convergent, additive (often sub-additive) stacking on the upside and cumulative burden on the downside — redundancy (no single point of failure), NOT order-of-magnitude synergy. Beyond ~3–4 practices, adherence suffers.",
    description:
      "Stacking healthy behaviors produces large, additive differences in mortality and longevity — with an honest ceiling. Bolsters clusters: convergence across a shared fault line. Honest note: 'more is not always better' beyond roughly three domains.",
    sources: [
      { cite: "Khaw et al. (2008). PLOS Medicine, EPIC-Norfolk (20,000, 11 yrs).", note: "4 behaviors → 4-fold mortality difference (scoring 0 ≈ scoring 4 who is 14 yrs older). [Strong]", link: scholar("Khaw 2008 combined health behaviors mortality EPIC-Norfolk PLOS Medicine"), kind: "scholar" },
      { cite: "Loef & Walach (2012). Systematic review + meta-analysis.", note: "Combined healthy behaviors associated with lower mortality. [Strong]", link: scholar("Loef Walach 2012 combined healthy lifestyle behaviors mortality systematic review meta-analysis"), kind: "scholar" },
      { cite: "Meta-analysis of 15 cohorts.", note: "7.4–17.9 years greater life expectancy. [Strong]", link: scholar("healthy lifestyle factors life expectancy meta-analysis 15 cohorts"), kind: "scholar" },
      { cite: "Ngandu et al. (2015). Lancet, FINGER trial (multidomain RCT).", note: "Multidomain benefits persisted 7–11 years. [Strong]", link: scholar("Ngandu 2015 FINGER trial multidomain intervention cognition Lancet"), kind: "scholar" },
      { cite: "Lancet Healthy Longevity network meta-analysis (2025).", note: "'More is not always better' beyond ~3 domains. [Strong honest ceiling]", link: scholar("Lancet Healthy Longevity network meta-analysis multidomain 2025 more is not always better"), kind: "scholar" },
    ],
  },
  {
    id: "p-11b",
    section: "11",
    title: "Cumulative Burden (How Risks Compound)",
    subtitle: "Nearest lines: cumulative load across a shared weak cluster",
    evidenceTag: "Strong",
    description:
      "On the downside, risks compound as cumulative allostatic load, not emergent magic. Bolsters (as insight) clusters: how loads accumulate on a shared weak cluster until it tips. Honest bottom line: the real 'compounding' is convergence + cumulative load — a resilient profile stacks protective practices that cover the same fault line (redundancy as insurance); a fragile one accumulates loads on a shared weak cluster until it tips.",
    sources: [
      { cite: "McEwen & Stellar (1993). Allostatic load model.", note: "Foundational model of cumulative physiological load. [Strong foundational]", link: scholar("McEwen Stellar 1993 allostatic load stress and the individual"), kind: "scholar" },
      { cite: "Health-risk behaviours & allostatic load, systematic review (26 studies).", note: "Risk behaviors associated with higher allostatic load. [Strong]", link: scholar("health-risk behaviours allostatic load systematic review 26 studies"), kind: "scholar" },
      { cite: "Allostatic load & mortality, systematic review + meta-analysis (2022).", note: "Higher load linked to higher mortality. [Strong]", link: scholar("allostatic load mortality systematic review meta-analysis 2022"), kind: "scholar" },
      { cite: "Seeman et al. MacArthur Studies of Successful Aging.", note: "Allostatic load associated with functional decline. [Strong]", link: scholar("Seeman MacArthur Studies Successful Aging allostatic load"), kind: "scholar" },
      { cite: "Allostatic load & dual chronic conditions, NHANES.", note: "Linked to multimorbidity risk. [Moderate]", link: scholar("allostatic load dual chronic conditions NHANES"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 12 — INTEROCEPTION: THE CROSS-LINE KEYSTONE ═══════════════
  // The strongest candidate the corpus has for a single practice that plausibly lifts
  // MANY lines at once, because interoception, empathy, emotion, and decision-making
  // share one neural hub (the anterior insula). HONESTY DISCIPLINE: the mechanism and
  // the individual effects are well-evidenced; the sweeping magnitudes ("100x faster
  // than meditation", "strengthens all 31 lines effortlessly") are NOT established and
  // are deliberately kept out of the claims. Real leverage, calibrated claims.
  {
    id: "intero-insula-hub",
    section: "12",
    title: "The Insula Hub — Why One Practice Can Touch Many Lines",
    subtitle: "Anterior insular cortex as the shared substrate of feeling, empathy, and choice",
    evidenceTag: "Strong",
    description:
      "Interoception (sensing the body's internal state), emotional awareness, empathy, and value-based decision-making converge on the same neural structure — the anterior insula. This shared anatomy is the honest, physical basis for the 'keystone' idea: training the interoceptive line plausibly transfers to several other lines because they run on overlapping hardware. Boundary we hold: shared neuroanatomy makes cross-line transfer PLAUSIBLE and mechanistically motivated — it is not, by itself, proof that improving one line lifts all the others by a fixed amount.",
    callout: "Shared circuitry motivates cross-line transfer; it does not prove uniform, effortless gains across every line. We claim the mechanism, not a multiplier.",
    sources: [
      { cite: "Craig, A. D. (2002). How do you feel? Interoception: the sense of the physiological condition of the body. Nature Reviews Neuroscience, 3(8), 655–666.", note: "The founding modern account of interoception and the insula as its cortical home. [Strong foundational]", link: "https://doi.org/10.1038/nrn894", kind: "doi" },
      { cite: "Craig, A. D. (2009). How do you feel — now? The anterior insula and human awareness. Nature Reviews Neuroscience, 10(1), 59–70.", note: "Positions the anterior insula as the hub where bodily feeling becomes subjective awareness — the anatomical basis of the keystone claim. [Strong]", link: "https://doi.org/10.1038/nrn2555", kind: "doi" },
      { cite: "Critchley, H. D., Wiens, S., Rotshtein, P., Öhman, A., & Dolan, R. J. (2004). Neural systems supporting interoceptive awareness. Nature Neuroscience, 7(2), 189–195.", note: "fMRI: interoceptive accuracy tracks anterior-insula activity and gray matter — the measured link between the practice and the hub. [Strong]", link: "https://doi.org/10.1038/nn1176", kind: "doi" },
      { cite: "Barrett, L. F., & Simmons, W. K. (2015). Interoceptive predictions in the brain. Nature Reviews Neuroscience, 16(7), 419–429.", note: "Frames interoception as active prediction, explaining how better internal modeling can propagate to emotion and cognition. [Strong]", link: "https://doi.org/10.1038/nrn3950", kind: "doi" },
      { cite: "(Gu, Hof, Friston & Fan, 2013). Anterior insular cortex and emotional awareness. Journal of Comparative Neurology, 521(15), 3371–3388.", note: "Reviews the insula as the integration site for interoception, empathy, and emotion — the multi-line convergence, mapped. [Strong]", link: scholar("Gu Hof Friston Fan 2013 anterior insular cortex emotional awareness"), kind: "scholar" },
    ],
  },
  {
    id: "intero-measurement",
    section: "12",
    title: "Measuring It — So Gains Are Real, Not Vibes",
    subtitle: "Distinguishing interoceptive accuracy, sensibility, and awareness",
    evidenceTag: "Strong",
    description:
      "For interoception to be a scored line and a trackable practice, it must be measured rigorously. The field separates interoceptive accuracy (objective performance), sensibility (self-reported tendency), and awareness (metacognitive correspondence) — and validated instruments exist. This is what lets the platform re-measure the line honestly over time instead of trusting a feeling of progress.",
    callout: "These dimensions can dissociate — someone can feel very body-aware yet score low on accuracy. Any re-measurement must specify WHICH interoception it moved.",
    sources: [
      { cite: "Garfinkel, S. N., Seth, A. K., Barrett, A. B., Suzuki, K., & Critchley, H. D. (2015). Knowing your own heart: Distinguishing interoceptive accuracy from interoceptive awareness. Biological Psychology, 104, 65–74.", note: "The paper that separated the dimensions of interoception — essential for measuring the line without conflating confidence with accuracy. [Strong]", link: "https://doi.org/10.1016/j.biopsycho.2014.11.004", kind: "doi" },
      { cite: "Mehling, W. E., Price, C., Daubenmier, J. J., et al. (2012). The Multidimensional Assessment of Interoceptive Awareness (MAIA). PLoS ONE, 7(11), e48230.", note: "A validated self-report instrument for interoceptive awareness — a usable measurement basis for the line. [Strong]", link: "https://doi.org/10.1371/journal.pone.0048230", kind: "doi" },
      { cite: "Khalsa, S. S., Adolphs, R., Cameron, O. G., et al. (2018). Interoception and mental health: A roadmap. Biological Psychiatry: Cognitive Neuroscience and Neuroimaging, 3(6), 501–513.", note: "The major consensus review defining constructs, methods, and open questions — the field's own honest map, kept on purpose. [Strong]", link: "https://doi.org/10.1016/j.bpsc.2017.12.004", kind: "doi" },
    ],
  },
  {
    id: "intero-decision",
    section: "12",
    title: "Interoception → Decision-Making & Intuition",
    subtitle: "Bolsters (as controlling weakness): the cognitive & financial lines",
    evidenceTag: "Moderate",
    description:
      "Bodily signals guide decisions under uncertainty — the 'gut feeling' successful operators rely on is, in part, measured interoceptive accuracy. The foundational somatic-marker work and a striking field study on traders link internal-signal sensitivity to better real-world decisions. Boundary: these are correlational and task-specific; interoception supports good judgment, it does not replace analysis or guarantee financial success.",
    callout: "Correlational and domain-specific. Interoceptive accuracy is associated with better decisions in specific tasks — not a universal upgrade to every choice.",
    sources: [
      { cite: "Damasio, A. R. (1996). The somatic marker hypothesis and the possible functions of the prefrontal cortex. Philosophical Transactions of the Royal Society B, 351(1346), 1413–1420.", note: "The theory that bodily 'markers' steer complex decisions — the mechanistic root of interoception-guided judgment. [Strong foundational]", link: "https://doi.org/10.1098/rstb.1996.0125", kind: "doi" },
      { cite: "Bechara, A., Damasio, H., Tranel, D., & Damasio, A. R. (1997). Deciding advantageously before knowing the advantageous strategy. Science, 275(5304), 1293–1295.", note: "The Iowa Gambling Task: the body signaled the right choice before conscious reasoning did. [Strong]", link: "https://doi.org/10.1126/science.275.5304.1293", kind: "doi" },
      { cite: "Kandasamy, N., Garfinkel, S. N., Page, L., et al. (2016). Interoceptive ability predicts survival on a London trading floor. Scientific Reports, 6, 32986.", note: "Real-world and striking: traders with higher heartbeat-detection accuracy were more profitable and survived longer in the job. [Moderate — single field study]", link: "https://doi.org/10.1038/srep32986", kind: "doi" },
      { cite: "Sokol-Hessner, P., Hartley, C. A., Hamilton, J. R., & Phelps, E. A. (2015). Interoceptive ability predicts aversion to losses. Cognition &amp; Emotion, 29(4), 695–701.", note: "Links interoceptive sensitivity to loss aversion — how internal signals shape financial risk-taking. [Moderate]", link: scholar("Sokol-Hessner 2015 interoceptive ability predicts aversion to losses"), kind: "scholar" },
    ],
  },
  {
    id: "intero-emotion",
    section: "12",
    title: "Interoception → Emotion Regulation & Empathy",
    subtitle: "Bolsters clusters: the intrapersonal, empathic, and interpersonal lines",
    evidenceTag: "Moderate",
    description:
      "Reading your own internal state is upstream of regulating emotion and of accurately reading others. Studies link interoceptive awareness to more effective reappraisal and to sensitivity to others' emotions — a plausible route by which one practice touches several social-emotional lines. Boundary: effects are modest and context-dependent, not a wholesale empathy upgrade.",
    callout: "The interoception–empathy link is real but modest and moderated by anxiety; more internal awareness is not always more empathy.",
    sources: [
      { cite: "Füstös, J., Gramann, K., Herbert, B. M., & Pollatos, O. (2013). On the embodiment of emotion regulation: Interoceptive awareness facilitates reappraisal. Social Cognitive and Affective Neuroscience, 8(8), 911–917.", note: "Higher interoceptive awareness improved the neural efficiency of emotion reappraisal — a direct line from the body practice to self-regulation. [Moderate]", link: "https://doi.org/10.1093/scan/nss089", kind: "doi" },
      { cite: "Terasawa, Y., Moriguchi, Y., Tochizawa, S., & Umeda, S. (2014). Interoceptive sensitivity predicts sensitivity to the emotions of others. Cognition &amp; Emotion, 28(8), 1435–1448.", note: "People better at sensing their own bodies were better at reading others' emotions — interoception feeding empathy. [Moderate]", link: scholar("Terasawa 2014 interoceptive sensitivity predicts sensitivity to emotions of others"), kind: "scholar" },
      { cite: "Herbert, B. M., Herbert, C., & Pollatos, O. (2011). On the relationship between interoceptive awareness and alexithymia. Journal of Personality, 79(5), 1149–1175.", note: "Poor interoceptive awareness tracks alexithymia (difficulty identifying feelings) — the deficit side of the same mechanism. [Moderate]", link: scholar("Herbert Herbert Pollatos 2011 interoceptive awareness alexithymia"), kind: "scholar" },
    ],
  },
  {
    id: "intero-floatation",
    section: "12",
    title: "Floatation-REST & Sensory Deprivation — The Specific Practice",
    subtitle: "An efficient interoception trainer — with honest limits on the magnitude",
    evidenceTag: "Emerging",
    description:
      "Removing external sensory input redirects processing inward and appears to sharpen interoceptive awareness while lowering anxiety — a promising, low-effort way to train the keystone line. This is the direct evidence behind the pool/float practice. Boundary we hold firmly: the floatation literature is small, mostly short-term, and often single-session; it supports anxiety reduction and acute interoceptive gains, but does NOT establish lasting, whole-profile intelligence gains, and provides NO support for '100x faster than meditation' or 'strengthens all 31 lines effortlessly.' The mechanism is real; the sweeping magnitudes are not evidenced.",
    callout: "Honest guardrail: small, short-term studies. Real for anxiety + acute interoception; unproven for durable multi-line gains. We advertise the mechanism, never a multiplier.",
    sources: [
      { cite: "Feinstein, J. S., Khalsa, S. S., Yeh, H.-W., et al. (2018). Examining the short-term anxiolytic and antidepressant effect of Floatation-REST. PLoS ONE, 13(2), e0190292.", note: "The key modern trial: a single float session produced significant acute reductions in anxiety and improvements in mood across 50 participants. [Emerging — acute, uncontrolled for long-term]", link: "https://doi.org/10.1371/journal.pone.0190292", kind: "doi" },
      { cite: "Feinstein, J. S., Khalsa, S. S., Yeh, H.-W., et al. (2018). The elicitation of relaxation and interoceptive awareness using floatation therapy in individuals with high anxiety sensitivity. Biological Psychiatry: Cognitive Neuroscience and Neuroimaging, 3(6), 555–562.", note: "Floatation reliably heightened interoceptive awareness while reducing anxiety in high-anxiety-sensitive individuals. [Emerging]", link: scholar("Feinstein 2018 floatation therapy interoceptive awareness high anxiety sensitivity Biological Psychiatry"), kind: "scholar" },
      { cite: "Al Zoubi, O., Misaki, M., Bodurka, J., et al. (2021). Taking the body off the mind: Decreased functional connectivity between somatomotor and default-mode networks following Floatation-REST. Human Brain Mapping, 42(10), 3216–3227.", note: "Neuroimaging evidence that floatation shifts large-scale network connectivity — a measured brain change, though acute. [Emerging]", link: scholar("Al Zoubi 2021 taking the body off the mind floatation-REST somatomotor default mode"), kind: "scholar" },
      { cite: "Kjellgren, A., & Westman, J. (2014). Beneficial effects of treatment with sensory isolation in flotation-tank as a preventive health-care intervention. BMC Complementary and Alternative Medicine, 14, 417.", note: "A larger applied study reporting well-being and stress benefits from a course of float sessions. [Emerging — self-report]", link: scholar("Kjellgren Westman 2014 flotation-tank sensory isolation preventive health BMC"), kind: "scholar" },
    ],
  },
  {
    id: "intero-neuroplasticity",
    section: "12",
    title: "Contemplative Practice Changes the Brain — The Neuroplastic Basis",
    subtitle: "Why a passive practice can produce structural change (incl. the insula)",
    evidenceTag: "Moderate",
    description:
      "The claim that a quiet, passive practice reorganizes the brain is not mystical — contemplative training measurably changes brain structure and function, including insula thickness (the interoception hub itself). This is the plausible neuroplastic route from repeated practice to durable line-level change. Boundary: meditation neuroimaging has known methodological limits (small samples, self-selection); effects are real but not as large or as fast as popular claims suggest.",
    callout: "Structural change is real but gradual and variable across people. 'Neuroplasticity' justifies the direction of the practice, not an accelerated timeline for any one person.",
    sources: [
      { cite: "Tang, Y.-Y., Hölzel, B. K., & Posner, M. I. (2015). The neuroscience of mindfulness meditation. Nature Reviews Neuroscience, 16(4), 213–225.", note: "The authoritative review of how contemplative practice changes attention networks and brain structure — with the field's caveats intact. [Strong review]", link: "https://doi.org/10.1038/nrn3916", kind: "doi" },
      { cite: "Lazar, S. W., Kerr, C. E., Wasserman, R. H., et al. (2005). Meditation experience is associated with increased cortical thickness. NeuroReport, 16(17), 1893–1897.", note: "Found thicker cortex in experienced meditators — notably in the anterior insula, the interoception hub. [Moderate — cross-sectional]", link: "https://doi.org/10.1097/01.wnr.0000186598.66243.19", kind: "doi" },
      { cite: "Hölzel, B. K., Carmody, J., Vangel, M., et al. (2011). Mindfulness practice leads to increases in regional brain gray matter density. Psychiatry Research: Neuroimaging, 191(1), 36–43.", note: "A longitudinal 8-week study showing gray-matter change after practice — evidence the change is caused, not just correlated. [Moderate]", link: "https://doi.org/10.1016/j.pscychresns.2010.08.006", kind: "doi" },
      { cite: "Farb, N. A. S., Segal, Z. V., Mayberg, H., et al. (2007). Attending to the present: Mindfulness meditation reveals distinct neural modes of self-reference. Social Cognitive and Affective Neuroscience, 2(4), 313–322.", note: "Showed body-focused present-moment attention recruits the insula and shifts self-referential processing — the interoceptive mechanism in action. [Moderate]", link: "https://doi.org/10.1093/scan/nsm030", kind: "doi" },
    ],
  },

  // ═══════════════ SECTION 13 — AEROBIC EXERCISE: THE PROVEN KEYSTONE ═══════════════
  // The single most-evidenced brain intervention there is — stronger evidence than
  // floatation. Cross-line by mechanism (BDNF, neurogenesis, vascular), with RCTs and
  // meta-analyses, not just cohorts. Honest boundary: real effects are meaningful and
  // durable but MODEST per unit — not a personality transplant.
  {
    id: "keystone-exercise",
    section: "13",
    title: "Aerobic Exercise — The Best-Evidenced Meta-System",
    subtitle: "Bolsters clusters: cognitive, memory, mood, resilience, self-regulation",
    evidenceTag: "Strong",
    description:
      "If interoception is promising, aerobic exercise is proven. It raises BDNF, drives hippocampal neurogenesis, and improves vascular supply to the brain — lifting memory, executive function, processing speed, mood, and stress resilience at once. The evidence runs all the way from mechanism to randomized trials to meta-analyses. Honest boundary: effects are real, replicated, and dose-responsive, but modest per unit of training — a keystone you compound over months, not a switch.",
    callout: "The strongest keystone in this library by evidence weight. Effects are meaningful and durable, not dramatic overnight. Prescribe it as a compounding practice.",
    sources: [
      { cite: "Erickson, K. I., Voss, M. W., Prakash, R. S., et al. (2011). Exercise training increases size of hippocampus and improves memory. PNAS, 108(7), 3017–3022.", note: "The landmark RCT: a year of aerobic training reversed age-related hippocampal shrinkage and improved memory. Mechanism → structure → outcome. [Strong]", link: "https://doi.org/10.1073/pnas.1015950108", kind: "doi" },
      { cite: "Hillman, C. H., Erickson, K. I., & Kramer, A. F. (2008). Be smart, exercise your heart: Exercise effects on brain and cognition. Nature Reviews Neuroscience, 9(1), 58–65.", note: "The authoritative review linking cardiovascular fitness to brain structure and cognition across the lifespan. [Strong review]", link: "https://doi.org/10.1038/nrn2298", kind: "doi" },
      { cite: "Northey, J. M., Cherbuin, N., Pumpa, K. L., Smee, D. J., & Rattray, B. (2018). Exercise interventions for cognitive function in adults older than 50: A systematic review with meta-analysis. British Journal of Sports Medicine, 52(3), 154–160.", note: "Meta-analysis of RCTs: exercise significantly improved cognition, with aerobic and resistance both contributing. [Strong]", link: "https://doi.org/10.1136/bjsports-2016-096587", kind: "doi" },
      { cite: "Smith, P. J., Blumenthal, J. A., Hoffman, B. M., et al. (2010). Aerobic exercise and neurocognitive performance: A meta-analytic review of randomized controlled trials. Psychosomatic Medicine, 72(3), 239–252.", note: "Pooled RCTs showing modest but reliable gains in attention, processing speed, and executive function. [Strong]", link: "https://doi.org/10.1097/PSY.0b013e3181d14633", kind: "doi" },
      { cite: "Schuch, F. B., Vancampfort, D., Richards, J., et al. (2016). Exercise as a treatment for depression: A meta-analysis adjusting for publication bias. Journal of Psychiatric Research, 77, 42–51.", note: "Even after correcting for publication bias, exercise had a large antidepressant effect — the mood line, causally moved. [Strong]", link: "https://doi.org/10.1016/j.jpsychires.2016.02.023", kind: "doi" },
      { cite: "Cotman, C. W., Berchtold, N. C., & Christie, L.-A. (2007). Exercise builds brain health: Key roles of growth factor cascades and inflammation. Trends in Neurosciences, 30(9), 464–472.", note: "The mechanistic backbone: exercise upregulates BDNF and other growth factors and lowers neuroinflammation. [Strong]", link: "https://doi.org/10.1016/j.tins.2007.06.011", kind: "doi" },
      { cite: "Voss, M. W., Vivar, C., Kramer, A. F., & van Praag, H. (2013). Bridging animal and human models of exercise-induced brain plasticity. Trends in Cognitive Sciences, 17(10), 525–544.", note: "Connects the rodent neurogenesis evidence to human brain plasticity — why the mechanism generalizes. [Strong]", link: "https://doi.org/10.1016/j.tics.2013.08.001", kind: "doi" },
      { cite: "Liu-Ambrose, T., Nagamatsu, L. S., Graf, P., et al. (2010). Resistance training and executive functions: A 12-month randomized controlled trial. Archives of Internal Medicine, 170(2), 170–178.", note: "Shows the transfer isn't only aerobic: resistance training improved executive function over a year. [Strong]", link: scholar("Liu-Ambrose 2010 resistance training executive functions 12-month randomized controlled trial"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 14 — SLEEP: THE FOUNDATIONAL SYSTEM ═══════════════
  {
    id: "keystone-sleep",
    section: "14",
    title: "Sleep — The System That Gates Every Other Line",
    subtitle: "Bolsters clusters: memory, emotion, decision-making, immunity, everything",
    evidenceTag: "Strong",
    description:
      "Sleep is the foundational meta-system: it consolidates memory, regulates emotion, clears metabolic waste from the brain, and restores decision-making. Degrade it and nearly every line drops together; protect it and the others have room to rise. This is the highest-leverage, most-evidenced practice in the entire library — and the cheapest. Honest boundary: 'optimize sleep' means protecting quantity, timing, and regularity; there is no shortcut that substitutes for the hours.",
    callout: "The single highest-leverage line-lifter here — because it gates the others. Fixing sleep is often the first move, not the last.",
    sources: [
      { cite: "Xie, L., Kang, H., Xu, Q., et al. (2013). Sleep drives metabolite clearance from the adult brain. Science, 342(6156), 373–377.", note: "The glymphatic discovery: during sleep the brain flushes metabolic waste (including amyloid-beta) far faster than when awake. [Strong]", link: "https://doi.org/10.1126/science.1241224", kind: "doi" },
      { cite: "Diekelmann, S., & Born, J. (2010). The memory function of sleep. Nature Reviews Neuroscience, 11(2), 114–126.", note: "The authoritative account of how slow-wave and REM sleep consolidate memory — why learning needs sleep to stick. [Strong review]", link: "https://doi.org/10.1038/nrn2762", kind: "doi" },
      { cite: "Rasch, B., & Born, J. (2013). About sleep's role in memory. Physiological Reviews, 93(2), 681–766.", note: "The comprehensive review of sleep-dependent memory consolidation across systems. [Strong]", link: "https://doi.org/10.1152/physrev.00032.2012", kind: "doi" },
      { cite: "Yoo, S.-S., Gujar, N., Hu, P., Jolesz, F. A., & Walker, M. P. (2007). The human emotional brain without sleep — a prefrontal amygdala disconnect. Current Biology, 17(20), R877–R878.", note: "One night of deprivation amplified amygdala reactivity by ~60% and severed prefrontal control — the emotional-regulation line, degraded by lost sleep. [Strong]", link: "https://doi.org/10.1016/j.cub.2007.08.007", kind: "doi" },
      { cite: "Van Dongen, H. P. A., Maislin, G., Mullington, J. M., & Dinges, D. F. (2003). The cumulative cost of additional wakefulness: Dose-response effects on neurobehavioral functions and sleep physiology from chronic sleep restriction. Sleep, 26(2), 117–126.", note: "The dose-response landmark: chronic mild sleep restriction accumulates cognitive deficits people don't notice — the invisible tax. [Strong]", link: "https://doi.org/10.1093/sleep/26.2.117", kind: "doi" },
      { cite: "Prather, A. A., Janicki-Deverts, D., Hall, M. H., & Cohen, S. (2015). Behaviorally assessed sleep and susceptibility to the common cold. Sleep, 38(9), 1353–1359.", note: "Objectively measured short sleep predicted who caught a cold after viral exposure — sleep as an immune keystone. [Strong]", link: scholar("Prather 2015 behaviorally assessed sleep susceptibility common cold"), kind: "scholar" },
      { cite: "Walker, M. P., & Stickgold, R. (2006). Sleep, memory, and plasticity. Annual Review of Psychology, 57, 139–166.", note: "Foundational review connecting sleep to synaptic plasticity and skill consolidation. [Strong]", link: scholar("Walker Stickgold 2006 sleep memory and plasticity annual review psychology"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 15 — BREATHWORK & HRV: AUTONOMIC SELF-REGULATION ═══════════════
  {
    id: "keystone-breath",
    section: "15",
    title: "Breathwork & HRV Biofeedback — Floatation's Free Cousin",
    subtitle: "Bolsters clusters: self-regulation, attention, emotional control",
    evidenceTag: "Moderate",
    description:
      "Slow, deliberate breathing and heart-rate-variability biofeedback work the same interoceptive/autonomic machinery as floatation — raising vagal tone, calming physiological arousal, and improving attention and emotional control — but active, free, and portable. A recent randomized trial found brief daily breathing practices improved mood and lowered arousal more than mindfulness meditation. Honest boundary: effects are reliable but moderate, and the flashier 'breathwork rewires your nervous system' claims outrun the data.",
    callout: "Efficient and portable, mechanistically adjacent to floatation. Reliable moderate effects — not a nervous-system overhaul.",
    sources: [
      { cite: "Zaccaro, A., Piarulli, A., Laurino, M., et al. (2018). How breath-control can change your life: A systematic review on psycho-physiological correlates of slow breathing. Frontiers in Human Neuroscience, 12, 353.", note: "The systematic review: slow breathing shifts autonomic balance toward parasympathetic tone and improves affect and attention. [Moderate]", link: "https://doi.org/10.3389/fnhum.2018.00353", kind: "doi" },
      { cite: "Lehrer, P. M., & Gevirtz, R. (2014). Heart rate variability biofeedback: How and why does it work? Frontiers in Psychology, 5, 756.", note: "Explains the resonance-frequency mechanism behind HRV biofeedback — training the baroreflex to strengthen self-regulation. [Moderate]", link: "https://doi.org/10.3389/fpsyg.2014.00756", kind: "doi" },
      { cite: "Ma, X., Yue, Z.-Q., Gong, Z.-Q., et al. (2017). The effect of diaphragmatic breathing on attention, negative affect and stress in healthy adults. Frontiers in Psychology, 8, 874.", note: "RCT: diaphragmatic breathing training improved sustained attention and lowered cortisol and negative affect. [Moderate]", link: "https://doi.org/10.3389/fpsyg.2017.00874", kind: "doi" },
      { cite: "Balban, M. Y., Neri, E., Kogon, M. M., et al. (2023). Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Reports Medicine, 4(1), 100895.", note: "Head-to-head RCT: five minutes of daily cyclic-sighing breathwork beat mindfulness meditation for mood and arousal over a month. [Moderate]", link: "https://doi.org/10.1016/j.xcrm.2022.100895", kind: "doi" },
    ],
  },

  // ═══════════════ SECTION 16 — NATURE EXPOSURE: ATTENTION RESTORATION ═══════════════
  {
    id: "keystone-nature",
    section: "16",
    title: "Nature Exposure — The Passive, Cross-Line Restorer",
    subtitle: "Bolsters clusters: attention, mood, creativity, stress-resilience",
    evidenceTag: "Moderate",
    description:
      "Time in natural settings restores directed attention, lowers stress, lifts mood, and reduces rumination — the most floatation-like profile in this list: passive, restorative, and touching several lines at once. The evidence includes a striking fMRI study in which a nature walk reduced activity in a brain region tied to rumination. Honest boundary: effects are real and repeatable but modest, and 'nature heals everything' overstates a genuine but bounded effect.",
    callout: "Low-effort, repeatable, cross-line — one of the easiest keystones to prescribe. Real but bounded effects.",
    sources: [
      { cite: "Bratman, G. N., Hamilton, J. P., Hahn, K. S., Daily, G. C., & Gross, J. J. (2015). Nature experience reduces rumination and subgenual prefrontal cortex activation. PNAS, 112(28), 8567–8572.", note: "A 90-minute nature walk lowered self-reported rumination AND activity in the subgenual PFC — a measured brain change, not just a mood report. [Moderate]", link: "https://doi.org/10.1073/pnas.1510459112", kind: "doi" },
      { cite: "Berman, M. G., Jonides, J., & Kaplan, S. (2008). The cognitive benefits of interacting with nature. Psychological Science, 19(12), 1207–1212.", note: "The attention-restoration demonstration: a walk in nature improved working memory and attention more than an urban walk. [Moderate]", link: "https://doi.org/10.1111/j.1467-9280.2008.02225.x", kind: "doi" },
      { cite: "White, M. P., Alcock, I., Grellier, J., et al. (2019). Spending at least 120 minutes a week in nature is associated with good health and wellbeing. Scientific Reports, 9, 7730.", note: "A large dose-response study identifying a ~2-hour weekly threshold associated with better health and wellbeing. [Moderate]", link: "https://doi.org/10.1038/s41598-019-44097-3", kind: "doi" },
      { cite: "Ulrich, R. S. (1984). View through a window may influence recovery from surgery. Science, 224(4647), 420–421.", note: "The classic: surgical patients with a view of trees recovered faster and needed less pain medication than those facing a wall. [Moderate — foundational]", link: "https://doi.org/10.1126/science.6143402", kind: "doi" },
      { cite: "Hartig, T., Mitchell, R., de Vries, S., & Frumkin, H. (2014). Nature and health. Annual Review of Public Health, 35, 207–228.", note: "The comprehensive review of pathways linking nature to health — with the field's caveats on effect size and confounds. [Moderate review]", link: "https://doi.org/10.1146/annurev-publhealth-032013-182443", kind: "doi" },
    ],
  },

  // ═══════════════ SECTION 17 — THERMAL STRESS: SAUNA & COLD ═══════════════
  {
    id: "keystone-thermal",
    section: "17",
    title: "Thermal Stress — Sauna (Strong) & Cold (Emerging)",
    subtitle: "Bolsters clusters: resilience, mood, cardiovascular & brain healthspan",
    evidenceTag: "Moderate",
    description:
      "Deliberate heat and cold are hormetic stressors — small, controlled challenges that build resilience. Sauna in particular has genuinely strong LONGITUDINAL evidence (large Finnish cohorts linking frequent use to lower dementia and cardiovascular mortality). Cold exposure has real acute mood/arousal effects but thinner long-term data. Honest boundary we hold firmly: sauna's cohort data is strong but observational; cold plunging is promising and heavily hyped — we tag the acute effects real and the durable claims emerging.",
    callout: "Sauna: strong cohort evidence (observational). Cold: real acute effects, over-hyped for durable benefit. Don't let cold-plunge marketing outrun its data.",
    sources: [
      { cite: "Laukkanen, T., Khan, H., Zaccardi, F., & Laukkanen, J. A. (2015). Association between sauna bathing and fatal cardiovascular and all-cause mortality events. JAMA Internal Medicine, 175(4), 542–548.", note: "The Finnish KIHD cohort: frequent sauna use tracked strongly with lower cardiovascular and all-cause mortality over 20 years. [Moderate — large cohort]", link: "https://doi.org/10.1001/jamainternmed.2014.8187", kind: "doi" },
      { cite: "Laukkanen, T., Kunutsor, S., Kauhanen, J., & Laukkanen, J. A. (2017). Sauna bathing is inversely associated with dementia and Alzheimer's disease in middle-aged to elderly Finnish men. Age and Ageing, 46(2), 245–249.", note: "Same cohort: 4–7 sauna sessions/week associated with substantially lower dementia and Alzheimer's incidence. [Moderate — cohort]", link: "https://doi.org/10.1093/ageing/afw212", kind: "doi" },
      { cite: "Buijze, G. A., Sierevelt, I. N., van der Heijden, B. C. J. M., Dijkgraaf, M. G., & Frings-Dresen, M. H. W. (2016). The effect of cold showering on health and work: A randomized controlled trial. PLoS ONE, 11(9), e0161749.", note: "A rare RCT on cold exposure: routine cold showers reduced self-reported sick-leave days (though not sickness episodes). Real, modest, honest. [Emerging]", link: "https://doi.org/10.1371/journal.pone.0161749", kind: "doi" },
      { cite: "Shevchuk, N. A. (2008). Adapted cold shower as a potential treatment for depression. Medical Hypotheses, 70(5), 995–1001.", note: "A HYPOTHESIS paper (not a trial), included honestly as the origin of the cold-and-mood idea and to mark how thin the causal evidence still is. [Emerging — hypothesis only]", link: scholar("Shevchuk 2008 adapted cold shower potential treatment for depression medical hypotheses"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 18 — PSYCHEDELIC-ASSISTED THERAPY: DEEP BUT GATED ═══════════════
  {
    id: "keystone-psychedelic",
    section: "18",
    title: "Psychedelic-Assisted Therapy — The Deepest, Most Constrained",
    subtitle: "Bolsters clusters: openness, meaning, mood — under strict conditions",
    evidenceTag: "Emerging",
    description:
      "Psilocybin-assisted therapy is one of the very few interventions shown to DURABLY shift a personality trait (openness) and to produce large, sustained reductions in depression and anxiety — the deepest scope in this list. But it is legally restricted, requires medical supervision and screening, carries real psychological risk, and is not a self-administered practice. We include it for completeness and honesty; we do NOT prescribe it. This is documentation of the frontier, with the biggest guardrail in the library.",
    callout: "Deepest effects here — and the most gated. Legal restrictions, medical supervision, and real risk mean this is documented, never recommended as a self-practice.",
    sources: [
      { cite: "Griffiths, R. R., Richards, W. A., McCann, U., & Jesse, R. (2006). Psilocybin can occasion mystical-type experiences having substantial and sustained personal meaning and spiritual significance. Psychopharmacology, 187(3), 268–283.", note: "The study that restarted modern psychedelic science: a single supervised session produced experiences rated as personally meaningful months later. [Emerging — controlled, small]", link: "https://doi.org/10.1007/s00213-006-0457-5", kind: "doi" },
      { cite: "MacLean, K. A., Johnson, M. W., & Griffiths, R. R. (2011). Mystical experiences occasioned by psilocybin lead to increases in the personality domain of openness. Journal of Psychopharmacology, 25(11), 1453–1461.", note: "Rare evidence of durable trait change: openness — normally stable in adulthood — rose and stayed elevated. Directly relevant to 'engineering' a line, with heavy caveats. [Emerging]", link: "https://doi.org/10.1177/0269881111420188", kind: "doi" },
      { cite: "Griffiths, R. R., Johnson, M. W., Carducci, M. A., et al. (2016). Psilocybin produces substantial and sustained decreases in depression and anxiety in patients with life-threatening cancer: A randomized double-blind trial. Journal of Psychopharmacology, 30(12), 1181–1197.", note: "A rigorous double-blind RCT showing large, lasting reductions in depression and anxiety after a single supervised dose. [Emerging — clinical, supervised]", link: "https://doi.org/10.1177/0269881116675513", kind: "doi" },
      { cite: "Carhart-Harris, R. L., Erritzoe, D., Williams, T., et al. (2012). Neural correlates of the psychedelic state as determined by fMRI studies with psilocybin. PNAS, 109(6), 2138–2143.", note: "The neuroimaging basis: psilocybin decreases activity in hub regions (default-mode network), increasing brain-network flexibility. [Emerging — mechanism]", link: "https://doi.org/10.1073/pnas.1119598109", kind: "doi" },
    ],
  },

  // ═══════════════ SECTION 19 — READING PEOPLE: NONVERBAL DECODING ═══════════════
  // Added in response to a specific question: does watching drama with the sound OFF
  // build intelligence? HONEST FINDING: no study has tested muted TV-watching, and we
  // do not claim it. What IS validated: nonverbal decoding is a real, trainable skill;
  // its benchmark test (the PONS) uses SILENT clips; and watching character drama
  // transiently boosts theory of mind (a contested effect, both sides cited).
  {
    id: "read-people",
    section: "19",
    title: "Reading People — Nonverbal Decoding Is a Trainable Skill",
    subtitle: "Bolsters clusters: interpersonal, empathic, intuitive",
    evidenceTag: "Moderate",
    description:
      "Reading others' emotions from faces, posture, and gesture — nonverbal decoding — is a measured, trainable skill, and training reliably improves it. Notably, the gold-standard test of this ability (the PONS) uses SILENT video clips, so the science already measures exactly the capacity that watching a screen without sound would force you to use. Watching character-driven drama also transiently improves theory of mind, though the broader 'fiction improves social cognition' claim is contested. IMPORTANT: no study has tested watching TV with the sound muted as an intervention — that specific practice is a plausible but UNVALIDATED extrapolation, and we present it as such.",
    callout: "Honest guardrail: 'watch TV with the volume off' is NOT validated by any study. What IS validated is that nonverbal decoding is real and trainable, and its benchmark test uses silent clips. Treat muted viewing as a plausible exercise, never a proven intervention.",
    sources: [
      { cite: "Blanch-Hartigan, D., Andrzejewski, S. A., & Hill, K. M. (2012). The effectiveness of training to improve person perception accuracy: A meta-analysis. Basic and Applied Social Psychology, 34(6), 483–498.", note: "The key evidence that the skill is trainable: a meta-analysis finding person-perception/nonverbal-decoding training reliably improves accuracy. [Moderate — meta-analysis]", link: scholar("Blanch-Hartigan Andrzejewski Hill 2012 effectiveness of training to improve person perception accuracy meta-analysis"), kind: "scholar" },
      { cite: "Döllinger, L., Laukka, P., Högman, L. B., et al. (2021). Training emotion recognition accuracy: Results for multimodal expressions and facial micro expressions. Frontiers in Psychology, 12, 708867.", note: "A controlled training study showing brief training improved emotion-recognition accuracy across faces and micro-expressions. [Moderate]", link: "https://doi.org/10.3389/fpsyg.2021.708867", kind: "doi" },
      { cite: "Rosenthal, R., Hall, J. A., DiMatteo, M. R., Rogers, P. L., & Archer, D. (1979). Sensitivity to Nonverbal Communication: The PONS Test. Johns Hopkins University Press.", note: "The foundational instrument — and the key link to the muted-screen idea: the PONS measures nonverbal sensitivity using SILENT face-only and body-only video clips. [Moderate — foundational]", link: scholar("Rosenthal Hall DiMatteo Rogers Archer 1979 Sensitivity to Nonverbal Communication PONS Test"), kind: "scholar" },
      { cite: "Nowicki, S., & Duke, M. P. (1994). Individual differences in the nonverbal communication of affect: The Diagnostic Analysis of Nonverbal Accuracy Scale (DANVA). Journal of Nonverbal Behavior, 18(1), 9–35.", note: "A second well-validated measure of nonverbal decoding accuracy — establishing that this is a real, measurable individual difference. [Moderate]", link: scholar("Nowicki Duke 1994 Diagnostic Analysis of Nonverbal Accuracy DANVA Journal of Nonverbal Behavior"), kind: "scholar" },
      { cite: "Black, J. E., & Barnes, J. L. (2015). Fiction and social cognition: The effect of viewing award-winning television dramas on theory of mind. Psychology of Aesthetics, Creativity, and the Arts, 9(4), 423–429.", note: "The closest study to the question: viewers of award-winning TV dramas scored higher on theory-of-mind tests than documentary viewers — but WITH sound. [Moderate]", link: scholar("Black Barnes 2015 fiction social cognition award-winning television dramas theory of mind"), kind: "scholar" },
      { cite: "Kidd, D. C., & Castano, E. (2013). Reading literary fiction improves theory of mind. Science, 342(6156), 377–380.", note: "The famous demonstration that literary fiction can boost theory of mind — included with its contested status. [Moderate — contested]", link: "https://doi.org/10.1126/science.1239918", kind: "doi" },
      { cite: "Panero, M. E., Weisberg, D. S., Black, J., et al. (2016). Does reading a single passage of literary fiction really improve theory of mind? An attempt at replication. Journal of Personality and Social Psychology, 111(5), e46–e54.", note: "The skeptic, kept on purpose: a large pre-registered replication that FAILED to reproduce the fiction-improves-theory-of-mind effect. Both sides belong in the record. [Moderate — counter-evidence]", link: scholar("Panero Weisberg Black 2016 does reading literary fiction really improve theory of mind replication"), kind: "scholar" },
      { cite: "Mar, R. A., & Oatley, K. (2008). The function of fiction is the abstraction and simulation of social experience. Perspectives on Psychological Science, 3(3), 173–192.", note: "The theoretical frame: narrative fiction as a 'simulation' of social experience that can exercise social cognition — the plausible mechanism behind any drama-watching benefit. [Moderate — theory]", link: scholar("Mar Oatley 2008 function of fiction abstraction simulation of social experience"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 20 — LEARNING FROM OTHER COUPLES ═══════════════
  // Added in response to specific questions: do couples grow by watching OTHER
  // couples fight, divorce, or marry? HONEST FINDING: one version is strongly
  // validated (watching + DISCUSSING relationship media halves the divorce rate —
  // Rogge et al.). Passively watching real fights or divorce proceedings, and
  // watching weddings, are NOT validated as intelligence interventions — the ritual
  // research on weddings is about bonding/awe, not intelligence. We say so plainly.
  {
    id: "couples-relationship-media",
    section: "20",
    title: "Watching + Discussing Other Couples — The Validated Version",
    subtitle: "Bolsters clusters: interpersonal, empathic, intrapersonal (marital/parental)",
    evidenceTag: "Moderate",
    description:
      "There is genuinely strong evidence for one specific version of 'learning from other couples': a randomized trial found that newlyweds who WATCHED five relationship movies (depicting other couples, including their conflicts) and then DISCUSSED them cut their 3-year divorce/separation rate roughly in half (24%→11%) — as effective as intensive therapist-led programs. The active ingredient is watch-AND-discuss, not passive viewing. Observation is a real learning channel (social learning theory), and couples' conflict behavior is readable enough to predict divorce (Gottman's observational work). IMPORTANT limits: passively watching real couples fight, or watching divorce proceedings, has NOT been tested as an intelligence intervention; and while weddings/rituals reliably build social bonding and awe, no study shows watching weddings raises any line of intelligence. We validate the discuss-relationship-media version; the rest is plausible but untested.",
    callout: "Honest guardrail: what's validated is watching AND discussing relationship media (Rogge et al.). Passively watching couples fight, watching divorce court, or watching weddings are NOT validated as intelligence interventions — treat them as untested hypotheses, not proven practices.",
    sources: [
      { cite: "Rogge, R. D., Cobb, R. J., Lawrence, E., Johnson, M. D., & Bradbury, T. N. (2013). Is skills training necessary for the primary prevention of marital distress and dissolution? A 3-year experimental study of three interventions for newlyweds. Journal of Consulting and Clinical Psychology, 81(6), 949–961.", note: "The landmark RCT: watching + discussing five relationship movies halved the divorce/separation rate, matching intensive skills programs. The one strongly-validated 'learn from other couples' intervention. [Strong — RCT]", link: scholar("Rogge Cobb Lawrence Johnson Bradbury 2013 is skills training necessary primary prevention marital distress three interventions newlyweds"), kind: "scholar" },
      { cite: "Hawkins, A. J., Blanchard, V. L., Baldwin, S. A., & Fawcett, E. B. (2008). Does marriage and relationship education work? A meta-analytic study. Journal of Consulting and Clinical Psychology, 76(5), 723–734.", note: "Meta-analysis: relationship education produces real gains in couples' communication quality and satisfaction — the broader evidence base the movie study sits within. [Moderate — meta-analysis]", link: scholar("Hawkins Blanchard Baldwin Fawcett 2008 does marriage and relationship education work meta-analytic study"), kind: "scholar" },
      { cite: "Gottman, J. M., & Levenson, R. W. (1992). Marital processes predictive of later dissolution: Behavior, physiology, and health. Journal of Personality and Social Psychology, 63(2), 221–233.", note: "The 'Love Lab' evidence that couples' conflict behavior is readable and predictive — the reason observing conflict is an information-rich (if untested-as-training) channel. [Moderate]", link: scholar("Gottman Levenson 1992 marital processes predictive of later dissolution behavior physiology health"), kind: "scholar" },
      { cite: "Bandura, A. (1977). Social Learning Theory. Prentice-Hall.", note: "The theoretical mechanism: people learn behaviors and their consequences by observing others (vicarious learning) — why watching other couples COULD teach, even where the specific practice is untested. [Moderate — foundational theory]", link: scholar("Bandura 1977 Social Learning Theory vicarious learning observation"), kind: "scholar" },
      { cite: "Páez, D., Rimé, B., Basabe, N., Wlodarczyk, A., & Zumeta, L. (2015). Psychosocial effects of perceived emotional synchrony in collective gatherings. Journal of Personality and Social Psychology, 108(5), 711–729.", note: "On the weddings/rituals question: collective ceremonies reliably build social bonding, shared identity, and self-transcendent emotion (awe) — real effects, but on BONDING and wellbeing, NOT on any measured line of intelligence. [Moderate — relevant boundary]", link: scholar("Paez Rime Basabe 2015 psychosocial effects perceived emotional synchrony collective gatherings"), kind: "scholar" },
    ],
  },
  {
    id: "couples-observational-science",
    section: "20",
    title: "The Observational Science of Couples — What Predicts Success",
    subtitle: "Bolsters clusters: interpersonal, empathic (marital)",
    evidenceTag: "Moderate",
    description:
      "Couples' behavior during conflict is readable enough to predict divorce years in advance — the science behind why watching how couples interact is information-rich. Gottman's lab predicted marital dissolution from short conflict discussions with striking accuracy, identifying specific patterns (contempt, criticism, defensiveness, stonewalling) that forecast failure and repair attempts that forecast success. This is what a trained observer learns to see.",
    callout: "This shows couple behavior is predictive and observable — the basis for learning by watching. It does not by itself prove that watching trains you; pair it with a discuss-and-practice method (see the media cluster).",
    sources: [
      { cite: "Gottman, J. M., Coan, J., Carrere, S., & Swanson, C. (1998). Predicting marital happiness and stability from newlywed interactions. Journal of Marriage and the Family, 60(1), 5–22.", note: "Predicted which newlyweds would thrive or divorce from patterns in their interaction — the readable signatures of a relationship. [Moderate]", link: scholar("Gottman Coan Carrere Swanson 1998 predicting marital happiness and stability from newlywed interactions"), kind: "scholar" },
      { cite: "Carrère, S., & Gottman, J. M. (1999). Predicting divorce among newlyweds from the first three minutes of a marital conflict discussion. Family Process, 38(3), 293–301.", note: "Divorce predicted from the FIRST THREE MINUTES of a conflict conversation — how quickly the pattern reveals itself. [Moderate]", link: scholar("Carrere Gottman 1999 predicting divorce among newlyweds first three minutes marital conflict discussion"), kind: "scholar" },
      { cite: "Gottman, J. M., & Levenson, R. W. (2000). The timing of divorce: Predicting when a couple will divorce over a 14-year period. Journal of Marriage and Family, 62(3), 737–745.", note: "Two distinct paths to divorce identified from interaction patterns tracked over 14 years — the long-run predictive validity. [Moderate]", link: scholar("Gottman Levenson 2000 timing of divorce predicting when a couple will divorce 14-year period"), kind: "scholar" },
      { cite: "Gottman, J. M., & Silver, N. (1999). The Seven Principles for Making Marriage Work. Crown.", note: "The applied translation of the lab findings into observable, learnable principles couples can watch for and practice. [Moderate — applied]", link: scholar("Gottman Silver 1999 seven principles for making marriage work"), kind: "scholar" },
    ],
  },
  {
    id: "couples-emotional-intelligence",
    section: "20",
    title: "Emotional Intelligence in Relationships",
    subtitle: "Bolsters clusters: empathic, interpersonal, intrapersonal",
    evidenceTag: "Moderate",
    description:
      "Emotional intelligence — perceiving, understanding, and regulating emotion — reliably tracks with relationship satisfaction and constructive conflict handling, and it can be developed. This is the individual-capacity side of the couples equation: partners higher in EI navigate conflict better and report more satisfying relationships.",
    callout: "The EI–satisfaction link is robust but correlational; EI supports better relationships, it doesn't single-handedly guarantee them.",
    sources: [
      { cite: "Mayer, J. D., Salovey, P., & Caruso, D. R. (2008). Emotional intelligence: New ability or eclectic traits? American Psychologist, 63(6), 503–517.", note: "The authoritative definition of emotional intelligence as a measurable ability — the construct behind the relationship findings. [Moderate — foundational]", link: "https://doi.org/10.1037/0003-066X.63.6.503", kind: "doi" },
      { cite: "Brackett, M. A., Rivers, S. E., & Salovey, P. (2011). Emotional intelligence: Implications for personal, social, academic, and workplace success. Social and Personality Psychology Compass, 5(1), 88–103.", note: "Reviews evidence that higher EI predicts better social relationships and outcomes across domains. [Moderate]", link: "https://doi.org/10.1111/j.1751-9004.2011.00334.x", kind: "doi" },
      { cite: "Malouff, J. M., Schutte, N. S., & Thorsteinsson, E. B. (2014). Trait emotional intelligence and romantic relationship satisfaction: A meta-analysis. American Journal of Family Therapy, 42(1), 53–66.", note: "Meta-analysis: higher trait EI is reliably associated with greater romantic relationship satisfaction. [Moderate — meta-analysis]", link: scholar("Malouff Schutte Thorsteinsson 2014 trait emotional intelligence romantic relationship satisfaction meta-analysis"), kind: "scholar" },
      { cite: "Schutte, N. S., Malouff, J. M., Bobik, C., et al. (2001). Emotional intelligence and interpersonal relations. Journal of Social Psychology, 141(4), 523–536.", note: "Links higher EI to warmer, more cooperative interpersonal relations — the relational payoff of the capacity. [Moderate]", link: scholar("Schutte Malouff Bobik 2001 emotional intelligence and interpersonal relations"), kind: "scholar" },
    ],
  },
  {
    id: "couples-empathy-training",
    section: "20",
    title: "Empathy & Perspective-Taking Are Trainable",
    subtitle: "Bolsters clusters: empathic, interpersonal",
    evidenceTag: "Moderate",
    description:
      "Empathy is not a fixed trait — a meta-analysis of randomized trials found that empathy training reliably increases empathy. Perspective-taking (deliberately imagining another's viewpoint) is the active mechanism, and it improves both understanding and prosocial behavior. This is the trainable capacity that couples-observation and relationship media are ultimately exercising.",
    callout: "Empathy training works on average, but effects vary by method and can fade without practice; treat it as a skill to maintain, not a one-time fix.",
    sources: [
      { cite: "Teding van Berkhout, E., & Malouff, J. M. (2016). The efficacy of empathy training: A meta-analysis of randomized controlled trials. Journal of Counseling Psychology, 63(1), 32–41.", note: "The key evidence: across RCTs, empathy training produced a moderate, reliable increase in empathy. [Moderate — meta-analysis of RCTs]", link: "https://doi.org/10.1037/cou0000093", kind: "doi" },
      { cite: "Galinsky, A. D., & Moskowitz, G. B. (2000). Perspective-taking: Decreasing stereotype expression, stereotype accessibility, and in-group favoritism. Journal of Personality and Social Psychology, 78(4), 708–724.", note: "Shows the active ingredient — deliberately taking another's perspective — measurably changes social cognition and reduces bias. [Moderate]", link: scholar("Galinsky Moskowitz 2000 perspective-taking decreasing stereotype expression accessibility in-group favoritism"), kind: "scholar" },
      { cite: "Batson, C. D., Early, S., & Salvarani, G. (1997). Perspective taking: Imagining how another feels versus imagining how you would feel. Personality and Social Psychology Bulletin, 23(7), 751–758.", note: "Distinguishes imagining another's feelings from imagining your own — refining how perspective-taking builds empathic accuracy. [Moderate]", link: scholar("Batson Early Salvarani 1997 perspective taking imagining how another feels versus how you would feel"), kind: "scholar" },
    ],
  },
  {
    id: "couples-relationship-education",
    section: "20",
    title: "Relationship Education — The Skills That Prevent Distress",
    subtitle: "Bolsters clusters: interpersonal, intrapersonal (marital)",
    evidenceTag: "Moderate",
    description:
      "Beyond the movie study, a broader evidence base shows structured relationship education improves couples' communication and lowers the risk of distress — especially communication and conflict-management skills practiced over time. This is the 'training' half of the platform's model applied to the marital line.",
    callout: "Effects are real but modest and strongest for higher-risk couples; skills fade without practice, and education is prevention, not a cure for a failing relationship.",
    sources: [
      { cite: "Markman, H. J., Renick, M. J., Floyd, F. J., Stanley, S. M., & Clements, M. (1993). Preventing marital distress through communication and conflict management training: A 4- and 5-year follow-up. Journal of Consulting and Clinical Psychology, 61(1), 70–77.", note: "The PREP program's long-run evidence: communication/conflict training reduced later marital distress and dissolution. [Moderate]", link: scholar("Markman Renick Floyd Stanley Clements 1993 preventing marital distress communication conflict management training follow-up"), kind: "scholar" },
      { cite: "Blanchard, V. L., Hawkins, A. J., Baldwin, S. A., & Fawcett, E. B. (2009). Investigating the effects of marriage and relationship education on couples' communication skills: A meta-analytic study. Journal of Family Psychology, 23(2), 203–214.", note: "Meta-analysis isolating the communication-skill gains from relationship education — the measurable mechanism. [Moderate — meta-analysis]", link: scholar("Blanchard Hawkins Baldwin Fawcett 2009 effects of marriage and relationship education couples communication skills meta-analytic"), kind: "scholar" },
      { cite: "Halford, W. K., Markman, H. J., Kline, G. H., & Stanley, S. M. (2003). Best practice in couple relationship education. Journal of Marital and Family Therapy, 29(3), 385–406.", note: "Synthesizes what makes relationship education actually work — dosage, timing, and targeting higher-risk couples. [Moderate]", link: scholar("Halford Markman Kline Stanley 2003 best practice in couple relationship education"), kind: "scholar" },
    ],
  },
  {
    id: "parenting-intelligence",
    section: "20",
    title: "Parenting Intelligence — What Actually Works",
    subtitle: "Bolsters clusters: intrapersonal, empathic, interpersonal (parental)",
    evidenceTag: "Moderate",
    description:
      "Parenting skill is trainable, and the effective ingredients are known. Meta-analyses of parent-training programs identify the components that reliably improve child outcomes — notably teaching parents emotional communication, positive interaction, and consistent practice with their own child. Authoritative parenting (warm and structured) is the style most consistently linked to healthy development.",
    callout: "The components are well-evidenced, but programs work best when parents PRACTICE with their own child, not just learn concepts; watching or reading alone is weaker than doing.",
    sources: [
      { cite: "Kaminski, J. W., Valle, L. A., Filene, J. H., & Boyle, C. L. (2008). A meta-analytic review of components associated with parent training program effectiveness. Journal of Abnormal Child Psychology, 36(4), 567–589.", note: "Isolates the active ingredients of parent training — emotional communication, positive interaction, and practicing new skills with one's own child. [Moderate — meta-analysis]", link: "https://doi.org/10.1007/s10802-007-9201-9", kind: "doi" },
      { cite: "Sanders, M. R., Kirby, J. N., Tellegen, C. L., & Day, J. J. (2014). The Triple P-Positive Parenting Program: A systematic review and meta-analysis of a multi-level system of parenting support. Clinical Psychology Review, 34(4), 337–357.", note: "Large systematic review/meta-analysis of a leading parenting program showing reliable improvements in child and parent outcomes. [Moderate — meta-analysis]", link: scholar("Sanders Kirby Tellegen Day 2014 Triple P Positive Parenting Program systematic review meta-analysis"), kind: "scholar" },
      { cite: "Baumrind, D. (1991). The influence of parenting style on adolescent competence and substance use. Journal of Early Adolescence, 11(1), 56–95.", note: "The foundational parenting-styles work: authoritative (warm + structured) parenting linked to the best adolescent outcomes. [Moderate — foundational]", link: scholar("Baumrind 1991 influence of parenting style on adolescent competence and substance use"), kind: "scholar" },
    ],
  },
  {
    id: "couples-social-learning",
    section: "20",
    title: "How We Learn by Watching — Social Learning",
    subtitle: "Bolsters clusters: the mechanism under all of the above",
    evidenceTag: "Moderate",
    description:
      "The reason watching others can teach at all: humans learn behaviors, and their consequences, by observing models — vicarious learning. Classic experiments show observed behavior is imitated, and emotions transfer between people (emotional contagion). This is the mechanism that makes 'learning from other couples' plausible — while reminding us that observation without practice is a weaker teacher than doing.",
    callout: "Observation genuinely teaches — but modeling is strongest when paired with attention, retention, and REHEARSAL. Passive watching alone is the weak form of this mechanism.",
    sources: [
      { cite: "Bandura, A., Ross, D., & Ross, S. A. (1961). Transmission of aggression through imitation of aggressive models. Journal of Abnormal and Social Psychology, 63(3), 575–582.", note: "The famous 'Bobo doll' experiment: children imitated behavior they merely observed — the empirical root of observational learning. [Moderate — foundational]", link: "https://doi.org/10.1037/h0045925", kind: "doi" },
      { cite: "Hatfield, E., Cacioppo, J. T., & Rapson, R. L. (1993). Emotional contagion. Current Directions in Psychological Science, 2(3), 96–100.", note: "Establishes that people automatically 'catch' others' emotions — why watching emotional interactions moves us and can shape our own patterns. [Moderate]", link: scholar("Hatfield Cacioppo Rapson 1993 emotional contagion current directions psychological science"), kind: "scholar" },
      { cite: "Bandura, A. (1986). Social Foundations of Thought and Action: A Social Cognitive Theory. Prentice-Hall.", note: "The mature statement of social cognitive theory: the four sub-processes (attention, retention, reproduction, motivation) that make observation into real learning. [Moderate — foundational]", link: scholar("Bandura 1986 social foundations of thought and action social cognitive theory"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 21 — KNOWING vs. DOING: MAKING IT STICK ═══════════════
  // The universal bottleneck. Most people already KNOW the answer (save money, quit
  // smoking, listen to your spouse) — they fail to IMPLEMENT it. This is the science
  // of closing that gap, and it's why the platform prescribes if-then plans, habit
  // stacking, and tracking on top of every recommendation. Strong evidence.
  {
    id: "knowing-doing-gap",
    section: "21",
    title: "The Knowing–Doing Gap Is the Real Enemy",
    subtitle: "Bolsters clusters: volitional, self-regulation, follow-through",
    evidenceTag: "Strong",
    description:
      "Knowing what to do rarely changes behavior — the gap between intention and action is where most self-improvement dies. The good news: that gap has a well-studied fix. Implementation intentions ('if situation X, then I'll do Y') reliably convert goals into action across dozens of studies, and habits form with repetition in a predictable window. This is why every prescription on this platform is paired with an if-then plan, a habit to stack it onto, and a way to track it — we intervene on the DOING, not just the knowing.",
    callout: "This is the section that makes the others work. A brilliant prescription you don't implement changes nothing; an if-then plan is the difference between reading and doing.",
    sources: [
      { cite: "Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist, 54(7), 493–503.", note: "The foundational finding: forming a specific 'if-then' plan dramatically increases the odds you actually enact a goal. [Strong — foundational]", link: "https://doi.org/10.1037/0003-066X.54.7.493", kind: "doi" },
      { cite: "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69–119.", note: "The meta-analysis across 90+ studies: implementation intentions have a medium-to-large effect on goal attainment. The core evidence that planning-the-when-and-where works. [Strong — meta-analysis]", link: scholar("Gollwitzer Sheeran 2006 implementation intentions and goal achievement meta-analysis of effects and processes"), kind: "scholar" },
      { cite: "Sheeran, P., & Webb, T. L. (2016). The intention–behavior gap. Social and Personality Psychology Compass, 10(9), 503–518.", note: "The definitive review of WHY intentions so often fail to become action — and what closes the gap. Names the exact problem the platform is built to solve. [Strong — review]", link: "https://doi.org/10.1111/spc3.12265", kind: "doi" },
      { cite: "Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998–1009.", note: "The real-world habit-formation study: automaticity took a MEDIAN of ~66 days (range 18–254) — realistic expectations for how long to hold a new behavior. [Strong]", link: "https://doi.org/10.1002/ejsp.674", kind: "doi" },
      { cite: "Wood, W., & Neal, D. T. (2007). A new look at habits and the habit–goal interface. Psychological Review, 114(4), 843–863.", note: "The theory of how habits become automatic and context-cued — why stacking a new behavior onto an existing cue makes it stick. [Strong]", link: scholar("Wood Neal 2007 a new look at habits and the habit-goal interface psychological review"), kind: "scholar" },
      { cite: "Rogers, T., Milkman, K. L., John, L. K., & Norton, M. I. (2015). Beyond good intentions: Prompting people to make plans improves follow-through. Behavioral Science & Policy, 1(2), 33–41.", note: "Field evidence that simply prompting people to make a concrete plan measurably improves follow-through on their intentions. [Moderate — applied field]", link: scholar("Rogers Milkman John Norton 2015 beyond good intentions prompting people to make plans improves follow-through"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 22 — INTERMITTENT FASTING & TIME-RESTRICTED EATING ═══════════════
  {
    id: "fasting-tre",
    section: "22",
    title: "Intermittent Fasting & Time-Restricted Eating",
    subtitle: "Bolsters clusters: interoceptive, volitional, systemic (metabolic)",
    evidenceTag: "Moderate",
    description:
      "Confining eating to a compressed daily window (or fasting on some days) drives 'metabolic switching' (glucose→ketones) and circadian alignment. Real metabolic and blood-pressure effects exist — but in humans most weight benefit tracks the calorie deficit it creates, and the marquee autophagy/longevity/BDNF claims rest largely on animal data.",
    callout: "Honest limit: the largest weight-loss RCT of 16:8 (TREAT) was null vs. regular meals, and human autophagy/longevity claims are extrapolated from animals. Treat fasting as one workable eating pattern, not a magic switch.",
    sources: [
      { cite: "de Cabo, R., & Mattson, M. P. (2019). Effects of intermittent fasting on health, aging, and disease. New England Journal of Medicine, 381(26), 2541–2551.", note: "Landmark review framing metabolic switching, stress resistance, and (largely animal-derived) autophagy/neuroprotection. [Moderate — review]", link: scholar("de Cabo Mattson effects of intermittent fasting on health aging and disease NEJM 2019"), kind: "scholar" },
      { cite: "Sutton, E. F., et al. (2018). Early time-restricted feeding improves insulin sensitivity, blood pressure, and oxidative stress even without weight loss in men with prediabetes. Cell Metabolism, 27(6), 1212–1221.", note: "Crossover RCT: a 6-hour early eating window improved insulin sensitivity and blood pressure independent of weight loss. [Strong]", link: scholar("Sutton Peterson early time-restricted feeding insulin sensitivity prediabetes Cell Metabolism 2018"), kind: "scholar" },
      { cite: "Wilkinson, M. J., et al. (2020). Ten-hour time-restricted eating reduces weight, blood pressure, and atherogenic lipids in patients with metabolic syndrome. Cell Metabolism, 31(1), 92–104.", note: "A 10-hour window over 12 weeks lowered weight, waist, BP and atherogenic lipids in metabolic-syndrome patients (single-arm). [Moderate]", link: scholar("Wilkinson Panda ten-hour time-restricted eating metabolic syndrome Cell Metabolism 2020"), kind: "scholar" },
      { cite: "Lowe, D. A., et al. (2020). Effects of time-restricted eating on weight loss and other metabolic parameters (TREAT randomized clinical trial). JAMA Internal Medicine, 180(11), 1491–1499.", note: "The honest counterweight: 16:8 produced NO significant weight or cardiometabolic advantage over consistent meals. [Strong — null RCT]", link: scholar("Lowe TREAT randomized clinical trial time-restricted eating JAMA Internal Medicine 2020"), kind: "scholar" },
      { cite: "Moon, S., et al. (2020). Beneficial effects of time-restricted eating on metabolic diseases: a systematic review and meta-analysis. Nutrients, 12(5), 1267.", note: "Meta-analysis of RCTs: TRE modestly reduced body weight and improved some metabolic markers. [Moderate — meta-analysis]", link: scholar("Moon beneficial effects time-restricted eating metabolic diseases systematic review meta-analysis Nutrients 2020"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 23 — LIGHT & CIRCADIAN RHYTHM ═══════════════
  {
    id: "light-circadian",
    section: "23",
    title: "Light & Circadian Rhythm",
    subtitle: "Bolsters clusters: interoceptive, emotional, intrapersonal",
    evidenceTag: "Moderate",
    description:
      "Getting bright light (ideally morning sunlight) and minimizing light at night entrains the circadian clock. Best-established for mood — bright-light therapy rivals antidepressants for seasonal and non-seasonal depression — with solid effects on sleep and alertness, and weaker, mostly observational links to metabolism.",
    callout: "Light therapy for depression and circadian entrainment are RCT-backed; the metabolic/weight claims are correlational, and much popular advice about exact lux and timing outruns the controlled evidence.",
    sources: [
      { cite: "Golden, R. N., et al. (2005). The efficacy of light therapy in the treatment of mood disorders: a review and meta-analysis of the evidence. American Journal of Psychiatry, 162(4), 656–662.", note: "Meta-analysis: bright-light and dawn-simulation produced effect sizes comparable to antidepressant drugs for SAD and non-seasonal depression. [Strong — meta-analysis]", link: scholar("Golden efficacy of light therapy treatment of mood disorders review meta-analysis American Journal of Psychiatry 2005"), kind: "scholar" },
      { cite: "Lam, R. W., et al. (2016). Efficacy of bright light treatment, fluoxetine, and the combination in patients with nonseasonal major depressive disorder: a randomized clinical trial. JAMA Psychiatry, 73(1), 56–63.", note: "RCT: morning 10,000-lux light (especially with fluoxetine) beat placebo for non-seasonal major depression. [Strong]", link: scholar("Lam bright light fluoxetine nonseasonal major depressive disorder randomized clinical trial JAMA Psychiatry 2016"), kind: "scholar" },
      { cite: "Blume, C., Garbazza, C., & Spitschan, M. (2019). Effects of light on human circadian rhythms, sleep and mood. Somnologie, 23(3), 147–156.", note: "Review of how light timing, intensity and spectrum entrain the clock and shape sleep, alertness and mood via ipRGCs. [Moderate — review]", link: scholar("Blume Garbazza Spitschan effects of light on human circadian rhythms sleep and mood Somnologie 2019"), kind: "scholar" },
      { cite: "Burns, A. C., et al. (2023). Day and night light exposure are associated with psychiatric disorders: an objective light study in >85,000 people. Nature Mental Health, 1, 853–862.", note: "UK Biobank: more daytime light → lower risk; more night light → higher risk across depression, anxiety, PTSD, psychosis. [Moderate — cross-sectional]", link: scholar("Burns day and night light exposure psychiatric disorders UK Biobank Nature Mental Health 2023"), kind: "scholar" },
      { cite: "Reid, K. J., et al. (2014). Timing and intensity of light correlate with body weight in adults. PLOS ONE, 9(4), e92251.", note: "Actigraphy cohort: earlier daily bright-light exposure independently associated with lower BMI. [Emerging — observational]", link: scholar("Reid Zee timing and intensity of light correlate with body weight in adults PLOS ONE 2014"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 24 — CARDIORESPIRATORY FITNESS (VO₂max) ═══════════════
  {
    id: "vo2max-fitness",
    section: "24",
    title: "Cardiorespiratory Fitness — VO₂max",
    subtitle: "Bolsters clusters: interoceptive, volitional, systemic, most cognitive lines",
    evidenceTag: "Strong",
    description:
      "VO₂max / cardiorespiratory fitness is among the strongest modifiable predictors of all-cause mortality and cognition anywhere in this library. The mortality gradient is steep, dose-dependent, and shows no upper limit — improving your fitness is one of the best-evidenced longevity 'levers' known.",
    callout: "The mortality data are observational (fit people differ in many ways), so they prove a robust association, not a clean causal death-rate reduction. But RCTs confirm exercise raises both fitness and cognition — the practice is as close to a sure thing as this library contains.",
    sources: [
      { cite: "Mandsager, K., et al. (2018). Association of cardiorespiratory fitness with long-term mortality among adults undergoing exercise treadmill testing. JAMA Network Open, 1(6), e183605.", note: "122,007-patient cohort: fitness inversely related to mortality with no upper limit — 'elite' fitness ~80% lower risk vs. the least fit. [Strong]", link: scholar("Mandsager association of cardiorespiratory fitness with long-term mortality exercise treadmill testing JAMA Network Open 2018"), kind: "scholar" },
      { cite: "Kodama, S., et al. (2009). Cardiorespiratory fitness as a quantitative predictor of all-cause mortality and cardiovascular events in healthy men and women: a meta-analysis. JAMA, 301(19), 2024–2035.", note: "Each 1-MET higher fitness ≈ 13% lower all-cause mortality and 15% lower cardiovascular events. [Strong — meta-analysis]", link: scholar("Kodama cardiorespiratory fitness quantitative predictor all-cause mortality cardiovascular events meta-analysis JAMA 2009"), kind: "scholar" },
      { cite: "Blair, S. N., et al. (1989). Physical fitness and all-cause mortality: a prospective study of healthy men and women. JAMA, 262(17), 2395–2401.", note: "Foundational cohort (13,344 adults): a steep mortality gradient across treadmill-fitness quintiles in both sexes. [Strong — foundational]", link: scholar("Blair physical fitness and all-cause mortality prospective study healthy men and women JAMA 1989"), kind: "scholar" },
      { cite: "Ross, R., et al. (2016). Importance of assessing cardiorespiratory fitness in clinical practice: a case for fitness as a clinical vital sign — AHA scientific statement. Circulation, 134(24), e653–e699.", note: "American Heart Association argues fitness is an independent risk marker that should be measured like a vital sign. [Strong — consensus statement]", link: scholar("Ross importance of assessing cardiorespiratory fitness clinical vital sign scientific statement American Heart Association Circulation 2016"), kind: "scholar" },
      { cite: "Northey, J. M., et al. (2018). Exercise interventions for cognitive function in adults older than 50: a systematic review with meta-analysis. British Journal of Sports Medicine, 52(3), 154–160.", note: "Meta-analysis of RCTs: aerobic + resistance exercise significantly improved cognition (SMD 0.29) in adults over 50. [Strong — meta-analysis]", link: scholar("Northey exercise interventions for cognitive function in adults older than 50 systematic review meta-analysis British Journal of Sports Medicine 2018"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 25 — THE GUT–BRAIN AXIS ═══════════════
  {
    id: "gut-brain-axis",
    section: "25",
    title: "The Gut–Brain Axis",
    subtitle: "Bolsters clusters: emotional, interoceptive, intrapersonal",
    evidenceTag: "Emerging",
    description:
      "Diet (fermented foods, fiber), probiotics, and microbiome composition influence mood, anxiety and cognition via immune, vagal and metabolite (short-chain-fatty-acid, neurotransmitter) pathways. A genuine, fast-moving field — with a landmark RCT showing fermented foods raise microbiome diversity and lower inflammation — but clinically still early.",
    callout: "Human causal evidence is thin: most depression/microbiome links are cross-sectional (reverse causation unresolved), probiotic effects are small and strain-specific, and no 'psychobiotic' is an established treatment. Promising, not proven.",
    sources: [
      { cite: "Cryan, J. F., et al. (2019). The microbiota-gut-brain axis. Physiological Reviews, 99(4), 1877–2013.", note: "Definitive review of the bidirectional pathways (vagus, immune, tryptophan, SCFAs) linking microbiota to brain and behavior. [Moderate — review]", link: scholar("Cryan Dinan the microbiota-gut-brain axis Physiological Reviews 2019"), kind: "scholar" },
      { cite: "Wastyk, H. C., et al. (2021). Gut-microbiota-targeted diets modulate human immune status. Cell, 184(16), 4137–4153.", note: "Stanford RCT: a fermented-food diet raised microbiome diversity and lowered 19 inflammatory markers; a high-fiber diet did not. [Moderate — RCT]", link: scholar("Wastyk Sonnenburg Gardner gut-microbiota-targeted diets modulate human immune status fermented foods Cell 2021"), kind: "scholar" },
      { cite: "Tillisch, K., et al. (2013). Consumption of fermented milk product with probiotic modulates brain activity. Gastroenterology, 144(7), 1394–1401.", note: "Small RCT: four weeks of probiotic fermented milk altered fMRI brain responses to an emotional task in healthy women. [Emerging]", link: scholar("Tillisch Mayer consumption of fermented milk product with probiotic modulates brain activity Gastroenterology 2013"), kind: "scholar" },
      { cite: "Valles-Colomer, M., et al. (2019). The neuroactive potential of the human gut microbiota in quality of life and depression. Nature Microbiology, 4(4), 623–632.", note: "Two large cohorts (~2,100): specific microbes depleted in depression; microbial dopamine/GABA pathways linked to mental quality of life (correlational). [Moderate]", link: scholar("Valles-Colomer neuroactive potential of the human gut microbiota in quality of life and depression Nature Microbiology 2019"), kind: "scholar" },
      { cite: "Liu, R. T., Walsh, R. F. L., & Sheehan, A. E. (2019). Prebiotics and probiotics for depression and anxiety: a systematic review and meta-analysis of controlled clinical trials. Neuroscience & Biobehavioral Reviews, 102, 13–23.", note: "Meta-analysis of 34 trials: probiotics gave small but significant benefits for depression/anxiety; prebiotics did not beat placebo. [Moderate — meta-analysis]", link: scholar("Liu Walsh Sheehan prebiotics and probiotics for depression and anxiety systematic review meta-analysis Neuroscience Biobehavioral Reviews 2019"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 26 — NUTRITION FOR THE BRAIN ═══════════════
  {
    id: "brain-nutrition",
    section: "26",
    title: "Nutrition for the Brain",
    subtitle: "Bolsters clusters: most cognitive lines, meta-cognitive, interoceptive",
    evidenceTag: "Moderate",
    description:
      "Dietary patterns (MIND / Mediterranean), omega-3 DHA, and even hydration status are linked to cognition and dementia risk. Strong observational signal plus one positive Mediterranean-diet RCT (PREDIMED); the diet slows and associates with decline rather than curing it.",
    callout: "Most robust data are observational; randomized DHA-supplement trials in established Alzheimer's have generally FAILED to slow decline, and no diet has been proven to prevent dementia. Eat for the trend, not a guarantee.",
    sources: [
      { cite: "Morris, M. C., et al. (2015). MIND diet slows cognitive decline with aging. Alzheimer's & Dementia, 11(9), 1015–1022.", note: "Higher MIND-diet adherence tracked with slower cognitive decline over ~4.7 years — equivalent to being 7.5 years younger. [Moderate — cohort]", link: scholar("Morris 2015 MIND diet slows cognitive decline with aging Alzheimer's Dementia"), kind: "scholar" },
      { cite: "Morris, M. C., et al. (2015). MIND diet associated with reduced incidence of Alzheimer's disease. Alzheimer's & Dementia, 11(9), 1007–1014.", note: "High MIND adherence associated with 53% lower Alzheimer's incidence; even moderate adherence ~35% lower. [Moderate — cohort]", link: scholar("Morris 2015 MIND diet associated with reduced incidence Alzheimer's disease"), kind: "scholar" },
      { cite: "Valls-Pedret, C., et al. (2015). Mediterranean diet and age-related cognitive decline: a randomized clinical trial. JAMA Internal Medicine, 175(7), 1094–1103.", note: "In the PREDIMED RCT, a Mediterranean diet with olive oil or nuts improved cognition vs. a low-fat control over ~4 years. [Strong — RCT]", link: scholar("Valls-Pedret 2015 Mediterranean diet age-related cognitive decline randomized clinical trial JAMA Internal Medicine"), kind: "scholar" },
      { cite: "Yurko-Mauro, K., et al. (2010). Beneficial effects of docosahexaenoic acid on cognition in age-related cognitive decline (MIDAS). Alzheimer's & Dementia, 6(6), 456–464.", note: "900 mg/day DHA for 24 weeks improved learning and episodic memory in healthy older adults with mild memory complaints. [Moderate — RCT, healthy elderly]", link: scholar("Yurko-Mauro 2010 docosahexaenoic acid cognition age-related cognitive decline MIDAS"), kind: "scholar" },
      { cite: "Adan, A. (2012). Cognitive performance and dehydration. Journal of the American College of Nutrition, 31(2), 71–78.", note: "Review: mild dehydration (~2% body mass) impairs attention, psychomotor speed, and short-term memory. [Moderate — review]", link: scholar("Adan 2012 Cognitive Performance and Dehydration Journal American College Nutrition"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 27 — MUSIC TRAINING ═══════════════
  {
    id: "music-training",
    section: "27",
    title: "Learning an Instrument",
    subtitle: "Bolsters clusters: musical, bodily-kinesthetic, meta-cognitive, auditory",
    evidenceTag: "Moderate",
    description:
      "Learning an instrument reliably produces structural and functional brain change and near-transfer to auditory-motor skills, with a small IQ effect in the one clean childhood RCT. Broad 'music makes you smarter' claims are weaker and shrink under rigorous controls.",
    callout: "Far transfer is the honest weak point: a rigorous meta-analysis (Sala & Gobet) finds little-to-no reliable transfer from music training to general IQ or academics once active control groups are used. Learn music for music — the brain changes are a bonus, not a cognitive shortcut.",
    sources: [
      { cite: "Schellenberg, E. G. (2004). Music lessons enhance IQ. Psychological Science, 15(8), 511–514.", note: "RCT: 6-year-olds randomized to keyboard/voice lessons gained ~2.7 more full-scale IQ points than drama/no-lesson controls. [Strong — small RCT]", link: scholar("Schellenberg 2004 Music Lessons Enhance IQ Psychological Science"), kind: "scholar" },
      { cite: "Hyde, K. L., et al. (2009). Musical training shapes structural brain development. Journal of Neuroscience, 29(10), 3019–3025.", note: "Longitudinal: 15 months of keyboard lessons in children produced measurable structural brain change correlated with skill gains. [Strong — longitudinal, controlled]", link: scholar("Hyde 2009 Musical Training Shapes Structural Brain Development Journal of Neuroscience"), kind: "scholar" },
      { cite: "Gaser, C., & Schlaug, G. (2003). Brain structures differ between musicians and non-musicians. Journal of Neuroscience, 23(27), 9240–9245.", note: "Gray-matter volume in motor, auditory and visuospatial regions was greater in professional than amateur than non-musicians. [Moderate — cross-sectional]", link: scholar("Gaser Schlaug 2003 Brain Structures Differ between Musicians and Non-Musicians"), kind: "scholar" },
      { cite: "Bugos, J. A., et al. (2007). Individualized piano instruction enhances executive functioning and working memory in older adults. Aging & Mental Health, 11(4), 464–471.", note: "RCT: six months of piano lessons improved Trail-Making and Digit-Symbol performance in adults 60–85 vs. controls. [Moderate — small RCT]", link: scholar("Bugos 2007 Individualized Piano Instruction executive functioning working memory older adults"), kind: "scholar" },
      { cite: "Sala, G., & Gobet, F. (2017). When the music's over. Does music skill transfer to children's and young adolescents' cognitive and academic skills? A meta-analysis. Educational Research Review, 20, 55–67.", note: "The honest counterweight: overall far-transfer effect was tiny (d≈0.16) and shrank toward zero with active control groups. [Strong — skeptical meta-analysis]", link: scholar("Sala Gobet 2017 When the music's over music skill transfer meta-analysis Educational Research Review"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 28 — BILINGUALISM & LANGUAGE LEARNING ═══════════════
  {
    id: "bilingualism",
    section: "28",
    title: "Bilingualism & Language Learning",
    subtitle: "Bolsters clusters: linguistic, meta-cognitive (cognitive reserve)",
    evidenceTag: "Emerging",
    description:
      "Lifelong bilingualism is associated with a later age of dementia onset (the cognitive-reserve hypothesis), with large clinic cohorts showing a ~4–4.5 year delay even controlling for education. The once-popular 'bilingual executive-function advantage' in healthy adults, however, is now seriously contested.",
    callout: "This is the field's honest scandal: the healthy-adult bilingual advantage has largely FAILED to replicate, shows strong publication bias, and near-null meta-analytic effects. The dementia-delay findings are retrospective and could be confounded — learn a language for its own sake, not a guaranteed brain boost.",
    sources: [
      { cite: "Bialystok, E., Craik, F. I. M., & Freedman, M. (2007). Bilingualism as a protection against the onset of symptoms of dementia. Neuropsychologia, 45(2), 459–464.", note: "Retrospective clinic sample: bilinguals showed dementia symptoms ~4 years later than monolinguals. [Moderate — retrospective, confound-prone]", link: scholar("Bialystok Craik Freedman 2007 Bilingualism protection onset symptoms dementia Neuropsychologia"), kind: "scholar" },
      { cite: "Alladi, S., et al. (2013). Bilingualism delays age at onset of dementia, independent of education and immigration status. Neurology, 81(22), 1938–1944.", note: "Large Indian cohort (n=648): bilinguals developed dementia ~4.5 years later, even in illiterate patients. [Moderate — strong confound controls]", link: scholar("Alladi 2013 Bilingualism delays age at onset of dementia independent of education immigration Neurology"), kind: "scholar" },
      { cite: "Paap, K. R., & Greenberg, Z. I. (2013). There is no coherent evidence for a bilingual advantage in executive processing. Cognitive Psychology, 66(2), 232–258.", note: "Across three studies and many measures, bilinguals showed no consistent executive-function advantage. [Strong — skeptical/null]", link: scholar("Paap Greenberg 2013 no coherent evidence bilingual advantage executive processing Cognitive Psychology"), kind: "scholar" },
      { cite: "de Bruin, A., Treccani, B., & Della Sala, S. (2015). Cognitive advantage in bilingualism: an example of publication bias? Psychological Science, 26(1), 99–107.", note: "Studies supporting a bilingual advantage were far more likely to be published than null/negative ones. [Strong — publication-bias evidence]", link: scholar("de Bruin Treccani Della Sala 2015 Cognitive Advantage in Bilingualism publication bias Psychological Science"), kind: "scholar" },
      { cite: "Lehtonen, M., et al. (2018). Is bilingualism associated with enhanced executive functioning in adults? A meta-analytic review. Psychological Bulletin, 144(4), 394–425.", note: "Meta-analysis of 152 studies: tiny advantages vanished after correcting for publication bias — no reliable adult benefit. [Strong — meta-analysis, null]", link: scholar("Lehtonen 2018 Is Bilingualism Associated With Enhanced Executive Functioning Adults Meta-Analytic Review Psychological Bulletin"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 29 — EXPRESSIVE WRITING & JOURNALING ═══════════════
  {
    id: "expressive-writing",
    section: "29",
    title: "Expressive Writing & Journaling",
    subtitle: "Bolsters clusters: intrapersonal, emotional, linguistic",
    evidenceTag: "Moderate",
    description:
      "The Pennebaker paradigm — writing 15–20 minutes about emotional or traumatic events over several days — yields small but replicated benefits to physical health, immune markers, and even working-memory capacity. It is one of the cheapest interventions with real controlled evidence behind it.",
    callout: "Effects are real but SMALL and heterogeneous (the largest meta-analysis puts r≈.075), inconsistent in clinical populations, and the writing reliably causes short-term distress spikes. It is a tool, not a substitute for therapy.",
    sources: [
      { cite: "Pennebaker, J. W., & Beall, S. K. (1986). Confronting a traumatic event: toward an understanding of inhibition and disease. Journal of Abnormal Psychology, 95(3), 274–281.", note: "Founding study: writing about trauma raised short-term distress but cut health-center visits over the next six months. [Moderate — foundational]", link: scholar("Pennebaker Beall 1986 Confronting a traumatic event inhibition and disease Journal of Abnormal Psychology"), kind: "scholar" },
      { cite: "Pennebaker, J. W., Kiecolt-Glaser, J. K., & Glaser, R. (1988). Disclosure of traumas and immune function: health implications for psychotherapy. Journal of Consulting and Clinical Psychology, 56(2), 239–245.", note: "Emotional-disclosure writing improved cellular immune-function measures and lowered health-center visits vs. controls. [Moderate — RCT, immune outcomes]", link: scholar("Pennebaker Kiecolt-Glaser Glaser 1988 Disclosure of Traumas and Immune Function"), kind: "scholar" },
      { cite: "Klein, K., & Boals, A. (2001). Expressive writing can increase working memory capacity. Journal of Experimental Psychology: General, 130(3), 520–533.", note: "Two studies: writing about emotional experiences raised working-memory capacity and reduced intrusive thoughts weeks later. [Moderate]", link: scholar("Klein Boals 2001 Expressive Writing Can Increase Working Memory Capacity Journal of Experimental Psychology General"), kind: "scholar" },
      { cite: "Smyth, J. M. (1998). Written emotional expression: effect sizes, outcome types, and moderating variables. Journal of Consulting and Clinical Psychology, 66(1), 174–184.", note: "Meta-analysis (13 studies): overall d≈.47 improvement across physical health, well-being, and functioning in healthy participants. [Strong — meta-analysis]", link: scholar("Smyth 1998 Written emotional expression effect sizes outcome types moderating variables"), kind: "scholar" },
      { cite: "Frattaroli, J. (2006). Experimental disclosure and its moderators: a meta-analysis. Psychological Bulletin, 132(6), 823–865.", note: "The larger meta-analysis (146 RCTs): disclosure works, but the average effect is small (r≈.075). [Strong — tempers the effect size]", link: scholar("Frattaroli 2006 Experimental disclosure and its moderators a meta-analysis Psychological Bulletin"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 30 — GRATITUDE ═══════════════
  {
    id: "gratitude",
    section: "30",
    title: "Gratitude Practice",
    subtitle: "Bolsters clusters: emotional, intrapersonal, interpersonal",
    evidenceTag: "Moderate",
    description:
      "Deliberately noticing and recording what you are thankful for has robust links to positive affect and better sleep, from the landmark Emmons & McCullough experiments onward. The clinical effects on depression and anxiety are real but small once active control conditions are used.",
    callout: "The honest caveat: benefits shrink sharply when gratitude is compared to an active alternative activity rather than a no-treatment or 'list your hassles' control, and small-trial publication bias likely inflates the reported effects.",
    sources: [
      { cite: "Emmons, R. A., & McCullough, M. E. (2003). Counting blessings versus burdens: an experimental investigation of gratitude and subjective well-being in daily life. Journal of Personality and Social Psychology, 84(2), 377–389.", note: "Landmark RCT: weekly/daily gratitude lists raised positive affect and some well-being/health measures vs. hassles and neutral controls. [Strong — landmark]", link: scholar("Emmons McCullough 2003 counting blessings versus burdens gratitude subjective well-being"), kind: "scholar" },
      { cite: "Wood, A. M., Joseph, S., Lloyd, J., & Atkins, S. (2009). Gratitude influences sleep through the mechanism of pre-sleep cognitions. Journal of Psychosomatic Research, 66(1), 43–48.", note: "Trait gratitude predicted better sleep, mediated by more positive and fewer negative pre-sleep thoughts. [Moderate — mediation]", link: scholar("Wood Joseph Lloyd Atkins 2009 gratitude influences sleep pre-sleep cognitions"), kind: "scholar" },
      { cite: "Wood, A. M., Froh, J. J., & Geraghty, A. W. A. (2010). Gratitude and well-being: a review and theoretical integration. Clinical Psychology Review, 30(7), 890–905.", note: "Review concluding gratitude is strongly, possibly causally, related to well-being across relationships, health, and meaning. [Moderate — review]", link: scholar("Wood Froh Geraghty 2010 gratitude well-being review theoretical integration"), kind: "scholar" },
      { cite: "Davis, D. E., et al. (2016). Thankful for the little things: a meta-analysis of gratitude interventions. Journal of Counseling Psychology, 63(1), 20–31.", note: "Gratitude interventions beat measurement-only controls but showed little advantage over alternative-activity conditions. [Strong — meta-analysis]", link: scholar("Davis Choe Meyers 2016 thankful for the little things meta-analysis gratitude interventions"), kind: "scholar" },
      { cite: "Cregg, D. R., & Cheavens, J. S. (2021). Gratitude interventions: effective self-help? A meta-analysis of the impact on symptoms of depression and anxiety. Journal of Happiness Studies, 22(1), 413–445.", note: "Across 27 studies (N=3,675): a small significant effect on combined depression/anxiety, and no significant effect on anxiety alone. [Strong — meta-analysis]", link: scholar("Cregg Cheavens 2021 gratitude interventions effective self-help meta-analysis depression anxiety"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 31 — AWE ═══════════════
  {
    id: "awe",
    section: "31",
    title: "Awe",
    subtitle: "Bolsters clusters: existential, moral, interpersonal, aesthetic",
    evidenceTag: "Moderate",
    description:
      "The emotion evoked by vast, perspective-shifting stimuli — a mountain range, a cathedral, a night sky. Experimental and dispositional evidence links awe to a diminished 'small self,' greater generosity and humility, and (more preliminarily) lower inflammation.",
    callout: "The inflammation finding is a single cross-sectional study, and many prosociality effects come from brief lab inductions whose real-world durability is unproven. Awe is a promising, cheap lever — not yet a validated protocol.",
    sources: [
      { cite: "Keltner, D., & Haidt, J. (2003). Approaching awe, a moral, spiritual, and aesthetic emotion. Cognition and Emotion, 17(2), 297–314.", note: "Foundational account defining awe by perceived vastness plus a need for accommodation. [Moderate — theoretical]", link: scholar("Keltner Haidt 2003 approaching awe moral spiritual aesthetic emotion"), kind: "scholar" },
      { cite: "Rudd, M., Vohs, K. D., & Aaker, J. (2012). Awe expands people's perception of time, alters decision making, and enhances well-being. Psychological Science, 23(10), 1130–1136.", note: "Across three experiments, awe made time feel more available, boosted willingness to help, and raised life satisfaction. [Moderate — experimental]", link: scholar("Rudd Vohs Aaker 2012 awe expands perception of time well-being"), kind: "scholar" },
      { cite: "Piff, P. K., et al. (2015). Awe, the small self, and prosocial behavior. Journal of Personality and Social Psychology, 108(6), 883–899.", note: "Five studies (N=2,078): induced awe (even standing among tall trees) increased generosity and ethical choice via a diminished self. [Strong — multi-study]", link: scholar("Piff Dietze Feinberg 2015 awe small self prosocial behavior"), kind: "scholar" },
      { cite: "Stellar, J. E., et al. (2015). Positive affect and markers of inflammation: discrete positive emotions predict lower levels of inflammatory cytokines. Emotion, 15(2), 129–133.", note: "Dispositional awe was the strongest positive-emotion predictor of lower IL-6. [Emerging — single cross-sectional]", link: scholar("Stellar John-Henderson 2015 positive affect markers inflammation discrete positive emotions cytokines"), kind: "scholar" },
      { cite: "Bai, Y., et al. (2017). Awe, the diminished self, and collective engagement: universals and cultural variations in the small self. Journal of Personality and Social Psychology, 113(2), 185–209.", note: "Six studies (N=2,137) in the US and China: awe produces a diminished self and greater collective engagement across cultures. [Strong — cross-cultural]", link: scholar("Bai Maruskin Keltner 2017 awe diminished self collective engagement small self"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 32 — PURPOSE & MEANING IN LIFE ═══════════════
  {
    id: "purpose-meaning",
    section: "32",
    title: "Purpose & Meaning in Life",
    subtitle: "Bolsters clusters: existential, volitional, intrapersonal",
    evidenceTag: "Strong",
    description:
      "A sense of direction and life purpose shows remarkably consistent prospective associations with lower all-cause mortality and reduced Alzheimer's/cognitive-decline risk, pooled across cohorts in a meta-analysis. Of the 'meaning' variables, this is the best-evidenced.",
    callout: "The honest caveat is reverse causation and confounding: these are observational cohorts, so early illness, cognitive decline, or depression can lower purpose scores — and no randomized trial has shown that raising purpose extends life.",
    sources: [
      { cite: "Boyle, P. A., et al. (2009). Purpose in life is associated with mortality among community-dwelling older persons. Psychosomatic Medicine, 71(5), 574–579.", note: "In ~1,238 older adults, higher purpose predicted roughly half the mortality risk over follow-up. [Strong — prospective cohort]", link: scholar("Boyle Barnes Buchman Bennett 2009 purpose in life mortality community-dwelling older persons"), kind: "scholar" },
      { cite: "Boyle, P. A., et al. (2010). Effect of a purpose in life on risk of incident Alzheimer disease and mild cognitive impairment in community-dwelling older persons. Archives of General Psychiatry, 67(3), 304–310.", note: "In >900 initially non-demented elders, greater purpose was associated with substantially lower risk of Alzheimer's and MCI. [Strong — prospective cohort]", link: scholar("Boyle Buchman 2010 purpose in life incident Alzheimer disease mild cognitive impairment"), kind: "scholar" },
      { cite: "Hill, P. L., & Turiano, N. A. (2014). Purpose in life as a predictor of mortality across adulthood. Psychological Science, 25(7), 1482–1486.", note: "In the MIDUS sample, higher purpose predicted lower mortality over 14 years across all adult ages. [Strong — prospective cohort]", link: scholar("Hill Turiano 2014 purpose in life predictor mortality across adulthood"), kind: "scholar" },
      { cite: "Cohen, R., Bavishi, C., & Rozanski, A. (2016). Purpose in life and its relationship to all-cause mortality and cardiovascular events: a meta-analysis. Psychosomatic Medicine, 78(2), 122–133.", note: "Pooled cohorts: high purpose associated with reduced all-cause mortality and cardiovascular events. [Strong — meta-analysis]", link: scholar("Cohen Bavishi Rozanski 2016 purpose in life all-cause mortality cardiovascular events meta-analysis"), kind: "scholar" },
      { cite: "Alimujiang, A., et al. (2019). Association between life purpose and mortality among US adults older than 50 years. JAMA Network Open, 2(5), e194270.", note: "In 6,985 adults over 50, the lowest life-purpose group had markedly higher all-cause mortality than the highest. [Strong — prospective cohort]", link: scholar("Alimujiang 2019 association life purpose mortality US adults older than 50 JAMA Network Open"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 33 — VOLUNTEERING & GENERATIVITY ═══════════════
  {
    id: "volunteering",
    section: "33",
    title: "Volunteering & Generativity",
    subtitle: "Bolsters clusters: community-founding, moral, interpersonal, existential",
    evidenceTag: "Moderate",
    description:
      "Formal helping and contribution to others is linked, across cohorts and meta-analyses, to lower mortality and depression and higher well-being — especially in older adults and when the motive is genuinely other-oriented.",
    callout: "The mortality/health benefits come almost entirely from observational studies (healthy-volunteer selection bias), and the few randomized tests have not confirmed them. Benefits also concentrate in older adults and in those volunteering for other-oriented reasons.",
    sources: [
      { cite: "Musick, M. A., & Wilson, J. (2003). Volunteering and depression: the role of psychological and social resources in different age groups. Social Science & Medicine, 56(2), 259–269.", note: "Volunteering lowered depression for adults over 65 (not younger adults), partly via social integration. [Moderate — cohort, age-moderated]", link: scholar("Musick Wilson 2003 volunteering depression psychological social resources age groups"), kind: "scholar" },
      { cite: "Konrath, S., et al. (2012). Motives for volunteering are associated with mortality risk in older adults. Health Psychology, 31(1), 87–96.", note: "Volunteering predicted lower 4-year mortality — but only for those with other-oriented (not self-oriented) motives. [Moderate — prospective cohort]", link: scholar("Konrath Fuhrel-Forbis 2012 motives for volunteering mortality risk older adults"), kind: "scholar" },
      { cite: "Okun, M. A., Yeung, E. W., & Brown, S. (2013). Volunteering by older adults and risk of mortality: a meta-analysis. Psychology and Aging, 28(2), 564–577.", note: "Meta-analysis: volunteering associated with ~24% lower mortality risk in adjusted models among adults 55+. [Strong — meta-analysis]", link: scholar("Okun Yeung Brown 2013 volunteering older adults risk of mortality meta-analysis"), kind: "scholar" },
      { cite: "Jenkinson, C. E., et al. (2013). Is volunteering a public health intervention? A systematic review and meta-analysis of the health and survival of volunteers. BMC Public Health, 13, 773.", note: "Cohort meta-analysis: lower mortality (RR ~0.78) and better depression/well-being — but experimental studies did not confirm it. [Strong — systematic review]", link: scholar("Jenkinson 2013 is volunteering a public health intervention systematic review meta-analysis health survival volunteers"), kind: "scholar" },
      { cite: "Yeung, J. W. K., Zhang, Z., & Kim, T. Y. (2018). Volunteering and health benefits in general adults: cumulative effects and forms. BMC Public Health, 18(1), 8.", note: "Population analysis: volunteering associated with better physical/mental health and lower depression, with cumulative dose effects. [Moderate — large cohort]", link: scholar("Yeung Zhang Kim 2018 volunteering health benefits general adults cumulative effects forms"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 34 — READING ═══════════════
  {
    id: "reading",
    section: "34",
    title: "Reading",
    subtitle: "Bolsters clusters: linguistic, interpersonal (theory of mind), longevity",
    evidenceTag: "Mixed",
    description:
      "Two claims live here: that reading (especially literary fiction) builds social cognition, and that reading adds healthy years. The empathy/theory-of-mind claim is contested; the reading-longevity association is more robust but observational.",
    callout: "The headline 'literary fiction instantly boosts theory of mind' repeatedly failed to replicate at its original strength — treat the acute-empathy claim as unproven. The reading-longevity link is real but correlational (it can't prove causation).",
    sources: [
      { cite: "Kidd, D. C., & Castano, E. (2013). Reading literary fiction improves theory of mind. Science, 342(6156), 377–380.", note: "Five experiments: brief literary-fiction reading raised theory-of-mind scores vs. popular fiction/nonfiction/control. [Emerging — original, later weakened]", link: scholar("Kidd Castano 2013 Reading literary fiction improves theory of mind Science"), kind: "scholar" },
      { cite: "Panero, M. E., et al. (2016). Does reading a single passage of literary fiction really improve theory of mind? An attempt at replication. Journal of Personality and Social Psychology, 111(5), e46–e54.", note: "A large replication found NO significant literary-fiction advantage on the Reading-the-Mind-in-the-Eyes test. [Moderate — failed replication]", link: scholar("Panero 2016 Does reading a single passage of literary fiction really improve theory of mind attempt at replication"), kind: "scholar" },
      { cite: "Kidd, D., & Castano, E. (2019). Reading literary fiction and theory of mind: three preregistered replications and extensions of Kidd and Castano (2013). Social Psychological and Personality Science, 10(4), 522–531.", note: "Preregistered: mixed — two uninformative failures and one success; a small, inconsistent effect. [Mixed]", link: scholar("Kidd Castano 2019 Three preregistered replications extensions theory of mind"), kind: "scholar" },
      { cite: "Bavishi, A., Slade, M. D., & Levy, B. R. (2016). A chapter a day: association of book reading with longevity. Social Science & Medicine, 164, 44–48.", note: "Book readers (HRS, n=3,635) had ~20% lower mortality / a ~2-year survival advantage over 12 years. [Moderate — observational]", link: scholar("Bavishi Slade Levy 2016 chapter a day book reading longevity Social Science Medicine"), kind: "scholar" },
      { cite: "Mol, S. E., et al. (2008). Added value of dialogic parent–child book readings: a meta-analysis. Early Education and Development, 19(1), 7–26.", note: "Interactive shared reading yielded moderate expressive-vocabulary gains (d≈0.59) in young children. [Moderate — meta-analysis]", link: scholar("Mol Bus 2008 Added value of dialogic parent-child book readings meta-analysis"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 35 — DELIBERATE PRACTICE & SKILL ACQUISITION ═══════════════
  {
    id: "deliberate-practice",
    section: "35",
    title: "Deliberate Practice & Skill Acquisition",
    subtitle: "Bolsters clusters: adversarial, strategic, meta-cognitive, most skill lines",
    evidenceTag: "Strong",
    description:
      "How structured, effortful practice and the right study mechanics (testing, spacing, retrieval) drive skill and retention. The retrieval/spacing effects are among the most robust findings in learning science; deliberate practice matters, but explains far less of expert-performance variance than the '10,000-hour' story claims.",
    callout: "The honest correction: Macnamara's meta-analysis shows deliberate practice accounts for only a minority of performance variance (26% in games, 21% in music, <1% in professions). Practice is necessary and trainable — but it is not nearly everything.",
    sources: [
      { cite: "Ericsson, K. A., Krampe, R. Th., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. Psychological Review, 100(3), 363–406.", note: "Foundational: accumulated deliberate practice strongly tracked skill among musicians; framed expertise as trainable. [Strong — foundational, magnitude contested]", link: scholar("Ericsson Krampe Tesch-Romer 1993 role of deliberate practice acquisition of expert performance"), kind: "scholar" },
      { cite: "Macnamara, B. N., Hambrick, D. Z., & Oswald, F. L. (2014). Deliberate practice and performance in music, games, sports, education, and professions: a meta-analysis. Psychological Science, 25(8), 1608–1618.", note: "Deliberate practice explained 26% (games), 21% (music), 18% (sports), 4% (education), <1% (professions) of variance. [Strong — meta-analysis]", link: scholar("Macnamara Hambrick Oswald 2014 deliberate practice performance meta-analysis Psychological Science"), kind: "scholar" },
      { cite: "Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.", note: "Repeated retrieval (testing) beat repeated restudy for delayed retention — the testing effect. [Strong]", link: scholar("Roediger Karpicke 2006 Test-enhanced learning taking memory tests improves long-term retention"), kind: "scholar" },
      { cite: "Karpicke, J. D., & Blunt, J. R. (2011). Retrieval practice produces more learning than elaborative studying with concept mapping. Science, 331(6018), 772–775.", note: "Practicing retrieval outperformed concept mapping on later recall and inference. [Strong]", link: scholar("Karpicke Blunt 2011 Retrieval practice produces more learning than elaborative studying concept mapping Science"), kind: "scholar" },
      { cite: "Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.", note: "Meta-analysis: spaced (distributed) practice reliably beats massed practice for long-term recall. [Strong — meta-analysis]", link: scholar("Cepeda Pashler Vul Wixted Rohrer 2006 Distributed practice verbal recall review quantitative synthesis Psychological Bulletin"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 36 — COGNITIVE RESERVE & LIFELONG LEARNING ═══════════════
  {
    id: "cognitive-reserve",
    section: "36",
    title: "Cognitive Reserve & Lifelong Learning",
    subtitle: "Bolsters clusters: meta-cognitive, most cognitive lines, existential",
    evidenceTag: "Moderate",
    description:
      "Education, novel skill-learning, and stimulating environments build 'reserve' that buffers cognitive aging — strong in animal models and epidemiology, with one clean RCT (the Synapse Project) showing that learning demanding NEW skills improves memory in older adults. Novelty and challenge, not any single hobby, is the safe takeaway.",
    callout: "Much reserve evidence is observational (education and occupation confound with health and wealth), and the bilingual-reserve piece specifically is inconsistent. Pursue genuinely NEW, effortful learning — passive 'brain games' are the weakest version.",
    sources: [
      { cite: "Stern, Y. (2012). Cognitive reserve in ageing and Alzheimer's disease. Lancet Neurology, 11(11), 1006–1012.", note: "Defines cognitive reserve: lifelong education, occupation, and leisure let some brains tolerate more pathology before decline. [Strong — framework/review]", link: scholar("Stern 2012 Cognitive reserve in ageing and Alzheimer's disease Lancet Neurology"), kind: "scholar" },
      { cite: "Park, D. C., et al. (2014). The impact of sustained engagement on cognitive function in older adults: the Synapse Project. Psychological Science, 25(1), 103–112.", note: "RCT: older adults learning demanding NEW skills (quilting, digital photography) improved episodic memory vs. low-demand controls. [Moderate — RCT]", link: scholar("Park 2014 Synapse Project sustained engagement cognitive function older adults Psychological Science"), kind: "scholar" },
      { cite: "van Praag, H., Kempermann, G., & Gage, F. H. (2000). Neural consequences of environmental enrichment. Nature Reviews Neuroscience, 1(3), 191–198.", note: "Enriched environments (especially exercise + learning) increase neurogenesis and plasticity in rodents. [Strong — animal model]", link: scholar("van Praag Kempermann Gage 2000 Neural consequences of environmental enrichment Nature Reviews Neuroscience"), kind: "scholar" },
      { cite: "Valenzuela, M. J., & Sachdev, P. (2006). Brain reserve and dementia: a systematic review. Psychological Medicine, 36(4), 441–454.", note: "Systematic review: high mental-activity/reserve associated with ~46% reduced dementia risk. [Moderate — observational synthesis]", link: scholar("Valenzuela Sachdev 2006 Brain reserve and dementia a systematic review Psychological Medicine"), kind: "scholar" },
      { cite: "Bialystok, E., Craik, F. I. M., & Freedman, M. (2007). Bilingualism as a protection against the onset of symptoms of dementia. Neuropsychologia, 45(2), 459–464.", note: "One well-known reserve pathway — bilingualism — with a ~4-year delay in symptom onset (later replications inconsistent; see Section 28). [Mixed]", link: scholar("Bialystok Craik Freedman 2007 Bilingualism protection onset symptoms dementia Neuropsychologia"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 37 — THE HONEST FRONTIER: STACKED DAILY PROTOCOLS ═══════════════
  {
    id: "frontier-stacked-protocols",
    section: "37",
    title: "The Honest Frontier — Stacked Daily Protocols",
    subtitle: "Bolsters clusters: interoceptive, emotional, volitional (experimental)",
    evidenceTag: "Emerging",
    description:
      "The components — floatation-REST / sensory reduction, heart-rate-variability (vagal) biofeedback, and aerobic exercise — each have supportive evidence for stress and anxiety. But the specific stacked, daily, high-dose regimen (for example, hours of daily aerobic work immediately followed by a daily float, repeated for weeks) is essentially unstudied. This section exists to be honest about that edge.",
    callout: "The gap, stated plainly: there is essentially NO published research on ~300 minutes of DAILY aerobic exercise immediately followed by DAILY floatation/sensory-deprivation, stacked every day for 30–60 days. Every real float study below uses roughly ONE session per week for 6–12 weeks. Adopt the components on their own evidence; treat the daily stack as an n-of-1 experiment, not an evidence-based practice.",
    sources: [
      { cite: "Feinstein, J. S., et al. (2018). Examining the short-term anxiolytic and antidepressant effect of floatation-REST. PLoS ONE, 13(2), e0190292.", note: "A SINGLE float session produced large acute reductions in state anxiety across the anxiety/depression spectrum (open-label; no daily stacking). [Emerging]", link: scholar("Feinstein 2018 Examining short-term anxiolytic antidepressant effect of Floatation-REST PLoS One"), kind: "scholar" },
      { cite: "Feinstein, J. S., et al. (2023). A randomized controlled safety and feasibility trial of floatation-REST in anxious and depressed individuals. PLoS ONE, 18(6), e0286899.", note: "RCT: float-REST safe and feasible with acute anxiolytic effects — tested limited sessions, NOT a daily 30–60-day regimen. [Emerging — small RCT]", link: scholar("Feinstein 2023 randomized controlled safety feasibility trial floatation-REST anxious depressed PLoS One"), kind: "scholar" },
      { cite: "van Dierendonck, D., & Te Nijenhuis, J. (2005). Flotation restricted environmental stimulation therapy (REST) as a stress-management tool: a meta-analysis. Psychology & Health, 20(3), 405–412.", note: "27 studies (n=449): float-REST lowered cortisol/BP and raised well-being (d≈1.0) — typically at WEEKLY dosing over weeks/months. [Moderate — meta-analysis]", link: scholar("van Dierendonck Te Nijenhuis 2005 Flotation REST stress-management meta-analysis Psychology Health"), kind: "scholar" },
      { cite: "Jonsson, K., & Kjellgren, A. (2016). Promising effects of treatment with flotation-REST as an intervention for generalized anxiety disorder (GAD): a randomized controlled pilot trial. BMC Complementary and Alternative Medicine, 16, 108.", note: "12 WEEKLY float sessions reduced anxiety, depression, and sleep problems in GAD — explicitly weekly, not daily. [Emerging — pilot RCT]", link: scholar("Jonsson Kjellgren 2016 flotation-REST intervention generalized anxiety disorder randomized controlled pilot trial BMC"), kind: "scholar" },
      { cite: "Goessl, V. C., Curtiss, J. E., & Hofmann, S. G. (2017). The effect of heart rate variability biofeedback training on stress and anxiety: a meta-analysis. Psychological Medicine, 47(15), 2578–2586.", note: "24 studies (n=484): HRV/vagal biofeedback produced large reductions in self-reported stress and anxiety (g≈0.81). [Moderate — meta-analysis]", link: scholar("Goessl Curtiss Hofmann 2017 heart rate variability biofeedback training stress anxiety meta-analysis Psychological Medicine"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 38 — MICRO-SAVING & BEHAVIORAL MOMENTUM ═══════════════
  {
    id: "micro-saving",
    section: "38",
    title: "Micro-Saving & Behavioral Momentum",
    subtitle: "Bolsters clusters: financial, volitional, intrapersonal",
    evidenceTag: "Mixed",
    description:
      "Whether small, automated, or commitment-based saving builds financial self-efficacy and a felt sense of momentum. The mechanics are strongly evidenced — auto-escalation, pre-commitment, and reminders reliably raise savings. The psychological chain from small wins to broader life confidence is real but more inferential.",
    callout: "The saving-behavior RCTs are robust; the popular claim that small financial wins 'cascade' into confidence in other domains is mostly correlational (self-efficacy predicts financial behavior cross-sectionally, but the momentum-into-other-domains story is not demonstrated).",
    sources: [
      { cite: "Thaler, R. H., & Benartzi, S. (2004). Save More Tomorrow: using behavioral economics to increase employee saving. Journal of Political Economy, 112(S1), S164–S187.", note: "Auto-escalating contributions raised savings rates from 3.5% to 13.6% over ~40 months — inertia working FOR you. [Strong]", link: scholar("Thaler Benartzi Save More Tomorrow Journal of Political Economy 2004"), kind: "scholar" },
      { cite: "Ashraf, N., Karlan, D., & Yin, W. (2006). Tying Odysseus to the mast: evidence from a commitment savings product in the Philippines. Quarterly Journal of Economics, 121(2), 635–672.", note: "A voluntary commitment savings account raised average balances 81% after one year vs. control — pre-commitment beats willpower. [Strong]", link: scholar("Ashraf Karlan Yin Tying Odysseus to the Mast commitment savings Philippines"), kind: "scholar" },
      { cite: "Karlan, D., et al. (2016). Getting to the top of mind: how reminders increase saving. Management Science, 62(12), 3393–3411.", note: "Simple savings reminders increased amounts saved by ~6% — attention and salience alone shift behavior. [Strong]", link: scholar("Karlan McConnell Mullainathan Zinman reminders increase saving Management Science 2016"), kind: "scholar" },
      { cite: "Farrell, L., Fry, T. R. L., & Risse, L. (2016). The significance of financial self-efficacy in explaining women's personal finance behaviour. Journal of Economic Psychology, 54, 85–99.", note: "Financial self-efficacy was among the strongest predictors of holding savings/investments, independent of literacy (correlational). [Moderate]", link: scholar("Farrell Fry Risse financial self-efficacy women's personal finance behaviour Journal of Economic Psychology 2016"), kind: "scholar" },
      { cite: "Netemeyer, R. G., et al. (2018). How am I doing? Perceived financial well-being, its potential antecedents, and its relation to overall well-being. Journal of Consumer Research, 45(1), 68–89.", note: "Perceived financial well-being (especially expected future security) predicts overall well-being beyond income. [Moderate]", link: scholar("Netemeyer Warmath Fernandes Lynch perceived financial well-being overall well-being Journal of Consumer Research 2018"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 39 — ORDER & ENVIRONMENT ═══════════════
  {
    id: "order-environment",
    section: "39",
    title: "Order & Environment",
    subtitle: "Bolsters clusters: volitional, intrapersonal, systemic",
    evidenceTag: "Mixed",
    description:
      "Whether a tidy, orderly physical space affects self-regulation, mood, and even cortisol. There is real experimental and physiological evidence that environmental order and disorder shift behavior and stress — and honest evidence that disorder isn't uniformly bad (it can boost creativity).",
    callout: "The popular 'make your bed → discipline cascade' claim is UNTESTED directly — no study manipulates bed-making, and the flagship order-vs-disorder result has faced replication scrutiny. What holds up better: chronic household clutter correlates with worse mood and flatter cortisol.",
    sources: [
      { cite: "Vohs, K. D., Redden, J. P., & Rahinel, R. (2013). Physical order produces healthy choices, generosity, and conventionality, whereas disorder produces creativity. Psychological Science, 24(9), 1860–1867.", note: "Orderly rooms nudged healthier choices and generosity; disorderly rooms boosted creativity — order shifts behavior, not uniformly 'good.' [Moderate]", link: scholar("Vohs Redden Rahinel Physical Order Produces Healthy Choices Psychological Science 2013"), kind: "scholar" },
      { cite: "Chae, B., & Zhu, R. (2014). Environmental disorder leads to self-regulatory failure. Journal of Consumer Research, 40(6), 1203–1218.", note: "Disordered environments threatened sense of control and depleted self-regulation on later tasks. [Moderate]", link: scholar("Chae Zhu Environmental Disorder Leads to Self-Regulatory Failure Journal of Consumer Research 2014"), kind: "scholar" },
      { cite: "Saxbe, D. E., & Repetti, R. L. (2010). No place like home: home tours correlate with daily patterns of mood and cortisol. Personality and Social Psychology Bulletin, 36(1), 71–81.", note: "Women describing homes as cluttered/unfinished showed flatter (less healthy) cortisol and more depressed mood (observational). [Moderate]", link: scholar("Saxbe Repetti No Place Like Home mood cortisol Personality and Social Psychology Bulletin 2010"), kind: "scholar" },
      { cite: "Roster, C. A., Ferrari, J. R., & Jurkat, M. P. (2016). The dark side of home: assessing possession 'clutter' on subjective well-being. Journal of Environmental Psychology, 46, 32–41.", note: "Clutter negatively predicted 'psychological home' and subjective well-being (correlational SEM). [Emerging]", link: scholar("Roster Ferrari Jurkat dark side of home clutter subjective well-being Journal of Environmental Psychology 2016"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 40 — GROOMING & SELF-CARE ═══════════════
  {
    id: "grooming-selfcare",
    section: "40",
    title: "Grooming & Self-Care",
    subtitle: "Bolsters clusters: intrapersonal, seductive, interpersonal",
    evidenceTag: "Emerging",
    description:
      "Whether daily grooming, dressing well, and self-care routines improve self-efficacy and mood. This is included honestly BECAUSE the evidence is thin and contested — a useful example of where popular self-help outruns the science.",
    callout: "The signature 'enclothed cognition' lab-coat effect did NOT replicate in a high-powered preregistered study, and no rigorous experiment shows that ordinary daily grooming raises self-efficacy in healthy adults. The strongest real outcome data come from beauty-care interventions in cancer patients, which don't generalize to everyday grooming. Do it because it's decent maintenance — not because the science promises a transformation.",
    sources: [
      { cite: "Adam, H., & Galinsky, A. D. (2012). Enclothed cognition. Journal of Experimental Social Psychology, 48(4), 918–925.", note: "Wearing a 'doctor's' lab coat improved selective-attention (Stroop) performance — the original, much-cited but fragile effect. [Emerging]", link: scholar("Adam Galinsky Enclothed cognition Journal of Experimental Social Psychology 2012"), kind: "scholar" },
      { cite: "Burns, D. M., et al. (2019). An old task in new clothes: a preregistered direct replication attempt of enclothed cognition effects on Stroop performance. Journal of Experimental Social Psychology, 83, 25–30.", note: "With 3× the participants and trials, the lab coat had NO effect on Stroop — a direct replication failure. [Moderate — counter-evidence]", link: scholar("Burns preregistered replication enclothed cognition Stroop Journal of Experimental Social Psychology 2019"), kind: "scholar" },
      { cite: "Richard, A., et al. (2019). Recover your smile: effects of a beauty-care intervention on depressive symptoms, quality of life, and self-esteem in patients with early breast cancer. Psycho-Oncology, 28(2), 401–407.", note: "A structured beauty-care intervention improved depressive symptoms, QoL, and self-esteem — in cancer patients, not healthy daily grooming. [Moderate — clinical population]", link: scholar("Recover your smile beauty care intervention self-esteem breast cancer Psycho-Oncology 2019"), kind: "scholar" },
      { cite: "Quintard, B., & Lakdja, F. (2008). Assessing the effect of beauty treatments on psychological distress, body image, and coping: a longitudinal study of patients undergoing surgical procedures for breast cancer. Psycho-Oncology, 17(10), 1032–1038.", note: "Beauty treatments were associated with reduced distress and improved body image over time — clinical, longitudinal. [Moderate — clinical population]", link: scholar("Quintard Lakdja beauty treatments psychological distress body image breast cancer Psycho-Oncology 2008"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 41 — DIGITAL MINIMALISM & ATTENTION ═══════════════
  {
    id: "digital-minimalism",
    section: "41",
    title: "Digital Minimalism & Attention",
    subtitle: "Bolsters clusters: meta-cognitive, volitional, emotional, interpersonal",
    evidenceTag: "Moderate",
    description:
      "Whether cutting smartphone and social-media use improves attention, mood, and well-being. This is the best-evidenced of the 'mundane' levers — multiple RCTs and meta-analyses exist, including that the mere presence of your phone measurably drains working memory. Effects are real but generally small.",
    callout: "Effect sizes are small and inconsistent — at least one meta-analysis finds average well-being effects near zero — so 'delete social media and transform your life' overstates it. The defensible claim is modest improvements in depression, sleep, and available attention.",
    sources: [
      { cite: "Hunt, M. G., et al. (2018). No more FOMO: limiting social media decreases loneliness and depression. Journal of Social and Clinical Psychology, 37(10), 751–768.", note: "RCT: capping social media to ~10 min/platform/day for 3 weeks reduced loneliness and depression vs. controls. [Moderate]", link: scholar("Hunt Marx Lipson Young No More FOMO limiting social media loneliness depression 2018"), kind: "scholar" },
      { cite: "Ward, A. F., et al. (2017). Brain drain: the mere presence of one's own smartphone reduces available cognitive capacity. Journal of the Association for Consumer Research, 2(2), 140–154.", note: "Merely having your silenced phone visible reduced working-memory and fluid-intelligence performance. [Moderate]", link: scholar("Ward Duke Gneezy Bos Brain Drain mere presence smartphone cognitive capacity 2017"), kind: "scholar" },
      { cite: "Kushlev, K., Proulx, J., & Dunn, E. W. (2016). 'Silence your phones': smartphone notifications increase inattention and hyperactivity symptoms. Proceedings of the 2016 CHI Conference on Human Factors in Computing Systems, 1011–1020.", note: "A week of maximized notifications raised self-reported inattention and hyperactivity vs. a minimized week. [Moderate]", link: scholar("Kushlev Proulx Dunn Silence Your Phones notifications inattention hyperactivity CHI 2016"), kind: "scholar" },
      { cite: "Pieh, C., et al. (2025). Smartphone screen-time reduction improves mental health: a randomized controlled trial. BMC Medicine, 23, 107.", note: "RCT: reducing screen time to ≤2 h/day for 3 weeks yielded small-to-medium improvements in well-being, depression, sleep, and stress. [Moderate]", link: scholar("Pieh Humer smartphone screen time reduction improves mental health randomized controlled trial BMC Medicine 2025"), kind: "scholar" },
      { cite: "May, W., Malouff, J. M., & Meynadier, J. (2025). Reducing social media use decreases depression symptoms: a meta-analysis of randomised controlled trials. European Journal of Investigation in Health, Psychology and Education, 15(11), 222.", note: "Meta-analysis of 10 RCTs (N=1,491): reducing social-media use modestly decreased depressive symptoms (g≈0.25). [Moderate — meta-analysis]", link: scholar("May Malouff Meynadier Reducing Social Media Use Decreases Depression Symptoms meta-analysis 2025"), kind: "scholar" },
    ],
  },
];

// Live counts so the header can never drift from the data again.
const PRACTICE_SOURCE_COUNT = PRACTICE_EVIDENCE.reduce((n, c) => n + c.sources.length, 0);
const PRACTICE_SECTION_COUNT = new Set(PRACTICE_EVIDENCE.map((c) => c.section)).size;
const TOTAL_SOURCES = VOLUME_SOURCES + PRACTICE_SOURCE_COUNT;

// ── Verification ledger stats — the single, live source of truth ────────────
// Computed from the actual rendered source arrays so the public ledger can
// never drift from what's really in the library. Every entry here survived the
// verification gate (RESEARCH_PIPELINE.md); the fabricated count is zero by
// construction — a source that can't be confirmed is never added.
function collectSourceKinds() {
  let doi = 0, scholar = 0, other = 0;
  const bump = (k?: string) => {
    if (k === "doi") doi++;
    else if (k === "scholar") scholar++;
    else other++;
  };
  for (const l of LINES as any[]) bump(l.linkKind);
  for (const c of TRAINABILITY_CLUSTERS) for (const s of c.sources as any[]) bump(s.kind);
  for (const c of PRACTICE_EVIDENCE) for (const s of c.sources as any[]) bump(s.kind);
  return { doi, scholar, other, clickable: doi + scholar + other };
}
export const LEDGER_STATS = {
  totalSources: TOTAL_SOURCES,           // everything, incl. sources inside the downloadable PDF volumes
  volumeSources: VOLUME_SOURCES,          // sources in the three PDF volumes
  practiceSources: PRACTICE_SOURCE_COUNT, // network/systems-science practice evidence
  practiceSections: PRACTICE_SECTION_COUNT,
  fabricated: 0,                          // the whole point — see RESEARCH_PIPELINE.md
  ...collectSourceKinds(),                // doi / scholar / other / clickable (individually linked in-app)
};

export default function ResearchLibrary() {
  // Support deep-linking via ?section=trainability or ?section=practices
  const [section, setSection] = useState<"lines" | "trainability" | "practices">(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section");
    if (s === "trainability") return "trainability";
    if (s === "practices") return "practices";
    return "lines";
  });
  const [activeFamily, setActiveFamily] = useState("all");
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(["financial"]));
  const [openTrainIds, setOpenTrainIds] = useState<Set<string>>(() => new Set(["active-trial"]));
  const [openPracticeIds, setOpenPracticeIds] = useState<Set<string>>(() => new Set(["p-1a"]));
  // Practices tab: independent search, evidence-tag filter, and section jump.
  const [practiceQuery, setPracticeQuery] = useState("");
  const [practiceTag, setPracticeTag] = useState<"all" | PracticeCluster["evidenceTag"]>("all");
  const [practiceSectionFilter, setPracticeSectionFilter] = useState<string>("all");

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTrain = (id: string) => {
    setOpenTrainIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePractice = (id: string) => {
    setOpenPracticeIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Deep-link a specific source cluster: /research-library#src-<clusterId>.
  // Switches to the right tab, opens the cluster, and scrolls it into view —
  // this is what makes the Claim → Evidence links on the report land on the
  // exact paper, not just the library homepage.
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw.startsWith("src-")) return;
    const id = raw.slice(4);
    if (TRAINABILITY_CLUSTERS.some((c) => c.id === id)) {
      setSection("trainability");
      setOpenTrainIds((prev) => new Set(prev).add(id));
    } else if (PRACTICE_EVIDENCE.some((c) => c.id === id)) {
      setSection("practices");
      setOpenPracticeIds((prev) => new Set(prev).add(id));
    } else {
      return;
    }
    // Wait for the tab switch + expand to render, then scroll.
    const t = setTimeout(() => {
      document.getElementById(raw)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LINES.filter((l) => {
      if (activeFamily !== "all" && l.family !== activeFamily) return false;
      if (q && !l.name.toLowerCase().includes(q) && !l.blurb.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeFamily, query]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof LINES> = {};
    FAMILIES.forEach((f) => (g[f.key] = []));
    filtered.forEach((l) => g[l.family] && g[l.family].push(l));
    return g;
  }, [filtered]);

  const visibleFamilyCount = FAMILIES.filter((f) => grouped[f.key].length > 0).length;

  // Sections present, in consumer-intuitive display order, for the jump-nav.
  const practiceSectionKeys = useMemo(
    () => Array.from(new Set(PRACTICE_EVIDENCE.map((c) => c.section))).sort((a, b) => sectionRank(a) - sectionRank(b)),
    [],
  );

  const filteredPractices = useMemo(() => {
    const q = practiceQuery.trim().toLowerCase();
    return PRACTICE_EVIDENCE.filter((c) => {
      if (practiceSectionFilter !== "all" && c.section !== practiceSectionFilter) return false;
      if (practiceTag !== "all" && c.evidenceTag !== practiceTag) return false;
      if (q) {
        const hay = (
          c.title + " " + c.subtitle + " " + c.description + " " +
          (PRACTICE_SECTIONS[c.section] || "") + " " +
          c.sources.map((s) => s.cite + " " + s.note).join(" ")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => sectionRank(a.section) - sectionRank(b.section));
  }, [practiceQuery, practiceTag, practiceSectionFilter]);

  // When a keyword search is active, reveal matching sources automatically.
  const practiceSearching = practiceQuery.trim().length > 0;

  return (
    <div className="rl-page">
      <style>{`
        .rl-page{background:${INK}; background-image:radial-gradient(ellipse 900px 500px at 15% -8%, rgba(224,198,140,0.07), transparent 60%);
          min-height:100vh; color:${CREAM}; font-family:'Inter',system-ui,-apple-system,sans-serif; letter-spacing:0.01em; padding-bottom:60px;}
        .rl-page a{color:inherit;}
        .rl-page button{font:inherit; color:inherit; background:none; border:none; cursor:pointer;}
        .rl-page input{font:inherit; color:inherit;}
        @media (prefers-reduced-motion: reduce){ .rl-page *{animation:none !important; transition:none !important;} }

        @keyframes rlFadeUp{from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:translateY(0);}}

        /* ---- nav ---- */
        .rl-nav{position:sticky; top:0; z-index:30; backdrop-filter:blur(10px);
          background:rgba(20,16,9,0.80); border-bottom:1px solid ${LINE};}
        .rl-nav-in{max-width:1180px; margin:0 auto; display:flex; align-items:center; gap:28px; height:60px; padding:0 22px;}
        .rl-logo{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:21px; letter-spacing:0.02em; flex-shrink:0;}
        .rl-logo b{color:${CHAMPAGNE};}
        .rl-back{display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:0.10em; text-transform:uppercase; color:${CREAM2}; text-decoration:none; transition:color .18s;}
        .rl-back:hover{color:${CREAM};}
        .rl-navicon{flex-shrink:0; color:${MUTED}; display:flex; margin-left:auto;}

        .rl-wrap{max-width:1180px; margin:0 auto; padding:0 22px;}

        /* ---- header ---- */
        .rl-header{padding:46px 0 30px; animation:rlFadeUp .6s ease both;}
        .rl-eyebrow{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.30em; color:${CHAMPAGNE}; margin-bottom:14px;}
        .rl-h1{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:clamp(32px,4.6vw,50px); line-height:1.02; margin:0 0 12px;}
        .rl-sub{font-size:14.5px; line-height:1.6; color:${CREAM2}; max-width:560px; margin:0 0 26px;}
        .rl-stats{display:flex; flex-wrap:wrap; gap:34px;}
        .rl-stat b{display:block; font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:600; color:${CREAM}; line-height:1;}
        .rl-stat span{font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.14em; text-transform:uppercase; color:${MUTED};}
        .rl-stat-accent b{color:${CHAMPAGNE};}

        /* ---- volume cards ---- */
        .rl-volumes{display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px; margin-bottom:34px;
          animation:rlFadeUp .6s ease .08s both;}
        .rl-volcard{background:${INK2}; border:1px solid ${LINE}; border-radius:10px; padding:22px; transition:border-color .2s, transform .2s;}
        .rl-volcard:hover{border-color:rgba(224,198,140,0.35); transform:translateY(-1px);}
        .rl-volicon{color:${CHAMPAGNE}; margin-bottom:12px;}
        .rl-volkick{font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.22em; color:${MUTED}; margin-bottom:6px;}
        .rl-voltitle{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:22px; margin-bottom:6px;}
        .rl-voldesc{font-size:12.5px; color:${CREAM2}; line-height:1.5; margin-bottom:14px;}
        .rl-volmeta{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.06em; color:${MUTED}; margin-bottom:16px;}
        .rl-volbtn{display:inline-flex; align-items:center; gap:7px; font-family:'JetBrains Mono',monospace; font-size:10.5px;
          letter-spacing:0.10em; text-transform:uppercase; color:${CHAMPAGNE}; border:1px solid rgba(224,198,140,0.4);
          border-radius:5px; padding:9px 14px; transition:background .18s, border-color .18s; text-decoration:none;}
        .rl-volbtn:hover{background:rgba(224,198,140,0.08); border-color:${CHAMPAGNE};}

        /* ---- tier legend ---- */
        .rl-legend{border:1px solid ${LINE}; border-radius:10px; padding:16px 20px; margin-bottom:26px; background:${INK2};
          animation:rlFadeUp .6s ease .14s both;}
        .rl-legend-title{font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.16em; text-transform:uppercase;
          color:${MUTED}; margin-bottom:12px;}
        .rl-legend-row{display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px;}
        .rl-legend-item{display:flex; gap:10px; align-items:flex-start;}
        .rl-legend-item .rl-dot{margin-top:4px; flex-shrink:0;}
        .rl-legend-name{font-family:'Inter',sans-serif; font-weight:600; font-size:12.5px; margin-bottom:2px;}
        .rl-legend-desc{font-size:11.5px; color:${MUTED}; line-height:1.45;}

        /* ---- controls ---- */
        .rl-controls{display:flex; flex-direction:column; gap:14px; margin-bottom:30px; animation:rlFadeUp .6s ease .18s both;}
        .rl-search{display:flex; align-items:center; gap:10px; background:${INK2}; border:1px solid ${LINE}; border-radius:8px;
          padding:11px 14px; max-width:420px; transition:border-color .18s;}
        .rl-search:focus-within{border-color:${CHAMPAGNE};}
        .rl-search svg{color:${MUTED}; flex-shrink:0;}
        .rl-search input{background:none; border:none; outline:none; width:100%; font-size:13px; color:${CREAM};}
        .rl-search input::placeholder{color:${MUTED};}
        .rl-chips{display:flex; flex-wrap:wrap; gap:8px;}
        .rl-chip{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.08em; text-transform:uppercase;
          padding:8px 13px; border-radius:999px; border:1px solid ${LINE}; color:${CREAM2}; transition:border-color .18s, color .18s, background .18s;}
        .rl-chip:hover{color:${CREAM}; border-color:rgba(241,234,219,0.24);}
        .rl-chip.active{background:${CHAMPAGNE}; color:${INK}; border-color:${CHAMPAGNE}; font-weight:600;}

        /* ---- family groups + grid ---- */
        .rl-family{margin-bottom:30px;}
        .rl-family-head{display:flex; align-items:baseline; gap:9px; font-family:'JetBrains Mono',monospace; font-size:10.5px;
          letter-spacing:0.16em; text-transform:uppercase; color:${CREAM}; padding-bottom:10px; border-bottom:1px solid ${LINE}; margin-bottom:14px;}
        .rl-family-head span{color:${MUTED}; letter-spacing:0.06em;}
        .rl-family-note{font-family:'Inter',sans-serif; text-transform:none; letter-spacing:0; font-size:11px; color:${MUTED}; font-style:italic;}
        .rl-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(268px,1fr)); gap:12px;}

        .rl-card{background:${INK2}; border:1px solid ${LINE}; border-radius:9px; overflow:hidden; transition:border-color .2s;}
        .rl-card:hover{border-color:rgba(241,234,219,0.20);}
        .rl-card.is-open{border-color:rgba(224,198,140,0.4);}
        .rl-card-head{display:block; width:100%; text-align:left; padding:16px 16px 14px;}
        .rl-card-top{display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;}
        .rl-card-name{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:19px;}
        .rl-chev{color:${MUTED}; flex-shrink:0; transition:transform .22s;}
        .is-open .rl-chev{transform:rotate(180deg); color:${CHAMPAGNE};}
        .rl-card-tier{display:inline-flex; align-items:center; gap:7px; font-family:'JetBrains Mono',monospace; font-size:9px;
          letter-spacing:0.12em; text-transform:uppercase; margin-bottom:10px;}
        .rl-dot{width:8px; height:8px; border-radius:50%; display:inline-block;}
        .rl-card-blurb{font-size:12.5px; color:${CREAM2}; line-height:1.5; margin:0 0 10px;}
        .rl-card-meta{font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.06em; color:${MUTED};}

        .rl-card-detail{padding:0 16px 18px; border-top:1px solid ${LINE};}
        .rl-detail-cite{font-family:'Inter',sans-serif; font-weight:600; font-size:11.5px; line-height:1.55; color:${CREAM}; margin-top:14px;}
        .rl-detail-note{font-family:'Cormorant Garamond',serif; font-style:italic; font-size:14.5px; line-height:1.5; color:${CREAM2}; margin:8px 0 12px;}
        .rl-detail-link{display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:10px;
          letter-spacing:0.05em; color:${CHAMPAGNE}; text-decoration:none; border-bottom:1px solid rgba(224,198,140,0.3); padding-bottom:1px;}
        .rl-detail-link:hover{border-bottom-color:${CHAMPAGNE};}
        .rl-detail-more{display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:9.5px;
          letter-spacing:0.05em; color:${MUTED}; margin-top:11px;}

        .rl-empty{padding:50px 20px; text-align:center; color:${MUTED}; font-size:13px; border:1px dashed ${LINE}; border-radius:10px;}

        .rl-foot{margin-top:36px; padding-top:20px; border-top:1px solid ${LINE}; font-size:11.5px; line-height:1.6; color:${MUTED};}
        .rl-foot b{color:${CREAM2};}

        /* ---- section tabs ---- */
        .rl-section-tabs{display:flex; gap:10px; margin-bottom:24px; animation:rlFadeUp .6s ease .06s both;}
        .rl-section-tab{display:flex; flex-direction:column; align-items:flex-start; gap:4px; flex:1;
          background:${INK2}; border:1px solid ${LINE}; border-radius:10px; padding:18px 20px;
          transition:border-color .2s, background .2s, transform .15s; cursor:pointer;}
        .rl-section-tab:hover{border-color:rgba(241,234,219,0.24); transform:translateY(-1px);}
        .rl-section-tab.active{border-color:${CHAMPAGNE}; background:rgba(224,198,140,0.06);}
        .rl-section-tab svg{color:${MUTED}; margin-bottom:2px;}
        .rl-section-tab.active svg{color:${CHAMPAGNE};}
        .rl-section-tab span:first-of-type{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:18px; color:${CREAM};}
        .rl-tab-meta{font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.06em; color:${MUTED};}
        .rl-section-tab.active .rl-tab-meta{color:${CHAMPAGNE_D};}

        /* ---- trainability section ---- */
        .rl-train-intro{margin-bottom:30px; animation:rlFadeUp .5s ease both;}
        .rl-train-headline{display:flex; align-items:center; gap:12px; margin-bottom:12px;}
        .rl-train-headline h2{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:clamp(22px,3vw,30px); margin:0; color:${CREAM};}
        .rl-train-sub{font-size:14px; line-height:1.65; color:${CREAM2}; max-width:680px; margin:0 0 22px;}
        .rl-train-stats{display:flex; flex-wrap:wrap; gap:34px;}

        .rl-train-cluster{background:${INK2}; border:1px solid ${LINE}; border-radius:10px; margin-bottom:14px;
          overflow:hidden; transition:border-color .2s;}
        .rl-train-cluster:hover{border-color:rgba(155,192,178,0.25);}
        .rl-train-cluster.is-open{border-color:rgba(155,192,178,0.5);}
        .rl-train-head{display:block; width:100%; text-align:left; padding:20px 22px 18px; cursor:pointer;}
        .rl-train-head-top{display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px;}
        .rl-train-title{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:20px; color:${CREAM};}
        .rl-train-subtitle{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.08em;
          text-transform:uppercase; color:${JADE}; margin-bottom:10px;}
        .rl-train-desc{font-size:13px; line-height:1.6; color:${CREAM2}; margin:0 0 10px;}
        .rl-train-cluster.is-open .rl-chev{transform:rotate(180deg); color:${JADE};}

        .rl-train-sources{padding:0 22px 22px; border-top:1px solid ${LINE};}
        .rl-train-source{padding-top:16px;}
        .rl-train-source + .rl-train-source{margin-top:14px; padding-top:14px; border-top:1px dashed rgba(241,234,219,0.06);}

        /* ---- practices & evidence section ---- */
        .rl-practice-guardrail{background:${INK2}; border:1px solid rgba(224,198,140,0.35); border-radius:10px;
          padding:22px 24px; margin-bottom:26px; animation:rlFadeUp .5s ease both;}
        .rl-practice-guardrail h3{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:clamp(20px,2.6vw,26px);
          margin:0 0 12px; color:${CREAM}; display:flex; align-items:center; gap:11px;}
        .rl-practice-guardrail p{font-size:12.5px; line-height:1.62; color:${CREAM2}; margin:0 0 9px; max-width:820px;}
        .rl-practice-guardrail p:last-child{margin-bottom:0;}
        .rl-practice-guardrail b{color:${CHAMPAGNE};}
        .rl-practice-tags{display:flex; flex-wrap:wrap; gap:10px; margin-top:14px;}
        .rl-practice-tags .rl-tag{margin-left:0;}
        /* practices search + filters */
        .rl-search-clear{display:flex; align-items:center; justify-content:center; color:${MUTED}; padding:2px; border-radius:4px;}
        .rl-search-clear:hover{color:${CREAM};}
        .rl-practice-sections{margin-bottom:12px;}
        .rl-practice-sections .rl-chip-num{color:${CHAMPAGNE}; font-weight:600; margin-right:2px;}
        .rl-practice-sections .rl-chip.active .rl-chip-num{color:${INK};}
        .rl-practice-tagfilter{margin-bottom:18px;}
        .rl-practice-count{font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.06em; color:${MUTED};
          margin-bottom:22px; display:flex; align-items:center; gap:14px;}
        .rl-practice-count b{color:${CREAM};}
        .rl-clear-all{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.08em; text-transform:uppercase;
          color:${CHAMPAGNE}; border-bottom:1px solid rgba(224,198,140,0.3); padding-bottom:1px;}
        .rl-clear-all:hover{border-color:${CHAMPAGNE};}
        .rl-practice-group-head{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:clamp(22px,3vw,32px);
          color:${CREAM}; margin:48px 0 8px; letter-spacing:-0.01em; line-height:1.1;}
        .rl-practice-group-head:first-child{margin-top:8px;}
        .rl-practice-section-head{font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.18em;
          text-transform:uppercase; color:${CHAMPAGNE}; margin:22px 0 14px; padding-bottom:9px; border-bottom:1px solid ${LINE};}
        .rl-tag{display:inline-block; font-family:'JetBrains Mono',monospace; font-size:8.5px; letter-spacing:0.12em;
          text-transform:uppercase; padding:3px 9px; border-radius:999px; border:1px solid currentColor; margin-left:10px;
          vertical-align:middle; white-space:nowrap;}
        .rl-practice-callout{background:rgba(200,92,68,0.06); border:1px solid rgba(200,92,68,0.35); border-radius:10px;
          padding:16px 20px; margin-bottom:16px;}
        .rl-practice-callout .rl-callout-label{display:flex; align-items:center; gap:8px; font-family:'JetBrains Mono',monospace;
          font-size:9.5px; letter-spacing:0.14em; text-transform:uppercase; color:#D98A6E; margin-bottom:8px;}
        .rl-practice-callout p{font-size:12.5px; line-height:1.6; color:${CREAM2}; margin:0;}

        @media (max-width:640px){
          .rl-nav-in{gap:16px; padding:0 16px;}
          .rl-wrap{padding:0 16px;}
          .rl-stats{gap:22px;}
          .rl-section-tabs{flex-direction:column;}
        }
      `}</style>

      {/* NAV */}
      <div className="rl-nav">
        <div className="rl-nav-in">
          <Link href="/" className="rl-logo">AQAL<b>.</b></Link>
          <Link href="/portal" className="rl-back">
            <ArrowLeft size={14} /> Back to Portal
          </Link>
          <div className="rl-navicon"><LayoutGrid size={17} /></div>
        </div>
      </div>

      <div className="rl-wrap">
        {/* PAGE HEADER */}
        <div className="rl-header">
          <div className="rl-eyebrow">EVIDENCE LIBRARY</div>
          <h1 className="rl-h1">The Research Library</h1>
          <p className="rl-sub">
            Every one of the 32 intelligence lines, traced to a real, published source.
            Click through and check it yourself — that's the whole point.
          </p>
          <div className="rl-stats">
            <div className="rl-stat"><b>{TOTAL_LINES}</b><span>Lines</span></div>
            <div className="rl-stat"><b>{TOTAL_SOURCES}</b><span>Sources</span></div>
            <div className="rl-stat"><b>3</b><span>Volumes</span></div>
            <div className="rl-stat rl-stat-accent"><b>0</b><span>Fabricated</span></div>
          </div>
        </div>

        {/* SECTION TABS */}
        <div className="rl-section-tabs">
          <button
            type="button"
            className={`rl-section-tab${section === "lines" ? " active" : ""}`}
            onClick={() => setSection("lines")}
          >
            <FileText size={15} />
            <span>Line Evidence</span>
            <span className="rl-tab-meta">32 lines · 118 sources</span>
          </button>
          <button
            type="button"
            className={`rl-section-tab${section === "trainability" ? " active" : ""}`}
            onClick={() => setSection("trainability")}
          >
            <TrendingUp size={15} />
            <span>Trainability Evidence</span>
            <span className="rl-tab-meta">19 sections · 22 sources</span>
          </button>
          <button
            type="button"
            className={`rl-section-tab${section === "practices" ? " active" : ""}`}
            onClick={() => setSection("practices")}
          >
            <Sparkles size={15} />
            <span>Practices &amp; Evidence</span>
            <span className="rl-tab-meta">{PRACTICE_SECTION_COUNT} sections · {PRACTICE_SOURCE_COUNT} sources</span>
          </button>
        </div>

        {/* VOLUME CARDS — contextual to active section */}
        {section === "lines" && (
          <div className="rl-volumes">
            <div className="rl-volcard">
              <div className="rl-volicon"><FileText size={20} /></div>
              <div className="rl-volkick">VOLUME I</div>
              <div className="rl-voltitle">The Five New Lines</div>
              <div className="rl-voldesc">Financial, Humor, Seductive, Parental, and Community-Founding — annotated, source by source.</div>
              <div className="rl-volmeta">37 sources · 12 pages</div>
              <a href={VOL1_URL} target="_blank" rel="noreferrer" className="rl-volbtn">View PDF <ExternalLink size={12} /></a>
            </div>
            <div className="rl-volcard">
              <div className="rl-volicon"><FileText size={20} /></div>
              <div className="rl-volkick">VOLUME II</div>
              <div className="rl-voltitle">The Twenty-Seven Classical &amp; Applied Lines</div>
              <div className="rl-voldesc">From Logical to Street-Smarts — every remaining line, sourced across five families.</div>
              <div className="rl-volmeta">81 sources · 18 pages</div>
              <a href={VOL2_URL} target="_blank" rel="noreferrer" className="rl-volbtn">View PDF <ExternalLink size={12} /></a>
            </div>
          </div>
        )}
        {section === "trainability" && (
          <div className="rl-volumes">
            <div className="rl-volcard" style={{ borderColor: "rgba(155,192,178,0.4)" }}>
              <div className="rl-volicon" style={{ color: JADE }}><Brain size={20} /></div>
              <div className="rl-volkick">VOLUME III</div>
              <div className="rl-voltitle">The Trainability Evidence</div>
              <div className="rl-voldesc">What happens when you build a weak intelligence line. 19 trainability sections across cognitive, social, conative, aesthetic, and bodily domains — plus the honest boundary.</div>
              <div className="rl-volmeta">22 sources · 11 pages</div>
              <a href={VOL3_URL} target="_blank" rel="noreferrer" className="rl-volbtn">View PDF <ExternalLink size={12} /></a>
            </div>
            <div className="rl-volcard" style={{ borderColor: "rgba(200,92,68,0.4)" }}>
              <div className="rl-volicon" style={{ color: "#C85C44" }}><Shield size={20} /></div>
              <div className="rl-volkick">SPECIAL BRIEF</div>
              <div className="rl-voltitle">The Weakness-Cluster Report</div>
              <div className="rl-voldesc">Why unidentified weaknesses — not missing strengths — collapse a life. 22 concrete collapse scenarios across six domains, the O-ring math, and the shield pathway.</div>
              <div className="rl-volmeta">8 sources · 9 pages</div>
              <a href={WEAKNESS_REPORT_URL} target="_blank" rel="noreferrer" className="rl-volbtn">View PDF <ExternalLink size={12} /></a>
            </div>
          </div>
        )}

        {/* ===== LINE EVIDENCE SECTION ===== */}
        {section === "lines" && (
          <>
            {/* TIER LEGEND */}
            <div className="rl-legend">
              <div className="rl-legend-title">Evidence tier — hallmarked, not hidden</div>
              <div className="rl-legend-row">
                {Object.entries(TIER).map(([key, t]) => (
                  <div className="rl-legend-item" key={key}>
                    <TierDot tier={key} />
                    <div>
                      <div className="rl-legend-name" style={{ color: t.c }}>{t.label}</div>
                      <div className="rl-legend-desc">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEARCH + FILTERS */}
            <div className="rl-controls">
              <div className="rl-search">
                <Search size={15} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a line — try &quot;Spatial&quot; or &quot;Grit&quot;"
                />
              </div>
              <div className="rl-chips">
                <button
                  type="button"
                  className={`rl-chip${activeFamily === "all" ? " active" : ""}`}
                  onClick={() => setActiveFamily("all")}
                >
                  All {TOTAL_LINES}
                </button>
                {FAMILIES.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`rl-chip${activeFamily === f.key ? " active" : ""}`}
                    onClick={() => setActiveFamily(f.key)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* GROUPED GRID */}
            {visibleFamilyCount === 0 && (
              <div className="rl-empty">No line matches &ldquo;{query}&rdquo;. Try a different search, or clear the filter above.</div>
            )}

            {FAMILIES.map((fam) => {
              const lines = grouped[fam.key];
              if (!lines || lines.length === 0) return null;
              return (
                <div className="rl-family" key={fam.key}>
                  <div className="rl-family-head">
                    {fam.name} <span>· {lines.length} {lines.length === 1 ? "line" : "lines"}</span>
                    {fam.note && <span className="rl-family-note">— {fam.note}</span>}
                  </div>
                  <div className="rl-grid">
                    {lines.map((line) => (
                      <LineCard
                        key={line.id}
                        line={line}
                        open={openIds.has(line.id)}
                        onToggle={() => toggle(line.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="rl-foot">
              <b>Honest note:</b> one representative source is shown per line above. The full annotated bibliography —
              all {VOLUME_SOURCES} sources, each with its own note and link — lives in the three volumes. Sources marked
              with <ShieldCheck size={11} style={{ display: "inline", verticalAlign: -2, margin: "0 2px" }} /> link
              directly to the publisher via DOI; the rest link to Google Scholar for the canonical instrument. Nothing
              here is inflated, and nothing is invented.
            </div>
          </>
        )}

        {/* ===== TRAINABILITY EVIDENCE SECTION ===== */}
        {section === "trainability" && (
          <>
            <div className="rl-train-intro">
              <div className="rl-train-headline">
                <Brain size={22} style={{ color: JADE }} />
                <h2>Can You Actually Build a Weak Intelligence Line?</h2>
              </div>
              <p className="rl-train-sub">
                The short answer: <strong style={{ color: JADE }}>yes, for most lines, with the right intervention.</strong>{" "}
                The long answer is below — every claim linked to the trial or meta-analysis that supports it.
                We also show you where the evidence stops.
              </p>
              <div className="rl-train-stats">
                <div className="rl-stat"><b>22</b><span>Sources</span></div>
                <div className="rl-stat"><b>19</b><span>Sections</span></div>
                <div className="rl-stat"><b>10+</b><span>Years Tracked</span></div>
                <div className="rl-stat rl-stat-accent"><b>1</b><span>Honest Boundary</span></div>
              </div>
            </div>

            {TRAINABILITY_CLUSTERS.map((cluster) => {
              const isOpen = openTrainIds.has(cluster.id);
              return (
                <div key={cluster.id} id={`src-${cluster.id}`} className={`rl-train-cluster${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="rl-train-head"
                    onClick={() => toggleTrain(cluster.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="rl-train-head-top">
                      <div className="rl-train-title">{cluster.title}</div>
                      <ChevronDown className="rl-chev" size={15} />
                    </div>
                    <div className="rl-train-subtitle">{cluster.subtitle}</div>
                    <p className="rl-train-desc">{cluster.description}</p>
                    <div className="rl-card-meta">{cluster.sources.length} source{cluster.sources.length !== 1 ? "s" : ""}</div>
                  </button>
                  {isOpen && (
                    <div className="rl-train-sources">
                      {cluster.sources.map((src, i) => (
                        <div key={i} className="rl-train-source">
                          <div className="rl-detail-cite">{src.cite}</div>
                          <p className="rl-detail-note">{src.note}</p>
                          <a className="rl-detail-link" href={src.link} target="_blank" rel="noreferrer">
                            {src.kind === "doi" ? <ShieldCheck size={12} /> : <ExternalLink size={12} />}
                            {src.kind === "doi" ? src.link.replace("https://doi.org/", "doi.org/") : "Google Scholar"}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rl-foot">
              <b>The principle:</b> generic brain games don't transfer. But validated, line-specific interventions —
              spatial training, financial education, emotional-competence programs, structured leadership development —
              produce durable, measurable gains that persist for years and spill over into real life outcomes.
              Every source above links to the published paper. Check it yourself.
            </div>
          </>
        )}

        {/* ===== PRACTICES & EVIDENCE SECTION ===== */}
        {section === "practices" && (
          <>
            {/* GUARDRAIL HEADER */}
            <div className="rl-practice-guardrail">
              <h3><Sparkles size={22} style={{ color: CHAMPAGNE }} /> How to read this library</h3>
              <p>
                Every study below documents what an <b>activity</b> does. These are <b>nearest-construct mappings, not
                proof</b> about the 32 proprietary lines — research on the construct nearest each line, never "proven to
                raise your AQAL score."
              </p>
              <p><b>Education and coaching, never prediction.</b></p>
              <p>
                Evidence tags: <b>Strong</b> = large meta-analyses / multiple RCTs; <b>Moderate</b> = meta-analytic
                support with caveats; <b>Emerging</b> = correlational or thinner literature.
              </p>
              <div className="rl-practice-tags">
                {(["Strong", "Moderate", "Emerging", "Mixed"] as PracticeCluster["evidenceTag"][]).map((t) => (
                  <span key={t} className="rl-tag" style={{ color: TAG_COLOR[t] }}>{t}</span>
                ))}
              </div>
            </div>

            {/* SEARCH + SECTION JUMP + TAG FILTER */}
            <div className="rl-controls">
              <div className="rl-search">
                <Search size={15} />
                <input
                  type="text"
                  value={practiceQuery}
                  onChange={(e) => setPracticeQuery(e.target.value)}
                  placeholder="Search practices &amp; studies — try &quot;sleep&quot;, &quot;grit&quot;, or &quot;meta-analysis&quot;"
                />
                {practiceQuery && (
                  <button type="button" className="rl-search-clear" onClick={() => setPracticeQuery("")} aria-label="Clear search">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Section jump-nav */}
            <div className="rl-chips rl-practice-sections">
              <button
                type="button"
                className={`rl-chip${practiceSectionFilter === "all" ? " active" : ""}`}
                onClick={() => setPracticeSectionFilter("all")}
              >
                All {PRACTICE_SECTION_COUNT} sections
              </button>
              {practiceSectionKeys.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`rl-chip${practiceSectionFilter === s ? " active" : ""}`}
                  onClick={() => setPracticeSectionFilter(practiceSectionFilter === s ? "all" : s)}
                >
                  <span className="rl-chip-num">{s}</span> {PRACTICE_SECTION_SHORT[s] || PRACTICE_SECTIONS[s]}
                </button>
              ))}
            </div>

            {/* Evidence-tag filter */}
            <div className="rl-chips rl-practice-tagfilter">
              <button
                type="button"
                className={`rl-chip${practiceTag === "all" ? " active" : ""}`}
                onClick={() => setPracticeTag("all")}
              >
                All evidence
              </button>
              {(["Strong", "Moderate", "Emerging", "Mixed"] as PracticeCluster["evidenceTag"][]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`rl-chip${practiceTag === t ? " active" : ""}`}
                  style={practiceTag === t ? { borderColor: TAG_COLOR[t], color: TAG_COLOR[t] } : undefined}
                  onClick={() => setPracticeTag(practiceTag === t ? "all" : t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Result count */}
            <div className="rl-practice-count">
              Showing <b>{filteredPractices.length}</b> of {PRACTICE_EVIDENCE.length} topics
              {(practiceSectionFilter !== "all" || practiceTag !== "all" || practiceSearching) && (
                <button
                  type="button"
                  className="rl-clear-all"
                  onClick={() => { setPracticeQuery(""); setPracticeTag("all"); setPracticeSectionFilter("all"); }}
                >
                  Clear all
                </button>
              )}
            </div>

            {filteredPractices.length === 0 && (
              <div className="rl-empty">
                No practice or study matches your filters. Try a different keyword, section, or evidence level — or clear all.
              </div>
            )}

            {filteredPractices.map((cluster, idx) => {
              const isOpen = openPracticeIds.has(cluster.id) || practiceSearching;
              const prev = filteredPractices[idx - 1];
              const showHead = !prev || prev.section !== cluster.section;
              const showGroup = !prev || PRACTICE_GROUP[prev.section] !== PRACTICE_GROUP[cluster.section];
              return (
                <React.Fragment key={cluster.id}>
                  {showGroup && PRACTICE_GROUP[cluster.section] && (
                    <div className="rl-practice-group-head">{PRACTICE_GROUP[cluster.section]}</div>
                  )}
                  {showHead && (
                    <div className="rl-practice-section-head">{PRACTICE_SECTIONS[cluster.section]}</div>
                  )}
                  {cluster.callout && (
                    <div className="rl-practice-callout">
                      <div className="rl-callout-label"><Shield size={12} /> Honest guardrail</div>
                      <p>{cluster.callout}</p>
                    </div>
                  )}
                  <div id={`src-${cluster.id}`} className={`rl-train-cluster${isOpen ? " is-open" : ""}`}>
                    <button
                      type="button"
                      className="rl-train-head"
                      onClick={() => togglePractice(cluster.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="rl-train-head-top">
                        <div className="rl-train-title">
                          {cluster.title}
                          <span className="rl-tag" style={{ color: TAG_COLOR[cluster.evidenceTag] }}>
                            {cluster.evidenceTag}
                          </span>
                        </div>
                        <ChevronDown className="rl-chev" size={15} />
                      </div>
                      <div className="rl-train-subtitle">{cluster.subtitle}</div>
                      <p className="rl-train-desc">{cluster.description}</p>
                      <div className="rl-card-meta">{cluster.sources.length} source{cluster.sources.length !== 1 ? "s" : ""}</div>
                    </button>
                    {isOpen && (
                      <div className="rl-train-sources">
                        {cluster.sources.map((src, i) => (
                          <div key={i} className="rl-train-source">
                            <div className="rl-detail-cite">{src.cite}</div>
                            <p className="rl-detail-note">{src.note}</p>
                            <a className="rl-detail-link" href={src.link} target="_blank" rel="noreferrer">
                              {src.kind === "doi" ? <ShieldCheck size={12} /> : <ExternalLink size={12} />}
                              {src.kind === "doi" ? src.link.replace("https://doi.org/", "doi.org/") : "Google Scholar"}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}

            <div className="rl-foot">
              <b>The honest bottom line:</b> every study here documents what an activity does — a nearest-construct
              mapping, never proof about your individual lines. We speak in "associated with," "linked to," and
              "supports," because that is what the evidence says. Education and coaching, never prediction.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
