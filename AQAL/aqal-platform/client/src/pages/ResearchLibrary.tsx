import React, { useState, useMemo, useEffect } from "react";
import {
  Search, ChevronDown, ExternalLink, FileText, ShieldCheck,
  Sparkles, LayoutGrid, ArrowLeft, Brain, TrendingUp, Shield, X,
} from "lucide-react";
import { Link } from "wouter";
import { PRACTICE_EVIDENCE } from "./researchLibraryData";

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

type PracticeSource = { cite: string; note: string; link: string; kind: "doi" | "scholar" };

// ---- Impact / leverage model -------------------------------------------------
// An honest, deterministic gauge of "how much result per unit of effort and time"
// for a practice. NOT a promise — it's a directional rating built from the same
// research the cluster cites: how big the effect is, how proven, how lasting, how
// fast it shows up, and how much energy it costs to run.
type PracticeImpact = {
  magnitude: 1 | 2 | 3 | 4 | 5;               // size of the effect on the person's life
  latency: "days" | "weeks" | "months";        // time to first noticeable results
  durability: "transient" | "sustained" | "lasting"; // how long results hold
  effort: "low" | "moderate" | "high";         // energy-in to run the practice
};

// Weights are fixed and documented so the score can never be hand-waved.
const EVIDENCE_W: Record<PracticeCluster["evidenceTag"], number> = { Strong: 1, Moderate: 0.8, Emerging: 0.6, Mixed: 0.6 };
const DURABILITY_W: Record<PracticeImpact["durability"], number> = { lasting: 1, sustained: 0.85, transient: 0.6 };
const EFFORT_W: Record<PracticeImpact["effort"], number> = { low: 1, moderate: 0.75, high: 0.55 };   // higher = less effort = better
const LATENCY_W: Record<PracticeImpact["latency"], number> = { days: 1, weeks: 0.85, months: 0.7 };

// Leverage Score (0–100) = 70·benefit + 30·ease.
//   benefit = (magnitude/5) · evidenceWeight · durabilityWeight   → big, proven, lasting
//   ease    = effortWeight · latencyWeight                        → cheap energy-in, fast results-out
function leverageScore(impact: PracticeImpact, evidence: PracticeCluster["evidenceTag"]): number {
  const benefit = (impact.magnitude / 5) * EVIDENCE_W[evidence] * DURABILITY_W[impact.durability];
  const ease = EFFORT_W[impact.effort] * LATENCY_W[impact.latency];
  return Math.round(100 * (0.7 * benefit + 0.3 * ease));
}

// ---- Cost-of-failure model ---------------------------------------------------
// The mirror of the leverage gauge. These clusters document what an activity or
// life-event COSTS — what breaks when things go wrong. There is deliberately no
// leverage score here: a harm is not a "practice to run." Instead we rate how
// damaging it is, how reversible, and how fast it lands, weighted by the same
// evidence tier. Higher = more costly and more urgent to prevent. Same honest
// discipline: severity/onset/reversibility come straight from the cited studies,
// and every entry carries a caveat about confounding and reverse-causation.
type PracticeHarm = {
  severity: 1 | 2 | 3 | 4 | 5;                          // how damaging the cost is
  onset: "immediate" | "months" | "years";              // time to the damage landing
  reversibility: "recovers" | "partial" | "lasting";    // how much can be undone
};
const REVERSIBILITY_W: Record<PracticeHarm["reversibility"], number> = { recovers: 0.6, partial: 0.8, lasting: 1 };
const ONSET_W: Record<PracticeHarm["onset"], number> = { immediate: 1, months: 0.85, years: 0.7 };

// Cost Score (0–100) = 70·damage + 30·imminence.
//   damage    = (severity/5) · evidenceWeight · reversibilityWeight  → big, proven, irreversible
//   imminence = onsetWeight                                          → how soon it hits
function costScore(harm: PracticeHarm, evidence: PracticeCluster["evidenceTag"]): number {
  const damage = (harm.severity / 5) * EVIDENCE_W[evidence] * REVERSIBILITY_W[harm.reversibility];
  const imminence = ONSET_W[harm.onset];
  return Math.round(100 * (0.7 * damage + 0.3 * imminence));
}

// ---- Weakness-line → failure model ------------------------------------------
// A third lens: not a practice to run, not a life-event that befalls you, but a
// WEAK developmental line that research shows collapses goals and drives failure
// modes. Each entry names which of the profile's 32 lines is the culprit, how
// strongly it drives the failure, and a 1–10 THREAT rating — how broadly and
// severely a deficit in this line derails a life, grounded in the cited studies.
// Same honesty discipline: reverse-causation and confounding caveats on every one.
type WeaknessProfile = {
  threat: number;                                     // 1–10 danger rating (agent-assigned, grounded in the research)
  weakLines: string[];                                // which profile line(s), when weak, drive the failure
  degree: "primary driver" | "major contributor" | "moderate contributor";
  onset: "immediate" | "months" | "years";            // how soon the deficit bites
  reversibility: "recovers" | "partial" | "lasting";  // is the line trainable back up?
};
// Threat colour bands (higher = more dangerous). Deliberately not a derived
// formula — the 1–10 is a research-grounded severity call, shown as given.
function threatColor(threat: number): string {
  return threat >= 8 ? "#d9534f" : threat >= 6 ? "#d9695a" : threat >= 4 ? "#cf8a5a" : "#b8926a";
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999,
  padding: "2px 8px", fontSize: 10.5, color: "var(--rl-muted, #b9b2a6)", whiteSpace: "nowrap",
};

