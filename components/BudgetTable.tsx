
import React, { useState, useEffect, useRef } from 'react';
import { Goal, Activity, SubActivity, QuarterDetail } from '../types';
import { Plus, Trash2, Target, Briefcase, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  schoolName: string;
}

const LEDGER_LIST = [
  { name: 'Conference and Seminar Expense', code: 'E-1008' },
  { name: 'Research Seminar Series Expense', code: 'E-1014' },
  { name: 'Event Expenses', code: 'E-1030' },
  { name: 'Fresher / Farewell Expenses', code: 'E-1032' },
  { name: 'Orientation Day Expense', code: 'E-1038' },
  { name: 'ACCA Course Study Expenses', code: 'F-1047' },
  { name: 'Consumables (Lab Use)', code: 'F-1049' },
  { name: 'Immersion Programme Expenses', code: 'F-1055' },
  { name: 'Study Material Expenses', code: 'F-1072' },
  { name: 'Student Activities/ Project Expenses', code: 'F-1071' },
  { name: 'Foundation Programme Expense', code: 'F-1058' },
  { name: 'Adjunct Faculty Charges', code: 'G-1094' },
  { name: 'Academic Professional/consultancy Fees', code: 'G-1092' },
  { name: 'Fellowship- Ph.D Student (Full Time)', code: 'H-1118' },
  { name: 'Accreditation Fees', code: 'J-1162' },
  { name: 'Conveyance Expense', code: 'J-1169' },
  { name: 'Guest Refreshment & Travelling Expense', code: 'J-1172' },
  { name: 'Honorarium & Sitting Fees', code: 'J-1174' },
  { name: 'Miscellaneous Office Expense', code: 'J-1184' },
  { name: 'Recruitment Expenses', code: 'J-1193' },
  { name: 'Stationery & Printing Expenses', code: 'J-1198' },
  { name: 'Tea & Refreshment Expenses', code: 'J-1201' },
  { name: 'Institutional Membership Fees', code: 'J-1178' },
  { name: 'Branding and Promotion', code: 'K-1206' },
  { name: 'Digital & Social Media Marketing', code: 'K-1207' },
  { name: 'Domestic Outreach Expenses', code: 'K-1208' },
  { name: 'Maintenance - Other Equipments', code: 'L-1216' },
  { name: 'Maintenance of IT Assets', code: 'L-1219' },
  { name: 'Waste Removal Charges', code: 'L-1222' },
  { name: 'Software Maintenance Charges', code: 'L-1221' },
  { name: 'Building Repairs & Maintenance', code: 'L-1224' },
  { name: 'IT Hardwares & Consumables', code: 'L-1227' },
  { name: 'Faculty Development Allowance', code: 'M-1231' },
  { name: 'International Conference & Seminar Expenses - T', code: 'M-1232' },
  { name: 'National Conference & Seminar Support - T', code: 'M-1235' },
  { name: 'Employee wellness & recreation', code: 'M-1237' },
  { name: 'Students\' Workshops & Seminars Expense', code: 'N-1242' },
  { name: 'Student Training / Industrial Visits Expense', code: 'N-1245' },
  { name: 'Domestic Travel Expenses', code: 'Q-1290' },
  { name: 'Foreign Travel Expenses', code: 'Q-1291' }
];

const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
};

interface QuarterCompactInputProps {
  goalId: string;
  activityId: string;
  subId: string;
  qKey: 'q1' | 'q2' | 'q3' | 'q4';
  qData: QuarterDetail;
  accentColor: string;
  onUpdate: (goalId: string, activityId: string, subId: string, qKey: 'q1' | 'q2' | 'q3' | 'q4', field: keyof QuarterDetail, value: number) => void;
}

