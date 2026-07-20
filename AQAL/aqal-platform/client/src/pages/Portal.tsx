import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { beginAuth } from "@/lib/agreement";
import { Link } from "wouter";
import {
  Search, ChevronDown, ExternalLink, FileText, ShieldCheck,
  Sparkles, LayoutGrid, User, Compass, Users, BookOpen,
  Wrench, Settings, ArrowRight, Download, Trophy, Target,
  Brain, Lightbulb, TrendingUp, Zap, PenTool, BarChart3,
  MessageSquare, Calendar, Star, Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { axisMode, modeColor, MODE_META, ALL_AXES } from "@shared/axisModes";
import CommitmentPanel from "@/components/CommitmentPanel";

// ============================================================
// AQAL Consumer Portal — The user's home after login
// Tabs: Overview | Your Profile | Network | Research Library | Tools | Settings
// Design: Atelier palette (ink/cream/champagne/sage)
// Typography: Cormorant Garamond (display), Inter (body), JetBrains Mono (data)
// ============================================================

const TABS = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "profile", label: "Your Profile", icon: User },
  { id: "commitment", label: "Commitment", icon: PenTool },
  { id: "network", label: "Network", icon: Users },
  { id: "library", label: "Research Library", icon: BookOpen },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = typeof TABS[number]["id"];