export type PracticeCluster = {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  description: string;
  evidenceTag: "Strong" | "Moderate" | "Emerging" | "Mixed";
  callout?: string;
  // Optional interconnection + impact metadata (present on newer clusters).
  feeds?: string[];          // plain-language capacities/systems this practice strengthens
  impact?: PracticeImpact;   // the leverage gauge (benefit clusters)
  harm?: PracticeHarm;       // the cost gauge (cost-of-failure clusters)
  weakness?: WeaknessProfile;// the threat gauge (weakness-line → failure clusters)
  degrades?: string[];       // plain-language capacities/systems a harm/weakness cluster erodes
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
  "42": "42 · Grip & Muscular Strength",
  "43": "43 · Protein & Muscle Preservation",
  "44": "44 · Creatine",
  "45": "45 · HIIT & Interval Training",
  "46": "46 · Glucose Regulation & Post-Meal Walking",
  "47": "47 · Dietary Fiber",
  "48": "48 · Reducing Ultra-Processed Food",
  "49": "49 · Vitamin D & Sunlight",
  "50": "50 · Hearing & Cognition",
  "51": "51 · Oral & Periodontal Health",
  "52": "52 · Air Quality",
  "53": "53 · Vision Correction",
  "54": "54 · Blue Space — Water & Wellbeing",
  "55": "55 · Pets & Companion Animals",
  "56": "56 · Caffeine",
  "57": "57 · Alcohol Reduction",
  "58": "58 · Dance",
  "59": "59 · Tai Chi & Qigong",
  "60": "60 · Walking & Daily Steps",
  "61": "61 · Breaking Up Sitting",
  "62": "62 · Singing & Choir",
  "63": "63 · Sexual Health & Longevity",
  "64": "64 · Flow States",
  "65": "65 · Massage & Bodywork",
  "66": "66 · Mindfulness & MBSR",
  "67": "67 · Loving-Kindness Meditation",
  "68": "68 · Self-Compassion",
  "69": "69 · Reappraisal vs. Suppression",
  "70": "70 · Forgiveness",
  "71": "71 · Optimism & Explanatory Style",
  "72": "72 · Savoring",
  "73": "73 · Nature Dose — 120 min/week",
  "74": "74 · Goal-Setting",
  "75": "75 · Habit Formation",
  "76": "76 · Automated & Index Investing",
  "77": "77 · Autonomy & Job Control",
  "78": "78 · Time Affluence",
  "79": "79 · Sleep Regularity",
  "80": "80 · Laughter & Humor",
  "81": "81 · Learning by Teaching",
  "82": "82 · EMDR",
  "83": "83 · Clinical & Ericksonian Hypnosis",
  "84": "84 · Cognitive Behavioral Therapy (CBT)",
  "85": "85 · Behavioral Activation",
  "86": "86 · Acceptance & Commitment Therapy (ACT)",
  "87": "87 · Exposure Therapy",
  "88": "88 · Dialectical Behavior Therapy (DBT) Skills",
  "89": "89 · Motivational Interviewing",
  "90": "90 · Psychodynamic & Interpersonal Therapy",
  "91": "91 · Support Groups & Group Therapy",
  "92": "92 · NLP — The Honest Verdict",
  "93": "93 · NLP Meta-Programs & Modality Matching",
  "94": "94 · Rapport, Mirroring & Language Patterns",
  "95": "95 · Self-Affirmation",
  "96": "96 · Self-Talk",
  "97": "97 · Mental Imagery & Visualization",
  "98": "98 · Mental Contrasting (WOOP)",
  "99": "99 · Placebo & Expectancy Effects",
  "100": "100 · Biofeedback & Neurofeedback",
  "101": "101 · Progressive Relaxation & Autogenic Training",
  "102": "102 · Adolescent Work — Moderate Hours",
  "103": "103 · Work Intensity Threshold (>20 hrs)",
  "104": "104 · Household Chores & Responsibility",
  "105": "105 · Youth Entrepreneurship & Paper Routes",
  "106": "106 · Early Employment & Later Earnings",
  "107": "107 · Adult Continuing Education (Non-Degree)",
  "108": "108 · Apprenticeship & Vocational Training",
  "109": "109 · Youth Mentoring Programs",
  "110": "110 · Extracurricular Participation",
  "111": "111 · Shared Reading & Early Literacy",
  "112": "112 · Community & Rec Sports Teams",
  "113": "113 · Social Clubs & Group Games (incl. Bingo)",
  "114": "114 · Marriage & Long-Term Partnership",
  "115": "115 · Religious Service Attendance",
  "116": "116 · Social Prescribing",
  "117": "117 · Prosocial Spending & Kindness",
  "118": "118 · Adult Mentoring",
  "119": "119 · Befriending & Loneliness Interventions",
  "120": "120 · Book Clubs & Interest Groups",
  "121": "121 · Intergenerational Programs",
  "122": "122 · Houseplants",
  "123": "123 · Gardening & Horticultural Therapy",
  "124": "124 · The Pet Rock — Talking It Out",
  "125": "125 · Cooking at Home",
  "126": "126 · Handwriting & Longhand Notes",
  "127": "127 · Action Video Games",
  "128": "128 · Brain-Training Games — The Honest Verdict",
  "129": "129 · Chess & Strategy Games",
  "130": "130 · Napping",
  "131": "131 · Weighted Blankets",
  "132": "132 · Gestalt & Empty-Chair Work",
  "133": "133 · Emotion-Focused Therapy (EFT)",
  "134": "134 · Couples' Novel & Arousing Activities",
  "135": "135 · Couple Friendships & Double Dates",
  "136": "136 · Parenting for Child Development",
  "137": "137 · Child Independent Mobility",
  "138": "138 · Free & Risky Play",
  "139": "139 · Youth Team Sports",
  "140": "140 · Golf",
  // The cost of failure — what breaks when things go wrong
  "141": "141 · Divorce — Adult Health & Mortality", "142": "142 · High-Conflict Custody Battles",
  "143": "143 · Parental Divorce — Effect on Children", "144": "144 · Infidelity / Betrayal Trauma",
  "145": "145 · Spousal Bereavement / Widowhood", "146": "146 · Death of a Child",
  "147": "147 · Death of a Parent in Adulthood", "148": "148 · Dementia Caregiving Strain",
  "149": "149 · Chronic Loneliness", "150": "150 · Social Isolation",
  "151": "151 · Cancer & \"Chemo Brain\" (CRCI)", "152": "152 · Chronic Illness + Comorbid Depression",
  "153": "153 · Chronic Pain — Cognition & Gray Matter", "154": "154 · Chronic Stress / Allostatic Load",
  "155": "155 · Sleep Deprivation", "156": "156 · Obesity — Cognition & Brain Structure",
  "157": "157 · Smoking — Cognitive Decline & Dementia", "158": "158 · Alcohol — Brain Damage & Cognition",
  "159": "159 · Physical Inactivity / Sedentary Behavior", "160": "160 · Sarcopenia — Muscle & Strength Loss",
  "161": "161 · Depression — Hippocampal Volume Loss", "162": "162 · Chronic Anxiety — Cognition & Cardiac Risk",
  "163": "163 · Rumination", "164": "164 · Chronic Hostility / Anger — CVD",
  "165": "165 · Trauma / PTSD — Brain & Function", "166": "166 · Perfectionism — Burnout & Suicide Risk",
  "167": "167 · Chronic Self-Criticism / Shame", "168": "168 · Unforgiveness / Grudge-Holding",
  "169": "169 · Learned Helplessness / Pessimistic Style", "170": "170 · Chronic Worry / GAD",
  "171": "171 · Problematic Social Media / Doomscrolling", "172": "172 · Late-Night Smartphone / Sleep Loss",
  "173": "173 · Procrastination", "174": "174 · Financial Scarcity / Debt Stress",
  "175": "175 · Unemployment / Job Loss", "176": "176 · Retirement Without Purpose",
  "177": "177 · Job Burnout / Workaholism", "178": "178 · Gambling Disorder",
  "179": "179 · Chronic Media Multitasking", "180": "180 · Sleep Debt / Social Jetlag / Shift Work",
  "181": "181 · Adverse Childhood Experiences (ACEs)", "182": "182 · Chronic Discrimination / Racism",
  "183": "183 · Childhood Poverty / Low SES", "184": "184 · Incarceration",
  "185": "185 · Empty Nest / Role Transition", "186": "186 · Food Insecurity",
  "187": "187 · Housing Instability / Eviction", "188": "188 · Neighborhood Violence / Threat",
  "189": "189 · Excessive Early-Childhood Screen Use", "190": "190 · Chronic Caregiver Burden (Non-Dementia)",
  // AI as coach, companion & mirror + skill/relationship interventions
  "191": "191 · Learning Sign Language (ASL)", "192": "192 · AI Chatbots as Therapist",
  "193": "193 · AI Companionship / Chatbot Relationship", "194": "194 · AI as Coach / Co-Creator",
  "195": "195 · Self-Disclosure to an AI / Journaling", "196": "196 · Feeding an AI Your Personal History",
  "197": "197 · Car Cleaning / Detailing / Ordered Environment", "198": "198 · Getting Engaged / Commitment Transition",
  // Wave 4 — physiology & dating
  "199": "199 · Voluntary Breath-Hold / Freediving", "200": "200 · Backwards / Retro Walking",
  "201": "201 · Spinning / Vestibular Stimulation", "202": "202 · Speed Dating & Mate Choice",
  "203": "203 · Online Dating Outcomes & Wellbeing", "204": "204 · Approaching Strangers",
  "205": "205 · Matchmaking & Network Approval", "206": "206 · Family Courtship / Arranged Marriage",
  "207": "207 · Learning an Instrument as an Adult", "208": "208 · Writing Love Letters / Affectionate Writing",
  // Wave 4 — hunting, pets & recreation
  "209": "209 · Recreational Hunting & Nature Connection", "210": "210 · Dog Ownership & Adoption",
  "211": "211 · Pet Caregiving & Bereavement", "212": "212 · Aquariums / Fishkeeping",
  "213": "213 · League / Social Bowling", "214": "214 · Batting Cage / Recreational Hitting",
  "215": "215 · Target / Sport Shooting", "216": "216 · Board / Tabletop Games With Friends",
  "217": "217 · Adult Social Dance Classes", "218": "218 · Golf Driving Range / Precision Practice",
  // Wave 4 — movement & adventure
  "219": "219 · Bouldering / Rock Climbing for Depression", "220": "220 · Surf Therapy / Ocean Therapy",
  "221": "221 · Horseback Riding / Equine-Assisted Therapy", "222": "222 · Trail / Distance Running & Depression",
  "223": "223 · Rucking / Weighted Walking", "224": "224 · Jump Rope / Skipping",
  "225": "225 · Stair Climbing & Fitness", "226": "226 · Pilates & Core / Back Pain",
  "227": "227 · Stretching / Flexibility / Mobility", "228": "228 · Slacklining / Balance Training",
  // Wave 4 — cognitive & skill (novel techniques)
  "229": "229 · Interleaved Practice", "230": "230 · Learning a Second Language as an Adult",
  "231": "231 · Crossword & Number Puzzles", "232": "232 · Journaling — Morning Pages / Free-Writing",
  "233": "233 · Learning to Touch-Type / Skill Automation", "234": "234 · Sleep-Tracking / Self-Monitoring",
  "235": "235 · Time-Blocking / Calendar Scheduling", "236": "236 · Qigong for Immune / Inflammation",
  "237": "237 · Laughter Yoga", "238": "238 · Awe Walks",
  // Wave 4 — body & sensory (hacks, mnemonics & honest debunks)
  "239": "239 · Cold Showers", "240": "240 · Wim Hof Method (Breathing + Cold)",
  "241": "241 · Humming / Chanting / 'Om'", "242": "242 · Chewing Gum & Alertness",
  "243": "243 · Learning to Juggle & Brain Plasticity", "244": "244 · Memory Palace / Method of Loci",
  "245": "245 · Doodling & Attention/Memory", "246": "246 · Adult / Mandala Coloring & Anxiety",
  "247": "247 · Speed Reading — Honest Debunk", "248": "248 · Barefoot / 'Grounding' / Earthing",
  // Wave 4 — social & behavioral (connection, ritual & positive practice)
  "249": "249 · Family Dinners / Eating Together", "250": "250 · Hosting / Commensality / Shared Meals",
  "251": "251 · Silent Meditation Retreats / Vipassana", "252": "252 · Pilgrimage / Long-Distance Walking",
  "253": "253 · Expressing Gratitude Directly (Gratitude Visit)", "254": "254 · Acts of Connection — Complimenting Strangers",
  "255": "255 · Community / Instrumental Ensemble Belonging", "256": "256 · Digital Sabbath / Screen-Free Day",
  "257": "257 · 'Three Good Things' / 'Best Possible Self' Journaling",
  // Wave 4 — order, digital environment & manifestation
  "258": "258 · Clean / Tidy Whole Home", "259": "259 · Workspace / Office Organization",
  "260": "260 · Digital Decluttering / Email Overload", "261": "261 · Photo Organization / Digital Hoarding",
  "262": "262 · Vision Boards / Positive Visualization", "263": "263 · Dream Journaling & Working With Dreams",
  "264": "264 · Letters From Your Future Self", "265": "265 · Cursive vs. Print Handwriting",
  // Wave 4 — creative & expressive arts
  "266": "266 · Art-Making / Drawing / Painting", "267": "267 · Photography as a Hobby / Savoring",
  "268": "268 · Creative Writing & Poetry Therapy", "269": "269 · Improv Comedy / Theater Classes",
  "270": "270 · Public Speaking / Toastmasters", "271": "271 · Pottery / Ceramics / Clay Work",
  "272": "272 · Knitting / Crochet", "273": "273 · Woodworking / 'Men's Sheds'",
  "274": "274 · Singing Lessons / Solo Voice", "275": "275 · Birdwatching / Nature Observation",
  // Recovery, amends & self-facing practice
  "276": "276 · Twelve-Step Programs / AA", "277": "277 · Making Amends / Seeking Forgiveness",
  "278": "278 · Mirror Meditation", "279": "279 · Mirror Self-Talk",
  "280": "280 · Self-Forgiveness", "281": "281 · Granting / Receiving Forgiveness",
  "282": "282 · Sponsorship / Peer Recovery Support", "283": "283 · Confession / Disclosure of Wrongdoing",
  "284": "284 · Ritual / Symbolic Apology & Reconciliation", "285": "285 · Amends Letters / Accountability Writing",
  // Weakness lines — what collapses a goal
  "286": "286 · Low Childhood Self-Control → Derailment", "287": "287 · Low Adult Self-Control → Underachievement",
  "288": "288 · Low Conscientiousness → Early Death", "289": "289 · Delay Discounting → Addiction",
  "290": "290 · Delay Discounting → Obesity", "291": "291 · Present Bias → Debt & Ruin",
  "292": "292 · Maladaptive Emotion Regulation → Psychopathology", "293": "293 · Emotion Dysregulation → Self-Injury",
  "294": "294 · Low Distress Tolerance → Dropout & Relapse", "295": "295 · Poor Emotion Regulation → Relationship Decline",
  "296": "296 · Alexithymia / Poor Interoception → Somatization", "297": "297 · Competence-Blindness (Dunning-Kruger)",
  "298": "298 · The Planning Fallacy → Budget Collapse", "299": "299 · Megaproject Collapse (No Outside View)",
  "300": "300 · Lazy Reasoning → Scam Susceptibility", "301": "301 · Myside Bias → Belief-Driven Failure",
  "302": "302 · Stock-Flow Blindness → Systems Collapse", "303": "303 · Expert Overconfidence → Strategic Misjudgment",
  "304": "304 · Numeracy Deficits → Medical & Financial Misjudgment", "305": "305 · Escalation of Commitment",
  "306": "306 · Premature Closure → Diagnostic Error", "307": "307 · Executive Derailment (Insensitivity)",
  "308": "308 · Dark-Triad Traits → Counterproductive Work Behavior", "309": "309 · Abusive Supervision → Team Collapse",
  "310": "310 · Narcissistic CEO → Fraud & Firm Risk", "311": "311 · Moral Disengagement → Misconduct",
  "312": "312 · Contempt in Conflict → Divorce", "313": "313 · Low Empathic Accuracy → Dissatisfaction",
  "314": "314 · Weak Political Skill → Career Plateau", "315": "315 · Low Emotional Intelligence → Underperformance",
  "316": "316 · Poor Social Skill → Isolation → Mortality", "317": "317 · Grit Deficit → Attrition & Dropout",
  "318": "318 · Low Self-Efficacy → Avoidance", "319": "319 · Fixed Mindset → Giving Up",
  "320": "320 · Low Purpose / Meaning → Higher Mortality", "321": "321 · Pessimistic Style → Depression Onset",
  "322": "322 · Poor Self-Concept Clarity → Instability", "323": "323 · Low Resilience → Chronic PTSD",
  "324": "324 · Identity Foreclosure / Diffusion → Maladjustment", "325": "325 · Low Financial Literacy → Under-Saving",
  "326": "326 · Low Debt Literacy → High-Cost Borrowing", "327": "327 · Numeracy Deficit → Foreclosure",
  "328": "328 · Investor Overconfidence → Wealth Destruction", "329": "329 · Entrepreneurial Hubris → Venture Collapse",
  "330": "330 · PMF Failure → Startup Death", "331": "331 · Poor Communication → Project Failure",
  "332": "332 · Weak Negotiation → Value Left on the Table", "333": "333 · Low Practical Intelligence → Job Shortfall",
  "334": "334 · Weak Mechanical Competence → Accidents", "335": "335 · Scam Susceptibility → Financial Victimization",
  // Cost of failure, wave 2 — medical, addiction, financial/legal
  "336": "336 · Traumatic Brain Injury / Concussion / CTE", "337": "337 · Stroke Sequelae",
  "338": "338 · Type-2 Diabetes Complications", "339": "339 · COPD",
  "340": "340 · Chronic Kidney Disease", "341": "341 · Obstructive Sleep Apnea",
  "342": "342 · Falls & Hip Fracture in Older Adults", "343": "343 · Age-Related Hearing Loss → Decline",
  "344": "344 · Vision Loss / Blindness → Function & Depression", "345": "345 · Periodontal Disease → Systemic Risk",
  "346": "346 · Opioid Use Disorder & Overdose", "347": "347 · Alcohol Use Disorder — End-Organ Damage",
  "348": "348 · Nicotine / Vaping Dependence", "349": "349 · Cannabis Use Disorder & Psychosis",
  "350": "350 · Stimulant Neurotoxicity", "351": "351 · Benzodiazepine Dependence",
  "352": "352 · Prescription-Opioid Dependence", "353": "353 · Binge-Eating Disorder / Food Addiction",
  "354": "354 · Internet Gaming Disorder", "355": "355 · Compulsive Sexual Behavior / Porn Use",
  "356": "356 · Personal Bankruptcy", "357": "357 · Home Foreclosure",
  "358": "358 · Long-Term Unemployment Scarring", "359": "359 · Workplace Injury & Permanent Disability",
  "360": "360 · Chronic Litigation / Lawsuit Stress", "361": "361 · Criminal Record → Reentry Barriers",
  "362": "362 · Medical Debt → Forgone Care", "363": "363 · Wage Garnishment / Debt Collection",
  "364": "364 · Small-Business / Founder Failure", "365": "365 · Outliving Savings / Old-Age Poverty",
  // Weakness lines, wave 2 — cognitive/skill, mating/family/social, emotional/volitional
  "366": "366 · Dyscalculia / Weak Math Line → Financial Collapse",
  "367": "367 · Spatial-Attention Deficit → Driving Crashes & Getting Lost",
  "368": "368 · Low Literacy / Health Literacy → Health & Economic Failure",
  "369": "369 · Working-Memory Deficit → Learning & Job Derailment",
  "370": "370 · Slow Processing Speed → Cognitive Decline",
  "371": "371 · Dyslexia → Academic Derailment & Self-Concept Damage",
  "372": "372 · ADHD / Weak Sustained Attention → Broad Life-Outcome Failure",
  "373": "373 · Poor Prospective Memory → Medication & Appointment Nonadherence",
  "374": "374 · Weak Visuospatial Ability → Surgical / Technical Error",
  "375": "375 · Poor Spatial Navigation → Early-Dementia Signal",
  "376": "376 · Weak Courtship / Flirting Line → Involuntary Singlehood",
  "377": "377 · Harsh / Low-Warmth Parenting → Child Maltreatment & Harm",
  "378": "378 · Low Humor / Playfulness → Relationship Dissatisfaction",
  "379": "379 · Weak Community / Social-Capital Line → Civic & Health Decline",
  "380": "380 · Insecure Attachment (Anxious / Avoidant) → Relationship Instability",
  "381": "381 · Low Agreeableness → Conflict & Derailment",
  "382": "382 · Poor Conflict Resolution (Demand-Withdraw) → Dissolution",
  "383": "383 · Weak Assertiveness → Exploitation & Burnout",
  "384": "384 · Social-Anxiety-Driven Avoidance → Life Narrowing",
  "385": "385 · Weak Co-Parenting Alliance → Child Adjustment Problems",
  "386": "386 · Trait Anger / Hostility Dyscontrol → Heart Disease & Wrecked Relationships",
  "387": "387 · High Sensation-Seeking / Impulsivity → Crashes & Injury",
  "388": "388 · Low Frustration Tolerance → Quitting & Underachievement",
  "389": "389 · Experiential Avoidance / Low Psychological Flexibility → Anxiety & Depression",
  "390": "390 · External Locus of Control → Passivity & Worse Outcomes",
  "391": "391 · Fear of Failure / Avoidance Motivation → Self-Handicapping",
  "392": "392 · Boredom Proneness → Risk Behavior & Disengagement",
  "393": "393 · Low Openness / Cognitive Rigidity → Maladaptation to Change",
  "394": "394 · Trait Self-Critical Perfectionism → Burnout & Suicide Risk",
  "395": "395 · Intolerance of Uncertainty → Worry & Anxiety-Driven Paralysis",
  // Sound, light & rhythm — brainwave entrainment
  "396": "396 · Binaural Beats (Hemi-Sync / 'Gateway')",
  "397": "397 · Isochronic Tones & Monaural Beats",
  "398": "398 · Audio-Visual Entrainment (light & sound)",
  "399": "399 · 40 Hz Gamma Sensory Stimulation (GENUS)",
  "400": "400 · Rhythmic Auditory Stimulation (gait)",
  "401": "401 · Vibroacoustic Therapy",
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
  "42": "Grip Strength", "43": "Protein", "44": "Creatine", "45": "HIIT",
  "46": "Glucose", "47": "Fiber", "48": "Ultra-Processed", "49": "Vitamin D",
  "50": "Hearing", "51": "Oral Health", "52": "Air Quality", "53": "Vision",
  "54": "Blue Space", "55": "Pets", "56": "Caffeine", "57": "Alcohol",
  "58": "Dance", "59": "Tai Chi", "60": "Walking", "61": "Sit Less",
  "62": "Singing", "63": "Sexual Health", "64": "Flow", "65": "Massage",
  "66": "Mindfulness", "67": "Loving-Kindness", "68": "Self-Compassion", "69": "Reappraisal",
  "70": "Forgiveness", "71": "Optimism", "72": "Savoring", "73": "Nature Dose",
  "74": "Goal-Setting", "75": "Habits", "76": "Investing", "77": "Autonomy",
  "78": "Time Affluence", "79": "Sleep Regularity", "80": "Laughter", "81": "Teaching",
  "82": "EMDR", "83": "Hypnosis", "84": "CBT", "85": "Behavioral Activation",
  "86": "ACT", "87": "Exposure", "88": "DBT", "89": "Motivational Interviewing",
  "90": "Psychodynamic", "91": "Group Therapy", "92": "NLP Verdict", "93": "Meta-Programs",
  "94": "Rapport & Language", "95": "Self-Affirmation", "96": "Self-Talk", "97": "Visualization",
  "98": "WOOP", "99": "Placebo", "100": "Biofeedback", "101": "Relaxation",
  "102": "Teen Work", "103": "Work Intensity", "104": "Chores", "105": "Paper Routes",
  "106": "Early Jobs", "107": "Continuing Ed", "108": "Apprenticeship", "109": "Youth Mentoring",
  "110": "Extracurriculars", "111": "Early Literacy", "112": "Rec Sports", "113": "Clubs & Bingo",
  "114": "Marriage", "115": "Religious Attendance", "116": "Social Prescribing", "117": "Kindness",
  "118": "Adult Mentoring", "119": "Befriending", "120": "Book Clubs", "121": "Intergenerational",
  "122": "Houseplants", "123": "Gardening", "124": "Pet Rock", "125": "Home Cooking",
  "126": "Handwriting", "127": "Video Games", "128": "Brain-Training", "129": "Chess",
  "130": "Napping", "131": "Weighted Blankets",
  "132": "Gestalt", "133": "EFT", "134": "Self-Expansion", "135": "Double Dates",
  "136": "Parenting", "137": "Child Mobility", "138": "Free Play", "139": "Youth Sports", "140": "Golf",
  // The cost of failure
  "141": "Divorce", "142": "Custody Battles", "143": "Kids of Divorce", "144": "Infidelity",
  "145": "Widowhood", "146": "Losing a Child", "147": "Losing a Parent", "148": "Caregiver Strain",
  "149": "Loneliness", "150": "Isolation", "151": "Chemo Brain", "152": "Illness + Depression",
  "153": "Chronic Pain", "154": "Chronic Stress", "155": "Sleep Loss", "156": "Obesity",
  "157": "Smoking", "158": "Alcohol", "159": "Inactivity", "160": "Sarcopenia",
  "161": "Depression", "162": "Anxiety", "163": "Rumination", "164": "Hostility",
  "165": "PTSD", "166": "Perfectionism", "167": "Shame", "168": "Unforgiveness",
  "169": "Pessimism", "170": "Chronic Worry", "171": "Doomscrolling", "172": "Night Phone",
  "173": "Procrastination", "174": "Money Stress", "175": "Job Loss", "176": "Aimless Retirement",
  "177": "Burnout", "178": "Gambling", "179": "Media Multitasking", "180": "Sleep Debt",
  "181": "ACEs", "182": "Discrimination", "183": "Child Poverty", "184": "Incarceration",
  "185": "Empty Nest", "186": "Food Insecurity", "187": "Eviction", "188": "Neighborhood Violence",
  "189": "Early Screen Time", "190": "Caregiver Burden",
  // AI as coach, companion & mirror + interventions
  "191": "Sign Language", "192": "AI Therapist", "193": "AI Companion", "194": "AI Coach",
  "195": "Disclose to AI", "196": "AI + Your History", "197": "Car Detailing", "198": "Getting Engaged",
  // Wave 4 — physiology & dating
  "199": "Freediving", "200": "Backwards Walking", "201": "Spinning", "202": "Speed Dating",
  "203": "Online Dating", "204": "Approaching Strangers", "205": "Matchmaking", "206": "Arranged Marriage",
  "207": "Adult Instrument", "208": "Love Letters",
  // Wave 4 — hunting, pets & recreation
  "209": "Hunting", "210": "Dog Ownership", "211": "Pet Bereavement", "212": "Aquariums",
  "213": "Bowling", "214": "Batting Cage", "215": "Sport Shooting", "216": "Board Games",
  "217": "Social Dance", "218": "Golf Range",
  // Wave 4 — movement & adventure
  "219": "Bouldering", "220": "Surf Therapy", "221": "Equine Therapy", "222": "Running Therapy",
  "223": "Rucking", "224": "Jump Rope", "225": "Stair Climbing", "226": "Pilates",
  "227": "Stretching", "228": "Slacklining",
  // Wave 4 — cognitive & skill (novel techniques)
  "229": "Interleaving", "230": "Adult 2nd Language", "231": "Crosswords", "232": "Morning Pages",
  "233": "Touch-Typing", "234": "Sleep-Tracking", "235": "Time-Blocking", "236": "Qigong",
  "237": "Laughter Yoga", "238": "Awe Walks",
  // Wave 4 — body & sensory (hacks, mnemonics & honest debunks)
  "239": "Cold Showers", "240": "Wim Hof", "241": "Humming/Om", "242": "Chewing Gum",
  "243": "Juggling", "244": "Memory Palace", "245": "Doodling", "246": "Adult Coloring",
  "247": "Speed Reading", "248": "Grounding",
  // Wave 4 — social & behavioral (connection, ritual & positive practice)
  "249": "Family Dinners", "250": "Commensality", "251": "Silent Retreats", "252": "Pilgrimage",
  "253": "Gratitude Visit", "254": "Complimenting", "255": "Ensemble Belonging", "256": "Digital Sabbath",
  "257": "Three Good Things",
  // Wave 4 — order, digital environment & manifestation
  "258": "Tidy Home", "259": "Workspace Org", "260": "Email Declutter", "261": "Photo Hoarding",
  "262": "Vision Boards", "263": "Dream Journaling", "264": "Future-Self Letters", "265": "Cursive Myth",
  // Wave 4 — creative & expressive arts
  "266": "Art-Making", "267": "Photography", "268": "Poetry Therapy", "269": "Improv",
  "270": "Public Speaking", "271": "Pottery", "272": "Knitting", "273": "Men's Sheds",
  "274": "Singing Lessons", "275": "Birdwatching",
  // Recovery, amends & self-facing practice
  "276": "Twelve-Step / AA", "277": "Making Amends", "278": "Mirror Meditation", "279": "Mirror Self-Talk",
  "280": "Self-Forgiveness", "281": "Forgiveness (Structured)", "282": "Sponsorship", "283": "Confession",
  "284": "Ritual Apology", "285": "Amends Letters",
  // Weakness lines — what collapses a goal
  "286": "Childhood Self-Control", "287": "Adult Self-Control", "288": "Low Conscientiousness",
  "289": "Discounting → Addiction", "290": "Discounting → Obesity", "291": "Present Bias → Debt",
  "292": "Emotion Dysregulation", "293": "Dysregulation → Self-Injury", "294": "Low Distress Tolerance",
  "295": "Emotion Reg → Relationships", "296": "Alexithymia", "297": "Dunning-Kruger",
  "298": "Planning Fallacy", "299": "Megaproject Collapse", "300": "Lazy Reasoning → Scams",
  "301": "Myside Bias", "302": "Stock-Flow Blindness", "303": "Expert Overconfidence",
  "304": "Numeracy → Medical", "305": "Escalation of Commitment", "306": "Premature Closure",
  "307": "Exec Derailment", "308": "Dark Triad → CWB", "309": "Abusive Supervision",
  "310": "Narcissistic CEO", "311": "Moral Disengagement", "312": "Contempt → Divorce",
  "313": "Empathic Accuracy", "314": "Political Skill", "315": "Low EI",
  "316": "Isolation → Mortality", "317": "Grit Deficit", "318": "Low Self-Efficacy",
  "319": "Fixed Mindset", "320": "Low Purpose", "321": "Pessimistic Style",
  "322": "Self-Concept Clarity", "323": "Low Resilience → PTSD", "324": "Identity Diffusion",
  "325": "Financial Literacy", "326": "Debt Literacy", "327": "Numeracy → Foreclosure",
  "328": "Investor Overconfidence", "329": "Entrepreneurial Hubris", "330": "PMF Failure",
  "331": "Poor Communication", "332": "Weak Negotiation", "333": "Practical Intelligence",
  "334": "Mechanical Competence", "335": "Scam Susceptibility",
  // Cost of failure, wave 2
  "336": "TBI / CTE", "337": "Stroke", "338": "Diabetes Complications", "339": "COPD",
  "340": "Kidney Disease", "341": "Sleep Apnea", "342": "Hip Fracture", "343": "Hearing Loss",
  "344": "Vision Loss", "345": "Gum Disease", "346": "Opioid Use Disorder", "347": "Alcohol Use Disorder",
  "348": "Nicotine/Vaping", "349": "Cannabis Psychosis", "350": "Stimulant Damage", "351": "Benzodiazepines",
  "352": "Rx Opioids", "353": "Binge Eating", "354": "Gaming Disorder", "355": "Compulsive Sexual Behavior",
  "356": "Bankruptcy", "357": "Foreclosure", "358": "Unemployment Scarring", "359": "Workplace Injury",
  "360": "Litigation Stress", "361": "Criminal Record", "362": "Medical Debt", "363": "Debt Collection",
  "364": "Founder Failure", "365": "Outliving Savings",
  // Weakness lines, wave 2
  "366": "Dyscalculia", "367": "Spatial-Attention Deficit", "368": "Low Literacy", "369": "Working-Memory Deficit",
  "370": "Slow Processing Speed", "371": "Dyslexia", "372": "ADHD / Attention", "373": "Prospective Memory",
  "374": "Visuospatial Weakness", "375": "Spatial Navigation", "376": "Weak Courtship", "377": "Harsh Parenting",
  "378": "Low Humor", "379": "Weak Community Line", "380": "Insecure Attachment", "381": "Low Agreeableness",
  "382": "Demand-Withdraw", "383": "Weak Assertiveness", "384": "Social-Anxiety Avoidance", "385": "Weak Co-Parenting",
  "386": "Anger / Hostility", "387": "Sensation-Seeking", "388": "Low Frustration Tolerance", "389": "Experiential Avoidance",
  "390": "External Locus", "391": "Fear of Failure", "392": "Boredom Proneness", "393": "Low Openness",
  "394": "Perfectionism", "395": "Intolerance of Uncertainty",
  // Sound, light & rhythm — brainwave entrainment
  "396": "Binaural Beats", "397": "Isochronic / Monaural", "398": "Audio-Visual Entrainment",
  "399": "40 Hz Gamma (GENUS)", "400": "Rhythmic Auditory Stim", "401": "Vibroacoustic Therapy",
};