const QuarterCompactInput: React.FC<QuarterCompactInputProps> = React.memo(({ goalId, activityId, subId, qKey, qData, accentColor, onUpdate }) => {
  const getAmt = (q: QuarterDetail) => (q.rate || 0) * (q.quantity || 0);
  
  return (
    <td className="p-0 border-r border-slate-100">
      <div className="p-0.5 space-y-0.5 bg-white transition-colors w-[72px]">
        <div className="flex gap-0.5">
          <div className="flex-[2]">
            <input
              type="number"
              value={qData.quantity || ''}
              placeholder="Qty"
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate(goalId, activityId, subId, qKey, 'quantity', parseFloat(e.target.value) || 0)}
              className="w-full text-right bg-slate-50 rounded-sm px-0.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 outline-none border border-slate-200 h-5"
            />
          </div>
          <div className="flex-[3]">
            <input
              type="number"
              value={qData.rate || ''}
              placeholder="Rate"
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate(goalId, activityId, subId, qKey, 'rate', parseFloat(e.target.value) || 0)}
              className="w-full text-right bg-slate-50 rounded-sm px-0.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 outline-none border border-slate-200 h-5"
            />
          </div>
        </div>
        <div className={`flex justify-center items-center px-0.5 py-0.5 rounded-sm ${accentColor} border border-slate-100`}>
          <span className="font-mono text-[10px] font-bold truncate">₹{formatINR(getAmt(qData))}</span>
        </div>
      </div>
    </td>
  );
});

