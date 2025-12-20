
import React, { useState, useEffect } from 'react';
import { 
  Download, Upload, BrainCircuit, LayoutDashboard, 
  Table as TableIcon, Save, Calculator,
  CheckCircle2, Loader2, Hash, Building2, User, TrendingUp
} from 'lucide-react';
import { Goal, ViewType, QuarterDetail } from './types';
import BudgetTable from './components/BudgetTable';
import Dashboard from './components/Dashboard';
import { exportToExcel, parseExcelFile } from './utils/excelUtils';
import { getBudgetInsights } from './services/geminiService';

const getAmt = (q: QuarterDetail) => (q.rate || 0) * (q.quantity || 0);

const toLakhsFormatted = (val: number) => {
  const lakhs = val / 100000;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(lakhs);
};

const App: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const [view, setView] = useState<ViewType>('PLANNER');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('school_budget_suite_v10');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setGoals(data.goals || []);
        setSubmittedBy(data.submittedBy || '');
        setLastSaved(data.lastSaved || '');
        if (data.schoolName) setSchoolName(data.schoolName);
        if (data.schoolCode) setSchoolCode(data.schoolCode);
      } catch (e) {
        console.error("Failed to load saved data");
      }
    }
  }, []);

  const handleSave = () => {
    const now = new Date().toLocaleString();
    setLastSaved(now);
    localStorage.setItem('school_budget_suite_v10', JSON.stringify({
      goals,
      submittedBy,
      schoolName,
      schoolCode,
      lastSaved: now
    }));
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const importedGoals = await parseExcelFile(file);
        setGoals(importedGoals);
      } catch (err) {
        alert("Import failed. Check file format.");
      }
    }
  };

  const generateAiInsights = async () => {
    if (goals.length === 0) return;
    setIsAiLoading(true);
    setView('AI_INSIGHTS');
    const insights = await getBudgetInsights(goals);
    setAiInsights(insights);
    setIsAiLoading(false);
  };

  const quarterlyTotals = goals.reduce((acc, g) => {
    g.activities.forEach(a => {
      a.subActivities.forEach(s => {
        acc.q1 += getAmt(s.q1);
        acc.q2 += getAmt(s.q2);
        acc.q3 += getAmt(s.q3);
        acc.q4 += getAmt(s.q4);
      });
    });
    return acc;
  }, { q1: 0, q2: 0, q3: 0, q4: 0 });

  const totalBudget = quarterlyTotals.q1 + quarterlyTotals.q2 + quarterlyTotals.q3 + quarterlyTotals.q4;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-au-blue-light selection:text-au-blue">
      {/* Optimized Header */}
      <header className="bg-white border-b-2 border-au-blue sticky top-0 z-40 shadow-sm">
        <div className="w-full px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <img src="https://ahduni.edu.in/site/templates/images/logo.png" alt="Ahmedabad University" className="h-8 w-auto" />
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-au-blue tracking-wider uppercase leading-none">Budget Proposal</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">FY 2025-26</span>
            </div>
          </div>

          <div className="flex-grow flex items-center gap-4 max-w-5xl">
            <div className="flex flex-col flex-grow">
              <label className="text-[8px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Building2 className="w-2 h-2" /> School / Activity / Function Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter School name..."
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-700 focus:bg-white outline-none w-full"
              />
            </div>
            <div className="flex flex-col w-16">
              <label className="text-[8px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Hash className="w-2 h-2" /> Code
              </label>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                placeholder="ID"
                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[10px] font-bold text-slate-700 focus:bg-white outline-none"
              />
            </div>
            <div className="flex flex-col flex-grow">
              <label className="text-[8px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <User className="w-2 h-2" /> Submitted By
              </label>
              <input
                type="text"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                placeholder="Enter name..."
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-700 focus:bg-white outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100 transition-all shrink-0 h-8">
              <Upload className="w-3 h-3 text-slate-400 group-hover:text-au-blue" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Import</span>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </label>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-au-blue bg-white border border-au-blue rounded hover:bg-au-blue-light transition-all h-8"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={() => {
                const now = new Date().toLocaleString();
                exportToExcel(goals, schoolName, schoolCode, submittedBy, now);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold text-white bg-au-blue hover:bg-au-blue-dark rounded shadow-sm transition-all h-8"
            >
              <Download className="w-3 h-3" />
              Excel
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-4 flex-grow">
        {/* Navigation & Summary Bar */}
        <div className="flex items-center justify-between mb-4 bg-white p-2 rounded border border-slate-200 shadow-sm gap-4 overflow-x-auto custom-scrollbar">
          <div className="flex bg-slate-50 p-1 rounded border border-slate-100 shrink-0">
            {[
              { id: 'PLANNER', icon: TableIcon, label: 'Planner' },
              { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as ViewType)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                  view === tab.id ? 'bg-white text-au-blue shadow border border-slate-200' : 'text-slate-500 hover:text-au-blue'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 shrink-0 pr-2">
            {/* Total Budget - estrictly single line, optimized spacing */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Total Budget (in lakhs)</span>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-au-blue font-bold text-[12px]">₹</span>
                <span className="text-2xl font-black text-slate-800 font-mono tracking-tighter">
                  {toLakhsFormatted(totalBudget)}
                </span>
                <span className="text-slate-400 font-bold text-[10px] uppercase ml-1">Lakhs</span>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 shrink-0" />

            <div className="flex items-center gap-4 px-2">
              {['q1', 'q2', 'q3', 'q4'].map(q => (
                <div key={q} className="flex flex-col items-end">
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">{q}</p>
                  <p className="text-[11px] font-black text-slate-700 font-mono leading-none">
                    ₹{toLakhsFormatted(quarterlyTotals[q as keyof typeof quarterlyTotals])}L
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Views */}
        <div className="min-h-[500px]">
          {view === 'PLANNER' && (
            <div className="animate-in fade-in duration-300">
              <BudgetTable goals={goals} setGoals={setGoals} schoolName={schoolName} />
            </div>
          )}

          {view === 'DASHBOARD' && (
            <div className="animate-in fade-in duration-300">
              <Dashboard goals={goals} />
            </div>
          )}

          {view === 'AI_INSIGHTS' && (
            <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500 bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-au-blue p-6 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight mb-1">Strategic Audit</h2>
                  <p className="text-au-blue-light text-[10px] font-medium">Financial health analysis powered by Gemini AI.</p>
                </div>
                <BrainCircuit className="w-8 h-8 text-white/20" />
              </div>

              {isAiLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-au-blue animate-spin" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Synthesizing insights...</p>
                </div>
              ) : (
                <div className="p-8 prose prose-slate prose-sm max-w-none">
                  {aiInsights ? (
                    <div className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{aiInsights}</div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-slate-400 font-bold text-xs">No budget data available for analysis.</p>
                      <button onClick={generateAiInsights} className="mt-4 bg-au-blue text-white px-6 py-2 rounded font-bold text-[10px] uppercase tracking-widest">Run Analysis</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 mt-auto">
        <div className="w-full px-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-au-blue tracking-wider uppercase">Strategic Goal-Activity planning suite</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">© 2025 Ahmedabad University</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={generateAiInsights}
              className="flex items-center gap-1.5 text-[8px] font-bold text-slate-300 hover:text-au-blue uppercase tracking-widest transition-colors mr-4"
            >
              <BrainCircuit className="w-3 h-3" />
              Insights
            </button>
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Security Verified</span>
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Internal Use Only</span>
          </div>
        </div>
      </footer>

      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 z-50">
          <CheckCircle2 className="text-emerald-400 w-4 h-4" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest font-mono leading-none">Progress Saved</p>
            <p className="text-[8px] text-slate-400 mt-1">Data synchronized locally.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
