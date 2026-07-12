import React, { useState, useMemo } from "react";
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
];

// Live counts so the header can never drift from the data again.
const PRACTICE_SOURCE_COUNT = PRACTICE_EVIDENCE.reduce((n, c) => n + c.sources.length, 0);
const PRACTICE_SECTION_COUNT = new Set(PRACTICE_EVIDENCE.map((c) => c.section)).size;
const TOTAL_SOURCES = VOLUME_SOURCES + PRACTICE_SOURCE_COUNT;

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

  // Sections present, in display order, for the practices jump-nav.
  const practiceSectionKeys = useMemo(
    () => Array.from(new Set(PRACTICE_EVIDENCE.map((c) => c.section))),
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
    });
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
        .rl-practice-section-head{font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.18em;
          text-transform:uppercase; color:${CHAMPAGNE}; margin:30px 0 14px; padding-bottom:9px; border-bottom:1px solid ${LINE};}
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
                <div key={cluster.id} className={`rl-train-cluster${isOpen ? " is-open" : ""}`}>
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
              return (
                <React.Fragment key={cluster.id}>
                  {showHead && (
                    <div className="rl-practice-section-head">{PRACTICE_SECTIONS[cluster.section]}</div>
                  )}
                  {cluster.callout && (
                    <div className="rl-practice-callout">
                      <div className="rl-callout-label"><Shield size={12} /> Honest guardrail</div>
                      <p>{cluster.callout}</p>
                    </div>
                  )}
                  <div className={`rl-train-cluster${isOpen ? " is-open" : ""}`}>
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
