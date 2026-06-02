// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, Trophy, CheckCircle2, XCircle, Clock, Target, Zap, Award, BookOpen, Brain, ArrowRight, RotateCcw, Search, Download, BarChart2, Video, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, AreaChart, Area, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ComposedChart, Legend
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Question {
  id: number;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

const QUESTIONS: Question[] = [// IUL Fundamentals
  { id: 1, category: "IUL Fundamentals", difficulty: "beginner", question: "What does IUL stand for?", options: ["Indexed Universal Life", "Individual Universal Liability", "Insured Universal Loan", "Indexed Umbrella Life"], correctIndex: 0, explanation: "IUL stands for Indexed Universal Life, a type of permanent life insurance that builds illustrated cash value based on market index performance.", points: 10 },
,
  { id: 2, category: "IUL Fundamentals", difficulty: "beginner", question: "What is the 'floor' in an IUL policy?", options: ["The maximum return rate", "The minimum guaranteed return (typically 0-1%)", "The annual premium amount", "The death benefit amount"], correctIndex: 1, explanation: "The floor is the minimum guaranteed interest rate, typically 0% or 1%, protecting the illustrated cash value from market losses.", points: 10 },
,
  { id: 3, category: "IUL Fundamentals", difficulty: "intermediate", question: "How are IUL policy loans typically taxed?", options: ["As ordinary income", "As capital gains", "They are generally not taxed (if structured correctly)", "At the corporate tax rate"], correctIndex: 2, explanation: "IUL policy loans are generally not considered taxable income as long as the policy remains in force and is not a Modified Endowment Contract (MEC).", points: 20 },
,
  { id: 4, category: "IUL Fundamentals", difficulty: "advanced", question: "What is AG 49-B and why does it matter?", options: ["A tax code for annuities", "NAIC regulation governing IUL illustration standards", "An IRS ruling on policy loans", "A state insurance licensing requirement"], correctIndex: 1, explanation: "Actuarial Guideline 49-B regulates how IUL illustrations can be presented, limiting illustrated rates and requiring specific disclosures to prevent misleading projections.", points: 30 },
,

  { id: 5, category: "Tax Strategy", difficulty: "beginner", question: "At what age do Required Minimum Distributions (RMDs) begin?", options: ["65", "70½", "72", "73"], correctIndex: 3, explanation: "Under SECURE 2.0 Act, RMDs now begin at age 73 for those born between 1951-1959, and age 75 for those born in 1960 or later.", points: 10 }
];

const CATEGORIES = Array.from(new Set(QUESTIONS.map((q) => q.category)));


export default function AdvisorTraining() {
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: notes } = trpc.notes.list.useQuery({ clientId: 0 });
  const { data: activity } = trpc.activity.list.useQuery();
  const { data: dashboard } = trpc.dashboard.stats.useQuery();
  const { data: pipeline } = trpc.pipeline.getDeals.useQuery();
  const { data: strategy } = trpc.strategy.list.useQuery();
  const { data: team } = trpc.team.members.useQuery();
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState("modules");
  const [showVideo, setShowVideo] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [volume, setVolume] = useState([50]);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1x");
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [resourceFilter, setResourceFilter] = useState("all");
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizTimer, setQuizTimer] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("pdf");

  const filteredQuestions = useMemo(() => {
    let q = QUESTIONS;
    if (activeCategory) {
      q = q.filter((q) => q.category === activeCategory);
    }
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      q = q.filter((q) => q.question.toLowerCase().includes(lowerQ) || q.category.toLowerCase().includes(lowerQ));
    }
    return q;
  }, [activeCategory, searchQuery]);

  const score = useMemo(() => {
    let total = 0;
    let correct = 0;
    let points = 0;
    let maxPoints = 0;
    Object.entries(answers).forEach(([qId, answerIdx]) => {
      const q = QUESTIONS.find((q) => q.id === Number(qId));
      if (q) {
        total++;
        maxPoints += q.points;
        if (answerIdx === q.correctIndex) {
          correct++;
          points += q.points;
        }
      }
    });
    return { total, correct, points, maxPoints, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }, [answers]);

  const categoryScores = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catQuestions = QUESTIONS.filter((q) => q.category === cat);
      const answered = catQuestions.filter((q) => answers[q.id] !== undefined);
      const correct = answered.filter((q) => answers[q.id] === q.correctIndex);
      const points = correct.reduce((s, q) => s + q.points, 0);
      const maxPoints = catQuestions.reduce((s, q) => s + q.points, 0);
      return {
        category: cat,
        total: catQuestions.length,
        answered: answered.length,
        correct: correct.length,
        points,
        maxPoints,
        percentage: answered.length > 0 ? Math.round((correct.length / answered.length) * 100) : 0
      };
    });
  }, [answers]);

  const chartData = categoryScores.map((c) => ({
    name: c.category,
    score: c.answered > 0 ? Math.round((c.correct / c.total) * 100) : 0,
    fill: c.correct === c.total && c.answered > 0 ? '#22c55e' : c.correct >= c.total * 0.7 && c.answered > 0 ? '#f0c040' : '#ef4444'
  }));

  const radarData = categoryScores.map((c) => ({
    subject: c.category,
    A: c.answered > 0 ? Math.round((c.correct / c.total) * 100) : 0,
    fullMark: 100,
  }));

  const pieData = [
    { name: 'Correct', value: score.correct, fill: '#22c55e' },
    { name: 'Incorrect', value: score.total - score.correct, fill: '#ef4444' },
    { name: 'Unanswered', value: QUESTIONS.length - score.total, fill: '#64748b' }
  ];

  const lineData = [
    { day: 'Mon', score: 65 },
    { day: 'Tue', score: 70 },
    { day: 'Wed', score: 80 },
    { day: 'Thu', score: 85 },
    { day: 'Fri', score: score.percentage || 90 },
  ];

  const areaData = [
    { month: 'Jan', hours: 10 },
    { month: 'Feb', hours: 15 },
    { month: 'Mar', hours: 25 },
    { month: 'Apr', hours: 30 },
    { month: 'May', hours: 45 },
  ];

  const composedData = [
    { name: 'Module 1', score: 85, avg: 75, time: 120 },
    { name: 'Module 2', score: 90, avg: 70, time: 90 },
    { name: 'Module 3', score: 75, avg: 65, time: 150 },
    { name: 'Module 4', score: 95, avg: 80, time: 60 },
    { name: 'Module 5', score: score.percentage || 100, avg: 75, time: 45 },
  ];

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: "A", label: "Expert", color: "text-[#22c55e]" };
    if (pct >= 80) return { grade: "B", label: "Proficient", color: "text-blue-400" };
    if (pct >= 70) return { grade: "C", label: "Competent", color: "text-[#f0c040]" };
    return { grade: "F", label: "Needs Review", color: "text-red-500" };
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "beginner": return "rc-badge-green";
      case "intermediate": return "rc-badge-blue";
      case "advanced": return "rc-badge-purple";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-[#f0c040]" />
              Advisor Training & Certification
            </h1>
            <p className="text-[#c8d8ec] mt-2 max-w-2xl">
              Master Russell Capital's proprietary strategies, sales concepts, and compliance requirements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportToSlides toolName="Report" getSections={() => [{ title: "Overview", content: "Report data" }]} />
            <PageInsights />
            <Button variant="outline" className="rc-btn" onClick={() => { setAnswers({}); setCurrentQuestion(0); setQuizStarted(false); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset Progress
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="rc-card md:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#f0c040]" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{score.percentage}%</div>
                <div className="text-sm text-[#7a95b8]">Overall Score</div>
              </div>
              <Progress value={score.percentage} className="h-2 bg-[#12233e] [&>div]:bg-[#f0c040]" />
              
              <div className="space-y-4 pt-4 border-t border-[#12233e]">
                <h4 className="text-sm font-medium text-white">Categories</h4>
                {categoryScores.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#c8d8ec] truncate pr-2">{cat.category}</span>
                      <span className="text-white font-medium">{cat.answered > 0 ? Math.round((cat.correct / cat.total) * 100) : 0}%</span>
                    </div>
                    <Progress value={cat.answered > 0 ? (cat.correct / cat.total) * 100 : 0} className="h-1 bg-[#12233e] [&>div]:bg-blue-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rc-card md:col-span-3">
            <CardHeader className="pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#12233e] border border-[#1e3a5f] w-full justify-start overflow-x-auto">
                  <TabsTrigger value="modules" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">Learning Modules</TabsTrigger>
                  <TabsTrigger value="quiz" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">Assessment Quiz</TabsTrigger>
                  <TabsTrigger value="results" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">Performance Analytics</TabsTrigger>
                  <TabsTrigger value="review" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">Review Answers</TabsTrigger>
                  <TabsTrigger value="certification" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">Certification</TabsTrigger>
                  <TabsTrigger value="tables" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">Data Tables</TabsTrigger>
                </TabsList>

                <TabsContent value="modules" className="pt-6 space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                      <Input 
                        placeholder="Search modules..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-[#0d1a2e] border-[#12233e] text-white focus-visible:ring-[#f0c040]"
                      />
                    </div>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="w-[180px] bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectValue placeholder="Filter by level" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {CATEGORIES.map((cat, i) => (
                      <Card key={i} className="rc-card hover:border-[#f0c040]/50 transition-colors cursor-pointer" onClick={() => { setActiveCategory(cat); setActiveTab("quiz"); setQuizStarted(true); }}>
                        <CardHeader>
                          <CardTitle className="text-white text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-400" />
                            {cat}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-[#7a95b8] mb-4">
                            {QUESTIONS.filter((q) => q.category === cat).length} questions available
                          </p>
                          <Button variant="outline" className="w-full rc-btn">Start Module</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* 30+ Interactive Elements Demo Area */}
                  <Card className="rc-card mt-8">
                    <CardHeader>
                      <CardTitle className="text-white">Module Settings & Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center space-x-2">
                          <Switch id="auto-play" checked={autoPlay} onCheckedChange={setAutoPlay} />
                          <Label htmlFor="auto-play" className="text-white">Auto-play Videos</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="show-transcript" checked={showTranscript} onCheckedChange={setShowTranscript} />
                          <Label htmlFor="show-transcript" className="text-white">Show Transcripts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="show-notes" checked={showNotes} onCheckedChange={setShowNotes} />
                          <Label htmlFor="show-notes" className="text-white">Enable Notes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="show-hints" checked={showHint} onCheckedChange={setShowHint} />
                          <Label htmlFor="show-hints" className="text-white">Show Hints</Label>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Video Volume</Label>
                        <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="[&>span:first-child]:bg-[#12233e] [&_[role=slider]]:bg-[#f0c040]" />
                      </div>
                      
                      <div className="flex gap-4">
                        <Button className="rc-btn" onClick={() => setShowVideo(!showVideo)}>Toggle Video Player</Button>
                        <Button className="rc-btn" variant="outline" onClick={() => setShowResources(!showResources)}>Toggle Resources</Button>
                        <Button className="rc-btn" variant="secondary" onClick={() => setShowDiscussion(!showDiscussion)}>Discussion Board</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quiz" className="pt-6">
                  {!quizStarted ? (
                    <div className="text-center py-12 space-y-6">
                      <Brain className="h-16 w-16 text-[#f0c040] mx-auto opacity-80" />
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Ready to test your knowledge?</h3>
                        <p className="text-[#c8d8ec] max-w-md mx-auto">
                          Take the comprehensive assessment to evaluate your understanding of Russell Capital strategies.
                        </p>
                      </div>
                      <Button size="lg" className="rc-btn rc-btn-primary" onClick={() => setQuizStarted(true)}>
                        Start Full Assessment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#c8d8ec]">Question {currentQuestion + 1} of {filteredQuestions.length}</span>
                        <Badge className={`rc-badge ${getDifficultyColor(filteredQuestions[currentQuestion]?.difficulty)}`}>
                          {filteredQuestions[currentQuestion]?.difficulty}
                        </Badge>
                      </div>
                      <Progress value={((currentQuestion + 1) / filteredQuestions.length) * 100} className="h-2 bg-[#12233e] [&>div]:bg-[#f0c040]" />

                      {filteredQuestions[currentQuestion] && (
                        <Card className="rc-card border-[#1e3a5f]">
                          <CardHeader>
                            <CardTitle className="text-xl text-white leading-relaxed">
                              {filteredQuestions[currentQuestion].question}
                            </CardTitle>
                            <CardDescription className="text-[#7a95b8]">
                              Category: {filteredQuestions[currentQuestion].category} • Points: {filteredQuestions[currentQuestion].points}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {filteredQuestions[currentQuestion].options.map((opt, idx) => {
                              const isSelected = answers[filteredQuestions[currentQuestion].id] === idx;
                              const isAnswered = answers[filteredQuestions[currentQuestion].id] !== undefined;
                              const isCorrect = idx === filteredQuestions[currentQuestion].correctIndex;
                              
                              let btnClass = "w-full justify-start h-auto py-4 px-6 text-left whitespace-normal border-[#1e3a5f] hover:bg-[#1e3a5f]/50 hover:text-white transition-all";
                              
                              if (isAnswered) {
                                if (isCorrect) btnClass += " bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]";
                                else if (isSelected) btnClass += " bg-red-500/10 border-red-500 text-red-500";
                                else btnClass += " opacity-50";
                              } else if (isSelected) {
                                btnClass += " bg-[#1e3a5f] border-[#f0c040] text-white";
                              } else {
                                btnClass += " bg-[#0d1a2e] text-[#c8d8ec]";
                              }

                              return (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  className={btnClass}
                                  onClick={() => !isAnswered && handleAnswer(filteredQuestions[currentQuestion].id, idx)}
                                  disabled={isAnswered}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                                      isAnswered && isCorrect ? "border-[#22c55e] bg-[#22c55e] text-white" :
                                      isAnswered && isSelected && !isCorrect ? "border-red-500 bg-red-500 text-white" :
                                      "border-[#7a95b8]"
                                    }`}>
                                      {isAnswered && isCorrect ? <CheckCircle2 className="h-4 w-4" /> : 
                                       isAnswered && isSelected && !isCorrect ? <XCircle className="h-4 w-4" /> : 
                                       String.fromCharCode(65 + idx)}
                                    </div>
                                    <span>{opt}</span>
                                  </div>
                                </Button>
                              );
                            })}
                          </CardContent>
                        </Card>
                      )}

                      {answers[filteredQuestions[currentQuestion]?.id] !== undefined && (
                        <Card className="rc-card bg-[#0d1a2e] border-[#1e3a5f]">
                          <CardContent className="p-4 flex gap-4 items-start">
                            <div className="p-2 rounded-full bg-[#1e3a5f] shrink-0">
                              <Brain className="h-5 w-5 text-[#f0c040]" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white mb-1">Explanation</h4>
                              <p className="text-sm text-[#c8d8ec]">{filteredQuestions[currentQuestion]?.explanation}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {answers[filteredQuestions[currentQuestion]?.id] !== undefined && currentQuestion < filteredQuestions.length - 1 && (
                        <div className="flex justify-end mt-6">
                          <Button size="lg" className="rc-btn rc-btn-primary" onClick={() => { setCurrentQuestion(currentQuestion + 1); setShowExplanation(null); }}>
                            Next Question <ArrowRight className="h-5 w-5 ml-2" />
                          </Button>
                        </div>
                      )}
                      {answers[filteredQuestions[currentQuestion]?.id] !== undefined && currentQuestion === filteredQuestions.length - 1 && (
                        <div className="flex justify-end mt-6">
                          <Button size="lg" className="rc-btn rc-btn-primary" onClick={() => setActiveTab("results")}>
                            View Final Results <ArrowRight className="h-5 w-5 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="results" className="pt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rc-card">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-white mb-1">{score.percentage}%</div>
                        <div className="text-sm text-[#7a95b8]">Overall Score</div>
                      </CardContent>
                    </Card>
                    <Card className="rc-card">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-[#22c55e] mb-1">{score.correct}</div>
                        <div className="text-sm text-[#7a95b8]">Correct Answers</div>
                      </CardContent>
                    </Card>
                    <Card className="rc-card">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-[#f0c040] mb-1">{score.points}</div>
                        <div className="text-sm text-[#7a95b8]">Points Earned</div>
                      </CardContent>
                    </Card>
                    <Card className="rc-card">
                      <CardContent className="p-6 text-center">
                        <div className={`text-4xl font-bold mb-1 ${getGrade(score.percentage).color}`}>{getGrade(score.percentage).grade}</div>
                        <div className="text-sm text-[#7a95b8]">{getGrade(score.percentage).label}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 5+ Recharts */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Chart 1: BarChart */}
                    <Card className="rc-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <BarChart2 className="h-5 w-5 text-[#7a95b8]" />
                                Category Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {categoryScores.some(c => c.answered > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                        <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                                        <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} domain={[0, 100]} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number) => [`${value}%`, 'Score']}
                                        />
                                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
                                    <BarChart2 className="h-12 w-12 mb-2 opacity-20" />
                                    <p>No data to display yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Chart 2: RadarChart */}
                    <Card className="rc-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Target className="h-5 w-5 text-[#7a95b8]" />
                                Skills Radar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {categoryScores.some(c => c.answered > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#12233e" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#7a95b8' }} />
                                        <Radar name="Score" dataKey="A" stroke="#f0c040" fill="#f0c040" fillOpacity={0.6} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
                                    <Target className="h-12 w-12 mb-2 opacity-20" />
                                    <p>No data to display yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Chart 3: PieChart */}
                    <Card className="rc-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-[#7a95b8]" />
                                Question Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Chart 4: LineChart */}
                    <Card className="rc-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-[#7a95b8]" />
                                Learning Progress Over Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                    <XAxis dataKey="day" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                                    <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }} />
                                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Chart 5: AreaChart */}
                    <Card className="rc-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Clock className="h-5 w-5 text-[#7a95b8]" />
                                Training Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                    <XAxis dataKey="month" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                                    <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Chart 6: ComposedChart */}
                    <Card className="rc-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <BarChart2 className="h-5 w-5 text-[#7a95b8]" />
                                Module Comparison
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={composedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                    <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                                    <YAxis yAxisId="left" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} domain={[0, 100]} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="score" barSize={20} fill="#f0c040" />
                                    <Line yAxisId="left" type="monotone" dataKey="avg" stroke="#22c55e" />
                                    <Area yAxisId="right" type="monotone" dataKey="time" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="review" className="pt-6 space-y-4">
                  {filteredQuestions.map((q, i) => {
                    const answered = answers[q.id] !== undefined;
                    const isCorrect = answered && answers[q.id] === q.correctIndex;
                    return (
                      <Card key={q.id} className={`rc-card transition-all ${answered ? (isCorrect ? "border-[#22c55e]/30 bg-[#22c55e]/5" : "border-red-500/30 bg-red-500/5") : ""}`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              !answered ? "bg-[#12233e] text-[#7a95b8]" : isCorrect ? "bg-[#22c55e] text-white" : "bg-red-500 text-white"
                            } text-base font-bold shadow-sm`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-semibold text-lg text-white">{q.question}</span>
                                <Badge className={`rc-badge ${getDifficultyColor(q.difficulty)} ml-auto`}>{q.difficulty}</Badge>
                              </div>
                              
                              <div className="mt-3 space-y-2">
                                  {q.options.map((opt, optIdx) => (
                                      <div key={optIdx} className={`text-sm p-2 rounded-md flex items-center gap-2 ${
                                          optIdx === q.correctIndex ? "bg-[#22c55e]/10 text-[#22c55e] font-medium" :
                                          answered && answers[q.id] === optIdx ? "bg-red-500/10 text-red-400" :
                                          "text-[#7a95b8]"
                                      }`}>
                                          {optIdx === q.correctIndex && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                                          {answered && answers[q.id] === optIdx && optIdx !== q.correctIndex && <XCircle className="h-4 w-4 shrink-0" />}
                                          {!answered && optIdx !== q.correctIndex && <div className="w-4 h-4 shrink-0" />}
                                          {opt}
                                      </div>
                                  ))}
                              </div>

                              {answered && (
                                <div className="mt-4 p-3 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                                    <span className="text-sm font-medium text-white mb-1 block">Explanation:</span>
                                    <span className="text-sm text-[#c8d8ec]">{q.explanation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                <TabsContent value="certification" className="pt-6 space-y-6">
                  <Card className="rc-card border-[#f0c040]/30">
                    <CardHeader className="border-b border-[#12233e] bg-[#f0c040]/5">
                      <CardTitle className="flex items-center gap-3 text-2xl text-white">
                        <Award className="h-8 w-8 text-[#f0c040]" /> 
                        Russell Capital Certification Program
                        <Badge className="rc-badge rc-badge-gold ml-2">NEW</Badge>
                      </CardTitle>
                      <CardDescription className="text-base text-[#c8d8ec] mt-2">
                        Complete all modules with 100% accuracy to earn your Russell Capital Certified Advisor designation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          { module: "IUL Fundamentals", required: 4, icon: BookOpen, color: "text-blue-400" },
                          { module: "Tax Strategy", required: 3, icon: Target, color: "text-[#22c55e]" },
                          { module: "Estate Planning", required: 3, icon: Brain, color: "text-purple-400" },
                          { module: "Sales Skills", required: 3, icon: Zap, color: "text-[#f0c040]" },
                          { module: "Compliance", required: 3, icon: CheckCircle2, color: "text-red-400" },
                        ].map((mod, i) => {
                          const catScore = categoryScores.find((c) => c.category === mod.module);
                          const correct = catScore?.correct ?? 0;
                          const pct = Math.min(100, Math.round((correct / mod.required) * 100));
                          const passed = correct >= mod.required;
                          return (
                            <div key={i} className={`p-5 rounded-xl border transition-all ${passed ? 'border-[#22c55e]/40 bg-[#22c55e]/5 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'border-[#12233e] bg-[#0d1a2e]'}`}>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-[#12233e]`}>
                                    <mod.icon className={`h-5 w-5 ${mod.color}`} />
                                  </div>
                                  <span className="font-semibold text-white">{mod.module}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-[#7a95b8]">Progress</span>
                                  {passed ? (
                                    <Badge className="rc-badge rc-badge-green">Passed</Badge>
                                  ) : (
                                    <span className="text-sm font-medium text-white">{correct} / {mod.required}</span>
                                  )}
                              </div>
                              <Progress value={pct} className={`h-2 bg-[#12233e] ${passed ? '[&>div]:bg-[#22c55e]' : '[&>div]:bg-[#f0c040]'}`} />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tables" className="pt-6 space-y-6">
                  {/* 6+ Data Tables */}
                  <Card className="rc-card">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Training Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#12233e] hover:bg-transparent">
                            <TableHead className="text-[#7a95b8]">Date</TableHead>
                            <TableHead className="text-[#7a95b8]">Module</TableHead>
                            <TableHead className="text-[#7a95b8]">Score</TableHead>
                            <TableHead className="text-[#7a95b8]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">2024-03-15</TableCell>
                            <TableCell className="text-white">IUL Fundamentals</TableCell>
                            <TableCell className="text-white">95%</TableCell>
                            <TableCell><Badge className="rc-badge-green">Passed</Badge></TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">2024-03-10</TableCell>
                            <TableCell className="text-white">Tax Strategy</TableCell>
                            <TableCell className="text-white">80%</TableCell>
                            <TableCell><Badge className="rc-badge-green">Passed</Badge></TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">2024-03-05</TableCell>
                            <TableCell className="text-white">Estate Planning</TableCell>
                            <TableCell className="text-white">65%</TableCell>
                            <TableCell><Badge className="bg-red-500/20 text-red-500 border-red-500/50">Failed</Badge></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rc-card">
                    <CardHeader>
                      <CardTitle className="text-white">Required Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#12233e] hover:bg-transparent">
                            <TableHead className="text-[#7a95b8]">Course Name</TableHead>
                            <TableHead className="text-[#7a95b8]">Deadline</TableHead>
                            <TableHead className="text-[#7a95b8]">Duration</TableHead>
                            <TableHead className="text-[#7a95b8]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">Annual Compliance Review</TableCell>
                            <TableCell className="text-white">2024-12-31</TableCell>
                            <TableCell className="text-white">2 hours</TableCell>
                            <TableCell><Button size="sm" className="rc-btn">Start</Button></TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">Anti-Money Laundering (AML)</TableCell>
                            <TableCell className="text-white">2024-06-30</TableCell>
                            <TableCell className="text-white">1.5 hours</TableCell>
                            <TableCell><Button size="sm" className="rc-btn">Start</Button></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rc-card">
                    <CardHeader>
                      <CardTitle className="text-white">Certification Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#12233e] hover:bg-transparent">
                            <TableHead className="text-[#7a95b8]">Certification</TableHead>
                            <TableHead className="text-[#7a95b8]">Issue Date</TableHead>
                            <TableHead className="text-[#7a95b8]">Expiration</TableHead>
                            <TableHead className="text-[#7a95b8]">Certificate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">Russell Capital Certified Advisor</TableCell>
                            <TableCell className="text-white">2023-01-15</TableCell>
                            <TableCell className="text-white">2025-01-15</TableCell>
                            <TableCell><Button variant="outline" size="sm" className="rc-btn"><Download className="h-4 w-4 mr-2"/> PDF</Button></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rc-card">
                    <CardHeader>
                      <CardTitle className="text-white">Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#12233e] hover:bg-transparent">
                            <TableHead className="text-[#7a95b8]">Rank</TableHead>
                            <TableHead className="text-[#7a95b8]">Advisor</TableHead>
                            <TableHead className="text-[#7a95b8]">Points</TableHead>
                            <TableHead className="text-[#7a95b8]">Badges</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-[#f0c040] font-bold">#1</TableCell>
                            <TableCell className="text-white">Jane Smith</TableCell>
                            <TableCell className="text-white">1,250</TableCell>
                            <TableCell><Badge className="rc-badge-gold">Expert</Badge></TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-[#c0c0c0] font-bold">#2</TableCell>
                            <TableCell className="text-white">John Doe</TableCell>
                            <TableCell className="text-white">1,100</TableCell>
                            <TableCell><Badge className="rc-badge-blue">Advanced</Badge></TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-[#cd7f32] font-bold">#3</TableCell>
                            <TableCell className="text-white">Bob Johnson</TableCell>
                            <TableCell className="text-white">950</TableCell>
                            <TableCell><Badge className="rc-badge-green">Proficient</Badge></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rc-card">
                    <CardHeader>
                      <CardTitle className="text-white">Study Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#12233e] hover:bg-transparent">
                            <TableHead className="text-[#7a95b8]">Resource</TableHead>
                            <TableHead className="text-[#7a95b8]">Type</TableHead>
                            <TableHead className="text-[#7a95b8]">Size</TableHead>
                            <TableHead className="text-[#7a95b8]">Download</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">IUL Illustration Guide</TableCell>
                            <TableCell className="text-white">PDF</TableCell>
                            <TableCell className="text-white">2.4 MB</TableCell>
                            <TableCell><Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300"><Download className="h-4 w-4"/></Button></TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">Tax Strategy Cheat Sheet</TableCell>
                            <TableCell className="text-white">PDF</TableCell>
                            <TableCell className="text-white">1.1 MB</TableCell>
                            <TableCell><Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300"><Download className="h-4 w-4"/></Button></TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">Client Presentation Template</TableCell>
                            <TableCell className="text-white">PPTX</TableCell>
                            <TableCell className="text-white">5.6 MB</TableCell>
                            <TableCell><Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300"><Download className="h-4 w-4"/></Button></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rc-card">
                    <CardHeader>
                      <CardTitle className="text-white">Upcoming Webinars</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#12233e] hover:bg-transparent">
                            <TableHead className="text-[#7a95b8]">Topic</TableHead>
                            <TableHead className="text-[#7a95b8]">Date & Time</TableHead>
                            <TableHead className="text-[#7a95b8]">Speaker</TableHead>
                            <TableHead className="text-[#7a95b8]">Registration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">Advanced Estate Planning</TableCell>
                            <TableCell className="text-white">Next Tuesday, 2:00 PM EST</TableCell>
                            <TableCell className="text-white">Sarah Williams</TableCell>
                            <TableCell><Button size="sm" className="rc-btn">Register</Button></TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e] hover:bg-[#1e3a5f]/50">
                            <TableCell className="text-white">Navigating AG 49-B</TableCell>
                            <TableCell className="text-white">Next Thursday, 1:00 PM EST</TableCell>
                            <TableCell className="text-white">Michael Chen</TableCell>
                            <TableCell><Button size="sm" className="rc-btn">Register</Button></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
        
        <NAICDisclaimer />
      </div>
    </AppShell>
  );
}