// Consumer-intuitive display order: how-it-works first, then the high-leverage
// keystone practices (what to actually DO), then domain practices, then risks.
// This controls display order without renumbering the underlying data.
const PRACTICE_SECTION_ORDER = ["0", "21", "14", "13", "24", "12", "15", "16", "17", "18",
  // Practices by domain — physical & metabolic
  "1", "2", "42", "43", "44", "45", "60", "61", "46", "47", "48", "49", "22", "23", "25", "26", "56", "57",
  // Protect the hardware — senses & body
  "50", "51", "52", "53",
  // Movement & mind-body
  "3", "4", "58", "59", "62", "54", "55", "5", "200", "217", "218", "210", "211",
  "219", "222", "220", "225", "224", "226", "228", "227", "236", "238", "234", "235", "237", "241", "246", "251", "257", "264", "266", "268", "271", "274", "275",
  // Cognitive & skill
  "27", "28", "29", "36", "35", "34", "64", "81", "76", "191", "207", "229", "230", "244", "243",
  // Emotional & contemplative
  "6", "7", "8", "66", "67", "68", "69", "70", "71", "72", "73", "30", "31", "32", "33", "63", "65",
  // Behavioral & life-design
  "9", "74", "75", "77", "78", "79", "80", "38", "39", "40", "41",
  // Evidence-based therapies
  "84", "85", "87", "86", "88", "82", "83", "89", "90", "91", "132", "133",
  // Mind & self-regulation techniques
  "99", "95", "96", "97", "98", "101", "100", "94", "92", "93",
  // Youth, family & development
  "136", "111", "109", "108", "106", "102", "103", "110", "104", "105", "137", "138", "139", "140",
  // Social & community
  "114", "115", "112", "134", "135", "113", "117", "118", "121", "119", "120", "116", "198",
  "204", "202", "203", "205", "206", "208",
  "249", "250", "253", "254", "255", "269", "270", "273",
  // Environment & everyday habits
  "130", "125", "123", "127", "122", "124", "126", "129", "131", "128", "212", "216", "231", "258", "259", "260", "272",
  // AI as coach, companion & mirror
  "194", "192", "195", "196", "193",
  "19", "20", "37", "197", "199", "201", "209", "213", "214", "215", "221", "223", "232", "233",
  "239", "240", "242", "245", "247", "248", "252", "256", "261", "262", "263", "265", "267", "10", "11",
  // Recovery, amends & self-facing practice
  "276", "281", "277", "280", "285", "283", "284", "282", "278", "279",
  // The cost of failure — the sobering coda: what breaks when it goes wrong
  "175", "181", "146", "165", "178", "145", "148", "149", "150", "161",
  "141", "143", "144", "142", "147", "158", "157", "159", "160", "151",
  "152", "153", "154", "155", "156", "162", "164", "166", "167", "169",
  "163", "170", "168", "174", "177", "188", "182", "183", "187", "184",
  "186", "189", "190", "173", "180", "171", "172", "176", "179", "185",
  // Cost of failure, wave 2 — medical, addiction, financial (sev-5 first)
  "342", "346", "347", "352", "358", "365",
  "336", "337", "338", "339", "340", "359", "344", "356", "357", "361", "362",
  "348", "349", "350", "353", "343", "341", "351", "360", "363", "364", "345", "354", "355",
  // Weakness lines — what collapses a goal (sorted by threat, most dangerous first)
  "316",
  "286", "289", "306", "310", "323", "334",
  "287", "288", "292", "299", "302", "303", "304", "307", "312", "320", "321", "325", "327", "329", "330",
  "293", "294", "297", "300", "305", "309", "311", "326", "328", "335",
  "290", "291", "298", "301", "308", "318", "322", "331", "333",
  "295", "296", "314", "315", "317", "324", "332",
  // Weakness lines, wave 2 (sorted by threat, most dangerous first)
  "375", "377", "394",
  "367", "368", "372", "386", "387", "389",
  "366", "369", "373", "382", "384", "385", "388", "390", "391", "395",
  "370", "371", "374", "376", "379", "380", "381", "392",
  "383", "393",
  "378",
  // Sound, light & rhythm — brainwave entrainment (by leverage, highest first)
  "400", "396", "397", "398", "401", "399",
  "313", "319"];
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
  // Evidence-based therapies
  "82": "Evidence-based therapies", "83": "Evidence-based therapies", "84": "Evidence-based therapies",
  "85": "Evidence-based therapies", "86": "Evidence-based therapies", "87": "Evidence-based therapies",
  "88": "Evidence-based therapies", "89": "Evidence-based therapies", "90": "Evidence-based therapies",
  "91": "Evidence-based therapies", "132": "Evidence-based therapies", "133": "Evidence-based therapies",
  // Mind & self-regulation techniques
  "92": "Mind & self-regulation techniques", "93": "Mind & self-regulation techniques",
  "94": "Mind & self-regulation techniques", "95": "Mind & self-regulation techniques",
  "96": "Mind & self-regulation techniques", "97": "Mind & self-regulation techniques",
  "98": "Mind & self-regulation techniques", "99": "Mind & self-regulation techniques",
  "100": "Mind & self-regulation techniques", "101": "Mind & self-regulation techniques",
  // Youth, family & development
  "102": "Youth, family & development", "103": "Youth, family & development", "104": "Youth, family & development",
  "105": "Youth, family & development", "106": "Youth, family & development", "108": "Youth, family & development",
  "109": "Youth, family & development", "110": "Youth, family & development", "111": "Youth, family & development",
  "136": "Youth, family & development", "137": "Youth, family & development", "138": "Youth, family & development",
  "139": "Youth, family & development", "140": "Youth, family & development",
  // Adult continuing ed sits with lifelong learning in domain, but group it here too
  "107": "Youth, family & development",
  // Social & community
  "112": "Social & community", "113": "Social & community", "114": "Social & community",
  "115": "Social & community", "116": "Social & community", "117": "Social & community",
  "118": "Social & community", "119": "Social & community", "120": "Social & community",
  "121": "Social & community", "134": "Social & community", "135": "Social & community",
  // Environment & everyday habits
  "122": "Environment & everyday habits", "123": "Environment & everyday habits", "124": "Environment & everyday habits",
  "125": "Environment & everyday habits", "126": "Environment & everyday habits", "127": "Environment & everyday habits",
  "128": "Environment & everyday habits", "129": "Environment & everyday habits", "130": "Environment & everyday habits",
  "131": "Environment & everyday habits",
  // physical/metabolic + movement + cognitive + emotional + behavioral → domain
  "42": "Practices by domain", "43": "Practices by domain", "44": "Practices by domain",
  "45": "Practices by domain", "46": "Practices by domain", "47": "Practices by domain",
  "48": "Practices by domain", "49": "Practices by domain", "54": "Practices by domain",
  "55": "Practices by domain", "56": "Practices by domain", "57": "Practices by domain",
  "58": "Practices by domain", "59": "Practices by domain", "60": "Practices by domain",
  "61": "Practices by domain", "62": "Practices by domain", "63": "Practices by domain",
  "64": "Practices by domain", "65": "Practices by domain", "66": "Practices by domain",
  "67": "Practices by domain", "68": "Practices by domain", "69": "Practices by domain",
  "70": "Practices by domain", "71": "Practices by domain", "72": "Practices by domain",
  "73": "Practices by domain", "74": "Practices by domain", "75": "Practices by domain",
  "76": "Practices by domain", "77": "Practices by domain", "78": "Practices by domain",
  "79": "Practices by domain", "80": "Practices by domain", "81": "Practices by domain",
  // sensory & medical protection get their own header
  "50": "Protect the hardware — senses & body", "51": "Protect the hardware — senses & body",
  "52": "Protect the hardware — senses & body", "53": "Protect the hardware — senses & body",
  "19": "Practices by domain", "20": "Practices by domain",
  "37": "The honest frontier — unproven",
  "197": "The honest frontier — unproven",
  "10": "Risks & compounding", "11": "Risks & compounding",
  // AI as coach, companion & mirror (192–196); sign language & engagement join existing groups
  "191": "Practices by domain", "198": "Social & community",
  // Wave 4 — physiology & dating
  "200": "Practices by domain", "207": "Practices by domain",
  "199": "The honest frontier — unproven", "201": "The honest frontier — unproven",
  "202": "Social & community", "203": "Social & community", "204": "Social & community",
  "205": "Social & community", "206": "Social & community", "208": "Social & community",
  // Wave 4 — hunting, pets & recreation
  "210": "Practices by domain", "211": "Practices by domain", "217": "Practices by domain", "218": "Practices by domain",
  "212": "Environment & everyday habits", "216": "Environment & everyday habits",
  "209": "The honest frontier — unproven", "213": "The honest frontier — unproven",
  "214": "The honest frontier — unproven", "215": "The honest frontier — unproven",
  // Wave 4 — movement & adventure
  "219": "Practices by domain", "220": "Practices by domain", "222": "Practices by domain",
  "224": "Practices by domain", "225": "Practices by domain", "226": "Practices by domain",
  "227": "Practices by domain", "228": "Practices by domain",
  "221": "The honest frontier — unproven", "223": "The honest frontier — unproven",
  // Wave 4 — cognitive & skill (novel techniques)
  "229": "Practices by domain", "230": "Practices by domain", "234": "Practices by domain",
  "235": "Practices by domain", "236": "Practices by domain", "237": "Practices by domain", "238": "Practices by domain",
  "231": "Environment & everyday habits",
  "232": "The honest frontier — unproven", "233": "The honest frontier — unproven",
  // Wave 4 — body & sensory (hacks, mnemonics & honest debunks)
  "243": "Practices by domain", "244": "Practices by domain", "241": "Practices by domain", "246": "Practices by domain",
  "239": "The honest frontier — unproven", "240": "The honest frontier — unproven",
  "242": "The honest frontier — unproven", "245": "The honest frontier — unproven",
  "247": "The honest frontier — unproven", "248": "The honest frontier — unproven",
  // Wave 4 — social & behavioral (connection, ritual & positive practice)
  "249": "Social & community", "250": "Social & community", "253": "Social & community",
  "254": "Social & community", "255": "Social & community",
  "251": "Practices by domain", "257": "Practices by domain",
  "252": "The honest frontier — unproven", "256": "The honest frontier — unproven",
  // Wave 4 — order, digital environment & manifestation
  "258": "Environment & everyday habits", "259": "Environment & everyday habits", "260": "Environment & everyday habits",
  "264": "Practices by domain",
  "261": "The honest frontier — unproven", "262": "The honest frontier — unproven",
  "263": "The honest frontier — unproven", "265": "The honest frontier — unproven",
  // Wave 4 — creative & expressive arts
  "266": "Practices by domain", "268": "Practices by domain", "271": "Practices by domain",
  "274": "Practices by domain", "275": "Practices by domain",
  "269": "Social & community", "270": "Social & community", "273": "Social & community",
  "272": "Environment & everyday habits", "267": "The honest frontier — unproven",
  // Recovery, amends & self-facing practice
  "276": "Recovery, amends & self-facing practice", "277": "Recovery, amends & self-facing practice",
  "278": "Recovery, amends & self-facing practice", "279": "Recovery, amends & self-facing practice",
  "280": "Recovery, amends & self-facing practice", "281": "Recovery, amends & self-facing practice",
  "282": "Recovery, amends & self-facing practice", "283": "Recovery, amends & self-facing practice",
  "284": "Recovery, amends & self-facing practice", "285": "Recovery, amends & self-facing practice",
  // Weakness lines — what collapses a goal (286–335)
  "286": "Weakness lines — what collapses a goal", "287": "Weakness lines — what collapses a goal",
  "288": "Weakness lines — what collapses a goal", "289": "Weakness lines — what collapses a goal",
  "290": "Weakness lines — what collapses a goal", "291": "Weakness lines — what collapses a goal",
  "292": "Weakness lines — what collapses a goal", "293": "Weakness lines — what collapses a goal",
  "294": "Weakness lines — what collapses a goal", "295": "Weakness lines — what collapses a goal",
  "296": "Weakness lines — what collapses a goal", "297": "Weakness lines — what collapses a goal",
  "298": "Weakness lines — what collapses a goal", "299": "Weakness lines — what collapses a goal",
  "300": "Weakness lines — what collapses a goal", "301": "Weakness lines — what collapses a goal",
  "302": "Weakness lines — what collapses a goal", "303": "Weakness lines — what collapses a goal",
  "304": "Weakness lines — what collapses a goal", "305": "Weakness lines — what collapses a goal",
  "306": "Weakness lines — what collapses a goal", "307": "Weakness lines — what collapses a goal",
  "308": "Weakness lines — what collapses a goal", "309": "Weakness lines — what collapses a goal",
  "310": "Weakness lines — what collapses a goal", "311": "Weakness lines — what collapses a goal",
  "312": "Weakness lines — what collapses a goal", "313": "Weakness lines — what collapses a goal",
  "314": "Weakness lines — what collapses a goal", "315": "Weakness lines — what collapses a goal",
  "316": "Weakness lines — what collapses a goal", "317": "Weakness lines — what collapses a goal",
  "318": "Weakness lines — what collapses a goal", "319": "Weakness lines — what collapses a goal",
  "320": "Weakness lines — what collapses a goal", "321": "Weakness lines — what collapses a goal",
  "322": "Weakness lines — what collapses a goal", "323": "Weakness lines — what collapses a goal",
  "324": "Weakness lines — what collapses a goal", "325": "Weakness lines — what collapses a goal",
  "326": "Weakness lines — what collapses a goal", "327": "Weakness lines — what collapses a goal",
  "328": "Weakness lines — what collapses a goal", "329": "Weakness lines — what collapses a goal",
  "330": "Weakness lines — what collapses a goal", "331": "Weakness lines — what collapses a goal",
  "332": "Weakness lines — what collapses a goal", "333": "Weakness lines — what collapses a goal",
  "334": "Weakness lines — what collapses a goal", "335": "Weakness lines — what collapses a goal",
  "366": "Weakness lines — what collapses a goal", "367": "Weakness lines — what collapses a goal",
  "368": "Weakness lines — what collapses a goal", "369": "Weakness lines — what collapses a goal",
  "370": "Weakness lines — what collapses a goal", "371": "Weakness lines — what collapses a goal",
  "372": "Weakness lines — what collapses a goal", "373": "Weakness lines — what collapses a goal",
  "374": "Weakness lines — what collapses a goal", "375": "Weakness lines — what collapses a goal",
  "376": "Weakness lines — what collapses a goal", "377": "Weakness lines — what collapses a goal",
  "378": "Weakness lines — what collapses a goal", "379": "Weakness lines — what collapses a goal",
  "380": "Weakness lines — what collapses a goal", "381": "Weakness lines — what collapses a goal",
  "382": "Weakness lines — what collapses a goal", "383": "Weakness lines — what collapses a goal",
  "384": "Weakness lines — what collapses a goal", "385": "Weakness lines — what collapses a goal",
  "386": "Weakness lines — what collapses a goal", "387": "Weakness lines — what collapses a goal",
  "388": "Weakness lines — what collapses a goal", "389": "Weakness lines — what collapses a goal",
  "390": "Weakness lines — what collapses a goal", "391": "Weakness lines — what collapses a goal",
  "392": "Weakness lines — what collapses a goal", "393": "Weakness lines — what collapses a goal",
  "394": "Weakness lines — what collapses a goal", "395": "Weakness lines — what collapses a goal",
  "396": "Sound, light & rhythm — brainwave entrainment", "397": "Sound, light & rhythm — brainwave entrainment",
  "398": "Sound, light & rhythm — brainwave entrainment", "399": "Sound, light & rhythm — brainwave entrainment",
  "400": "Sound, light & rhythm — brainwave entrainment", "401": "Sound, light & rhythm — brainwave entrainment",
  "192": "AI as coach, companion & mirror", "193": "AI as coach, companion & mirror",
  "194": "AI as coach, companion & mirror", "195": "AI as coach, companion & mirror",
  "196": "AI as coach, companion & mirror",
  // The cost of failure — what breaks when things go wrong (sections 141–190)
  "141": "The cost of failure — what's at stake", "142": "The cost of failure — what's at stake",
  "143": "The cost of failure — what's at stake", "144": "The cost of failure — what's at stake",
  "145": "The cost of failure — what's at stake", "146": "The cost of failure — what's at stake",
  "147": "The cost of failure — what's at stake", "148": "The cost of failure — what's at stake",
  "149": "The cost of failure — what's at stake", "150": "The cost of failure — what's at stake",
  "151": "The cost of failure — what's at stake", "152": "The cost of failure — what's at stake",
  "153": "The cost of failure — what's at stake", "154": "The cost of failure — what's at stake",
  "155": "The cost of failure — what's at stake", "156": "The cost of failure — what's at stake",
  "157": "The cost of failure — what's at stake", "158": "The cost of failure — what's at stake",
  "159": "The cost of failure — what's at stake", "160": "The cost of failure — what's at stake",
  "161": "The cost of failure — what's at stake", "162": "The cost of failure — what's at stake",
  "163": "The cost of failure — what's at stake", "164": "The cost of failure — what's at stake",
  "165": "The cost of failure — what's at stake", "166": "The cost of failure — what's at stake",
  "167": "The cost of failure — what's at stake", "168": "The cost of failure — what's at stake",
  "169": "The cost of failure — what's at stake", "170": "The cost of failure — what's at stake",
  "171": "The cost of failure — what's at stake", "172": "The cost of failure — what's at stake",
  "173": "The cost of failure — what's at stake", "174": "The cost of failure — what's at stake",
  "175": "The cost of failure — what's at stake", "176": "The cost of failure — what's at stake",
  "177": "The cost of failure — what's at stake", "178": "The cost of failure — what's at stake",
  "179": "The cost of failure — what's at stake", "180": "The cost of failure — what's at stake",
  "181": "The cost of failure — what's at stake", "182": "The cost of failure — what's at stake",
  "183": "The cost of failure — what's at stake", "184": "The cost of failure — what's at stake",
  "185": "The cost of failure — what's at stake", "186": "The cost of failure — what's at stake",
  "187": "The cost of failure — what's at stake", "188": "The cost of failure — what's at stake",
  "189": "The cost of failure — what's at stake", "190": "The cost of failure — what's at stake",
  // Cost of failure, wave 2 (336–365)
  "336": "The cost of failure — what's at stake", "337": "The cost of failure — what's at stake",
  "338": "The cost of failure — what's at stake", "339": "The cost of failure — what's at stake",
  "340": "The cost of failure — what's at stake", "341": "The cost of failure — what's at stake",
  "342": "The cost of failure — what's at stake", "343": "The cost of failure — what's at stake",
  "344": "The cost of failure — what's at stake", "345": "The cost of failure — what's at stake",
  "346": "The cost of failure — what's at stake", "347": "The cost of failure — what's at stake",
  "348": "The cost of failure — what's at stake", "349": "The cost of failure — what's at stake",
  "350": "The cost of failure — what's at stake", "351": "The cost of failure — what's at stake",
  "352": "The cost of failure — what's at stake", "353": "The cost of failure — what's at stake",
  "354": "The cost of failure — what's at stake", "355": "The cost of failure — what's at stake",
  "356": "The cost of failure — what's at stake", "357": "The cost of failure — what's at stake",
  "358": "The cost of failure — what's at stake", "359": "The cost of failure — what's at stake",
  "360": "The cost of failure — what's at stake", "361": "The cost of failure — what's at stake",
  "362": "The cost of failure — what's at stake", "363": "The cost of failure — what's at stake",
  "364": "The cost of failure — what's at stake", "365": "The cost of failure — what's at stake",
};

