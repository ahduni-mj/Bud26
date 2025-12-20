
import React, { useMemo } from 'react';
import { Goal, QuarterDetail } from '../types';
// Add missing import for LayoutDashboard icon
import { LayoutDashboard } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

interface Props {
  goals: Goal[];
}

// Brand palette for charts
const COLORS = ['#004b8d', '#003366', '#0066cc', '#3377aa', '#004488', '#225588'];
const getAmt = (q: QuarterDetail) => (q.rate || 0) * (q.quantity || 0);

const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
};

const Dashboard: React.FC<Props> = ({ goals }) => {
  const chartData = useMemo(() => {
    let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
    goals.forEach(g => {
      g.activities.forEach(a => {
        a.subActivities.forEach(s => {
          q1 += getAmt(s.q1);
          q2 += getAmt(s.q2);
          q3 += getAmt(s.q3);
          q4 += getAmt(s.q4);
        });
      });
    });
    return [
      { name: 'Q1', value: q1 },
      { name: 'Q2', value: q2 },
      { name: 'Q3', value: q3 },
      { name: 'Q4', value: q4 },
    ];
  }, [goals]);

  const goalData = useMemo(() => {
    return goals.map(g => {
      let total = 0;
      g.activities.forEach(a => {
        a.subActivities.forEach(s => {
          total += getAmt(s.q1) + getAmt(s.q2) + getAmt(s.q3) + getAmt(s.q4);
        });
      });
      return { name: g.name || 'Untitled Goal', value: total };
    }).filter(g => g.value > 0);
  }, [goals]);

  const totalAnnual = chartData.reduce((sum, q) => sum + q.value, 0);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-au-blue text-white p-10 rounded-sm shadow-md flex flex-col justify-center">
          <p className="text-[11px] text-au-blue-light uppercase font-extrabold tracking-[0.2em] mb-3">Institutional Allotment</p>
          <p className="text-3xl font-extrabold font-mono tracking-tighter">₹{formatINR(totalAnnual)}</p>
        </div>
        {chartData.map((q, idx) => (
          <div key={q.name} className="bg-white p-8 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-center group hover:border-au-blue transition-all">
            <p className="text-[11px] text-slate-500 uppercase font-extrabold tracking-widest mb-3 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-au-blue"></span>
              {q.name} Allotment
            </p>
            <p className="text-2xl font-extrabold text-slate-800 font-mono tracking-tight group-hover:text-au-blue">₹{formatINR(q.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-sm border border-slate-200 shadow-sm">
          <h3 className="text-xl font-extrabold text-au-blue mb-10 flex items-center gap-4">
            <span className="w-1.5 h-8 bg-au-blue rounded-full"></span>
            Fiscal Disbursement Phasing
          </h3>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: '800', fill: '#004b8d' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value: number) => [`₹${formatINR(value)}`, 'Planned Allocation']}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={90}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#004b8d" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-sm border border-slate-200 shadow-sm">
          <h3 className="text-xl font-extrabold text-au-blue mb-10 flex items-center gap-4">
            <span className="w-1.5 h-8 bg-slate-800 rounded-full"></span>
            Objective Fiscal Distribution
          </h3>
          <div className="h-96 w-full">
            {goalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalData}
                    cx="50%"
                    cy="45%"
                    innerRadius={80}
                    outerRadius={125}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {goalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${formatINR(value)}`, 'Value']} />
                  <Legend verticalAlign="bottom" align="center" iconType="square" wrapperStyle={{ paddingTop: '30px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 italic gap-6">
                <div className="w-24 h-24 bg-slate-50 rounded-sm flex items-center justify-center border border-slate-100">
                   <LayoutDashboard className="w-12 h-12 opacity-10 text-au-blue" />
                </div>
                Enter fiscal data to visualize distribution.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
