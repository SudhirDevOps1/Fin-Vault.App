import { useState, useMemo } from 'react';
import { Calculator, IndianRupee, Calendar, Percent, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function EMICalculator() {
  const [principal, setPrincipal] = useState('1000000');
  const [rate, setRate] = useState('8.5');
  const [tenure, setTenure] = useState('20');
  const [tenureType, setTenureType] = useState<'years' | 'months'>('years');

  const result = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const R = (parseFloat(rate) || 0) / 12 / 100;
    const N = tenureType === 'years' ? (parseInt(tenure) || 0) * 12 : (parseInt(tenure) || 0);

    if (P <= 0 || R <= 0 || N <= 0) return null;

    const emi = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1);
    const totalPayment = emi * N;
    const totalInterest = totalPayment - P;
    const interestPercent = (totalInterest / totalPayment) * 100;

    // Amortization schedule (yearly)
    const schedule: { year: number; principal: number; interest: number; balance: number }[] = [];
    let balance = P;
    const years = Math.ceil(N / 12);
    for (let y = 1; y <= years; y++) {
      let yearPrincipal = 0;
      let yearInterest = 0;
      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break;
        const interestPart = balance * R;
        const principalPart = Math.min(emi - interestPart, balance);
        yearPrincipal += principalPart;
        yearInterest += interestPart;
        balance -= principalPart;
      }
      schedule.push({
        year: y,
        principal: Math.round(yearPrincipal),
        interest: Math.round(yearInterest),
        balance: Math.max(0, Math.round(balance)),
      });
    }

    return { emi, totalPayment, totalInterest, interestPercent, N, schedule };
  }, [principal, rate, tenure, tenureType]);

  const pieData = result ? [
    { name: 'Principal', value: parseFloat(principal) || 0, color: '#6366f1' },
    { name: 'Interest', value: Math.round(result.totalInterest), color: '#ef4444' },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-200 dark:border-violet-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">EMI Calculator</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Home / Car / Personal loan EMI</p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-2">
            <IndianRupee className="w-4 h-4" /> Loan Amount (₹)
          </label>
          <input
            type="number"
            value={principal}
            onChange={e => setPrincipal(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none text-lg font-bold"
          />
          <input
            type="range"
            min="100000"
            max="50000000"
            step="100000"
            value={principal}
            onChange={e => setPrincipal(e.target.value)}
            className="w-full mt-2 accent-violet-600"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>₹1L</span><span>₹5Cr</span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-2">
            <Percent className="w-4 h-4" /> Interest Rate (% p.a.)
          </label>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={e => setRate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none text-lg font-bold"
          />
          <input
            type="range" min="1" max="30" step="0.1" value={rate}
            onChange={e => setRate(e.target.value)}
            className="w-full mt-2 accent-violet-600"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>1%</span><span>30%</span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-2">
            <Calendar className="w-4 h-4" /> Loan Tenure
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={tenure}
              onChange={e => setTenure(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none text-lg font-bold"
            />
            <div className="flex rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden">
              <button
                onClick={() => setTenureType('years')}
                className={`px-4 py-2 text-sm font-medium ${tenureType === 'years' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-zinc-800'}`}
              >Yr</button>
              <button
                onClick={() => setTenureType('months')}
                className={`px-4 py-2 text-sm font-medium ${tenureType === 'months' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-zinc-800'}`}
              >Mo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative">
              <p className="text-sm opacity-90 mb-1">Monthly EMI</p>
              <p className="text-4xl font-black tracking-tight">₹{Math.round(result.emi).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 text-center">
              <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">Principal</p>
              <p className="text-lg font-bold text-violet-700 dark:text-violet-400">₹{(parseFloat(principal) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-center">
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">Interest</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">₹{Math.round(result.totalInterest).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-center">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Total</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">₹{Math.round(result.totalPayment).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h4 className="text-sm font-bold mb-3">Principal vs Interest</h4>
            <div className="grid grid-cols-2 items-center">
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
                  <span>Principal ({(100 - result.interestPercent).toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <span>Interest ({result.interestPercent.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amortization */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Yearly Amortization (first {Math.min(result.schedule.length, 10)} years)
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.schedule.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={v => `Y${v}`} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Bar dataKey="principal" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} name="Principal" />
                  <Bar dataKey="interest" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Interest" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Amortization Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Year</th>
                    <th className="px-3 py-2 text-right">Principal</th>
                    <th className="px-3 py-2 text-right">Interest</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map(row => (
                    <tr key={row.year} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-3 py-2 font-medium">{row.year}</td>
                      <td className="px-3 py-2 text-right text-violet-600 font-mono">₹{row.principal.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right text-red-600 font-mono">₹{row.interest.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-mono">₹{row.balance.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