const TAG_COLOR: Record<PracticeCluster["evidenceTag"], string> = {
  Strong: CHAMPAGNE,
  Moderate: JADE,
  Emerging: BRONZE,
  Mixed: MUTED,
};


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

// ---- Keyword search: synonym expansion + topic cloud ------------------------
// The library search matches the title, subtitle, description, feeds/degrades,
// and every source citation of each cluster. But a person types "anxiety" and a
// paper may say "anxious" or "worry"; they type "weight" and it says "obesity."
// KEYWORD_SYNONYMS widens a typed word (or a topic chip) into the family of
// substrings that should surface the same research, so one keyword pulls up
// everything relevant instead of forcing a hunt through a thousand files.
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  depression: ["depress", "depressive", "mood", "dysthym", "behavioral activation", "hopeless"],
  anxiety: ["anxi", "anxious", "worry", "worries", "panic", "phobia", "nervous", "gad", "intolerance of uncertainty"],
  stress: ["stress", "cortisol", "burnout", "overwhelm", "tension", "relaxation", "calm"],
  trauma: ["trauma", "ptsd", "post-traumatic", "abuse", "ace", "adverse childhood", "emdr"],
  sleep: ["sleep", "insomnia", "circadian", "rest", "nap", "melatonin", "bedtime"],
  focus: ["focus", "attention", "concentrat", "distract", "adhd", "sustained attention", "vigilance"],
  adhd: ["adhd", "attention", "hyperactiv", "impulsiv", "executive function"],
  memory: ["memory", "recall", "retention", "forget", "working memory", "prospective memory", "learning"],
  addiction: ["addict", "substance", "dependence", "craving", "relapse", "compulsive", "use disorder"],
  alcohol: ["alcohol", "drinking", "aud", "sobriety", "twelve-step", "aa "],
  smoking: ["smoking", "nicotine", "vaping", "tobacco", "cigarette"],
  weight: ["weight", "obesity", "obese", "bmi", "fat loss", "overeating", "binge"],
  diet: ["diet", "nutrition", "fiber", "protein", "food", "eating", "ultra-processed"],
  exercise: ["exercise", "fitness", "cardio", "vo2", "strength", "walking", "steps", "hiit", "physical activity", "aerobic"],
  pain: ["pain", "chronic pain", "fibromyalgia", "ache", "analges"],
  gut: ["gut", "microbiome", "digest", "gastro", "fiber"],
  heart: ["heart", "cardiac", "cardiovascular", "cvd", "blood pressure", "hypertension"],
  longevity: ["longevity", "mortality", "lifespan", "aging", "ageing", "life expectancy"],
  money: ["money", "financial", "wealth", "income", "saving", "invest", "retirement", "budget", "debt"],
  debt: ["debt", "borrowing", "loan", "bankruptcy", "foreclosure", "credit"],
  career: ["career", "job", "employment", "work", "workplace", "unemploy", "vocational", "apprentic"],
  entrepreneurship: ["entrepreneur", "startup", "founder", "venture", "business", "product-market"],
  negotiation: ["negotiat", "bargain", "deal", "persuasion", "influence"],
  leadership: ["leader", "manage", "supervis", "executive", "team"],
  relationships: ["relationship", "marriage", "marital", "couple", "partner", "divorce", "attachment", "intimacy"],
  dating: ["dating", "courtship", "flirt", "mating", "romance", "single"],
  parenting: ["parent", "child", "co-parent", "family", "caregiv", "maltreat"],
  communication: ["communicat", "listen", "conversation", "conflict", "assertive", "demand-withdraw"],
  forgiveness: ["forgive", "amends", "apolog", "reconcil", "grudge", "resentment"],
  loneliness: ["lonel", "isolation", "social connection", "belonging", "community", "friendship"],
  anger: ["anger", "angry", "hostil", "rage", "aggress", "irritab"],
  habits: ["habit", "routine", "behavior change", "self-control", "discipline", "willpower", "goal-setting"],
  procrastination: ["procrastinat", "delay", "avoidance", "self-handicap", "present bias"],
  motivation: ["motivat", "drive", "grit", "perseverance", "goal", "purpose", "meaning"],
  confidence: ["confidence", "self-efficacy", "self-esteem", "self-concept", "assertive"],
  mindfulness: ["mindful", "meditat", "breath", "present-moment", "acceptance"],
  gratitude: ["gratitude", "grateful", "thankful", "appreciation"],
  resilience: ["resilien", "coping", "bounce back", "hardiness", "post-traumatic growth"],
  emotion: ["emotion", "regulation", "reappraisal", "feelings", "affect", "distress tolerance"],
  creativity: ["creativ", "divergent", "innovation", "imagination"],
  cognition: ["cognit", "intelligence", "reasoning", "iq", "processing speed", "thinking"],
  music: ["music", "rhythm", "auditory", "song", "beat"],
  "binaural beats": ["binaural", "isochronic", "monaural", "entrainment", "hemi-sync", "gateway", "brainwave"],
  meditation: ["meditat", "mindful", "breath", "contemplat"],
  suicide: ["suicid", "self-harm", "self-injury"],
  grief: ["grief", "griev", "bereave", "loss", "widow", "mourning"],
};

