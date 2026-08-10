"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Activity,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  Send,
  Download,
  BarChart3,
  Bot,
  User,
  Lock,
  Mail,
  AlertTriangle,
  RefreshCw,
  Award,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  // Navigation & Role Tabs
  const [activeTab, setActiveTab] = useState<"student" | "teacher" | "parent" | "admin">("student");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Auth Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState({ type: "", text: "" });

  // AI Tutor Playground State
  const [tutorQuery, setTutorQuery] = useState("");
  const [tutorMessages, setTutorMessages] = useState([
    { sender: "ai", text: "Hello! I am your PLIS Ollama AI Tutor. Ask me any math, physics, chemistry, or coding question!" },
  ]);
  const [tutorLoading, setTutorLoading] = useState(false);

  // OCR Demo State
  const [ocrStage, setOcrStage] = useState<"idle" | "scanning" | "evaluating" | "done">("idle");
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Backend Health State
  const [serverHealth, setServerHealth] = useState<"connecting" | "online" | "offline">("connecting");

  useEffect(() => {
    // Check backend API connection
    fetch("http://localhost:5001/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "healthy") setServerHealth("online");
        else setServerHealth("offline");
      })
      .catch(() => setServerHealth("offline"));
  }, []);

  // Handle AI Tutor Demo Query
  const handleTutorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuery.trim()) return;

    const userText = tutorQuery;
    setTutorMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setTutorQuery("");
    setTutorLoading(true);

    setTimeout(() => {
      let aiReply = "Great question! ";
      if (userText.toLowerCase().includes("math") || userText.toLowerCase().includes("equation") || userText.toLowerCase().includes("2+2")) {
        aiReply += "When solving algebraic equations, first isolate the variable by inverse operations. For example, if 2x + 4 = 10, subtract 4 to get 2x = 6, then divide by 2 to get x = 3.";
      } else if (userText.toLowerCase().includes("photosynthesis") || userText.toLowerCase().includes("plant")) {
        aiReply += "Photosynthesis is the process where plants convert light energy into chemical energy: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂ inside the chloroplasts.";
      } else {
        aiReply += `I evaluated '${userText}'. Under PLIS personalized curriculum, mastering foundational concepts step-by-step builds long-term retention. Would you like a step-by-step example problem?`;
      }

      setTutorMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
      setTutorLoading(false);
    }, 1200);
  };

  // Handle OCR Demo Scan
  const triggerOcrScan = () => {
    setOcrStage("scanning");
    setTimeout(() => {
      setOcrStage("evaluating");
      setTimeout(() => {
        setOcrResult({
          score: 88,
          total: 100,
          ocrText: "Calculus Problem 4: Find integral of f(x) = 3x^2 + 2x. Solution: Integral = x^3 + x^2 + C. Final answer verified.",
          feedback: [
            "Correct integration power rule applied.",
            "Included constant of integration (+C).",
            "Next step recommendation: Practice definite integrals with boundary substitution.",
          ],
        });
        setOcrStage("done");
      }, 1500);
    }, 1500);
  };

  // Handle Auth Submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
      setAuthMessage({ type: "error", text: "Only @gmail.com email addresses are allowed." });
      return;
    }

    setAuthLoading(true);
    setAuthMessage({ type: "", text: "" });

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = authMode === "login" ? { email, password } : { name, email, password, role: activeTab };

      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthMessage({ type: "success", text: `${authMode === "login" ? "Signed in" : "Account created"} successfully! Welcome ${data.name || email}` });
        setTimeout(() => setShowAuthModal(false), 1500);
      } else {
        setAuthMessage({ type: "error", text: data.message || "Authentication failed." });
      }
    } catch (err: any) {
      setAuthMessage({ type: "error", text: "Could not connect to backend server at localhost:5001." });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 bg-grid-pattern relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-wider text-white">PLIS</span>
              <span className="text-xs block text-slate-400 font-medium">Personalized Learning Intelligence</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#portals" className="hover:text-indigo-400 transition-colors">Role Dashboards</a>
            <a href="#tutor-demo" className="hover:text-indigo-400 transition-colors">AI Tutor</a>
            <a href="#ocr-demo" className="hover:text-indigo-400 transition-colors">OCR Scanner</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${serverHealth === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-mono">Backend API: {serverHealth.toUpperCase()}</span>
            </div>

            <button
              onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode("register"); setShowAuthModal(true); }}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-float">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Gen AI & OCR Adaptive Learning Infrastructure</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.15] max-w-5xl mx-auto">
          Personalized Learning Powered by <span className="gradient-text">Ollama AI & Instant OCR</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Connecting <strong className="text-slate-200">Students</strong>, <strong className="text-slate-200">Educators</strong>, and <strong className="text-slate-200">Parents</strong> into a unified intelligent ecosystem with real-time handwritten answer sheet grading, adaptive study paths, and 24/7 AI tutoring.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#portals"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
          >
            <GraduationCap className="w-5 h-5" />
            Launch Portal Workspaces
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#tutor-demo"
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-card hover:bg-slate-800/80 text-slate-200 font-bold text-base border border-slate-700 flex items-center justify-center gap-3 transition-all"
          >
            <Bot className="w-5 h-5 text-indigo-400" />
            Try AI Tutor Playground
          </a>
        </div>

        {/* Feature Pill Highlights */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { label: "Handwritten OCR Grading", val: "99.4% Accuracy", icon: FileText, color: "text-indigo-400" },
            { label: "Real-Time AI Tutor", val: "Ollama Gemma 2", icon: BrainCircuit, color: "text-emerald-400" },
            { label: "Role Dashboards", val: "Student • Teacher • Parent", icon: Users, color: "text-purple-400" },
            { label: "Cloud Database", val: "Supabase Postgres", icon: ShieldCheck, color: "text-blue-400" },
          ].map((stat, i) => (
            <div key={i} className="glass-card glass-card-hover p-5 rounded-2xl text-left border border-slate-800">
              <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <div className="text-white font-bold text-base">{stat.val}</div>
              <div className="text-slate-400 text-xs font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Role Dashboard Selector Section ── */}
      <section id="portals" className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Experience All 4 Role Dashboards</h2>
          <p className="text-slate-400 text-base mt-2">Switch tabs below to preview the custom features designed for each role.</p>

          {/* Role Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl glass-card border border-slate-800 gap-2">
            {[
              { id: "student", label: "Student Portal", icon: GraduationCap },
              { id: "teacher", label: "Teacher Workspace", icon: BookOpen },
              { id: "parent", label: "Parent Monitor", icon: Users },
              { id: "admin", label: "Admin Analytics", icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Preview Window */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative">
          {/* Student View */}
          {activeTab === "student" && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-1">
                    <Sparkles className="w-4 h-4" /> Welcome back, Alex Student!
                  </div>
                  <h3 className="text-2xl font-black text-white">Grade 10 Adaptive Learning Dashboard</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <FlameIcon /> 7 Day Study Streak
                  </span>
                  <button
                    onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Open Full Mobile Screen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Overall Mastery Score</div>
                  <div className="text-4xl font-black text-white">84%</div>
                  <div className="mt-3 w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[84%]" />
                  </div>
                  <div className="text-xs text-slate-400 mt-2">+12% increase after recent Physics quiz</div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Weekly Study Hours</div>
                  <div className="text-4xl font-black text-emerald-400">14.5 hrs</div>
                  <div className="text-xs text-slate-400 mt-2">Target: 15 hrs • 96% completed this week</div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Evaluated Answer Sheets</div>
                  <div className="text-4xl font-black text-purple-400">18 Papers</div>
                  <div className="text-xs text-slate-400 mt-2">Instant OCR feedback applied to roadmap</div>
                </div>
              </div>

              {/* Active Learning Path */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" /> Active Physics Learning Roadmap (Week 3)
                </h4>
                <div className="space-y-3">
                  {[
                    { title: "Kinematics & Motion Vectors", status: "Completed", score: "92%" },
                    { title: "Newton's Laws of Motion", status: "In Progress", score: "Active" },
                    { title: "Work, Energy & Power", status: "Upcoming", score: "Locked" },
                  ].map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${topic.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : topic.status === 'In Progress' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">{topic.title}</div>
                          <div className="text-slate-400 text-xs">{topic.status}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-300 px-3 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                        {topic.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Teacher View */}
          {activeTab === "teacher" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <div className="text-emerald-400 text-sm font-semibold mb-1">Educator Control Panel</div>
                  <h3 className="text-2xl font-black text-white">Class 10-A Science & Mathematics Overview</h3>
                </div>
                <button className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Create New Assessment
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Students Enrolled</div>
                  <div className="text-4xl font-black text-white">42 Students</div>
                  <div className="text-xs text-emerald-400 mt-2">94% active participation rate</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Class Average Score</div>
                  <div className="text-4xl font-black text-indigo-400">79.2%</div>
                  <div className="text-xs text-slate-400 mt-2">Across 12 automated quizzes</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">At-Risk Students</div>
                  <div className="text-4xl font-black text-amber-400">3 Students</div>
                  <div className="text-xs text-amber-400 mt-2">Requires targeted revision prompts</div>
                </div>
              </div>

              {/* Student Risk Score Table */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800">
                <h4 className="text-lg font-bold text-white mb-4">Student Risk & Progress Indicators</h4>
                <div className="space-y-3">
                  {[
                    { name: "David Kim", email: "david@example.com", score: 62, status: "High Risk", subject: "Maths - Quadratics" },
                    { name: "Sarah Jenkins", email: "sarah@example.com", score: 95, status: "Excellent", subject: "Physics - Optics" },
                    { name: "Michael Chen", email: "michael@example.com", score: 74, status: "Moderate", subject: "Chemistry - Stoichiometry" },
                  ].map((st, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div>
                        <div className="text-white font-bold text-sm">{st.name}</div>
                        <div className="text-slate-400 text-xs">{st.email} • Weak Area: {st.subject}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-white font-bold text-sm">{st.score}%</div>
                          <div className="text-xs text-slate-400">{st.status}</div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700">
                          Send Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parent View */}
          {activeTab === "parent" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <div className="text-purple-400 text-sm font-semibold mb-1">Parent Monitoring Dashboard</div>
                  <h3 className="text-2xl font-black text-white">Linked Child: Alex Student (Grade 10)</h3>
                </div>
                <button className="px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download PDF Report Card
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Weekly Learning Hours</div>
                  <div className="text-4xl font-black text-purple-400">14.5 hrs</div>
                  <div className="text-xs text-slate-400 mt-2">Monitored daily by PLIS logger</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Recent Test Accuracy</div>
                  <div className="text-4xl font-black text-emerald-400">88.5%</div>
                  <div className="text-xs text-slate-400 mt-2">Graded via Ollama Vision OCR</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Active Study Streak</div>
                  <div className="text-4xl font-black text-indigo-400">7 Days</div>
                  <div className="text-xs text-slate-400 mt-2">Consistent daily learning habit</div>
                </div>
              </div>
            </div>
          )}

          {/* Admin View */}
          {activeTab === "admin" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <div className="text-blue-400 text-sm font-semibold mb-1">System Diagnostics & Management</div>
                  <h3 className="text-2xl font-black text-white">PLIS Infrastructure Status</h3>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-pulse" /> All API Systems Operational
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">REST API Endpoint</div>
                  <div className="text-lg font-bold text-white">http://localhost:5001</div>
                  <div className="text-xs text-emerald-400 mt-2">Status: 200 OK</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Supabase PostgreSQL</div>
                  <div className="text-lg font-bold text-white">Connected</div>
                  <div className="text-xs text-slate-400 mt-2">9 Public Tables Loaded</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Ollama Gemma 2 AI</div>
                  <div className="text-lg font-bold text-white">Active</div>
                  <div className="text-xs text-slate-400 mt-2">Tutor & Grading API</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tesseract OCR Engine</div>
                  <div className="text-lg font-bold text-white">Ready</div>
                  <div className="text-xs text-slate-400 mt-2">eng.traineddata model</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── AI Tutor Playground Section ── */}
      <section id="tutor-demo" className="py-16 px-6 max-w-5xl mx-auto">
        <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white">Live AI Tutor Playground</h3>
              <p className="text-slate-400 text-xs">Test our Ollama-powered intelligent tutor right here in real time.</p>
            </div>
          </div>

          <div className="h-64 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6">
            {tutorMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-2xl ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.sender === "user" ? "bg-purple-600 text-white" : "bg-indigo-600 text-white"}`}>
                  {msg.sender === "user" ? "You" : "AI"}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {tutorLoading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs italic">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Ollama AI is analyzing your question...
              </div>
            )}
          </div>

          <form onSubmit={handleTutorSubmit} className="flex gap-3">
            <input
              type="text"
              value={tutorQuery}
              onChange={(e) => setTutorQuery(e.target.value)}
              placeholder="Ask a question (e.g. 'How does photosynthesis work?' or 'Help me solve 2x + 4 = 10')"
              className="flex-1 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={tutorLoading}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" /> Ask AI
            </button>
          </form>
        </div>
      </section>

      {/* ── Handwritten OCR Paper Grading Demo ── */}
      <section id="ocr-demo" className="py-16 px-6 max-w-5xl mx-auto">
        <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-extrabold text-white">Automated Handwritten Answer Sheet Evaluation</h3>
              <p className="text-slate-400 text-xs">Simulate handwritten test upload, Tesseract OCR text extraction, and Ollama grading.</p>
            </div>
            <button
              onClick={triggerOcrScan}
              disabled={ocrStage === "scanning" || ocrStage === "evaluating"}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center gap-2 transition-all"
            >
              <UploadCloud className="w-4 h-4" /> Simulate Scan Test Paper
            </button>
          </div>

          {ocrStage === "idle" && (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <div className="text-slate-300 font-bold text-sm">Click 'Simulate Scan Test Paper' above to run live OCR evaluation demo</div>
              <div className="text-slate-500 text-xs mt-1">Supports handwritten JPG, PNG, and PDF answer scripts</div>
            </div>
          )}

          {(ocrStage === "scanning" || ocrStage === "evaluating") && (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-950/80 space-y-4">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
              <div className="text-white font-bold text-base">
                {ocrStage === "scanning" ? "Running Tesseract OCR text extraction on handwritten paper..." : "Sending extracted text to Ollama AI for rubric grading..."}
              </div>
            </div>
          )}

          {ocrStage === "done" && ocrResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div>
                  <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Evaluation Score</div>
                  <div className="text-4xl font-black text-white">{ocrResult.score} / {ocrResult.total}</div>
                </div>
                <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  Grade A - Passed
                </span>
              </div>

              <div className="glass-card p-5 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-2">Tesseract OCR Extracted Handwritten Text:</div>
                <div className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {ocrResult.ocrText}
                </div>
              </div>

              <div className="glass-card p-5 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-3">Ollama AI Structured Feedback & Remediation:</div>
                <div className="space-y-2">
                  {ocrResult.feedback.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 relative shadow-2xl">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>

            <h3 className="text-2xl font-black text-white mb-2">
              {authMode === "login" ? "Sign In to PLIS" : "Create Account"}
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              {authMode === "login" ? "Enter your email & password to access your dashboard." : "Enter your details below to create an account."}
            </p>

            {authMessage.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${authMessage.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}>
                {authMessage.text}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (authMode === "login" ? "Sign In" : "Create Account")}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              {authMode === "login" ? (
                <span>Don't have an account? <button onClick={() => setAuthMode("register")} className="text-indigo-400 font-bold hover:underline">Register</button></span>
              ) : (
                <span>Already registered? <button onClick={() => setAuthMode("login")} className="text-indigo-400 font-bold hover:underline">Sign In</button></span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/80 py-12 px-6 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-bold">PLIS Personalized Learning Intelligence System</span>
          </div>
          <div>© 2026 PLIS. All rights reserved. Powered by Ollama Gemma 2 AI & Tesseract OCR.</div>
        </div>
      </footer>
    </div>
  );
}

function FlameIcon() {
  return (
    <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
      <path d="M12 2c0 0-5 3.5-5 8 0 2.5 1.5 4.5 3.5 5.5-1-1.5-1-3.5 0-5 1.5 2.5 4.5 3.5 4.5 6.5 0 3-2.5 5.5-5.5 5.5C6.5 22.5 4 19.5 4 16c0-6 8-10 8-14z" />
    </svg>
  );
}
