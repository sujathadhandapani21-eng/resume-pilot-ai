import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  CloudUpload,
  FileText,
  Flag,
  Gauge,
  Lightbulb,
  LockKeyhole,
  Menu,
  MessageCircle,
  PenLine,
  Radar,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";

type Recommendation = {
  id: string;
  priority: "High" | "Medium" | "Low";
  title: string;
  detail: string;
  original?: string;
  suggestion?: string;
};

type AnalysisData = {
  score: number;
  scoreLabel: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  skills: { label: string; value: number; tone: "lime" | "orange" | "ink" }[];
  recommendations: Recommendation[];
};

const sampleResume = `MAYA PATEL\nProduct Designer\n\nProduct designer with 5+ years creating intuitive B2B SaaS experiences. Led discovery, prototyping, and design systems across fintech and healthcare products.\n\nEXPERIENCE\nSenior Product Designer · Northstar Labs · 2022–Present\n• Led the redesign of onboarding, reducing time-to-value for new teams.\n• Partnered with product and engineering to ship a scalable design system.\n• Facilitated customer interviews and usability testing across three markets.\n\nProduct Designer · Kinship Health · 2019–2022\n• Designed workflows for care coordinators and patient-facing tools.\n• Collaborated with PMs and engineers from concept to launch.\n\nSKILLS\nFigma, prototyping, user research, design systems, workshops, accessibility, Jira`;

const sampleJob = `We are looking for a Senior Product Designer to own end-to-end product design for our collaboration platform. You will lead discovery, translate complex workflows into simple experiences, and partner closely with product and engineering.\n\nYou should have 5+ years of experience, strong Figma and prototyping skills, experience building design systems, and a track record of using research and metrics to improve products. Experience with B2B SaaS and accessibility is a plus.`;

const demoAnalysis: AnalysisData = {
  score: 78,
  scoreLabel: "Strong foundation",
  summary: "You have the right product design story. Make the impact more measurable and surface your collaboration-platform experience earlier.",
  strengths: ["5+ years of product design experience", "Clear end-to-end workflow ownership", "Relevant B2B and design-system signals"],
  gaps: ["Metrics are implied, not explicit", "Collaboration-platform language is missing", "Leadership scope could be clearer"],
  skills: [
    { label: "Core skills", value: 92, tone: "lime" },
    { label: "Role alignment", value: 78, tone: "orange" },
    { label: "Evidence strength", value: 64, tone: "ink" },
  ],
  recommendations: [
    { id: "metric", priority: "High", title: "Add an outcome to your onboarding bullet", detail: "The work is relevant, but the result is not visible yet. Add a verified metric or concrete user behavior change.", original: "Led the redesign of onboarding, reducing time-to-value for new teams.", suggestion: "Led the onboarding redesign for new teams, cutting setup friction and improving time-to-value by [add verified metric]." },
    { id: "collab", priority: "High", title: "Mirror the role's collaboration language", detail: "The job emphasizes complex workflows and close product partnership. Bring that evidence into the first experience section.", original: "Partnered with product and engineering to ship a scalable design system.", suggestion: "Partnered with product and engineering to simplify complex B2B workflows and ship a scalable design system." },
    { id: "leadership", priority: "Medium", title: "Make your leadership scope explicit", detail: "Your facilitation work is a strong signal. Clarify who you influenced and what decisions it unlocked.", original: "Facilitated customer interviews and usability testing across three markets.", suggestion: "Led customer interviews and usability testing across three markets, translating findings into prioritized product decisions." },
  ],
};

const navItems = ["How it works", "What you get", "Privacy"];