// Curated topic clusters for the "Browse by topic" cloud. Each chip runs the
// synonym-expanded search. Deliberately broad so people can find their thing by
// clicking, not typing.
const KEYWORD_TOPICS: { group: string; terms: string[] }[] = [
  { group: "Mental health", terms: ["depression", "anxiety", "stress", "trauma", "burnout", "loneliness", "grief", "anger", "suicide"] },
  { group: "Mind & focus", terms: ["focus", "adhd", "memory", "procrastination", "motivation", "creativity", "cognition", "confidence"] },
  { group: "Body & health", terms: ["sleep", "exercise", "weight", "diet", "pain", "gut", "heart", "longevity"] },
  { group: "Money & work", terms: ["money", "debt", "career", "entrepreneurship", "negotiation", "leadership"] },
  { group: "Relationships", terms: ["relationships", "dating", "parenting", "communication", "forgiveness"] },
  { group: "Habits & change", terms: ["habits", "addiction", "alcohol", "smoking"] },
  { group: "Emotion & practice", terms: ["mindfulness", "meditation", "gratitude", "resilience", "emotion", "binaural beats"] },
];

// Expand a raw query into the set of substrings that should count as a match.
// An unknown query stays literal (unchanged behavior); a known topic word (typed
// or from a chip) fans out to its whole synonym family (OR match).
function expandQuery(q: string): string[] {
  const acc = new Set<string>([q]);
  for (const [key, syns] of Object.entries(KEYWORD_SYNONYMS)) {
    if (q === key || q.includes(key) || key.includes(q) || syns.some((s) => q === s || q.includes(s))) {
      syns.forEach((s) => acc.add(s));
      acc.add(key);
    }
  }
  return Array.from(acc);
}

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
  // Leaderboard overlay: rank every scored cluster by leverage / threat / cost.
  const [board, setBoard] = useState<"off" | "leverage" | "threat" | "cost">("off");

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
          c.title + " " + c.subtitle + " " + c.description + " " + (c.callout || "") + " " +
          (c.feeds || []).join(" ") + " " + (c.degrades || []).join(" ") + " " +
          (PRACTICE_SECTIONS[c.section] || "") + " " +
          c.sources.map((s) => s.cite + " " + s.note).join(" ")
        ).toLowerCase();
        // Match if the literal query OR any of its synonyms appears (synonym OR).
        if (!expandQuery(q).some((term) => hay.includes(term))) return false;
      }
      return true;
    }).sort((a, b) => sectionRank(a.section) - sectionRank(b.section));
  }, [practiceQuery, practiceTag, practiceSectionFilter]);

  // When a keyword search is active, reveal matching sources automatically.
  const practiceSearching = practiceQuery.trim().length > 0;

  // ---- Leaderboards -----------------------------------------------------------
  // Ranked ladders computed straight from the same gauges each card carries.
  // Leverage = top 50 activities by result-per-effort; threat = weak lines most
  // dangerous to leave weak; cost = life-events with the highest price of failure.
  const leverageBoard = useMemo(() =>
    PRACTICE_EVIDENCE
      .filter((c) => c.impact)
      .map((c) => ({ c, score: leverageScore(c.impact!, c.evidenceTag) }))
      .sort((a, b) => b.score - a.score || a.c.title.localeCompare(b.c.title))
      .slice(0, 50), []);
  const threatBoard = useMemo(() =>
    PRACTICE_EVIDENCE
      .filter((c) => c.weakness)
      .map((c) => ({ c, score: c.weakness!.threat }))
      .sort((a, b) => b.score - a.score || a.c.title.localeCompare(b.c.title)), []);
  const costBoard = useMemo(() =>
    PRACTICE_EVIDENCE
      .filter((c) => c.harm)
      .map((c) => ({ c, score: costScore(c.harm!, c.evidenceTag) }))
      .sort((a, b) => b.score - a.score || a.c.title.localeCompare(b.c.title)), []);

  // Click a board row → drop the overlay, clear filters, open + scroll to the card.
  const openFromBoard = (id: string) => {
    setBoard("off");
    setPracticeQuery("");
    setPracticeTag("all");
    setPracticeSectionFilter("all");
    setOpenPracticeIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      document.getElementById(`src-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

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
        /* Browse-by-topic keyword cloud */
        .rl-topics{border:1px solid ${LINE}; border-radius:12px; background:rgba(255,255,255,0.015); padding:14px 16px; margin:-14px 0 20px;}
        .rl-topics-label{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:${MUTED}; margin-bottom:12px;}
        .rl-topics-row{display:flex; flex-wrap:wrap; align-items:baseline; gap:8px; padding:7px 0; border-top:1px solid rgba(255,255,255,0.04);}
        .rl-topics-row:first-of-type{border-top:none; padding-top:0;}
        .rl-topics-group{font-size:11px; color:${CHAMPAGNE}; min-width:118px; flex-shrink:0; font-weight:600; letter-spacing:0.02em;}
        .rl-topics-chips{display:flex; flex-wrap:wrap; gap:6px; flex:1;}
        .rl-topic-chip{font-size:12px; color:${CREAM}; background:rgba(255,255,255,0.03); border:1px solid ${LINE};
          border-radius:999px; padding:3px 11px; cursor:pointer; text-transform:capitalize; transition:background .12s,border-color .12s,color .12s;}
        .rl-topic-chip:hover{background:rgba(224,198,140,0.08); border-color:rgba(224,198,140,0.4);}
        .rl-topic-chip.active{background:${CHAMPAGNE}; color:${INK}; border-color:${CHAMPAGNE}; font-weight:600;}
        @media (max-width:640px){ .rl-topics-group{min-width:100%; margin-bottom:2px;} }
        .rl-practice-count{font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.06em; color:${MUTED};
          margin-bottom:22px; display:flex; align-items:center; gap:14px;}
        .rl-practice-count b{color:${CREAM};}
        .rl-clear-all{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.08em; text-transform:uppercase;
          color:${CHAMPAGNE}; border-bottom:1px solid rgba(224,198,140,0.3); padding-bottom:1px;}
        .rl-clear-all:hover{border-color:${CHAMPAGNE};}
        /* ---- Leaderboards ---- */
        .rl-board-toggle{display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:2px 0 16px;}
        .rl-board-toggle-label{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.14em;
          text-transform:uppercase; color:${MUTED}; margin-right:2px;}
        .rl-board{border:1px solid ${LINE}; border-radius:14px; background:rgba(255,255,255,0.015); overflow:hidden; margin-bottom:26px;}
        .rl-board-head{padding:16px 18px; border-bottom:1px solid ${LINE}; border-left:3px solid ${CHAMPAGNE};}
        .rl-board-heading{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:clamp(18px,2.4vw,24px); line-height:1.15;}
        .rl-board-sub{font-size:12px; line-height:1.5; color:${MUTED}; margin-top:5px; max-width:60ch;}
        .rl-board-list{list-style:none; margin:0; padding:6px; counter-reset:none;}
        .rl-board-list li{margin:0;}
        .rl-board-row{display:flex; align-items:center; gap:14px; width:100%; text-align:left;
          padding:10px 12px; border-radius:9px; background:transparent; border:1px solid transparent; cursor:pointer; transition:background .12s,border-color .12s;}
        .rl-board-row:hover{background:rgba(224,198,140,0.05); border-color:${LINE};}
        .rl-board-rank{font-family:'JetBrains Mono',monospace; font-size:12px; color:${MUTED}; min-width:26px; text-align:right; flex-shrink:0;}
        .rl-board-score{font-family:'JetBrains Mono',monospace; font-weight:600; font-size:15px; min-width:44px; text-align:center;
          border:1px solid; border-radius:7px; padding:4px 0; flex-shrink:0;}
        .rl-board-score small{font-size:9px; opacity:0.7; font-weight:400;}
        .rl-board-name{flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;}
        .rl-board-name b{color:${CREAM}; font-size:14px; line-height:1.25;}
        .rl-board-meta{font-size:11px; color:${MUTED}; line-height:1.3;}
        .rl-board-meta em{font-style:italic; opacity:0.85;}
        .rl-board-evtag{flex-shrink:0; font-size:10px;}
        @media (max-width:640px){
          .rl-board-evtag{display:none;}
          .rl-board-name b{font-size:13px;}
        }
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
                  placeholder="Search thousands of studies — try &quot;depression&quot;, &quot;anxiety&quot;, &quot;sleep&quot;, &quot;money&quot;, or &quot;addiction&quot;"
                />
                {practiceQuery && (
                  <button type="button" className="rl-search-clear" onClick={() => setPracticeQuery("")} aria-label="Clear search">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Browse-by-topic keyword cloud — click a keyword to search */}
            <div className="rl-topics">
              <div className="rl-topics-label">Browse by topic — tap a keyword</div>
              {KEYWORD_TOPICS.map((t) => (
                <div key={t.group} className="rl-topics-row">
                  <span className="rl-topics-group">{t.group}</span>
                  <div className="rl-topics-chips">
                    {t.terms.map((term) => (
                      <button
                        key={term}
                        type="button"
                        className={`rl-topic-chip${practiceQuery.trim().toLowerCase() === term ? " active" : ""}`}
                        onClick={() => setPracticeQuery(practiceQuery.trim().toLowerCase() === term ? "" : term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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

            {/* Leaderboard toggle — rank the whole library by each gauge */}
            <div className="rl-board-toggle">
              <span className="rl-board-toggle-label">Leaderboards</span>
              <button
                type="button"
                className={`rl-chip${board === "leverage" ? " active" : ""}`}
                style={board === "leverage" ? { borderColor: CHAMPAGNE, color: CHAMPAGNE } : undefined}
                onClick={() => setBoard(board === "leverage" ? "off" : "leverage")}
              >
                ★ Top 50 by leverage
              </button>
              <button
                type="button"
                className={`rl-chip${board === "threat" ? " active" : ""}`}
                style={board === "threat" ? { borderColor: "#c8788f", color: "#c8788f" } : undefined}
                onClick={() => setBoard(board === "threat" ? "off" : "threat")}
              >
                ⚠ Most dangerous weak lines
              </button>
              <button
                type="button"
                className={`rl-chip${board === "cost" ? " active" : ""}`}
                style={board === "cost" ? { borderColor: "#d9695a", color: "#d9695a" } : undefined}
                onClick={() => setBoard(board === "cost" ? "off" : "cost")}
              >
                ✖ Highest cost of failure
              </button>
              {board !== "off" && (
                <button type="button" className="rl-clear-all" onClick={() => setBoard("off")}>
                  Back to full library
                </button>
              )}
            </div>

            {/* Leaderboard overlay */}
            {board !== "off" && (() => {
              const rows = board === "leverage" ? leverageBoard : board === "threat" ? threatBoard : costBoard;
              const accent = board === "leverage" ? CHAMPAGNE : board === "threat" ? "#c8788f" : "#d9695a";
              const heading = board === "leverage"
                ? "Top 50 activities by Leverage Score — most result per unit of effort and time"
                : board === "threat"
                ? `Weak lines ranked by Threat (1–10) — most dangerous to leave weak · ${rows.length} clusters`
                : `Cost of failure ranked by Cost Score — the highest price of the wheels coming off · ${rows.length} clusters`;
              const sub = board === "leverage"
                ? "70·benefit + 30·ease, from each card's cited research. A directional guide, not a promise."
                : board === "threat"
                ? "A research-grounded 1–10 severity call: how broadly and severely a deficit in that line derails a life."
                : "70·damage + 30·imminence. Not things to do — the documented price when things go wrong.";
              return (
                <div className="rl-board">
                  <div className="rl-board-head" style={{ borderColor: accent }}>
                    <div className="rl-board-heading" style={{ color: accent }}>{heading}</div>
                    <div className="rl-board-sub">{sub}</div>
                  </div>
                  <ol className="rl-board-list">
                    {rows.map((r, i) => {
                      const scoreColor = board === "threat" ? threatColor(r.score) : accent;
                      const scoreText = board === "threat" ? `${r.score}` : `${r.score}`;
                      const scoreUnit = board === "threat" ? "/10" : "";
                      return (
                        <li key={r.c.id}>
                          <button type="button" className="rl-board-row" onClick={() => openFromBoard(r.c.id)}>
                            <span className="rl-board-rank">{i + 1}</span>
                            <span className="rl-board-score" style={{ color: scoreColor, borderColor: scoreColor }}>
                              {scoreText}<small>{scoreUnit}</small>
                            </span>
                            <span className="rl-board-name">
                              <b>{r.c.title}</b>
                              <span className="rl-board-meta">
                                {PRACTICE_SECTIONS[r.c.section]?.replace(/^\d+\s·\s/, "")}
                                {board === "threat" && r.c.weakness && (
                                  <em> · weak: {r.c.weakness.weakLines.join(", ")} · {r.c.weakness.degree}</em>
                                )}
                              </span>
                            </span>
                            <span className="rl-tag rl-board-evtag" style={{ color: TAG_COLOR[r.c.evidenceTag] }}>
                              {r.c.evidenceTag}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })()}

            {board === "off" && (<>
            {/* Leverage Score explainer */}
            <div style={{ border: "1px solid rgba(224,198,140,0.25)", background: "rgba(224,198,140,0.05)", borderRadius: 10, padding: "12px 14px", margin: "6px 0 14px", fontSize: 12.5, lineHeight: 1.55, color: "var(--rl-muted, #b9b2a6)" }}>
              <b style={{ color: CHAMPAGNE }}>Reading the Leverage Score.</b> Many practices now carry a 0–100 gauge of
              how much result you get per unit of effort and time — <b>70·benefit + 30·ease</b>, where benefit is the
              effect's size × how proven it is × how lasting, and ease is how cheap the energy-in is × how fast results
              show up. The chips break it down: <b>Impact</b> (1–5 stars), <b>First results</b> (days/weeks/months),
              <b> Holds</b> (transient/sustained/lasting), <b>Effort</b> (low/mod/high). It is a directional guide from
              the same research each card cites — <i>not a promise</i> about your individual outcome.
            </div>

            {/* Cost Score explainer — the cost-of-failure group */}
            <div style={{ border: "1px solid rgba(217,105,90,0.28)", background: "rgba(217,105,90,0.06)", borderRadius: 10, padding: "12px 14px", margin: "0 0 14px", fontSize: 12.5, lineHeight: 1.55, color: "var(--rl-muted, #b9b2a6)" }}>
              <b style={{ color: "#d9695a" }}>Reading the Cost Score.</b> The <b>cost-of-failure</b> cards carry the mirror
              gauge: a 0–100 measure of what's at stake when things go wrong — <b>70·damage + 30·imminence</b>, where damage
              is severity × how proven × how irreversible, and imminence is how soon it lands. The chips read <b>Severity</b>
              (1–5), <b>Hits</b> (immediate/months/years), <b>Reversibility</b> (recovers/partial/lasting). These are not
              things to <i>do</i> — they document the price of the wheels coming off, held to the same evidence discipline,
              each with its honest confounding and reverse-causation caveat.
            </div>

            {/* Threat explainer — the weakness-line group */}
            <div style={{ border: "1px solid rgba(200,120,143,0.28)", background: "rgba(200,120,143,0.06)", borderRadius: 10, padding: "12px 14px", margin: "0 0 14px", fontSize: 12.5, lineHeight: 1.55, color: "var(--rl-muted, #b9b2a6)" }}>
              <b style={{ color: "#c8788f" }}>Reading the Threat rating.</b> The <b>weakness-line</b> cards ask a different
              question: when one of your 32 lines is <i>weak</i>, which failures does the research say it drives? Each names
              the culprit <b>line(s)</b>, how strongly it drives the collapse (<b>primary / major / moderate</b>), and a
              <b> Threat 1–10</b> — how broadly and severely a deficit in that line derails a life, grounded in the cited
              studies. It is the inverse of your strengths map: the lines most dangerous to leave weak. Every card keeps the
              honest reverse-causation caveat (a weak line and the failure often share an upstream cause).
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
                      {cluster.impact && (
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "6px 0 2px" }}>
                          {(() => {
                            const s = leverageScore(cluster.impact!, cluster.evidenceTag);
                            const col = s >= 70 ? CHAMPAGNE : s >= 50 ? JADE : s >= 35 ? BRONZE : MUTED;
                            return (
                              <span title="Leverage Score: result per unit of effort & time, weighted by evidence (0–100)"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${col}`, borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700, color: col }}>
                                <span style={{ fontFamily: "monospace" }}>{s}</span>
                                <span style={{ fontWeight: 500, opacity: 0.8, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 9 }}>leverage</span>
                              </span>
                            );
                          })()}
                          <span style={chipStyle}>Impact {"★".repeat(cluster.impact.magnitude)}<span style={{ opacity: 0.3 }}>{"★".repeat(5 - cluster.impact.magnitude)}</span></span>
                          <span style={chipStyle}>First results: {cluster.impact.latency}</span>
                          <span style={chipStyle}>Holds: {cluster.impact.durability}</span>
                          <span style={chipStyle}>Effort: {cluster.impact.effort}</span>
                        </div>
                      )}
                      {cluster.harm && (
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "6px 0 2px" }}>
                          {(() => {
                            const s = costScore(cluster.harm!, cluster.evidenceTag);
                            const col = s >= 70 ? "#d9695a" : s >= 50 ? "#cf8a5a" : "#b8926a";
                            return (
                              <span title="Cost Score: how damaging, irreversible, and imminent this cost is, weighted by evidence (0–100). Higher = more to lose."
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${col}`, borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700, color: col }}>
                                <span style={{ fontFamily: "monospace" }}>{s}</span>
                                <span style={{ fontWeight: 500, opacity: 0.8, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 9 }}>at stake</span>
                              </span>
                            );
                          })()}
                          <span style={chipStyle}>Severity {"■".repeat(cluster.harm.severity)}<span style={{ opacity: 0.3 }}>{"■".repeat(5 - cluster.harm.severity)}</span></span>
                          <span style={chipStyle}>Hits: {cluster.harm.onset}</span>
                          <span style={chipStyle}>Reversibility: {cluster.harm.reversibility}</span>
                        </div>
                      )}
                      {cluster.weakness && (
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "6px 0 2px" }}>
                          {(() => {
                            const col = threatColor(cluster.weakness!.threat);
                            return (
                              <span title="Threat: how broadly and severely a deficit in this line derails goals, 1–10, grounded in the cited research. Higher = more dangerous."
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${col}`, borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700, color: col }}>
                                <span style={{ fontFamily: "monospace" }}>{cluster.weakness.threat}/10</span>
                                <span style={{ fontWeight: 500, opacity: 0.8, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 9 }}>threat</span>
                              </span>
                            );
                          })()}
                          <span style={chipStyle}>{cluster.weakness.degree}</span>
                          <span style={chipStyle}>Bites: {cluster.weakness.onset}</span>
                          <span style={chipStyle}>Trainable: {cluster.weakness.reversibility}</span>
                        </div>
                      )}
                      {cluster.weakness && cluster.weakness.weakLines.length > 0 && (
                        <div style={{ fontSize: 11, color: "var(--rl-muted, #8c857a)", marginTop: 2 }}>
                          <span style={{ fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 9, opacity: 0.7, color: "#c8788f" }}>Weak line(s) → </span>
                          {cluster.weakness.weakLines.join(" · ")}
                        </div>
                      )}
                      {cluster.feeds && cluster.feeds.length > 0 && (
                        <div style={{ fontSize: 11, color: "var(--rl-muted, #8c857a)", marginTop: 2 }}>
                          <span style={{ fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 9, opacity: 0.7 }}>Feeds → </span>
                          {cluster.feeds.join(" · ")}
                        </div>
                      )}
                      {cluster.degrades && cluster.degrades.length > 0 && (
                        <div style={{ fontSize: 11, color: "var(--rl-muted, #8c857a)", marginTop: 2 }}>
                          <span style={{ fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 9, opacity: 0.7, color: "#c07a68" }}>Degrades → </span>
                          {cluster.degrades.join(" · ")}
                        </div>
                      )}
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
            </>)}

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

