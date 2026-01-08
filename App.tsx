
import React, { useState, useEffect } from 'react';
import { 
  Download, Upload, LayoutDashboard, 
  Table as TableIcon, Save, Calculator,
  CheckCircle2, Hash, Building2, User, 
  Sun, Moon, CloudUpload, Loader2, Settings
} from 'lucide-react';
import { Goal, ViewType, QuarterDetail } from './types';
import BudgetTable from './components/BudgetTable';
import Dashboard from './components/Dashboard';
import { exportToExcel, parseExcelFile, getExcelBlob } from './utils/excelUtils';

const getAmt = (q: QuarterDetail) => (q.rate || 0) * (q.quantity || 0);

const toLakhsFormatted = (val: number) => {
  const lakhs = val / 100000;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(lakhs);
};

declare global {
  interface Window {
    google: any;
  }
}

const App: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const [view, setView] = useState<ViewType>('PLANNER');
  const [showNotification, setShowNotification] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveClientId, setDriveClientId] = useState(() => localStorage.getItem('drive_client_id') || '479976373809-m6f0rscskv6s2r0i99at9909i2v640r1.apps.googleusercontent.com');
  
  // Default to Light Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
        const result = await parseExcelFile(file);
        setGoals(result.goals);
        if (result.schoolName) setSchoolName(result.schoolName);
        if (result.schoolCode) setSchoolCode(String(result.schoolCode));
        if (result.submittedBy) setSubmittedBy(result.submittedBy);
      } catch (err) {
        console.error(err);
        alert("Import failed. Check file format.");
      }
    }
  };

  const handleSaveToDrive = async () => {
    if (!window.google || !window.google.accounts) {
      alert("Google Identity Services not loaded. Please ensure you have an internet connection.");
      return;
    }

    setIsUploadingToDrive(true);
    
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: driveClientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.error !== undefined) {
            setIsUploadingToDrive(false);
            if (response.error === 'idpiframe_initialization_failed') {
              alert("Drive auth failed. This is likely due to the Client ID not being authorized for this domain. Please check your Google Cloud Console settings.");
            } else {
              alert("Error during Drive authorization: " + response.error);
            }
            return;
          }

          const now = new Date().toLocaleString();
          const blob = getExcelBlob(goals, schoolName, schoolCode, submittedBy, now);
          const fileName = `Budget_Report_${schoolCode || 'N_A'}_${(schoolName || 'Budget').replace(/\s+/g, '_')}.xlsx`;

          // Manual multipart/related construction
          const metadata = {
            name: fileName,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };

          const boundary = '-------314159265358979323846';
          const delimiter = "\r\n--" + boundary + "\r\n";
          const close_delim = "\r\n--" + boundary + "--";

          const reader = new FileReader();
          reader.readAsBinaryString(blob);
          reader.onload = async () => {
            const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const multipartBody = 
              delimiter + 
              'Content-Type: application/json; charset=UTF-8\r\n\r\n' + 
              JSON.stringify(metadata) + 
              delimiter + 
              'Content-Type: ' + contentType + '\r\n' + 
              'Content-Transfer-Encoding: base64\r\n\r\n' + 
              btoa(reader.result as string) + 
              close_delim;

            try {
              const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${response.access_token}`,
                  'Content-Type': 'multipart/related; boundary=' + boundary,
                },
                body: multipartBody,
              });

              if (uploadResponse.ok) {
                alert('Success! File saved to your Google Drive.');
              } else {
                const err = await uploadResponse.json();
                console.error("Drive upload failed", err);
                alert('Drive upload failed: ' + (err.error?.message || 'Unknown error'));
              }
            } catch (err) {
              console.error(err);
              alert("Network error while uploading to Drive.");
            } finally {
              setIsUploadingToDrive(false);
            }
          };
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error(error);
      alert('Failed to initialize Drive connection.');
      setIsUploadingToDrive(false);
    }
  };

  const promptSetClientId = () => {
    const id = prompt("Please enter your Google Cloud Client ID to enable Drive integration for your domain:", driveClientId);
    if (id) {
      setDriveClientId(id);
      localStorage.setItem('drive_client_id', id);
    }
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col font-sans selection:bg-au-blue-light selection:text-au-blue transition-colors duration-300">
      {/* Optimized Header */}
      <header className="bg-white dark:bg-slate-900 border-b-2 border-au-blue sticky top-0 z-40 shadow-sm transition-colors">
        <div className="w-full px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <img src="https://ahduni.edu.in/site/templates/images/logo.png" alt="Ahmedabad University" className="h-8 w-auto dark:brightness-110" />
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-au-blue dark:text-au-blue-light tracking-wider uppercase leading-none">Budget Proposal</span>
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
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 outline-none w-full"
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
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 outline-none"
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
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0 h-8">
              <Upload className="w-3 h-3 text-slate-400 group-hover:text-au-blue" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Import</span>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </label>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-au-blue dark:text-au-blue-light bg-white dark:bg-slate-900 border border-au-blue rounded hover:bg-au-blue-light dark:hover:bg-au-blue/20 transition-all h-8"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <div className="flex items-center">
              <button 
                onClick={handleSaveToDrive}
                disabled={isUploadingToDrive}
                title="Save current planner to Google Drive"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-l border border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 transition-all h-8 ${isUploadingToDrive ? 'text-slate-300 border-slate-300' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
              >
                {isUploadingToDrive ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                Drive
              </button>
              <button 
                onClick={promptSetClientId}
                title="Google Drive Project Settings"
                className="flex items-center justify-center px-1.5 py-1.5 h-8 border-y border-r border-emerald-600 dark:border-emerald-500 rounded-r bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
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
        <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm gap-4 overflow-x-auto custom-scrollbar transition-colors">
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded border border-slate-100 dark:border-slate-700 shrink-0">
            {[
              { id: 'PLANNER', icon: TableIcon, label: 'Planner' },
              { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as ViewType)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                  view === tab.id ? 'bg-white dark:bg-slate-700 text-au-blue dark:text-au-blue-light shadow border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-au-blue dark:hover:text-au-blue-light'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 shrink-0 pr-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">University Allotment (in lakhs)</span>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-au-blue dark:text-au-blue-light font-bold text-[12px]">₹</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tighter transition-colors">
                  {toLakhsFormatted(totalBudget)}
                </span>
                <span className="text-slate-400 font-bold text-[10px] uppercase ml-1">Lakhs</span>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 shrink-0" />

            <div className="flex items-center gap-4 px-2">
              {['q1', 'q2', 'q3', 'q4'].map(q => (
                <div key={q} className="flex flex-col items-end">
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">{q}</p>
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono leading-none transition-colors">
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
        </div>
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 mt-auto transition-colors">
        <div className="w-full px-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-au-blue dark:text-au-blue-light tracking-wider uppercase">Strategic Goal-Activity planning suite</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">© 2025 Ahmedabad University</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 dark:text-slate-500 hover:text-au-blue dark:hover:text-au-blue-light uppercase tracking-widest transition-colors mr-4"
            >
              {isDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <span className="text-[8px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">Security Verified</span>
            <span className="text-[8px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">Internal Use Only</span>
          </div>
        </div>
      </footer>

      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 z-50">
          <CheckCircle2 className="text-emerald-400 dark:text-emerald-600 w-4 h-4" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest font-mono leading-none">Progress Saved</p>
            <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-1">Data synchronized locally.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
