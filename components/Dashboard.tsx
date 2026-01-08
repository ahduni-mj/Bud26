
import React, { useMemo } from 'react';
import { Goal, QuarterDetail, Activity, SubActivity } from '../types';
import { LayoutDashboard, TrendingUp, Target, Briefcase, ListChecks, PieChart as PieChartIcon, Table as TableIcon, Layers } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line
} from 'recharts';

interface Props {
  goals: Goal[];
}

// Ahmedabad University refined palette
const BRAND_COLORS = [
  '#004b8d', // AU Blue
  '#0066cc', // Royal Blue
  '#4a90e2', // Sky Blue
  '#74b9ff', // Light Blue
  '#0984e3', // Vivid Blue
  '#002d5a'  // Deep Navy
];

const getAmt = (q: QuarterDetail) => (q.rate || 0) * (q.quantity || 0);

const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
};

const toLakhs = (val: number) => (val / 100000).toFixed(2);

const Dashboard: React.FC<Props> = ({ goals }) => {
  // 1. Aggregates
  const stats = useMemo(() => {
    let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
    let strategyCount = 0;
    let headCount = 0;

    goals.forEach(g => {
      strategyCount += g.activities.length;
      g.activities.forEach(a => {
        headCount += a.subActivities.length;
        a.subActivities.forEach(s => {
          q1 += getAmt(s.q1);
          q2 += getAmt(s.q2);
          q3 += getAmt(s.q3);
          q4 += getAmt(s.q4);
        });
      });
    });

    return {
      q1, q2, q3, q4,
      total: q1 + q2 + q3 + q4,
      goalCount: goals.length,
      strategyCount,
      headCount
    };
  }, [goals]);

  // 2. Ledger Aggregation
  const topLedgers = useMemo(() => {
    const ledgerMap: Record<string, { name: string; code: string; total: number }> = {};
    
    goals.forEach(g => {
      g.activities.forEach(a => {
        a.subActivities.forEach(s => {
          if (s.ledgerName) {
            const total = getAmt(s.q1) + getAmt(s.q2) + getAmt(s.q3) + getAmt(s.q4);
            if (ledgerMap[s.ledgerName]) {
              ledgerMap[s.ledgerName].total += total;
            } else {
              ledgerMap[s.ledgerName] = {
                name: s.ledgerName,
                code: s.ledgerCode || 'N/A',
                total: total
              };
            }
          }
        });
      });
    });

    return Object.values(ledgerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [goals]);

  const primaryLedger = topLedgers[0] || null;
  const ledgerImpactPercent = useMemo(() => {
    if (!primaryLedger || stats.total === 0) return 0;
    return (primaryLedger.total / stats.total) * 100;
  }, [primaryLedger, stats.total]);

  // 3. Data for Charts
  const quarterlyData = [
    { name: 'Q1', value: stats.q1, display: `₹${toLakhs(stats.q1)}L` },
    { name: 'Q2', value: stats.q2, display: `₹${toLakhs(stats.q2)}L` },
    { name: 'Q3', value: stats.q3, display: `₹${toLakhs(stats.q3)}L` },
    { name: 'Q4', value: stats.q4, display: `₹${toLakhs(stats.q4)}L` },
  ];

  const goalDistribution = useMemo(() => {
    return goals.map(g => {
      let total = 0;
      g.activities.forEach(a => {
        a.subActivities.forEach(s => {
          total += getAmt(s.q1) + getAmt(s.q2) + getAmt(s.q3) + getAmt(s.q4);
        });
      });
      return { name: g.name || 'Untitled Goal', value: total };
    }).filter(g => g.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [goals]);

  const topStrategies = useMemo(() => {
    const list: { name: string; value: number }[] = [];
    goals.forEach(g => {
      g.activities.forEach(a => {
        let total = a.subActivities.reduce((sum, s) => sum + getAmt(s.q1) + getAmt(s.q2) + getAmt(s.q3) + getAmt(s.q4), 0);
        list.push({ name: a.name || 'Untitled Strategy', value: total });
      });
    });
    return list.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [goals]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main University Allotment Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-au-blue to-au-blue-dark text-white p-6 rounded-xl shadow-lg border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-au-blue-light/80 uppercase font-black tracking-[0.2em] mb-1">University Total Allotment</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono tracking-tighter">₹{formatINR(stats.total)}</span>
              <span className="text-au-blue-light font-bold text-sm uppercase">INR</span>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                <p className="text-[9px] uppercase font-bold text-white/60 leading-none mb-1">Total Goals</p>
                <p className="text-xl font-black leading-none">{stats.goalCount}</p>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                <p className="text-[9px] uppercase font-bold text-white/60 leading-none mb-1">Strategies</p>
                <p className="text-xl font-black leading-none">{stats.strategyCount}</p>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                <p className="text-[9px] uppercase font-bold text-white/60 leading-none mb-1">Line Items</p>
                <p className="text-xl font-black leading-none">{stats.headCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Expenditure Head Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-au-blue transition-all">
          <div className="absolute top-2 right-2 p-2 text-au-blue/10 dark:text-au-blue-light/5 group-hover:text-au-blue/20 transition-colors">
            <Layers className="w-12 h-12" />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Primary Expenditure Head</p>
          <p className="text-lg font-black text-slate-800 dark:text-slate-100 truncate leading-tight mb-1" title={primaryLedger?.name || 'N/A'}>
            {primaryLedger ? primaryLedger.name : 'No Data'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-au-blue-light dark:bg-au-blue/20 text-au-blue dark:text-au-blue-light text-[9px] font-black uppercase">
              {ledgerImpactPercent.toFixed(1)}% of Budget
            </span>
          </div>
        </div>

        {/* Heaviest Quarter Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-au-blue transition-all">
          <div className="absolute top-2 right-2 p-2 text-au-blue/10 dark:text-au-blue-light/5 group-hover:text-au-blue/20 transition-colors">
            <Briefcase className="w-12 h-12" />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Heaviest Quarter</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight leading-none uppercase">
            {stats.total > 0 ? (['Q1', 'Q2', 'Q3', 'Q4'].reduce((a, b, i, arr) => {
              const vals = [stats.q1, stats.q2, stats.q3, stats.q4];
              return vals[i] > vals[arr.indexOf(a)] ? b : a;
            }, 'Q1')) : 'N/A'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-au-blue"></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Peak Fiscal Demand</span>
          </div>
        </div>
      </div>

      {/* Main Charting Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fiscal Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-3">
              <div className="w-2 h-6 bg-au-blue rounded-full"></div>
              University Fiscal Phasing
            </h3>
            <div className="flex gap-2">
              {['Q1','Q2','Q3','Q4'].map((q, i) => (
                <div key={q} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }}></div>
                  <span className="text-[9px] font-black text-slate-500">{q}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quarterlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004b8d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#004b8d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: '800', fill: '#004b8d' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                  tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`}
                />
                <Tooltip 
                  cursor={{ stroke: '#004b8d', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl">
                          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">{payload[0].payload.name} Allotment</p>
                          <p className="text-lg font-black text-au-blue dark:text-au-blue-light">₹{formatINR(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#004b8d" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goal Distribution (Donut) */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-8 flex items-center gap-3">
            <PieChartIcon className="w-5 h-5 text-au-blue" />
            Strategic Goals
          </h3>
          <div className="h-80 w-full relative">
            {goalDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {goalDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₹${toLakhs(value)}L`, 'Allotment']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 italic gap-4">
                 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <ListChecks className="w-8 h-8 opacity-20 text-au-blue" />
                 </div>
                 <p className="text-xs uppercase font-black tracking-widest text-slate-300">No Goals to display</p>
              </div>
            )}
            {goalDistribution.length > 0 && (
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Total Allotted</p>
                <p className="text-xl font-black text-au-blue dark:text-au-blue-light font-mono">₹{toLakhs(stats.total)}L</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Expenditure Strategies */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
           <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-6 flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-au-blue" />
            Top Expenditure Strategies
          </h3>
          <div className="h-64 w-full">
            {topStrategies.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topStrategies} margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value: number) => [`₹${toLakhs(value)}L`, 'Total Allotment']} />
                  <Bar dataKey="value" fill="#004b8d" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-xs font-bold uppercase tracking-widest italic">Data insufficient</div>
            )}
          </div>
        </div>

        {/* University Budget Summary Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
           <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-4 flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-au-blue" />
            Budgetary Summary
          </h3>
          
          <div className="flex-grow">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-3">Top 5 Ledger Allotments</p>
            <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 mb-6">
              <table className="w-full text-left text-[11px] font-bold border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <th className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 font-black">Ledger</th>
                    <th className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 font-black text-center">Code</th>
                    <th className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 font-black text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {topLedgers.length > 0 ? topLedgers.map((l, i) => (
                    <tr key={l.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={l.name}>{l.name}</td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono text-center">{l.code}</td>
                      <td className="px-3 py-2.5 text-right text-au-blue dark:text-au-blue-light font-black font-mono">₹{toLakhs(l.total)}L</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-slate-300 uppercase tracking-widest italic">No ledger data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-lg bg-au-blue/5 dark:bg-au-blue-light/5 border border-au-blue/10 dark:border-au-blue-light/10">
              <p className="text-[10px] font-black text-au-blue dark:text-au-blue-light uppercase tracking-widest mb-2">University Recommendation</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                Focus on {primaryLedger?.name ? `optimizing ${primaryLedger.name}` : 'strategic resource allocation'} as it constitutes a significant portion of the current fiscal sheet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