export default function Home() {
  const [mode, setMode] = useState<"landing" | "workspace">("landing");
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [fileName, setFileName] = useState("");
  const [activeSection, setActiveSection] = useState("Overview");
  const [activeRecommendation, setActiveRecommendation] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisData>(demoAnalysis);
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "I’ve reviewed your resume against the Senior Product Designer role. Ask me why something matters, or let’s sharpen a bullet together." },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzeMutation = trpc.ai.analyze.useMutation();
  const chatMutation = trpc.ai.chat.useMutation();

  const useSample = () => {
    setResume(sampleResume);
    setJob(sampleJob);
    setFileName("maya-patel-resume.txt");
    setNotice("Sample resume loaded. You can edit it before running the audit.");
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setResume(text || sampleResume);
      setNotice(`${file.name} is ready for review.`);
    };
    reader.readAsText(file);
  };

  const startAnalysis = async () => {
    const resumeText = resume.trim() || sampleResume;
    const jobText = job.trim() || sampleJob;
    setResume(resumeText);
    setJob(jobText);
    setMode("workspace");
    setActiveSection("Overview");
    setNotice("Analysis ready. Your workspace is using grounded recommendations from the resume and role context.");
    if (resume.trim() && job.trim()) {
      try {
        const result = await analyzeMutation.mutateAsync({ resume: resumeText, jobDescription: jobText });
        if (result) setAnalysis(result as AnalysisData);
      } catch {
        setNotice("Demo analysis loaded. Connect your AI provider to generate a live audit for this resume.");
      }
    }
  };

  const sendMessage = async (content: string) => {
    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    try {
      const result = await chatMutation.mutateAsync({
        resume: resume || sampleResume,
        jobDescription: job || sampleJob,
        messages: nextMessages.filter(({ role }) => role !== "system").map(({ role, content: text }) => ({ role: role as "user" | "assistant", content: text })),
      });
      setMessages([...nextMessages, { role: "assistant", content: result }]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "For this demo, I’d focus on adding a verified metric to the onboarding bullet and making your product-engineering partnership more explicit." },
      ]);
    }
  };

  const reset = () => {
    setMode("landing");
    setResume("");
    setJob("");
    setFileName("");
    setNotice("");
  };

  if (mode === "workspace") {
    return (
      <div className="min-h-screen bg-[#f7f5ef] text-[#20211f]">
        <WorkspaceHeader onReset={reset} onMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <div className="mx-auto flex max-w-[1500px] gap-6 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
          <aside className={cn("workspace-sidebar", mobileMenuOpen && "workspace-sidebar-open")}>
            <div className="mb-7 px-3">
              <p className="eyebrow mb-2">Current audit</p>
              <h2 className="font-display text-xl font-semibold tracking-[-0.03em]">Product Designer</h2>
              <p className="mt-1 text-sm text-[#72746e]">Maya Patel · updated just now</p>
            </div>
            <nav className="space-y-1">
              {["Overview", "Skills match", "Experience", "Impact & clarity", "Recommendations"].map((item, index) => (
                <button
                  key={item}
                  onClick={() => { setActiveSection(item); setMobileMenuOpen(false); }}
                  className={cn("sidebar-item", activeSection === item && "sidebar-item-active")}
                >
                  <span className={cn("sidebar-index", activeSection === item && "sidebar-index-active")}>{String(index + 1).padStart(2, "0")}</span>
                  <span>{item}</span>
                  {activeSection === item && <ChevronRight className="ml-auto size-4" />}
                </button>
              ))}
            </nav>
            <div className="mt-8 border-t border-[#dfddd4] pt-5">
              <p className="eyebrow mb-3">Resume source</p>
              <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3">
                <div className="mt-0.5 rounded-lg bg-[#e8f2bf] p-2 text-[#45600e]"><FileText className="size-4" /></div>
                <div className="min-w-0"><p className="truncate text-sm font-medium">{fileName || "maya-patel-resume.txt"}</p><p className="mt-1 text-xs text-[#8a8c83]">Text extracted · 1 page</p></div>
              </div>
              <button onClick={reset} className="mt-4 flex items-center gap-2 px-1 text-sm font-semibold text-[#586315] hover:text-[#2e340e]"><RotateCcw className="size-4" /> New analysis</button>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow mb-2">Analysis workspace / {activeSection}</p>
                <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Your resume, with a sharper point of view.</h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#777a72]"><span className="status-dot" /> Analysis confidence <strong className="text-[#31332f]">High</strong></div>
            </div>
            {notice && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#d7e4a7] bg-[#f0f7d8] px-4 py-3 text-sm text-[#536313]"><Check className="size-4" /> {notice}</div>}

            {activeSection === "Overview" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <section className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
                  <div className="ink-card relative overflow-hidden p-6 sm:p-8">
                    <div className="absolute -right-8 -top-10 size-36 rounded-full border border-white/10" /><div className="absolute -right-2 top-6 size-20 rounded-full border border-white/10" />
                    <div className="relative flex flex-col justify-between gap-8 sm:flex-row">
                      <div className="max-w-xl"><div className="mb-5 flex items-center gap-2 text-[#d8ec8a]"><Sparkles className="size-4" /><span className="text-xs font-semibold uppercase tracking-[0.15em]">Match overview</span></div><p className="max-w-lg font-display text-2xl leading-tight tracking-[-0.04em] text-white sm:text-3xl">{analysis.summary}</p><div className="mt-7 flex flex-wrap gap-2"><span className="dark-pill"><ShieldCheck className="size-3.5" /> Evidence grounded</span><span className="dark-pill"><Target className="size-3.5" /> Role-specific</span></div></div>
                      <div className="flex shrink-0 items-center justify-center"><ScoreRing score={analysis.score} /></div>
                    </div>
                  </div>
                  <div className="paper-card p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Snapshot</p><h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em]">What stands out</h3></div><Gauge className="size-5 text-[#72811f]" /></div><div className="mt-6 space-y-4">{analysis.strengths.map((item) => <div key={item} className="flex items-start gap-3 text-sm"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e8f2bf] text-[#66780f]"><Check className="size-3" /></span><span>{item}</span></div>)}</div><div className="mt-6 border-t border-[#e5e2d9] pt-5"><p className="eyebrow mb-3">Next best moves</p>{analysis.gaps.slice(0, 2).map((item) => <div key={item} className="mb-2 flex items-center gap-2 text-sm text-[#6c6e67]"><ArrowRight className="size-3.5 text-[#c56835]" />{item}</div>)}</div></div>
                </section>
                <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="paper-card p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Signal strength</p><h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em]">Where your story lands</h3></div><Radar className="size-5 text-[#c56835]" /></div><div className="mt-7 space-y-5">{analysis.skills.map((skill) => <SkillBar key={skill.label} {...skill} />)}</div><p className="mt-7 text-xs leading-relaxed text-[#81837a]">Scores are estimates based on the text provided. They are not hiring predictions.</p></div>
                  <div className="paper-card p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Priority queue</p><h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em]">Three changes worth making</h3></div><ClipboardCheck className="size-5 text-[#72811f]" /></div><div className="mt-5 divide-y divide-[#e5e2d9]">{analysis.recommendations.map((item, index) => <button key={item.id} onClick={() => { setActiveRecommendation(index); setActiveSection("Recommendations"); }} className="group flex w-full items-start gap-4 py-4 text-left first:pt-1"><span className={cn("priority-badge", item.priority === "High" ? "priority-high" : "priority-medium")}>{item.priority}</span><span className="flex-1"><span className="block text-sm font-semibold text-[#292b27] group-hover:text-[#66780f]">{item.title}</span><span className="mt-1 block text-sm leading-relaxed text-[#777970]">{item.detail}</span></span><ChevronRight className="mt-1 size-4 text-[#b8b7ae] transition-transform group-hover:translate-x-1" /></button>)}</div></div>
                </section>
              </div>
            )}

            {activeSection === "Skills match" && <SectionPanel eyebrow="Skills match" title="Your strongest evidence is already here." icon={<Target className="size-5" />}><div className="grid gap-4 md:grid-cols-2">{["Figma", "Prototyping", "Design systems", "User research", "Accessibility", "B2B SaaS"].map((skill, index) => <div key={skill} className="flex items-center justify-between rounded-2xl bg-[#faf9f5] p-4"><div className="flex items-center gap-3"><span className={cn("size-2.5 rounded-full", index < 4 ? "bg-[#8ca51d]" : "bg-[#d8d6cb")} /><span className="text-sm font-semibold">{skill}</span></div><span className="text-xs font-medium text-[#81837a]">{index < 4 ? "Found in resume" : "Add evidence"}</span></div>)}</div><div className="mt-6 rounded-2xl bg-[#f0f7d8] p-5 text-sm leading-relaxed text-[#576515]"><Lightbulb className="mb-2 size-5" /><strong>Quick read:</strong> The role asks for collaboration-platform experience. You have strong workflow design signals; make that connection explicit in your first two bullets.</div></SectionPanel>}
            {activeSection === "Experience" && <SectionPanel eyebrow="Experience alignment" title="Your timeline supports the level. Now sharpen the scope." icon={<BriefcaseBusiness className="size-5" />}><div className="space-y-4">{["Senior Product Designer · Northstar Labs", "Product Designer · Kinship Health"].map((role, index) => <div key={role} className="rounded-2xl border border-[#e5e2d9] bg-[#fcfbf7] p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-base font-semibold">{role}</p><p className="mt-1 text-sm text-[#83857c]">{index === 0 ? "2022–Present · Most relevant" : "2019–2022 · Supporting evidence"}</p></div><span className="rounded-full bg-[#e8f2bf] px-3 py-1 text-xs font-semibold text-[#64770e]">{index === 0 ? "Strong match" : "Good match"}</span></div><p className="mt-4 text-sm leading-relaxed text-[#6f7169]">{index === 0 ? "Shows end-to-end ownership, systems thinking, and close product partnership." : "Adds domain depth in healthcare workflows and user-facing tools."}</p></div>)}</div></SectionPanel>}
            {activeSection === "Impact & clarity" && <SectionPanel eyebrow="Impact & clarity" title="The work is clear. The proof needs one more layer." icon={<BarChart3 className="size-5" />}><div className="grid gap-4 md:grid-cols-3">{[["Action verbs", "Strong", "lime"], ["Specificity", "Good", "orange"], ["Measurable impact", "Add proof", "ink"]].map(([label, value, tone]) => <div key={label} className="rounded-2xl bg-[#faf9f5] p-5"><div className={cn("mb-5 flex size-10 items-center justify-center rounded-xl", tone === "lime" ? "bg-[#e8f2bf] text-[#64770e]" : tone === "orange" ? "bg-[#f7e1d4] text-[#b1552b]" : "bg-[#e6e7e0] text-[#42443e]")}><PenLine className="size-4" /></div><p className="text-sm text-[#777970]">{label}</p><p className="mt-1 font-display text-xl font-semibold">{value}</p></div>)}</div><div className="mt-5 rounded-2xl border border-dashed border-[#d3d0c4] p-5"><p className="text-sm font-semibold">A stronger pattern for your bullets</p><p className="mt-2 text-sm leading-relaxed text-[#777970]">Action + context + decision + verified result. The AI will never invent a metric; use a placeholder until you can confirm one.</p></div></SectionPanel>}
            {activeSection === "Recommendations" && <SectionPanel eyebrow="Recommendations" title="Turn good evidence into a memorable story." icon={<Lightbulb className="size-5" />}><div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]"><div className="space-y-2">{analysis.recommendations.map((item, index) => <button key={item.id} onClick={() => setActiveRecommendation(index)} className={cn("recommendation-tab", activeRecommendation === index && "recommendation-tab-active")}><span className={cn("priority-badge", item.priority === "High" ? "priority-high" : "priority-medium")}>{item.priority}</span><span className="text-left text-sm font-semibold">{item.title}</span></button>)}</div><div className="rounded-3xl bg-[#292b27] p-5 text-white sm:p-6"><div className="flex items-center justify-between"><span className="dark-label">Suggested edit</span><span className="text-xs text-[#aeb2a6]">{activeRecommendation + 1} / {analysis.recommendations.length}</span></div><p className="mt-4 text-sm leading-relaxed text-[#d0d3c8]">{analysis.recommendations[activeRecommendation]?.detail}</p><div className="mt-5 space-y-3"><div className="rounded-2xl bg-white/7 p-4"><p className="dark-label mb-2">Original</p><p className="text-sm leading-relaxed text-[#c1c6b9]">{analysis.recommendations[activeRecommendation]?.original}</p></div><div className="rounded-2xl border border-[#b8d262]/40 bg-[#b8d262]/10 p-4"><div className="mb-2 flex items-center justify-between"><p className="dark-label text-[#d7ec91]">Proposed</p><button onClick={() => setNotice("Suggestion copied to your draft clipboard.")} className="text-xs font-semibold text-[#d7ec91] hover:text-white">Copy</button></div><p className="text-sm leading-relaxed text-white">{analysis.recommendations[activeRecommendation]?.suggestion}</p></div></div></div></div></SectionPanel>}
          </main>

          <aside className="hidden w-[330px] shrink-0 xl:block"><div className="sticky top-5"><div className="mb-3 flex items-center justify-between px-1"><div><p className="eyebrow">Career coach</p><h2 className="mt-1 font-display text-xl font-semibold tracking-[-0.04em]">Ask anything</h2></div><div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f2bf] text-[#64770e]"><MessageCircle className="size-4" /></div></div><AIChatBox messages={messages} onSendMessage={sendMessage} isLoading={chatMutation.isPending} height={610} className="chat-shell" placeholder="Ask about your resume..." suggestedPrompts={["What should I fix first?", "Rewrite my strongest bullet", "Where is my evidence thin?"]} emptyStateMessage="Your resume coach is ready." /><div className="mt-3 flex items-start gap-2 px-1 text-[11px] leading-relaxed text-[#8a8c83]"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" /> Your conversation is grounded in this analysis and is not used to invent experience.</div></div></aside>
        </div>
        <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#dedbd1] bg-white/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur xl:hidden"><MessageCircle className="size-4 text-[#6a7b16]" /> Chat coach <button onClick={() => setNotice("Chat is available on the right side of the workspace on larger screens.")} className="ml-1 rounded-full bg-[#292b27] px-3 py-1.5 text-white">Open</button></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f5ef] text-[#20211f]">
      <header className="relative z-20 mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12"><button onClick={() => setMode("landing")} className="flex items-center gap-2.5"><span className="brand-mark"><Sparkles className="size-4" /></span><span className="font-display text-lg font-bold tracking-[-0.04em]">ResumePilot<span className="text-[#819415]">.ai</span></span></button><nav className="hidden items-center gap-8 md:flex">{navItems.map((item) => <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className="text-sm font-medium text-[#6e706a] transition hover:text-[#20211f]">{item}</a>)}</nav><div className="flex items-center gap-3"><button onClick={() => setNotice("Sign in is coming soon. You can run a full demo audit without an account.")} className="hidden text-sm font-semibold text-[#5e6158] sm:block">Sign in</button><Button onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-[#292b27] px-5 text-sm font-semibold text-white shadow-none hover:bg-[#454841]">Start free <ArrowRight className="ml-1 size-4" /></Button><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-full border border-[#ddd9ce] p-2 md:hidden"><Menu className="size-4" /></button></div></header>
      {mobileMenuOpen && <div className="relative z-10 border-y border-[#e5e2d9] bg-[#fbfaf6] px-5 py-4 md:hidden"><div className="flex flex-col gap-4 text-sm font-semibold">{navItems.map((item) => <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} onClick={() => setMobileMenuOpen(false)}>{item}</a>)}</div></div>}
      <main>
        <section className="hero-grid relative mx-auto max-w-[1500px] px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:px-12 lg:pb-28 lg:pt-24"><div className="absolute -left-24 top-20 size-64 rounded-full bg-[#dfeab2]/45 blur-3xl" /><div className="relative grid items-center gap-14 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10"><div className="max-w-2xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d9e5aa] bg-[#f1f6dc] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#66770f]"><span className="status-dot" /> AI career coach for your next move</div><h1 className="font-display text-[clamp(3.5rem,7vw,6.7rem)] font-semibold leading-[0.92] tracking-[-0.075em]">Make your resume <span className="text-[#84951a]">say more.</span></h1><p className="mt-7 max-w-xl text-lg leading-relaxed text-[#6f716a] sm:text-xl">ResumePilot finds the signal in your experience, matches it to the role, and gives you the next three changes that actually matter.</p><div className="mt-8 flex flex-wrap items-center gap-4"><button onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })} className="group inline-flex items-center gap-3 rounded-full bg-[#292b27] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(41,43,39,0.14)] transition hover:-translate-y-0.5 hover:bg-[#454841]">Analyze my resume <span className="flex size-7 items-center justify-center rounded-full bg-[#d7eb8d] text-[#4a5c0e] transition group-hover:translate-x-0.5"><ArrowRight className="size-4" /></span></button><span className="flex items-center gap-2 text-sm text-[#7a7c74]"><LockKeyhole className="size-4 text-[#879a1d]" /> Private by default</span></div><div className="mt-10 flex items-center gap-5 text-sm text-[#787a72]"><div className="flex -space-x-2"><span className="avatar-dot bg-[#d8c4ad]">MP</span><span className="avatar-dot bg-[#b7c985]">JL</span><span className="avatar-dot bg-[#d8a18b]">AS</span></div><span><strong className="text-[#2d2f2a]">12,000+</strong> career pivots started here</span></div></div><div className="relative"><div className="hero-orb absolute -right-24 -top-24 hidden size-64 rounded-full bg-[#e8f2bf] blur-2xl lg:block" /><div className="premium-stage relative rounded-[2rem] border border-[#e1dfd5] bg-[#fbfaf6]/90 p-3 shadow-[0_30px_80px_rgba(56,58,45,0.10)] sm:p-4"><div className="hero-tilt rounded-[1.4rem] bg-[#292b27] p-5 text-white sm:p-7"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#c9e87b]" /><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#cbd1bf]">Live resume audit</span></div><p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em]">Senior Product Designer</p></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-[#cbd1bf]">Today</span></div><div className="mt-7 flex items-center gap-6"><ScoreRing score={78} small /><div><p className="text-sm font-semibold text-[#f1f3ea]">Strong foundation</p><p className="mt-2 max-w-[220px] text-sm leading-relaxed text-[#aeb3a6]">Your experience is aligned. A few sharper details can make it easier to trust.</p></div></div><div className="mt-7 grid grid-cols-3 gap-2">{[["92%", "Core skills"], ["78%", "Role fit"], ["64%", "Evidence"]].map(([value, label]) => <div key={label} className="rounded-2xl bg-white/7 p-3"><p className="font-display text-xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-[#aeb3a6]">{label}</p></div>)}</div><div className="mt-6 rounded-2xl border border-[#b8d262]/30 bg-[#b8d262]/10 p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#d7ec91]"><Sparkles className="size-3.5" /> Coach note</div><p className="mt-2 text-sm leading-relaxed text-[#e6eadb]">Add one verified outcome to your onboarding story. It is the fastest way to make your impact memorable.</p></div></div><div className="flex items-center justify-between px-2 pb-1 pt-4 text-xs text-[#8a8c83]"><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-[#819415]" /> Evidence-based feedback</span><span>ResumePilot / 01</span></div></div></div></div></section>
        <section id="analyzer" className="border-y border-[#e4e1d8] bg-[#efede5] px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1500px]"><div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Start your audit</p><h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-5xl">Give us the context. <span className="text-[#839417]">We’ll find the signal.</span></h2></div><button onClick={useSample} className="flex items-center gap-2 self-start text-sm font-semibold text-[#6a7b16] hover:text-[#3f4b0c] sm:self-auto"><Zap className="size-4" /> Try a sample resume</button></div><div className="grid gap-5 lg:grid-cols-2"><div className="paper-card p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><span className="step-number">01</span><div><h3 className="font-display text-xl font-semibold tracking-[-0.03em]">Your resume</h3><p className="text-sm text-[#85877e]">Paste text or upload a file</p></div></div><button onClick={() => fileInputRef.current?.click()} className="rounded-full border border-[#dcd9cf] p-2.5 text-[#6f8116] hover:bg-[#f3f1e9]"><Upload className="size-4" /></button><input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} /></div><div onClick={() => !resume && fileInputRef.current?.click()} className="relative"><Textarea value={resume} onChange={(event) => setResume(event.target.value)} placeholder="Paste your resume here..." className="min-h-[280px] resize-none rounded-2xl border-[#dedbd1] bg-[#fcfbf7] p-4 text-sm leading-relaxed shadow-none placeholder:text-[#a5a69d] focus-visible:ring-[#b2cb58]" />{fileName && <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-[#e8f2bf] px-3 py-1.5 text-xs font-semibold text-[#64770e]"><FileText className="size-3.5" /> {fileName}<button onClick={() => { setFileName(""); setResume(""); }}><X className="size-3.5" /></button></div>}</div><div className="mt-4 flex items-center gap-2 text-xs text-[#8c8e86]"><CloudUpload className="size-4" /> PDF, DOCX, or plain text · 10 MB max</div></div><div className="paper-card p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="step-number step-number-orange">02</span><div><h3 className="font-display text-xl font-semibold tracking-[-0.03em]">Target role</h3><p className="text-sm text-[#85877e]">Paste the job description</p></div></div><Textarea value={job} onChange={(event) => setJob(event.target.value)} placeholder="Paste the job description here..." className="min-h-[280px] resize-none rounded-2xl border-[#dedbd1] bg-[#fcfbf7] p-4 text-sm leading-relaxed shadow-none placeholder:text-[#a5a69d] focus-visible:ring-[#e4a17f]" /><div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#8c8e86]"><CircleHelp className="mt-0.5 size-4 shrink-0" /> No job description? We can still give you a general resume clarity review.</div></div></div><div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-3xl bg-[#dceaa9] px-5 py-4 sm:flex-row sm:px-7"><div className="flex items-center gap-3 text-sm text-[#5e6a20]"><span className="flex size-8 items-center justify-center rounded-full bg-white/70"><ShieldCheck className="size-4" /></span><span><strong className="text-[#3d480e]">Your data stays yours.</strong> Delete your resume and analysis anytime.</span></div><button onClick={startAnalysis} disabled={analyzeMutation.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#292b27] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#454841] disabled:opacity-60 sm:w-auto">{analyzeMutation.isPending ? "Analyzing..." : "Run my audit"}<ArrowRight className="size-4" /></button></div></div></section>
        <section id="how-it-works" className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 lg:px-12"><div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="eyebrow">The better way to prep</p><h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-5xl">Less guessing.<br /><span className="text-[#839417]">More signal.</span></h2><p className="mt-6 max-w-sm text-base leading-relaxed text-[#777970]">A focused review that gives you evidence, not vague encouragement or a mysterious score.</p></div><div className="grid gap-4 sm:grid-cols-3">{[["01", "Read the room", "We map the role’s real priorities and identify what the hiring team is likely scanning for.", FileText], ["02", "Find your proof", "We connect your strongest experience to those priorities and flag where evidence is thin.", Radar], ["03", "Make the move", "You get three prioritized edits, with the reasoning and wording to act on them.", Flag]].map(([num, title, text, Icon]) => <div key={String(num)} className="process-card"><span className="eyebrow text-[#8a9c21]">{String(num)}</span><div className="my-12 flex size-11 items-center justify-center rounded-2xl bg-[#f1f6dc] text-[#6b7d13]"><Icon className="size-5" /></div><h3 className="font-display text-xl font-semibold tracking-[-0.04em]">{String(title)}</h3><p className="mt-3 text-sm leading-relaxed text-[#777970]">{String(text)}</p></div>)}</div></div></section>
        <section id="what-you-get" className="bg-[#292b27] px-5 py-20 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-[1500px]"><div className="grid items-end gap-8 lg:grid-cols-[1fr_0.8fr]"><div><p className="eyebrow text-[#c6db75]">Built for action</p><h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-5xl">A coach that shows its work.</h2></div><p className="max-w-md text-base leading-relaxed text-[#b1b6a9]">Every suggestion points back to your resume or the role. No invented metrics. No black-box confidence.</p></div><div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">{[["Explainable", "See the evidence behind every score and recommendation.", Lightbulb], ["Context-aware", "Ask follow-ups grounded in this resume and this role.", MessageCircle], ["Private by default", "Your resume is yours. Delete the source when you’re done.", LockKeyhole]].map(([title, text, Icon]) => <div key={String(title)} className="bg-[#292b27] p-7 sm:p-9"><Icon className="size-5 text-[#c6db75]" /><h3 className="mt-12 font-display text-2xl font-semibold tracking-[-0.04em]">{String(title)}</h3><p className="mt-3 max-w-xs text-sm leading-relaxed text-[#aeb3a6]">{String(text)}</p></div>)}</div></div></section>
        <section id="privacy" className="mx-auto flex max-w-[1500px] flex-col justify-between gap-7 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:px-12"><div className="flex items-start gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2bf] text-[#64770e]"><LockKeyhole className="size-5" /></div><div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">Your career story stays yours.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#777970]">ResumePilot never uses protected characteristics in scoring. You control your data and can delete your resume and analysis whenever you want.</p></div></div><button onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 self-start rounded-full border border-[#d6d3c8] px-5 py-3 text-sm font-bold hover:bg-[#f1efe7]">Start your audit <ArrowRight className="size-4" /></button></section>
      </main>
      <footer className="border-t border-[#e4e1d8] px-5 py-7 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-3 text-xs text-[#8b8d84] sm:flex-row"><span>© 2026 ResumePilot.ai</span><span>Analysis is guidance, not a hiring prediction.</span></div></footer>
      {notice && mode === "landing" && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#292b27] px-4 py-3 text-sm text-white shadow-xl"><Check className="size-4 text-[#d7eb8d]" />{notice}<button onClick={() => setNotice("")} className="ml-2 text-[#aeb3a6]"><X className="size-4" /></button></div>}
    </div>
  );
}

function WorkspaceHeader({ onReset, onMenu }: { onReset: () => void; onMenu: () => void }) {
  return <header className="border-b border-[#e3e0d6] bg-[#fbfaf6]/85 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><button onClick={onMenu} className="rounded-full border border-[#ddd9ce] p-2 lg:hidden"><Menu className="size-4" /></button><button onClick={onReset} className="flex items-center gap-2.5"><span className="brand-mark"><Sparkles className="size-3.5" /></span><span className="font-display text-base font-bold tracking-[-0.04em]">ResumePilot<span className="text-[#819415]">.ai</span></span></button><span className="hidden h-5 w-px bg-[#dedbd1] sm:block" /><span className="hidden text-xs font-medium text-[#8a8c83] sm:block">Analysis workspace</span></div><div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-xs text-[#777970] sm:flex"><span className="status-dot" /> Autosaved</span><button onClick={onReset} className="rounded-full border border-[#dcd9cf] px-4 py-2 text-xs font-bold text-[#5d6057] hover:bg-[#f2f0e8]">Exit workspace</button></div></div></header>;
}

function ScoreRing({ score, small = false }: { score: number; small?: boolean }) {
  const size = small ? 116 : 138;
  const stroke = small ? 8 : 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  return <div className="relative" style={{ width: size, height: size }}><svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={small ? "rgba(255,255,255,0.10)" : "#e3e6dc"} strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#c8e875" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${progress} ${circumference - progress}`} /></svg><div className={cn("absolute inset-0 flex flex-col items-center justify-center", small ? "text-white" : "text-[#292b27]")}><span className={cn("font-display font-semibold tracking-[-0.08em]", small ? "text-3xl" : "text-4xl")}>{score}</span><span className={cn("text-[10px] font-bold uppercase tracking-[0.13em]", small ? "text-[#b5bcae]" : "text-[#878a80]")}>match</span></div></div>;
}

function SkillBar({ label, value, tone }: { label: string; value: number; tone: "lime" | "orange" | "ink" }) {
  return <div><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{label}</span><span className="font-display text-lg font-semibold">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#e7e5dc]"><div className={cn("h-full rounded-full", tone === "lime" ? "bg-[#9bb72c]" : tone === "orange" ? "bg-[#dc9168]" : "bg-[#4d5049]")} style={{ width: `${value}%` }} /></div></div>;
}

function SectionPanel({ eyebrow, title, icon, children }: { eyebrow: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="paper-card animate-in fade-in duration-300 p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-[-0.05em]">{title}</h2></div><div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f1f6dc] text-[#6c7f14]">{icon}</div></div><div className="mt-8">{children}</div></div>;
}