// ============================================================
// RESEARCH LIBRARY DATA — 32 verified lines
// ============================================================
const TIER_DATA = {
  established: { label: "Established", desc: "Decades of psychometrics behind a dedicated, validated instrument." },
  applied:     { label: "Applied Cluster", desc: "Real, measured constructs assembled from adjacent lines — not one dedicated test." },
  emerging:    { label: "Emerging", desc: "Genuine research exists; no single ability test is yet the field standard." },
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
  { id:"financial", name:"Financial", family:"new", tier:"established", sources:8, blurb:"Financial literacy, capability, and delay-of-gratification choice.", cite:"Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. Journal of Economic Literature, 52(1), 5–44.", note:"Field-defining review — financial literacy is low everywhere, even in rich, well-educated countries, and it shapes saving, investing, and retirement security over the life cycle.", linkLabel:"doi.org/10.1257/jel.52.1.5", linkUrl:"https://doi.org/10.1257/jel.52.1.5", linkKind:"doi" },
  { id:"humor", name:"Humor", family:"new", tier:"established", sources:7, blurb:"Sense of humor and humor production ability.", cite:"Greengross, G., & Miller, G. (2011). Humor ability reveals intelligence, predicts mating success, and is higher in males. Intelligence, 39(4), 188–192.", note:"Both general and verbal intelligence predicted humor-production ability, which in turn predicted mating success — the empirical backbone of this line.", linkLabel:"doi.org/10.1016/j.intell.2011.03.006", linkUrl:"https://doi.org/10.1016/j.intell.2011.03.006", linkKind:"doi" },
  { id:"seductive", name:"Seductive", family:"new", tier:"emerging", sources:7, blurb:"Mating intelligence and courtship signaling.", cite:"O'Brien, D. T., Geher, G., Gallup, A. C., Garcia, J. R., & Kaufman, S. B. (2010). Self-perceived mating intelligence predicts sexual behavior in college students. Imagination, Cognition and Personality, 29(4), 341–362.", note:"The key validation study: scores on the Mating Intelligence Scale predicted actual sexual behavior — the strongest single evidence this line is measurable at all.", linkLabel:"doi.org/10.2190/IC.29.4.e", linkUrl:"https://doi.org/10.2190/IC.29.4.e", linkKind:"doi" },
  { id:"parental", name:"Parental", family:"new", tier:"applied", sources:7, blurb:"Parental self-efficacy and reflective functioning.", cite:"Johnston, C., & Mash, E. J. (1989). A measure of parenting satisfaction and efficacy. Journal of Clinical Child Psychology, 18(2), 167–175.", note:"Established the modern two-factor Parenting Sense of Competence scale — Satisfaction and Efficacy — still the field's workhorse instrument.", linkLabel:"doi.org/10.1207/s15374424jccp1802_8", linkUrl:"https://doi.org/10.1207/s15374424jccp1802_8", linkKind:"doi" },
  { id:"community", name:"Community-Founding", family:"new", tier:"applied", sources:8, blurb:"Collective efficacy and sense of community.", cite:"Sampson, R. J., Raudenbush, S. W., & Earls, F. (1997). Neighborhoods and violent crime: A multilevel study of collective efficacy. Science, 277(5328), 918–924.", note:"One of the most-cited papers in social science — defined and measured collective efficacy, and showed it predicts lower violence across hundreds of neighborhoods.", linkLabel:"doi.org/10.1126/science.277.5328.918", linkUrl:"https://doi.org/10.1126/science.277.5328.918", linkKind:"doi" },
  { id:"logical", name:"Logical", family:"cognitive", tier:"established", sources:3, blurb:"Deductive, inductive, and conditional reasoning.", cite:"Frederick, S. (2005). Cognitive reflection and decision making. Journal of Economic Perspectives, 19(4), 25–42.", note:"Introduces the 3-item Cognitive Reflection Test, measuring the tendency to override a wrong gut answer with deliberation.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Frederick+Cognitive+reflection+and+decision+making+2005", linkKind:"scholar" },
  { id:"mathematical", name:"Mathematical", family:"cognitive", tier:"established", sources:3, blurb:"Quantitative reasoning and numeracy.", cite:"Richardson, F. C., & Suinn, R. M. (1972). The Mathematics Anxiety Rating Scale: Psychometric data. Journal of Counseling Psychology, 19(6), 551–554.", note:"The origin instrument for math anxiety, still the field's template — separates the affective barrier from underlying numerical ability.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Richardson+Suinn+Mathematics+Anxiety+Rating+Scale+1972", linkKind:"scholar" },
  { id:"spatial", name:"Spatial", family:"cognitive", tier:"established", sources:3, blurb:"Spatial visualization and mental rotation.", cite:"Shepard, R. N., & Metzler, J. (1971). Mental rotation of three-dimensional objects. Science, 171(3972), 701–703.", note:"The landmark demonstration that people mentally rotate images in real time — response time scales with angle of rotation.", linkLabel:"doi.org/10.1126/science.171.3972.701", linkUrl:"https://doi.org/10.1126/science.171.3972.701", linkKind:"doi" },
  { id:"pattern", name:"Pattern-Recognition", family:"cognitive", tier:"established", sources:3, blurb:"Fluid, inductive pattern detection.", cite:"Raven, J. (2000). The Raven's Progressive Matrices: Change and stability over culture and time. Cognitive Psychology, 41(1), 1–48.", note:"Reviews the most widely used culture-reduced measure of inductive, fluid reasoning and its stability across populations.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Raven+Progressive+Matrices+change+and+stability+over+culture+and+time+2000", linkKind:"scholar" },
  { id:"linguistic", name:"Linguistic", family:"cognitive", tier:"established", sources:3, blurb:"Verbal range, precision, and comprehension.", cite:"Dunn, L. M., & Dunn, D. M. (2007). Peabody Picture Vocabulary Test (4th ed.). Pearson.", note:"A widely used, well-normed measure of receptive vocabulary — a practical index of verbal ability across the lifespan.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Dunn+Peabody+Picture+Vocabulary+Test+PPVT-4", linkKind:"scholar" },
  { id:"musical", name:"Musical", family:"aesthetic", tier:"established", sources:3, blurb:"Musical aptitude and sophistication.", cite:"Müllensiefen, D., Gingras, B., Musil, J., & Stewart, L. (2014). The musicality of non-musicians. PLoS ONE, 9(2), e89642.", note:"Introduces the Gold-MSI, validated on 100,000+ people — the modern standard for measuring musicality beyond formal training.", linkLabel:"Google Scholar (open access)", linkUrl:"https://scholar.google.com/scholar?q=Mullensiefen+musicality+of+non-musicians+Goldsmiths+Musical+Sophistication+Index+2014", linkKind:"scholar" },
  { id:"bodily", name:"Bodily-Kinesthetic", family:"aesthetic", tier:"established", sources:3, blurb:"Motor proficiency and skilled bodily control.", cite:"Bruininks, R. H., & Bruininks, B. D. (2005). Bruininks-Oseretsky Test of Motor Proficiency (2nd ed.). Pearson/AGS.", note:"The standard normed measure of fine and gross motor proficiency, balance, coordination, and dexterity.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Bruininks-Oseretsky+Test+of+Motor+Proficiency+BOT-2", linkKind:"scholar" },
  { id:"naturalist", name:"Naturalist", family:"aesthetic", tier:"emerging", sources:3, blurb:"Sensitivity to living systems.", cite:"Gardner, H. (1999). Intelligence Reframed: Multiple Intelligences for the 21st Century. Basic Books.", note:"Where naturalist intelligence was formally proposed — and where the honest gap is: no dedicated ability measure exists yet.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Gardner+Intelligence+Reframed+naturalist+intelligence+eighth", linkKind:"scholar" },
  { id:"aesthetic", name:"Aesthetic", family:"aesthetic", tier:"emerging", sources:3, blurb:"Discernment of form, proportion, and quality.", cite:"Myszkowski, N., & Storme, M. (2017). Measuring 'good taste' with the Visual Aesthetic Sensitivity Test-Revised. Personality and Individual Differences, 117, 91–96.", note:"A modern psychometric revival of aesthetic-sensitivity testing, scoring agreement with expert aesthetic judgment.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Myszkowski+Storme+Visual+Aesthetic+Sensitivity+Test+VAST-R+good+taste", linkKind:"scholar" },
  { id:"interpersonal", name:"Interpersonal", family:"social", tier:"established", sources:3, blurb:"Modelling and moving other minds.", cite:"Baron-Cohen, S., Wheelwright, S., Hill, J., Raste, Y., & Plumb, I. (2001). The 'Reading the Mind in the Eyes' Test revised version. Journal of Child Psychology and Psychiatry, 42(2), 241–251.", note:"The standard performance measure of adult mentalizing — sensitive to subtle individual differences in reading others' mental states.", linkLabel:"doi.org/10.1111/1469-7610.00715", linkUrl:"https://doi.org/10.1111/1469-7610.00715", linkKind:"doi" },
  { id:"intrapersonal", name:"Intrapersonal", family:"social", tier:"established", sources:3, blurb:"Accuracy and coherence of the self-model.", cite:"Campbell, J. D., Trapnell, P. D., Heine, S. J., Katz, I. M., Lavallee, L. F., & Lehman, D. R. (1996). Self-concept clarity. Journal of Personality and Social Psychology, 70(1), 141–156.", note:"Introduces the Self-Concept Clarity Scale, linking a clear, coherent self-model to well-being and stable self-esteem.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Campbell+Self-concept+clarity+measurement+personality+correlates+1996", linkKind:"scholar" },
  { id:"emotional", name:"Emotional", family:"social", tier:"established", sources:3, blurb:"Perceiving, using, understanding, and managing emotion.", cite:"Mayer, J. D., Salovey, P., Caruso, D. R., & Sitarenios, G. (2003). Measuring emotional intelligence with the MSCEIT V2.0. Emotion, 3(1), 97–105.", note:"The flagship ability test of EI — performance-scored across four branches, the anchor for treating EI as a measurable intelligence.", linkLabel:"doi.org/10.1037/1528-3542.3.1.97", linkUrl:"https://doi.org/10.1037/1528-3542.3.1.97", linkKind:"doi" },
  { id:"socialperceptual", name:"Social-Perceptual", family:"social", tier:"established", sources:3, blurb:"Reading status, intent, and unspoken states.", cite:"Baron-Cohen, S., Wheelwright, S., Hill, J., Raste, Y., & Plumb, I. (2001). The 'Reading the Mind in the Eyes' Test revised version. Journal of Child Psychology and Psychiatry, 42(2), 241–251.", note:"Same instrument, different lens here: decoding others' mental states from minimal cues, scored against consensus answers.", linkLabel:"doi.org/10.1111/1469-7610.00715", linkUrl:"https://doi.org/10.1111/1469-7610.00715", linkKind:"doi" },
  { id:"moral", name:"Moral", family:"social", tier:"established", sources:3, blurb:"Moral reasoning and judgment development.", cite:"Rest, J., Narvaez, D., Thoma, S. J., & Bebeau, M. J. (1999). DIT2: Devising and testing a revised instrument of moral judgment. Journal of Educational Psychology, 91(4), 644–659.", note:"The revised Defining Issues Test — the most widely used measure of moral-judgment development, grounded in neo-Kohlbergian theory.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Rest+Narvaez+Thoma+Bebeau+DIT2+revised+instrument+of+moral+judgment+1999", linkKind:"scholar" },
  { id:"existential", name:"Existential", family:"social", tier:"emerging", sources:3, blurb:"Meaning, mortality, and ultimate questions.", cite:"King, D. B., & DeCicco, T. L. (2009). A viable model and self-report measure of spiritual intelligence. International Journal of Transpersonal Studies, 28(1), 68–85.", note:"The most-used measure in this space — with the honest caveat that the 'intelligence' framing itself is contested in the literature.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=King+DeCicco+viable+model+self-report+measure+of+spiritual+intelligence+SISRI-24+2009", linkKind:"scholar" },
  { id:"metacognitive", name:"Meta-Cognitive", family:"axes", tier:"established", sources:3, blurb:"Knowledge and regulation of one's own cognition.", cite:"Schraw, G., & Dennison, R. S. (1994). Assessing metacognitive awareness. Contemporary Educational Psychology, 19(4), 460–475.", note:"Introduces the Metacognitive Awareness Inventory, distinguishing knowledge of cognition from regulation of cognition.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Schraw+Dennison+Assessing+metacognitive+awareness+inventory+1994", linkKind:"scholar" },
  { id:"volitional", name:"Volitional", family:"axes", tier:"established", sources:3, blurb:"Grit, self-control, and sustained will.", cite:"Duckworth, A. L., Peterson, C., Matthews, M. D., & Kelly, D. R. (2007). Grit: Perseverance and passion for long-term goals. Journal of Personality and Social Psychology, 92(6), 1087–1101.", note:"Predicts West Point cadet retention and National Spelling Bee ranking, with incremental validity over IQ and conscientiousness.", linkLabel:"doi.org/10.1037/0022-3514.92.6.1087", linkUrl:"https://doi.org/10.1037/0022-3514.92.6.1087", linkKind:"doi" },
  { id:"adversarial", name:"Adversarial", family:"axes", tier:"emerging", sources:3, blurb:"Skill expressed against an opponent.", cite:"Chase, W. G., & Simon, H. A. (1973). Perception in chess. Cognitive Psychology, 4(1), 55–81.", note:"The founding study of expertise, showing masters encode board patterns novices cannot — no single dedicated scale exists for this line yet.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Chase+Simon+Perception+in+chess+1973", linkKind:"scholar" },
  { id:"interoceptive", name:"Interoceptive", family:"axes", tier:"established", sources:3, blurb:"Accuracy of internal bodily signals.", cite:"Schandry, R. (1981). Heartbeat perception and emotional experience. Psychophysiology, 18(4), 483–488.", note:"The classic heartbeat-detection paradigm that made interoceptive accuracy objectively measurable, not just self-reported.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Schandry+Heartbeat+perception+and+emotional+experience+1981", linkKind:"scholar" },
  { id:"strategic", name:"Strategic", family:"applied", tier:"applied", sources:3, blurb:"Planning and multi-step lookahead.", cite:"Shallice, T. (1982). Specific impairments of planning. Philosophical Transactions of the Royal Society B, 298(1089), 199–209.", note:"Introduces the Tower of London task, the standard measure of planning ability — though strategic reasoning resists a single dedicated test.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Shallice+Specific+impairments+of+planning+Tower+of+London+1982", linkKind:"scholar" },
  { id:"systemic", name:"Systemic", family:"applied", tier:"emerging", sources:3, blurb:"Seeing wholes, loops, and second-order effects.", cite:"Davis, A. C., & Stroink, M. L. (2016). The relationship between systems thinking and the New Ecological Paradigm. Systems Research and Behavioral Science, 33(4), 575–586.", note:"Develops and applies a measure of systems thinking as an individual difference — still a genuinely emerging construct.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Davis+Stroink+systems+thinking+New+Ecological+Paradigm+scale+2016", linkKind:"scholar" },
  { id:"entrepreneurial", name:"Entrepreneurial", family:"applied", tier:"established", sources:3, blurb:"Turning a vision into a shipped venture.", cite:"Lumpkin, G. T., & Dess, G. G. (1996). Clarifying the entrepreneurial orientation construct and linking it to performance. Academy of Management Review, 21(1), 135–172.", note:"The field-defining articulation of entrepreneurial orientation and its link to venture performance.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Lumpkin+Dess+Clarifying+the+entrepreneurial+orientation+construct+1996", linkKind:"scholar" },
  { id:"creative", name:"Creative", family:"applied", tier:"established", sources:3, blurb:"Divergent thinking and idea production.", cite:"Mednick, S. A. (1962). The associative basis of the creative process. Psychological Review, 69(3), 220–232.", note:"Introduces the associative theory of creativity and the Remote Associates Test — the field's convergent-thinking measure.", linkLabel:"doi.org/10.1037/h0048850", linkUrl:"https://doi.org/10.1037/h0048850", linkKind:"doi" },
  { id:"rhetorical", name:"Rhetorical", family:"applied", tier:"applied", sources:3, blurb:"Communicative competence and persuasion.", cite:"Cacioppo, J. T., & Petty, R. E. (1982). The need for cognition. Journal of Personality and Social Psychology, 42(1), 116–131.", note:"Introduces the Need for Cognition scale, central to the Elaboration Likelihood Model of how arguments actually get processed.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Cacioppo+Petty+The+need+for+cognition+scale+1982", linkKind:"scholar" },
  { id:"leadership", name:"Leadership", family:"applied", tier:"established", sources:3, blurb:"Eliciting real commitment and coordinated action.", cite:"Bass, B. M. (1985). Leadership and Performance Beyond Expectations. Free Press.", note:"The foundational theory of transformational leadership and the basis of the Multifactor Leadership Questionnaire.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Bass+Leadership+and+Performance+Beyond+Expectations+transformational+1985", linkKind:"scholar" },
  { id:"mechanical", name:"Mechanical", family:"applied", tier:"established", sources:3, blurb:"Practical grasp of how things work.", cite:"Bennett, G. K. (2008). Bennett Mechanical Comprehension Test (BMCT-II). Pearson.", note:"The long-standing standard measure of mechanical reasoning, used for decades in technical selection.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Bennett+Mechanical+Comprehension+Test+BMCT", linkKind:"scholar" },
  { id:"streetsmarts", name:"Street-Smarts", family:"applied", tier:"applied", sources:3, blurb:"Real-world reads under real stakes.", cite:"Wagner, R. K., & Sternberg, R. J. (1985). Practical intelligence in real-world pursuits: The role of tacit knowledge. Journal of Personality and Social Psychology, 49(2), 436–458.", note:"Introduces tacit knowledge and shows it predicts real-world performance largely independently of IQ.", linkLabel:"Google Scholar", linkUrl:"https://scholar.google.com/scholar?q=Wagner+Sternberg+Practical+intelligence+tacit+knowledge+real-world+pursuits+1985", linkKind:"scholar" },
];