const BudgetTable: React.FC<Props> = ({ goals, setGoals, schoolName }) => {
  const [draggedGoalIndex, setDraggedGoalIndex] = useState<number | null>(null);
  const [draggedActivityInfo, setDraggedActivityInfo] = useState<{ goalId: string; index: number } | null>(null);
  const [draggedSubInfo, setDraggedSubInfo] = useState<{ goalId: string; activityId: string; index: number } | null>(null);
  
  const [collapsedGoals, setCollapsedGoals] = useState<Record<string, boolean>>({});
  const [collapsedActivities, setCollapsedActivities] = useState<Record<string, boolean>>({});
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (lastAddedId) {
      const el = document.querySelector(`[data-focus-id="${lastAddedId}"]`) as HTMLInputElement | HTMLTextAreaElement;
      if (el) {
        el.focus();
        if ('select' in el) el.select();
      }
      setLastAddedId(null);
    }
  }, [lastAddedId, goals]);

  const toggleGoalCollapse = (id: string) => {
    setCollapsedGoals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleActivityCollapse = (id: string) => {
    setCollapsedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addGoal = () => {
    const newId = crypto.randomUUID();
    setGoals([...goals, { id: newId, name: '', activities: [] }]);
    setLastAddedId(newId);
  };

  const updateGoalName = (goalId: string, name: string) => {
    setGoals(goals.map(g => g.id === goalId ? { ...g, name } : g));
  };

  const removeGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
  };

  const addActivity = (goalId: string) => {
    const newId = crypto.randomUUID();
    setGoals(goals.map(g => g.id === goalId ? {
      ...g,
      activities: [...g.activities, { id: newId, name: '', subActivities: [] }]
    } : g));
    setCollapsedGoals(prev => ({ ...prev, [goalId]: false }));
    setLastAddedId(newId);
  };

  const removeActivity = (goalId: string, activityId: string) => {
    setGoals(goals.map(g => g.id === goalId ? {
      ...g,
      activities: g.activities.filter(a => a.id !== activityId)
    } : g));
  };

  const updateActivityName = (goalId: string, activityId: string, name: string) => {
    setGoals(goals.map(g => g.id === goalId ? {
      ...g,
      activities: g.activities.map(a => a.id === activityId ? { ...a, name } : a)
    } : g));
  };

  const addSubActivity = (goalId: string, activityId: string) => {
    const newId = crypto.randomUUID();
    const emptyQ = () => ({ rate: 0, quantity: 0 });
    setGoals(goals.map(g => g.id === goalId ? {
      ...g,
      activities: g.activities.map(a => a.id === activityId ? {
        ...a,
        subActivities: [...a.subActivities, { 
          id: newId, 
          name: '', 
          description: '',
          remarks: '',
          reviewComments: '',
          ledgerName: '', 
          ledgerCode: '', 
          unit: '',
          q1: emptyQ(), 
          q2: emptyQ(), 
          q3: emptyQ(), 
          q4: emptyQ() 
        }]
      } : a)
    } : g));
    setCollapsedActivities(prev => ({ ...prev, [activityId]: false }));
    setLastAddedId(newId);
  };

  const removeSubActivity = (goalId: string, activityId: string, subId: string) => {
    setGoals(goals.map(g => g.id === goalId ? {
      ...g,
      activities: g.activities.map(a => a.id === activityId ? {
        ...a,
        subActivities: a.subActivities.filter(s => s.id !== subId)
      } : a)
    } : g));
  };

  const updateSubField = (goalId: string, activityId: string, subId: string, field: keyof SubActivity, value: string) => {
    setGoals(goals.map(g => g.id === goalId ? {
      ...g,
      activities: g.activities.map(a => a.id === activityId ? {
        ...a,
        subActivities: a.subActivities.map(s => {
          if (s.id === subId) {
            if (field === 'ledgerName') {
              const ledger = LEDGER_LIST.find(l => l.name === value);
              return { ...s, ledgerName: value, ledgerCode: ledger ? ledger.code : '' };
            }
            return { ...s, [field]: value };
          }
          return s;
        })
      } : a)
    } : g));
  };

  const updateQuarterValue = (goalId: string, activityId: string, subId: string, qKey: 'q1' | 'q2' | 'q3' | 'q4', field: keyof QuarterDetail, value: number) => {
    setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? {
      ...g,
      activities: g.activities.map(a => a.id === activityId ? {
        ...a,
        subActivities: a.subActivities.map(s => s.id === subId ? {
          ...s,
          [qKey]: { ...s[qKey], [field]: value }
        } : s)
      } : a)
    } : g));
  };

  const getAmt = (q: QuarterDetail) => (q.rate || 0) * (q.quantity || 0);
  const getSubTotal = (sub: SubActivity) => getAmt(sub.q1) + getAmt(sub.q2) + getAmt(sub.q3) + getAmt(sub.q4);
  const calculateGoalTotal = (goal: Goal) => goal.activities.reduce((sum, act) => sum + act.subActivities.reduce((sSum, sub) => sSum + getSubTotal(sub), 0), 0);
  const calculateActivityTotal = (activity: Activity) => activity.subActivities.reduce((sum, sub) => sum + getSubTotal(sub), 0);

  const handleGoalDragStart = (index: number) => {
    setDraggedGoalIndex(index);
  };
  const handleGoalDrop = (index: number) => {
    if (draggedGoalIndex === null || draggedGoalIndex === index) return;
    const newGoals = [...goals];
    const [moved] = newGoals.splice(draggedGoalIndex, 1);
    newGoals.splice(index, 0, moved);
    setGoals(newGoals);
    setDraggedGoalIndex(null);
  };

  const handleActivityDragStart = (goalId: string, index: number) => {
    setDraggedActivityInfo({ goalId, index });
  };
  const handleActivityDrop = (goalId: string, index: number) => {
    if (!draggedActivityInfo || draggedActivityInfo.goalId !== goalId || draggedActivityInfo.index === index) {
      setDraggedActivityInfo(null);
      return;
    }
    const newGoals = goals.map(g => {
      if (g.id === goalId) {
        const newActivities = [...g.activities];
        const [moved] = newActivities.splice(draggedActivityInfo.index, 1);
        newActivities.splice(index, 0, moved);
        return { ...g, activities: newActivities };
      }
      return g;
    });
    setGoals(newGoals);
    setDraggedActivityInfo(null);
  };

  const handleSubDragStart = (goalId: string, activityId: string, index: number) => {
    setDraggedSubInfo({ goalId, activityId, index });
  };
  const handleSubDrop = (goalId: string, activityId: string, index: number) => {
    if (!draggedSubInfo || draggedSubInfo.goalId !== goalId || draggedSubInfo.activityId !== activityId || draggedSubInfo.index === index) {
      setDraggedSubInfo(null);
      return;
    }
    const newGoals = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          activities: g.activities.map(a => {
            if (a.id === activityId) {
              const newSubs = [...a.subActivities];
              const [moved] = newSubs.splice(draggedSubInfo.index, 1);
              newSubs.splice(index, 0, moved);
              return { ...a, subActivities: newSubs };
            }
            return a;
          })
        };
      }
      return g;
    });
    setGoals(newGoals);
    setDraggedSubInfo(null);
  };

  return (
    <div className="space-y-4">
      {goals.map((goal, goalIdx) => (
        <div 
          key={goal.id} 
          draggable 
          onDragStart={() => handleGoalDragStart(goalIdx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleGoalDrop(goalIdx)}
          className={`bg-white rounded-sm border-l-4 border-l-au-blue border border-slate-200 overflow-hidden shadow-sm transition-opacity ${draggedGoalIndex === goalIdx ? 'opacity-40 grayscale' : ''}`}
        >
          <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b border-slate-200 group">
            <div className="flex items-center gap-3 flex-grow">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => toggleGoalCollapse(goal.id)}
                  className="p-1 hover:bg-slate-200 rounded-sm text-slate-400 hover:text-au-blue transition-all"
                >
                  {collapsedGoals[goal.id] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-au-blue p-1">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 bg-au-blue rounded-sm flex items-center justify-center shadow-md relative shrink-0">
                  <Target className="w-4 h-4 text-white" />
                  <span className="absolute -top-1.5 -left-1.5 bg-slate-800 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {goalIdx + 1}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-grow ml-2">
                <span className="text-[11px] uppercase font-black tracking-widest text-au-blue shrink-0 whitespace-nowrap">Goal Objective</span>
                <input
                  type="text"
                  placeholder="Define Objective..."
                  data-focus-id={goal.id}
                  value={goal.name}
                  onChange={(e) => updateGoalName(goal.id, e.target.value)}
                  className="bg-transparent border-none focus:ring-0 font-extrabold text-lg w-full text-slate-800 p-0 placeholder:text-slate-300 leading-none"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Goal Total</p>
                <p className="font-mono text-lg font-black text-au-blue leading-none">₹{formatINR(calculateGoalTotal(goal))}</p>
              </div>
              <button onClick={() => removeGoal(goal.id)} className="text-slate-300 hover:text-red-600 transition-colors p-1.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!collapsedGoals[goal.id] && (
            <div className="p-3 space-y-4">
              {goal.activities.map((activity, actIdx) => (
                <div 
                  key={activity.id} 
                  draggable 
                  onDragStart={(e) => { e.stopPropagation(); handleActivityDragStart(goal.id, actIdx); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.stopPropagation(); handleActivityDrop(goal.id, actIdx); }}
                  className={`relative pl-6 transition-opacity ${draggedActivityInfo?.goalId === goal.id && draggedActivityInfo.index === actIdx ? 'opacity-30' : ''}`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 rounded-sm"></div>
                  
                  <div className="flex items-center justify-between mb-3 group/strategy relative">
                    <div className="flex items-center gap-3 flex-grow">
                      <div className="absolute left-[-22px] top-1 flex items-center">
                        <button 
                          onClick={() => toggleActivityCollapse(activity.id)}
                          className="p-1 hover:bg-slate-100 rounded-sm text-slate-300 hover:text-au-blue transition-all"
                        >
                          {collapsedActivities[activity.id] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="w-6 h-6 rounded-sm bg-au-blue-light flex items-center justify-center text-au-blue border border-au-blue/10 relative shrink-0">
                        <Briefcase className="w-3 h-3" />
                        <span className="absolute -top-1 -left-1 bg-slate-500 text-white text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center border-white border">
                          {String.fromCharCode(97 + actIdx)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-grow ml-1">
                        <span className="text-[11px] uppercase font-black text-slate-400 tracking-[0.12em] shrink-0 whitespace-nowrap">Strategy Cluster {goalIdx+1}.{String.fromCharCode(97 + actIdx).toUpperCase()}</span>
                        <input
                          type="text"
                          placeholder="Strategy Cluster..."
                          data-focus-id={activity.id}
                          value={activity.name}
                          onChange={(e) => updateActivityName(goal.id, activity.id, e.target.value)}
                          className="bg-transparent border-none focus:ring-0 font-bold text-lg text-slate-700 w-full p-0 leading-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Strategy Total</p>
                        <p className="font-mono text-sm font-black text-slate-600 leading-none">₹{formatINR(calculateActivityTotal(activity))}</p>
                      </div>
                      <button onClick={() => removeActivity(goal.id, activity.id)} className="text-slate-300 hover:text-red-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {!collapsedActivities[activity.id] && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                      <div className="overflow-x-auto custom-scrollbar rounded-sm border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left border-collapse min-w-[850px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-0.5 py-1 w-[25px] font-bold text-[11px] text-slate-500 border-r border-slate-200 text-center">S.No</th>
                              <th className="px-1 py-1 w-[120px] font-bold text-[12px] text-slate-600 border-r border-slate-200">Activity Head</th>
                              <th className="px-1 py-1 w-[90px] font-bold text-[12px] text-slate-600 border-r border-slate-200">Details</th>
                              <th className="px-1 py-1 w-[60px] font-bold text-[12px] text-slate-600 border-r border-slate-200">Remarks</th>
                              <th className="px-1 py-1 w-[70px] font-bold text-[12px] text-slate-600 border-r border-slate-200 leading-tight">VC Comments</th>
                              <th className="px-0.5 py-1 w-[35px] font-bold text-[12px] text-slate-600 border-r border-slate-200 text-center">Unit</th>
                              <th className="px-0 py-1 text-center text-[12px] font-bold text-au-blue bg-au-blue-light/20 border-r border-slate-200 w-[72px]">Q1</th>
                              <th className="px-0 py-1 text-center text-[12px] font-bold text-au-blue bg-au-blue-light/20 border-r border-slate-200 w-[72px]">Q2</th>
                              <th className="px-0 py-1 text-center text-[12px] font-bold text-au-blue bg-au-blue-light/20 border-r border-slate-200 w-[72px]">Q3</th>
                              <th className="px-0 py-1 text-center text-[12px] font-bold text-au-blue bg-au-blue-light/20 border-r border-slate-200 w-[72px]">Q4</th>
                              <th className="px-1 py-1 text-right w-[70px] font-extrabold text-[12px] text-au-blue bg-slate-50">Annual</th>
                              <th className="px-1 py-1 w-[80px] font-bold text-[12px] text-slate-600 border-x border-slate-200 leading-tight">Ledger</th>
                              <th className="px-0.5 py-1 w-[40px] font-bold text-[12px] text-slate-600 border-r border-slate-200 text-center">Code</th>
                              <th className="w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activity.subActivities.map((sub, subIdx) => (
                              <tr 
                                key={sub.id} 
                                draggable
                                onDragStart={(e) => { e.stopPropagation(); handleSubDragStart(goal.id, activity.id, subIdx); }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.stopPropagation(); handleSubDrop(goal.id, activity.id, subIdx); }}
                                className={`group hover:bg-au-blue-light/50 transition-all ${draggedSubInfo?.goalId === goal.id && draggedSubInfo?.activityId === activity.id && draggedSubInfo?.index === subIdx ? 'opacity-20 border-t-2 border-au-blue' : ''}`}
                              >
                                <td className="px-0.5 py-0.5 border-r border-slate-100 text-center">
                                  <div className="flex flex-col items-center">
                                    <div className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-au-blue transition-colors">
                                      <GripVertical className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 font-mono">{goalIdx+1}.{String.fromCharCode(97 + actIdx).toUpperCase()}.{subIdx + 1}</span>
                                  </div>
                                </td>
                                <td className="px-0.5 py-0.5 border-r border-slate-100">
                                  <textarea
                                    value={sub.name}
                                    placeholder="Activity..."
                                    data-focus-id={sub.id}
                                    onChange={(e) => updateSubField(goal.id, activity.id, sub.id, 'name', e.target.value)}
                                    className="w-full bg-slate-50 rounded-sm p-1 text-[11px] font-bold text-slate-900 resize-none h-[36px] custom-scrollbar border border-slate-100 focus:bg-white focus:border-au-blue leading-tight"
                                  />
                                </td>
                                <td className="px-0.5 py-0.5 border-r border-slate-100">
                                  <textarea
                                    value={sub.description}
                                    placeholder="..."
                                    onChange={(e) => updateSubField(goal.id, activity.id, sub.id, 'description', e.target.value)}
                                    className="w-full bg-slate-50 rounded-sm p-1 text-[10px] leading-tight text-slate-600 resize-none h-[36px] border border-slate-100 focus:bg-white focus:border-au-blue"
                                  />
                                </td>
                                <td className="px-0.5 py-0.5 border-r border-slate-100">
                                  <textarea
                                    value={sub.remarks}
                                    placeholder="..."
                                    onChange={(e) => updateSubField(goal.id, activity.id, sub.id, 'remarks', e.target.value)}
                                    className="w-full bg-slate-50 rounded-sm p-1 text-[10px] leading-tight text-slate-600 resize-none h-[36px] border border-slate-100 focus:bg-white focus:border-au-blue"
                                  />
                                </td>
                                <td className="px-0.5 py-0.5 border-r border-slate-100">
                                  <textarea
                                    value={sub.reviewComments}
                                    placeholder="..."
                                    onChange={(e) => updateSubField(goal.id, activity.id, sub.id, 'reviewComments', e.target.value)}
                                    className="w-full bg-slate-50 rounded-sm p-1 text-[10px] leading-tight text-slate-600 resize-none h-[36px] border border-slate-100 focus:bg-white focus:border-au-blue"
                                  />
                                </td>
                                <td className="px-0.5 py-0.5 border-r border-slate-100 text-center">
                                  <input
                                    type="text"
                                    value={sub.unit}
                                    placeholder="Unit"
                                    onChange={(e) => updateSubField(goal.id, activity.id, sub.id, 'unit', e.target.value)}
                                    className="w-full bg-slate-50 rounded-sm p-0.5 text-[11px] font-bold text-slate-600 h-[36px] text-center border border-slate-100 focus:bg-white"
                                  />
                                </td>
                                
                                <QuarterCompactInput goalId={goal.id} activityId={activity.id} subId={sub.id} qKey="q1" qData={sub.q1} accentColor="text-au-blue bg-au-blue-light/10" onUpdate={updateQuarterValue} />
                                <QuarterCompactInput goalId={goal.id} activityId={activity.id} subId={sub.id} qKey="q2" qData={sub.q2} accentColor="text-au-blue bg-au-blue-light/10" onUpdate={updateQuarterValue} />
                                <QuarterCompactInput goalId={goal.id} activityId={activity.id} subId={sub.id} qKey="q3" qData={sub.q3} accentColor="text-au-blue bg-au-blue-light/10" onUpdate={updateQuarterValue} />
                                <QuarterCompactInput goalId={goal.id} activityId={activity.id} subId={sub.id} qKey="q4" qData={sub.q4} accentColor="text-au-blue bg-au-blue-light/10" onUpdate={updateQuarterValue} />
                                
                                <td className="px-1 py-0.5 text-right font-black text-slate-900 bg-slate-50/50 font-mono text-[12px] border-l border-slate-100 leading-tight">
                                  ₹{formatINR(getSubTotal(sub))}
                                </td>

                                <td className="px-0.5 py-0.5 border-x border-slate-100 w-[80px]">
                                  <div className="h-[36px] flex items-center bg-slate-50 rounded-sm px-1 border border-slate-100 overflow-hidden">
                                    <select
                                      value={sub.ledgerName}
                                      onChange={(e) => updateSubField(goal.id, activity.id, sub.id, 'ledgerName', e.target.value)}
                                      className="w-full bg-transparent outline-none p-0 text-[10px] font-bold text-slate-700 h-full cursor-pointer leading-tight whitespace-normal break-words overflow-visible"
                                    >
                                      <option value="">Select</option>
                                      {LEDGER_LIST.map(l => (
                                        <option key={l.name} value={l.name}>{l.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td className="px-0.5 py-0.5 border-r border-slate-100 text-center">
                                  <span className="font-mono text-[9px] font-bold text-slate-500 bg-slate-100 px-0.5 py-1 rounded-sm block truncate">
                                    {sub.ledgerCode || '--'}
                                  </span>
                                </td>

                                <td className="px-0.5 py-0.5 text-center">
                                  <button onClick={() => removeSubActivity(goal.id, activity.id, sub.id)} className="text-slate-300 hover:text-red-600 transition-all p-1">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2.5">
                        <button
                          onClick={() => addSubActivity(goal.id, activity.id)}
                          className="flex items-center gap-1.5 text-[10px] font-black text-au-blue hover:text-white px-4 py-1.5 rounded-sm border border-au-blue hover:bg-au-blue transition-all uppercase tracking-widest bg-white shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          Add Head
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => addActivity(goal.id)}
                  className="w-full py-2.5 border border-dashed border-slate-300 rounded-sm text-slate-400 hover:text-au-blue hover:border-au-blue hover:bg-au-blue-light transition-all flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" />
                  Add Strategy Cluster
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {goals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-sm border border-slate-200 shadow-sm max-w-lg mx-auto flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
          <Target className="w-12 h-12 text-au-blue mb-6 opacity-20" />
          <h3 className="text-2xl font-black text-slate-900 mb-3">Initialize Budget Plan</h3>
          <p className="text-slate-400 mb-8 text-sm max-w-[300px]">Define a strategic goal to begin institutional planning.</p>
          <button onClick={addGoal} className="bg-au-blue text-white px-10 py-4 rounded-sm font-black text-sm hover:bg-au-blue-dark transition-all shadow-md active:scale-95 flex items-center gap-4">
            <Plus className="w-5 h-5" />
            New Strategic Goal
          </button>
        </div>
      ) : (
        <button
          onClick={addGoal}
          className="w-full py-8 border-2 border-dashed border-slate-300 rounded-sm text-slate-400 hover:text-au-blue hover:border-au-blue hover:bg-white transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <p className="text-base font-black uppercase tracking-[0.2em]">Add Strategic Goal</p>
        </button>
      )}
    </div>
  );
};

export default BudgetTable;
