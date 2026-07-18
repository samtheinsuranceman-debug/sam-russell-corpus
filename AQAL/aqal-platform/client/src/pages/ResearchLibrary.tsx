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

const chipStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999,
  padding: "2px 8px", fontSize: 10.5, color: "var(--rl-muted, #b9b2a6)", whiteSpace: "nowrap",
};

type PracticeCluster = {
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
  degrades?: string[];       // plain-language capacities/systems a harm cluster erodes
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
  // Cognitive & skill
  "27", "28", "29", "36", "35", "34", "64", "81", "76", "191", "207",
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
  // Environment & everyday habits
  "130", "125", "123", "127", "122", "124", "126", "129", "131", "128", "212", "216",
  // AI as coach, companion & mirror
  "194", "192", "195", "196", "193",
  "19", "20", "37", "197", "199", "201", "209", "213", "214", "215", "10", "11",
  // The cost of failure — the sobering coda: what breaks when it goes wrong
  "175", "181", "146", "165", "178", "145", "148", "149", "150", "161",
  "141", "143", "144", "142", "147", "158", "157", "159", "160", "151",
  "152", "153", "154", "155", "156", "162", "164", "166", "167", "169",
  "163", "170", "168", "174", "177", "188", "182", "183", "187", "184",
  "186", "189", "190", "173", "180", "171", "172", "176", "179", "185"];
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
    feeds: ["memory consolidation", "emotional regulation", "executive function", "immune function", "nearly every other line"],
    impact: { magnitude: 5, latency: "days", durability: "sustained", effort: "low" },
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
    feeds: ["volitional / willpower", "self-regulation", "follow-through on every other practice"],
    impact: { magnitude: 4, latency: "weeks", durability: "lasting", effort: "moderate" },
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
    feeds: ["metabolic health", "glucose control", "weight regulation"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
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
    feeds: ["mood", "sleep", "alertness", "circadian regulation"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "low" },
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
    feeds: ["longevity", "executive function", "memory", "mood", "cardiovascular health"],
    impact: { magnitude: 5, latency: "months", durability: "lasting", effort: "high" },
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
    feeds: ["mood", "cognition", "immune modulation"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "low" },
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
    feeds: ["cognition", "dementia-risk reduction", "mood"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "moderate" },
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
    feeds: ["auditory/motor skill", "executive function", "structural brain change"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "moderate" },
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
    feeds: ["cognitive reserve", "linguistic capacity"],
    impact: { magnitude: 2, latency: "months", durability: "lasting", effort: "high" },
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
    feeds: ["emotional processing", "working memory", "immune/health"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
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
    feeds: ["positive affect", "sleep", "relationships"],
    impact: { magnitude: 2, latency: "days", durability: "sustained", effort: "low" },
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
    feeds: ["prosociality", "humility", "wellbeing"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
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
    feeds: ["longevity", "cognitive resilience", "volitional drive"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
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
    feeds: ["longevity", "mood", "social connection", "meaning"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
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
    feeds: ["theory of mind", "linguistic range", "longevity"],
    impact: { magnitude: 2, latency: "months", durability: "lasting", effort: "low" },
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
    feeds: ["skill acquisition", "expertise", "memory retention"],
    impact: { magnitude: 4, latency: "weeks", durability: "lasting", effort: "high" },
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
    feeds: ["cognitive-aging buffer", "memory", "neuroplasticity"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "moderate" },
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
    feeds: ["stress physiology", "interoception", "vagal tone (experimental)"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "high" },
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
    feeds: ["financial self-efficacy", "volitional momentum"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "low" },
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
    feeds: ["self-regulation", "mood", "sense of control"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
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
    feeds: ["self-efficacy (thin evidence)", "mood"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
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
    feeds: ["attention", "mood", "sleep", "social connection"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
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

  // ═══════════════ SECTION 42 — GRIP & MUSCULAR STRENGTH ═══════════════
  {
    id: "grip-strength", section: "42", title: "Grip & Muscular Strength",
    subtitle: "Bolsters clusters: bodily-kinesthetic, systemic (a whole-body vitality index)",
    evidenceTag: "Strong",
    feeds: ["whole-body strength", "cardiovascular resilience", "functional independence", "frailty resistance", "longevity"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Handgrip and muscular strength is one of the cheapest, most robust predictors of all-cause and cardiovascular mortality across populations — a dynamometer forecasts early death better than many blood tests. It is best read as an index of whole-body robustness.",
    callout: "Grip strength predicts death, but no trial shows that squeezing harder — or isolated grip work — lowers mortality. The causal lever is overall resistance training; strength is the marker.",
    sources: [
      { cite: "Leong, D. P., et al. (2015). Prognostic value of grip strength: findings from the PURE study. The Lancet, 386(9990), 266–273.", note: "Each 5-kg drop in grip strength = 16% higher all-cause mortality across 17 countries. [Strong]", link: scholar("Leong Teo Rangarajan grip strength prognostic PURE Lancet 2015"), kind: "scholar" },
      { cite: "Celis-Morales, C. A., et al. (2018). Associations of grip strength with cardiovascular, respiratory, and cancer outcomes and all-cause mortality. BMJ, 361, k1651.", note: "In ~500,000 UK Biobank adults, low grip inversely associated with CVD, cancer, and death. [Strong]", link: scholar("Celis-Morales grip strength UK Biobank all cause mortality BMJ 2018 k1651"), kind: "scholar" },
      { cite: "García-Hermoso, A., et al. (2018). Muscular strength as a predictor of all-cause mortality: a systematic review and meta-analysis. Archives of Physical Medicine and Rehabilitation, 99(10), 2100–2113.", note: "Higher muscular strength ≈ 31% lower all-cause mortality in healthy adults. [Strong — meta-analysis]", link: scholar("Garcia-Hermoso muscular strength predictor all-cause mortality meta-analysis 2018"), kind: "scholar" },
      { cite: "Volaklis, K. A., Halle, M., & Meisinger, C. (2015). Muscular strength as a strong predictor of mortality: a systematic review. European Journal of Internal Medicine, 26(5), 303–310.", note: "Low muscular strength independently predicts higher mortality across cohorts. [Moderate]", link: scholar("Volaklis Halle Meisinger muscular strength strong predictor mortality European Journal Internal Medicine 2015"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 43 — PROTEIN & MUSCLE PRESERVATION ═══════════════
  {
    id: "protein-muscle", section: "43", title: "Protein & Muscle Preservation",
    subtitle: "Bolsters clusters: bodily-kinesthetic, systemic (aging independence)",
    evidenceTag: "Strong",
    feeds: ["skeletal muscle mass", "muscular strength", "recovery from illness/injury", "functional independence", "satiety"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Protein intake above the RDA (~1.0–1.6 g/kg/day), paired with resistance exercise and enough per-meal leucine, augments muscle mass and strength and defends against age-related sarcopenia.",
    callout: "Protein amplifies training — it does not build muscle without the stimulus. Benefit plateaus around 1.6 g/kg/day; 'more is better' is false above that, and protein alone in sedentary elders yields only modest change.",
    sources: [
      { cite: "Bauer, J., et al. (2013). Evidence-based recommendations for optimal dietary protein intake in older people: PROT-AGE position paper. JAMDA, 14(8), 542–559.", note: "Recommends 1.0–1.2 g/kg/day (more in illness) to counter sarcopenia. [Strong — consensus]", link: scholar("Bauer PROT-AGE optimal dietary protein intake older people position paper JAMDA 2013"), kind: "scholar" },
      { cite: "Morton, R. W., et al. (2018). Effect of protein supplementation on resistance-training-induced gains in muscle mass and strength: a systematic review, meta-analysis and meta-regression. British Journal of Sports Medicine, 52(6), 376–384.", note: "Protein boosts training gains; benefit plateaus ~1.62 g/kg/day. [Strong — meta-analysis]", link: scholar("Morton protein supplementation resistance training muscle mass strength meta-analysis British Journal Sports Medicine 2018"), kind: "scholar" },
      { cite: "Cermak, N. M., et al. (2012). Protein supplementation augments the adaptive response of skeletal muscle to resistance-type exercise training: a meta-analysis. American Journal of Clinical Nutrition, 96(6), 1454–1464.", note: "Protein co-ingestion increases fat-free mass and strength during prolonged training. [Strong — meta-analysis]", link: scholar("Cermak protein supplementation augments skeletal muscle resistance exercise meta-analysis AJCN 2012"), kind: "scholar" },
      { cite: "Moore, D. R., et al. (2015). Protein ingestion to stimulate myofibrillar protein synthesis requires greater relative protein intakes in healthy older versus younger men. Journals of Gerontology A, 70(1), 57–62.", note: "Older muscle is 'anabolically resistant' — needs more per-meal protein to maximize synthesis. [Moderate]", link: scholar("Moore Churchward-Venne myofibrillar protein synthesis older younger men relative protein Journal Gerontology 2015"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 44 — CREATINE ═══════════════
  {
    id: "creatine", section: "44", title: "Creatine",
    subtitle: "Bolsters clusters: bodily-kinesthetic, working memory (under stress)",
    evidenceTag: "Strong",
    feeds: ["muscular strength & power", "lean mass", "high-intensity capacity", "working memory (under fatigue)", "cellular energy buffering"],
    impact: { magnitude: 4, latency: "days", durability: "sustained", effort: "low" },
    description: "Creatine monohydrate is among the best-evidenced ergogenic aids for strength, power, and lean mass. Cognitive benefits are real but smaller — most reliable under sleep loss or stress, and in vegetarians with low baseline creatine.",
    callout: "The muscle case is settled; the brain case is not. Cognitive effects are inconsistent in well-rested omnivores and largest under stress or sleep deprivation. Don't oversell it as a general nootropic.",
    sources: [
      { cite: "Kreider, R. B., et al. (2017). International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation. Journal of the International Society of Sports Nutrition, 14, 18.", note: "Creatine is safe (up to 30 g/day for 5 years) and the most effective ergogenic supplement for high-intensity work. [Strong — position stand]", link: scholar("Kreider ISSN position stand safety efficacy creatine supplementation exercise sport medicine 2017"), kind: "scholar" },
      { cite: "Rae, C., et al. (2003). Oral creatine monohydrate supplementation improves brain performance: a double-blind, placebo-controlled, cross-over trial. Proceedings of the Royal Society B, 270(1529), 2147–2150.", note: "5 g/day for 6 weeks improved working memory and processing speed in vegetarians. [Moderate — RCT]", link: scholar("Rae Digney oral creatine monohydrate brain performance double-blind Proceedings Royal Society B 2003"), kind: "scholar" },
      { cite: "Avgerinos, K. I., et al. (2018). Effects of creatine supplementation on cognitive function of healthy individuals: a systematic review of randomized controlled trials. Experimental Gerontology, 108, 166–173.", note: "Creatine may improve short-term memory and reasoning; other domains unclear. [Moderate — review]", link: scholar("Avgerinos Spyrou creatine cognitive function healthy individuals systematic review Experimental Gerontology 2018"), kind: "scholar" },
      { cite: "Branch, J. D. (2003). Effect of creatine supplementation on body composition and performance: a meta-analysis. International Journal of Sport Nutrition and Exercise Metabolism, 13(2), 198–226.", note: "Creatine increases lean mass and performance in short, high-intensity tasks. [Strong — meta-analysis]", link: scholar("Branch creatine supplementation body composition performance meta-analysis International Journal Sport Nutrition 2003"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 45 — HIIT & INTERVAL TRAINING ═══════════════
  {
    id: "hiit", section: "45", title: "HIIT & Interval Training",
    subtitle: "Bolsters clusters: interoceptive, systemic, most cognitive lines (via fitness)",
    evidenceTag: "Strong",
    feeds: ["VO₂max / cardiorespiratory fitness", "mitochondrial capacity", "insulin sensitivity", "blood pressure", "time-efficiency"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "high" },
    description: "High-intensity interval and sprint training raise VO₂max and improve cardiometabolic markers — often more time-efficiently than moderate continuous training.",
    callout: "'Time-efficient' isn't effortless — the edge depends on genuinely high intensity, which lowers adherence, and fitness detrains if you stop. Long-term hard-outcome RCTs for HIIT specifically are limited.",
    sources: [
      { cite: "Weston, K. S., Wisløff, U., & Coombes, J. S. (2014). High-intensity interval training in patients with lifestyle-induced cardiometabolic disease: a systematic review and meta-analysis. British Journal of Sports Medicine, 48(16), 1227–1234.", note: "HIIT improved VO₂max nearly double vs. moderate continuous training in cardiometabolic patients. [Strong — meta-analysis]", link: scholar("Weston Wisloff Coombes high-intensity interval training lifestyle-induced cardiometabolic disease meta-analysis British Journal Sports Medicine 2014"), kind: "scholar" },
      { cite: "Gist, N. H., et al. (2014). Sprint interval training effects on aerobic capacity: a systematic review and meta-analysis. Sports Medicine, 44(2), 269–279.", note: "Brief all-out sprint intervals raised VO₂max ~8%. [Strong — meta-analysis]", link: scholar("Gist Fedewa Dishman sprint interval training aerobic capacity systematic review meta-analysis Sports Medicine 2014"), kind: "scholar" },
      { cite: "Milanović, Z., Sporiš, G., & Weston, M. (2015). Effectiveness of HIT and continuous endurance training for VO₂max improvements: a systematic review and meta-analysis. Sports Medicine, 45(10), 1469–1481.", note: "Interval training produced slightly greater VO₂max gains than continuous endurance training. [Strong — meta-analysis]", link: scholar("Milanovic Sporis Weston HIT continuous endurance training VO2max meta-analysis Sports Medicine 2015"), kind: "scholar" },
      { cite: "Batacan, R. B., et al. (2017). Effects of high-intensity interval training on cardiometabolic health: a systematic review and meta-analysis. British Journal of Sports Medicine, 51(6), 494–503.", note: "HIIT improved several cardiometabolic risk factors, varying by population. [Moderate — meta-analysis]", link: scholar("Batacan Duncan high-intensity interval training cardiometabolic health meta-analysis British Journal Sports Medicine 2017"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 46 — GLUCOSE REGULATION & POST-MEAL WALKING ═══════════════
  {
    id: "glucose-walking", section: "46", title: "Glucose Regulation & Post-Meal Walking",
    subtitle: "Bolsters clusters: interoceptive, systemic (metabolic)",
    evidenceTag: "Moderate",
    feeds: ["postprandial glucose control", "insulin sensitivity", "vascular health", "post-meal alertness", "counters sedentary harm"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Short bouts of light activity after eating — a 10-minute walk, or breaking up prolonged sitting — meaningfully blunt post-meal glucose and insulin spikes. The acute effect is real, repeatable, and especially valuable in insulin resistance.",
    callout: "Most trials measure same-day glucose curves, not months of HbA1c or hard outcomes. The acute effect is solid; durable disease modification from post-meal walking alone is still under-tested.",
    sources: [
      { cite: "Reynolds, A. N., et al. (2016). Advice to walk after meals is more effective for lowering postprandial glycaemia in type 2 diabetes than advice that does not specify timing: a randomised crossover study. Diabetologia, 59(12), 2572–2578.", note: "Walking 10 min after each meal cut postprandial glucose vs. unspecified-timing walking. [Moderate — RCT]", link: scholar("Reynolds Mann Williams walk after meals postprandial glycaemia type 2 diabetes Diabetologia 2016"), kind: "scholar" },
      { cite: "DiPietro, L., et al. (2013). Three 15-min bouts of moderate postmeal walking significantly improves 24-h glycemic control in older people at risk for impaired glucose tolerance. Diabetes Care, 36(10), 3262–3268.", note: "Post-meal walking improved 24-h glycemic control, post-dinner bout most effective. [Moderate — RCT]", link: scholar("DiPietro three 15-min bouts postmeal walking 24-h glycemic control older Diabetes Care 2013"), kind: "scholar" },
      { cite: "Dunstan, D. W., et al. (2012). Breaking up prolonged sitting reduces postprandial glucose and insulin responses. Diabetes Care, 35(5), 976–983.", note: "Brief walking breaks every 20 min lowered postprandial glucose and insulin vs. uninterrupted sitting. [Moderate — RCT]", link: scholar("Dunstan Kingwell breaking up prolonged sitting postprandial glucose insulin Diabetes Care 2012"), kind: "scholar" },
      { cite: "Buffey, A. J., et al. (2022). The acute effects of interrupting prolonged sitting with standing and light-intensity walking on biomarkers of cardiometabolic health: a systematic review and meta-analysis. Sports Medicine, 52(8), 1765–1787.", note: "Light-intensity walking breaks reduced postprandial glucose/insulin more than standing. [Moderate — meta-analysis]", link: scholar("Buffey Herring interrupting prolonged sitting standing light-intensity walking cardiometabolic meta-analysis Sports Medicine 2022"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 47 — DIETARY FIBER ═══════════════
  {
    id: "fiber", section: "47", title: "Dietary Fiber",
    subtitle: "Bolsters clusters: systemic, interoceptive (gut–brain)",
    evidenceTag: "Strong",
    feeds: ["gut microbiome diversity", "short-chain fatty acids", "cardiovascular health", "glycemic control", "satiety & weight regulation"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Higher whole-food fiber intake is consistently associated with lower all-cause and cardiovascular mortality, and less heart disease, stroke, type-2 diabetes, and colorectal cancer — plausibly via microbiome and short-chain-fatty-acid pathways.",
    callout: "Mortality data are largely observational (fiber-eaters live healthier overall), and whole-food fiber is not the same as isolated fiber supplements. The microbiome mechanism is promising but the causal chain isn't nailed down.",
    sources: [
      { cite: "Reynolds, A., et al. (2019). Carbohydrate quality and human health: a series of systematic reviews and meta-analyses. The Lancet, 393(10170), 434–445.", note: "Highest vs. lowest fiber linked to 15–30% lower all-cause/CV mortality; optimal 25–29 g/day. [Strong — meta-analysis]", link: scholar("Reynolds Mann Cummings carbohydrate quality human health systematic reviews meta-analyses Lancet 2019"), kind: "scholar" },
      { cite: "Kim, Y., & Je, Y. (2014). Dietary fiber intake and total mortality: a meta-analysis of prospective cohort studies. American Journal of Epidemiology, 180(6), 565–573.", note: "Each 10 g/day fiber associated with ~10% lower total mortality. [Strong — meta-analysis]", link: scholar("Kim Je dietary fiber intake total mortality meta-analysis prospective cohort American Journal Epidemiology 2014"), kind: "scholar" },
      { cite: "Threapleton, D. E., et al. (2013). Dietary fibre intake and risk of cardiovascular disease: systematic review and meta-analysis. BMJ, 347, f6879.", note: "Higher total and cereal fiber associated with lower CVD and coronary heart disease risk. [Strong — meta-analysis]", link: scholar("Threapleton Greenwood dietary fibre cardiovascular disease systematic review meta-analysis BMJ 2013 f6879"), kind: "scholar" },
      { cite: "Veronese, N., et al. (2018). Dietary fiber and health outcomes: an umbrella review of systematic reviews and meta-analyses. American Journal of Clinical Nutrition, 107(3), 436–444.", note: "Umbrella review confirms fiber's benefits across mortality, CVD, and diabetes. [Strong — umbrella review]", link: scholar("Veronese Solmi dietary fiber health outcomes umbrella review systematic reviews AJCN 2018"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 48 — REDUCING ULTRA-PROCESSED FOOD ═══════════════
  {
    id: "ultra-processed", section: "48", title: "Reducing Ultra-Processed Food",
    subtitle: "Bolsters clusters: systemic, volitional (appetite control)",
    evidenceTag: "Moderate",
    feeds: ["energy-intake regulation", "body-weight control", "cardiometabolic health", "diet quality", "satiety signaling"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Higher ultra-processed food intake is associated with obesity, cardiometabolic disease, and mortality — and a landmark inpatient RCT showed ultra-processed diets cause spontaneous overeating of ~500 kcal/day at matched nutrients.",
    callout: "Only one tightly controlled RCT (Hall, n=20) shows causation, and only for energy intake over two weeks. Disease/mortality links are observational, and 'ultra-processed' is a heterogeneous category — the exact harmful mechanism is unresolved.",
    sources: [
      { cite: "Hall, K. D., et al. (2019). Ultra-processed diets cause excess calorie intake and weight gain: an inpatient randomized controlled trial of ad libitum food intake. Cell Metabolism, 30(1), 67–77.", note: "Matched-nutrient ultra-processed diet caused ~500 kcal/day more intake and weight gain vs. unprocessed. [Strong — RCT]", link: scholar("Hall Ayuketah ultra-processed diets excess calorie intake weight gain inpatient randomized controlled trial Cell Metabolism 2019"), kind: "scholar" },
      { cite: "Pagliai, G., et al. (2021). Consumption of ultra-processed foods and health status: a systematic review and meta-analysis. British Journal of Nutrition, 125(3), 308–318.", note: "Highest ultra-processed consumption associated with higher overweight, CVD, and all-cause mortality. [Moderate — meta-analysis]", link: scholar("Pagliai Dinu ultra-processed foods health status systematic review meta-analysis British Journal Nutrition 2021"), kind: "scholar" },
      { cite: "Rico-Campà, A., et al. (2019). Association between consumption of ultra-processed foods and all-cause mortality: SUN prospective cohort study. BMJ, 365, l1949.", note: "Each additional daily ultra-processed serving associated with ~18% higher all-cause mortality. [Moderate — cohort]", link: scholar("Rico-Campa Martinez-Gonzalez ultra-processed foods all cause mortality SUN prospective cohort BMJ 2019"), kind: "scholar" },
      { cite: "Srour, B., et al. (2019). Ultra-processed food intake and risk of cardiovascular disease: prospective cohort study (NutriNet-Santé). BMJ, 365, l1451.", note: "Higher intake associated with increased cardiovascular, coronary, and cerebrovascular risk. [Moderate — cohort]", link: scholar("Srour Fezeu Kesse-Guyot ultra-processed food cardiovascular disease NutriNet-Sante BMJ 2019"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 49 — VITAMIN D & SUNLIGHT ═══════════════
  {
    id: "vitamin-d", section: "49", title: "Vitamin D & Sunlight",
    subtitle: "Bolsters clusters: systemic (mostly a deficiency-correction, not a booster)",
    evidenceTag: "Mixed",
    feeds: ["bone/calcium metabolism (in deficiency)", "immune modulation (respiratory infection)", "mood support in deficiency"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Low vitamin D status robustly predicts worse health — but the large VITAL supplementation RCTs were largely NULL for cancer, cardiovascular disease, fractures, and depression. Low D looks more like a marker of ill health than a fixable cause for most endpoints.",
    callout: "This is an honesty flagship. Observational 'low D = bad outcomes' did NOT translate into supplementation benefits in rigorous RCTs. Correcting true deficiency matters; routinely dosing already-replete adults does not deliver the promised endpoints. Possible exception: a modest cut in respiratory infections.",
    sources: [
      { cite: "Manson, J. E., et al. (2019). Vitamin D supplements and prevention of cancer and cardiovascular disease (VITAL). New England Journal of Medicine, 380(1), 33–44.", note: "2000 IU/day for ~5 years did NOT reduce cancer incidence or major cardiovascular events. [Strong — null RCT]", link: scholar("Manson Cook Lee vitamin D supplements prevention cancer cardiovascular disease VITAL New England Journal Medicine 2019"), kind: "scholar" },
      { cite: "Okereke, O. I., et al. (2020). Effect of long-term vitamin D3 supplementation vs placebo on risk of depression or clinically relevant depressive symptoms (VITAL-DEP). JAMA, 324(5), 471–480.", note: "Vitamin D3 did NOT prevent depression or improve mood scores in older adults. [Strong — null RCT]", link: scholar("Okereke Reynolds Mischoulon vitamin D3 depression mood VITAL-DEP randomized clinical trial JAMA 2020"), kind: "scholar" },
      { cite: "LeBoff, M. S., et al. (2022). Supplemental vitamin D and incident fractures in midlife and older adults (VITAL). New England Journal of Medicine, 387(4), 299–309.", note: "Vitamin D3 did NOT reduce incident fractures in generally healthy (non-deficient) adults. [Strong — null RCT]", link: scholar("LeBoff Chou supplemental vitamin D incident fractures midlife older adults VITAL New England Journal Medicine 2022"), kind: "scholar" },
      { cite: "Martineau, A. R., et al. (2017). Vitamin D supplementation to prevent acute respiratory tract infections: systematic review and meta-analysis of individual participant data. BMJ, 356, i6583.", note: "Supplementation modestly reduced acute respiratory infections, mainly in deficient people — the strongest positive signal. [Moderate — IPD meta-analysis]", link: scholar("Martineau Jolliffe vitamin D supplementation prevent acute respiratory tract infections individual participant data meta-analysis BMJ 2017"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 50 — HEARING & COGNITION ═══════════════
  {
    id: "hearing", section: "50", title: "Hearing & Cognition",
    subtitle: "Bolsters clusters: auditory, interpersonal, meta-cognitive",
    evidenceTag: "Strong",
    feeds: ["auditory processing", "working memory & attention", "social connection", "reduced isolation & depression risk"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Untreated hearing loss is the single largest modifiable dementia risk factor in the Lancet Commission model, and treating it (hearing aids) slows cognitive decline in higher-risk older adults. Straining to hear steals cognitive resources.",
    callout: "The ACHIEVE RCT found NO benefit in the full sample — the 48% slowing of decline was in a higher-risk subgroup, so 'hearing aids prevent dementia for everyone' overstates the data.",
    sources: [
      { cite: "Lin, F. R., et al. (2011). Hearing loss and incident dementia. Archives of Neurology, 68(2), 214–220.", note: "Dementia risk rose log-linearly with baseline hearing-loss severity. [Strong — cohort]", link: scholar("Lin hearing loss and incident dementia Archives Neurology 2011"), kind: "scholar" },
      { cite: "Loughrey, D. G., et al. (2018). Association of age-related hearing loss with cognitive function, cognitive impairment, and dementia: a systematic review and meta-analysis. JAMA Otolaryngology–Head & Neck Surgery, 144(2), 115–126.", note: "Pooled 36 studies: hearing loss significantly associated with cognitive decline and incident dementia. [Strong — meta-analysis]", link: scholar("Loughrey age-related hearing loss cognitive function meta-analysis JAMA Otolaryngology 2018"), kind: "scholar" },
      { cite: "Livingston, G., et al. (2020). Dementia prevention, intervention, and care: 2020 report of the Lancet Commission. The Lancet, 396(10248), 413–446.", note: "Midlife hearing loss ranked the single largest modifiable dementia risk factor (~8% of preventable cases). [Strong — commission]", link: scholar("Livingston dementia prevention 2020 Lancet Commission"), kind: "scholar" },
      { cite: "Lin, F. R., et al. (ACHIEVE) (2023). Hearing intervention versus health education control to reduce cognitive decline: a multicentre, randomised controlled trial. The Lancet, 402(10404), 786–797.", note: "No overall effect; 48% slowing of 3-year cognitive decline in the higher-risk ARIC subgroup. [Moderate — RCT]", link: scholar("ACHIEVE hearing intervention randomised controlled trial Lancet 2023 Lin"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 51 — ORAL & PERIODONTAL HEALTH ═══════════════
  {
    id: "oral-health", section: "51", title: "Oral & Periodontal Health",
    subtitle: "Bolsters clusters: systemic (vascular & inflammatory load)",
    evidenceTag: "Moderate",
    feeds: ["vascular endothelial health", "systemic inflammation (CRP/IL-6)", "possibly neuroinflammation", "tooth retention & nutrition"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Gum disease and its keystone pathogen P. gingivalis are associated with higher cardiovascular and dementia/Alzheimer risk — biologically plausible via systemic inflammation, and the practice (brush, floss, cleanings) is nearly free.",
    callout: "The P. gingivalis–Alzheimer causal case rests heavily on one industry-linked lab, and a gingipain-inhibitor trial did not show clear cognitive benefit. Association is consistent; causation is not proven.",
    sources: [
      { cite: "Dominy, S. S., et al. (2019). Porphyromonas gingivalis in Alzheimer's disease brains: evidence for disease causation and treatment with small-molecule inhibitors. Science Advances, 5(1), eaau3333.", note: "Found P. gingivalis/gingipains in Alzheimer's brains; oral infection raised amyloid-beta in mice. [Emerging]", link: scholar("Dominy Porphyromonas gingivalis Alzheimer's disease brains Science Advances 2019"), kind: "scholar" },
      { cite: "Sanz, M., et al. (2020). Periodontitis and cardiovascular diseases: consensus report (EFP/WHF). Journal of Clinical Periodontology, 47(3), 268–288.", note: "Strong epidemiological evidence that periodontitis raises future atherosclerotic CVD risk. [Moderate — consensus]", link: scholar("Sanz periodontitis and cardiovascular diseases consensus report Journal Clinical Periodontology 2020"), kind: "scholar" },
      { cite: "Chen, C. K., Wu, Y. T., & Chang, Y. C. (2017). Association between chronic periodontitis and the risk of Alzheimer's disease: a retrospective, population-based, matched-cohort study. Alzheimer's Research & Therapy, 9, 56.", note: "10-year chronic periodontitis exposure associated with elevated later Alzheimer risk. [Moderate — cohort]", link: scholar("Chen chronic periodontitis Alzheimer's disease matched cohort Alzheimer's Research Therapy 2017"), kind: "scholar" },
      { cite: "Ide, M., et al. (2016). Periodontitis and cognitive decline in Alzheimer's disease. PLOS ONE, 11(3), e0151081.", note: "In mild-moderate Alzheimer's, baseline periodontitis linked to ~6× faster 6-month cognitive decline. [Emerging]", link: scholar("Ide periodontitis and cognitive decline in Alzheimer's disease PLOS ONE 2016"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 52 — AIR QUALITY ═══════════════
  {
    id: "air-quality", section: "52", title: "Air Quality",
    subtitle: "Bolsters clusters: systemic (cerebrovascular protection)",
    evidenceTag: "Moderate",
    feeds: ["cerebrovascular integrity", "reduced neuro-inflammation/oxidative stress", "respiratory & cardiovascular health"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "low" },
    description: "Long-term fine-particulate (PM2.5) and traffic-related pollution is associated with faster cognitive decline and higher dementia incidence. Filtration and location choices are the individual levers; the big one is policy.",
    callout: "Nearly all human evidence is observational — exposure tracks with traffic, income, and urbanicity, which confound. No trial randomizes people to clean air.",
    sources: [
      { cite: "Weuve, J., et al. (2012). Exposure to particulate air pollution and cognitive decline in older women. Archives of Internal Medicine, 172(3), 219–227.", note: "Higher long-term PM exposure predicted significantly faster cognitive decline (Nurses' Health Study). [Moderate — cohort]", link: scholar("Weuve exposure to particulate air pollution and cognitive decline in older women Archives Internal Medicine 2012"), kind: "scholar" },
      { cite: "Chen, H., et al. (2017). Living near major roads and the incidence of dementia, Parkinson's disease, and multiple sclerosis: a population-based cohort study. The Lancet, 389(10070), 718–726.", note: "~2.2M Ontario adults: dementia incidence rose with proximity to heavy traffic. [Moderate — cohort]", link: scholar("Chen living near major roads incidence of dementia Lancet 2017 Ontario"), kind: "scholar" },
      { cite: "Peters, R., et al. (2019). Air pollution and dementia: a systematic review. Journal of Alzheimer's Disease, 70(s1), S145–S163.", note: "Greater pollutant exposure consistently associated with increased dementia risk. [Moderate — review]", link: scholar("Peters air pollution and dementia a systematic review Journal Alzheimer's Disease 2019"), kind: "scholar" },
      { cite: "Livingston, G., et al. (2020). Dementia prevention, intervention, and care: 2020 report of the Lancet Commission. The Lancet, 396(10248), 413–446.", note: "Added air pollution as a newly recognized modifiable dementia risk factor. [Moderate — commission]", link: scholar("Livingston 2020 Lancet Commission air pollution dementia risk factor"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 53 — VISION CORRECTION ═══════════════
  {
    id: "vision", section: "53", title: "Vision Correction",
    subtitle: "Bolsters clusters: systemic, meta-cognitive (sensory input → engagement)",
    evidenceTag: "Moderate",
    feeds: ["visual input & engagement", "cognitive stimulation", "mobility & fall reduction", "mood & social participation"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
    description: "Correcting visual impairment — notably cataract surgery — is associated with lower dementia risk and slower cognitive decline. A one-time intervention with a durable payoff, and a negative-control finding (glaucoma surgery showed no effect) argues against pure confounding.",
    callout: "Observational only; reverse causation is possible (healthier people get elective surgery), though the negative-control design partly addresses it. No dedicated RCT exists.",
    sources: [
      { cite: "Lee, C. S., et al. (2022). Association between cataract extraction and development of dementia. JAMA Internal Medicine, 182(2), 134–141.", note: "Cataract surgery associated with ~29% lower dementia risk; glaucoma surgery showed no effect. [Moderate — cohort w/ negative control]", link: scholar("Lee association between cataract extraction and development of dementia JAMA Internal Medicine 2022"), kind: "scholar" },
      { cite: "Maharani, A., et al. (2018). Cataract surgery and age-related cognitive decline: a 13-year follow-up of the English Longitudinal Study of Ageing. PLOS ONE, 13(10), e0204833.", note: "Rate of cognitive decline roughly halved after cataract surgery vs. no cataract. [Moderate — cohort]", link: scholar("Maharani cataract surgery age-related cognitive decline English Longitudinal Study of Ageing PLOS ONE 2018"), kind: "scholar" },
      { cite: "Ehrlich, J. R., et al. (2022). Addition of vision impairment to a life-course model of potentially modifiable dementia risk factors in the US. JAMA Neurology, 79(6), 623–626.", note: "Vision impairment estimated to account for ~100,000 prevalent US dementia cases. [Moderate — modeling]", link: scholar("Ehrlich vision impairment life-course model modifiable dementia risk factors JAMA Neurology 2022"), kind: "scholar" },
      { cite: "Livingston, G., et al. (2024). Dementia prevention, intervention, and care: 2024 report of the Lancet standing Commission. The Lancet, 404(10452), 572–628.", note: "Added untreated vision loss as a modifiable dementia risk factor. [Moderate — commission]", link: scholar("Livingston 2024 Lancet standing Commission dementia vision loss risk factor"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 54 — BLUE SPACE ═══════════════
  {
    id: "blue-space", section: "54", title: "Blue Space — Water & Wellbeing",
    subtitle: "Bolsters clusters: emotional, interoceptive (restoration)",
    evidenceTag: "Emerging",
    feeds: ["affect regulation & stress restoration", "reduced psychological distress", "physical activity", "social interaction", "nature-connectedness"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Exposure and proximity to blue spaces — sea, lakes, rivers — is associated with better mental wellbeing, more physical activity, and psychological restoration.",
    callout: "Mostly cross-sectional and self-report; effect sizes are modest and confounded by who lives near or visits water (income, coastal wealth). Reviews explicitly call for longitudinal designs.",
    sources: [
      { cite: "Gascon, M., et al. (2017). Outdoor blue spaces, human health and well-being: a systematic review of quantitative studies. International Journal of Hygiene and Environmental Health, 220(8), 1207–1221.", note: "35 studies: consistent positive associations between blue-space exposure and mental health/activity. [Emerging — review]", link: scholar("Gascon outdoor blue spaces human health well-being systematic review International Journal Hygiene Environmental Health 2017"), kind: "scholar" },
      { cite: "White, M. P., et al. (2021). Associations between green/blue spaces and mental health across 18 countries. Scientific Reports, 11, 8903.", note: "Recreational visits to blue/green spaces positively associated with wellbeing, negatively with distress (n=16,307). [Moderate — cross-sectional]", link: scholar("White associations between green blue spaces and mental health across 18 countries Scientific Reports 2021"), kind: "scholar" },
      { cite: "Georgiou, M., et al. (2021). Mechanisms of impact of blue spaces on human health: a systematic literature review and meta-analysis. International Journal of Environmental Research and Public Health, 18(5), 2486.", note: "Meta-analysis (50 studies): blue space increases physical activity, restoration, and environmental quality. [Emerging — meta-analysis]", link: scholar("Georgiou mechanisms of impact of blue spaces on human health systematic review meta-analysis IJERPH 2021"), kind: "scholar" },
      { cite: "White, M. P., et al. (2020). Blue space, health and well-being: a narrative overview and synthesis of potential benefits. Environmental Research, 191, 110169.", note: "Synthesizes evidence that aquatic settings support wellbeing via restoration, activity, and social pathways. [Emerging — review]", link: scholar("White blue space health and well-being narrative overview Environmental Research 2020"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 55 — PETS & COMPANION ANIMALS ═══════════════
  {
    id: "pets", section: "55", title: "Pets & Companion Animals",
    subtitle: "Bolsters clusters: interpersonal, emotional, systemic",
    evidenceTag: "Mixed",
    feeds: ["daily physical activity (walking)", "social connection & reduced loneliness", "blood pressure/autonomic tone", "post-cardiac-event survival"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "high" },
    description: "Dog ownership is associated with lower all-cause and cardiovascular mortality, more physical activity, and less loneliness — a large observational literature plus an AHA statement.",
    callout: "A formal reappraisal warned the survival meta-analysis is vulnerable to confounding and selection bias — healthier, more active people can more easily own dogs. No RCT exists, and pet care is a real long-term commitment.",
    sources: [
      { cite: "Kramer, C. K., Mehmood, S., & Suen, R. S. (2019). Dog ownership and survival: a systematic review and meta-analysis. Circulation: Cardiovascular Quality and Outcomes, 12(10), e005554.", note: "10 studies, ~3.8M people: dog ownership associated with 24% lower all-cause mortality. [Moderate — meta-analysis]", link: scholar("Kramer dog ownership and survival systematic review meta-analysis Circulation Cardiovascular Quality Outcomes 2019"), kind: "scholar" },
      { cite: "Mubanga, M., et al. (2017). Dog ownership and the risk of cardiovascular disease and death – a nationwide cohort study. Scientific Reports, 7, 15821.", note: "Swedish register (3.4M): dog ownership linked to lower death and CVD risk, strongest in single-person households. [Moderate — cohort]", link: scholar("Mubanga dog ownership risk of cardiovascular disease and death nationwide cohort Scientific Reports 2017"), kind: "scholar" },
      { cite: "Levine, G. N., et al. (2013). Pet ownership and cardiovascular risk: a scientific statement from the American Heart Association. Circulation, 127(23), 2353–2363.", note: "AHA: dog ownership 'probably associated' with reduced CVD risk; causality not established. [Moderate — statement]", link: scholar("Levine pet ownership and cardiovascular risk scientific statement American Heart Association Circulation 2013"), kind: "scholar" },
      { cite: "Chowdhury, E. K., Nelson, M. R., & Reid, C. M. (2020). Does dog ownership really prolong survival? A revised meta-analysis and reappraisal of the evidence. Circulation: Cardiovascular Quality and Outcomes, 13(4), e006907.", note: "Reappraisal: the survival benefit shrinks and may reflect bias/confounding. [Mixed]", link: scholar("does dog ownership really prolong survival revised meta-analysis reappraisal Circulation Cardiovascular Quality Outcomes 2020"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 56 — CAFFEINE ═══════════════
  {
    id: "caffeine", section: "56", title: "Caffeine",
    subtitle: "Bolsters clusters: alertness, adversarial/strategic (under fatigue) — traded vs sleep",
    evidenceTag: "Moderate",
    feeds: ["alertness & sustained attention", "reaction time", "vigilance under fatigue", "endurance & muscular performance"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Caffeine reliably improves alertness, vigilance, reaction time, and endurance performance. Effects on memory and higher-order cognition are weaker, and late-day dosing degrades sleep.",
    callout: "Much of the 'boost' is reversal of withdrawal and fatigue rather than net enhancement, tolerance develops, and benefit comes at a real sleep cost if taken within ~6 hours of bed.",
    sources: [
      { cite: "McLellan, T. M., Caldwell, J. A., & Lieberman, H. R. (2016). A review of caffeine's effects on cognitive, physical and occupational performance. Neuroscience & Biobehavioral Reviews, 71, 294–312.", note: "40–300 mg improves alertness, vigilance, attention, reaction time; memory/executive effects less consistent. [Strong — review]", link: scholar("McLellan review of caffeine's effects on cognitive physical and occupational performance Neuroscience Biobehavioral Reviews 2016"), kind: "scholar" },
      { cite: "Nehlig, A. (2010). Is caffeine a cognitive enhancer? Journal of Alzheimer's Disease, 20(s1), S85–S94.", note: "Little consistent memory benefit; caffeine mainly improves reaction time and alertness under suboptimal states. [Mixed]", link: scholar("Nehlig is caffeine a cognitive enhancer Journal Alzheimer's Disease 2010"), kind: "scholar" },
      { cite: "Drake, C., et al. (2013). Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed. Journal of Clinical Sleep Medicine, 9(11), 1195–1200.", note: "400 mg even 6 hours before bed cut objective sleep by >1 hour, often unnoticed by subjects. [Strong — RCT]", link: scholar("Drake caffeine effects on sleep taken 0 3 or 6 hours before going to bed Journal Clinical Sleep Medicine 2013"), kind: "scholar" },
      { cite: "Grgic, J., et al. (2020). Wake up and smell the coffee: caffeine supplementation and exercise performance — an umbrella review of 21 published meta-analyses. British Journal of Sports Medicine, 54(11), 681–688.", note: "Umbrella review confirms caffeine's ergogenic effect across many exercise modalities. [Strong — umbrella review]", link: scholar("Grgic wake up and smell the coffee caffeine supplementation exercise performance umbrella review British Journal Sports Medicine 2020"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 57 — ALCOHOL REDUCTION ═══════════════
  {
    id: "alcohol", section: "57", title: "Alcohol Reduction",
    subtitle: "Bolsters clusters: most cognitive lines, systemic, emotional",
    evidenceTag: "Strong",
    feeds: ["hippocampal/gray-matter integrity", "white-matter microstructure", "executive function & memory", "cerebrovascular & liver health", "sleep quality"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
    description: "Reducing alcohol protects brain structure and lowers dementia risk. Heavy use is a major preventable dementia cause, and even 'moderate' intake shows adverse brain effects with no proven protective floor.",
    callout: "Whether light drinking is net-harmful is genuinely contested — some cohorts show a U-shape where abstainers also carry elevated risk (confounded by sick-quitters). The heavy-use harm, however, is not in doubt.",
    sources: [
      { cite: "Topiwala, A., et al. (2017). Moderate alcohol consumption as a risk factor for adverse brain outcomes and cognitive decline: longitudinal cohort study. BMJ, 357, j2353.", note: "Even 14–21 units/week tripled odds of hippocampal atrophy; no protective effect of light drinking on brain structure. [Moderate — cohort]", link: scholar("Topiwala moderate alcohol consumption adverse brain outcomes cognitive decline BMJ 2017"), kind: "scholar" },
      { cite: "GBD 2016 Alcohol Collaborators (2018). Alcohol use and burden for 195 countries and territories, 1990–2016. The Lancet, 392(10152), 1015–1035.", note: "Concluded the consumption level minimizing health loss is zero. [Strong — global burden]", link: scholar("GBD 2016 Alcohol Collaborators alcohol use burden 195 countries Lancet 2018 no safe level"), kind: "scholar" },
      { cite: "Sabia, S., et al. (2018). Alcohol consumption and risk of dementia: 23-year follow-up of the Whitehall II cohort study. BMJ, 362, k2927.", note: "Both midlife abstinence and >14 units/week associated with higher dementia risk (U-shaped). [Moderate — cohort]", link: scholar("Sabia alcohol consumption and risk of dementia 23 year follow-up Whitehall II BMJ 2018"), kind: "scholar" },
      { cite: "Schwarzinger, M., et al. (2018). Contribution of alcohol use disorders to the burden of dementia in France 2008–13: a nationwide retrospective cohort study. The Lancet Public Health, 3(3), e124–e132.", note: "Alcohol use disorders were the strongest modifiable risk factor for dementia (HR >3), especially early-onset. [Strong — cohort]", link: scholar("Schwarzinger contribution of alcohol use disorders to burden of dementia France Lancet Public Health 2018"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 58 — DANCE ═══════════════
  {
    id: "dance", section: "58", title: "Dance",
    subtitle: "Bolsters clusters: bodily-kinesthetic, spatial, memory, interpersonal",
    evidenceTag: "Moderate",
    feeds: ["balance & gait stability", "memory & executive function", "spatial navigation", "social connection", "cardiovascular fitness"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Learning-intensive partnered or choreographed dance is associated with lower dementia incidence and improves balance and hippocampal volume — it stacks aerobic, cognitive, and social demands in one activity.",
    callout: "The landmark Verghese finding is observational (reverse causation — early decline reduces dancing — is a real confounder), and the RCTs showing brain/balance change are small and short.",
    sources: [
      { cite: "Verghese, J., et al. (2003). Leisure activities and the risk of dementia in the elderly. New England Journal of Medicine, 348(25), 2508–2516.", note: "Dancing was the only physical leisure activity associated with reduced dementia risk over ~5 years. [Strong design, single study]", link: scholar("Verghese Lipton leisure activities risk of dementia elderly New England Journal Medicine 2003"), kind: "scholar" },
      { cite: "Rehfeld, K., et al. (2017). Dancing or fitness sport? The effects of two training programs on hippocampal plasticity and balance abilities in healthy seniors. Frontiers in Human Neuroscience, 11, 305.", note: "Both dance and endurance grew hippocampal volume, but only dance improved balance. [Moderate — small RCT]", link: scholar("Rehfeld dancing or fitness sport hippocampal plasticity balance healthy seniors Frontiers Human Neuroscience 2017"), kind: "scholar" },
      { cite: "Hewston, P., et al. (2021). Effects of dance on cognitive function in older adults: a systematic review and meta-analysis. Age and Ageing, 50(4), 1084–1092.", note: "Dance yielded small-to-moderate benefits for global cognition vs. controls. [Moderate — meta-analysis]", link: scholar("Hewston effects of dance on cognitive function older adults systematic review meta-analysis Age and Ageing 2021"), kind: "scholar" },
      { cite: "Meng, X., et al. (2020). Effects of dance intervention on global cognition, executive function and memory of older adults: a meta-analysis and systematic review. Aging Clinical and Experimental Research, 32, 7–19.", note: "Dance improved global cognition and memory in older adults across trials. [Moderate — meta-analysis]", link: scholar("Meng effects of dance intervention global cognition executive function memory older adults meta-analysis Aging Clinical Experimental Research 2020"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 59 — TAI CHI & QIGONG ═══════════════
  {
    id: "tai-chi", section: "59", title: "Tai Chi & Qigong",
    subtitle: "Bolsters clusters: bodily-kinesthetic, interoceptive, executive function",
    evidenceTag: "Strong",
    feeds: ["postural stability & fall avoidance", "lower-body strength", "executive function/attention", "proprioception", "parasympathetic calm"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "low" },
    description: "A gentle, low-injury mind-body practice with the most robust evidence for falls and balance (including in Parkinson's) and moderate evidence for executive-function gains in older adults.",
    callout: "Blinding is impossible and many trials use inactive controls, which inflates effects; the cognitive benefits are clearest in people without existing impairment.",
    sources: [
      { cite: "Li, F., et al. (2012). Tai chi and postural stability in patients with Parkinson's disease. New England Journal of Medicine, 366(6), 511–519.", note: "Tai chi improved postural stability and reduced falls more than resistance or stretching in Parkinson's. [Strong — RCT]", link: scholar("Li Harmer tai chi postural stability patients Parkinson disease New England Journal Medicine 2012"), kind: "scholar" },
      { cite: "Sherrington, C., et al. (2019). Exercise for preventing falls in older people living in the community. Cochrane Database of Systematic Reviews, (1), CD012424.", note: "Balance/functional exercise cut fall rate ~24%; tai chi reduced falls ~19%. [Strong — Cochrane]", link: scholar("Sherrington exercise for preventing falls older people living community Cochrane 2019"), kind: "scholar" },
      { cite: "Wayne, P. M., et al. (2014). Effect of tai chi on cognitive performance in older adults: systematic review and meta-analysis. Journal of the American Geriatrics Society, 62(1), 25–39.", note: "Tai chi showed potential to enhance cognition, especially executive function, in older adults. [Moderate — meta-analysis]", link: scholar("Wayne effect of tai chi cognitive performance older adults systematic review meta-analysis Journal American Geriatrics Society 2014"), kind: "scholar" },
      { cite: "Wang, F., et al. (2014). The effects of tai chi on depression, anxiety, and psychological well-being: a systematic review and meta-analysis. International Journal of Behavioral Medicine, 21, 605–617.", note: "Tai chi associated with reduced depression, anxiety, and stress and improved wellbeing. [Moderate — meta-analysis]", link: scholar("Wang effects of tai chi depression anxiety psychological well-being systematic review meta-analysis International Journal Behavioral Medicine 2014"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 60 — WALKING & DAILY STEPS ═══════════════
  {
    id: "walking-steps", section: "60", title: "Walking & Daily Steps",
    subtitle: "Bolsters clusters: interoceptive, systemic, emotional",
    evidenceTag: "Strong",
    feeds: ["cardiovascular & metabolic health", "longevity", "mood", "weight regulation", "musculoskeletal maintenance"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "low" },
    description: "Higher daily step counts are strongly and consistently associated with lower all-cause mortality, with benefits accruing well below 10,000 and plateauing around 6,000–8,000 steps in older adults. Cheap, joint-friendly, and habit-forming.",
    callout: "The '10,000 steps' target came from 1960s Japanese pedometer marketing (manpo-kei), not research. Evidence is observational, so residual confounding by baseline health remains.",
    sources: [
      { cite: "Paluch, A. E., et al. (2022). Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. The Lancet Public Health, 7(3), e219–e228.", note: "Mortality risk leveled off at ~6,000–8,000 steps/day for adults ≥60, ~8,000–10,000 for younger. [Strong — meta-analysis]", link: scholar("Paluch daily steps all-cause mortality meta-analysis 15 international cohorts Lancet Public Health 2022"), kind: "scholar" },
      { cite: "Lee, I. M., et al. (2019). Association of step volume and intensity with all-cause mortality in older women. JAMA Internal Medicine, 179(8), 1105–1112.", note: "~4,400 steps/day cut mortality vs. 2,700; benefit plateaued near 7,500. [Strong — cohort]", link: scholar("Lee Shiroma association step volume intensity all-cause mortality older women JAMA Internal Medicine 2019"), kind: "scholar" },
      { cite: "Saint-Maurice, P. F., et al. (2020). Association of daily step count and step intensity with mortality among US adults. JAMA, 323(12), 1151–1160.", note: "Higher steps linked to lower mortality; intensity not associated after adjusting for total steps. [Strong — cohort]", link: scholar("Saint-Maurice association daily step count step intensity mortality US adults JAMA 2020"), kind: "scholar" },
      { cite: "Del Pozo Cruz, B., et al. (2022). Prospective associations of daily step counts and intensity with cancer and cardiovascular disease incidence and mortality. JAMA Internal Medicine, 182(11), 1139–1148.", note: "~10,000 steps/day associated with lowest dementia, cancer, and CVD risk in UK Biobank. [Moderate — cohort]", link: scholar("Del Pozo Cruz prospective associations daily step counts intensity cancer cardiovascular disease mortality JAMA Internal Medicine 2022"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 61 — BREAKING UP SITTING ═══════════════
  {
    id: "sit-less", section: "61", title: "Breaking Up Sitting",
    subtitle: "Bolsters clusters: systemic, interoceptive (metabolic)",
    evidenceTag: "Moderate",
    feeds: ["glucose/insulin regulation", "vascular function", "metabolic health", "muscle activation", "cardiovascular risk reduction"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Prolonged uninterrupted sitting is associated with higher mortality independent of exercise, and interrupting it with brief walking bouts acutely lowers post-meal glucose and insulin.",
    callout: "The glycemic RCTs are short-term crossover lab studies; long-term hard-outcome trials of 'sit less' are scarce, and the mortality data are observational. Enough moderate activity can offset much of the sitting risk.",
    sources: [
      { cite: "Dunstan, D. W., et al. (2012). Breaking up prolonged sitting reduces postprandial glucose and insulin responses. Diabetes Care, 35(5), 976–983.", note: "2-min walking every 20 min cut post-meal glucose and insulin vs. sitting. [Strong — crossover RCT]", link: scholar("Dunstan breaking up prolonged sitting reduces postprandial glucose insulin responses Diabetes Care 2012"), kind: "scholar" },
      { cite: "Diaz, K. M., et al. (2017). Patterns of sedentary behavior and mortality in U.S. middle-aged and older adults: a national cohort study. Annals of Internal Medicine, 167(7), 465–475.", note: "Greater total and more prolonged uninterrupted sedentary time predicted higher mortality. [Moderate — cohort]", link: scholar("Diaz patterns of sedentary behavior mortality US middle-aged older adults national cohort Annals Internal Medicine 2017"), kind: "scholar" },
      { cite: "Ekelund, U., et al. (2016). Does physical activity attenuate, or even eliminate, the detrimental association of sitting time with mortality? The Lancet, 388(10051), 1302–1310.", note: "~60–75 min/day of moderate activity offset the mortality risk of prolonged sitting. [Strong — harmonized meta-analysis]", link: scholar("Ekelund does physical activity attenuate eliminate detrimental association sitting time mortality Lancet 2016"), kind: "scholar" },
      { cite: "Healy, G. N., et al. (2008). Breaks in sedentary time: beneficial associations with metabolic risk. Diabetes Care, 31(4), 661–666.", note: "More breaks in sitting associated with smaller waist, lower triglycerides and glucose. [Moderate — cross-sectional]", link: scholar("Healy Dunstan breaks in sedentary time beneficial associations metabolic risk Diabetes Care 2008"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 62 — SINGING & CHOIR ═══════════════
  {
    id: "singing", section: "62", title: "Singing & Choir",
    subtitle: "Bolsters clusters: musical, interpersonal, interoceptive (vagal)",
    evidenceTag: "Moderate",
    feeds: ["mood & positive affect", "social connection/belonging", "parasympathetic (vagal) tone", "endorphin/pain-threshold response", "respiratory control"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Group singing is reliably linked to improved mood and social bonding, with suggestive evidence for endocrine/immune (cortisol, secretory IgA) and vagal/HRV effects via slow, coordinated breathing.",
    callout: "Biomarker studies are small, often uncontrolled pre-post designs with inconsistent results, and confounded by the general benefits of any shared group activity.",
    sources: [
      { cite: "Weinstein, D., et al. (2016). Singing and social bonding: changes in connectivity and pain threshold as a function of group size. Evolution and Human Behavior, 37(2), 152–158.", note: "Singing raised social closeness and pain thresholds; large 'megachoirs' bonded as effectively as small ones. [Moderate — field study]", link: scholar("Weinstein Launay singing and social bonding connectivity pain threshold group size Evolution and Human Behavior 2016"), kind: "scholar" },
      { cite: "Vickhoff, B., et al. (2013). Music structure determines heart rate variability of singers. Frontiers in Psychology, 4, 334.", note: "Unison singing synchronized singers' HRV and slowed respiration, engaging vagal tone. [Emerging — mechanistic]", link: scholar("Vickhoff music structure determines heart rate variability of singers Frontiers Psychology 2013"), kind: "scholar" },
      { cite: "Kreutz, G., et al. (2004). Effects of choir singing or listening on secretory immunoglobulin A, cortisol, and emotional state. Journal of Behavioral Medicine, 27(6), 623–635.", note: "Singing (vs. listening) raised positive affect and secretory IgA and reduced negative affect. [Emerging — within-subject]", link: scholar("Kreutz Bongard effects of choir singing listening secretory immunoglobulin A cortisol emotional state Journal Behavioral Medicine 2004"), kind: "scholar" },
      { cite: "Fancourt, D., et al. (2016). Singing modulates mood, stress, cortisol, cytokine and neuropeptide activity in cancer patients and carers. ecancermedicalscience, 10, 631.", note: "One hour of choir singing lowered cortisol and shifted cytokine/mood profiles. [Emerging — pre-post, no control]", link: scholar("Fancourt singing modulates mood stress cortisol cytokine neuropeptide cancer patients carers ecancermedicalscience 2016"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 63 — SEXUAL HEALTH & LONGEVITY ═══════════════
  {
    id: "sexual-health", section: "63", title: "Sexual Health & Longevity",
    subtitle: "Bolsters clusters: seductive, interpersonal, systemic",
    evidenceTag: "Mixed",
    feeds: ["cardiovascular health", "relationship intimacy/wellbeing", "stress/cortisol regulation", "sleep", "life satisfaction"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Observational cohorts associate higher sexual and orgasmic frequency with lower mortality and better wellbeing — but the evidence is correlational and prone to reverse causation.",
    callout: "Healthier people simply have more sex — reverse causation is the dominant explanation. The famous Caerphilly mortality finding is a single male cohort, never replicated in a trial (which is largely impossible). Wellbeing gains plateau around once weekly for couples.",
    sources: [
      { cite: "Davey Smith, G., Frankel, S., & Yarnell, J. (1997). Sex and death: are they related? Findings from the Caerphilly cohort study. BMJ, 315(7123), 1641–1644.", note: "Men with high orgasmic frequency had ~50% lower 10-year mortality, with a dose-response gradient. [Moderate — cohort, single-sex]", link: scholar("Davey Smith Frankel Yarnell sex and death are they related Caerphilly cohort study BMJ 1997"), kind: "scholar" },
      { cite: "Muise, A., Schimmack, U., & Impett, E. A. (2016). Sexual frequency predicts greater well-being, but more is not always better. Social Psychological and Personality Science, 7(4), 295–302.", note: "Wellbeing rose with sexual frequency but plateaued around once weekly for couples. [Moderate — diary/cohort]", link: scholar("Muise Schimmack Impett sexual frequency predicts greater well-being more is not always better Social Psychological Personality Science 2016"), kind: "scholar" },
      { cite: "Ebrahim, S., et al. (2002). Sexual intercourse and risk of ischaemic stroke and coronary heart disease: the Caerphilly study. Journal of Epidemiology and Community Health, 56(2), 99–102.", note: "Frequency of intercourse not associated with increased stroke risk and inversely related to coronary heart disease. [Moderate — cohort]", link: scholar("Ebrahim sexual intercourse risk ischaemic stroke coronary heart disease Caerphilly Journal Epidemiology Community Health 2002"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 64 — FLOW STATES ═══════════════
  {
    id: "flow", section: "64", title: "Flow States",
    subtitle: "Bolsters clusters: volitional, meta-cognitive, most skill lines",
    evidenceTag: "Moderate",
    feeds: ["sustained attention/engagement", "intrinsic motivation", "subjective wellbeing", "skill development", "reduced self-consciousness"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "moderate" },
    description: "Flow — deep absorption when challenge matches skill — is a well-characterized state associated with wellbeing and, more modestly, with performance. Cultivating its conditions (clear goals, immediate feedback, matched difficulty) is trainable.",
    callout: "The flow-performance link is real but small and its direction is ambiguous — good performance may cause flow as much as flow causes performance. Most data are self-report and cross-sectional.",
    sources: [
      { cite: "Nakamura, J., & Csikszentmihalyi, M. (2002). The concept of flow. In Handbook of Positive Psychology (pp. 89–105). Oxford University Press.", note: "Defines flow via the challenge-skill balance and its role in engagement and growth. [Moderate — theoretical review]", link: scholar("Nakamura Csikszentmihalyi the concept of flow Handbook of Positive Psychology 2002"), kind: "scholar" },
      { cite: "Harris, D. J., et al. (2023). A systematic review and meta-analysis of the relationship between flow states and performance. International Review of Sport and Exercise Psychology, 16(1), 693–721.", note: "Found a small-to-moderate positive flow-performance correlation with unclear causal direction. [Moderate — meta-analysis]", link: scholar("Harris Allen Vine Wilson systematic review meta-analysis relationship between flow states and performance International Review Sport Exercise Psychology"), kind: "scholar" },
      { cite: "Csikszentmihalyi, M. (1990). Flow: The Psychology of Optimal Experience. Harper & Row.", note: "Foundational synthesis of flow as autotelic, absorbed optimal experience across domains. [Moderate — foundational]", link: scholar("Csikszentmihalyi Flow the psychology of optimal experience 1990"), kind: "scholar" },
      { cite: "Engeser, S., & Rheinberg, F. (2008). Flow, performance and moderators of the flow-performance relationship. Motivation and Emotion, 32, 158–172.", note: "Flow predicted performance, moderated by perceived importance and skill. [Emerging — field/experimental]", link: scholar("Engeser Rheinberg flow performance and moderators of the flow-performance relationship Motivation and Emotion 2008"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 65 — MASSAGE & BODYWORK ═══════════════
  {
    id: "massage", section: "65", title: "Massage & Bodywork",
    subtitle: "Bolsters clusters: interoceptive, emotional (state anxiety)",
    evidenceTag: "Mixed",
    feeds: ["state/trait anxiety reduction", "pain relief", "blood pressure & heart rate (acute)", "mood", "sleep & relaxation"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Massage produces reliable short-term reductions in state anxiety, blood pressure and heart rate, and moderate benefits for trait anxiety, depression, and some pain — a genuinely restful, passive intervention.",
    callout: "The widely repeated 'massage cuts cortisol ~30%' claim fails in rigorous meta-analysis — single sessions did NOT reliably reduce cortisol. Much positive research comes from a single group with small samples and weak controls.",
    sources: [
      { cite: "Moyer, C. A., Rounds, J., & Hannum, J. W. (2004). A meta-analysis of massage therapy research. Psychological Bulletin, 130(1), 3–18.", note: "Massage reliably cut state anxiety, BP, and HR but NOT cortisol; largest effects were trait anxiety and depression. [Strong — meta-analysis]", link: scholar("Moyer Rounds Hannum a meta-analysis of massage therapy research Psychological Bulletin 2004"), kind: "scholar" },
      { cite: "Moyer, C. A., et al. (2011). Does massage therapy reduce cortisol? A comprehensive quantitative review. Journal of Bodywork and Movement Therapies, 15(1), 3–14.", note: "Concluded massage's cortisol reductions are much smaller and less reliable than commonly claimed. [Strong — quantitative review]", link: scholar("Moyer does massage therapy reduce cortisol comprehensive quantitative review Journal Bodywork Movement Therapies 2011"), kind: "scholar" },
      { cite: "Crawford, C., et al. (2016). The impact of massage therapy on function in pain populations — a systematic review and meta-analysis. Pain Medicine, 17(7), 1353–1375.", note: "Massage showed favorable, though variable, effects on pain and function; evidence quality low-to-moderate. [Moderate — meta-analysis]", link: scholar("Crawford Boyd impact of massage therapy on function in pain populations systematic review meta-analysis Pain Medicine 2016"), kind: "scholar" },
      { cite: "Moraska, A., et al. (2010). Physiological adjustments to stress measures following massage therapy: a review of the literature. Evidence-Based Complementary and Alternative Medicine, 7(4), 409–418.", note: "Found inconsistent, methodologically weak evidence for massage effects on cortisol and stress physiology. [Moderate — critical review]", link: scholar("Moraska physiological adjustments to stress measures following massage therapy review of the literature eCAM 2010"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 66 — MINDFULNESS & MBSR ═══════════════
  {
    id: "mindfulness", section: "66", title: "Mindfulness & MBSR",
    subtitle: "Bolsters clusters: meta-cognitive, emotional, interoceptive",
    evidenceTag: "Moderate",
    feeds: ["emotional regulation", "attention/focus", "stress physiology", "metacognitive awareness", "rumination reduction"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Structured attention and awareness training (breath, body scan, open monitoring) for stress, anxiety, and attention. The evidence is real but the effects are moderate and shrink against active controls.",
    callout: "In the strongest RCT-only synthesis (Goyal 2014), benefits held for anxiety, depression, and pain but were small-to-moderate — with no good evidence mindfulness beats active comparators like exercise. Much popular writing overstates it via weak, passive controls.",
    sources: [
      { cite: "Goyal, M., et al. (2014). Meditation programs for psychological stress and well-being: a systematic review and meta-analysis. JAMA Internal Medicine, 174(3), 357–368.", note: "Moderate evidence of improved anxiety, depression, and pain — but no evidence of superiority over active treatments. [Strong — meta-analysis]", link: scholar("Goyal 2014 meditation programs psychological stress well-being systematic review JAMA Internal Medicine"), kind: "scholar" },
      { cite: "Khoury, B., et al. (2013). Mindfulness-based therapy: a comprehensive meta-analysis. Clinical Psychology Review, 33(6), 763–771.", note: "Across 209 studies, moderately effective for anxiety/depression/stress, but not different from other active treatments. [Moderate — meta-analysis]", link: scholar("Khoury 2013 mindfulness-based therapy comprehensive meta-analysis Clinical Psychology Review"), kind: "scholar" },
      { cite: "Hofmann, S. G., et al. (2010). The effect of mindfulness-based therapy on anxiety and depression: a meta-analytic review. Journal of Consulting and Clinical Psychology, 78(2), 169–183.", note: "In clinical samples, mindfulness-based therapy produced robust improvements in anxiety and mood. [Moderate — meta-analysis]", link: scholar("Hofmann Sawyer Witt Oh 2010 mindfulness-based therapy anxiety depression meta-analytic review"), kind: "scholar" },
      { cite: "Kabat-Zinn, J. (1982). An outpatient program in behavioral medicine for chronic pain patients based on the practice of mindfulness meditation. General Hospital Psychiatry, 4(1), 33–47.", note: "Foundational MBSR study reporting reductions in chronic pain and mood disturbance. [Emerging — foundational, uncontrolled]", link: scholar("Kabat-Zinn 1982 outpatient program behavioral medicine chronic pain mindfulness meditation General Hospital Psychiatry"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 67 — LOVING-KINDNESS MEDITATION ═══════════════
  {
    id: "loving-kindness", section: "67", title: "Loving-Kindness Meditation",
    subtitle: "Bolsters clusters: emotional, interpersonal, existential",
    evidenceTag: "Moderate",
    feeds: ["positive emotion", "social connection/warmth", "self-compassion", "in-group/out-group bias reduction"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "A directed well-wishing practice (toward self, loved ones, strangers, all beings) that builds positive emotion and felt social connection. Short-term affect effects are real; longer-term and prosocial-behavior effects are weaker.",
    callout: "In Galante's meta-analysis, benefits decreased or became non-significant against active (not passive) controls, and effects on real-world prosocial behavior are limited.",
    sources: [
      { cite: "Galante, J., et al. (2014). Effect of kindness-based meditation on health and well-being: a systematic review and meta-analysis. Journal of Consulting and Clinical Psychology, 82(6), 1101–1114.", note: "Improved depression, compassion, self-compassion, and positive affect, but weakened against active controls. [Moderate — meta-analysis]", link: scholar("Galante 2014 kindness-based meditation health well-being systematic review meta-analysis Journal of Consulting Clinical Psychology"), kind: "scholar" },
      { cite: "Fredrickson, B. L., et al. (2008). Open hearts build lives: positive emotions, induced through loving-kindness meditation, build consequential personal resources. Journal of Personality and Social Psychology, 95(5), 1045–1062.", note: "A 7-week program increased daily positive emotions, which built personal resources and life satisfaction. [Moderate]", link: scholar("Fredrickson Cohn Coffey Pek Finkel 2008 open hearts build lives loving-kindness meditation Journal of Personality Social Psychology"), kind: "scholar" },
      { cite: "Hutcherson, C. A., Seppala, E. M., & Gross, J. J. (2008). Loving-kindness meditation increases social connectedness. Emotion, 8(5), 720–724.", note: "A few minutes of practice increased positivity and feelings of social connection toward strangers. [Emerging — single-session]", link: scholar("Hutcherson Seppala Gross 2008 loving-kindness meditation increases social connectedness Emotion"), kind: "scholar" },
      { cite: "Zeng, X., et al. (2015). The effect of loving-kindness meditation on positive emotions: a meta-analytic review. Frontiers in Psychology, 6, 1693.", note: "Across studies, a medium effect on daily positive emotions, larger for longer-term practice. [Moderate — meta-analysis]", link: scholar("Zeng 2015 effect of loving-kindness meditation on positive emotions meta-analytic review Frontiers in Psychology"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 68 — SELF-COMPASSION ═══════════════
  {
    id: "self-compassion", section: "68", title: "Self-Compassion",
    subtitle: "Bolsters clusters: intrapersonal, emotional, volitional (resilience)",
    evidenceTag: "Moderate",
    feeds: ["emotional regulation", "resilience/recovery from setbacks", "reduced self-criticism & rumination", "anxiety/depression buffering"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Treating yourself with kindness, common humanity, and mindful balance under difficulty — trainable via the Mindful Self-Compassion program. The correlational link to mental health is strong; intervention evidence is moderate and growing.",
    callout: "The large correlation between self-compassion and lower psychopathology is cross-sectional — it shows association, not proof that raising self-compassion causes resilience. The MSC RCT is promising but modest in scale.",
    sources: [
      { cite: "MacBeth, A., & Gumley, A. (2012). Exploring compassion: a meta-analysis of the association between self-compassion and psychopathology. Clinical Psychology Review, 32(6), 545–552.", note: "Large effect linking higher self-compassion to lower depression, anxiety, and stress across 14 studies. [Strong — for association]", link: scholar("MacBeth Gumley 2012 exploring compassion meta-analysis self-compassion psychopathology Clinical Psychology Review"), kind: "scholar" },
      { cite: "Neff, K. D., & Germer, C. K. (2013). A pilot study and randomized controlled trial of the Mindful Self-Compassion program. Journal of Clinical Psychology, 69(1), 28–44.", note: "MSC increased self-compassion, mindfulness, and well-being and reduced depression/anxiety/stress, gains held at follow-up. [Moderate — RCT]", link: scholar("Neff Germer 2013 pilot study randomized controlled trial Mindful Self-Compassion program Journal of Clinical Psychology"), kind: "scholar" },
      { cite: "Ferrari, M., et al. (2019). Self-compassion interventions and psychosocial outcomes: a meta-analysis of RCTs. Mindfulness, 10, 1455–1473.", note: "Across 27 RCTs, self-compassion interventions produced significant improvements across most psychosocial outcomes. [Moderate — meta-analysis]", link: scholar("Ferrari 2019 self-compassion interventions psychosocial outcomes meta-analysis RCTs Mindfulness"), kind: "scholar" },
      { cite: "Neff, K. D. (2003). The development and validation of a scale to measure self-compassion. Self and Identity, 2(3), 223–250.", note: "Introduces and validates the Self-Compassion Scale, the field's core measure. [Strong — measurement foundation]", link: scholar("Neff 2003 development validation scale to measure self-compassion Self and Identity"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 69 — REAPPRAISAL VS. SUPPRESSION ═══════════════
  {
    id: "reappraisal", section: "69", title: "Reappraisal vs. Suppression",
    subtitle: "Bolsters clusters: emotional, interpersonal, intrapersonal",
    evidenceTag: "Strong",
    feeds: ["emotional regulation", "social connection (suppression harms it)", "intrapersonal well-being", "memory/cognition", "stress physiology"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Two emotion-regulation strategies with divergent consequences: reframing a situation's meaning (reappraisal) generally shows healthier affective, social, and cognitive profiles; inhibiting outward expression (suppression) is costlier. Learning to reappraise is one of the most portable skills in this library.",
    callout: "The habitual reappraisal/suppression contrast is largely correlational and Western-sampled; suppression's costs are smaller or absent in some cultures, and reappraisal is not universally optimal (it can be maladaptive when a situation genuinely needs changing).",
    sources: [
      { cite: "Gross, J. J. (1998). Antecedent- and response-focused emotion regulation: divergent consequences for experience, expression, and physiology. Journal of Personality and Social Psychology, 74(1), 224–237.", note: "Reappraisal reduced emotion experience without physiological cost; suppression cut expression but raised sympathetic activation. [Strong]", link: scholar("Gross 1998 antecedent- and response-focused emotion regulation divergent consequences Journal of Personality Social Psychology"), kind: "scholar" },
      { cite: "Gross, J. J., & John, O. P. (2003). Individual differences in two emotion regulation processes: implications for affect, relationships, and well-being. Journal of Personality and Social Psychology, 85(2), 348–362.", note: "Habitual reappraisers showed more positive emotion, better relationships, and higher well-being; suppressors the reverse. [Strong]", link: scholar("Gross John 2003 individual differences two emotion regulation processes affect relationships well-being"), kind: "scholar" },
      { cite: "Webb, T. L., Miles, E., & Sheeran, P. (2012). Dealing with feeling: a meta-analysis of the effectiveness of strategies derived from the process model of emotion regulation. Psychological Bulletin, 138(4), 775–808.", note: "Reappraisal had a small-to-moderate beneficial effect; suppression's effects were weak/mixed. [Strong — meta-analysis]", link: scholar("Webb Miles Sheeran 2012 dealing with feeling meta-analysis process model emotion regulation Psychological Bulletin"), kind: "scholar" },
      { cite: "John, O. P., & Gross, J. J. (2004). Healthy and unhealthy emotion regulation: personality processes, individual differences, and life-span development. Journal of Personality, 72(6), 1301–1333.", note: "Reviews evidence framing reappraisal as generally adaptive and suppression as generally costly. [Moderate — review]", link: scholar("John Gross 2004 healthy and unhealthy emotion regulation personality processes life span Journal of Personality"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 70 — FORGIVENESS ═══════════════
  {
    id: "forgiveness", section: "70", title: "Forgiveness",
    subtitle: "Bolsters clusters: emotional, interpersonal, moral, intrapersonal",
    evidenceTag: "Moderate",
    feeds: ["emotional regulation", "relationship repair", "reduced hostility & rumination", "intrapersonal peace", "stress reduction"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Deliberately reducing resentment and revenge motivation toward a transgressor — trainable through structured models like Worthington's REACH — and linked to mental-health benefits that scale with how much you practice.",
    callout: "Forgiveness interventions reliably increase forgiveness and reduce depression/anxiety, but claims of hard physical-health outcomes (cardiovascular, longevity) rest mostly on correlational data, not trial endpoints.",
    sources: [
      { cite: "Wade, N. G., et al. (2014). Efficacy of psychotherapeutic interventions to promote forgiveness: a meta-analysis. Journal of Consulting and Clinical Psychology, 82(1), 154–170.", note: "People in explicit forgiveness treatments became more forgiving and less depressed/anxious; effects scaled with dose. [Strong — meta-analysis]", link: scholar("Wade Hoyt Kidwell Worthington 2014 efficacy psychotherapeutic interventions promote forgiveness meta-analysis"), kind: "scholar" },
      { cite: "Lundahl, B. W., et al. (2008). Process-based forgiveness interventions: a meta-analytic review. Research on Social Work Practice, 18(5), 465–478.", note: "Forgiveness interventions produced significant gains in forgiveness and reductions in depression and anxiety. [Moderate — meta-analysis]", link: scholar("Lundahl Taylor Stevenson Roberts 2008 process-based forgiveness interventions meta-analytic review"), kind: "scholar" },
      { cite: "Worthington, E. L., et al. (2007). Forgiveness, health, and well-being: a review of evidence for emotional versus decisional forgiveness, dispositional forgivingness, and reduced unforgiveness. Journal of Behavioral Medicine, 30(4), 291–302.", note: "Reviews the pathways by which unforgiveness may harm and forgiveness may benefit health. [Moderate — review]", link: scholar("Worthington Witvliet Pietrini Miller 2007 forgiveness health well-being emotional decisional Journal of Behavioral Medicine"), kind: "scholar" },
      { cite: "Toussaint, L., et al. (2016). Effects of lifetime stress exposure on mental and physical health in young adulthood: how stress degrades and forgiveness protects health. Journal of Health Psychology, 21(6), 1004–1014.", note: "Higher forgiveness buffered the association between lifetime stress and worse health. [Emerging — cross-sectional]", link: scholar("Toussaint Shields Dorn Slavich 2016 lifetime stress forgiveness protects health Journal of Health Psychology"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 71 — OPTIMISM & EXPLANATORY STYLE ═══════════════
  {
    id: "optimism", section: "71", title: "Optimism & Explanatory Style",
    subtitle: "Bolsters clusters: intrapersonal, volitional, existential",
    evidenceTag: "Moderate",
    feeds: ["coping/resilience", "stress physiology", "health behaviors & adherence", "positive emotion", "cardiovascular/immune markers (associational)"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "moderate" },
    description: "Dispositional optimism and an optimistic explanatory style are linked to better health and coping, and are partly trainable through cognitive retraining. The association evidence is strong; the effect per outcome is small but broad.",
    callout: "The mean optimism-health effect is real but small (r≈.17) and larger for subjective than objective health. Optimism is substantially dispositional, so it is only partly changeable.",
    sources: [
      { cite: "Rasmussen, H. N., Scheier, M. F., & Greenhouse, J. B. (2009). Optimism and physical health: a meta-analytic review. Annals of Behavioral Medicine, 37(3), 239–256.", note: "Across 83 studies, optimism was a significant (mean r≈.17) predictor of physical health, larger for subjective measures. [Strong — meta-analysis]", link: scholar("Rasmussen Scheier Greenhouse 2009 optimism and physical health meta-analytic review Annals of Behavioral Medicine"), kind: "scholar" },
      { cite: "Scheier, M. F., & Carver, C. S. (1985). Optimism, coping, and health: assessment and implications of generalized outcome expectancies. Health Psychology, 4(3), 219–247.", note: "Introduces dispositional optimism (the LOT) and links it to better psychological and physical adjustment. [Strong — foundational]", link: scholar("Scheier Carver 1985 optimism coping and health generalized outcome expectancies Health Psychology"), kind: "scholar" },
      { cite: "Carver, C. S., Scheier, M. F., & Segerstrom, S. C. (2010). Optimism. Clinical Psychology Review, 30(7), 879–889.", note: "Reviews evidence that optimism predicts better subjective well-being, coping, and some physical health. [Moderate — review]", link: scholar("Carver Scheier Segerstrom 2010 optimism Clinical Psychology Review"), kind: "scholar" },
      { cite: "Peterson, C., Seligman, M. E. P., & Vaillant, G. E. (1988). Pessimistic explanatory style is a risk factor for physical illness: a thirty-five-year longitudinal study. Journal of Personality and Social Psychology, 55(1), 23–27.", note: "Pessimistic explanatory style in early adulthood predicted poorer physical health decades later. [Emerging — single longitudinal cohort]", link: scholar("Peterson Seligman Vaillant 1988 pessimistic explanatory style risk factor physical illness thirty-five-year longitudinal"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 72 — SAVORING ═══════════════
  {
    id: "savoring", section: "72", title: "Savoring",
    subtitle: "Bolsters clusters: emotional, intrapersonal, aesthetic",
    evidenceTag: "Emerging",
    feeds: ["positive emotion amplification", "life satisfaction", "social connection (sharing)", "buffering against anhedonia"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Deliberately attending to, prolonging, and intensifying positive experiences — through presence, sharing, and memory-building — rather than dampening them. Mechanistically clear and pleasant to practice, with a promising but smaller trial base.",
    callout: "Much of the savoring literature is cross-sectional or short-term, and 'dampening' positive emotion (not just low savoring) drives some negative associations. Large rigorous RCTs are still relatively few.",
    sources: [
      { cite: "Quoidbach, J., et al. (2010). Positive emotion regulation and well-being: comparing the impact of eight savoring and dampening strategies. Personality and Individual Differences, 49(5), 368–373.", note: "Present-focus and positive rumination predicted higher positive affect; dampening predicted lower well-being. [Moderate — cross-sectional]", link: scholar("Quoidbach Berry Hansenne Mikolajczak 2010 positive emotion regulation well-being savoring dampening strategies"), kind: "scholar" },
      { cite: "Jose, P. E., Lim, B. T., & Bryant, F. B. (2012). Does savoring increase happiness? A daily diary study. The Journal of Positive Psychology, 7(3), 176–187.", note: "In a daily-diary design, more frequent savoring was associated with greater same-day happiness. [Emerging]", link: scholar("Jose Lim Bryant 2012 does savoring increase happiness daily diary study Journal of Positive Psychology"), kind: "scholar" },
      { cite: "Bryant, F. B. (2003). Savoring Beliefs Inventory (SBI): a scale for measuring beliefs about savouring. Journal of Mental Health, 12(2), 175–196.", note: "Develops and validates a measure of perceived capacity to savor, correlated with well-being. [Moderate — measurement]", link: scholar("Bryant 2003 Savoring Beliefs Inventory scale measuring beliefs about savouring Journal of Mental Health"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 73 — NATURE DOSE (120 MIN/WEEK) ═══════════════
  {
    id: "nature-dose", section: "73", title: "Nature Dose — 120 min/week",
    subtitle: "Bolsters clusters: emotional, meta-cognitive (attention restoration)",
    evidenceTag: "Moderate",
    feeds: ["stress reduction", "attention restoration", "general well-being", "physical-activity facilitation", "social connection"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Weekly time in natural environments is associated with better self-reported health and well-being, with a threshold around 120 minutes per week — reachable in one long visit or several short ones — plus small experimental signals that nature cuts rumination.",
    callout: "The 120-minute 'threshold' is a strong association in ~20,000 people, but the flagship study is cross-sectional and can't establish that nature causes better health (self-selection and reverse causation remain plausible).",
    sources: [
      { cite: "White, M. P., et al. (2019). Spending at least 120 minutes a week in nature is associated with good health and wellbeing. Scientific Reports, 9, 7730.", note: "≥120 min/week in nature had consistently higher odds of good health and high well-being; 1–119 min showed no benefit. [Moderate — large cross-sectional]", link: scholar("White 2019 spending at least 120 minutes a week in nature associated with good health and wellbeing Scientific Reports"), kind: "scholar" },
      { cite: "Bratman, G. N., et al. (2015). Nature experience reduces rumination and subgenual prefrontal cortex activation. PNAS, 112(28), 8567–8572.", note: "A 90-min nature walk (vs. urban) reduced self-reported rumination and the linked neural activity. [Emerging — small RCT]", link: scholar("Bratman Hamilton Hahn Daily Gross 2015 nature experience reduces rumination subgenual prefrontal cortex PNAS"), kind: "scholar" },
      { cite: "Berman, M. G., Jonides, J., & Kaplan, S. (2008). The cognitive benefits of interacting with nature. Psychological Science, 19(12), 1207–1212.", note: "Walking in nature improved attention/working-memory vs. an urban walk, supporting Attention Restoration Theory. [Emerging — experiments]", link: scholar("Berman Jonides Kaplan 2008 cognitive benefits of interacting with nature Psychological Science"), kind: "scholar" },
      { cite: "Twohig-Bennett, C., & Jones, A. (2018). The health benefits of the great outdoors: a systematic review and meta-analysis of greenspace exposure and health outcomes. Environmental Research, 166, 628–637.", note: "Greenspace exposure associated with reduced stress, lower cortisol, and better health outcomes. [Moderate — meta-analysis]", link: scholar("Twohig-Bennett Jones 2018 health benefits great outdoors systematic review meta-analysis greenspace exposure Environmental Research"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 74 — GOAL-SETTING ═══════════════
  {
    id: "goal-setting", section: "74", title: "Goal-Setting",
    subtitle: "Bolsters clusters: volitional, strategic, meta-cognitive",
    evidenceTag: "Strong",
    feeds: ["volitional capacity", "planning & prioritization", "motivation", "self-regulation"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "low" },
    description: "Specific, difficult goals reliably outperform 'do your best' — one of the most replicated findings in behavioral science. Pairing a goal with feedback and commitment is what converts it into performance.",
    callout: "The huge effects come from performance labs; isolated in real-world behavior-change RCTs, the unique goal-setting effect shrinks to 'small' (d≈0.34) — real, not magic. Difficult goals can backfire without commitment and feedback.",
    sources: [
      { cite: "Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation: a 35-year odyssey. American Psychologist, 57(9), 705–717.", note: "Specific + difficult goals reliably raise performance vs. vague goals. [Strong — foundational]", link: scholar("Locke Latham 2002 building a practically useful theory of goal setting American Psychologist"), kind: "scholar" },
      { cite: "Epton, T., Currie, S., & Armitage, C. J. (2017). Unique effects of setting goals on behavior change: systematic review and meta-analysis. Journal of Consulting and Clinical Psychology, 85(12), 1182–1198.", note: "384 effects (N=16,523): unique goal-setting effect d=0.34; bigger for difficult, public, group goals. [Strong — meta-analysis]", link: scholar("Epton Currie Armitage 2017 unique effects of setting goals on behavior change meta-analysis"), kind: "scholar" },
      { cite: "Latham, G. P., & Locke, E. A. (2006). Enhancing the benefits and overcoming the pitfalls of goal setting. Organizational Dynamics, 35(4), 332–340.", note: "Catalogs when goals help vs. harm (tunnel vision, unethical shortcuts). [Moderate]", link: scholar("Latham Locke 2006 enhancing benefits overcoming pitfalls goal setting Organizational Dynamics"), kind: "scholar" },
      { cite: "Kleingeld, A., van Mierlo, H., & Arends, L. (2011). The effect of goal setting on group performance: a meta-analysis. Journal of Applied Psychology, 96(6), 1289–1304.", note: "Specific difficult group goals raise group performance; effect varies with goal type. [Moderate — meta-analysis]", link: scholar("Kleingeld van Mierlo Arends 2011 effect of goal setting on group performance meta-analysis"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 75 — HABIT FORMATION ═══════════════
  {
    id: "habit-formation", section: "75", title: "Habit Formation",
    subtitle: "Bolsters clusters: volitional, self-regulation (offloads willpower)",
    evidenceTag: "Strong",
    feeds: ["volitional capacity", "executive function (offloads willpower)", "self-regulation", "consistency"],
    impact: { magnitude: 4, latency: "weeks", durability: "lasting", effort: "moderate" },
    description: "Habits form by repeating a response in a stable context until it runs automatically, cue-driven — which is why anchoring a new behavior to an existing routine ('habit stacking' / implementation intentions) is the best-supported mechanic for making change stick.",
    callout: "The famous '66 days' is a median with an enormous range (18–254) from one small self-report study — automaticity, not a day-count, is the target, and about half of participants never reached habit strength within it.",
    sources: [
      { cite: "Lally, P., et al. (2010). How are habits formed: modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998–1009.", note: "Automaticity rises asymptotically; median ~66 days, wide individual variation. [Moderate]", link: scholar("Lally van Jaarsveld Potts Wardle 2010 how are habits formed modelling habit formation real world"), kind: "scholar" },
      { cite: "Wood, W., & Rünger, D. (2016). Psychology of habit. Annual Review of Psychology, 67, 289–314.", note: "Authoritative review: habits are context-cued, efficient defaults distinct from goals. [Strong — review]", link: scholar("Wood Runger 2016 psychology of habit Annual Review of Psychology"), kind: "scholar" },
      { cite: "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: a meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69–119.", note: "94 tests: if-then 'when X, I'll do Y' plans had a medium-large effect (d=0.65). [Strong — meta-analysis]", link: scholar("Gollwitzer Sheeran 2006 implementation intentions and goal achievement meta-analysis"), kind: "scholar" },
      { cite: "Wood, W., Quinn, J. M., & Kashy, D. A. (2002). Habits in everyday life: thought, emotion, and action. Journal of Personality and Social Psychology, 83(6), 1281–1297.", note: "~43% of daily actions are habitual, repeated in stable contexts. [Moderate]", link: scholar("Wood Quinn Kashy 2002 habits in everyday life thought emotion and action"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 76 — AUTOMATED & INDEX INVESTING ═══════════════
  {
    id: "index-investing", section: "76", title: "Automated & Index Investing",
    subtitle: "Bolsters clusters: financial, volitional, strategic",
    evidenceTag: "Strong",
    feeds: ["financial capacity", "automate-and-forget execution", "self-regulation (curbs overtrading)"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "low" },
    description: "Low-cost, low-turnover, automated (default-enrolled) investing beats active trading for typical investors because costs and behavioral errors — not stock-picking skill — dominate net long-run returns. Set it once and let compounding work.",
    callout: "These are large real-world datasets, but observational/quasi-experimental (not randomized allocation trials). 'Index beats active' is about average net-of-cost outcomes, not a guarantee for any individual or period.",
    sources: [
      { cite: "Barber, B. M., & Odean, T. (2000). Trading is hazardous to your wealth: the common stock investment performance of individual investors. The Journal of Finance, 55(2), 773–806.", note: "Most-active traders earned 11.4% vs. 17.9% market — overtrading destroys returns. [Strong]", link: scholar("Barber Odean 2000 trading is hazardous to your wealth common stock investment performance"), kind: "scholar" },
      { cite: "French, K. R. (2008). Presidential address: the cost of active investing. The Journal of Finance, 63(4), 1537–1573.", note: "Society pays ~0.67%/yr chasing returns; passive would add ~67 bps annually. [Strong]", link: scholar("French 2008 presidential address the cost of active investing Journal of Finance"), kind: "scholar" },
      { cite: "Madrian, B. C., & Shea, D. F. (2001). The power of suggestion: inertia in 401(k) participation and savings behavior. Quarterly Journal of Economics, 116(4), 1149–1187.", note: "Auto-enrollment defaults dramatically raised participation; people stick to defaults. [Strong]", link: scholar("Madrian Shea 2001 power of suggestion inertia 401k participation savings behavior"), kind: "scholar" },
      { cite: "Benartzi, S., & Thaler, R. H. (2004). Save More Tomorrow: using behavioral economics to increase employee saving. Journal of Political Economy, 112(S1), S164–S187.", note: "Pre-committing future raises tripled saving rates over several cycles. [Strong]", link: scholar("Benartzi Thaler 2004 Save More Tomorrow behavioral economics increase employee saving"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 77 — AUTONOMY & JOB CONTROL ═══════════════
  {
    id: "autonomy-control", section: "77", title: "Autonomy & Job Control",
    subtitle: "Bolsters clusters: volitional, systemic, emotional",
    evidenceTag: "Strong",
    feeds: ["wellbeing", "cardiovascular health", "stress regulation", "autonomy/agency"],
    impact: { magnitude: 4, latency: "months", durability: "sustained", effort: "high" },
    description: "Low control and decision latitude at work predict worse cardiovascular and mental-health outcomes; higher autonomy predicts better wellbeing and satisfaction — a cornerstone of occupational-health epidemiology (the Whitehall studies).",
    callout: "The landmark Whitehall findings are observational; low control tracks tightly with low socioeconomic position, so residual confounding means 'give people more control and hearts improve' is supported by mechanism but not by large redesign RCTs. Changing it is often structural, not individual.",
    sources: [
      { cite: "Karasek, R. A. (1979). Job demands, job decision latitude, and mental strain: implications for job redesign. Administrative Science Quarterly, 24(2), 285–308.", note: "Foundational demand-control model: high demand + low control = strain. [Strong — theory]", link: scholar("Karasek 1979 job demands job decision latitude and mental strain implications for job redesign"), kind: "scholar" },
      { cite: "Bosma, H., et al. (1997). Low job control and risk of coronary heart disease in Whitehall II (prospective cohort) study. BMJ, 314(7080), 558–565.", note: "Low job control → ~1.5–1.8× higher coronary heart disease risk over follow-up. [Strong — cohort]", link: scholar("Bosma Marmot 1997 low job control and risk of coronary heart disease Whitehall II BMJ"), kind: "scholar" },
      { cite: "Kuper, H., & Marmot, M. (2003). Job strain, job demands, decision latitude, and risk of coronary heart disease within the Whitehall II study. Journal of Epidemiology & Community Health, 57(2), 147–153.", note: "Job strain and low decision latitude independently raised coronary heart disease risk. [Strong — cohort]", link: scholar("Kuper Marmot 2003 job strain job demands decision latitude coronary heart disease Whitehall II"), kind: "scholar" },
      { cite: "Humphrey, S. E., Nahrgang, J. D., & Morgeson, F. P. (2007). Integrating motivational, social, and contextual work design features: a meta-analytic summary. Journal of Applied Psychology, 92(5), 1332–1356.", note: "Meta-analysis (259 studies): autonomy predicts satisfaction, motivation, and lower strain. [Strong — meta-analysis]", link: scholar("Humphrey Nahrgang Morgeson 2007 integrating motivational social contextual work design meta-analytic"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 78 — TIME AFFLUENCE ═══════════════
  {
    id: "time-affluence", section: "78", title: "Time Affluence",
    subtitle: "Bolsters clusters: intrapersonal, emotional, strategic",
    evidenceTag: "Moderate",
    feeds: ["wellbeing", "life satisfaction", "stress reduction", "social connection"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "moderate" },
    description: "Feeling time-rich — and spending money to buy time or on experiences rather than things — is associated with, and in experiments causes, greater happiness. A rare case where money reliably converts to wellbeing if spent the right way.",
    callout: "The experiential-vs-material and buying-time effects are robust but modest, samples skew Western/affluent, and the money-to-happiness link is strongest for people not already financially strained.",
    sources: [
      { cite: "Whillans, A. V., et al. (2017). Buying time promotes happiness. PNAS, 114(32), 8523–8527.", note: "Field experiment: time-saving purchases raised happiness more than material ones. [Moderate — experiment]", link: scholar("Whillans Dunn Smeets Bekkers Norton 2017 buying time promotes happiness PNAS"), kind: "scholar" },
      { cite: "Van Boven, L., & Gilovich, T. (2003). To do or to have? That is the question. Journal of Personality and Social Psychology, 85(6), 1193–1202.", note: "Experiential purchases make people happier than material purchases. [Moderate]", link: scholar("Van Boven Gilovich 2003 to do or to have that is the question experiential material"), kind: "scholar" },
      { cite: "Whillans, A. V., Weidman, A. C., & Dunn, E. W. (2016). Valuing time over money is associated with greater happiness. Social Psychological and Personality Science, 7(3), 213–222.", note: "Prioritizing time over money correlates with higher subjective wellbeing. [Moderate]", link: scholar("Whillans Weidman Dunn 2016 valuing time over money associated with greater happiness"), kind: "scholar" },
      { cite: "Kumar, A., Killingsworth, M. A., & Gilovich, T. (2014). Waiting for merlot: anticipatory consumption of experiential and material purchases. Psychological Science, 25(10), 1924–1931.", note: "People derive more pleasurable anticipation from awaiting experiences than goods. [Emerging]", link: scholar("Kumar Killingsworth Gilovich 2014 waiting for merlot anticipatory consumption experiential material"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 79 — SLEEP REGULARITY ═══════════════
  {
    id: "sleep-regularity", section: "79", title: "Sleep Regularity",
    subtitle: "Bolsters clusters: systemic, interoceptive (complements Section 14)",
    evidenceTag: "Strong",
    feeds: ["physical health", "executive function", "wellbeing", "circadian regulation"],
    impact: { magnitude: 4, latency: "days", durability: "lasting", effort: "moderate" },
    description: "Regular sleep-wake timing — not just total hours — predicts health and mortality, and behavioral programs (CBT-I) durably improve chronic insomnia. Consistency of timing may matter as much as duration.",
    callout: "The regularity-mortality data are large but observational, and generic single-component 'sleep hygiene' tips are weak as a standalone treatment — CBT-I is the evidence-based intervention, not sleep-hygiene handouts.",
    sources: [
      { cite: "Windred, D. P., et al. (2024). Sleep regularity is a stronger predictor of mortality risk than sleep duration: a prospective cohort study. Sleep, 47(1), zsad253.", note: "Higher sleep-regularity index → 20–48% lower all-cause mortality; beat duration. [Strong — observational]", link: scholar("Windred 2024 sleep regularity stronger predictor of mortality risk than sleep duration UK Biobank"), kind: "scholar" },
      { cite: "Trauer, J. M., et al. (2015). Cognitive behavioral therapy for chronic insomnia: a systematic review and meta-analysis. Annals of Internal Medicine, 163(3), 191–204.", note: "Meta-analysis (20 RCTs): CBT-I produces clinically meaningful, durable insomnia improvement. [Strong — meta-analysis]", link: scholar("Trauer Qian Doyle 2015 cognitive behavioral therapy for chronic insomnia systematic review meta-analysis"), kind: "scholar" },
      { cite: "Full, K. M., et al. (2023). Sleep irregularity and subclinical markers of cardiovascular disease: the Multi-Ethnic Study of Atherosclerosis. Journal of the American Heart Association, 12(4), e027361.", note: "Irregular sleep timing associated with greater subclinical cardiovascular disease. [Moderate — cohort]", link: scholar("Full Huang 2023 sleep irregularity subclinical cardiovascular disease MESA Journal American Heart Association"), kind: "scholar" },
      { cite: "Irish, L. A., et al. (2015). The role of sleep hygiene in promoting public health: a review of empirical evidence. Sleep Medicine Reviews, 22, 23–36.", note: "Individual sleep-hygiene components have mixed/limited standalone empirical support. [Mixed — review]", link: scholar("Irish Kline Gunn Buysse Hall 2015 role of sleep hygiene in promoting public health review"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 80 — LAUGHTER & HUMOR ═══════════════
  {
    id: "laughter", section: "80", title: "Laughter & Humor",
    subtitle: "Bolsters clusters: humor, emotional, interpersonal",
    evidenceTag: "Emerging",
    feeds: ["wellbeing", "stress reduction", "social connection/bonding", "mood regulation"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Genuine, spontaneous laughter lowers cortisol, raises pain threshold via endorphins, and shifts autonomic and mood state — mostly short-lived, social-bonding effects with promising but methodologically limited cardiovascular data.",
    callout: "Most studies are small and short-term with heterogeneous 'laughter interventions' (laughter yoga, comedy clips); the stress-hormone effects are real but acute and transient, and hard cardiovascular endpoints are not established.",
    sources: [
      { cite: "Dunbar, R. I. M., et al. (2012). Social laughter is correlated with an elevated pain threshold. Proceedings of the Royal Society B, 279(1731), 1161–1167.", note: "Six studies: shared laughter raises pain threshold, implicating endorphin release. [Moderate]", link: scholar("Dunbar 2012 social laughter is correlated with an elevated pain threshold Proceedings Royal Society B"), kind: "scholar" },
      { cite: "Kramer, C. K., & Leitao, C. B. (2023). Laughter as medicine: a systematic review and meta-analysis of interventional studies evaluating the impact of spontaneous laughter on cortisol levels. PLOS ONE, 18(5), e0286260.", note: "Meta-analysis: spontaneous laughter reduced cortisol ~32% (single session ~37%). [Moderate — meta-analysis]", link: scholar("Kramer Leitao 2023 laughter as medicine systematic review meta-analysis spontaneous laughter cortisol"), kind: "scholar" },
      { cite: "Sakuragi, S., Sugiyama, Y., & Takeuchi, K. (2002). Effects of laughing and weeping on mood and heart rate variability. Journal of Physiological Anthropology and Applied Human Science, 21(3), 159–165.", note: "Laughter produced strong but transient favorable autonomic/mood shifts. [Emerging]", link: scholar("Sakuragi Sugiyama Takeuchi 2002 effects of laughing and weeping on mood and heart rate variability"), kind: "scholar" },
      { cite: "Berk, L. S., et al. (1989). Neuroendocrine and stress hormone changes during mirthful laughter. American Journal of the Medical Sciences, 298(6), 390–396.", note: "Mirthful laughter lowered cortisol and other stress hormones (very small sample). [Emerging]", link: scholar("Berk Tan Fry 1989 neuroendocrine and stress hormone changes during mirthful laughter"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 81 — LEARNING BY TEACHING ═══════════════
  {
    id: "learning-by-teaching", section: "81", title: "Learning by Teaching",
    subtitle: "Bolsters clusters: linguistic, meta-cognitive, most skill lines",
    evidenceTag: "Strong",
    feeds: ["learning capacity", "executive function", "long-term memory/consolidation", "metacognition"],
    impact: { magnitude: 3, latency: "days", durability: "lasting", effort: "moderate" },
    description: "Expecting to teach — and actually teaching by retrieving from memory — improves learning. The durable engine is well-established retrieval-practice and spacing (the science behind flashcard/spaced-repetition apps); teaching helps mainly when it forces retrieval.",
    callout: "The 'protégé effect' is real but smaller and more variable; controlled studies show teaching helps mainly when it forces retrieval (teaching from notes adds little). The reliable levers are retrieval + spacing, not teaching per se.",
    sources: [
      { cite: "Nestojko, J. F., et al. (2014). Expecting to teach enhances learning and organization of knowledge in free recall of text passages. Memory & Cognition, 42(7), 1038–1048.", note: "Merely expecting to teach improved recall and knowledge organization. [Moderate]", link: scholar("Nestojko Bui Kornell Bjork 2014 expecting to teach enhances learning and organization free recall"), kind: "scholar" },
      { cite: "Koh, A. W. L., Lee, S. C., & Lim, S. W. H. (2018). The learning benefits of teaching: a retrieval practice hypothesis. Applied Cognitive Psychology, 32(3), 401–410.", note: "Teaching's benefit came from retrieval; teaching-with-notes added little. [Moderate]", link: scholar("Koh Lee Lim 2018 the learning benefits of teaching a retrieval practice hypothesis"), kind: "scholar" },
      { cite: "Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.", note: "Retrieval practice beats restudy for long-term retention. [Strong]", link: scholar("Roediger Karpicke 2006 test-enhanced learning taking memory tests improves long-term retention"), kind: "scholar" },
      { cite: "Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.", note: "Meta-analysis: spaced practice reliably outperforms massed practice. [Strong — meta-analysis]", link: scholar("Cepeda Pashler Vul Wixted Rohrer 2006 distributed practice in verbal recall tasks review quantitative synthesis"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 82 — EMDR ═══════════════
  {
    id: "emdr", section: "82", title: "EMDR", subtitle: "Bolsters clusters: emotional regulation, trauma recovery",
    evidenceTag: "Strong",
    feeds: ["PTSD/trauma relief", "intrusive-memory & hyperarousal reduction", "emotional regulation", "fear extinction"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Structured trauma-focused therapy pairing recall of traumatic memories with bilateral eye movements. Strongly effective for PTSD — though the eye-movement component itself may add little beyond the exposure it contains.",
    callout: "The eponymous eye movements are the weakest-supported ingredient: dismantling studies repeatedly find no incremental benefit over the same procedure without them. EMDR likely works via its exposure and cognitive-processing elements.",
    sources: [
      { cite: "Bisson, J. I., et al. (2013). Psychological therapies for chronic post-traumatic stress disorder (PTSD) in adults. Cochrane Database of Systematic Reviews, (12), CD003388.", note: "Trauma-focused CBT and EMDR both effective and superior to non-trauma-focused therapies. [Strong — Cochrane]", link: scholar("Bisson 2013 psychological therapies chronic PTSD adults Cochrane CD003388"), kind: "scholar" },
      { cite: "Davidson, P. R., & Parker, K. C. H. (2001). Eye movement desensitization and reprocessing (EMDR): a meta-analysis. Journal of Consulting and Clinical Psychology, 69(2), 305–316.", note: "EMDR beat no-treatment and non-exposure therapies — but showed no advantage over other exposure techniques, and no incremental effect from the eye movements. [Strong]", link: scholar("Davidson Parker 2001 EMDR meta-analysis Journal Consulting Clinical Psychology 305"), kind: "scholar" },
      { cite: "Seidler, G. H., & Wagner, F. E. (2006). Comparing the efficacy of EMDR and trauma-focused cognitive-behavioral therapy in the treatment of PTSD: a meta-analytic study. Psychological Medicine, 36(11), 1515–1522.", note: "EMDR and trauma-focused CBT produced statistically equivalent PTSD outcomes. [Moderate — meta-analysis]", link: scholar("Seidler Wagner 2006 EMDR trauma-focused CBT PTSD meta-analysis Psychological Medicine"), kind: "scholar" },
      { cite: "Bradley, R., et al. (2005). A multidimensional meta-analysis of psychotherapy for PTSD. American Journal of Psychiatry, 162(2), 214–227.", note: "Both EMDR and exposure/CBT yielded large PTSD effect sizes. [Moderate — meta-analysis]", link: scholar("Bradley 2005 multidimensional meta-analysis psychotherapy PTSD American Journal Psychiatry"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 83 — CLINICAL & ERICKSONIAN HYPNOSIS ═══════════════
  {
    id: "hypnosis", section: "83", title: "Clinical & Ericksonian Hypnosis", subtitle: "Bolsters clusters: pain modulation, interoceptive, emotional",
    evidenceTag: "Moderate",
    feeds: ["acute & chronic pain relief", "IBS/gut-brain symptom relief", "procedural anxiety reduction", "adjunct to CBT"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "low" },
    description: "Guided attentional-absorption and suggestion used adjunctively for pain, IBS, and procedural distress. Solid evidence for analgesia and gut-directed IBS work; weaker and more variable elsewhere.",
    callout: "Response depends heavily on individual hypnotic suggestibility, which is largely trait-like — high-suggestible people benefit substantially while low-suggestible people may gain little, so average effects hide large between-person variance.",
    sources: [
      { cite: "Montgomery, G. H., DuHamel, K. N., & Redd, W. H. (2000). A meta-analysis of hypnotically induced analgesia: how effective is hypnosis? International Journal of Clinical and Experimental Hypnosis, 48(2), 138–153.", note: "Across 18 studies, a moderate-to-large analgesic effect; greater for high-suggestible individuals. [Moderate — meta-analysis]", link: scholar("Montgomery DuHamel Redd 2000 meta-analysis hypnotically induced analgesia"), kind: "scholar" },
      { cite: "Schaefert, R., et al. (2014). Efficacy, tolerability, and safety of hypnosis in adult irritable bowel syndrome: systematic review and meta-analysis. Psychosomatic Medicine, 76(5), 389–398.", note: "Gut-directed hypnosis superior to controls for IBS at end of therapy and at long-term follow-up. [Moderate — meta-analysis]", link: scholar("Schaefert 2014 hypnosis irritable bowel syndrome meta-analysis Psychosomatic Medicine"), kind: "scholar" },
      { cite: "Montgomery, G. H., et al. (2007). A randomized clinical trial of a brief hypnosis intervention to control side effects in breast surgery patients. Journal of the National Cancer Institute, 99(17), 1304–1312.", note: "Presurgical hypnosis reduced pain, nausea, fatigue vs. attention control. [Moderate — RCT]", link: scholar("Montgomery 2007 hypnosis breast surgery randomized trial Journal National Cancer Institute"), kind: "scholar" },
      { cite: "Adachi, T., et al. (2014). A meta-analysis of hypnosis for chronic pain problems. International Journal of Clinical and Experimental Hypnosis, 62(1), 1–28.", note: "Hypnosis outperformed standard care for chronic pain but was roughly equivalent to other psychological interventions. [Moderate — meta-analysis]", link: scholar("Adachi 2014 meta-analysis hypnosis chronic pain International Journal Clinical Experimental Hypnosis"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 84 — CBT ═══════════════
  {
    id: "cbt", section: "84", title: "Cognitive Behavioral Therapy (CBT)", subtitle: "Bolsters clusters: emotional, meta-cognitive, most mental-health lines",
    evidenceTag: "Strong",
    feeds: ["depression relief", "anxiety/panic/PTSD relief", "cognitive reappraisal", "relapse prevention"],
    impact: { magnitude: 5, latency: "weeks", durability: "lasting", effort: "moderate" },
    description: "Structured, present-focused therapy targeting maladaptive cognitions and behaviors — the most extensively validated psychotherapy across anxiety, depression, and many disorders, with durable relapse protection.",
    callout: "Breadth is real but uneven: effects are largest for anxiety and weakest/mixed for conditions like chronic psychosis, and some depression meta-analyses show effect sizes shrinking once publication bias and low-quality trials are removed.",
    sources: [
      { cite: "Hofmann, S. G., et al. (2012). The efficacy of cognitive behavioral therapy: a review of meta-analyses. Cognitive Therapy and Research, 36(5), 427–440.", note: "Reviewing 106 meta-analyses, strongest support for CBT in anxiety, somatoform disorders, bulimia, anger, and stress. [Strong]", link: scholar("Hofmann Asnaani 2012 efficacy cognitive behavioral therapy review meta-analyses Cognitive Therapy Research"), kind: "scholar" },
      { cite: "Butler, A. C., et al. (2006). The empirical status of cognitive-behavioral therapy: a review of meta-analyses. Clinical Psychology Review, 26(1), 17–31.", note: "Large effect sizes for CBT in depression, GAD, panic, social phobia, PTSD. [Strong]", link: scholar("Butler Chapman Forman Beck 2006 empirical status cognitive-behavioral therapy meta-analyses"), kind: "scholar" },
      { cite: "Cuijpers, P., et al. (2016). How effective are cognitive behavior therapies for major depression and anxiety disorders? A meta-analytic update. World Psychiatry, 15(3), 245–258.", note: "Confirms CBT efficacy but shows depression effect sizes are inflated by low-quality trials and publication bias. [Strong — honest corrective]", link: scholar("Cuijpers 2016 how effective cognitive behavior therapies depression anxiety World Psychiatry"), kind: "scholar" },
      { cite: "Cuijpers, P., et al. (2008). Psychotherapy for depression in adults: a meta-analysis of comparative outcome studies. Journal of Consulting and Clinical Psychology, 76(6), 909–922.", note: "CBT and other bona fide psychotherapies for depression broadly comparable; no single approach clearly superior. [Strong]", link: scholar("Cuijpers 2008 psychotherapy depression adults meta-analysis comparative outcome Journal Consulting Clinical Psychology"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 85 — BEHAVIORAL ACTIVATION ═══════════════
  {
    id: "behavioral-activation", section: "85", title: "Behavioral Activation", subtitle: "Bolsters clusters: volitional, emotional (depression)",
    evidenceTag: "Strong",
    feeds: ["depression relief", "behavioral-avoidance reduction", "activity/reward engagement", "low-barrier delivery"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "low" },
    description: "A behavioral treatment that increases contact with rewarding activities and reduces avoidance — as effective as full CBT for depression, and simpler to deliver.",
    callout: "Trials are often small and of modest quality, and long-term follow-up data are thinner than the strong short-term effect sizes suggest.",
    sources: [
      { cite: "Cuijpers, P., van Straten, A., & Warmerdam, L. (2007). Behavioral activation treatments of depression: a meta-analysis. Clinical Psychology Review, 27(3), 318–326.", note: "Across 16 studies, a large effect (d≈0.87), at least as effective as cognitive therapy. [Strong — meta-analysis]", link: scholar("Cuijpers van Straten Warmerdam 2007 behavioral activation treatments depression meta-analysis"), kind: "scholar" },
      { cite: "Ekers, D., et al. (2014). Behavioural activation for depression: an update of meta-analysis of effectiveness and sub-group analysis. PLoS ONE, 9(6), e100100.", note: "26 RCTs: BA superior to controls (SMD −0.74) and to medication (SMD −0.42). [Strong — meta-analysis]", link: scholar("Ekers Webster 2014 behavioural activation depression update meta-analysis PLoS ONE 100100"), kind: "scholar" },
      { cite: "Dimidjian, S., et al. (2006). Randomized trial of behavioral activation, cognitive therapy, and antidepressant medication in the acute treatment of adults with major depression. Journal of Consulting and Clinical Psychology, 74(4), 658–670.", note: "In more severely depressed patients, BA performed comparably to antidepressant medication. [Strong — RCT]", link: scholar("Dimidjian 2006 randomized trial behavioral activation cognitive therapy antidepressant major depression"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 86 — ACT ═══════════════
  {
    id: "act", section: "86", title: "Acceptance & Commitment Therapy (ACT)", subtitle: "Bolsters clusters: emotional, intrapersonal, existential",
    evidenceTag: "Moderate",
    feeds: ["depression/anxiety relief", "chronic-pain coping", "psychological flexibility", "values clarification"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "A third-wave therapy building psychological flexibility through acceptance, mindfulness, and values-based action — efficacious across mental and physical health problems, roughly on par with established treatments.",
    callout: "ACT reliably beats waitlist/no-treatment but rarely shows superiority over established CBT, and early trials suffered from weak controls and researcher-allegiance effects. Its distinct advantage over standard CBT remains unproven.",
    sources: [
      { cite: "A-Tjak, J. G. L., et al. (2015). A meta-analysis of the efficacy of acceptance and commitment therapy for clinically relevant mental and physical health problems. Psychotherapy and Psychosomatics, 84(1), 30–36.", note: "39 RCTs (n=1,821): ACT efficacious across anxiety, depression, addiction, somatic problems; comparable to established interventions. [Moderate — meta-analysis]", link: scholar("A-Tjak Davis 2015 meta-analysis efficacy acceptance commitment therapy Psychotherapy Psychosomatics"), kind: "scholar" },
      { cite: "Öst, L-G. (2014). The efficacy of acceptance and commitment therapy: an updated systematic review and meta-analysis. Behaviour Research and Therapy, 61, 105–121.", note: "Critical review: ACT trials methodologically weaker than CBT trials and not yet 'well-established.' [Moderate — skeptical corrective]", link: scholar("Ost 2014 efficacy acceptance commitment therapy updated systematic review meta-analysis Behaviour Research Therapy"), kind: "scholar" },
      { cite: "Hughes, L. S., et al. (2017). Acceptance and commitment therapy (ACT) for chronic pain: a systematic review and meta-analyses. Clinical Journal of Pain, 33(6), 552–568.", note: "Small-to-moderate improvements in chronic-pain functioning and distress. [Moderate — meta-analysis]", link: scholar("Hughes 2017 acceptance commitment therapy chronic pain systematic review meta-analyses Clinical Journal Pain"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 87 — EXPOSURE THERAPY ═══════════════
  {
    id: "exposure", section: "87", title: "Exposure Therapy", subtitle: "Bolsters clusters: emotional, volitional (anxiety/fear)",
    evidenceTag: "Strong",
    feeds: ["phobia/panic/social-anxiety/OCD relief", "fear extinction & inhibitory learning", "avoidance reduction", "self-efficacy"],
    impact: { magnitude: 5, latency: "weeks", durability: "lasting", effort: "high" },
    description: "Systematic, repeated confrontation with feared stimuli to extinguish avoidance — the most potent evidence-based treatment for phobias, panic, social anxiety, and OCD.",
    callout: "Return of fear after treatment is common, which shifted the field from a fear-habituation rationale to an inhibitory-learning model — exposure design (expectancy violation, variability, retrieval cues) matters more than simply staying until anxiety drops.",
    sources: [
      { cite: "Wolitzky-Taylor, K. B., et al. (2008). Psychological approaches in the treatment of specific phobias: a meta-analysis. Clinical Psychology Review, 28(6), 1021–1037.", note: "33 studies: exposure-based treatment yielded large effects, outperforming placebo and non-exposure therapies. [Strong — meta-analysis]", link: scholar("Wolitzky-Taylor Horowitz Powers Telch 2008 psychological approaches specific phobias meta-analysis"), kind: "scholar" },
      { cite: "Craske, M. G., et al. (2014). Maximizing exposure therapy: an inhibitory learning approach. Behaviour Research and Therapy, 58, 10–23.", note: "Reframes exposure around inhibitory learning rather than within-session habituation. [Strong — influential model]", link: scholar("Craske Treanor 2014 maximizing exposure therapy inhibitory learning approach Behaviour Research Therapy"), kind: "scholar" },
      { cite: "Powers, M. B., et al. (2010). A meta-analytic review of prolonged exposure for posttraumatic stress disorder. Clinical Psychology Review, 30(6), 635–641.", note: "Prolonged exposure produced large effects for PTSD; treated patients better off than ~86% of controls. [Strong — meta-analysis]", link: scholar("Powers Halpern Foa 2010 meta-analytic review prolonged exposure posttraumatic stress disorder"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 88 — DBT SKILLS ═══════════════
  {
    id: "dbt", section: "88", title: "Dialectical Behavior Therapy (DBT) Skills", subtitle: "Bolsters clusters: emotional regulation, volitional, interpersonal",
    evidenceTag: "Strong",
    feeds: ["emotion regulation", "distress tolerance", "self-harm/suicidality reduction", "interpersonal effectiveness"],
    impact: { magnitude: 4, latency: "months", durability: "sustained", effort: "high" },
    description: "Combines CBT with mindfulness and dialectics to teach emotion regulation, distress tolerance, and interpersonal effectiveness — the frontline treatment for borderline personality disorder and self-harm.",
    callout: "Strongest evidence is for reducing self-harm and suicidal behavior in BPD; effects on depression and other populations are more modest, and much foundational evidence comes from Linehan's own group — independent replication matters.",
    sources: [
      { cite: "Linehan, M. M., et al. (1991). Cognitive-behavioral treatment of chronically parasuicidal borderline patients. Archives of General Psychiatry, 48(12), 1060–1064.", note: "Foundational RCT: DBT reduced parasuicidal acts, dropout, and inpatient days vs. treatment as usual. [Strong — landmark RCT]", link: scholar("Linehan Armstrong 1991 cognitive-behavioral treatment chronically parasuicidal borderline Archives General Psychiatry"), kind: "scholar" },
      { cite: "Kliem, S., Kröger, C., & Kosfelder, J. (2010). Dialectical behavior therapy for borderline personality disorder: a meta-analysis using mixed-effects modeling. Journal of Consulting and Clinical Psychology, 78(6), 936–951.", note: "16 studies: moderate global effect and reduced suicidal/self-injurious behavior. [Strong — meta-analysis]", link: scholar("Kliem Kroger Kosfelder 2010 dialectical behavior therapy borderline meta-analysis mixed-effects"), kind: "scholar" },
      { cite: "Linehan, M. M., et al. (2015). Dialectical behavior therapy for high suicide risk in individuals with borderline personality disorder: a randomized clinical trial and component analysis. JAMA Psychiatry, 72(5), 475–482.", note: "Component analysis showed the skills-training element contributed substantially to reductions in self-harm. [Strong — RCT]", link: scholar("Linehan Korslund Harned 2015 dialectical behavior therapy high suicide risk borderline JAMA Psychiatry component analysis"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 89 — MOTIVATIONAL INTERVIEWING ═══════════════
  {
    id: "motivational-interviewing", section: "89", title: "Motivational Interviewing", subtitle: "Bolsters clusters: volitional, interpersonal, emotional",
    evidenceTag: "Moderate",
    feeds: ["substance-use reduction", "health-behavior change", "treatment engagement/retention", "ambivalence resolution"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "low" },
    description: "A collaborative, client-centered method for strengthening intrinsic motivation and resolving ambivalence — small-but-reliable effects, especially as a brief add-on for substance use and health behaviors.",
    callout: "Effects are genuine but generally small and inconsistent — MI beats weak/no-treatment controls but shows little advantage over other active treatments, and outcomes vary by target behavior, fidelity, and dose.",
    sources: [
      { cite: "Lundahl, B., et al. (2010). A meta-analysis of motivational interviewing: twenty-five years of empirical studies. Research on Social Work Practice, 20(2), 137–160.", note: "119 studies: small but durable effects vs. weak controls (g≈0.28); non-significant vs. specific active treatments. [Moderate — meta-analysis]", link: scholar("Lundahl Burke 2010 meta-analysis motivational interviewing twenty-five years empirical studies"), kind: "scholar" },
      { cite: "Rubak, S., et al. (2005). Motivational interviewing: a systematic review and meta-analysis. British Journal of General Practice, 55(513), 305–312.", note: "Across 72 RCTs, MI outperformed traditional advice on ~80% of outcomes incl. BMI, cholesterol, BP. [Moderate — meta-analysis]", link: scholar("Rubak Sandbaek 2005 motivational interviewing systematic review meta-analysis British Journal General Practice"), kind: "scholar" },
      { cite: "Magill, M., et al. (2014). The technical hypothesis of motivational interviewing: a meta-analysis of MI's key causal model. Journal of Consulting and Clinical Psychology, 82(6), 973–983.", note: "Supports the mechanism — client 'change talk' predicts better outcomes, 'sustain talk' worse. [Moderate — meta-analysis]", link: scholar("Magill Gaume Apodaca 2014 technical hypothesis motivational interviewing meta-analysis causal model"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 90 — PSYCHODYNAMIC & INTERPERSONAL THERAPY ═══════════════
  {
    id: "psychodynamic-ipt", section: "90", title: "Psychodynamic & Interpersonal Therapy", subtitle: "Bolsters clusters: intrapersonal, interpersonal, emotional",
    evidenceTag: "Moderate",
    feeds: ["depression relief", "interpersonal-functioning improvement", "insight & self-understanding", "relapse prevention"],
    impact: { magnitude: 4, latency: "weeks", durability: "lasting", effort: "moderate" },
    description: "Psychodynamic therapy targets unconscious conflict and relational patterns; interpersonal therapy (IPT) targets current interpersonal roles. Both have real efficacy evidence, especially for depression, with gains often growing after treatment ends.",
    callout: "Short-term psychodynamic evidence is reasonably solid, but claims for long-term psychodynamic therapy rest on a small, heterogeneous set of studies — one prominent JAMA meta-analysis was later challenged for a statistical error.",
    sources: [
      { cite: "Cuijpers, P., et al. (2011). Interpersonal psychotherapy for depression: a meta-analysis. American Journal of Psychiatry, 168(6), 581–592.", note: "38 studies: IPT more effective than controls (NNT<3), comparable to other psychotherapies, useful in maintenance. [Strong — meta-analysis]", link: scholar("Cuijpers Geraedts 2011 interpersonal psychotherapy depression meta-analysis American Journal Psychiatry"), kind: "scholar" },
      { cite: "Shedler, J. (2010). The efficacy of psychodynamic psychotherapy. American Psychologist, 65(2), 98–109.", note: "Effect sizes as large as those for 'empirically supported' treatments, with gains often continuing after treatment. [Moderate — review]", link: scholar("Shedler 2010 efficacy psychodynamic psychotherapy American Psychologist"), kind: "scholar" },
      { cite: "Driessen, E., et al. (2015). The efficacy of short-term psychodynamic psychotherapy for depression: a meta-analysis update. Clinical Psychology Review, 42, 1–15.", note: "Short-term psychodynamic therapy efficacious for depression, broadly comparable to other therapies at follow-up. [Moderate — meta-analysis]", link: scholar("Driessen Abbass 2015 efficacy short-term psychodynamic psychotherapy depression meta-analysis update Clinical Psychology Review"), kind: "scholar" },
      { cite: "Leichsenring, F., & Rabung, S. (2008). Effectiveness of long-term psychodynamic psychotherapy: a meta-analysis. JAMA, 300(13), 1551–1565.", note: "Reported large effects for complex disorders — but later criticized for an effect-size calculation error; cite with caution. [Mixed]", link: scholar("Leichsenring Rabung 2008 effectiveness long-term psychodynamic psychotherapy meta-analysis JAMA"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 91 — SUPPORT GROUPS & GROUP THERAPY ═══════════════
  {
    id: "group-therapy", section: "91", title: "Support Groups & Group Therapy", subtitle: "Bolsters clusters: interpersonal, emotional, existential",
    evidenceTag: "Moderate",
    feeds: ["depression/anxiety relief", "social connection & reduced isolation", "universality/normalization", "cost-efficient reach"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Structured group treatment and peer support harnessing shared experience, universality, and mutual feedback — group psychotherapy is broadly as effective as individual therapy, and peer support adds modest benefits for severe mental illness.",
    callout: "Group and individual therapy show roughly equivalent outcomes, but peer-support evidence is weaker and inconsistent — effects on clinical symptoms (vs. hope/empowerment) are small and uncertain.",
    sources: [
      { cite: "Burlingame, G. M., et al. (2016). Outcome differences between individual and group formats when identical and nonidentical treatments, patients, and doses are compared: a 25-year meta-analytic perspective. Psychotherapy, 53(4), 446–461.", note: "Group and individual therapy produced statistically equivalent outcomes across disorders. [Strong — meta-analysis]", link: scholar("Burlingame Seebeck Strauss 2016 outcome differences individual group formats 25-year meta-analytic Psychotherapy"), kind: "scholar" },
      { cite: "McRoberts, C., Burlingame, G. M., & Hoag, M. J. (1998). Comparative efficacy of individual and group psychotherapy: a meta-analytic perspective. Group Dynamics, 2(2), 101–117.", note: "No significant overall difference in efficacy between individual and group formats. [Moderate — meta-analysis]", link: scholar("McRoberts Burlingame Hoag 1998 comparative efficacy individual group psychotherapy meta-analytic Group Dynamics"), kind: "scholar" },
      { cite: "Lloyd-Evans, B., et al. (2014). A systematic review and meta-analysis of randomised controlled trials of peer support for people with severe mental illness. BMC Psychiatry, 14, 39.", note: "Some benefit for hope, empowerment, recovery, but little consistent effect on clinical symptoms; evidence quality low. [Emerging]", link: scholar("Lloyd-Evans Mayo-Wilson 2014 systematic review meta-analysis peer support severe mental illness BMC Psychiatry"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 92 — NLP: THE HONEST VERDICT ═══════════════
  {
    id: "nlp-verdict", section: "92", title: "NLP — The Honest Verdict", subtitle: "The branded model is not empirically supported",
    evidenceTag: "Mixed",
    feeds: ["little validated NLP-specific effect — real benefit belongs to alliance, reappraisal & goal-setting"],
    impact: { magnitude: 1, latency: "months", durability: "transient", effort: "high" },
    description: "Neuro-Linguistic Programming as a branded Bandler/Grinder model. We include it because honesty demands it: systematic reviews find it lacks empirical support and is widely classed as pseudoscience. Any apparent benefit is attributable to generic, already-validated ingredients — therapeutic alliance, expectancy, goal-setting — not to NLP-specific theory.",
    callout: "The NLP brand fails independent replication; reviews explicitly call it 'pseudoscientific decoration' and advise against spending clinical resources on it. Where its techniques help, credit the validated cousin (reframing → cognitive reappraisal, Section 69; rapport → therapeutic alliance; well-formed outcomes → goal-setting, Section 74) — not 'NLP.'",
    sources: [
      { cite: "Witkowski, T. (2010). Thirty-five years of research on neuro-linguistic programming. NLP research data base. State of the art or pseudoscientific decoration? Polish Psychological Bulletin, 41(2), 58–66.", note: "Of 63 ISI-listed studies, supportive results were a small minority; the corpus was judged pseudoscientific. [Strong — critical review]", link: scholar("Witkowski Thirty-Five Years Research Neuro-Linguistic Programming Polish Psychological Bulletin 2010"), kind: "scholar" },
      { cite: "Sturt, J., et al. (2012). Neurolinguistic programming: a systematic review of the effects on health outcomes. British Journal of General Practice, 62(604), e757–e764.", note: "10 studies (5 RCTs): little evidence NLP improves health outcomes; insufficient to justify NHS resourcing. [Strong — systematic review]", link: scholar("Sturt neurolinguistic programming systematic review health outcomes British Journal General Practice 2012"), kind: "scholar" },
      { cite: "Passmore, J., & Rowson, T. S. (2019). Neuro-linguistic programming: a critical review of NLP research and the application of NLP in coaching. International Coaching Psychology Review, 14(1), 57–69.", note: "Unique NLP practices poorly supported; advises ignoring the NLP brand in favor of evidence-based models. [Moderate — critical review]", link: scholar("Passmore Rowson 2019 neuro-linguistic programming critical review coaching International Coaching Psychology Review"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 93 — NLP META-PROGRAMS & MODALITY MATCHING ═══════════════
  {
    id: "nlp-metaprograms", section: "93", title: "NLP Meta-Programs & Modality Matching", subtitle: "The 'match their VAK style' hypothesis fails controlled tests",
    evidenceTag: "Mixed",
    feeds: ["modality-matching not supported — multimodal presentation helps everyone, which is different"],
    impact: { magnitude: 1, latency: "months", durability: "transient", effort: "high" },
    description: "The NLP claim that people have a 'preferred representational system' (visual/auditory/kinesthetic) and that matching it improves communication or learning. This is the same idea as educational 'learning styles' — and the meshing hypothesis has essentially no rigorous support despite decades of testing.",
    callout: "Diagnosing a modality and tailoring input to it does not reliably improve outcomes. The learning-styles meshing hypothesis is specifically refuted; don't spend assessment overhead on it.",
    sources: [
      { cite: "Pashler, H., McDaniel, M., Rohrer, D., & Bjork, R. (2008). Learning styles: concepts and evidence. Psychological Science in the Public Interest, 9(3), 105–119.", note: "Almost no studies use the design needed to test meshing; those that do contradict it. [Strong — evidence review]", link: scholar("Pashler McDaniel Rohrer Bjork 2008 Learning Styles Concepts and Evidence"), kind: "scholar" },
      { cite: "Rogowsky, B. A., Calhoun, B. M., & Tallal, P. (2015). Matching learning style to instructional method: effects on comprehension. Journal of Educational Psychology, 107(1), 64–78.", note: "No statistically significant interaction between learning-style preference and instructional modality. [Strong — controlled test]", link: scholar("Rogowsky Calhoun Tallal 2015 matching learning style instructional method Journal Educational Psychology"), kind: "scholar" },
      { cite: "Witkowski, T. (2010). Thirty-five years of research on neuro-linguistic programming. Polish Psychological Bulletin, 41(2), 58–66.", note: "Direct tests of the representational-system / eye-accessing-cue matching hypothesis were largely non-confirming. [Moderate — as applied to PRS]", link: scholar("Witkowski NLP research database representational systems eye accessing cues"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 94 — RAPPORT, MIRRORING & LANGUAGE PATTERNS ═══════════════
  {
    id: "rapport-mirroring", section: "94", title: "Rapport, Mirroring & Language Patterns", subtitle: "NLP scripts weak — but real mimicry & alliance are validated",
    evidenceTag: "Moderate",
    feeds: ["rapport/liking", "working-relationship quality", "interaction smoothness"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "low" },
    description: "NLP's Milton/Meta language models and deliberate 'mirroring' for rapport. The NLP framing is unsupported — but nonconscious behavioral mimicry (the 'chameleon effect') and the therapeutic alliance are real, independently validated phenomena that NLP's rapport claims resemble.",
    callout: "The Milton/Meta models have no credible controlled support. Don't cite mimicry or alliance research AS evidence for NLP — they are independent findings that predate and stand apart from NLP marketing. Genuine warmth and attunement carry the benefit; scripted 'pacing and leading' does not.",
    sources: [
      { cite: "Chartrand, T. L., & Bargh, J. A. (1999). The chameleon effect: the perception–behavior link and social interaction. Journal of Personality and Social Psychology, 76(6), 893–910.", note: "Nonconscious mimicry occurs spontaneously and increases liking and interaction smoothness. [Strong — seminal experiments]", link: scholar("Chartrand Bargh 1999 chameleon effect perception-behavior link Journal Personality Social Psychology"), kind: "scholar" },
      { cite: "Flückiger, C., Del Re, A. C., Wampold, B. E., & Horvath, A. O. (2018). The alliance in adult psychotherapy: a meta-analytic synthesis. Psychotherapy, 55(4), 316–340.", note: "Across 295 studies / 30,000+ patients, alliance is a consistent moderate predictor of outcome (r≈.28). [Strong — meta-analysis]", link: scholar("Fluckiger Del Re Wampold Horvath 2018 alliance adult psychotherapy meta-analytic synthesis Psychotherapy"), kind: "scholar" },
      { cite: "Passmore, J., & Rowson, T. S. (2019). Neuro-linguistic programming: a critical review. International Coaching Psychology Review, 14(1), 57–69.", note: "NLP-specific language/rapport techniques lack a clear evidence base; generic relational skills carry the benefit. [Moderate — critical review]", link: scholar("Passmore Rowson 2019 NLP critical review language rapport coaching"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 95 — SELF-AFFIRMATION ═══════════════
  {
    id: "self-affirmation", section: "95", title: "Self-Affirmation", subtitle: "Bolsters clusters: intrapersonal, volitional, emotional",
    evidenceTag: "Strong",
    feeds: ["stress resilience", "reduced defensiveness", "sustained performance under identity threat"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "low" },
    description: "Briefly writing about core personal values buffers identity threat — well-replicated in education, health, and stress paradigms, sometimes with durable downstream effects, though context-dependent.",
    callout: "This is values-affirmation (Steele's theory), NOT 'positive self-talk / mantras.' Effects depend on timing and a real threat; poorly targeted affirmations can be null or backfire.",
    sources: [
      { cite: "Cohen, G. L., & Sherman, D. K. (2014). The psychology of change: self-affirmation and social psychological intervention. Annual Review of Psychology, 65, 333–371.", note: "Timely values affirmations improve education/health/relationship outcomes, sometimes durably. [Strong — integrative review]", link: scholar("Cohen Sherman 2014 psychology of change self-affirmation Annual Review of Psychology"), kind: "scholar" },
      { cite: "Creswell, J. D., et al. (2005). Affirmation of personal values buffers neuroendocrine and psychological stress responses. Psychological Science, 16(11), 846–851.", note: "Values affirmation significantly lowered cortisol response to a lab stressor. [Strong — RCT]", link: scholar("Creswell 2005 affirmation personal values buffers neuroendocrine stress Psychological Science"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 96 — SELF-TALK ═══════════════
  {
    id: "self-talk", section: "96", title: "Self-Talk", subtitle: "Bolsters clusters: volitional, meta-cognitive, skill lines",
    evidenceTag: "Moderate",
    feeds: ["attention regulation", "task focus", "effort mobilization", "skill acquisition"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "low" },
    description: "Strategic cue words — instructional or motivational — to direct attention and effort. Meta-analytic support for performance benefits, strongest for fine-motor and novel tasks.",
    callout: "Evidence is concentrated in motor/sport performance; instructional self-talk helps fine/novel tasks more than gross/well-learned ones. Not a treatment for clinical conditions.",
    sources: [
      { cite: "Hatzigeorgiadis, A., et al. (2011). Self-talk and sports performance: a meta-analysis. Perspectives on Psychological Science, 6(4), 348–356.", note: "32 studies: moderate positive effect (ES≈.48); larger for fine/novel tasks. [Strong — meta-analysis]", link: scholar("Hatzigeorgiadis 2011 self-talk sports performance meta-analysis Perspectives on Psychological Science"), kind: "scholar" },
      { cite: "Tod, D., Hardy, J., & Oliver, E. (2011). Effects of self-talk: a systematic review. Journal of Sport and Exercise Psychology, 33(5), 666–687.", note: "47 studies: beneficial effects of positive/instructional/motivational self-talk on performance. [Strong — systematic review]", link: scholar("Tod Hardy Oliver 2011 effects of self-talk systematic review Journal of Sport and Exercise Psychology"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 97 — MENTAL IMAGERY & VISUALIZATION ═══════════════
  {
    id: "visualization", section: "97", title: "Mental Imagery & Visualization", subtitle: "Bolsters clusters: bodily-kinesthetic, skill acquisition",
    evidenceTag: "Moderate",
    feeds: ["motor skill acquisition", "movement preparation", "rehabilitation", "performance readiness"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Cognitive rehearsal of a motor skill without physical movement. Meta-analysis shows a positive, significant effect — best combined with physical practice and for cognitively-loaded tasks.",
    callout: "The effect is real but smaller than physical practice and decays with retention interval; strongest for cognitive/symbolic task elements, weaker for pure strength/endurance. 'Visualizing' non-motor life outcomes is not what this evidence supports.",
    sources: [
      { cite: "Driskell, J. E., Copper, C., & Moran, A. (1994). Does mental practice enhance performance? Journal of Applied Psychology, 79(4), 481–492.", note: "Mental practice has a positive significant effect, moderated by task type and retention interval. [Strong — meta-analysis]", link: scholar("Driskell Copper Moran 1994 does mental practice enhance performance Journal of Applied Psychology"), kind: "scholar" },
      { cite: "Schuster, C., et al. (2011). Best practice for motor imagery: a systematic literature review. BMC Medicine, 9, 75.", note: "Synthesizes effective motor-imagery parameters; supports imagery combined with physical practice. [Moderate — systematic review]", link: scholar("Schuster 2011 best practice motor imagery systematic review BMC Medicine"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 98 — MENTAL CONTRASTING (WOOP) ═══════════════
  {
    id: "woop", section: "98", title: "Mental Contrasting (WOOP)", subtitle: "Bolsters clusters: volitional, strategic, meta-cognitive",
    evidenceTag: "Moderate",
    feeds: ["goal commitment", "obstacle planning", "health-behavior change", "follow-through"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Imagine the desired future (Wish, Outcome), contrast it with the present Obstacle, then form an if-then Plan. Small-to-moderate, reasonably durable effects on health and behavior change — a self-regulation technique that pairs naturally with implementation intentions.",
    callout: "Effects are small-to-moderate (d≈.28–.32) and studied mostly in health-behavior and academic contexts. Mental contrasting without the implementation-intention step is weaker.",
    sources: [
      { cite: "Cross, A., & Sheffield, D. (2019). Mental contrasting for health behaviour change: a systematic review and meta-analysis of effects and moderator variables. Health Psychology Review, 13(2), 209–225.", note: "11 studies / 1,384 participants: effects d≈.28 (≤4 wk) and .32 (>3 mo). [Strong — meta-analysis]", link: scholar("Cross Sheffield 2019 mental contrasting health behaviour change systematic review meta-analysis Health Psychology Review"), kind: "scholar" },
      { cite: "Oettingen, G. (2012). Future thought and behaviour change. European Review of Social Psychology, 23(1), 1–63.", note: "Fantasy-realization theory; mental contrasting drives selective goal pursuit and disengagement. [Moderate — theoretical review]", link: scholar("Oettingen 2012 future thought and behaviour change European Review of Social Psychology"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 99 — PLACEBO & EXPECTANCY ═══════════════
  {
    id: "placebo", section: "99", title: "Placebo & Expectancy Effects", subtitle: "Bolsters clusters: interoceptive, emotional (symptom modulation)",
    evidenceTag: "Strong",
    feeds: ["symptom relief", "pain modulation", "treatment engagement"],
    impact: { magnitude: 4, latency: "days", durability: "transient", effort: "low" },
    description: "Psychosocial context and expectancy produce measurable neurobiological and clinical changes — and even open-label (non-deceptive) placebos show benefit for some symptom-based conditions like IBS.",
    callout: "Placebo effects are largest for subjective/symptom outcomes (pain, IBS, mood), not for disease pathology or hard endpoints. Open-label placebo trials are promising but small and heterogeneous.",
    sources: [
      { cite: "Benedetti, F. (2008). Mechanisms of placebo and placebo-related effects across diseases and treatments. Annual Review of Pharmacology and Toxicology, 48, 33–60.", note: "Documents specific biochemical/neural mechanisms of placebo across conditions. [Strong — mechanistic review]", link: scholar("Benedetti 2008 mechanisms of placebo placebo-related effects Annual Review Pharmacology Toxicology"), kind: "scholar" },
      { cite: "Kaptchuk, T. J., et al. (2010). Placebos without deception: a randomized controlled trial in irritable bowel syndrome. PLoS ONE, 5(12), e15591.", note: "Open-label placebo beat no-treatment control on IBS symptom improvement. [Moderate — RCT]", link: scholar("Kaptchuk 2010 placebos without deception randomized controlled trial irritable bowel syndrome PLoS ONE"), kind: "scholar" },
      { cite: "Charlesworth, J. E. G., et al. (2017). Effects of placebos without deception compared with no treatment: a systematic review and meta-analysis. Journal of Evidence-Based Medicine, 10(2), 97–107.", note: "Pooled open-label placebo trials show a positive effect vs. no treatment; evidence base still small. [Moderate — meta-analysis]", link: scholar("Charlesworth 2017 placebos without deception no treatment systematic review meta-analysis Journal Evidence-Based Medicine"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 100 — BIOFEEDBACK & NEUROFEEDBACK ═══════════════
  {
    id: "biofeedback", section: "100", title: "Biofeedback & Neurofeedback", subtitle: "Bolsters clusters: interoceptive, self-regulation",
    evidenceTag: "Mixed",
    feeds: ["self-regulation (partly expectancy)", "arousal control", "symptom relief"],
    impact: { magnitude: 2, latency: "months", durability: "transient", effort: "high" },
    description: "Real-time feedback of physiological or EEG signals to train self-regulation. Genuinely mixed: some symptom benefit, but sham-controlled trials repeatedly show much of the effect is non-specific / placebo.",
    callout: "When outcomes are rated by blinded assessors and compared to sham, EEG-neurofeedback's specific effect is often not demonstrated — improvement is largely expectancy. Be skeptical of unblinded, sham-free claims.",
    sources: [
      { cite: "Micoulaud-Franchi, J.-A., et al. (2014). EEG neurofeedback treatments in children with ADHD: an updated meta-analysis of randomized controlled trials. Frontiers in Human Neuroscience, 8, 906.", note: "Improvement on some ADHD measures across 5 RCTs; effects attenuate on the most rigorous blinded outcomes. [Moderate — meta-analysis]", link: scholar("Micoulaud-Franchi 2014 EEG neurofeedback ADHD meta-analysis randomized controlled trials Frontiers Human Neuroscience"), kind: "scholar" },
      { cite: "Thibault, R. T., & Raz, A. (2017). The psychology of neurofeedback: clinical intervention even if applied placebo. American Psychologist, 72(7), 679–688.", note: "Argues psychosocial/expectancy factors, not the specific brain signal, drive most neurofeedback benefit. [Strong — critical analysis]", link: scholar("Thibault Raz 2017 psychology of neurofeedback clinical intervention applied placebo American Psychologist"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 101 — PROGRESSIVE RELAXATION & AUTOGENIC TRAINING ═══════════════
  {
    id: "relaxation", section: "101", title: "Progressive Relaxation & Autogenic Training", subtitle: "Bolsters clusters: interoceptive, emotional (anxiety)",
    evidenceTag: "Moderate",
    feeds: ["anxiety reduction", "arousal down-regulation", "sleep/tension relief", "stress management"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Structured relaxation — PMR (tense-release cycles) or autogenic (self-suggestion of warmth/heaviness). Meta-analyses show consistent, moderate reductions in anxiety and related symptoms.",
    callout: "Solid as an adjunct/self-management tool for anxiety and tension — not a standalone cure for severe disorders, and effect sizes shrink against active controls.",
    sources: [
      { cite: "Manzoni, G. M., et al. (2008). Relaxation training for anxiety: a ten-years systematic review with meta-analysis. BMC Psychiatry, 8, 41.", note: "Consistent, significant anxiety reduction across relaxation methods (PMR, autogenic, applied). [Strong — meta-analysis]", link: scholar("Manzoni Pagnini 2008 relaxation training for anxiety ten-years systematic review meta-analysis BMC Psychiatry"), kind: "scholar" },
      { cite: "Stetter, F., & Kupper, S. (2002). Autogenic training: a meta-analysis of clinical outcome studies. Applied Psychophysiology and Biofeedback, 27(1), 45–98.", note: "60 studies: medium-to-large pre-post effects across multiple disorders. [Strong — meta-analysis]", link: scholar("Stetter Kupper 2002 autogenic training meta-analysis clinical outcome studies Applied Psychophysiology and Biofeedback"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 102 — ADOLESCENT WORK, MODERATE HOURS ═══════════════
  {
    id: "teen-work-moderate", section: "102", title: "Adolescent Work — Moderate Hours", subtitle: "Bolsters clusters: volitional, street-smarts, financial (youth)",
    evidenceTag: "Moderate",
    feeds: ["responsibility", "time-management", "vocational self-concept", "socialization"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "low" },
    description: "Light-to-moderate term-time work (~≤20 hrs/week) is associated with responsibility, time-management, vocational exploration, and modestly better later attainment — the honest sweet spot for teen employment.",
    callout: "Largely observational: teens who choose moderate work differ from non-workers and heavy workers, so part of the 'benefit' is who opts in, not the work itself.",
    sources: [
      { cite: "Mortimer, J. T. (2003). Working and Growing Up in America. Harvard University Press.", note: "Moderate work (≤20 hrs) linked to more confidence, time-management, and higher college completion than non-workers or heavy workers. [Moderate — longitudinal, Youth Development Study]", link: scholar("Mortimer Working and Growing Up in America 2003 Youth Development Study"), kind: "scholar" },
      { cite: "Staff, J., & Mortimer, J. T. (2007). Educational and work strategies from adolescence to early adulthood. Social Forces, 85(3), 1169–1194.", note: "Moderate work combined with school especially aided BA attainment for 'low-promise' youth. [Moderate — longitudinal]", link: scholar("Staff Mortimer 2007 educational work strategies adolescence early adulthood Social Forces"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 103 — WORK INTENSITY THRESHOLD ═══════════════
  {
    id: "work-intensity", section: "103", title: "Work Intensity Threshold (>20 hrs)", subtitle: "A limit, not a practice — keep teen work under the line",
    evidenceTag: "Strong",
    feeds: ["protects academic engagement", "protects sleep/adjustment", "protects college-going"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "low" },
    description: "High-intensity term-time work (>20 hrs/week) is associated with lower grades, disengagement, more problem behavior, and reduced college attendance. This entry is a guardrail: keep adolescent work under the threshold.",
    callout: "Reverse causation — already-disengaged students may self-select into long hours — so raw threshold effects overstate causal harm; but propensity-score and fixed-effects work shrinks the effect without erasing it.",
    sources: [
      { cite: "Steinberg, L., & Dornbusch, S. M. (1991). Negative correlates of part-time employment during adolescence: replication and elaboration. Developmental Psychology, 27(2), 304–313.", note: "More hours worked linked to lower grades, more drug use, and less school engagement. [Strong — large replication]", link: scholar("Steinberg Dornbusch 1991 negative correlates part-time employment adolescence Developmental Psychology"), kind: "scholar" },
      { cite: "Marsh, H. W., & Kleitman, S. (2005). Consequences of employment during high school: character building, subversion of academic goals, or a threshold? American Educational Research Journal, 42(2), 331–369.", note: "Hours worked had mainly linear-negative effects on 15 of 23 outcomes (NELS:88), controlling for background. [Strong — nationally representative]", link: scholar("Marsh Kleitman 2005 consequences employment during high school threshold AERJ"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 104 — HOUSEHOLD CHORES & RESPONSIBILITY ═══════════════
  {
    id: "chores", section: "104", title: "Household Chores & Responsibility", subtitle: "Bolsters clusters: volitional, intrapersonal (youth)",
    evidenceTag: "Emerging",
    feeds: ["responsibility", "self-efficacy", "contribution/prosociality", "self-sufficiency"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "low" },
    description: "Childhood participation in chores is correlated with later self-sufficiency, relationships, and academic/career outcomes — a plausible, cheap habit, but the evidence is thinner than the parenting-book confidence implies.",
    callout: "The famous 'Harvard Grant Study proves chores cause success' claim is a genuine misattribution — the Grant Study did not run that analysis. The primary chores study (Rossmann) is small and not peer-reviewed. Treat as suggestive, not established.",
    sources: [
      { cite: "White, E. M., DeBoer, M. D., & Scharf, R. J. (2019). Associations between household chores and childhood self-competency. Journal of Developmental & Behavioral Pediatrics, 40(3), 176–182.", note: "Kindergarten chore participation associated with modestly higher self-competence and prosocial peer relations in 3rd grade. [Moderate — larger sample, correlational]", link: scholar("White DeBoer Scharf 2019 household chores childhood self-competency JDBP"), kind: "scholar" },
      { cite: "Rossmann, M. (2002). Involving children in household tasks: is it worth the effort? University of Minnesota (research report).", note: "Chore participation from ages 3–4 was the best childhood predictor of mid-20s success in a small sample. [Emerging — small n, not peer-reviewed]", link: scholar("Rossmann 2002 involving children household tasks University of Minnesota"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 105 — YOUTH ENTREPRENEURSHIP & PAPER ROUTES ═══════════════
  {
    id: "youth-entrepreneurship", section: "105", title: "Youth Entrepreneurship & Paper Routes", subtitle: "Honest gap — the childhood micro-venture is unstudied",
    evidenceTag: "Emerging",
    feeds: ["self-efficacy", "initiative", "financial literacy", "customer/social skills"],
    impact: { magnitude: 2, latency: "months", durability: "transient", effort: "moderate" },
    description: "Does running a childhood micro-venture (paper route, lemonade stand) build lasting capacities? Honestly: there is essentially NO direct research on informal childhood ventures. The nearest rigorous evidence is on structured youth-entrepreneurship education, which shows proximal self-efficacy gains.",
    callout: "No peer-reviewed study isolates paper routes or lemonade stands. Entrepreneurship-education effects are real but small and concentrated on proximal outcomes (self-efficacy, attitudes) — not proven downstream income. Don't conflate the two.",
    sources: [
      { cite: "Rosendahl Huber, L., Sloof, R., & Van Praag, M. (2014). The effect of early entrepreneurship education: evidence from a field experiment. European Economic Review, 72, 76–97.", note: "Randomized program improved non-cognitive entrepreneurial skills in children; no effect on cognitive scores. [Moderate — field experiment]", link: scholar("Rosendahl Huber Sloof Van Praag 2014 early entrepreneurship education field experiment European Economic Review"), kind: "scholar" },
      { cite: "Kim, G., Kim, D., Lee, W. J., & Joung, S. (2020). The effect of youth entrepreneurship education programs: two large-scale experimental studies. SAGE Open, 10(3).", note: "Gains mainly in entrepreneurial attitudes/self-efficacy, with uneven effects on knowledge. [Moderate — two experiments]", link: scholar("Kim Kim Lee Joung 2020 youth entrepreneurship education two large-scale experimental studies SAGE Open"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 106 — EARLY EMPLOYMENT & LATER EARNINGS ═══════════════
  {
    id: "early-employment", section: "106", title: "Early Employment & Later Earnings", subtitle: "Bolsters clusters: financial, volitional, street-smarts",
    evidenceTag: "Moderate",
    feeds: ["earnings", "employability", "occupational status", "human capital"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "moderate" },
    description: "Working modestly during high school (especially senior year) predicts higher later wages, employment, and human-capital investment — fairly robust in economics, though the premium is shrinking over time.",
    callout: "Correlational-with-controls, not randomized; the earnings premium has declined across cohorts, so older estimates overstate today's benefit. Gains are largest for non-college-bound youth.",
    sources: [
      { cite: "Ruhm, C. J. (1997). Is high school employment consumption or investment? Journal of Labor Economics, 15(4), 735–776.", note: "Senior-year work hours positively predicted future earnings, benefits, and occupational status (NLSY). [Moderate–Strong — panel]", link: scholar("Ruhm 1997 is high school employment consumption or investment Journal of Labor Economics"), kind: "scholar" },
      { cite: "Baum, C. L., & Ruhm, C. J. (2016). The changing benefits of early work experience. Southern Economic Journal, 83(2), 343–363.", note: "The future-earnings premium from senior-year work fell from ~17% to ~12% across NLSY79 vs. NLSY97 cohorts. [Moderate–Strong — two-cohort]", link: scholar("Baum Ruhm 2016 changing benefits of early work experience Southern Economic Journal"), kind: "scholar" },
      { cite: "Painter, M. A. (2010). Get a job and keep it! High school employment and adult wealth accumulation. Research in Social Stratification and Mobility, 28(2), 233–249.", note: "Adolescent employment associated with higher adult wealth (homeownership, stock ownership). [Moderate — longitudinal]", link: scholar("Painter 2010 high school employment adult wealth accumulation Research in Social Stratification and Mobility"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 107 — ADULT CONTINUING EDUCATION ═══════════════
  {
    id: "continuing-ed", section: "107", title: "Adult Continuing Education (Non-Degree)", subtitle: "Bolsters clusters: meta-cognitive, existential, interpersonal",
    evidenceTag: "Moderate",
    feeds: ["wellbeing", "purpose", "cognitive engagement", "social connection", "self-efficacy"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "low" },
    description: "Informal, non-credit, interest-driven learning — exactly the 'take a class for the love of it' idea — is associated with higher psychological wellbeing, especially in older adults, and informal learning outperforms formal courses for wellbeing.",
    callout: "Selection/healthy-participant bias: healthier, more socially connected adults enroll and persist, inflating observed benefits. Few randomized designs exist.",
    sources: [
      { cite: "Jenkins, A., & Mostafa, T. (2015). The effects of learning on wellbeing for older adults in England. Ageing & Society, 35(10), 2053–2070.", note: "Informal learning linked to higher wellbeing (ELSA); no wellbeing benefit from formal courses. [Moderate — longitudinal]", link: scholar("Jenkins Mostafa 2015 effects of learning on wellbeing older adults England Ageing Society"), kind: "scholar" },
      { cite: "Narushima, M., Liu, J., & Diestelkamp, N. (2018). Lifelong learning in active ageing discourse: its conserving effect on wellbeing, health and vulnerability. Ageing & Society, 38(4), 651–675.", note: "Continuous non-credit general-interest learning associated with sustained wellbeing in older adults (n=699). [Moderate — large sample]", link: scholar("Narushima Liu Diestelkamp 2018 lifelong learning active ageing wellbeing Ageing Society"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 108 — APPRENTICESHIP & VOCATIONAL TRAINING ═══════════════
  {
    id: "apprenticeship", section: "108", title: "Apprenticeship & Vocational Training", subtitle: "Bolsters clusters: financial, mechanical, street-smarts",
    evidenceTag: "Strong",
    feeds: ["earnings", "employability", "occupational skills", "school-to-work transition"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "high" },
    description: "Registered apprenticeships and career-focused pathways produce substantial earnings gains and strong benefit-cost ratios; the cleanest causal estimate (Career Academies) is a randomized trial.",
    callout: "The large apprenticeship earnings figures come from a non-randomized comparison with likely positive selection; the cleanest causal evidence (Career Academies RCT) shows earnings gains concentrated in young men and no gain in educational attainment.",
    sources: [
      { cite: "Kemple, J. J., & Willner, C. J. (2008). Career Academies: Long-Term Impacts on Labor Market Outcomes, Educational Attainment, and Transitions to Adulthood. MDRC.", note: "RCT: ~11% ($2,088/yr) sustained earnings gain over 8 years, concentrated among young men. [Strong — RCT]", link: scholar("Kemple Willner 2008 Career Academies long-term impacts MDRC randomized"), kind: "scholar" },
      { cite: "Reed, D., et al. (2012). An Effectiveness Assessment and Cost-Benefit Analysis of Registered Apprenticeship in 10 States. Mathematica Policy Research.", note: "Apprenticeship participants earned ~$47,586 more over 9 years; benefits far exceeded costs. [Moderate — quasi-experimental]", link: scholar("Reed 2012 effectiveness assessment cost-benefit analysis registered apprenticeship 10 states Mathematica"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 109 — YOUTH MENTORING PROGRAMS ═══════════════
  {
    id: "youth-mentoring", section: "109", title: "Youth Mentoring Programs", subtitle: "Bolsters clusters: interpersonal, volitional, moral (youth)",
    evidenceTag: "Strong",
    feeds: ["prosocial behavior", "school engagement", "self-worth", "risk-behavior reduction"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "high" },
    description: "Structured youth mentoring (e.g., Big Brothers Big Sisters) produces small-but-real average benefits across behavioral, social, emotional, and academic outcomes — strongest for at-risk youth with high-quality, durable matches.",
    callout: "Average effects are modest (~d=0.21), and poorly implemented or short/early-terminated matches can produce zero or harmful effects. Quality and match duration drive results, not mentoring per se.",
    sources: [
      { cite: "Tierney, J. P., Grossman, J. B., & Resch, N. L. (1995). Making a Difference: An Impact Study of Big Brothers/Big Sisters. Public/Private Ventures.", note: "RCT (n≈1,000): mentored youth had ~46% less first-time drug initiation, better grades, less truancy at 18 months. [Strong — RCT]", link: scholar("Tierney Grossman Resch 1995 Making a Difference Big Brothers Big Sisters impact study"), kind: "scholar" },
      { cite: "DuBois, D. L., et al. (2011). How effective are mentoring programs for youth? A systematic assessment of the evidence. Psychological Science in the Public Interest, 12(2), 57–91.", note: "Meta-analysis (73 programs): overall small positive effect (~d=0.21) across domains. [Strong — meta-analysis]", link: scholar("DuBois 2011 how effective are mentoring programs for youth Psychological Science in the Public Interest"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 110 — EXTRACURRICULAR PARTICIPATION ═══════════════
  {
    id: "extracurriculars", section: "110", title: "Extracurricular Participation", subtitle: "Bolsters clusters: interpersonal, volitional (youth)",
    evidenceTag: "Moderate",
    feeds: ["socialization", "interpersonal competence", "school belonging", "educational aspirations"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "moderate" },
    description: "Participation in structured extracurricular activities is associated with better academic outcomes, lower dropout, and higher young-adult educational attainment.",
    callout: "Self-selection is the central confound — motivated, better-adjusted teens join, so the association weakens or becomes mixed after accounting for prior competence, activity type, and intensity ('over-scheduling' can reverse benefits).",
    sources: [
      { cite: "Feldman, A. F., & Matjasko, J. L. (2005). The role of school-based extracurricular activities in adolescent development: a comprehensive review and future directions. Review of Educational Research, 75(2), 159–210.", note: "Associations mostly positive but become mixed once moderators (type, intensity, selection) are modeled. [Moderate — review]", link: scholar("Feldman Matjasko 2005 school-based extracurricular activities adolescent development Review of Educational Research"), kind: "scholar" },
      { cite: "Mahoney, J. L., Cairns, B. D., & Farmer, T. W. (2003). Promoting interpersonal competence and educational success through extracurricular activity participation. Journal of Educational Psychology, 95(2), 409–418.", note: "Consistent participation predicted higher educational status and college attendance at age 20. [Moderate — longitudinal]", link: scholar("Mahoney Cairns Farmer 2003 promoting interpersonal competence extracurricular activity Journal of Educational Psychology"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 111 — SHARED READING & EARLY LITERACY ═══════════════
  {
    id: "dialogic-reading", section: "111", title: "Shared Reading & Early Literacy", subtitle: "Bolsters clusters: linguistic, interpersonal (parent-child)",
    evidenceTag: "Strong",
    feeds: ["expressive vocabulary", "early literacy", "oral language", "parent-child interaction"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Interactive ('dialogic') shared book reading — where the adult asks open-ended questions and expands on the child's answers — causally boosts young children's expressive vocabulary. One of the strongest, cheapest levers in child development.",
    callout: "Effects are largest for younger (2–3 yr) and not-at-risk children and shrink for older or language-delayed children; benefits concentrate on expressive vocabulary. Fidelity of the technique matters.",
    sources: [
      { cite: "Whitehurst, G. J., et al. (1988). Accelerating language development through picture book reading. Developmental Psychology, 24(4), 552–559.", note: "RCT of 1-month home dialogic-reading training raised toddlers' expressive language vs. controls. [Strong — RCT]", link: scholar("Whitehurst 1988 accelerating language development through picture book reading Developmental Psychology"), kind: "scholar" },
      { cite: "Mol, S. E., et al. (2008). Added value of dialogic parent–child book readings: a meta-analysis. Early Education and Development, 19(1), 7–26.", note: "Meta-analysis (16 studies): dialogic reading improved expressive vocabulary (d≈0.59). [Strong — meta-analysis]", link: scholar("Mol Bus de Jong Smeets 2008 added value dialogic parent-child book readings meta-analysis"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 112 — COMMUNITY & REC SPORTS TEAMS ═══════════════
  {
    id: "rec-sports", section: "112", title: "Community & Rec Sports Teams", subtitle: "Bolsters clusters: interpersonal, bodily-kinesthetic, emotional",
    evidenceTag: "Moderate",
    feeds: ["social connection", "mood", "physical health", "belonging", "loneliness reduction"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Playing on a recreational or team sport (adult coed softball, the classic example) improves mood and social connection, and the team format adds a social layer over solo exercise.",
    callout: "Selection effects dominate — healthier, more social people join teams. Almost no RCTs on adult recreational leagues; the strongest mental-health data are cross-sectional or in adolescents.",
    sources: [
      { cite: "Eime, R. M., et al. (2013). A systematic review of the psychological and social benefits of participation in sport for adults. International Journal of Behavioral Nutrition and Physical Activity, 10, 135.", note: "Club/team sport linked to better wellbeing and social connectedness beyond solo activity. [Moderate — systematic review]", link: scholar("Eime Young Harvey systematic review psychological social benefits participation sport adults 2013"), kind: "scholar" },
      { cite: "Pluhar, E., et al. (2019). Team sport athletes may be less likely to suffer anxiety or depression than individual sport athletes. Journal of Sports Science & Medicine, 18(3), 490–496.", note: "Team-sport athletes reported less anxiety/depression than individual-sport athletes, plausibly via social support. [Moderate]", link: scholar("Pluhar team sport athletes less likely anxiety depression individual sport 2019"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 113 — SOCIAL CLUBS & GROUP GAMES (BINGO) ═══════════════
  {
    id: "social-clubs", section: "113", title: "Social Clubs & Group Games (incl. Bingo)", subtitle: "Bolsters clusters: interpersonal, meta-cognitive, emotional",
    evidenceTag: "Moderate",
    feeds: ["cognition", "social connection", "mood", "loneliness reduction", "meaning"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Regular group leisure — clubs, cards, and yes, bar bingo — tracks with better cognition and wellbeing in older adults. The social participation is the active ingredient; the 'bingo helps cognition' claim specifically is thin.",
    callout: "Reverse causation is severe — people already declining cognitively withdraw from clubs, making participation look protective. Bingo-specific cognitive evidence is a handful of small studies, several in Alzheimer's samples, not healthy-aging RCTs.",
    sources: [
      { cite: "Kelly, M. E., et al. (2017). The impact of social activities, social networks, social support and social relationships on the cognitive functioning of healthy older adults: a systematic review. Systematic Reviews, 6, 259.", note: "Frequent social activity associated with better memory, executive function, and processing speed in healthy elders. [Moderate — systematic review]", link: scholar("Kelly Duff impact social activities networks support cognitive functioning healthy older adults systematic review 2017"), kind: "scholar" },
      { cite: "Sobel, B. P. (2001). Bingo vs. physical intervention in stimulating short-term cognition in Alzheimer's disease patients. American Journal of Alzheimer's Disease & Other Dementias, 16(2), 115–120.", note: "Small study: bingo outperformed a physical activity on short-term memory/concentration in Alzheimer's patients. [Emerging — small, clinical]", link: scholar("Sobel bingo versus physical intervention stimulating short-term cognition Alzheimer's disease patients 2001"), kind: "scholar" },
      { cite: "Cattan, M., et al. (2005). Preventing social isolation and loneliness among older people: a systematic review of health promotion interventions. Ageing & Society, 25(1), 41–67.", note: "Group educational/social-activity interventions reduced isolation; one-to-one support mostly did not. [Moderate — review]", link: scholar("Cattan White Bond Learmouth preventing social isolation loneliness older people systematic review health promotion interventions 2005"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 114 — MARRIAGE & LONG-TERM PARTNERSHIP ═══════════════
  {
    id: "marriage", section: "114", title: "Marriage & Long-Term Partnership", subtitle: "Bolsters clusters: interpersonal, systemic, existential",
    evidenceTag: "Strong",
    feeds: ["longevity", "social connection", "mood", "physical health", "meaning"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "high" },
    description: "Being married or partnered is associated with meaningfully lower mortality — among the best-replicated findings in social epidemiology, comparable in size to quitting smoking.",
    callout: "Healthy-partner selection and reverse causation inflate the causal size. And marriage quality matters: high-conflict marriages erase or reverse the benefit.",
    sources: [
      { cite: "Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social relationships and mortality risk: a meta-analytic review. PLoS Medicine, 7(7), e1000316.", note: "148 studies (~308k people): stronger social relationships → ~50% greater survival odds. [Strong — meta-analysis]", link: scholar("Holt-Lunstad Smith Layton social relationships mortality risk meta-analytic review PLoS Medicine 2010"), kind: "scholar" },
      { cite: "Manzoli, L., et al. (2007). Marital status and mortality in the elderly: a systematic review and meta-analysis. Social Science & Medicine, 64(1), 77–94.", note: "Pooled ~250k elders: married vs. non-married RR ≈ 0.88 for mortality. [Strong — meta-analysis]", link: scholar("Manzoli Villari Pirone Boccia marital status mortality elderly systematic review meta-analysis 2007"), kind: "scholar" },
      { cite: "Shor, E., et al. (2012). Meta-analysis of marital dissolution and mortality: reevaluating the intersection of gender and age. Social Science & Medicine, 75(1), 46–59.", note: "Divorced/separated show elevated mortality risk, stronger in men and younger ages. [Moderate — meta-analysis]", link: scholar("Shor Roelfs meta-analysis marital dissolution mortality gender age Social Science Medicine 2012"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 115 — RELIGIOUS SERVICE ATTENDANCE ═══════════════
  {
    id: "religious-attendance", section: "115", title: "Religious Service Attendance", subtitle: "Bolsters clusters: existential, interpersonal, moral",
    evidenceTag: "Strong",
    feeds: ["longevity", "social connection", "meaning", "mood", "belonging"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
    description: "Frequent attendance at religious services is prospectively associated with lower mortality, with the social/communal component doing much of the work — a large Nurses' Health Study cohort found 33% lower mortality for weekly-plus attenders.",
    callout: "Reverse causation (sick people stop attending) biases weaker studies; the best cohorts control for baseline health but can't fully rule out healthy-adherent selection. The benefit tracks attendance (social participation), not private belief.",
    sources: [
      { cite: "Li, S., et al. (2016). Association of religious service attendance with mortality among women. JAMA Internal Medicine, 176(6), 777–785.", note: "~74k Nurses' Health Study women: attending >1×/week → 33% lower all-cause mortality; partly mediated by social support. [Strong — cohort]", link: scholar("Li Stampfer Williams VanderWeele religious service attendance mortality women JAMA Internal Medicine 2016"), kind: "scholar" },
      { cite: "Chida, Y., Steptoe, A., & Powell, L. H. (2009). Religiosity/spirituality and mortality: a systematic quantitative review. Psychotherapy and Psychosomatics, 78(2), 81–90.", note: "Meta-analysis: religious/spiritual involvement associated with reduced mortality in healthy populations. [Moderate — meta-analysis]", link: scholar("Chida Steptoe Powell religiosity spirituality mortality systematic quantitative review Psychotherapy Psychosomatics 2009"), kind: "scholar" },
      { cite: "VanderWeele, T. J. (2017). Religious communities and human flourishing. Current Directions in Psychological Science, 26(5), 476–481.", note: "Argues communal attendance (not just belief) drives the health/flourishing effects. [Moderate — synthesis]", link: scholar("VanderWeele religious communities human flourishing Current Directions Psychological Science 2017"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 116 — SOCIAL PRESCRIBING ═══════════════
  {
    id: "social-prescribing", section: "116", title: "Social Prescribing", subtitle: "Intuitive, widely adopted — but the evidence is thin",
    evidenceTag: "Emerging",
    feeds: ["social connection", "mood", "loneliness reduction", "meaning"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "moderate" },
    description: "A GP refers a patient to a 'link worker' who connects them to community activities. Intuitively appealing and widely rolled out in the NHS — but the evidence base is genuinely weak.",
    callout: "The flagship systematic review is explicit that studies are small, uncontrolled, short-follow-up, and at high risk of bias — enthusiasm outstrips demonstrated effect. Don't overstate.",
    sources: [
      { cite: "Bickerdike, L., et al. (2017). Social prescribing: less rhetoric and more reality. A systematic review of the evidence. BMJ Open, 7(4), e013384.", note: "15 studies, only 1 RCT; poor design, weak evidence — commonly reported as positive but not rigorously demonstrated. [Emerging — honest]", link: scholar("Bickerdike Booth Wilson social prescribing less rhetoric more reality systematic review BMJ Open 2017"), kind: "scholar" },
      { cite: "Masi, C. M., et al. (2011). A meta-analysis of interventions to reduce loneliness. Personality and Social Psychology Review, 15(3), 219–266.", note: "Opportunity-for-contact interventions (the social-prescribing logic) show smaller effects than cognitive-focused ones. [Moderate — meta-analysis]", link: scholar("Masi Chen Hawkley Cacioppo meta-analysis interventions reduce loneliness Personality Social Psychology Review 2011"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 117 — PROSOCIAL SPENDING & KINDNESS ═══════════════
  {
    id: "kindness", section: "117", title: "Prosocial Spending & Kindness", subtitle: "Bolsters clusters: moral, emotional, interpersonal",
    evidenceTag: "Moderate",
    feeds: ["mood", "meaning", "social connection", "prosociality"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Spending on others and performing acts of kindness modestly boost the giver's wellbeing — real experimental evidence exists, but effect sizes are small and the headline result did not fully replicate.",
    callout: "The specific $5 'spend on others' manipulation failed a large 2020 registered replication; the meta-analytic effect of kindness on wellbeing is only small-to-medium (~0.28). Real but oversold — set expectations low.",
    sources: [
      { cite: "Curry, O. S., et al. (2018). Happy to help? A systematic review and meta-analysis of the effects of performing acts of kindness on the well-being of the actor. Journal of Experimental Social Psychology, 76, 320–329.", note: "27 studies (~4,000 people): kindness → small-to-medium wellbeing gain (δ ≈ 0.28). [Moderate — meta-analysis]", link: scholar("Curry Rowland Van Lissa happy to help meta-analysis acts of kindness well-being actor 2018"), kind: "scholar" },
      { cite: "Dunn, E. W., Aknin, L. B., & Norton, M. I. (2008). Spending money on others promotes happiness. Science, 319(5870), 1687–1688.", note: "Assigned prosocial spending increased happiness vs. personal spending (note: 2020 registered replication was null for the core manipulation). [Moderate]", link: scholar("Dunn Aknin Norton spending money on others promotes happiness Science 2008"), kind: "scholar" },
      { cite: "Aknin, L. B., et al. (2013). Prosocial spending and well-being: cross-cultural evidence for a psychological universal. Journal of Personality and Social Psychology, 104(4), 635–652.", note: "The prosocial-spending/happiness link appears across diverse countries. [Moderate]", link: scholar("Aknin Barrington-Leigh Dunn prosocial spending well-being cross-cultural psychological universal 2013"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 118 — ADULT MENTORING ═══════════════
  {
    id: "adult-mentoring", section: "118", title: "Adult Mentoring", subtitle: "Bolsters clusters: interpersonal, strategic, volitional",
    evidenceTag: "Moderate",
    feeds: ["career development", "meaning", "social connection", "self-efficacy"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "moderate" },
    description: "Being mentored is associated with better career and some wellbeing outcomes — well-summarized by meta-analyses, though the objective effects (pay, promotion) are small and confounded.",
    callout: "Nearly all data are correlational — high-potential people attract mentors, so mentoring looks more powerful than it causally is. Objective career effects are small; subjective satisfaction effects are larger.",
    sources: [
      { cite: "Allen, T. D., et al. (2004). Career benefits associated with mentoring for protégés: a meta-analysis. Journal of Applied Psychology, 89(1), 127–136.", note: "Mentored individuals show better career outcomes; objective effects small, subjective (satisfaction) larger. [Moderate — meta-analysis]", link: scholar("Allen Eby Poteet Lentz Lima career benefits mentoring protégés meta-analysis Journal Applied Psychology 2004"), kind: "scholar" },
      { cite: "Eby, L. T., et al. (2008). Does mentoring matter? A multidisciplinary meta-analysis comparing mentored and non-mentored individuals. Journal of Vocational Behavior, 72(2), 254–267.", note: "Across youth/academic/workplace: mentoring linked to favorable behavioral, health, and career outcomes; effect sizes generally small. [Moderate — meta-analysis]", link: scholar("Eby Allen Evans does mentoring matter multidisciplinary meta-analysis mentored non-mentored 2008"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 119 — BEFRIENDING & LONELINESS INTERVENTIONS ═══════════════
  {
    id: "befriending", section: "119", title: "Befriending & Loneliness Interventions", subtitle: "Bolsters clusters: interpersonal, emotional",
    evidenceTag: "Moderate",
    feeds: ["loneliness reduction", "mood", "social connection", "belonging"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "moderate" },
    description: "Structured befriending and loneliness programs help modestly — the honest headline is that effects are small, and the strongest gains come from addressing maladaptive social thinking, not just adding contact.",
    callout: "The best RCT-based meta-analysis finds smaller effects than uncontrolled studies suggest, and befriending's own meta-analysis shows a modest depression effect with likely publication bias.",
    sources: [
      { cite: "Masi, C. M., et al. (2011). A meta-analysis of interventions to reduce loneliness. Personality and Social Psychology Review, 15(3), 219–266.", note: "RCTs show smaller effects than pre-post designs; interventions correcting maladaptive social cognition worked best. [Moderate — meta-analysis]", link: scholar("Masi Chen Hawkley Cacioppo meta-analysis interventions reduce loneliness 2011"), kind: "scholar" },
      { cite: "Mead, N., et al. (2010). Effects of befriending on depressive symptoms and distress: systematic review and meta-analysis. British Journal of Psychiatry, 196(2), 96–101.", note: "Modest positive effect on depressive symptoms; funnel-plot asymmetry hints at publication bias. [Moderate — with caveat]", link: scholar("Mead Lester Chew-Graham Gask Bower effects befriending depressive symptoms distress systematic review meta-analysis 2010"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 120 — BOOK CLUBS & INTEREST GROUPS ═══════════════
  {
    id: "book-clubs", section: "120", title: "Book Clubs & Interest Groups", subtitle: "Bolsters clusters: linguistic, interpersonal, meta-cognitive",
    evidenceTag: "Emerging",
    feeds: ["cognition", "social connection", "mood", "meaning"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Book clubs and shared-reading groups plausibly support mood, connection, and cognition — but direct high-quality evidence is thin, resting largely on small pilots and the adjacent social-participation literature.",
    callout: "Very few controlled trials; most support is small pilots or qualitative work from a single program, plus indirect inference from social-participation research. Don't present as established.",
    sources: [
      { cite: "Billington, J., et al. (2013). A literature-based intervention for older people living with dementia. Perspectives in Public Health, 133(3), 165–173.", note: "Shared reading groups associated with improved concentration, mood, and social interaction (small study). [Emerging]", link: scholar("Billington Carroll Davis Healey Kinderman literature-based intervention older people living with dementia 2013"), kind: "scholar" },
      { cite: "Plummer, J., et al. (2023). How an intergenerational book club can prevent cognitive decline in older adults: a pilot study. Gerontology & Geriatric Medicine, 9.", note: "Book-club participants showed greater cognitive improvement than controls (small n, pilot). [Emerging]", link: scholar("Plummer Nguyen intergenerational book club prevent cognitive decline older adults pilot study 2023"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 121 — INTERGENERATIONAL PROGRAMS ═══════════════
  {
    id: "intergenerational", section: "121", title: "Intergenerational Programs", subtitle: "Bolsters clusters: existential, interpersonal, meta-cognitive",
    evidenceTag: "Moderate",
    feeds: ["cognition", "meaning/generativity", "physical health", "social connection", "mood"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "high" },
    description: "Programs pairing older adults with children/youth (e.g., Experience Corps) show benefits for older participants' health, cognition, and generativity — anchored by a randomized pilot and supported by reviews.",
    callout: "The landmark Experience Corps evidence is a small pilot RCT in one city; broader reviews mix study designs and find inconsistent quantitative effects. Volunteer selection (already-active elders) inflates apparent benefit.",
    sources: [
      { cite: "Fried, L. P., et al. (2004). A social model for health promotion for an aging population: initial evidence on the Experience Corps model. Journal of Urban Health, 81(1), 64–78.", note: "Pilot RCT (128 elders): volunteers gained in physical activity, strength, cognitive activity, and social ties vs. controls. [Moderate — small pilot]", link: scholar("Fried Carlson Freedman Frick Glass social model health promotion aging population Experience Corps 2004"), kind: "scholar" },
      { cite: "Gualano, M. R., et al. (2018). The impact of intergenerational programs on children and older adults: a review. International Psychogeriatrics, 30(4), 451–468.", note: "Intergenerational programs generally improve older adults' wellbeing and reduce isolation; study quality varies. [Moderate — review]", link: scholar("Gualano Voglino Bert impact intergenerational programs children older adults review International Psychogeriatrics 2018"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 122 — HOUSEPLANTS ═══════════════
  {
    id: "houseplants", section: "122", title: "Houseplants", subtitle: "Bolsters clusters: emotional, aesthetic, interoceptive",
    evidenceTag: "Emerging",
    feeds: ["mood", "stress reduction", "attention/restoration"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Living with and tending indoor plants modestly lowers stress and improves mood and comfort — a small, pleasant, low-cost nudge. Buy them for how they make you feel, not to clean your air.",
    callout: "The famous NASA 'plants purify your air' story is overstated to the point of being wrong for normal rooms — you'd need 10–1,000 plants per m² to match ordinary ventilation. The wellbeing effect is real but small.",
    sources: [
      { cite: "Lee, M. S., Lee, J., Park, B. J., & Miyazaki, Y. (2015). Interaction with indoor plants may reduce psychological and physiological stress. Journal of Physiological Anthropology, 34, 21.", note: "A transplanting task lowered diastolic BP and sympathetic activity vs. computer work. [Strong — small crossover RCT]", link: scholar("Lee Miyazaki 2015 interaction indoor plants psychological physiological stress autonomic"), kind: "scholar" },
      { cite: "Bringslimark, T., Hartig, T., & Patil, G. G. (2009). The psychological benefits of indoor plants: a critical review of the experimental literature. Journal of Environmental Psychology, 29(4), 422–433.", note: "Recurring benefits (esp. pain tolerance) but findings overall mixed and methodologically weak. [Moderate — critical review]", link: scholar("Bringslimark Hartig Patil 2009 psychological benefits indoor plants critical review"), kind: "scholar" },
      { cite: "Cummings, B. E., & Waring, M. S. (2020). Potted plants do not improve indoor air quality: a review and analysis of reported VOC removal efficiencies. Journal of Exposure Science & Environmental Epidemiology, 30, 253–261.", note: "Real-room ventilation dwarfs any plant VOC removal; the air-purification claim doesn't hold. [Strong — review]", link: scholar("Cummings Waring 2020 potted plants do not improve indoor air quality VOC"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 123 — GARDENING & HORTICULTURAL THERAPY ═══════════════
  {
    id: "gardening", section: "123", title: "Gardening & Horticultural Therapy", subtitle: "Bolsters clusters: emotional, bodily-kinesthetic, interoceptive",
    evidenceTag: "Moderate",
    feeds: ["mood", "anxiety reduction", "responsibility/routine", "physical activity"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Regular gardening is associated with reduced depression and anxiety and better wellbeing and life satisfaction, with therapeutic horticulture showing the largest effects — it stacks nature, movement, and purpose.",
    callout: "Most primary studies lack active control groups, so effect sizes are likely inflated by expectation; the meta-analytic signal is real but the causal claim is softer than it looks.",
    sources: [
      { cite: "Soga, M., Gaston, K. J., & Yamaura, Y. (2017). Gardening is beneficial for health: a meta-analysis. Preventive Medicine Reports, 5, 92–99.", note: "22 studies: significant reductions in depression/anxiety and gains in life satisfaction, QoL, sense of community. [Strong — meta-analysis]", link: scholar("Soga Gaston Yamaura 2017 gardening beneficial health meta-analysis Preventive Medicine Reports"), kind: "scholar" },
      { cite: "Clatworthy, J., Hinds, J., & Camic, P. M. (2013). Gardening as a mental health intervention: a review. Mental Health Review Journal, 18(4), 214–225.", note: "Consistent reductions in depression/anxiety symptoms, but lack of control groups limits causal inference. [Moderate — review]", link: scholar("Clatworthy Hinds Camic 2013 gardening mental health intervention review"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 124 — THE PET ROCK: TALKING IT OUT ═══════════════
  {
    id: "talking-it-out", section: "124", title: "The Pet Rock — Talking It Out", subtitle: "Bolsters clusters: intrapersonal, emotional, self-regulation",
    evidenceTag: "Moderate",
    feeds: ["emotional regulation", "self-regulation", "intrapersonal insight", "loneliness reduction"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "The honest science behind talking to a 'pet rock' like a confidant. Two validated mechanisms carry it: self-distanced self-talk (addressing yourself by name / 'you') down-regulates emotion, and explaining a problem aloud (to anyone or anything — the 'rubber-duck' effect) improves understanding. The rock just supplies an audience; anthropomorphizing it can also ease loneliness.",
    callout: "Be honest about the leap: no study shows a pet rock heals you. What's validated is that (1) referring to yourself in the second/third person calms you, and (2) articulating reasoning aloud helps you think. The classic emotional-disclosure benefits were shown with writing; spoken-vs-written parity isn't established.",
    sources: [
      { cite: "Kross, E., et al. (2014). Self-talk as a regulatory mechanism: how you do it matters. Journal of Personality and Social Psychology, 106(2), 304–324.", note: "7 studies (N=585): using your own name / non-first-person pronouns during introspection created self-distance and improved emotion regulation under stress. [Strong]", link: scholar("Kross 2014 self-talk regulatory mechanism how you do it matters JPSP 106"), kind: "scholar" },
      { cite: "Moser, J. S., et al. (2017). Third-person self-talk facilitates emotion regulation without engaging cognitive control: converging evidence from ERP and fMRI. Scientific Reports, 7, 4519.", note: "Third-person self-talk reduced neural markers of emotional reactivity without extra cognitive-control cost — a low-effort regulation route. [Strong]", link: scholar("Moser 2017 third-person self-talk emotion regulation ERP fMRI Scientific Reports"), kind: "scholar" },
      { cite: "Chi, M. T. H., et al. (1994). Eliciting self-explanations improves understanding. Cognitive Science, 18(3), 439–477.", note: "Prompting students to explain material aloud to themselves produced markedly better comprehension than re-reading — the 'rubber-duck' effect. [Strong]", link: scholar("Chi de Leeuw Chiu LaVancher 1994 eliciting self-explanations improves understanding Cognitive Science"), kind: "scholar" },
      { cite: "Epley, N., Akalis, S., Waytz, A., & Cacioppo, J. T. (2008). Creating social connection through inferential reproduction: loneliness and perceived agency in gadgets, gods, and greyhounds. Psychological Science, 19(2), 114–120.", note: "Lonely people anthropomorphize gadgets, pets, and deities more — treating nonhuman agents as social others to restore connection. [Moderate]", link: scholar("Epley Akalis Waytz Cacioppo 2008 creating social connection inferential reproduction gadgets gods greyhounds"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 125 — COOKING AT HOME ═══════════════
  {
    id: "cooking", section: "125", title: "Cooking at Home", subtitle: "Bolsters clusters: systemic, volitional, bodily-kinesthetic",
    evidenceTag: "Moderate",
    feeds: ["diet quality", "self-efficacy", "responsibility/routine"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "More frequent home cooking is consistently associated with higher diet quality — more fruit and vegetables, less sugar and fast food — a robust, cheap lever on health.",
    callout: "Nearly all evidence is cross-sectional; people who cook more may differ (income, health motivation), so the causal effect on health outcomes is inferred, not demonstrated by RCT.",
    sources: [
      { cite: "Wolfson, J. A., & Bleich, S. N. (2015). Is cooking at home associated with better diet quality or weight-loss intention? Public Health Nutrition, 18(8), 1397–1406.", note: "NHANES: frequent home dinner cooking linked to healthier diet regardless of weight-loss intent. [Strong — large national survey]", link: scholar("Wolfson Bleich 2015 cooking at home better diet quality weight-loss Public Health Nutrition"), kind: "scholar" },
      { cite: "Mills, S., et al. (2017). Frequency of eating home-cooked meals and potential benefits for diet and health. International Journal of Behavioral Nutrition and Physical Activity, 14, 109.", note: "Eating home-cooked meals >5×/week linked to better diet quality and lower body-fat markers. [Strong — cohort]", link: scholar("Mills Adams 2017 frequency home cooked meals diet health cross-sectional cohort IJBNPA"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 126 — HANDWRITING & LONGHAND NOTES ═══════════════
  {
    id: "handwriting", section: "126", title: "Handwriting & Longhand Notes", subtitle: "Bolsters clusters: meta-cognitive, linguistic, memory",
    evidenceTag: "Mixed",
    feeds: ["memory", "conceptual comprehension", "attention"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Taking notes by hand can beat laptop typing on conceptual understanding, attributed to deeper processing — you summarize instead of transcribing verbatim. The headline effect is real but the replication picture is mixed.",
    callout: "The influential original finding did not cleanly replicate — a preregistered replication found longhand trends but no consistent group differences. Treat 'pen beats keyboard' as plausible and modest, not settled.",
    sources: [
      { cite: "Mueller, P. A., & Oppenheimer, D. M. (2014). The pen is mightier than the keyboard: advantages of longhand over laptop note-taking. Psychological Science, 25(6), 1159–1168.", note: "Across 3 studies, longhand note-takers outperformed laptop typists on conceptual questions. [Moderate — original, replication-contested]", link: scholar("Mueller Oppenheimer 2014 pen mightier keyboard longhand laptop note taking"), kind: "scholar" },
      { cite: "Morehead, K., Dunlosky, J., & Rawson, K. A. (2019). How much mightier is the pen than the keyboard for note-taking? A replication and extension of Mueller and Oppenheimer (2014). Educational Psychology Review, 31, 753–780.", note: "Direct replication: some longhand trends but performance did not consistently differ between groups. [Strong — preregistered replication]", link: scholar("Morehead Dunlosky Rawson 2019 replication extension Mueller Oppenheimer note-taking"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 127 — ACTION VIDEO GAMES ═══════════════
  {
    id: "video-games", section: "127", title: "Action Video Games", subtitle: "Bolsters clusters: spatial, adversarial, attention",
    evidenceTag: "Moderate",
    feeds: ["attention", "spatial cognition", "processing speed"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Action games (fast, target-rich) are linked to better top-down attention and spatial cognition; habitual players outperform non-players and short training shows gains. A real, genre-specific effect.",
    callout: "Much evidence is cross-sectional (self-selection risk), training studies are smaller, and the flagship meta-analysis issued a published correction over participant-overlap/clustering — so temper the training effect size. This is genre-specific, not 'all screen time.'",
    sources: [
      { cite: "Green, C. S., & Bavelier, D. (2003). Action video game modifies visual selective attention. Nature, 423, 534–537.", note: "Action gamers showed enhanced visual attention; a training study argued the effect wasn't pure self-selection. [Moderate — landmark]", link: scholar("Green Bavelier 2003 action video game modifies visual selective attention Nature"), kind: "scholar" },
      { cite: "Bediou, B., et al. (2018). Meta-analysis of action video game impact on perceptual, attentional, and cognitive skills. Psychological Bulletin, 144(1), 77–110.", note: "Cross-sectional g≈0.55; play robustly enhances top-down attention and spatial cognition (correction later issued on clustering). [Strong — meta-analysis w/ correction]", link: scholar("Bediou Bavelier 2018 meta-analysis action video game perceptual attentional cognitive skills"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 128 — BRAIN-TRAINING GAMES: THE HONEST VERDICT ═══════════════
  {
    id: "brain-training", section: "128", title: "Brain-Training Games — The Honest Verdict", subtitle: "You get better at the games — and nothing else",
    evidenceTag: "Strong",
    feeds: ["trained-task performance only — no demonstrated real-world capacity gain"],
    impact: { magnitude: 1, latency: "months", durability: "transient", effort: "moderate" },
    description: "Commercial 'brain-training' makes you better at the trained games but does NOT reliably improve real-world cognition or stave off decline. We include it to say so plainly — a rare case where the honest verdict is negative and well-established.",
    callout: "You improve on the exercises, but benefits don't transfer to untrained tasks or daily life. Marketing claims outrun the evidence. Spend the time on genuinely new skills (Section 36) instead.",
    sources: [
      { cite: "Simons, D. J., et al. (2016). Do 'brain-training' programs work? Psychological Science in the Public Interest, 17(3), 103–186.", note: "Exhaustive review: little credible evidence that brain-training yields broad real-world cognitive benefits. [Strong — comprehensive review]", link: scholar("Simons Boot Charness 2016 do brain-training programs work Psychological Science Public Interest"), kind: "scholar" },
      { cite: "Owen, A. M., et al. (2010). Putting brain training to the test. Nature, 465, 775–778.", note: "~11,000 participants, 6 weeks: gains on trained tasks did not transfer to untrained cognitive tasks. [Strong — large RCT]", link: scholar("Owen Hampshire 2010 putting brain training to the test Nature"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 129 — CHESS & STRATEGY GAMES ═══════════════
  {
    id: "chess", section: "129", title: "Chess & Strategy Games", subtitle: "Bolsters clusters: strategic, adversarial, pattern-recognition",
    evidenceTag: "Mixed",
    feeds: ["math achievement (modest)", "general cognitive ability (modest)"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "high" },
    description: "Chess instruction shows small-to-moderate associations with math and general cognitive gains in schoolchildren — but far transfer is weak and likely inflated by placebo.",
    callout: "Almost none of the studies used active control groups, so the modest math/cognition effects can't be separated from placebo/expectancy. The honest read: far transfer from chess is small and unproven.",
    sources: [
      { cite: "Sala, G., & Gobet, F. (2016). Do the benefits of chess instruction transfer to academic and cognitive skills? A meta-analysis. Educational Research Review, 18, 46–57.", note: "24 studies: math d≈0.38, cognition d≈0.34 — but a near-total lack of active controls is a serious limit. [Strong — meta-analysis]", link: scholar("Sala Gobet 2016 benefits chess instruction transfer academic cognitive skills meta-analysis"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 130 — NAPPING ═══════════════
  {
    id: "napping", section: "130", title: "Napping", subtitle: "Bolsters clusters: interoceptive, memory, most cognitive lines",
    evidenceTag: "Strong",
    feeds: ["alertness", "memory consolidation", "mood", "reaction time"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Short daytime naps reliably restore alertness and can consolidate memory and perceptual learning — a well-timed nap can rival a night's sleep for certain tasks.",
    callout: "Long naps (>30 min) and late-day naps cause sleep inertia (grogginess) and can disrupt nighttime sleep. Benefits depend heavily on length, timing, and the individual — more isn't better.",
    sources: [
      { cite: "Mednick, S., Nakayama, K., & Stickgold, R. (2003). Sleep-dependent learning: a nap is as good as a night. Nature Neuroscience, 6, 697–698.", note: "A 60–90 min nap with SWS+REM produced perceptual learning matching a full night's sleep. [Strong — controlled experiment]", link: scholar("Mednick Nakayama Stickgold 2003 sleep-dependent learning nap as good as a night"), kind: "scholar" },
      { cite: "Milner, C. E., & Cote, K. A. (2009). Benefits of napping in healthy adults: impact of nap length, time of day, age, and experience with napping. Journal of Sleep Research, 18(2), 272–281.", note: "Even well-rested people gain in reaction time, reasoning, and alertness; benefits modulated by length/timing/age. [Strong — review]", link: scholar("Milner Cote 2009 benefits napping healthy adults nap length time of day"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 131 — WEIGHTED BLANKETS ═══════════════
  {
    id: "weighted-blankets", section: "131", title: "Weighted Blankets", subtitle: "Bolsters clusters: interoceptive, emotional (anxiety/sleep)",
    evidenceTag: "Emerging",
    feeds: ["anxiety reduction", "sleep quality"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Weighted blankets show promising reductions in insomnia severity and situational anxiety — but the evidence base is early: small samples, short durations, specific clinical populations.",
    callout: "Evidence is early and thin: the strongest RCT is in psychiatric-disorder patients (not the general population), samples are small, and blinding is hard (you can feel the weight). Don't overstate it as established.",
    sources: [
      { cite: "Ekholm, B., Spulber, S., & Adler, M. (2020). A randomized controlled study of weighted chain blankets for insomnia in psychiatric disorders. Journal of Clinical Sleep Medicine, 16(9), 1567–1577.", note: "120 patients, 4 weeks: weighted-blanket group far more likely to reduce insomnia severity and reach remission vs. light-blanket control. [Strong — RCT, specific population]", link: scholar("Ekholm Spulber Adler 2020 randomized controlled weighted chain blankets insomnia psychiatric"), kind: "scholar" },
      { cite: "Vinson, J., Powers, J., & Mosesso, K. (2020). Weighted blankets: anxiety reduction in adult patients receiving chemotherapy. Clinical Journal of Oncology Nursing, 24(4), 360–368.", note: "Randomized crossover in an infusion center: anxiety reduced when the weighted blanket was used. [Moderate — small crossover RCT]", link: scholar("Vinson Powers Mosesso 2020 weighted blankets anxiety reduction chemotherapy Clinical Journal Oncology Nursing"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 132 — GESTALT THERAPY & EMPTY-CHAIR ═══════════════
  {
    id: "gestalt", section: "132", title: "Gestalt Therapy & Empty-Chair Work", subtitle: "Bolsters clusters: emotional regulation, intrapersonal insight",
    evidenceTag: "Moderate",
    feeds: ["emotional regulation", "intrapersonal insight", "resolving resentment", "quieting the inner critic"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Enacted internal dialogue — addressing an imagined other or a conflicting part of the self in an empty chair — to resolve 'unfinished business' and self-criticism. The specific chair-work protocol has solid RCT support.",
    callout: "Don't overstate: the controlled evidence is for manualized empty-/two-chair tasks inside experiential/emotion-focused therapy — not for classical 'Gestalt therapy as a whole,' which has few modern RCTs and small samples.",
    sources: [
      { cite: "Paivio, S. C., & Greenberg, L. S. (1995). Resolving 'unfinished business': efficacy of experiential therapy using empty-chair dialogue. Journal of Consulting and Clinical Psychology, 63(3), 419–425.", note: "34 clients randomized to empty-chair therapy vs. psychoeducation; the experiential group improved more on all outcomes, gains held to 1 year. [Strong — RCT]", link: scholar("Paivio Greenberg 1995 Resolving unfinished business empty-chair dialogue efficacy"), kind: "scholar" },
      { cite: "Greenberg, L. S., & Malcolm, W. (2002). Resolving unfinished business: relating process to outcome. Journal of Consulting and Clinical Psychology, 70(2), 406–416.", note: "Clients who voiced unmet needs and shifted their view of the other in empty-chair work had better outcomes. [Moderate]", link: scholar("Greenberg Malcolm 2002 Resolving unfinished business relating process to outcome"), kind: "scholar" },
      { cite: "Paivio, S. C., et al. (2001). Imaginal confrontation for resolving child abuse issues. Psychotherapy Research, 11(4), 433–453.", note: "Quality of engagement in empty-chair 'imaginal confrontation' predicted reduction in trauma symptoms among adult survivors. [Moderate]", link: scholar("Paivio Hall Holowaty Jellis Tran 2001 imaginal confrontation child abuse Psychotherapy Research"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 133 — EMOTION-FOCUSED THERAPY (EFT) ═══════════════
  {
    id: "eft", section: "133", title: "Emotion-Focused Therapy (EFT)", subtitle: "Bolsters clusters: emotional, interpersonal, intrapersonal",
    evidenceTag: "Strong",
    feeds: ["relationship quality", "emotional regulation", "intrapersonal insight", "secure connection"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "high" },
    description: "Attachment- and emotion-based therapy that helps people access and transform emotion; the couples variant (EFT-C) restructures negative interaction cycles and is among the more strongly supported couple therapies.",
    callout: "The headline d≈1.3 comes from a 1999 meta-analysis of only four early, developer-involved studies; more recent independent work reports solid but somewhat smaller effects. Treat 1.3 as an early upper bound, not the settled number.",
    sources: [
      { cite: "Johnson, S. M., Hunsley, J., Greenberg, L. S., & Schindler, D. (1999). Emotionally focused couples therapy: status and challenges. Clinical Psychology: Science and Practice, 6(1), 67–79.", note: "Meta-analysis of four rigorous studies; mean effect ≈ 1.3, larger than other couple interventions of the era. [Moderate — small k, developer-involved]", link: scholar("Johnson Hunsley Greenberg Schindler 1999 emotionally focused couples therapy status challenges meta-analysis"), kind: "scholar" },
      { cite: "Wiebe, S. A., & Johnson, S. M. (2016). A review of the research in emotionally focused therapy for couples. Family Process, 55(3), 390–407.", note: "Updates EFT-C evidence: efficacy, attachment-security mechanisms, and durability of gains. [Moderate — review]", link: scholar("Wiebe Johnson 2016 review research emotionally focused therapy couples Family Process"), kind: "scholar" },
      { cite: "Paivio, S. C., & Greenberg, L. S. (1995). Resolving 'unfinished business': efficacy of experiential therapy using empty-chair dialogue. Journal of Consulting and Clinical Psychology, 63(3), 419–425.", note: "RCT of individual experiential/EFT vs. psychoeducation: large, durable advantage. [Strong — RCT]", link: scholar("Paivio Greenberg 1995 experiential therapy empty-chair RCT efficacy"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 134 — COUPLES' SELF-EXPANSION ACTIVITIES ═══════════════
  {
    id: "self-expansion", section: "134", title: "Couples' Novel & Arousing Activities", subtitle: "Bolsters clusters: interpersonal, seductive, emotional",
    evidenceTag: "Strong",
    feeds: ["relationship quality", "shared positive affect", "desire & satisfaction", "self-expansion/growth"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Aron's self-expansion model: doing new, exciting, physiologically arousing activities together — roller-skating is almost the literal example — boosts relationship quality, desire, and satisfaction by re-associating novelty and arousal with the partner.",
    callout: "The active ingredient is novelty/excitement, not just 'time together' — a control study found ordinary pleasant activities did not beat a no-activity control; only the exciting condition helped. Lab effects come from brief tasks; long-run dose-response is less mapped.",
    sources: [
      { cite: "Aron, A., et al. (2000). Couples' shared participation in novel and arousing activities and experienced relationship quality. Journal of Personality and Social Psychology, 78(2), 273–284.", note: "Survey + 3 experiments: 7-minute novel/arousing joint tasks raised relationship quality vs. mundane tasks; boredom mediated. [Strong]", link: scholar("Aron Norman Aron McKenna Heyman 2000 couples novel arousing activities relationship quality JPSP 78"), kind: "scholar" },
      { cite: "Reissman, C., Aron, A., & Bergen, M. R. (1993). Shared activities and marital satisfaction: causal direction and self-expansion versus boredom. Journal of Social and Personal Relationships, 10(2), 243–254.", note: "10-week RCT: 'exciting' activities beat 'pleasant' activities for marital satisfaction; mere activity did not beat control. [Moderate — RCT]", link: scholar("Reissman Aron Bergen 1993 shared activities marital satisfaction self-expansion versus boredom"), kind: "scholar" },
      { cite: "Muise, A., et al. (2019). Broadening your horizons: self-expanding activities promote desire and satisfaction in established romantic relationships. Journal of Personality and Social Psychology, 116(2), 237–258.", note: "Dyadic, daily, longitudinal + experimental evidence that self-expanding activities raise desire and, through it, satisfaction — not reducible to positive affect alone. [Strong]", link: scholar("Muise 2019 broadening your horizons self-expanding activities desire satisfaction JPSP"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 135 — COUPLE FRIENDSHIPS & DOUBLE DATES ═══════════════
  {
    id: "double-dates", section: "135", title: "Couple Friendships & Double Dates", subtitle: "Bolsters clusters: interpersonal, emotional",
    evidenceTag: "Moderate",
    feeds: ["relationship quality", "loneliness reduction", "shared positive affect", "closeness"],
    impact: { magnitude: 3, latency: "days", durability: "sustained", effort: "low" },
    description: "Friendships with other couples (via mutual self-disclosure on double dates) and protected dyadic 'date-night' time both function as relationship maintenance, raising closeness and satisfaction.",
    callout: "Split the evidence honestly: the double-date closeness effect and the closeness-induction procedure are experimental, but the popular 'date night' statistics come from a self-report advocacy report — associational, not causal.",
    sources: [
      { cite: "Slatcher, R. B. (2010). When Harry and Sally met Dick and Jane: creating closeness between couples. Personal Relationships, 17(2), 279–297.", note: "60 couples: a 45-min high-disclosure interaction with another couple raised couple-to-couple AND within-couple closeness; some pairs met again. [Moderate — experimental]", link: scholar("Slatcher 2010 when Harry and Sally met Dick and Jane creating closeness between couples"), kind: "scholar" },
      { cite: "Girme, Y. U., Overall, N. C., & Faingataa, S. (2014). 'Date nights' take two: the maintenance function of shared relationship activities. Personal Relationships, 21(1), 125–149.", note: "196 individuals / 83 couples: satisfying, closeness-building shared activities predicted higher relationship quality — but only when both partners engaged. [Moderate]", link: scholar("Girme Overall Faingataa 2014 date nights take two maintenance function shared relationship activities"), kind: "scholar" },
      { cite: "Aron, A., et al. (1997). The experimental generation of interpersonal closeness: a procedure and some preliminary findings. Personality and Social Psychology Bulletin, 23(4), 363–377.", note: "The 'Fast Friends' escalating-self-disclosure procedure experimentally generates closeness — the mechanism double dates apply. [Strong — for the procedure]", link: scholar("Aron Melinat Aron Vallone Bator 1997 experimental generation interpersonal closeness Fast Friends"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 136 — PARENTING FOR CHILD DEVELOPMENT ═══════════════
  {
    id: "parenting-development", section: "136", title: "Parenting Activities for Child Development", subtitle: "Bolsters clusters: linguistic, meta-cognitive, interpersonal (child)",
    evidenceTag: "Strong",
    feeds: ["cognitive development", "language", "executive function (modestly)", "social competence", "self-regulation"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Which parent behaviors move a child's development the most? The strongest evidence points to responsive/sensitive interaction ('serve-and-return'), dialogic shared reading, and autonomy support — the honest headline is that consistent warmth plus verbal/cognitive stimulation drives gains, not any branded 'brain-boosting' product.",
    callout: "Much observational parenting research confounds genetics, income, and home environment with 'parenting' — the causal claims here survive only because responsive-parenting and dialogic-reading effects were reproduced in randomized trials. Beware commercial 'enrichment' products borrowing that credibility.",
    sources: [
      { cite: "Prime, H., et al. (2023). Positive parenting and early childhood cognition: a systematic review and meta-analysis of randomized controlled trials. Clinical Child and Family Psychology Review, 26, 362–399.", note: "Across 33 RCTs, positive-parenting interventions improved mental abilities (g=0.46) and language (g=0.25); executive-function effects small. [Strong — meta-analysis of RCTs]", link: scholar("Prime Andrews 2023 Positive Parenting Early Childhood Cognition meta-analysis randomized controlled trials"), kind: "scholar" },
      { cite: "Landry, S. H., Smith, K. E., & Swank, P. R. (2006). Responsive parenting: establishing early foundations for social, communication, and independent problem-solving skills. Developmental Psychology, 42(4), 627–642.", note: "Randomized responsive-parenting coaching causally increased infants' social, communication, and cognitive competence. [Strong — RCT]", link: scholar("Landry Smith Swank 2006 Responsive Parenting Establishing Early Foundations Developmental Psychology"), kind: "scholar" },
      { cite: "Grolnick, W. S., & Ryan, R. M. (1989). Parent styles associated with children's self-regulation and competence in school. Journal of Educational Psychology, 81(2), 143–154.", note: "Parental autonomy support predicted children's self-regulation, teacher-rated competence, and school achievement. [Moderate — observational]", link: scholar("Grolnick Ryan 1989 Parent Styles Children's Self-Regulation Competence School"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 137 — CHILD INDEPENDENT MOBILITY ═══════════════
  {
    id: "child-mobility", section: "137", title: "Child Independent Mobility", subtitle: "Bolsters clusters: spatial, bodily-kinesthetic, autonomy (child)",
    evidenceTag: "Moderate",
    feeds: ["physical health", "autonomy/self-efficacy", "spatial/environmental cognition", "social competence"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "low" },
    description: "Letting children travel and roam without constant supervision — walking or cycling to school, a bike at the right age, playing out — is associated with more physical activity, richer spatial cognition, and greater autonomy. This freedom has collapsed historically.",
    callout: "Almost entirely cross-sectional: children permitted to roam differ (safer neighborhoods, more confident/higher-SES families, more capable kids), so mobility may mark advantage as much as cause it. The cognition link appeared in girls but not boys in one key study.",
    sources: [
      { cite: "Schoeppe, S., et al. (2013). Associations of children's independent mobility and active travel with physical activity, sedentary behaviour and weight status: a systematic review. Journal of Science and Medicine in Sport, 16(4), 312–319.", note: "Active travel consistently positively associated with physical activity across studies. [Moderate — systematic review]", link: scholar("Schoeppe Duncan Badland 2013 children's independent mobility active travel physical activity systematic review"), kind: "scholar" },
      { cite: "Rissotto, A., & Tonucci, F. (2002). Freedom of movement and environmental knowledge in elementary school children. Journal of Environmental Psychology, 22(1–2), 65–77.", note: "Children who traveled to school independently showed richer environmental/spatial knowledge than those escorted. [Emerging — correlational]", link: scholar("Rissotto Tonucci 2002 Freedom of movement environmental knowledge elementary school children"), kind: "scholar" },
      { cite: "Martínez-Gómez, D., et al. (2011). Active commuting to school and cognitive performance in adolescents: the AVENA study. Archives of Pediatrics & Adolescent Medicine, 165(4), 300–305.", note: "Active commuting associated with better cognitive performance in adolescent girls (not boys). [Emerging — cross-sectional, sex-specific]", link: scholar("Martinez-Gomez 2011 Active Commuting to School Cognitive Performance Adolescents AVENA"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 138 — FREE & RISKY PLAY ═══════════════
  {
    id: "free-play", section: "138", title: "Free & Risky Play", subtitle: "Bolsters clusters: bodily-kinesthetic, emotional resilience, autonomy (child)",
    evidenceTag: "Moderate",
    feeds: ["physical health", "social competence", "autonomy/self-efficacy", "self-directed problem-solving", "resilience"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Unstructured, child-led, and 'risky' outdoor play (heights, speed, rough-and-tumble, exploring out of sight — and, yes, novel experiences like sleepovers) is linked to better physical activity, social health, and resilience, and may reduce anxiety via graded self-exposure.",
    callout: "Correlation-vs-causation is acute: the decline-of-play thesis is a compelling historical argument, not an experiment, and reviews grade much of the evidence low-quality. There is no meaningful peer-reviewed literature isolating 'sleepovers' — treat that as a slice of general autonomy/novel experience, not its own evidence base.",
    sources: [
      { cite: "Brussoni, M., et al. (2015). What is the relationship between risky outdoor play and health in children? A systematic review. International Journal of Environmental Research and Public Health, 12(6), 6423–6454.", note: "21 studies: risky outdoor play generally positively related to physical activity, social behavior, and reduced problem behavior; evidence graded low-to-moderate. [Moderate — systematic review]", link: scholar("Brussoni Gibbons Gray 2015 risky outdoor play health children systematic review"), kind: "scholar" },
      { cite: "Gray, P. (2011). The decline of play and the rise of psychopathology in children and adolescents. American Journal of Play, 3(4), 443–463.", note: "Argues the multi-decade decline in free play parallels — and plausibly contributes to — rising anxiety and depression. [Emerging — historical/theoretical]", link: scholar("Gray 2011 Decline of Play Rise of Psychopathology Children Adolescents American Journal of Play"), kind: "scholar" },
      { cite: "Sandseter, E. B. H., & Kennair, L. E. O. (2011). Children's risky play from an evolutionary perspective: the anti-phobic effects of thrilling experiences. Evolutionary Psychology, 9(2), 257–284.", note: "Theorizes risky play works like graded exposure, helping children master fears and reducing later anxiety. [Emerging — mechanism]", link: scholar("Sandseter Kennair 2011 Children's Risky Play Evolutionary Perspective Anti-Phobic Effects Thrilling Experiences"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 139 — YOUTH TEAM SPORTS ═══════════════
  {
    id: "youth-team-sports", section: "139", title: "Youth Team Sports", subtitle: "Bolsters clusters: bodily-kinesthetic, interpersonal, executive function (child)",
    evidenceTag: "Moderate",
    feeds: ["social competence", "executive function (in cognitively engaging sports)", "mental health", "autonomy/self-efficacy", "motor skill"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Organized team sport (basketball, soccer) is associated with better psychological and social health, and — when the sport is cognitively demanding (reading play, adapting tactics) — with executive-function gains. Team sport appears more protective for mental health than individual sport.",
    callout: "Heavy self-selection — happier, healthier, more coordinated, better-resourced kids join and stay — inflates the benefit. And 'exercise' alone does little for executive function unless it's cognitively engaging, so generic 'sports = smarter' claims overreach.",
    sources: [
      { cite: "Eime, R. M., et al. (2013). A systematic review of the psychological and social benefits of participation in sport for children and adolescents. International Journal of Behavioral Nutrition and Physical Activity, 10, 98.", note: "Sport — especially club/team sport — associated with better self-esteem, social skills, and fewer depressive symptoms. [Moderate — systematic review]", link: scholar("Eime Young Harvey 2013 psychological social benefits sport participation children adolescents Health through Sport"), kind: "scholar" },
      { cite: "Hoffmann, M. D., et al. (2022). Associations between organized sport participation and mental health difficulties: data from over 11,000 US children and adolescents. PLoS ONE, 17(6), e0268583.", note: "Team-sport participation linked to fewer mental-health difficulties; exclusively individual-sport youth fared worse than non-participants. [Moderate — large cross-sectional]", link: scholar("Hoffmann Barnes Tremblay Guerrero 2022 organized sport participation mental health difficulties PLoS ONE"), kind: "scholar" },
      { cite: "Diamond, A. (2015). Effects of physical exercise on executive functions: going beyond simply moving to moving with thought. Annals of Sports Medicine and Research, 2(1), 1011.", note: "Argues activities that are both physically and cognitively demanding (e.g., strategic team sports) benefit executive function more than plain aerobic exercise. [Emerging — synthesis]", link: scholar("Diamond 2015 Effects Physical Exercise Executive Functions Going Beyond Simply Moving to Moving with Thought"), kind: "scholar" },
    ],
  },

  // ═══════════════ SECTION 140 — GOLF ═══════════════
  {
    id: "golf", section: "140", title: "Golf", subtitle: "Bolsters clusters: bodily-kinesthetic, strategic, systemic, interpersonal",
    evidenceTag: "Moderate",
    feeds: ["physical health", "longevity", "motor & strategic skill", "social connection"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "moderate" },
    description: "Golf provides meaningful moderate-intensity activity, is associated with longer life and lower cardiovascular/mental-health risk, and makes real motor and strategic demands — a lifelong, low-injury sport. Golf-specific cognitive benefits, though, are only weakly evidenced.",
    callout: "Strong healthy-participant/selection bias — golfers skew older-but-affluent, mobile, and health-conscious, and the flagship longevity finding is observational (lower-handicap, more-active golfers lived longest). Golf is not vigorous exercise, and the one cognition RCT was small.",
    sources: [
      { cite: "Murray, A. D., et al. (2017). The relationships between golf and health: a scoping review. British Journal of Sports Medicine, 51(1), 12–19.", note: "Golf associated with improved cardiovascular, metabolic, and mental-health outcomes and moderate physical activity. [Moderate — scoping review]", link: scholar("Murray Daines Archibald 2017 relationships between golf and health scoping review British Journal of Sports Medicine"), kind: "scholar" },
      { cite: "Farahmand, B., et al. (2009). Golf: a game of life and death — reduced mortality in Swedish golf players. Scandinavian Journal of Medicine & Science in Sports, 19(3), 419–424.", note: "In ~300,000 golfers, mortality was ~40% lower than the matched general population, lowest-handicap players best protected. [Moderate — large registry cohort]", link: scholar("Farahmand Broman de Faire 2009 Golf game of life and death reduced mortality Swedish golf players"), kind: "scholar" },
      { cite: "Shimada, H., et al. (2018). Effects of golf training on cognition in older adults: a randomised controlled trial. Journal of Epidemiology and Community Health, 72(10), 944–950.", note: "A 24-week golf program improved logical (episodic) memory in healthy older adults vs. controls. [Emerging — single RCT]", link: scholar("Shimada Lee Doi 2018 Effects of golf training on cognition in older adults randomised controlled trial"), kind: "scholar" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // THE COST OF FAILURE — what breaks when things go wrong (sections 141–190).
  // The mirror of the practice library. No leverage score: these are not things
  // to "do," they are what it costs when the wheels come off. Rated by severity,
  // reversibility, and how soon the damage lands — same evidence discipline,
  // and every entry carries the honest confound/reverse-causation caveat.
  // ── W: relationship & family (141–150) ────────────────────────────────────
  {
    id: "divorce", section: "141", title: "Divorce — Adult Health & Mortality", subtitle: "Degrades: survival, mood, health behaviors, support network",
    evidenceTag: "Strong",
    degrades: ["all-cause survival", "mood stability", "cardiovascular/immune regulation", "sleep & self-care", "economic & social support"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Marital dissolution raises adults' risk of early death, depression, and psychological distress — the toll is sharpest for men and younger adults. Much distress recovers within ~2 years; the mortality signal lingers longest.",
    callout: "Social selection / reverse causation: less healthy, more distressed people are both likelier to divorce and to die early, and effects attenuate with statistical control. The harm is real but partly a marker of pre-existing vulnerability.",
    sources: [
      { cite: "Sbarra, D. A., Law, R. W., & Portley, R. M. (2011). Divorce and Death: A Meta-Analysis and Research Agenda. Perspectives on Psychological Science, 6(5), 454–474.", note: "32 prospective studies, >6.5M people; separated/divorced adults show significantly elevated early-death risk, greatest in men and younger adults. [Strong — meta-analysis]", link: scholar("Sbarra Divorce and Death meta-analysis 2011"), kind: "scholar" },
      { cite: "Amato, P. R. (2000). The Consequences of Divorce for Adults and Children. Journal of Marriage and Family, 62(4), 1269–1287.", note: "Divorce-stress-adjustment review: divorced adults score lower on happiness/health and higher on distress, mediated by economic decline, lost support, and ongoing conflict. [Strong — review]", link: scholar("Amato 2000 consequences of divorce adults children"), kind: "scholar" },
    ],
  },
  {
    id: "custody-conflict", section: "142", title: "High-Conflict Custody Battles", subtitle: "Degrades: child adjustment, parent wellbeing, finances, co-parenting",
    evidenceTag: "Moderate",
    degrades: ["children's emotional/behavioral regulation", "academic performance", "child security", "parental wellbeing & finances", "co-parenting capacity"],
    harm: { severity: 3, onset: "months", reversibility: "partial" },
    description: "Protracted, litigated custody disputes damage children's adjustment and inflict sustained emotional and financial strain on parents. Harm eases when the conflict de-escalates — it is the unresolved conflict, not the divorce itself, that drives most of it.",
    callout: "Confounding: high litigation is a marker of pre-existing parental hostility and psychopathology, so court involvement is a proxy for conflict, not a clean cause of it.",
    sources: [
      { cite: "Grych, J. H., & Fincham, F. D. (1990). Marital Conflict and Children's Adjustment: A Cognitive-Contextual Framework. Psychological Bulletin, 108(2), 267–290.", note: "Interparental conflict harms children via appraisals of threat and self-blame; frequency, intensity, and non-resolution intensify maladjustment. [Strong — foundational]", link: scholar("Grych Fincham cognitive-contextual framework marital conflict"), kind: "scholar" },
      { cite: "Kelly, J. B. (2000). Children's Adjustment in Conflicted Marriage and Divorce: A Decade Review. Journal of the American Academy of Child & Adolescent Psychiatry, 39(8), 963–973.", note: "High, unresolved conflict — not divorce per se — drives child maladjustment; litigation prolongs the exposure. [Moderate — review]", link: scholar("Kelly children's adjustment conflicted marriage divorce decade review"), kind: "scholar" },
    ],
  },
  {
    id: "children-of-divorce", section: "143", title: "Parental Divorce — Effect on Children", subtitle: "Degrades: academics, conduct, self-concept, later relationship stability",
    evidenceTag: "Strong",
    degrades: ["academic achievement", "conduct/behavior regulation", "self-esteem", "peer/social functioning", "later relationship stability"],
    harm: { severity: 3, onset: "months", reversibility: "partial" },
    description: "Children of divorced parents score measurably lower on academic achievement, conduct, adjustment, self-concept, and social relations. Differences are real but on average modest, and most children of divorce fall within the normal range.",
    callout: "Selection and effect size: much of the gap traces to pre-divorce conflict and family factors rather than the divorce event alone. Some outcomes narrow over time; own-divorce risk persists.",
    sources: [
      { cite: "Amato, P. R. (2001). Children of Divorce in the 1990s: An Update of the Amato and Keith Meta-Analysis. Journal of Family Psychology, 15(3), 355–370.", note: "67 studies: children of divorce score significantly lower across achievement, conduct, adjustment, self-concept, and social relations. [Strong — meta-analysis]", link: scholar("Amato 2001 children of divorce 1990s meta-analysis"), kind: "scholar" },
      { cite: "Amato, P. R., & Keith, B. (1991). Parental Divorce and the Well-Being of Children: A Meta-Analysis. Psychological Bulletin, 110(1), 26–46.", note: "Original meta-analysis establishing consistent small-to-moderate deficits across well-being domains. [Strong — meta-analysis]", link: scholar("Amato Keith 1991 parental divorce well-being children meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "infidelity", section: "144", title: "Infidelity / Betrayal Trauma", subtitle: "Degrades: mood, trust & attachment, self-worth, sleep",
    evidenceTag: "Moderate",
    degrades: ["mood (major depression)", "anxiety/hyperarousal", "trust & attachment security", "self-worth", "sleep & intrusive-thought control"],
    harm: { severity: 3, onset: "immediate", reversibility: "partial" },
    description: "Discovered infidelity precipitates major depressive episodes and PTSD-like intrusive and hyperarousal symptoms in the betrayed partner. The acute episode often remits; the trust injury can be lasting.",
    callout: "Small samples and cross-sectional designs; infidelity co-occurs with marital discord and separation, so isolating betrayal's unique effect is hard. Cano's landmark study had n≈25 per group.",
    sources: [
      { cite: "Cano, A., & O'Leary, K. D. (2000). Infidelity and Separations Precipitate Major Depressive Episodes. Journal of Consulting and Clinical Psychology, 68(5), 774–781.", note: "Women who experienced a humiliating marital event were ~6x more likely to be diagnosed with a major depressive episode, controlling for discord and depression history. [Moderate]", link: scholar("Cano O'Leary 2000 infidelity major depressive episodes"), kind: "scholar" },
      { cite: "Gordon, K. C., Baucom, D. H., & Snyder, D. K. (2004). An Integrative Intervention for Promoting Recovery from Extramarital Affairs. Journal of Marital and Family Therapy, 30(2), 213–231.", note: "Frames affair discovery as an interpersonal trauma producing PTSD-like intrusion, avoidance, and hyperarousal. [Moderate]", link: scholar("Gordon Baucom Snyder affair recovery trauma model"), kind: "scholar" },
    ],
  },
  {
    id: "widowhood", section: "145", title: "Spousal Bereavement / Widowhood", subtitle: "Degrades: survival, cardiovascular & immune function, mood, self-care",
    evidenceTag: "Strong",
    degrades: ["survival (esp. men, first 6 months)", "cardiovascular function", "immune function", "mood & appetite", "medication adherence"],
    harm: { severity: 4, onset: "immediate", reversibility: "partial" },
    description: "Losing a spouse raises the survivor's own risk of death and physical/mental illness, concentrated in the first months after loss. Elevated risk declines after the acute period.",
    callout: "Shared-environment and homogamy confounds (couples share habits and exposures). The effect is strong early but attenuates, and in pooled data is near-null for women.",
    sources: [
      { cite: "Moon, J. R., Kondo, N., Glymour, M. M., & Subramanian, S. V. (2011). Widowhood and Mortality: A Meta-Analysis. PLoS ONE, 6(8), e23465.", note: "15 cohorts, ~2.26M subjects: mortality RR 1.41 within 6 months of bereavement, 1.14 after; significant for men, near-null for women. [Strong — meta-analysis]", link: scholar("Moon 2011 widowhood mortality meta-analysis PLoS ONE"), kind: "scholar" },
      { cite: "Stroebe, M., Schut, H., & Stroebe, W. (2007). Health Outcomes of Bereavement. The Lancet, 370(9603), 1960–1973.", note: "Bereavement carries excess mortality risk (esp. early weeks) plus decrements in physical and mental health and more medical-service use. [Strong — review]", link: scholar("Stroebe Schut Stroebe 2007 health outcomes bereavement Lancet"), kind: "scholar" },
    ],
  },
  {
    id: "death-of-child", section: "146", title: "Death of a Child", subtitle: "Degrades: mood, physical health, marital stability, survival",
    evidenceTag: "Strong",
    degrades: ["mood (chronic depression, prolonged grief)", "overall physical health", "marital stability", "life purpose", "survival (esp. mothers)"],
    harm: { severity: 5, onset: "immediate", reversibility: "lasting" },
    description: "Bereaved parents suffer among the most severe and enduring grief, with lasting depression, poorer health, marital disruption, and elevated mortality — still detectable 15–18+ years later.",
    callout: "Cause-of-death confounds: some parental mortality/health effects reflect shared genetics or circumstances rather than grief alone, and effects differ by parent gender. Partial recovery is aided by life purpose and surviving children.",
    sources: [
      { cite: "Rogers, C. H., Floyd, F. J., Seltzer, M. M., Greenberg, J., & Hong, J. (2008). Long-Term Effects of the Death of a Child on Parents' Adjustment in Midlife. Journal of Family Psychology, 22(2), 203–211.", note: "~18 years post-loss, bereaved parents had more depressive symptoms, poorer wellbeing, more health problems, and more marital disruption than matched parents. [Strong]", link: scholar("Rogers 2008 long-term death of a child parents midlife"), kind: "scholar" },
      { cite: "Li, J., Precht, D. H., Mortensen, P. B., & Olsen, J. (2003). Mortality in Parents After Death of a Child in Denmark. The Lancet, 361(9355), 363–367.", note: "Register study of 21,062 bereaved parents: increased overall mortality in mothers (HR 1.43) and increased early unnatural-cause death in fathers. [Strong — register cohort]", link: scholar("Li 2003 mortality parents after death of a child Denmark Lancet"), kind: "scholar" },
    ],
  },
  {
    id: "death-of-parent", section: "147", title: "Death of a Parent in Adulthood", subtitle: "Degrades: mood, life satisfaction, grief functioning",
    evidenceTag: "Moderate",
    degrades: ["mood (depressive symptoms)", "life satisfaction", "grief-related functioning", "somatic symptoms"],
    harm: { severity: 2, onset: "immediate", reversibility: "recovers" },
    description: "Losing a parent as an adult raises depressive symptoms and grief burden, with a meaningful minority (~15–20%) developing prolonged grief disorder. For most it eases over ~1–2 years.",
    callout: "A normative, often-anticipated event; effects are on average smaller and shorter-lived than spousal or child loss and depend heavily on relationship quality, timing, and expectedness. Caregiving strain can precede the death (reverse causation).",
    sources: [
      { cite: "Kamis, C., Stolte, A., & Copeland, M. (2022). Parental Death and Mid-adulthood Depressive Symptoms. Journal of Health and Social Behavior, 63(1), 105–121.", note: "Parental death in adulthood predicts heightened depressive symptoms, varying by life-course stage and parent gender. [Moderate]", link: scholar("Kamis 2022 parental death mid-adulthood depressive symptoms"), kind: "scholar" },
      { cite: "Marks, N. F., Jun, H., & Song, J. (2007). Death of Parents and Adult Psychological and Physical Well-Being. Journal of Family Issues, 28(12), 1611–1638.", note: "Prospective national data: parental death is associated with declines in adult psychological and physical well-being. [Moderate]", link: scholar("Marks Jun Song death of parents adult well-being national study"), kind: "scholar" },
    ],
  },
  {
    id: "caregiver-dementia", section: "148", title: "Dementia Caregiving Strain", subtitle: "Degrades: mood, immune & cardiovascular health, sleep, survival",
    evidenceTag: "Strong",
    degrades: ["mood (depression/anxiety)", "stress-hormone & immune regulation", "cardiovascular health", "self-care & sleep", "survival"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Chronic strained caregiving raises the caregiver's own risk of depression, physiological dysregulation, illness, and death. It improves after caregiving ends — though bereavement may follow.",
    callout: "The hazard is specific to STRAINED caregiving: non-strained caregivers and some population samples show no excess mortality (occasionally lower). Healthy-selection into the role complicates estimates.",
    sources: [
      { cite: "Schulz, R., & Beach, S. R. (1999). Caregiving as a Risk Factor for Mortality: The Caregiver Health Effects Study. JAMA, 282(23), 2215–2219.", note: "Elderly spousal caregivers reporting strain had 63% higher mortality (RR 1.63) than noncaregivers over 4 years. [Strong — prospective; note later work qualifies the mortality claim]", link: scholar("Schulz Beach 1999 caregiving risk factor mortality JAMA"), kind: "scholar" },
      { cite: "Vitaliano, P. P., Zhang, J., & Scanlan, J. M. (2003). Is Caregiving Hazardous to One's Physical Health? A Meta-Analysis. Psychological Bulletin, 129(6), 946–972.", note: "23 studies: caregivers show worse health than matched noncaregivers, strongest for stress hormones, antibodies, and global health. [Strong — meta-analysis]", link: scholar("Vitaliano 2003 is caregiving hazardous physical health meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "loneliness", section: "149", title: "Chronic Loneliness", subtitle: "Degrades: survival, mood, executive function, memory, cardiovascular",
    evidenceTag: "Strong",
    degrades: ["survival", "mood (depression/anxiety)", "executive function & memory", "sleep", "immune/cardiovascular regulation"],
    harm: { severity: 4, onset: "years", reversibility: "partial" },
    description: "Persistent loneliness independently raises risk of early death, depression, and cognitive/dementia decline. Mood and risk improve when the loneliness is relieved.",
    callout: "Reverse causation is central — early cognitive decline, depression, and poor health cause withdrawal, not only the reverse. Loneliness (subjective) and isolation (objective) are distinct and only modestly correlated.",
    sources: [
      { cite: "Holt-Lunstad, J., Smith, T. B., Baker, M., Harris, T., & Stephenson, D. (2015). Loneliness and Social Isolation as Risk Factors for Mortality. Perspectives on Psychological Science, 10(2), 227–237.", note: "Loneliness raised mortality odds 26% (isolation 29%, living alone 32%) across studies controlling for confounds. [Strong — meta-analysis]", link: scholar("Holt-Lunstad 2015 loneliness social isolation mortality meta-analysis"), kind: "scholar" },
      { cite: "Cacioppo, J. T., Hughes, M. E., Waite, L. J., Hawkley, L. C., & Thisted, R. A. (2006). Loneliness as a Specific Risk Factor for Depressive Symptoms. Psychology and Aging, 21(1), 140–151.", note: "Loneliness prospectively predicts increases in depressive symptoms independent of related risk factors. [Strong — longitudinal]", link: scholar("Cacioppo 2006 loneliness specific risk factor depressive symptoms"), kind: "scholar" },
    ],
  },
  {
    id: "social-isolation", section: "150", title: "Social Isolation", subtitle: "Degrades: survival, global cognition, cardiovascular health, care access",
    evidenceTag: "Strong",
    degrades: ["survival", "global cognition (attention, memory, language)", "cardiovascular/inflammatory health", "physical activity", "access to care & support"],
    harm: { severity: 4, onset: "years", reversibility: "partial" },
    description: "Objective lack of social contact raises risk of death and accelerates cognitive decline and dementia in older adults. Reconnection lowers risk; established cognitive decline is harder to reverse.",
    callout: "Selection and reverse causation — declining health and incipient dementia reduce participation, inflating apparent isolation effects; isolation bundles with poverty, disability, and widowhood.",
    sources: [
      { cite: "Holt-Lunstad, J., Smith, T. B., Baker, M., Harris, T., & Stephenson, D. (2015). Loneliness and Social Isolation as Risk Factors for Mortality. Perspectives on Psychological Science, 10(2), 227–237.", note: "Objective isolation raised mortality odds ~29%, comparable to established risk factors, consistent across gender and region. [Strong — meta-analysis]", link: scholar("Holt-Lunstad 2015 social isolation mortality meta-analysis"), kind: "scholar" },
      { cite: "Kuiper, J. S., Zuidersma, M., Oude Voshaar, R. C., et al. (2015). Social Relationships and Risk of Dementia: A Systematic Review and Meta-Analysis. Ageing Research Reviews, 22, 39–57.", note: "Poor social participation, less contact, and loneliness are each associated with increased incident dementia risk across cohorts. [Strong — meta-analysis]", link: scholar("Kuiper 2015 social relationships risk of dementia meta-analysis"), kind: "scholar" },
    ],
  },
  // ── X: health & physiological (151–160) ───────────────────────────────────
  {
    id: "chemo-brain", section: "151", title: "Cancer & \"Chemo Brain\" (CRCI)", subtitle: "Degrades: working memory, processing speed, attention, executive function",
    evidenceTag: "Strong",
    degrades: ["working memory", "processing speed", "attention", "executive function", "verbal memory"],
    harm: { severity: 3, onset: "months", reversibility: "partial" },
    description: "Cancer and cytotoxic treatment degrade memory, processing speed, attention, and executive function in a substantial minority — well documented in breast cancer. Many recover within a year; a subset persists.",
    callout: "Multi-causal: disentangling drug effects from the cancer itself, anesthesia, fatigue, depression, hormonal therapy, and aging is hard, and a subset shows deficits BEFORE any chemotherapy — so \"chemo brain\" is partly a misnomer.",
    sources: [
      { cite: "Janelsins, M. C., Kesler, S. R., Ahles, T. A., & Morrow, G. R. (2014). Prevalence, mechanisms, and management of cancer-related cognitive impairment. International Review of Psychiatry, 26(1), 102–113.", note: "Reviews CRCI prevalence/mechanisms; deficits documented in a large share of chemotherapy-treated patients, some persisting. [Strong — review]", link: scholar("Janelsins 2014 prevalence mechanisms cancer-related cognitive impairment"), kind: "scholar" },
      { cite: "Wefel, J. S., Kesler, S. R., Noll, K. R., & Schagen, S. B. (2015). Clinical characteristics, pathophysiology, and management of noncentral nervous system cancer-related cognitive impairment. CA: A Cancer Journal for Clinicians, 65(2), 123–138.", note: "Synthesizes memory/attention/processing-speed/executive impairment post-treatment and candidate mechanisms. [Strong — review]", link: scholar("Wefel 2015 noncentral nervous system cancer-related cognitive impairment CA Cancer J Clin"), kind: "scholar" },
    ],
  },
  {
    id: "illness-depression", section: "152", title: "Chronic Illness + Comorbid Depression", subtitle: "Degrades: mood, motivation, energy, self-care adherence",
    evidenceTag: "Strong",
    degrades: ["mood", "motivation & energy", "self-care adherence", "overall health-state", "concentration"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Chronic physical disease frequently carries comorbid depression, which worsens overall health MORE than the physical disease alone — dragging down mood, motivation, and function on top of the underlying condition. Depression is treatable even where the disease is not.",
    callout: "Cross-sectional and bidirectional: depression worsens chronic-disease outcomes, but chronic disease and disability also cause depression. The World Health Surveys measure association and health decrement, not a clean causal arrow.",
    sources: [
      { cite: "Moussavi, S., Chatterji, S., Verdes, E., Tandon, A., Patel, V., & Ustun, B. (2007). Depression, chronic diseases, and decrements in health: results from the World Health Surveys. The Lancet, 370(9590), 851–858.", note: "240,000+ people, 60 countries: depression produces the largest health decrement of the conditions studied; comorbid depression worsens health beyond any chronic disease alone. [Strong — very large survey]", link: scholar("Moussavi 2007 depression chronic diseases decrements World Health Surveys"), kind: "scholar" },
    ],
  },
  {
    id: "chronic-pain", section: "153", title: "Chronic Pain — Cognition & Gray Matter", subtitle: "Degrades: attention, executive function, working memory, gray matter",
    evidenceTag: "Moderate",
    degrades: ["attention", "executive function", "working memory", "prefrontal & thalamic gray matter"],
    harm: { severity: 3, onset: "months", reversibility: "partial" },
    description: "Persistent pain competes for attentional and executive resources and is associated with measurable loss of neocortical gray matter — chronic back-pain patients showed 5–11% less. Some atrophy appears reversible after successful pain treatment.",
    callout: "The gray-matter link is largely cross-sectional; reverse or shared causation (pre-existing brain differences, medication, inactivity) is not excluded. The landmark imaging cohort was small (n=26).",
    sources: [
      { cite: "Moriarty, O., McGuire, B. E., & Finn, D. P. (2011). The effect of pain on cognitive function: a review of clinical and preclinical research. Progress in Neurobiology, 93(3), 385–404.", note: "Reviews pain-related impairment of attention, executive and general cognition across clinical and animal studies. [Moderate — review]", link: scholar("Moriarty 2011 effect of pain on cognitive function review"), kind: "scholar" },
      { cite: "Apkarian, A. V., et al. (2004). Chronic back pain is associated with decreased prefrontal and thalamic gray matter density. Journal of Neuroscience, 24(46), 10410–10415.", note: "CBP patients had 5–11% less neocortical gray matter (≈10–20 yrs of aging), loss scaling with pain duration. [Moderate — small n]", link: scholar("Apkarian 2004 chronic back pain decreased prefrontal thalamic gray matter"), kind: "scholar" },
    ],
  },
  {
    id: "allostatic-load", section: "154", title: "Chronic Stress / Allostatic Load", subtitle: "Degrades: hippocampal structure, memory, emotional regulation, telomeres",
    evidenceTag: "Moderate",
    degrades: ["hippocampal/prefrontal structure", "declarative memory", "emotional regulation", "executive control", "cellular longevity (telomeres)"],
    harm: { severity: 3, onset: "years", reversibility: "partial" },
    description: "Prolonged stress-mediator exposure (\"allostatic load\") produces wear-and-tear: hippocampal and prefrontal remodeling, impaired memory and emotional regulation, and accelerated cellular aging. Some stress-induced remodeling can reverse.",
    callout: "The human telomere finding (Epel 2004) is small (n≈58) and cross-sectional, and later studies show smaller/heterogeneous effects. The brain-remodeling detail rests heavily on animal models — do not overstate \"stress shrinks your DNA.\"",
    sources: [
      { cite: "McEwen, B. S. (1998). Protective and damaging effects of stress mediators. New England Journal of Medicine, 338(3), 171–179.", note: "Defines allostatic load; chronic stress-mediator overexposure damages neural, endocrine, and immune systems. [Strong framework]", link: scholar("McEwen 1998 protective and damaging effects of stress mediators"), kind: "scholar" },
      { cite: "Epel, E. S., Blackburn, E. H., Lin, J., et al. (2004). Accelerated telomere shortening in response to life stress. PNAS, 101(49), 17312–17315.", note: "Higher perceived/chronic stress associated with shorter telomeres and lower telomerase — markers of cell aging. [Moderate — small cross-sectional]", link: scholar("Epel 2004 accelerated telomere shortening life stress"), kind: "scholar" },
    ],
  },
  {
    id: "sleep-deprivation", section: "155", title: "Sleep Deprivation — Cognition & Emotion", subtitle: "Degrades: attention, working memory, learning, executive & emotional control",
    evidenceTag: "Strong",
    degrades: ["sustained attention/vigilance", "working memory", "learning & consolidation", "executive function", "emotional regulation & risk judgment"],
    harm: { severity: 3, onset: "immediate", reversibility: "recovers" },
    description: "Sleep loss degrades alertness, vigilance, working memory, learning, and executive/emotional regulation. Because experiments impose the deprivation, causation here is unusually clean. Largely restored with recovery sleep; chronic loss carries lasting metabolic risk.",
    callout: "Wide individual variability in vulnerability; much lab work uses acute total deprivation, which may not map linearly onto real-world chronic partial sleep restriction.",
    sources: [
      { cite: "Killgore, W. D. S. (2010). Effects of sleep deprivation on cognition. Progress in Brain Research, 185, 105–129.", note: "Reviews 50+ studies; sleep loss impairs alertness, attention, memory, and executive functioning, not uniformly across domains. [Strong — review of experiments]", link: scholar("Killgore 2010 effects of sleep deprivation on cognition"), kind: "scholar" },
      { cite: "Van Dongen, H. P. A., Maislin, G., Mullington, J. M., & Dinges, D. F. (2003). The cumulative cost of additional wakefulness. Sleep, 26(2), 117–126.", note: "Dose-response: chronic 4–6h/night accumulates to deficits ~= 2–3 nights of total deprivation. [Strong — controlled]", link: scholar("Van Dongen 2003 cumulative cost wakefulness sleep restriction"), kind: "scholar" },
    ],
  },
  {
    id: "obesity-cognition", section: "156", title: "Obesity — Cognition & Brain Structure", subtitle: "Degrades: executive function, memory, attention, gray matter",
    evidenceTag: "Moderate",
    degrades: ["executive function", "memory", "attention", "processing speed", "frontal/temporal/hippocampal gray matter"],
    harm: { severity: 3, onset: "years", reversibility: "partial" },
    description: "Higher BMI is associated with impairments across nearly all cognitive domains and with brain atrophy in frontal lobes, hippocampus, thalamus, and anterior cingulate. Some cognitive gains after weight loss are reported.",
    callout: "The independent effect over and above hypertension, diabetes, sleep apnea, and vascular disease remains ambiguous. Reverse causation is plausible: executive deficits can drive obesity, not only follow it.",
    sources: [
      { cite: "Prickett, C., Brennan, L., & Stolwyk, R. (2015). Examining the relationship between obesity and cognitive function: a systematic literature review. Obesity Research & Clinical Practice, 9(2), 93–113.", note: "Impairments across almost all cognitive domains in obese adults; independent effect remains ambiguous. [Moderate — systematic review]", link: scholar("Prickett 2015 obesity cognitive function systematic review"), kind: "scholar" },
      { cite: "Raji, C. A., Ho, A. J., Parikshak, N. N., et al. (2010). Brain structure and obesity. Human Brain Mapping, 31(3), 353–364.", note: "Higher BMI negatively correlated with brain volume; obese subjects showed atrophy in frontal lobes, anterior cingulate, hippocampus, and thalamus. [Moderate]", link: scholar("Raji 2010 brain structure and obesity Human Brain Mapping"), kind: "scholar" },
    ],
  },
  {
    id: "smoking", section: "157", title: "Smoking — Cognitive Decline & Dementia", subtitle: "Degrades: global cognition, memory, processing speed, gray matter",
    evidenceTag: "Strong",
    degrades: ["global cognition", "memory", "processing speed", "cerebral gray matter", "elevated Alzheimer's neuropathology"],
    harm: { severity: 4, onset: "years", reversibility: "partial" },
    description: "Active and former smoking is associated with significantly increased Alzheimer's risk, greater neuritic-plaque burden, and cerebral oxidative stress. Cessation lowers future risk; accumulated neuropathology is lasting.",
    callout: "Historically confounded — several older, tobacco-industry-linked studies suggested a protective effect via competing mortality (smokers dying before dementia onset). The modern consensus is increased risk, but survivor bias haunts the older record.",
    sources: [
      { cite: "Durazzo, T. C., Mattsson, N., Weiner, M. W., & ADNI (2014). Smoking and increased Alzheimer's disease risk: a review of potential mechanisms. Alzheimer's & Dementia, 10(3 Suppl), S122–S145.", note: "Active/former smoking significantly raises AD risk; higher plaque burden; oxidative stress as mechanism; ~14% of AD cases worldwide attributed to smoking. [Strong — review + autopsy/epi]", link: scholar("Durazzo 2014 smoking increased Alzheimer's disease risk mechanisms"), kind: "scholar" },
    ],
  },
  {
    id: "alcohol-brain", section: "158", title: "Alcohol — Brain Damage & Cognition", subtitle: "Degrades: hippocampal volume, executive function, fluid intelligence",
    evidenceTag: "Strong",
    degrades: ["hippocampal volume", "executive function", "fluid intelligence", "verbal fluency", "white-matter integrity"],
    harm: { severity: 4, onset: "years", reversibility: "partial" },
    description: "Alcohol is associated with brain atrophy (notably hippocampus), iron accumulation, and cognitive decline — detectable even at \"moderate\" intake and steeper in heavy use. Some recovery with abstinence; severe Wernicke-Korsakoff damage is lasting.",
    callout: "The flagship cohorts study MODERATE drinkers, not diagnosed alcohol use disorder, so extrapolation to AUD is directional. Observational alcohol research suffers the \"sick-quitter\" problem; Topiwala 2022's Mendelian-randomization arm helps point toward causation.",
    sources: [
      { cite: "Topiwala, A., Allan, C. L., Valkanova, V., et al. (2017). Moderate alcohol consumption as a risk factor for adverse brain outcomes and cognitive decline. BMJ, 357, j2353.", note: "30-yr Whitehall II cohort: higher alcohol linked to hippocampal atrophy and faster cognitive decline; no protective effect of light drinking on brain. [Strong — long cohort]", link: scholar("Topiwala 2017 moderate alcohol adverse brain outcomes cognitive decline BMJ"), kind: "scholar" },
      { cite: "Topiwala, A., Wang, C., Ebmeier, K. P., et al. (2022). Associations between moderate alcohol consumption, brain iron, and cognition in UK Biobank. PLOS Medicine, 19(7), e1004039.", note: "≥7 units/week associated with higher brain iron; higher iron linked to poorer executive function and fluid intelligence; MR supports a causal pathway. [Strong — cohort + MR]", link: scholar("Topiwala 2022 alcohol brain iron cognition UK Biobank"), kind: "scholar" },
    ],
  },
  {
    id: "inactivity", section: "159", title: "Physical Inactivity / Sedentary Behavior", subtitle: "Degrades: cardiovascular & metabolic health, life expectancy, cognition",
    evidenceTag: "Strong",
    degrades: ["cardiovascular/metabolic health", "life expectancy", "memory & executive function", "dementia-free survival"],
    harm: { severity: 4, onset: "years", reversibility: "partial" },
    description: "Inactivity raises risk of coronary heart disease, type 2 diabetes, cancers, and premature death — ~5.3 million deaths/year — and high sedentary time is linked to cognitive decline. Becoming active substantially reduces risk.",
    callout: "On the cognition/dementia side reverse causation bites hardest: early, undiagnosed neurodegeneration reduces activity, so low activity may be an early symptom. High activity can largely offset sitting-related mortality risk.",
    sources: [
      { cite: "Lee, I. M., Shiroma, E. J., Lobelo, F., Puska, P., Blair, S. N., & Katzmarzyk, P. T. (2012). Effect of physical inactivity on major non-communicable diseases worldwide. The Lancet, 380(9838), 219–229.", note: "Inactivity causally implicated in CHD, T2D, breast/colon cancer; ~5.3 million deaths/yr attributable; shortens life expectancy. [Strong]", link: scholar("Lee 2012 physical inactivity major non-communicable diseases Lancet"), kind: "scholar" },
      { cite: "Ekelund, U., Steene-Johannessen, J., Brown, W. J., et al. (2016). Does physical activity attenuate the detrimental association of sitting time with mortality? A harmonised meta-analysis of >1 million people. The Lancet, 388(10051), 1302–1310.", note: "High sitting time raises mortality risk; ~60–75 min/day of moderate activity offsets it. [Strong — meta-analysis]", link: scholar("Ekelund 2016 sitting time physical activity mortality harmonised meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "sarcopenia", section: "160", title: "Sarcopenia — Age-Related Muscle Loss", subtitle: "Degrades: strength, gait speed, physical function, independence",
    evidenceTag: "Strong",
    degrades: ["muscle strength", "gait speed", "physical function", "independence", "raises falls/fractures/mortality"],
    harm: { severity: 4, onset: "years", reversibility: "partial" },
    description: "Progressive loss of skeletal-muscle mass and strength with age — a recognized muscle disease driving falls, fractures, disability, loss of independence, and increased mortality. Resistance training + protein can rebuild strength.",
    callout: "Prevalence and outcome estimates vary with diagnostic cutoffs (EWGSOP2 revised the 2010 criteria). Low activity, poor nutrition, and comorbidity co-drive it, so it is partly a downstream marker of overall frailty.",
    sources: [
      { cite: "Cruz-Jentoft, A. J., Bahat, G., Bauer, J., et al. (2019). Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age and Ageing, 48(1), 16–31.", note: "Defines sarcopenia as a progressive skeletal-muscle disorder associated with falls, fractures, disability, and mortality. [Strong — consensus on extensive prospective evidence]", link: scholar("Cruz-Jentoft 2019 sarcopenia revised European consensus EWGSOP2"), kind: "scholar" },
    ],
  },
  // ── Y: psychological (161–170) ────────────────────────────────────────────
  {
    id: "depression-hippocampus", section: "161", title: "Depression — Hippocampal Volume Loss", subtitle: "Degrades: recollection memory, learning, stress regulation",
    evidenceTag: "Strong",
    degrades: ["declarative/recollection memory", "learning", "stress regulation (HPA axis)", "treatment responsiveness"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Repeated or prolonged untreated depression is associated with shrinkage of the hippocampus and impairment of the memory that depends on it — and the loss scales with how long depression goes untreated. Early treatment appears protective.",
    callout: "Causal direction is partly contested — smaller hippocampi may be both a consequence AND a pre-existing vulnerability. Volume effects are modest group-level averages, not diagnostic of any individual.",
    sources: [
      { cite: "Sheline, Y. I., Gado, M. H., & Kraemer, H. C. (2003). Untreated Depression and Hippocampal Volume Loss. American Journal of Psychiatry, 160(8), 1516–1518.", note: "Longer duration of depression untreated by antidepressants predicted hippocampal volume reduction; time treated did not. [Strong]", link: scholar("Sheline 2003 untreated depression hippocampal volume loss"), kind: "scholar" },
      { cite: "MacQueen, G. M., et al. (2003). Course of illness, hippocampal function, and hippocampal volume in major depression. PNAS, 100(3), 1387–1392.", note: "Recollection-memory impairment present even in first-episode patients; bilateral hippocampal volume reductions with multiple episodes. [Strong]", link: scholar("MacQueen 2003 course of illness hippocampal function volume major depression"), kind: "scholar" },
    ],
  },
  {
    id: "chronic-anxiety", section: "162", title: "Chronic Anxiety — Cognition & Cardiac Risk", subtitle: "Degrades: executive function, attention, cardiovascular health",
    evidenceTag: "Strong",
    degrades: ["central-executive function (inhibition, shifting)", "sustained attention", "cardiovascular health", "behavioral approach (avoidance narrows life)"],
    harm: { severity: 4, onset: "immediate", reversibility: "partial" },
    description: "Sustained anxiety consumes attentional/working-memory resources (you may hold performance up only by burning far more mental effort) and independently raises coronary-heart-disease risk over years. Cognitive load lifts as anxiety remits; vascular risk is harder to undo.",
    callout: "Attentional Control Theory predicts anxiety harms processing EFFICIENCY more than final performance. The CHD meta-analysis is observational; residual confounding can't be fully excluded despite adjustment.",
    sources: [
      { cite: "Eysenck, M. W., Derakshan, N., Santos, R., & Calvo, M. G. (2007). Anxiety and Cognitive Performance: Attentional Control Theory. Emotion, 7(2), 336–353.", note: "Anxiety impairs the central executive and attentional control, degrading processing efficiency more than performance effectiveness. [Strong]", link: scholar("Eysenck 2007 attentional control theory anxiety cognitive performance"), kind: "scholar" },
      { cite: "Roest, A. M., Martens, E. J., de Jonge, P., & Denollet, J. (2010). Anxiety and Risk of Incident Coronary Heart Disease: A Meta-Analysis. Journal of the American College of Cardiology, 56(1), 38–46.", note: "Across ~249,846 persons, anxiety predicted incident CHD (HR 1.26) and cardiac death (HR 1.48), independent of biological and behavioral risk factors. [Strong — meta-analysis]", link: scholar("Roest 2010 anxiety incident coronary heart disease meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "rumination", section: "163", title: "Rumination — Deepens Depression", subtitle: "Degrades: problem-solving, motivated action, social support, stress recovery",
    evidenceTag: "Strong",
    degrades: ["problem-solving", "instrumental/goal-directed behavior", "social support", "emotion regulation", "physiological stress recovery"],
    harm: { severity: 4, onset: "immediate", reversibility: "recovers" },
    description: "Repetitively dwelling on distress doesn't discharge it — it deepens and prolongs it, amplifying negative thinking, impairing problem-solving, and eroding social support. It is a modifiable process (targetable via rumination-focused CBT).",
    callout: "Rumination predicts the ONSET of depression more consistently than its duration. The cortisol/physiological pathway is genuinely inconsistent: state-rumination associates with higher cortisol, but depression-focused rumination scales sometimes don't.",
    sources: [
      { cite: "Nolen-Hoeksema, S., Wisco, B. E., & Lyubomirsky, S. (2008). Rethinking Rumination. Perspectives on Psychological Science, 3(5), 400–424.", note: "Rumination exacerbates depression, enhances negative thinking, impairs problem solving, interferes with instrumental behavior, and erodes social support. [Strong]", link: scholar("Nolen-Hoeksema 2008 Rethinking Rumination"), kind: "scholar" },
      { cite: "Nolen-Hoeksema, S. (1991). Responses to depression and their effects on the duration of depressive episodes. Journal of Abnormal Psychology, 100(4), 569–582.", note: "Foundational: a ruminative response style prolongs depressive episodes. [Moderate–Strong — seminal]", link: scholar("Nolen-Hoeksema 1991 responses to depression duration depressive episodes"), kind: "scholar" },
    ],
  },
  {
    id: "hostility", section: "164", title: "Chronic Hostility / Anger — CVD", subtitle: "Degrades: cardiovascular health, disease prognosis, longevity",
    evidenceTag: "Strong",
    degrades: ["cardiovascular health", "disease prognosis", "longevity", "relationship/social buffering"],
    harm: { severity: 4, onset: "years", reversibility: "partial" },
    description: "A persistently angry, cynical, hostile disposition is a documented risk factor for coronary heart disease and for worse prognosis in those who already have it. Accrued atherosclerotic risk is not readily undone.",
    callout: "Effect sizes are real but modest (combined HR ≈ 1.19 in healthy populations), and part of the risk operates through health behaviors (smoking, activity). Observational — not proof that reducing hostility reverses risk.",
    sources: [
      { cite: "Chida, Y., & Steptoe, A. (2009). The Association of Anger and Hostility With Future Coronary Heart Disease: A Meta-Analytic Review. Journal of the American College of Cardiology, 53(11), 936–946.", note: "Anger/hostility raised CHD events in healthy populations (HR 1.19) and worsened prognosis in existing-CHD populations. [Strong — meta-analysis]", link: scholar("Chida Steptoe 2009 anger hostility coronary heart disease meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "ptsd", section: "165", title: "Trauma / PTSD — Brain & Function", subtitle: "Degrades: fear inhibition, contextual memory, prefrontal control",
    evidenceTag: "Strong",
    degrades: ["fear extinction / emotion regulation", "contextual & declarative memory", "medial-prefrontal executive control", "autonomic stress regulation"],
    harm: { severity: 5, onset: "immediate", reversibility: "partial" },
    description: "PTSD is associated with smaller hippocampal and anterior-cingulate volume, heightened amygdala reactivity, and reduced prefrontal regulatory control — a configuration that impairs distinguishing safe from dangerous and down-regulating fear. Evidence-based trauma therapies help.",
    callout: "The landmark twin study is decisive on one point: smaller hippocampal volume is at least partly a PRE-EXISTING vulnerability, not solely trauma-caused damage. Popular \"trauma shrinks your brain\" claims overstate the causal direction.",
    sources: [
      { cite: "Pitman, R. K., et al. (2012). Biological studies of post-traumatic stress disorder. Nature Reviews Neuroscience, 13(11), 769–787.", note: "Comprehensive review: PTSD associated with smaller hippocampal/ACC volumes, increased amygdala and decreased medial-prefrontal function, and altered psychophysiology. [Strong — review]", link: scholar("Pitman 2012 biological studies post-traumatic stress disorder"), kind: "scholar" },
      { cite: "Gilbertson, M. W., et al. (2002). Smaller hippocampal volume predicts pathologic vulnerability to psychological trauma. Nature Neuroscience, 5(11), 1242–1247.", note: "Monozygotic-twin design: PTSD severity correlated with hippocampal volume of BOTH the exposed twin AND the unexposed co-twin — small hippocampus is a pre-existing risk factor. [Strong — twin causal design]", link: scholar("Gilbertson 2002 smaller hippocampal volume vulnerability trauma twins"), kind: "scholar" },
    ],
  },
  {
    id: "perfectionism", section: "166", title: "Perfectionism — Burnout, Depression, Suicide Risk", subtitle: "Degrades: resilience, self-worth, stress tolerance, help-seeking",
    evidenceTag: "Strong",
    degrades: ["mood stability", "self-worth", "stress tolerance", "help-seeking", "sense of mattering/belonging"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "The maladaptive face of perfectionism — \"perfectionistic concerns\" (fear of mistakes, socially prescribed standards, self-critical discrepancy) — is linked to depression, general psychopathology, and suicidal ideation and attempts. The standard becomes a mechanism of self-harm.",
    callout: "Perfectionism is not monolithic: \"perfectionistic strivings\" carry weaker, more ambiguous risk than \"concerns.\" Socially prescribed perfectionism longitudinally predicted increases in suicidal ideation, but most component correlations remain modest.",
    sources: [
      { cite: "Smith, M. M., et al. (2018). The perniciousness of perfectionism: A meta-analytic review of the perfectionism–suicide relationship. Journal of Personality, 86(3), 522–542.", note: "45 studies, 11,747 participants: perfectionistic concerns and strivings show small-to-moderate links to suicide ideation; socially prescribed perfectionism predicted longitudinal increases. [Strong — meta-analysis]", link: scholar("Smith 2018 perniciousness of perfectionism suicide meta-analysis"), kind: "scholar" },
      { cite: "Limburg, K., Watson, H. J., Hagger, M. S., & Egan, S. J. (2017). The Relationship Between Perfectionism and Psychopathology: A Meta-Analysis. Journal of Clinical Psychology, 73(10), 1301–1326.", note: "Both perfectionism dimensions associate with depression, anxiety, OCD, eating-disorder symptoms, and self-harm/ideation — a transdiagnostic risk factor. [Strong — meta-analysis]", link: scholar("Limburg 2017 perfectionism psychopathology meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "self-criticism-shame", section: "167", title: "Chronic Self-Criticism / Shame", subtitle: "Degrades: self-compassion, mood, self-worth, connection",
    evidenceTag: "Strong",
    degrades: ["self-compassion", "mood", "self-worth", "social connection/belonging", "treatment engagement"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "A hostile, persecutory relationship with oneself and proneness to shame are robust correlates of depression and multiple disorders. The self becomes a source of threat; compassion-focused and cognitive therapies target it directly.",
    callout: "Most evidence is cross-sectional — self-criticism and shame co-occur with depression, and disentangling cause from symptom is hard. Shame's link to depression is hard to separate from maladaptive guilt; ordinary adaptive guilt is not the culprit.",
    sources: [
      { cite: "Kim, S., Thibodeau, R., & Jorgensen, R. S. (2011). Shame, guilt, and depressive symptoms: A meta-analytic review. Psychological Bulletin, 137(1), 68–96.", note: "108 studies, 22,411 participants: shame more strongly tied to depressive symptoms (r ≈ .43) than guilt (r ≈ .28). [Strong — meta-analysis]", link: scholar("Kim Thibodeau Jorgensen 2011 shame guilt depressive symptoms meta-analysis"), kind: "scholar" },
      { cite: "Werner, A. M., Tibubos, A. N., Rohrmann, S., & Reiss, N. (2019). The clinical trait self-criticism and its relation to psychopathology: A systematic review. Journal of Affective Disorders, 246, 530–547.", note: "Self-criticism positively related to depressive, psychotic, social-anxiety, eating-disorder, and personality-disorder symptoms — a transdiagnostic vulnerability. [Moderate–Strong — systematic review]", link: scholar("Werner 2019 self-criticism psychopathology systematic review"), kind: "scholar" },
    ],
  },
  {
    id: "unforgiveness", section: "168", title: "Unforgiveness / Grudge-Holding", subtitle: "Degrades: blood-pressure regulation, autonomic recovery, relationships",
    evidenceTag: "Moderate",
    degrades: ["blood-pressure/cardiovascular regulation", "autonomic stress recovery", "emotional well-being", "relationship quality/support"],
    harm: { severity: 3, onset: "immediate", reversibility: "recovers" },
    description: "Holding onto resentment is conceptualized as a sustained stress reaction that keeps the body in physiological arousal (elevated blood pressure, cardiovascular reactivity). Forgiveness interventions reduce the arousal; state effects reverse.",
    callout: "The weakest tier here: much is small-sample, cross-sectional, or lab-reactivity work on students. Long-term hard health endpoints attributable specifically to unforgiveness are not established — the framing is theoretically strong but the causal health claim remains a hypothesis.",
    sources: [
      { cite: "Worthington, E. L., & Scherer, M. (2004). Forgiveness is an emotion-focused coping strategy that can reduce health risks and promote health resilience. Psychology & Health, 19(3), 385–405.", note: "Frames unforgiveness as a chronic stress reaction with physiological toll; forgiveness as emotion-focused coping. [Moderate — theory/review]", link: scholar("Worthington Scherer 2004 forgiveness emotion-focused coping health"), kind: "scholar" },
      { cite: "Lawler, K. A., et al. (2003). A Change of Heart: Cardiovascular Correlates of Forgiveness in Response to Interpersonal Conflict. Journal of Behavioral Medicine, 26(5), 373–393.", note: "Trait and state forgiveness associated with lower blood pressure, heart rate, and cardiovascular reactivity — implying unforgiveness sustains arousal. [Moderate]", link: scholar("Lawler 2003 change of heart cardiovascular forgiveness"), kind: "scholar" },
    ],
  },
  {
    id: "learned-helplessness", section: "169", title: "Learned Helplessness / Pessimistic Style", subtitle: "Degrades: agency, motivation, mood, long-run physical health",
    evidenceTag: "Strong",
    degrades: ["perceived control/agency", "motivation & active coping", "mood", "physical health (long-run)"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Explaining bad events as internal, stable, and global predicts later depression AND poorer long-term physical health. Explanatory style is modifiable — cognitive therapy and learned-optimism training target it.",
    callout: "Modern neuroscience (Maier & Seligman 2016) inverted the original theory: passivity under uncontrollable stress is the DEFAULT unlearned response; what is actually learned is control. \"Learned helplessness\" is partly a misnomer. The 35-year health study rests on one privileged male cohort.",
    sources: [
      { cite: "Peterson, C., Seligman, M. E. P., & Vaillant, G. E. (1988). Pessimistic explanatory style is a risk factor for physical illness: A thirty-five-year longitudinal study. Journal of Personality and Social Psychology, 55(1), 23–27.", note: "Pessimistic explanatory style at age 25 predicted poorer physician-assessed health at 45–60, controlling for baseline health. [Moderate–Strong — single-cohort longitudinal]", link: scholar("Peterson Seligman Vaillant 1988 pessimistic explanatory style physical illness"), kind: "scholar" },
      { cite: "Maier, S. F., & Seligman, M. E. P. (2016). Learned helplessness at fifty: Insights from neuroscience. Psychological Review, 123(4), 349–367.", note: "Revises the theory: passivity is the default response to uncontrollable aversive events; detecting control is what is learned. [Strong — authoritative review]", link: scholar("Maier Seligman 2016 learned helplessness at fifty neuroscience"), kind: "scholar" },
    ],
  },
  {
    id: "chronic-worry", section: "170", title: "Chronic Worry / Generalized Anxiety", subtitle: "Degrades: quality of life, work & social function, sleep",
    evidenceTag: "Moderate",
    degrades: ["work capacity & social functioning", "life satisfaction/quality of life", "sleep", "cellular-aging reserve (tentative)"],
    harm: { severity: 4, onset: "months", reversibility: "recovers" },
    description: "Habitual worry sustains physiological stress activation and, clinically as GAD, produces broad impairment in work, relationships, and life satisfaction comparable to major depression. GAD is treatable; quality of life improves with remission.",
    callout: "The telomere sub-claim is the honest weak point: associations exist but are inconsistent, sometimes only in women or older patients. Do not overstate \"worry shortens your DNA\" — the functional-impairment evidence is far more solid.",
    sources: [
      { cite: "Hoffman, D. L., Dukes, E. M., & Wittchen, H.-U. (2008). Human and economic burden of generalized anxiety disorder. Depression and Anxiety, 25(1), 72–90.", note: "GAD produces substantial impairment in work, social functioning, and quality of life, with burden comparable to major depression. [Strong]", link: scholar("Hoffman Dukes Wittchen 2008 human economic burden generalized anxiety disorder"), kind: "scholar" },
      { cite: "Brosschot, J. F., Gerin, W., & Thayer, J. F. (2006). The perseverative cognition hypothesis: worry, prolonged stress-related physiological activation, and health. Journal of Psychosomatic Research, 60(2), 113–124.", note: "Worry prolongs stress-related physiological activation before and after stressors, extending stress's somatic toll. [Moderate–Strong — review]", link: scholar("Brosschot Gerin Thayer 2006 perseverative cognition worry health"), kind: "scholar" },
    ],
  },
  // ── Z: behavioral & lifestyle (171–180) ───────────────────────────────────
  {
    id: "doomscrolling", section: "171", title: "Problematic Social Media / Doomscrolling", subtitle: "Degrades: mood, attention, sleep, self-esteem — effect size contested",
    evidenceTag: "Mixed",
    degrades: ["mood regulation", "attention", "sleep", "self-esteem", "life satisfaction"],
    harm: { severity: 2, onset: "months", reversibility: "recovers" },
    description: "Heavy social/screen use tracks with elevated depression and anxiety symptoms and lower wellbeing — but the effect size is small and hotly contested, which is itself the honest finding. Largely reversible on reduced use.",
    callout: "This is the corpus's biggest effect-size fight. Orben & Przybylski show digital-tech use explains at most ~0.4% of wellbeing variance — smaller than wearing glasses. Cross-sectional designs can't rule out reverse causation (depressed teens may scroll more).",
    sources: [
      { cite: "Boers, E., Afzali, M. H., Newton, N., & Conrod, P. (2019). Association of screen time and depression in adolescence. JAMA Pediatrics, 173(9), 853–859.", note: "Within-person social-media/TV/computer use predicts rising depression symptoms; gaming did not. [Moderate — longitudinal within-person]", link: scholar("Boers 2019 screen time depression adolescence"), kind: "scholar" },
      { cite: "Orben, A., & Przybylski, A. K. (2019). The association between adolescent well-being and digital technology use. Nature Human Behaviour, 3, 173–182.", note: "20,776 specifications; digital use explains ≤0.4% of wellbeing variance. [Strong — the honest small-effect finding]", link: scholar("Orben Przybylski 2019 adolescent well-being digital technology"), kind: "scholar" },
    ],
  },
  {
    id: "night-phone", section: "172", title: "Late-Night Smartphone / Sleep Displacement", subtitle: "Degrades: sleep, next-day self-regulation, work engagement",
    evidenceTag: "Moderate",
    degrades: ["sleep quantity/quality", "next-day self-regulatory resources", "work engagement", "attention"],
    harm: { severity: 2, onset: "immediate", reversibility: "recovers" },
    description: "Late-night phone use delays sleep onset (blue-light melatonin suppression + failure to psychologically detach), producing morning depletion that carries into the workday. The direct harm is the sleep loss.",
    callout: "The effect is an indirect chain (phone → worse sleep → depletion → lower engagement); individual differences (job control) buffer the downstream cost.",
    sources: [
      { cite: "Lanaj, K., Johnson, R. E., & Barnes, C. M. (2014). Beginning the workday yet already depleted? Consequences of late-night smartphone use and sleep. Organizational Behavior and Human Decision Processes, 124(1), 11–23.", note: "Nighttime phone use → poorer sleep → morning depletion → lower daily work engagement. [Moderate — experience-sampling]", link: scholar("Lanaj Johnson Barnes 2014 late-night smartphone use sleep"), kind: "scholar" },
    ],
  },
  {
    id: "procrastination", section: "173", title: "Procrastination", subtitle: "Degrades: performance, physical health, stress regulation",
    evidenceTag: "Moderate",
    degrades: ["task performance", "immune/physical health", "stress regulation", "cardiovascular resilience"],
    harm: { severity: 3, onset: "months", reversibility: "partial" },
    description: "Chronic delay produces a short-term-benefit / long-term-cost curve: less stress early, then more stress, more illness, and worse outcomes overall. It compounds over a term or cycle.",
    callout: "The cardiovascular link (Sirois 2015) is cross-sectional and self-reported — procrastination as a \"vulnerability factor,\" not a proven cause of heart disease. Reverse causation (ill health → disengagement coping) is plausible.",
    sources: [
      { cite: "Tice, D. M., & Baumeister, R. F. (1997). Longitudinal study of procrastination, performance, stress, and health. Psychological Science, 8(6), 454–458.", note: "Procrastinators: lower early stress but higher late-term stress, more illness overall, lower grades. [Moderate — longitudinal]", link: scholar("Tice Baumeister 1997 procrastination performance stress health"), kind: "scholar" },
      { cite: "Sirois, F. M. (2015). Is procrastination a vulnerability factor for hypertension and cardiovascular disease? Journal of Behavioral Medicine, 38(3), 578–589.", note: "Higher trait procrastination predicts hypertension/CVD status via maladaptive coping. [Emerging — cross-sectional]", link: scholar("Sirois 2015 procrastination hypertension cardiovascular disease"), kind: "scholar" },
    ],
  },
  {
    id: "financial-scarcity", section: "174", title: "Financial Scarcity / Debt Stress", subtitle: "Degrades: working memory, decision quality, mood, cardiovascular",
    evidenceTag: "Strong",
    degrades: ["working memory", "fluid intelligence", "executive function/decision quality", "mood", "cardiovascular health"],
    harm: { severity: 4, onset: "immediate", reversibility: "recovers" },
    description: "Scarcity itself taxes attention and working memory (roughly a night's-sleep or ~13-IQ-point equivalent), independent of the person; debt separately raises stress, depressive symptoms, and blood pressure. Cognitive load lifts when scarcity lifts.",
    callout: "Mani's mall experiment is genuinely causal (randomized financial-worry prime), though the field result has faced replication debate. Sweet's debt→blood-pressure link is cross-sectional and can't fully separate poverty's other pathways.",
    sources: [
      { cite: "Mani, A., Mullainathan, S., Shafir, E., & Zhao, J. (2013). Poverty impedes cognitive function. Science, 341(6149), 976–980.", note: "Financial-worry prime + harvest-cycle field study reduce cognitive performance in the poor. [Strong — randomized experimental prime]", link: scholar("Mani Mullainathan Shafir Zhao 2013 poverty impedes cognitive function"), kind: "scholar" },
      { cite: "Sweet, E., Nandi, A., Adam, E. K., & McDade, T. W. (2013). The high price of debt: Household financial debt and its impact on mental and physical health. Social Science & Medicine, 91, 94–100.", note: "High debt → higher perceived stress (+11.7%), depressive symptoms (+13.2%), and diastolic BP in young adults. [Emerging — cross-sectional]", link: scholar("Sweet 2013 high price of debt mental physical health"), kind: "scholar" },
    ],
  },
  {
    id: "unemployment", section: "175", title: "Unemployment / Job Loss", subtitle: "Degrades: mental health, self-esteem, physical health, life expectancy",
    evidenceTag: "Strong",
    degrades: ["mental health", "self-esteem", "subjective wellbeing", "physical health", "life expectancy"],
    harm: { severity: 5, onset: "months", reversibility: "partial" },
    description: "Unemployment roughly doubles the rate of psychological problems (34% vs 16%); high-seniority displaced workers face 50–100% elevated mortality the year after job loss, still 10–15% elevated two decades later. Distress recovers on reemployment; mortality risk lingers.",
    callout: "Paul & Moser's longitudinal subset addresses selection (mental illness → unemployment), showing unemployment causes distress. The mortality effect concentrates in mass-layoff / high-seniority men, so it doesn't generalize to all job exits.",
    sources: [
      { cite: "Paul, K. I., & Moser, K. (2009). Unemployment impairs mental health: Meta-analyses. Journal of Vocational Behavior, 74(3), 264–282.", note: "324 studies; unemployed show more distress (d=0.51); 34% vs 16% with psychological problems; longitudinal data support causation. [Strong — meta-analysis]", link: scholar("Paul Moser 2009 unemployment impairs mental health meta-analyses"), kind: "scholar" },
      { cite: "Sullivan, D., & von Wachter, T. (2009). Job displacement and mortality: An analysis using administrative data. Quarterly Journal of Economics, 124(3), 1265–1306.", note: "High-seniority displaced men: mortality +50–100% the year after, +10–15% 20 years later. [Strong — administrative-data cohort]", link: scholar("Sullivan von Wachter 2009 job displacement mortality"), kind: "scholar" },
    ],
  },
  {
    id: "aimless-retirement", section: "176", title: "Retirement Without Purpose / Role Loss", subtitle: "Degrades: cognition, sense of purpose, longevity — evidence mixed",
    evidenceTag: "Mixed",
    degrades: ["episodic memory", "fluid cognition", "sense of purpose", "longevity"],
    harm: { severity: 3, onset: "years", reversibility: "partial" },
    description: "Early retirement is associated with faster cognitive decline (\"mental retirement\"), and low purpose in life predicts higher all-cause mortality. Re-engagement, volunteering, and purpose can restore it — the harm is role/purpose loss, not retirement per se.",
    callout: "The most contested cost here: retirement effects on cognition are genuinely mixed — some studies find benefits (stress relief, more sleep), and the cognition finding depends on the instrument's assumptions.",
    sources: [
      { cite: "Rohwedder, S., & Willis, R. J. (2010). Mental retirement. Journal of Economic Perspectives, 24(1), 119–138.", note: "Cross-national: earlier retirement predicts lower cognitive performance in the early 60s. [Moderate — instrumental-variables]", link: scholar("Rohwedder Willis 2010 mental retirement"), kind: "scholar" },
      { cite: "Hill, P. L., & Turiano, N. A. (2014). Purpose in life as a predictor of mortality across adulthood. Psychological Science, 25(7), 1482–1486.", note: "Higher purpose → lower mortality over 14 yrs, independent of age/retirement status. [Moderate — prospective cohort]", link: scholar("Hill Turiano 2014 purpose in life mortality"), kind: "scholar" },
    ],
  },
  {
    id: "burnout", section: "177", title: "Job Burnout / Workaholism", subtitle: "Degrades: cardiometabolic health, sleep, mood, work function",
    evidenceTag: "Moderate",
    degrades: ["cardiovascular/metabolic health", "sleep", "mood", "occupational performance"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Prospective evidence links burnout to hypercholesterolemia, type 2 diabetes, coronary heart disease, cardiovascular hospitalization, musculoskeletal pain, prolonged fatigue, insomnia, depression, and job dissatisfaction/absenteeism.",
    callout: "The review synthesizes prospective designs (burnout measured before outcome), strengthening causal reading, but individual outcomes rest on varying study counts and residual confounding by baseline health/job conditions remains.",
    sources: [
      { cite: "Salvagioni, D. A. J., Melanda, F. N., Mesas, A. E., et al. (2017). Physical, psychological and occupational consequences of job burnout: A systematic review of prospective studies. PLOS ONE, 12(10), e0185781.", note: "Burnout prospectively predicts CHD, type 2 diabetes, hypercholesterolemia, CVD hospitalization, depression, insomnia, and job dissatisfaction. [Moderate — prospective systematic review]", link: scholar("Salvagioni 2017 consequences job burnout systematic review prospective"), kind: "scholar" },
    ],
  },
  {
    id: "gambling-disorder", section: "178", title: "Gambling Disorder", subtitle: "Degrades: finances, mental health, family stability, survival",
    evidenceTag: "Strong",
    degrades: ["financial stability", "mental health", "family/relationships", "impulse control", "survival"],
    harm: { severity: 5, onset: "months", reversibility: "partial" },
    description: "Gambling disorder carries high psychiatric comorbidity, elevated debt and bankruptcy, domestic harm, and markedly elevated suicidality. Treatment-responsive, but debt and family harm can be lasting.",
    callout: "Much comorbidity data is cross-sectional and bidirectional (depression and gambling reinforce each other); financial harm and psychiatric comorbidity are entangled as both cause and consequence.",
    sources: [
      { cite: "Karlsson, A., & Håkansson, A. (2018). Gambling disorder, increased mortality, suicidality, and associated comorbidity: A longitudinal nationwide register study. Journal of Behavioral Addictions, 7(4), 1091–1099.", note: "Register cohort: elevated all-cause mortality and ~15x suicide-mortality risk in gambling disorder. [Moderate — register cohort]", link: scholar("Karlsson Hakansson gambling disorder mortality suicidality register study"), kind: "scholar" },
      { cite: "Wong, P. W. C., et al. (2023). Suicidal behaviors among individuals with gambling disorders: A meta-analysis. Journal of Gambling Studies, 39.", note: "Pooled lifetime prevalence ~31.6% suicidal ideation, ~13.2% attempts. [Moderate — meta-analysis]", link: scholar("suicidal behaviors gambling disorders meta-analysis Journal of Gambling Studies"), kind: "scholar" },
    ],
  },
  {
    id: "media-multitasking", section: "179", title: "Chronic Media Multitasking", subtitle: "Degrades: attentional filtering, working memory, task-switching",
    evidenceTag: "Mixed",
    degrades: ["attentional filtering", "working memory", "task-switching efficiency", "long-term memory encoding"],
    harm: { severity: 2, onset: "years", reversibility: "partial" },
    description: "Heavy media multitaskers are more distractible — worse at filtering irrelevant stimuli and memory representations — and show lower working-memory performance. The direction of causation is unresolved.",
    callout: "Correlational: heavy multitaskers may already have weaker cognitive control (self-selection), not be damaged by multitasking. A decade of replication attempts is mixed, and effect sizes are modest — treat as an association, not established causation.",
    sources: [
      { cite: "Ophir, E., Nass, C., & Wagner, A. D. (2009). Cognitive control in media multitaskers. PNAS, 106(37), 15583–15587.", note: "Heavy media multitaskers more susceptible to distraction, worse at task-switching, more N-back false alarms. [Emerging — cross-sectional, replication mixed]", link: scholar("Ophir Nass Wagner 2009 cognitive control media multitaskers"), kind: "scholar" },
      { cite: "Uncapher, M. R., Thieu, M. K., & Wagner, A. D. (2016). Media multitasking and memory: Differences in working memory and long-term memory. Psychonomic Bulletin & Review, 23(2), 483–490.", note: "Heavy media multitaskers show lower working-memory performance, linked to poorer long-term memory. [Emerging — cross-sectional]", link: scholar("Uncapher Thieu Wagner 2016 media multitasking memory"), kind: "scholar" },
    ],
  },
  {
    id: "sleep-debt-shift", section: "180", title: "Sleep Debt / Social Jetlag / Shift Work", subtitle: "Degrades: attention, metabolic regulation, circadian health",
    evidenceTag: "Moderate",
    degrades: ["attention/vigilance", "metabolic regulation (BMI, glucose)", "circadian health", "long-term cancer risk (contested)"],
    harm: { severity: 4, onset: "immediate", reversibility: "partial" },
    description: "Cumulative sleep restriction produces dose-dependent neurobehavioral deficits; social jetlag associates with higher BMI; night-shift work is classed a probable human carcinogen (IARC 2A) via circadian disruption. Acute cognition recovers; chronic metabolic/cancer risk is lasting.",
    callout: "The cancer link is genuinely mixed — IARC rates night work only \"probable\" (2A) on limited human evidence, and breast-cancer meta-analyses conflict. Social jetlag → obesity is correlational.",
    sources: [
      { cite: "Van Dongen, H. P. A., Maislin, G., Mullington, J. M., & Dinges, D. F. (2003). The cumulative cost of additional wakefulness. Sleep, 26(2), 117–126.", note: "Dose-response: 4–6h/night accumulates to deficits ~= 2–3 nights of total deprivation. [Strong — controlled]", link: scholar("Van Dongen 2003 cumulative cost additional wakefulness"), kind: "scholar" },
      { cite: "Roenneberg, T., Allebrandt, K. V., Merrow, M., & Vetter, C. (2012). Social jetlag and obesity. Current Biology, 22(10), 939–943.", note: "In overweight individuals, greater social jetlag associates with higher BMI. [Emerging — cross-sectional]", link: scholar("Roenneberg 2012 social jetlag and obesity"), kind: "scholar" },
    ],
  },
  // ── AA: social, environmental & developmental (181–190) ───────────────────
  {
    id: "aces", section: "181", title: "Adverse Childhood Experiences (ACEs)", subtitle: "Degrades: lifelong physical & mental health, emotion regulation, longevity",
    evidenceTag: "Strong",
    degrades: ["physical health (cardiovascular, metabolic)", "mental health", "emotional regulation", "longevity", "health behaviors"],
    harm: { severity: 5, onset: "years", reversibility: "partial" },
    description: "Cumulative childhood abuse, neglect, and household dysfunction raise lifelong risk of disease, mental illness, addiction, and early death in a graded, dose-response (\"ACE score\") pattern. Buffered by later protective relationships.",
    callout: "ACEs cluster with poverty and are self-reported retrospectively (recall bias). The score treats unlike adversities as equal units; poverty is a major upstream driver and confounder.",
    sources: [
      { cite: "Felitti, V. J., Anda, R. F., Nordenberg, D., et al. (1998). Relationship of Childhood Abuse and Household Dysfunction to Many of the Leading Causes of Death in Adults (The ACE Study). American Journal of Preventive Medicine, 14(4), 245–258.", note: "Dose-response: more ACEs → higher adult disease, disability, and death. [Strong — foundational ~17K cohort]", link: scholar("Felitti 1998 adverse childhood experiences leading causes of death"), kind: "scholar" },
      { cite: "Hughes, K., Bellis, M. A., Hardcastle, K. A., et al. (2017). The effect of multiple adverse childhood experiences on health: a systematic review and meta-analysis. The Lancet Public Health, 2(8), e356–e366.", note: "≥4 ACEs strongly raise odds of poor mental health, substance use, and violence. [Strong — meta-analysis]", link: scholar("Hughes 2017 multiple adverse childhood experiences meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "discrimination", section: "182", title: "Chronic Discrimination / Racism", subtitle: "Degrades: mental health, physical health, immune & cardiovascular regulation",
    evidenceTag: "Strong",
    degrades: ["mental health (depression, anxiety, distress)", "general/physical health", "immune & cardiovascular-metabolic regulation"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Repeated interpersonal and structural discrimination acts as a chronic stressor, wearing down physiological systems (allostatic load) and degrading mental and physical health.",
    callout: "Most evidence is cross-sectional and self-reported; discrimination is entangled with socioeconomic disadvantage and segregation, so isolating it from poverty/SES is hard. Physical-health effects are smaller and more heterogeneous than mental-health ones.",
    sources: [
      { cite: "Paradies, Y., Ben, J., Denson, N., et al. (2015). Racism as a Determinant of Health: A Systematic Review and Meta-Analysis. PLoS ONE, 10(9), e0138511.", note: "293 studies: racism associated with poorer mental (r≈-.23) and physical health. [Strong — meta-analysis]", link: scholar("Paradies 2015 racism determinant of health meta-analysis"), kind: "scholar" },
      { cite: "Williams, D. R., & Mohammed, S. A. (2009). Discrimination and racial disparities in health: evidence and needed research. Journal of Behavioral Medicine, 32(1), 20–47.", note: "Review documents a consistent inverse discrimination–health association. [Strong — review]", link: scholar("Williams Mohammed 2009 discrimination racial disparities health"), kind: "scholar" },
    ],
  },
  {
    id: "child-poverty", section: "183", title: "Childhood Poverty / Low SES — Brain Development", subtitle: "Degrades: executive function, attention, language, memory, achievement",
    evidenceTag: "Strong",
    degrades: ["executive function", "attention", "language", "memory", "academic achievement"],
    harm: { severity: 4, onset: "years", reversibility: "partial" },
    description: "Growing up in poverty is associated with reduced brain structure (gray matter, cortical surface area, hippocampal volume) in regions supporting attention, language, memory, and executive function, mediating lower academic achievement. Mediators are modifiable, not deterministic.",
    callout: "Observational — cannot prove poverty itself shrinks brains rather than co-occurring factors. Luby 2013 shows the hippocampal effect is largely mediated by caregiving quality and stress, i.e. poverty is upstream and intervenable.",
    sources: [
      { cite: "Hair, N. L., Hanson, J. L., Wolfe, B. L., & Pollak, S. D. (2015). Association of Child Poverty, Brain Development, and Academic Achievement. JAMA Pediatrics, 169(9), 822–829.", note: "Near-poor children ~3–4% below gray-matter norm; explains ~20% of the achievement gap. [Strong]", link: scholar("Hair 2015 child poverty brain development academic achievement"), kind: "scholar" },
      { cite: "Noble, K. G., Houston, S. M., Brito, N. H., et al. (2015). Family income, parental education and brain structure in children and adolescents. Nature Neuroscience, 18(5), 773–778.", note: "Income logarithmically associated with cortical surface area; steepest at low income. [Strong]", link: scholar("Noble 2015 family income brain structure children"), kind: "scholar" },
    ],
  },
  {
    id: "incarceration", section: "184", title: "Incarceration", subtitle: "Degrades: mental & physical health, family stability, child wellbeing",
    evidenceTag: "Moderate",
    degrades: ["mental health", "physical health/longevity", "family stability", "child wellbeing/development", "economic capacity"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Incarceration harms the physical and mental health of those imprisoned (especially post-release) and damages the health, economic security, and development of their children and families, widening racial inequality.",
    callout: "Incarcerated populations differ on pre-existing health, poverty, and neighborhood risk — hard to fully separate the effect from selection. Some short-term physical measures paradoxically improve during confinement; harm concentrates after release and across families.",
    sources: [
      { cite: "Wildeman, C., & Wang, E. A. (2017). Mass incarceration, public health, and widening inequality in the USA. The Lancet, 389(10077), 1464–1474.", note: "Incarceration harms post-release physical/mental health and drives racial health inequality. [Moderate — review]", link: scholar("Wildeman Wang 2017 mass incarceration public health inequality"), kind: "scholar" },
      { cite: "Wildeman, C., Goldman, A. W., & Turney, K. (2018). Parental incarceration and child health in the United States. Epidemiologic Reviews, 40(1), 146–156.", note: "Paternal incarceration negatively (possibly causally) associated with child health/wellbeing. [Moderate]", link: scholar("Wildeman 2018 parental incarceration child health United States"), kind: "scholar" },
    ],
  },
  {
    id: "empty-nest", section: "185", title: "Empty Nest / Major Role Transition", subtitle: "Often neutral-to-positive — harm concentrated in vulnerable subgroups",
    evidenceTag: "Mixed",
    degrades: ["subjective wellbeing (subgroups)", "role identity", "sense of purpose", "mood"],
    harm: { severity: 2, onset: "immediate", reversibility: "recovers" },
    description: "The departure of grown children removes a long-held parental role. Contrary to the stereotype, the best longitudinal evidence finds the transition is on average neutral-to-positive for wellbeing and marital satisfaction; harm is real but concentrated in subgroups (identity built on caregiving, poor marital/social resources).",
    callout: "The honest weak entry: \"empty nest syndrome\" as a general pathology is not well supported. Cross-sectional studies sometimes show distress, but the strongest longitudinal study finds marital satisfaction RISES. Do not overstate as a uniform cost.",
    sources: [
      { cite: "Gorchoff, S. M., John, O. P., & Helson, R. (2008). Contextualizing change in marital satisfaction during middle age: an 18-year longitudinal study. Psychological Science, 19(11), 1194–1200.", note: "The empty-nest transition INCREASED marital satisfaction via better quality of shared time. [Mixed — counter-evidence to harm]", link: scholar("Gorchoff John Helson 2008 marital satisfaction empty nest"), kind: "scholar" },
      { cite: "Bouchard, G. (2014). Marital quality at the empty-nest phase: an integrative review. Journal of Adult Development / Journal of Aging Health.", note: "Review: findings mixed — cross-sectional often positive, some longitudinal decline; no uniform syndrome. [Mixed — review]", link: scholar("Bouchard empty nest marital quality review"), kind: "scholar" },
    ],
  },
  {
    id: "food-insecurity", section: "186", title: "Food Insecurity", subtitle: "Degrades: child mental & physical health, maternal mental health",
    evidenceTag: "Moderate",
    degrades: ["child mental/behavioral health", "child physical health/nutrition", "maternal mental health", "family functioning"],
    harm: { severity: 3, onset: "months", reversibility: "partial" },
    description: "Inconsistent access to adequate food is associated with worse child physical and mental health, behavioral/emotional problems, and elevated maternal depression and anxiety — partly mediated through maternal mental health. Potentially responsive to policy/food access.",
    callout: "Deeply confounded with poverty, parental mental illness, and material hardship — often a marker of broader deprivation rather than a proven independent cause.",
    sources: [
      { cite: "Gundersen, C., & Ziliak, J. P. (2015). Food Insecurity and Health Outcomes. Health Affairs, 34(11), 1830–1839.", note: "Review: food insecurity consistently negatively associated with health across the lifespan. [Moderate — review]", link: scholar("Gundersen Ziliak 2015 food insecurity health outcomes"), kind: "scholar" },
      { cite: "Whitaker, R. C., Phillips, S. M., & Orzol, S. M. (2006). Food insecurity and the risks of depression and anxiety in mothers and behavior problems in their preschool-aged children. Pediatrics, 118(3), e859–e868.", note: "Maternal depression/anxiety and child behavior problems rise with food-insecurity level. [Moderate]", link: scholar("Whitaker 2006 food insecurity maternal depression behavior problems"), kind: "scholar" },
    ],
  },
  {
    id: "eviction", section: "187", title: "Housing Instability / Eviction", subtitle: "Degrades: mental health, physical health, child development, security",
    evidenceTag: "Moderate",
    degrades: ["mental health (depression)", "physical/self-rated health", "child development", "material security", "parenting capacity"],
    harm: { severity: 4, onset: "months", reversibility: "partial" },
    description: "Forced moves, eviction, and unstable housing are associated with increased maternal depression, worse self-rated health for parents and children, more material hardship, and elevated child developmental risk — appearing to be a cause, not merely a marker, of hardship (effects persist ≥2 years).",
    callout: "Households that experience eviction differ on unmeasured factors; propensity matching reduces but doesn't eliminate confounding. Housing instability is both a consequence and a driver of poverty (partly bidirectional).",
    sources: [
      { cite: "Desmond, M., & Kimbro, R. T. (2015). Eviction's Fallout: Housing, Hardship, and Health. Social Forces, 94(1), 295–324.", note: "Evicted mothers had more depression, worse health, and more hardship — persisting ~2 years. [Moderate — propensity-matched]", link: scholar("Desmond Kimbro 2015 eviction's fallout housing hardship health"), kind: "scholar" },
      { cite: "Sandel, M., Sheward, R., Ettinger de Cuba, S., et al. (2018). Unstable Housing and Caregiver and Child Health in Renter Families. Pediatrics, 141(2), e20172199.", note: "Housing instability linked to worse caregiver/child health, maternal depression, and developmental risk. [Moderate — large multi-site]", link: scholar("Sandel 2018 unstable housing caregiver child health renter families"), kind: "scholar" },
    ],
  },
  {
    id: "neighborhood-violence", section: "188", title: "Neighborhood Violence / Chronic Threat", subtitle: "Degrades: attention, impulse control, verbal/reading, stress physiology",
    evidenceTag: "Strong",
    degrades: ["attention", "impulse control", "verbal/reading performance", "stress physiology (HPA axis)", "cellular aging"],
    harm: { severity: 4, onset: "immediate", reversibility: "partial" },
    description: "Exposure to community violence acutely and chronically impairs children's cognition (vocabulary, reading, attention, impulse control) and leaves biological signatures of chronic stress. Acute effects fade; chronic exposure may embed.",
    callout: "Sharkey's timing-of-homicide design is unusually strong for causal inference on the acute cognitive hit. The biological (telomere/cortisol) studies are small, cross-sectional, and heavily confounded with neighborhood poverty — mechanism suggestive, not settled.",
    sources: [
      { cite: "Sharkey, P. (2010). The acute effect of local homicides on children's cognitive performance. PNAS, 107(26), 11733–11738.", note: "A homicide within ~a week near home cut vocabulary/reading ~0.5–0.66 SD. [Strong — quasi-experimental timing]", link: scholar("Sharkey 2010 acute effect local homicides children cognitive"), kind: "scholar" },
      { cite: "Sharkey, P. T., Tirado-Strayer, N., Papachristos, A. V., & Raver, C. C. (2012). The Effect of Local Violence on Children's Attention and Impulse Control. American Journal of Public Health, 102(12), 2287–2293.", note: "Recent local violence lowered preschoolers' attention/impulse control, via parental distress. [Strong — quasi-experimental]", link: scholar("Sharkey 2012 local violence children attention impulse control"), kind: "scholar" },
    ],
  },
  {
    id: "early-screen-time", section: "189", title: "Excessive Early-Childhood Screen Use", subtitle: "Degrades: language, attention, motor/problem-solving, sleep",
    evidenceTag: "Moderate",
    degrades: ["language/communication", "attention", "motor & problem-solving development", "sleep"],
    harm: { severity: 3, onset: "months", reversibility: "partial" },
    description: "Higher screen time in early childhood is associated with poorer performance on developmental screening (communication, motor, problem-solving, personal-social). Effect sizes are modest and the behavior is modifiable.",
    callout: "Associations are small and confounded by family environment, parenting, and SES; the authors note the alternative that children with delays receive more screen time. \"Screen time\" is a crude aggregate — content, context, and co-viewing all matter.",
    sources: [
      { cite: "Madigan, S., Browne, D., Racine, N., Mori, C., & Tough, S. (2019). Association Between Screen Time and Children's Performance on a Developmental Screening Test. JAMA Pediatrics, 173(3), 244–250.", note: "Screen time at 24/36 months predicted poorer later developmental scores; directional (cross-lagged), not reverse. [Moderate — longitudinal]", link: scholar("Madigan 2019 screen time children developmental screening"), kind: "scholar" },
      { cite: "Lissak, G. (2018). Adverse physiological and psychological effects of screen time on children and adolescents: literature review and case study. Environmental Research, 164, 149–157.", note: "Review: excess screen time linked to poor sleep, stress dysregulation, and cardiometabolic and psychological harm. [Emerging — narrative review]", link: scholar("Lissak 2018 adverse effects screen time children adolescents"), kind: "scholar" },
    ],
  },
  {
    id: "caregiver-burden", section: "190", title: "Chronic Caregiver Burden (Non-Dementia)", subtitle: "Morbidity real; the classic mortality claim is overturned",
    evidenceTag: "Moderate",
    degrades: ["mental health (depression/anxiety)", "physical health (cardiovascular, immune)", "sleep", "time/economic capacity"],
    harm: { severity: 3, onset: "months", reversibility: "partial" },
    description: "Sustained caregiving for a disabled child or spouse imposes chronic stress associated with elevated distress, anxiety, depression, and physical-health problems. Harm concentrates in high-strain, low-resource caregivers and is respite/support-responsive.",
    callout: "Key honest caveat: the widely cited \"caregiving raises mortality\" finding has NOT held up — Roth et al. (2013), a large propensity-matched study, found caregivers had LOWER all-cause mortality than matched non-caregivers. Caregiving per se is not uniformly lethal.",
    sources: [
      { cite: "Schulz, R., & Beach, S. R. (1999). Caregiving as a risk factor for mortality: the Caregiver Health Effects Study. JAMA, 282(23), 2215–2219.", note: "Strained spousal caregivers showed elevated 4-year mortality — foundational, now qualified. [Moderate — contested]", link: scholar("Schulz Beach 1999 caregiving risk factor mortality"), kind: "scholar" },
      { cite: "Roth, D. L., Fredman, L., & Haley, W. E. (2015). Informal caregiving and its impact on health: a reappraisal. The Gerontologist, 55(2), 309–319.", note: "HONEST COUNTER-EVIDENCE: matched caregivers had ~lower mortality; overturns the uniform-harm claim. [Moderate — propensity-matched reappraisal]", link: scholar("Roth 2013 family caregiving all-cause mortality propensity matched"), kind: "scholar" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AI AS COACH, COMPANION & MIRROR + skill/relationship interventions (191–198).
  // The honest read on using AI as therapist/coach/companion and on newer
  // interventions the corpus subject asked about directly. Several are thin or
  // double-edged — tagged and caveated accordingly, never inflated.
  {
    id: "sign-language", section: "191", title: "Learning Sign Language (ASL)", subtitle: "Bolsters clusters: visuospatial, mental rotation, second-language",
    evidenceTag: "Moderate",
    feeds: ["visuospatial working memory", "mental rotation", "mental imagery", "perspective-taking", "a second language"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "high" },
    description: "Acquiring a visual-spatial language recruits parietal spatial systems for linguistic work; fluent signers show measurable advantages on mental rotation, image generation, and specific face-processing tasks. Benefits are domain-specific, not a global IQ boost.",
    callout: "The enhancement is tied to sign-language FLUENCY and sustained use, demonstrated mostly in native/early signers. Little rigorous evidence that a hearing adult casually learning ASL gains broad, transferable spatial ability — \"learn ASL and get smarter\" overstates the case.",
    sources: [
      { cite: "Emmorey, K., Kosslyn, S. M., & Bellugi, U. (1993). Visual imagery and visual-spatial language: Enhanced imagery abilities in deaf and hearing ASL signers. Cognition, 46(2), 139–181.", note: "Both deaf AND hearing signers outperformed non-signers on image generation and mirror-reversal detection — implicating language experience, not deafness. [Moderate — group comparison]", link: scholar("Emmorey Kosslyn Bellugi enhanced imagery ASL signers"), kind: "scholar" },
      { cite: "Emmorey, K., Klima, E., & Bellugi, U. (1998). Mental rotation within linguistic and non-linguistic domains in users of American Sign Language. Cognition, 68(3), 221–246.", note: "ASL signers were faster and more accurate on Shepard-Metzler mental rotation. [Moderate — group comparison]", link: scholar("Emmorey Klima mental rotation American Sign Language"), kind: "scholar" },
    ],
  },
  {
    id: "ai-therapist", section: "192", title: "AI Chatbots as Therapist / Mental-Health Support", subtitle: "Bolsters clusters: mood management, CBT skill practice, accessibility",
    evidenceTag: "Moderate",
    feeds: ["mood/depressive-symptom management", "psychoeducation", "CBT skill practice", "low-barrier access"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "low" },
    description: "Rule-based and CBT-scripted conversational agents (Woebot, Wysa, Tess) deliver structured self-help; short-term symptom reductions for depression/anxiety are real but modest, heterogeneous, and mostly short-horizon.",
    callout: "The strongest positive trials are small, short (2 weeks), unblinded, and industry-authored. These are scripted CBT agents — NOT a validated substitute for a clinician — and the evidence does not cover crisis care or generative-LLM \"therapists.\"",
    sources: [
      { cite: "Fitzpatrick, K. K., Darcy, A., & Vierhile, M. (2017). Delivering CBT to young adults with symptoms of depression and anxiety using a fully automated conversational agent (Woebot): A randomized controlled trial. JMIR Mental Health, 4(2), e19.", note: "2-week RCT (n=70); Woebot group showed significant PHQ-9 depression reduction vs information-only control. [Moderate — small short RCT]", link: scholar("Fitzpatrick Woebot randomized controlled trial JMIR Mental Health"), kind: "scholar" },
      { cite: "He, Y., Yang, L., Qian, C., et al. (2023). Conversational agent interventions for mental health problems: Systematic review and meta-analysis of RCTs. Journal of Medical Internet Research, 25, e43862.", note: "32 RCTs, 6089 participants; small-to-moderate reductions in depression/distress that attenuate at follow-up; quality limitations. [Moderate — meta-analysis]", link: scholar("He conversational agent interventions mental health meta-analysis JMIR 2023"), kind: "scholar" },
    ],
  },
  {
    id: "ai-companion", section: "193", title: "AI Companionship / Relationship With a Chatbot", subtitle: "Bolsters clusters: loneliness relief — but double-edged (dependency risk)",
    evidenceTag: "Mixed",
    feeds: ["loneliness relief (short-term)", "non-judgmental emotional support", "social-connection surrogate"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "low" },
    description: "Ongoing relational use of companion chatbots (Replika, character AIs) for friendship and loneliness relief. Genuinely double-edged: a short-term lifeline for some in acute isolation, a dependency trap for heavy users.",
    callout: "HONEST TENSION. Self-report studies (self-selected, unusually lonely users) report companionship; the best controlled evidence (Fang/MIT-OpenAI RCT) finds higher daily use associated with MORE loneliness, dependence, and less real-world socialization. Not a validated intervention; commercial incentives favor engagement over wellbeing.",
    sources: [
      { cite: "Maples, B., Cerit, M., Vishwanath, A., & Pea, R. (2024). Loneliness and suicide mitigation for students using GPT-3-enabled chatbots. npj Mental Health Research, 3, 4.", note: "Survey of 1006 student Replika users; users markedly lonelier than peers; 3% spontaneously reported Replika halted suicidal ideation. [Emerging — cross-sectional, self-selected]", link: scholar("Maples loneliness suicide mitigation GPT-3 chatbots npj"), kind: "scholar" },
      { cite: "Fang, C. M., et al. (2025). How AI and human behaviors shape psychosocial effects of extended chatbot use: A longitudinal controlled study. MIT Media Lab / OpenAI; arXiv:2503.17473.", note: "4-week RCT (~1000); higher daily chatbot use correlated with higher loneliness, dependence, problematic use, and lower socialization. [Emerging — preprint, correlational within trial]", link: scholar("Fang MIT Media Lab OpenAI chatbot loneliness longitudinal controlled study"), kind: "scholar" },
    ],
  },
  {
    id: "ai-coach", section: "194", title: "AI as Coach / Co-Creator / Cognitive Augmentation", subtitle: "Bolsters clusters: skill acquisition, problem-solving, scaffolded reasoning",
    evidenceTag: "Moderate",
    feeds: ["skill acquisition/learning", "problem-solving throughput", "drafting/ideation", "scaffolded reasoning"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Using an AI partner to tutor, coach, and co-solve. Structured intelligent tutoring systems (ITS) rival human tutors on learning gains; open-ended LLM 'co-creation' lifts workplace productivity but its effect on durable learning is still thin.",
    callout: "Strong evidence is for ENGINEERED tutoring systems, not general LLM chat. The best LLM field study (Dell'Acqua) reveals a 'jagged frontier': AI lifts performance inside its competence but degrades quality when users over-trust it beyond that frontier — carrying real overreliance/deskilling risk.",
    sources: [
      { cite: "VanLehn, K. (2011). The relative effectiveness of human tutoring, intelligent tutoring systems, and other tutoring systems. Educational Psychologist, 46(4), 197–221.", note: "Step-based ITS effect size ~0.76, approaching human tutoring (~0.79). [Strong — meta-analytic]", link: scholar("VanLehn relative effectiveness human tutoring intelligent tutoring systems"), kind: "scholar" },
      { cite: "Dell'Acqua, F., McFowland, E. III, Mollick, E., et al. (2023). Navigating the jagged technological frontier: Field experimental evidence of the effects of AI on knowledge worker productivity and quality. Harvard Business School Working Paper 24-013.", note: "758 BCG consultants; AI raised quality/speed within its frontier but LOWERED quality on beyond-frontier tasks. [Moderate — field experiment, productivity not learning]", link: scholar("Dell'Acqua jagged technological frontier AI knowledge worker productivity"), kind: "scholar" },
    ],
  },
  {
    id: "self-disclosure-ai", section: "195", title: "Self-Disclosure to an AI / Journaling via Chatbot", subtitle: "Bolsters clusters: emotional processing, stress reduction, insight",
    evidenceTag: "Moderate",
    feeds: ["emotional processing/regulation", "stress reduction", "meaning-making", "reflective insight"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Disclosing emotional content to a non-judgmental agent, or in writing, for emotional processing. Expressive-writing benefits are meta-analytically established (small but reliable), and at least one controlled study shows they transfer to a believed-chatbot partner.",
    callout: "The robust effect is for expressive writing / disclosure generally, and it is small (r≈.075), strongest for high-stress people. Evidence that disclosure specifically TO a chatbot yields the same benefit rests largely on one experiment (Ho 2018) — 'journaling to an AI heals you' outruns the evidence.",
    sources: [
      { cite: "Ho, A., Hancock, J., & Miner, A. S. (2018). Psychological, relational, and emotional effects of self-disclosure after conversations with a chatbot. Journal of Communication, 68(4), 712–733.", note: "Emotional (vs factual) disclosure produced equivalent benefits whether the partner was believed to be a chatbot or a human. [Moderate — controlled experiment]", link: scholar("Ho Hancock Miner self-disclosure chatbot Journal of Communication"), kind: "scholar" },
      { cite: "Frattaroli, J. (2006). Experimental disclosure and its moderators: A meta-analysis. Psychological Bulletin, 132(6), 823–865.", note: "146 randomized studies; disclosure has a small but significant benefit (r≈.075), larger for high-stress/low-optimism samples. [Strong — meta-analysis]", link: scholar("Frattaroli experimental disclosure moderators meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "ai-personalization", section: "196", title: "Feeding an AI Your Personal History for Personalization", subtitle: "Bolsters clusters: tailored guidance, self-monitoring, behavior change",
    evidenceTag: "Emerging",
    feeds: ["personalized guidance relevance", "self-monitoring/self-regulation", "behavior-change support", "predictive prompting"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Providing personal history/data to an AI so it tailors guidance. No rigorous outcome studies exist on this directly; the closest evidence — computer-tailored health communication and self-monitoring — shows using your own data to customize feedback beats generic content by a small but reliable margin.",
    callout: "EMERGING/THIN — no outcome studies on feeding personal history to a general AI. The adjacent tailoring literature shows a modest advantage (r≈.07) for STRUCTURED health-behavior systems, not open-ended AI. Weigh unmeasured privacy/dependency costs the efficacy literature ignores.",
    sources: [
      { cite: "Noar, S. M., Benac, C. N., & Harris, M. S. (2007). Does tailoring matter? Meta-analytic review of tailored print health behavior change interventions. Psychological Bulletin, 133(4), 673–693.", note: "57 studies; personally tailored (data-driven) materials modestly outperform generic (mean r≈.074). [Strong — meta-analysis, adjacent construct]", link: scholar("Noar Benac Harris does tailoring matter meta-analysis"), kind: "scholar" },
      { cite: "Krebs, P., Prochaska, J. O., & Rossi, J. S. (2010). A meta-analysis of computer-tailored interventions for health behavior change. Preventive Medicine, 51(3–4), 214–221.", note: "Computer-tailored interventions using individual data produce significant behavior-change effects across diet, smoking, screening. [Strong — meta-analysis, adjacent]", link: scholar("Krebs Prochaska Rossi meta-analysis computer-tailored interventions"), kind: "scholar" },
    ],
  },
  {
    id: "car-detailing", section: "197", title: "Car Cleaning / Detailing / Ordered Environment", subtitle: "Bolsters clusters: environmental mastery, stress recovery — inferred only",
    evidenceTag: "Emerging",
    feeds: ["environmental mastery/sense of control", "stress recovery", "conscientiousness/routine"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Maintaining a clean, ordered vehicle as a self-regulation / environmental-mastery practice. There is a genuine evidence GAP — no study isolates cars — so this rests entirely on adjacent home-order research, extrapolated.",
    callout: "NO direct peer-reviewed research on car detailing and wellbeing/cognition. Home-based findings are correlational or lab-only, showed mainly in women (Saxbe), and order is double-edged: it promotes healthy choices but disorder can boost creativity (Vohs). Treat 'clean car → better mind' as plausible extension, not established fact.",
    sources: [
      { cite: "Saxbe, D. E., & Repetti, R. (2010). No place like home: Home tours correlate with daily patterns of mood and cortisol. Personality and Social Psychology Bulletin, 36(1), 71–81.", note: "Describing home as cluttered/'unfinished' predicted flatter (less healthy) diurnal cortisol slopes, esp. in women. [Emerging — correlational, adjacent to cars]", link: scholar("Saxbe Repetti no place like home cortisol clutter"), kind: "scholar" },
      { cite: "Vohs, K. D., Redden, J. P., & Rahinel, R. (2013). Physical order produces healthy choices, generosity, and conventionality, whereas disorder produces creativity. Psychological Science, 24(9), 1860–1867.", note: "Orderly rooms → healthier snacks, generosity, convention; disorderly rooms → more creativity. [Moderate — lab experiments, adjacent to cars]", link: scholar("Vohs physical order healthy choices disorder creativity"), kind: "scholar" },
    ],
  },
  {
    id: "engagement", section: "198", title: "Getting Engaged / Commitment Transition", subtitle: "Bolsters clusters: relationship commitment, stability, security",
    evidenceTag: "Moderate",
    feeds: ["relationship commitment/stability", "life satisfaction (transient boost)", "social/emotional security", "shared-goal identity"],
    impact: { magnitude: 2, latency: "days", durability: "sustained", effort: "high" },
    description: "The engagement/commitment transition. Commitment is a robust predictor of relationship stability; the transition itself brings a modest, often temporary wellbeing bump followed by adaptation toward baseline, with large individual differences.",
    callout: "HONEST CORRECTION — there is NO evidence of an 'intelligence spike' or cognitive boost from getting engaged; do not claim one. The benefits are relational and modest, not cognitive, and the wellbeing peak adapts back over time.",
    sources: [
      { cite: "Lucas, R. E., Clark, A. E., Georgellis, Y., & Diener, E. (2003). Reexamining adaptation and the set point model of happiness: Reactions to changes in marital status. Journal of Personality and Social Psychology, 84(3), 527–539.", note: "15-yr panel (~24,000): on average a marriage wellbeing boost that adapts back toward baseline, with substantial individual variation. [Strong — long panel]", link: scholar("Lucas Clark reexamining adaptation set point marital status"), kind: "scholar" },
      { cite: "Le, B., & Agnew, C. R. (2003). Commitment and its theorized determinants: A meta-analysis of the Investment Model. Personal Relationships, 10(1), 37–57.", note: "52 studies / 11,582 people: satisfaction, alternatives, and investment explain ~2/3 of commitment variance; commitment predicts breakup. [Strong — meta-analysis]", link: scholar("Le Agnew commitment theorized determinants meta-analysis Investment Model"), kind: "scholar" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 4 — dating, physiology, movement, recreation, social & sensory (199+).
  // ── P: physiology & dating (199–208) ──────────────────────────────────────
  {
    id: "freediving", section: "199", title: "Voluntary Breath-Hold / Freediving Training", subtitle: "Bolsters clusters: cardiovascular tolerance, autonomic regulation, CO2 tolerance",
    evidenceTag: "Emerging",
    feeds: ["cardiovascular tolerance", "autonomic/vagal regulation", "CO2 tolerance", "stress inoculation"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "high" },
    description: "Repeated voluntary apnea triggers the mammalian dive response — bradycardia, vasoconstriction, and spleen contraction — and trained apneists develop blunted CO2 sensitivity and greater hypoxia tolerance. Genuine but training-dependent adaptations.",
    callout: "The popular claim that breath-hold training causes 'permanent carotid expansion that prevents strokes' is an overreach the literature does not support — the acute risk runs the OTHER way (end-apnea is hypoxic + hypercapnic + hypertensive, with a possible transient blood-brain-barrier disruption). Never train apnea in water alone (shallow-water blackout).",
    sources: [
      { cite: "Bakovic, D., Palada, I., et al. (2003). Spleen volume and blood flow response to repeated breath-hold apneas. Journal of Applied Physiology, 95(4), 1460–1466.", note: "~20% rapid spleen-volume reduction in the first apnea; splenectomized subjects lack the successive-apnea prolongation. [Moderate — small controlled]", link: scholar("spleen volume blood flow response repeated breath-hold apneas"), kind: "scholar" },
      { cite: "Patrician, A., Dujic, Z., et al. (2021). Going to Extremes of Lung Physiology — Deep Breath-Hold Diving. Frontiers in Physiology, 12, 710429.", note: "Review: dive response, blunted chemosensitivity, and hypoxia/hypercapnia tolerance in elite divers. [Emerging — review]", link: scholar("Going to Extremes Lung Physiology Deep Breath-Hold Diving"), kind: "scholar" },
    ],
  },
  {
    id: "backwards-walking", section: "200", title: "Backwards / Retro Walking", subtitle: "Bolsters clusters: cardiovascular fitness, knee rehab, balance/proprioception",
    evidenceTag: "Moderate",
    feeds: ["cardiovascular fitness", "knee-joint rehab/quadriceps strength", "balance/proprioception", "attentional load"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Walking backward carries a higher energy cost and coordination demand than forward walking, improves cardiorespiratory fitness, and is a useful knee-osteoarthritis rehab tool — building quadriceps strength with reduced patellofemoral load.",
    callout: "Real but modest and context-specific. In knee-OA trials retro walking is typically 'non-inferior' or an adjunct, not a miracle, and the cognition claims are the weakest link — the 'engages the brain more' idea rests on higher dual-task demand, not robust cognitive-outcome trials. Needs safe clear space (fall risk).",
    sources: [
      { cite: "Terblanche, E., et al. (2005). The effect of backward locomotion training on the body composition and cardiorespiratory fitness of young women. International Journal of Sports Medicine, 26(3), 214–219.", note: "6-week backward walk/run program lowered submaximal VO2, improved predicted VO2max, and reduced body fat ~2.4%. [Moderate — controlled training study]", link: scholar("Terblanche backward locomotion training body composition cardiorespiratory fitness"), kind: "scholar" },
      { cite: "Balasukumaran, T., et al. (2019). The effectiveness of backward walking in people with knee osteoarthritis: a systematic review and meta-analysis. Clinical Rehabilitation, 33(11).", note: "Combining backward walking with conventional rehab significantly reduced pain and disability across 13 RCTs. [Moderate — SR/MA]", link: scholar("backward walking knee osteoarthritis systematic review meta-analysis"), kind: "scholar" },
    ],
  },
  {
    id: "vestibular-spin", section: "201", title: "Spinning / Vestibular Stimulation", subtitle: "Bolsters clusters: vestibular/balance — the viral 'denser brain' claim is unverified",
    evidenceTag: "Mixed",
    feeds: ["vestibular/balance function", "spatial cognition (population-specific)", "potential neuro-rehab"],
    impact: { magnitude: 1, latency: "days", durability: "transient", effort: "low" },
    description: "The vestibular system projects broadly to cortex and hippocampus. Controlled vestibular stimulation (galvanic, caloric, rotational) is an established research and emerging clinical tool — chiefly for vestibular-loss and neurological populations, not healthy-brain enhancement.",
    callout: "CRITICAL HONESTY: the viral claim that 'spinning increases neural density in a week' is UNVERIFIED — no peer-reviewed human study supports it. The real literature often shows the opposite acutely: non-veridical vestibular input can DISRUPT mental rotation and spatial imagery. Therapeutic promise is population-specific, not a healthy-brain enhancer.",
    sources: [
      { cite: "Dilda, V., MacDougall, H. G., Curthoys, I. S., & Moore, S. T. (2012). Effects of galvanic vestibular stimulation on cognitive function. Experimental Brain Research, 216(2), 275–285.", note: "Suprathreshold GVS INCREASED error rate on match-to-sample and perspective-taking — a disruptive effect. [Moderate]", link: scholar("Dilda galvanic vestibular stimulation cognitive function"), kind: "scholar" },
      { cite: "Mast, F. W., Merfeld, D. M., & Kosslyn, S. M. (2006). Visual mental imagery during caloric vestibular stimulation. Neuropsychologia, 44(1), 101–109.", note: "Caloric vestibular stimulation disrupts high-resolution mental imagery and mental rotation (shared parietal substrates). [Moderate]", link: scholar("visual mental imagery caloric vestibular stimulation Kosslyn"), kind: "scholar" },
    ],
  },
  {
    id: "speed-dating", section: "202", title: "Speed Dating & Mate Choice", subtitle: "Bolsters clusters: social exposure, mate-selection insight",
    evidenceTag: "Moderate",
    feeds: ["social/conversational exposure", "mate-selection insight", "calibration of stated vs revealed preference"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Speed dating is both a social activity and a research paradigm for romantic initiation. Its humbling headline: people's stated ideal-partner preferences poorly predict who they actually desire in person — initial romantic desire is largely unpredictable.",
    callout: "This literature is about attraction and the predictability of desire — NOT evidence that speed dating boosts intelligence or general cognition. Treat it as a social-skill/exposure practice and a window into attraction dynamics, not a cognitive intervention.",
    sources: [
      { cite: "Finkel, E. J., & Eastwick, P. W. (2008). Speed-Dating. Current Directions in Psychological Science, 17(3), 193–197.", note: "Speed dating as a powerful, externally valid paradigm for studying relationship initiation. [Strong — program review]", link: scholar("Finkel Eastwick Speed-Dating Current Directions"), kind: "scholar" },
      { cite: "Eastwick, P. W., & Finkel, E. J. (2008). Sex differences in mate preferences revisited: do people know what they initially desire in a romantic partner? Journal of Personality and Social Psychology, 94(2), 245–264.", note: "Stated ideal preferences did not predict actual in-vivo desire at the event. [Strong]", link: scholar("Eastwick Finkel sex differences mate preferences revisited"), kind: "scholar" },
    ],
  },
  {
    id: "online-dating", section: "203", title: "Online Dating Outcomes & Wellbeing", subtitle: "Bolsters clusters: partner access — but 'matching algorithms' are unsupported",
    evidenceTag: "Moderate",
    feeds: ["partner access", "relationship formation", "expectation-setting about dating tech"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "low" },
    description: "The main real advantage of online dating is ACCESS to potential partners. Effects on relationship formation and wellbeing are genuinely mixed — not uniformly positive.",
    callout: "The flagship PSPI review is skeptical: online dating's 'scientific matching algorithm' marketing is unsubstantiated, and heavy pre-meeting communication or profile-browsing can undermine outcomes. Useful for meeting people, not a validated compatibility engine.",
    sources: [
      { cite: "Finkel, E. J., Eastwick, P. W., Karney, B. R., Reis, H. T., & Sprecher, S. (2012). Online Dating: A Critical Analysis From the Perspective of Psychological Science. Psychological Science in the Public Interest, 13(1), 3–66.", note: "Access = real benefit; matching algorithms unsupported; heavy pre-meeting communication can backfire. [Strong — authoritative review]", link: scholar("Finkel Online Dating Critical Analysis Psychological Science Public Interest 2012"), kind: "scholar" },
      { cite: "Cacioppo, J. T., et al. (2013). Marital satisfaction and break-ups differ across on-line and off-line meeting venues. PNAS, 110(25), 10135–10140.", note: "Marriages that began online showed marginally higher satisfaction / lower breakup — mixed, correlational. [Moderate — observational]", link: scholar("Cacioppo marital satisfaction break-ups online offline meeting venues PNAS"), kind: "scholar" },
    ],
  },
  {
    id: "approaching-strangers", section: "204", title: "Approaching Strangers / Initiating Conversation", subtitle: "Bolsters clusters: social confidence, wellbeing, belonging",
    evidenceTag: "Strong",
    feeds: ["social confidence/exposure", "wellbeing/positive affect", "belonging", "calibration of social forecasts"],
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    description: "Initiating conversation with strangers reliably raises wellbeing for both parties — yet people systematically expect the opposite and undervalue strangers' interest in connecting. Weak-tie and minimal interactions (a barista chat) also boost belonging.",
    callout: "Effects are real and causal but modest and momentary — a mood/belonging and expectation-correction effect, not a personality overhaul. Benefits accrue reliably in aggregate; any single interaction can still fall flat.",
    sources: [
      { cite: "Epley, N., & Schroeder, J. (2014). Mistakenly Seeking Solitude. Journal of Experimental Psychology: General, 143(5), 1980–1999.", note: "Commuters instructed to connect reported a more positive experience; others predicted the opposite. The barrier is underestimating others' interest. [Strong — field experiments]", link: scholar("Epley Schroeder Mistakenly Seeking Solitude"), kind: "scholar" },
      { cite: "Sandstrom, G. M., & Dunn, E. W. (2014). Social Interactions and Well-Being: The Surprising Power of Weak Ties. Personality and Social Psychology Bulletin, 40(7), 910–922.", note: "More weak-tie interactions on a given day → greater happiness and belonging. [Moderate]", link: scholar("Sandstrom Dunn social interactions well-being weak ties"), kind: "scholar" },
    ],
  },
  {
    id: "matchmaking", section: "205", title: "Matchmaking & Social-Network Approval", subtitle: "Bolsters clusters: relationship stability, social support, network embedding",
    evidenceTag: "Moderate",
    feeds: ["relationship stability/commitment", "social support", "network embedding"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "low" },
    description: "Direct evidence on friend/family matchmaking per se is thin. The robust adjacent finding: perceived approval and support from one's social network predicts stronger commitment, more love/satisfaction, and lower breakup likelihood.",
    callout: "Be explicit — 'friends/family setting people up leads to better relationships' is NOT directly established by high-quality trials. What IS supported is that network APPROVAL predicts stability (correlational/longitudinal), and approval can be reciprocal (happy couples elicit more approval).",
    sources: [
      { cite: "Sprecher, S., & Felmlee, D. (1992). The influence of parents and friends on the quality and stability of romantic relationships: A three-wave longitudinal investigation. Journal of Marriage and the Family, 54(4), 888–900.", note: "Network approval predicted lower later breakup and higher relationship quality. [Moderate — longitudinal]", link: scholar("Sprecher Felmlee parents friends quality stability romantic relationships longitudinal"), kind: "scholar" },
      { cite: "Felmlee, D. H. (2001). No couple is an island: A social network perspective on dyadic stability. Social Forces, 79(4), 1259–1287.", note: "Network support predicts dyadic stability; network 'interference' predicts instability. [Moderate]", link: scholar("Felmlee no couple is an island social network dyadic stability"), kind: "scholar" },
    ],
  },
  {
    id: "arranged-courtship", section: "206", title: "Family Involvement in Courtship / Arranged Marriage", subtitle: "Mixed & culture-bound — no consistent global winner",
    evidenceTag: "Mixed",
    feeds: ["relationship satisfaction/commitment", "family/network involvement", "cultural fit"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "moderate" },
    description: "Comparisons of arranged (and modern 'hybrid'/semi-arranged, with veto power) vs love/choice marriages on satisfaction, commitment, and love. Results are genuinely mixed and culturally moderated.",
    callout: "Findings are MIXED, not a clean endorsement of arranged marriage. Regan (2012) found no significant differences; Madathil & Benshoff (2008) found U.S. arranged marriages highest in satisfaction. Most 'arranged' samples are modern hybrids with consent, and selection effects and divorce-stigma differences confound cross-cultural comparisons.",
    sources: [
      { cite: "Regan, P. C., Lakhanpal, S., & Anguiano, C. (2012). Relationship outcomes in Indian-American love-based and arranged marriages. Psychological Reports, 110(3), 915–924.", note: "No significant differences in satisfaction, commitment, or love between arranged and love marriages. [Moderate — cross-sectional]", link: scholar("Regan relationship outcomes Indian-American love-based arranged marriages"), kind: "scholar" },
      { cite: "Madathil, J., & Benshoff, J. M. (2008). Importance of marital characteristics and marital satisfaction: A comparison of Asian Indians in arranged marriages and Americans in marriages of choice. The Family Journal, 16(3), 222–230.", note: "U.S. arranged-marriage group highest satisfaction; India-arranged ≈ U.S.-choice; different valued characteristics. [Moderate]", link: scholar("Madathil Benshoff marital characteristics satisfaction arranged marriages Americans choice"), kind: "scholar" },
    ],
  },
  {
    id: "adult-instrument", section: "207", title: "Learning an Instrument as an Adult", subtitle: "Bolsters clusters: executive function, working memory, mood, social connection",
    evidenceTag: "Moderate",
    feeds: ["executive function/working memory", "processing speed", "mood/wellbeing", "social connection", "motor coordination"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "high" },
    description: "Adult/older-adult music learning (esp. piano) as a cognitive intervention, plus community music-making for wellbeing. Piano-training RCTs show gains in executive function, working memory, and processing speed; group music-making improves mood and social connection.",
    callout: "Real but bounded. Bugos's piano gains were significant post-training but not all maintained at 3-month follow-up — durability requires continued practice. Cognitive transfer is domain-limited, not a broad IQ boost, and community-band wellbeing evidence is observational (joiners are already social).",
    sources: [
      { cite: "Bugos, J. A., Perlstein, W. M., McCrae, C. S., Brophy, T. S., & Bedenbaugh, P. H. (2007). Individualized piano instruction enhances executive functioning and working memory in older adults. Aging & Mental Health, 11(4), 464–471.", note: "6-month piano RCT improved Trail Making & Digit Symbol vs controls; some gains not maintained at 3-month follow-up. [Moderate — RCT]", link: scholar("Bugos individualized piano instruction executive functioning working memory older adults"), kind: "scholar" },
      { cite: "Seinfeld, S., Figueroa, H., Ortiz-Gil, J., & Sanchez-Vives, M. V. (2013). Effects of music learning and piano practice on cognitive function, mood and quality of life in older adults. Frontiers in Psychology, 4, 810.", note: "Piano training improved executive/cognitive measures, mood, and QoL vs controls. [Moderate]", link: scholar("Seinfeld music learning piano practice cognitive function mood quality of life older adults"), kind: "scholar" },
    ],
  },
  {
    id: "love-letters", section: "208", title: "Writing Love Letters / Affectionate Writing", subtitle: "Bolsters clusters: stress physiology, relationship closeness, positive affect",
    evidenceTag: "Moderate",
    feeds: ["stress physiology (cortisol/lipids)", "relationship maintenance/closeness", "positive affect"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Deliberately writing about affection for loved ones (an adaptation of Pennebaker expressive-writing) produced measurable physiological benefits: in two RCTs, affectionate writing significantly reduced total cholesterol vs controls. It sits within Affection Exchange Theory (Floyd).",
    callout: "The result is real but the samples were small healthy college students with capillary/salivary biomarkers, and replication at scale is limited — treat the magnitude cautiously and don't overstate it as a cardiac treatment.",
    sources: [
      { cite: "Floyd, K., Mikkelson, A. C., Hesse, C., & Pauley, P. M. (2007). Affectionate Writing Reduces Total Cholesterol: Two Randomized, Controlled Trials. Human Communication Research, 33(2), 119–142.", note: "Experimental affectionate-writing groups showed significant total-cholesterol reductions vs controls. [Moderate — 2 RCTs]", link: scholar("Floyd affectionate writing reduces total cholesterol randomized controlled trials"), kind: "scholar" },
      { cite: "Floyd, K., et al. (2009). Kissing in marital and cohabiting relationships: Effects on blood lipids, stress, and relationship satisfaction. Western Journal of Communication, 73(2), 113–133.", note: "Affectionate behavior (kissing) improved lipid profile, lowered perceived stress, and raised satisfaction — parallels the affectionate-writing effect. [Moderate]", link: scholar("Floyd kissing marital cohabiting blood lipids stress relationship satisfaction"), kind: "scholar" },
    ],
  },

  // ── M: hunting, pets & recreation (209–218) ───────────────────────────────
  {
    id: "hunting", section: "209", title: "Recreational Hunting & Nature Connection", subtitle: "Bolsters clusters: nature connectedness, agency/self-provisioning, social bonding",
    evidenceTag: "Emerging",
    feeds: ["nature connectedness", "stress down-regulation", "sense of agency/self-provisioning", "physical activity", "social bonding"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "high" },
    description: "Recreational hunting as a nature-immersion and food-provisioning activity. The defensible science is the strong general nature-exposure benefit plus descriptive research showing hunters derive nature-contact, food-agency, and social meaning.",
    callout: "Direct 'hunting improves mental health' causal evidence is essentially absent — no RCTs, and the closest population signal (adolescent wildlife activity) is correlational and mixed. Nearly all claims are inferred from adjacent nature/outdoor-recreation literature, and self-selection is severe.",
    sources: [
      { cite: "Coventry, P. A., Brown, J., Pervin, J., et al. (2021). Nature-based outdoor activities for mental and physical health: Systematic review and meta-analysis. SSM-Population Health, 16, 100934.", note: "Nature-based outdoor activity produced short-to-medium-term improvements in depression, anxiety, mood, and stress markers — general, not hunting-specific. [Strong — but borrowed mechanism]", link: scholar("nature-based outdoor activities mental physical health systematic review meta-analysis Coventry 2021"), kind: "scholar" },
      { cite: "Hinrichs, M. P., Vrtiska, M. P., et al. (2021). Motivations to participate in hunting and angling. Human Dimensions of Wildlife, 26(6).", note: "Four motivation factors — nature, social, food, challenge; nature and social rated most important. [Moderate — descriptive/survey]", link: scholar("Hinrichs Vrtiska motivations hunting angling Human Dimensions of Wildlife 2021"), kind: "scholar" },
    ],
  },
  {
    id: "dog-ownership", section: "210", title: "Dog Ownership & Adoption", subtitle: "Bolsters clusters: physical activity, cardiovascular regulation, companionship",
    evidenceTag: "Moderate",
    feeds: ["physical activity", "cardiovascular regulation", "attachment/companionship", "routine & responsibility", "reduced loneliness"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "high" },
    description: "Dog ownership shows strong survival/cardiovascular benefit; the mental-health evidence is genuinely mixed and tracks attachment quality more than acquisition. Ownership is a years-long commitment of cost and care.",
    callout: "Simply owning a dog is not reliably tied to better mental health — benefit tracks attachment quality and responsibility engagement, not acquisition source. The 'adopt vs. buy' distinction has almost no controlled owner-wellbeing evidence.",
    sources: [
      { cite: "Kramer, C. K., Mehmood, S., & Suen, R. S. (2019). Dog ownership and survival: a systematic review and meta-analysis. Circulation: Cardiovascular Quality and Outcomes, 12(10), e005554.", note: "Dog ownership associated with 24% lower all-cause mortality; larger among prior-CVD patients. [Strong — meta-analysis]", link: scholar("Kramer dog ownership survival systematic review meta-analysis Circulation 2019"), kind: "scholar" },
      { cite: "Hawkins, R. D., et al. (2025). The relationship between attachment to pets and mental health and wellbeing: a systematic review. Animals (MDPI).", note: "116 studies; attachment–mental-health associations are mixed (positive, null, and negative) — ownership alone insufficient. [Mixed — systematic review]", link: scholar("attachment to pets mental health wellbeing systematic review Animals MDPI 2025"), kind: "scholar" },
    ],
  },
  {
    id: "pet-bereavement", section: "211", title: "Pet Caregiving & Bereavement (the owner)", subtitle: "Bolsters clusters: grief processing, meaning-making, continuing bonds",
    evidenceTag: "Moderate",
    feeds: ["grief processing", "meaning-making", "continuing bonds", "anticipatory grief"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "high" },
    description: "Caring for a dying pet and grieving its loss carries real caregiver burden and grief that can rival human loss, alongside a documented meaning / continuing-bonds 'growth' side. Most designs are cross-sectional.",
    callout: "Pet grief is real and sometimes intense, but it is 'disenfranchised' (socially under-validated), which biases who reports and seeks help — and cross-sectional designs make causal/temporal claims about growth weak. The distress side (burden, depression, anxiety) is substantial.",
    sources: [
      { cite: "Spitznagel, M. B., Jacobson, D. M., Cox, M. D., & Carlson, M. D. (2017). Caregiver burden in owners of a sick companion animal: a cross-sectional observational study. Veterinary Record, 181(12), 321.", note: "Owners of chronically/terminally ill pets showed greater burden, stress, depression/anxiety, and poorer quality of life vs. matched controls. [Moderate]", link: scholar("Spitznagel caregiver burden sick companion animal Veterinary Record 2017"), kind: "scholar" },
      { cite: "Packman, W., Field, N. P., Carmack, B. J., & Ronen, R. (2011). Continuing bonds and psychosocial adjustment in pet loss. Journal of Loss and Trauma, 16(4), 341–357.", note: "Continuing bonds with the deceased pet related to both comfort and, when combined with distress, ongoing grief — the meaning-vs-suffering duality. [Moderate]", link: scholar("Packman Field Carmack continuing bonds psychosocial adjustment pet loss 2011"), kind: "scholar" },
    ],
  },
  {
    id: "aquariums", section: "212", title: "Aquariums / Fishkeeping", subtitle: "Bolsters clusters: acute relaxation, attention restoration, anxiety down-regulation",
    evidenceTag: "Moderate",
    feeds: ["acute relaxation", "attention restoration", "anxiety/arousal down-regulation", "mild caregiving routine"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Viewing/keeping fish for relaxation — one of the better-evidenced 'small' hobbies, with a controlled dose-response aquarium study and a systematic review. Effects are modest and mostly acute (mood, heart rate, blood pressure).",
    callout: "Robust for short-term viewing (mood/heart-rate); evidence that home fishkeeping produces lasting trait wellbeing change is thin and largely small-n survey/qualitative.",
    sources: [
      { cite: "Cracknell, D., White, M. P., Pahl, S., Nichols, W. J., & Depledge, M. H. (2016). Marine biota and psychological well-being: a preliminary examination of dose-response effects in an aquarium setting. Environment and Behavior, 48(10), 1242–1269.", note: "As fish stocking increased, viewers watched longer, showed greater heart-rate reductions, and reported better mood. [Moderate — dose-response]", link: scholar("Cracknell marine biota psychological well-being aquarium dose-response Environment and Behavior 2016"), kind: "scholar" },
      { cite: "Clements, H., et al. (2019). The effects of interacting with fish in aquariums on human health and well-being: a systematic review. PLOS ONE, 14(7), e0220524.", note: "Viewing aquarium fish shows potential for relaxation and stress reduction, but the evidence base is limited and heterogeneous. [Moderate]", link: scholar("Clements interacting with fish aquariums human health well-being systematic review PLOS ONE 2019"), kind: "scholar" },
    ],
  },
  {
    id: "bowling", section: "213", title: "League / Social Bowling", subtitle: "Bolsters clusters: social capital, belonging, light activity — bowling-specific evidence thin",
    evidenceTag: "Emerging",
    feeds: ["social capital/belonging", "loneliness reduction", "light physical activity", "routine"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "low" },
    description: "League/social bowling as light physical activity plus social connection. The honest scaffolding is Putnam's social-capital framing and the strong general link between social connection and health/mortality — not bowling-specific outcomes.",
    callout: "There is no good direct evidence that bowling improves health; the case rests on social-capital theory plus general 'social connection is protective' findings. Physical intensity is low.",
    sources: [
      { cite: "Putnam, R. D. (2000). Bowling Alone: The Collapse and Revival of American Community. Simon & Schuster.", note: "Declining league bowling as emblem of eroding social capital; theorizes social ties as tied to civic and personal health. [Framing/theory — not an empirical health study]", link: scholar("Putnam Bowling Alone collapse revival American community social capital"), kind: "scholar" },
      { cite: "Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social relationships and mortality risk: a meta-analytic review. PLoS Medicine, 7(7), e1000316.", note: "Stronger social relationships associated with ~50% greater odds of survival — the empirical backbone for 'social hobbies matter.' [Strong — mechanism, not bowling]", link: scholar("Holt-Lunstad social relationships mortality risk meta-analytic review PLoS Medicine 2010"), kind: "scholar" },
    ],
  },
  {
    id: "batting-cage", section: "214", title: "Batting Cage / Recreational Hitting", subtitle: "Bolsters clusters: acute mood, stress discharge, motor-skill, flow — adjacent evidence only",
    evidenceTag: "Emerging",
    feeds: ["acute mood elevation", "arousal/stress discharge", "motor-skill consolidation", "focused attention/flow"],
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    description: "Repetitive recreational hitting for skill practice and stress release. There are no peer-reviewed studies on batting-cage use and wellbeing — everything here is adjacent inference from acute-exercise mood research and motor-learning science.",
    callout: "No real study on batting cages specifically exists. Claims must be framed as 'consistent with acute-exercise mood benefits and motor-skill practice,' not as established for this activity.",
    sources: [
      { cite: "Reed, J., & Ones, D. S. (2006). The effect of acute aerobic exercise on positive activated affect: a meta-analysis. Psychology of Sport and Exercise, 7(5), 477–514.", note: "Single bouts of physical activity reliably raise positive activated affect, especially at lower/moderate intensity. [Strong — general acute-exercise mood]", link: scholar("Reed Ones acute aerobic exercise positive activated affect meta-analysis 2006"), kind: "scholar" },
      { cite: "Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. Psychological Review, 100(3), 363–406.", note: "Structured, repetitive, feedback-rich practice drives skill acquisition — the mechanism repetitive hitting would engage. [Strong — motor-skill mechanism]", link: scholar("Ericsson Krampe deliberate practice acquisition expert performance Psychological Review 1993"), kind: "scholar" },
    ],
  },
  {
    id: "sport-shooting", section: "215", title: "Target / Sport Shooting", subtitle: "Bolsters clusters: selective attention, arousal regulation (HRV), stress control",
    evidenceTag: "Emerging",
    feeds: ["sustained/selective attention", "arousal regulation (HRV, cardiac timing)", "stress control under pressure"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "moderate" },
    description: "Precision shooting as an attention/arousal-regulation task. The real literature is performance psychophysiology — how attention, heart-rate variability, and arousal relate to shot quality — supporting that shooting trains fine arousal/attention control.",
    callout: "Evidence is about performance/physiology in shooters, not about shooting as a therapy. Any calm/focus benefit is inferred, and shooting carries obvious context-specific risks the wellbeing literature never weighs.",
    sources: [
      { cite: "Tremayne, P., & Barry, R. J. (2001). Elite pistol shooters: physiological patterning of best vs. worst shots. International Journal of Psychophysiology, 41(1), 19–29.", note: "Best shots preceded by distinct cardiac/attentional patterning — precision shooting reflects fine arousal-attention control. [Moderate]", link: scholar("Tremayne Barry elite pistol shooters physiological patterning best worst shots 2001"), kind: "scholar" },
      { cite: "Li, Y., et al. (2024). Relationship between state anxiety, heart rate variability, and shooting performance in adolescent shooters. BMC Psychology.", note: "Higher HRV / better emotion regulation linked to better shooting performance and lower anxiety. [Emerging]", link: scholar("state anxiety heart rate variability shooting performance adolescent shooters BMC Psychology 2024"), kind: "scholar" },
    ],
  },
  {
    id: "board-games", section: "216", title: "Board / Tabletop Games With Friends", subtitle: "Bolsters clusters: executive function, memory, cognitive reserve, social connectedness",
    evidenceTag: "Moderate",
    feeds: ["executive function/attention", "memory", "cognitive reserve", "social connectedness", "mood"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "low" },
    description: "Family/friend tabletop gaming for cognitive stimulation and connection. Moderate and improving evidence for cognition (reviews plus small RCTs in older adults); social-bonding benefit is plausible but under-measured directly.",
    callout: "Cognitive evidence skews toward older-adult / cognitive-impairment samples and small trials; extrapolation to healthy-adult game night is reasonable but not directly demonstrated. Social-bonding outcomes are rarely the measured endpoint.",
    sources: [
      { cite: "Nakao, M. (2019). Board games as a promising tool for health promotion: a review of recent literature. BioPsychoSocial Medicine, 13, 5.", note: "Traditional board games associated with improved cognitive function and reduced depression; newer games aid behavior change. [Moderate — review]", link: scholar("Nakao board games promising tool health promotion review BioPsychoSocial Medicine 2019"), kind: "scholar" },
      { cite: "Chao, S.-Y., et al. (2019). Effect of board game activities on cognitive function improvement among older adults in adult day care centers. Geriatric Nursing.", note: "RCT (n=82) — board-game group showed cognitive-function gains vs. usual-activity controls. [Moderate — RCT]", link: scholar("board game activities cognitive function improvement older adults adult day care centers 2019"), kind: "scholar" },
    ],
  },
  {
    id: "social-dance", section: "217", title: "Adult Social Dance Classes", subtitle: "Bolsters clusters: balance, sensorimotor & reaction time, executive function, mood",
    evidenceTag: "Moderate",
    feeds: ["balance/postural control", "sensorimotor & reaction time", "executive function/memory", "mood", "social connection"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "moderate" },
    description: "Adult learners in partnered/social dance (swing, salsa, ballroom). One of the stronger topics here: a controlled 6-month dance study and a cognition RCT in older adults show balance and cognitive benefits, and the multi-domain load (motor + social + cognitive) is real.",
    callout: "The strongest cognition/balance findings are in older adults; younger-adult mood findings rest on single recent trials not yet broadly replicated. Multi-domain benefit makes clean mechanism attribution hard.",
    sources: [
      { cite: "Kattenstroth, J.-C., Kalisch, T., Holt, S., Tegenthoff, M., & Dinse, H. R. (2013). Six months of dance intervention enhances postural, sensorimotor, and cognitive performance in elderly. Frontiers in Aging Neuroscience, 5, 5.", note: "6 months of weekly dance (adult learners) improved posture, reaction time, cognition, and wellbeing vs. controls. [Moderate–Strong]", link: scholar("Kattenstroth six months dance intervention postural sensorimotor cognitive elderly Frontiers Aging Neuroscience 2013"), kind: "scholar" },
      { cite: "Merom, D., et al. (2016). Cognitive benefits of social dancing and walking in old age: the Dancing Mind randomized controlled trial. Frontiers in Aging Neuroscience, 8, 26.", note: "RCT: social dance produced cognitive/spatial-memory benefits in older adults. [Moderate — RCT]", link: scholar("Merom Dancing Mind randomized controlled trial social dancing cognition older adults 2016"), kind: "scholar" },
    ],
  },
  {
    id: "golf-range", section: "218", title: "Golf Driving Range / Precision Practice", subtitle: "Bolsters clusters: motor learning, focused attention/flow, light activity",
    evidenceTag: "Emerging",
    feeds: ["motor learning/skill acquisition", "focused attention/flow", "light physical activity", "deliberate-practice engagement"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "low" },
    description: "Range/putting practice as motor learning plus light activity. Golf-as-a-whole has solid health evidence, but the driving-range slice specifically is thin — the relevant science is motor-learning and deliberate-practice theory, not range-specific health trials.",
    callout: "The strong evidence is for PLAYING golf (walking, moderate activity, longevity signal) — a driving range removes most of the walking/aerobic component, so those health claims do NOT transfer cleanly. Range practice is better justified as motor-skill/flow than cardiovascular health.",
    sources: [
      { cite: "Murray, A. D., et al. (2017). The relationships between golf and health: a scoping review. British Journal of Sports Medicine, 51(1), 12–19.", note: "Golf provides moderate-intensity activity and is associated with cardiovascular, metabolic, and mental-wellness benefits — for playing, not range practice. [Moderate — scoping review]", link: scholar("Murray relationships between golf and health scoping review British Journal of Sports Medicine 2017"), kind: "scholar" },
      { cite: "Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. Psychological Review, 100(3), 363–406.", note: "Structured, feedback-rich repetition (as at a range) is the engine of precision-skill improvement. [Strong — mechanism, not range-specific]", link: scholar("Ericsson Krampe deliberate practice acquisition expert performance Psychological Review 1993"), kind: "scholar" },
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