const TOTAL_LINES_COUNT = LINES.length;
const TOTAL_SOURCES = 118;

// ============================================================
// AXIS LABELS for radar
// ============================================================
const AXIS_LABELS = ALL_AXES;

// ============================================================
// COMPONENTS
// ============================================================

function PortalNav({ activeTab, setActiveTab, user }: { activeTab: TabId; setActiveTab: (t: TabId) => void; user: any }) {
  return (
    <nav className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-[1180px] mx-auto flex items-center gap-6 h-[60px] px-5">
        <Link href="/" className="font-display text-[21px] font-semibold tracking-wide flex-shrink-0">
          AQAL<span className="text-primary">.</span>
        </Link>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-mono text-[10.5px] tracking-[0.13em] uppercase whitespace-nowrap px-3 py-5 border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-primary">{user?.name?.[0] || "?"}</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground hidden md:block">{user?.name}</span>
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function OverviewTab({ user, scores, assessment }: { user: any; scores: any; assessment: any }) {
  const hasResults = scores && scores.length > 0;
  const topScores = useMemo(() => {
    if (!scores || scores.length === 0) return [];
    return [...scores]
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }, [scores]);

  const rarityScore = useMemo(() => {
    if (!scores || scores.length === 0) return null;
    const avg = scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / scores.length;
    return Math.round(avg * 100);
  }, [scores]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary to-background p-8">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="font-mono text-[10px] tracking-[0.3em] text-primary mb-3">YOUR INTELLIGENCE OBSERVATORY</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">
            Welcome back, {user?.name?.split(" ")[0] || "Explorer"}
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Your intelligence profile is a living document — it grows as you do.
            Explore your results, discover complementary minds, and access tools designed for your unique cognitive architecture.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-secondary border-border">
          <div className="font-display text-[32px] text-primary">{hasResults ? "32" : "—"}</div>
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">Lines Measured</p>
        </Card>
        <Card className="p-5 bg-secondary border-border">
          <div className="font-display text-[32px] text-foreground">{rarityScore || "—"}<span className="text-[16px] text-muted-foreground">th</span></div>
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">Composite Rarity</p>
        </Card>
        <Card className="p-5 bg-secondary border-border">
          <div className="font-display text-[32px] text-accent">{hasResults ? scores.filter((s: any) => (s.score || 0) >= 0.9).length : "—"}</div>
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">Elite Lines (90+)</p>
        </Card>
        <Card className="p-5 bg-secondary border-border">
          <div className="font-display text-[32px] text-foreground">{user?.membershipTier || "free"}</div>
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">Membership Tier</p>
        </Card>
      </div>

      {/* Top Strengths */}
      {hasResults && (
        <Card className="p-6 bg-secondary border-border">
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">Your Top 5 Lines</h3>
          <div className="space-y-3">
            {topScores.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-foreground font-medium">{s.axisName || AXIS_LABELS[i] || `Axis ${i + 1}`}</span>
                    <span className="font-mono text-[11px] text-primary">{Math.round((s.score || 0) * 100)}th</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${(s.score || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/assessment">
          <Card className="p-5 bg-secondary border-border hover:border-primary/40 transition-all cursor-pointer group">
            <Target className="w-5 h-5 text-primary mb-3" />
            <h4 className="text-sm font-medium text-foreground mb-1">{hasResults ? "Retake Assessment" : "Take Assessment"}</h4>
            <p className="text-[11px] text-muted-foreground">32 dimensions, multi-AI panel, 30–60 min interview</p>
            <ArrowRight className="w-4 h-4 text-primary mt-3 group-hover:translate-x-1 transition-transform" />
          </Card>
        </Link>
        <Link href="/leaderboard">
          <Card className="p-5 bg-secondary border-border hover:border-primary/40 transition-all cursor-pointer group">
            <Trophy className="w-5 h-5 text-accent mb-3" />
            <h4 className="text-sm font-medium text-foreground mb-1">Leaderboard</h4>
            <p className="text-[11px] text-muted-foreground">See where you stand among all assessed minds</p>
            <ArrowRight className="w-4 h-4 text-primary mt-3 group-hover:translate-x-1 transition-transform" />
          </Card>
        </Link>
        <Link href="/coaching">
          <Card className="p-5 bg-secondary border-border hover:border-primary/40 transition-all cursor-pointer group">
            <Brain className="w-5 h-5 text-[#D19A72] mb-3" />
            <h4 className="text-sm font-medium text-foreground mb-1">AI Coaching</h4>
            <p className="text-[11px] text-muted-foreground">Personalized growth letters based on your profile</p>
            <ArrowRight className="w-4 h-4 text-primary mt-3 group-hover:translate-x-1 transition-transform" />
          </Card>
        </Link>
      </div>

      {/* Commitment prompt */}
      {hasResults && (
        <Link href="/commitment">
          <Card className="p-6 bg-gradient-to-br from-primary/[0.07] to-background border-primary/25 hover:border-primary/50 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <PenTool className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display text-lg text-foreground mb-1">Make your Personal Commitment Agreement</h4>
                  <p className="text-[12px] text-muted-foreground max-w-md leading-relaxed">
                    Speak your reasons out loud, sign it, and keep it. The private document you return to whenever you falter — so you never need nagging to follow through.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Card>
        </Link>
      )}

      {/* No results state */}
      {!hasResults && (
        <Card className="p-8 bg-secondary border-border text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-display text-foreground mb-2">Your profile awaits</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Take the AQAL assessment to unlock your full intelligence profile, rarity score, and access to the network matching engine.
          </p>
          <Link href="/assessment">
            <Button className="bg-primary text-primary-foreground">Begin Assessment</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// PROFILE TAB — Radar + Axis Breakdown
// ============================================================
function ProfileTab({ scores }: { scores: any }) {
  const hasResults = scores && scores.length > 0;

  if (!hasResults) {
    return (
      <div className="text-center py-16 animate-in fade-in duration-500">
        <User className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">No profile data yet</h3>
        <p className="text-sm text-muted-foreground mb-6">Complete the assessment to see your full intelligence profile here.</p>
        <Link href="/assessment"><Button>Take Assessment</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-primary mb-1">INTELLIGENCE PROFILE</p>
          <h2 className="font-display text-2xl font-semibold">Your 32-Line Map</h2>
        </div>
        <div className="flex gap-2">
          <Link href="/results">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="w-3.5 h-3.5" /> Full Results
            </Button>
          </Link>
          <Link href="/intelligence-profile">
            <Button variant="outline" size="sm" className="gap-2">
              <Compass className="w-3.5 h-3.5" /> Observatory
            </Button>
          </Link>
        </div>
      </div>

      {/* Axis Grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {scores.map((s: any, i: number) => {
          const axisName = s.axisName || AXIS_LABELS[i] || `Axis ${i + 1}`;
          const mode = axisMode(axisName);
          const color = modeColor(axisName);
          const pct = Math.round((s.score || 0) * 100);
          return (
            <Card key={i} className="p-4 bg-secondary border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[12px] font-medium text-foreground">{s.axisName || AXIS_LABELS[i] || `Axis ${i + 1}`}</span>
                </div>
                <span className="font-mono text-[11px] text-primary">{pct}th</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">{MODE_META[mode]?.label || mode}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// NETWORK TAB — Links to intelligence-profile network
// ============================================================
function NetworkTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <p className="font-mono text-[10px] tracking-[0.3em] text-primary mb-1">COMPLEMENTARITY ENGINE</p>
        <h2 className="font-display text-2xl font-semibold mb-2">Your Network</h2>
        <p className="text-sm text-muted-foreground max-w-lg">
          The matching engine finds minds that complement yours — not mirrors, but people whose strengths fill your gaps and vice versa.
        </p>
      </div>
      <Link href="/intelligence-profile">
        <Card className="p-8 bg-secondary border-border hover:border-primary/40 transition-all cursor-pointer group text-center">
          <Users className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="font-display text-lg text-foreground mb-2">Open Network Observatory</h3>
          <p className="text-sm text-muted-foreground mb-4">View your complementary matches, resonance scores, and growth opportunities.</p>
          <Button className="gap-2">
            View Matches <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </Link>
    </div>
  );
}

// ============================================================
// RESEARCH LIBRARY TAB
// ============================================================
function TierDot({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    established: "bg-primary border-primary",
    applied: "border-accent bg-transparent",
    emerging: "border-[#D19A72] bg-transparent border-dashed",
  };
  return <span className={`inline-block w-2 h-2 rounded-full border ${colors[tier] || ""}`} />;
}

function LineCard({ line, open, onToggle }: { line: typeof LINES[0]; open: boolean; onToggle: () => void }) {
  const tierData = TIER_DATA[line.tier as keyof typeof TIER_DATA];
  const moreCount = line.sources - 1;
  const volLabel = line.family === "new" ? "Volume I" : "Volume II";
  const tierColor = line.tier === "established" ? "text-primary" : line.tier === "applied" ? "text-accent" : "text-[#D19A72]";

  return (
    <div className={`rounded-lg border transition-all duration-200 ${open ? "border-primary/40 bg-secondary" : "border-border bg-secondary hover:border-border/80"}`}>
      <button type="button" className="w-full text-left p-4" onClick={onToggle} aria-expanded={open}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-[17px] font-semibold text-foreground">{line.name}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`} />
        </div>
        <div className={`flex items-center gap-2 font-mono text-[9px] tracking-[0.12em] uppercase mb-2 ${tierColor}`}>
          <TierDot tier={line.tier} />
          {tierData?.label}
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">{line.blurb}</p>
        <div className="font-mono text-[9.5px] text-muted-foreground">{line.sources} source{line.sources !== 1 ? "s" : ""} · {volLabel}</div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <p className="text-[11.5px] font-semibold text-foreground leading-relaxed mb-2">{line.cite}</p>
          <p className="font-display italic text-[14px] text-muted-foreground leading-relaxed mb-3">{line.note}</p>
          <a
            href={line.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] text-primary border-b border-primary/30 hover:border-primary pb-0.5 transition-colors"
          >
            {line.linkKind === "doi" ? <ShieldCheck className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
            {line.linkLabel}
          </a>
          {moreCount > 0 && (
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] text-muted-foreground mt-3">
              <FileText className="w-3 h-3" /> +{moreCount} more source{moreCount !== 1 ? "s" : ""} in {volLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResearchLibraryTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold mb-3">The Research Library</h2>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Every one of the 32 intelligence lines, traced to a real, published source.
          Click through and check it yourself — that's the whole point.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-secondary p-5">
          <div className="font-display text-3xl font-bold text-foreground">32</div>
          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">Lines</div>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-5">
          <div className="font-display text-3xl font-bold text-foreground">118</div>
          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">Sources</div>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-5">
          <div className="font-display text-3xl font-bold text-primary">0</div>
          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">Fabricated</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-secondary p-5">
          <div className="font-mono text-[9.5px] tracking-[0.22em] text-muted-foreground mb-2">VOLUME I</div>
          <div className="font-display text-xl font-semibold mb-1">The Five New Lines</div>
          <p className="text-[12.5px] text-muted-foreground mb-3">Financial, Humor, Seductive, Parental, and Community-Founding — annotated, source by source.</p>
          <div className="font-mono text-[10px] text-muted-foreground mb-3">37 sources · 12 pages</div>
          <a href="/manus-storage/AQALResearchLibraryVol1_0c460f0e.pdf" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.10em] uppercase text-primary border border-primary/40 rounded px-3 py-2 hover:bg-primary/5 transition-colors">
            <FileText className="w-3 h-3" /> View PDF
          </a>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-5">
          <div className="font-mono text-[9.5px] tracking-[0.22em] text-muted-foreground mb-2">VOLUME II</div>
          <div className="font-display text-xl font-semibold mb-1">The Twenty-Seven Classical &amp; Applied Lines</div>
          <p className="text-[12.5px] text-muted-foreground mb-3">From Logical to Street-Smarts — every remaining line, sourced across five families.</p>
          <div className="font-mono text-[10px] text-muted-foreground mb-3">81 sources · 18 pages</div>
          <a href="/manus-storage/AQALResearchLibraryVol2_77564b0b.pdf" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.10em] uppercase text-primary border border-primary/40 rounded px-3 py-2 hover:bg-primary/5 transition-colors">
            <FileText className="w-3 h-3" /> View PDF
          </a>
        </div>
      </div>

      <Link href="/research-library" className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] uppercase text-primary hover:text-primary/80 transition-colors border-b border-primary/30 hover:border-primary pb-0.5">
        Open full Research Library <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}


// ============================================================
// TOOLS TAB
// ============================================================
// ============================================================
// 30 / 60 / 90-day behavioral tracker — the recurring loop
// ============================================================
function BehavioralTrackerCard({ user }: { user: any }) {
  const [days, setDays] = useState(30);
  const [journal, setJournal] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const isFree = !user?.membershipTier || user?.membershipTier === "free";
  const docQuery = trpc.tracker.doc.useQuery({ days }, { enabled: !isFree });
  const cyclesQuery = trpc.tracker.cycles.useQuery(undefined, { enabled: !isFree });
  const submit = trpc.tracker.submitJournal.useMutation({
    onSuccess: (res: any) => {
      if (res?.error) return toast.error(res.error);
      if (res?.locked) return toast.error("Tracker cycles are part of membership.");
      setAnalysis(res.analysis);
      setJournal("");
      cyclesQuery.refetch();
      toast.success("Cycle logged — profile updated (self-reported).");
    },
    onError: () => toast.error("Could not process the journal. Try again."),
  });

  function downloadDoc() {
    const md = (docQuery.data as any)?.markdown;
    if (!md) return toast.info("Preparing your tracker template…");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `behavioral-tracker-${days}day.md`; a.click();
    URL.revokeObjectURL(url);
  }

  const DIR: Record<string, string> = { up: "↑", steady: "→", down: "↓" };
  const DIRC: Record<string, string> = { up: "text-emerald-400", steady: "text-muted-foreground", down: "text-amber-400" };

  return (
    <Card className="p-6 bg-secondary border-border">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-display text-xl font-semibold">30 / 60 / 90-Day Behavioral Tracker</h3>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl mb-4">
        Speak your daily entry into any AI (5–7 min), paste it into the template, and upload the finished journal
        each cycle. We update your profile from what you report and refresh your Vision.{" "}
        <span className="text-foreground/70">Self-reported — taken at your word, not a re-measurement.</span>
      </p>
      {isFree ? (
        <p className="text-[13px] text-muted-foreground">
          The tracker loop is part of membership.{" "}
          <Link href="/pricing"><span className="text-primary cursor-pointer underline">See plans</span></Link>.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex gap-1">
              {[30, 60, 90].map((d) => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded text-[12px] font-mono border transition-colors ${days === d ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {d}-day
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-[12px] text-primary px-2" onClick={downloadDoc}>
              <Download className="w-3.5 h-3.5" /> Download template
            </Button>
          </div>

          <label className="block text-[12px] text-muted-foreground mb-1.5">Paste your completed {days}-day journal</label>
          <Textarea value={journal} onChange={(e) => setJournal(e.target.value)} rows={6}
            placeholder="Paste the dictated journal you built from the template…" className="mb-3 bg-background/40" />
          <Button disabled={submit.isPending || journal.trim().length < 20}
            onClick={() => submit.mutate({ journalText: journal, days })} className="gap-1">
            {submit.isPending ? "Analyzing…" : "Upload & update my profile"}
          </Button>

          {analysis && (
            <div className="mt-6 border-t border-border pt-5 space-y-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary mb-1">This cycle</p>
                <p className="text-[14px] text-foreground/90 leading-relaxed">{analysis.summary}</p>
              </div>
              {analysis.adherenceNote && <p className="text-[13px] text-muted-foreground">{analysis.adherenceNote}</p>}
              {analysis.adjustments?.length > 0 && (
                <div className="space-y-1.5">
                  {analysis.adjustments.map((a: any, i: number) => (
                    <div key={i} className="flex gap-2 text-[13px]">
                      <span className={`font-mono ${DIRC[a.direction] ?? ""}`}>{DIR[a.direction] ?? "→"}</span>
                      <span className="text-foreground/80"><b className="text-foreground">{a.line}</b> — {a.note}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.freshVision && (
                <div className="rounded-md bg-primary/[0.06] border border-primary/20 p-4">
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary mb-1">Your refreshed vision</p>
                  <p className="text-[14px] text-foreground/90 italic leading-relaxed">{analysis.freshVision}</p>
                </div>
              )}
              {analysis.disclaimer && <p className="text-[11px] text-muted-foreground/70">{analysis.disclaimer}</p>}
            </div>
          )}

          {Array.isArray(cyclesQuery.data) && cyclesQuery.data.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground mb-2">Cycle history</p>
              <div className="space-y-1.5">
                {cyclesQuery.data.map((c: any) => (
                  <div key={c.id} className="flex justify-between gap-4 text-[12px] text-muted-foreground">
                    <span className="whitespace-nowrap">Cycle {c.cycleNumber} · {c.days}-day</span>
                    <span className="text-foreground/60 truncate">{c.summary?.slice(0, 90)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function ToolsTab({ user }: { user: any }) {
  const tools = [
    {
      icon: TrendingUp,
      title: "Growth Planner",
      desc: "AI-generated development roadmap based on your weakest lines and highest-leverage growth opportunities.",
      action: "/coaching",
      tier: "gold",
    },
    {
      icon: Zap,
      title: "Axis Comparison",
      desc: "Compare your profile against population norms, specific archetypes, or another user (with consent).",
      action: "/results",
      tier: "free",
    },
    {
      icon: PenTool,
      title: "Reflection Journal",
      desc: "Guided journaling prompts tailored to your developmental stance lines — humor, parenting, community.",
      action: null,
      tier: "gold",
    },
    {
      icon: MessageSquare,
      title: "AI Coaching Letters",
      desc: "Receive personalized coaching letters that address your specific cognitive architecture and growth edges.",
      action: "/coaching",
      tier: "gold",
    },
    {
      icon: BarChart3,
      title: "NLP Report",
      desc: "Your full neuro-linguistic programming profile — meta-programs, representational systems, strategies.",
      action: "/nlp-report",
      tier: "turquoise",
    },
    {
      icon: Calendar,
      title: "Video Assessment",
      desc: "Full multimodal analysis: body language, eye-accessing cues, and 200+ behavioral markers.",
      action: "/video-assessment",
      tier: "platinum",
    },
    {
      icon: Star,
      title: "Social Card Generator",
      desc: "Generate a shareable card with your top 5 lines and rarity score — perfect for LinkedIn or Twitter.",
      action: "/results",
      tier: "free",
    },
    {
      icon: Lightbulb,
      title: "Power Combinations",
      desc: "Discover which of your lines combine into rare, high-leverage power combinations.",
      action: "/results",
      tier: "free",
    },
    {
      icon: Users,
      title: "Complementarity Matching",
      desc: "Find minds that complete yours — the network engine ranks everyone by how well they fill your gaps.",
      action: "/intelligence-profile",
      tier: "turquoise",
    },
  ];

  const tierColors: Record<string, string> = {
    free: "text-foreground",
    gold: "text-primary",
    turquoise: "text-accent",
    platinum: "text-[#D19A72]",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="font-mono text-[10px] tracking-[0.3em] text-primary mb-1">TOOLKIT</p>
        <h2 className="font-display text-2xl font-semibold mb-2">Your Intelligence Tools</h2>
        <p className="text-sm text-muted-foreground max-w-lg">
          Resources and instruments designed for your unique cognitive architecture. Some require higher membership tiers.
        </p>
      </div>

      {/* The recurring loop — surfaced first because it's the reason to come back */}
      <BehavioralTrackerCard user={user} />

      {/* Resources Section */}
      <div className="mt-2">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground mb-4">EDUCATIONAL RESOURCES</p>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 bg-secondary border-border hover:border-primary/30 transition-all">
            <BookOpen className="w-5 h-5 text-primary mb-3" />
            <h4 className="text-sm font-medium text-foreground mb-1">Intelligence Primer</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">A 10-minute guide to the AQAL model — what it measures, why it matters, and how it differs from IQ.</p>
            <Link href="/science">
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary px-0">Read Guide <ArrowRight className="w-3 h-3" /></Button>
            </Link>
          </Card>
          <Card className="p-5 bg-secondary border-border hover:border-primary/30 transition-all">
            <Download className="w-5 h-5 text-accent mb-3" />
            <h4 className="text-sm font-medium text-foreground mb-1">Profile Export</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">Download your full intelligence report as a PDF — formatted for sharing with coaches, mentors, or employers.</p>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-muted-foreground px-0" onClick={() => toast.info("PDF export coming soon")}>
              Coming Soon
            </Button>
          </Card>
          <Card className="p-5 bg-secondary border-border hover:border-primary/30 transition-all">
            <Users className="w-5 h-5 text-[#D19A72] mb-3" />
            <h4 className="text-sm font-medium text-foreground mb-1">Community Forum</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">Connect with other assessed minds. Share insights, compare developmental strategies, and find accountability partners.</p>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-muted-foreground px-0" onClick={() => toast.info("Community forum coming soon")}>
              Coming Soon
            </Button>
          </Card>
        </div>
      </div>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground mb-4">INTELLIGENCE INSTRUMENTS</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          const isLocked = tool.tier !== "free" && user?.membershipTier !== tool.tier && user?.membershipTier !== "platinum" && user?.role !== "admin";

          return (
            <Card key={i} className={`p-5 bg-secondary border-border transition-all ${!isLocked ? "hover:border-primary/40 cursor-pointer" : "opacity-70"}`}>
              <div className="flex items-start justify-between mb-3">
                <Icon className={`w-5 h-5 ${tierColors[tool.tier] || "text-foreground"}`} />
                {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <h4 className="text-sm font-medium text-foreground mb-1">{tool.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{tool.desc}</p>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[9px] tracking-[0.1em] uppercase ${tierColors[tool.tier]}`}>{tool.tier}</span>
                {tool.action && !isLocked && (
                  <Link href={tool.action}>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary">
                      Open <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
                {!tool.action && !isLocked && (
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-muted-foreground" onClick={() => toast.info("Feature coming soon")}>
                    Coming Soon
                  </Button>
                )}
                {isLocked && (
                  <Link href="/pricing">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-muted-foreground">
                      Upgrade <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS TAB
// ============================================================
function SettingsTab({ user }: { user: any }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <p className="font-mono text-[10px] tracking-[0.3em] text-primary mb-1">ACCOUNT</p>
        <h2 className="font-display text-2xl font-semibold mb-2">Settings</h2>
      </div>

      <Card className="p-6 bg-secondary border-border">
        <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm text-foreground font-medium">{user?.name || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm text-foreground font-medium">{user?.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Membership</span>
            <span className="text-sm text-primary font-mono uppercase">{user?.membershipTier || "free"}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <span className="text-sm text-foreground font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-secondary border-border">
        <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">Quick Links</h3>
        <div className="space-y-3">
          <Link href="/pricing" className="flex items-center justify-between py-2 group">
            <span className="text-sm text-foreground">Upgrade Membership</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <Link href="/profile" className="flex items-center justify-between py-2 group">
            <span className="text-sm text-foreground">Classic Profile View</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <Link href="/evidence" className="flex items-center justify-between py-2 group">
            <span className="text-sm text-foreground">Evidence & Methodology</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// MAIN PORTAL COMPONENT
// ============================================================
export default function Portal() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Fetch user's latest assessment and scores
  const profileData = trpc.profile.get.useQuery(undefined, { enabled: !!user });

  // Login gate
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-mono text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-10 bg-secondary border-border text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-semibold mb-3">Sign in to continue</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Access your intelligence profile, tools, and the research library.
          </p>
          <Button onClick={beginAuth} className="w-full bg-primary text-primary-foreground">Sign In</Button>
        </Card>
      </div>
    );
  }

  const assessmentData = profileData.data;

  return (
    <div className="min-h-screen bg-background">
      <PortalNav activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      <div className="max-w-[1180px] mx-auto px-5 py-8">
        {activeTab === "overview" && <OverviewTab user={user} scores={profileData.data?.scores} assessment={profileData.data?.assessment} />}
        {activeTab === "profile" && <ProfileTab scores={profileData.data?.scores} />}
        {activeTab === "commitment" && <CommitmentPanel />}
        {activeTab === "network" && <NetworkTab />}
        {activeTab === "library" && <ResearchLibraryTab />}
        {activeTab === "tools" && <ToolsTab user={user} />}
        {activeTab === "settings" && <SettingsTab user={user} />}
      </div>
    </div>
  );
}
