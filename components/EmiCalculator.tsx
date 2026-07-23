import React, { useState, useEffect } from 'react';
import { ArrowLeft, Landmark, DollarSign, Calendar, Percent, Printer, FileText } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';

interface AmortizationYearly {
  year: number;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  remainingBalance: number;
  months: {
    monthNumber: number;
    emi: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
  }[];
}

export const EmiCalculator: React.FC = () => {
  const { navigate } = useNavigation();

  // Inputs
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenure, setTenure] = useState<number>(5); // In years by default
  const [tenureType, setTenureType] = useState<'years' | 'months'>('years');

  // Outputs
  const [monthlyEmi, setMonthlyEmi] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [schedule, setSchedule] = useState<AmortizationYearly[]>([]);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // Recalculate everything when inputs change
  useEffect(() => {
    const P = loanAmount;
    const annualR = interestRate;
    const n = tenureType === 'years' ? tenure * 12 : tenure;

    if (P <= 0 || annualR <= 0 || n <= 0) {
      setMonthlyEmi(0);
      setTotalInterest(0);
      setTotalPayment(0);
      setSchedule([]);
      return;
    }

    const r = annualR / 12 / 100;
    
    // EMI Formula: [P * r * (1+r)^n] / [(1+r)^n - 1]
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPay = emi * n;
    const totalInt = totalPay - P;

    setMonthlyEmi(Math.round(emi));
    setTotalPayment(Math.round(totalPay));
    setTotalInterest(Math.round(totalInt));

    // Amortization Schedule Computation
    let balance = P;
    const yearlySchedule: AmortizationYearly[] = [];
    let currentYearSchedule: AmortizationYearly | null = null;

    for (let m = 1; m <= n; m++) {
      const monthInterest = balance * r;
      const monthPrincipal = emi - monthInterest;
      balance = Math.max(0, balance - monthPrincipal);

      const yearNumber = Math.ceil(m / 12);
      
      if (!currentYearSchedule || currentYearSchedule.year !== yearNumber) {
        if (currentYearSchedule) {
          yearlySchedule.push(currentYearSchedule);
        }
        currentYearSchedule = {
          year: yearNumber,
          principalPaid: 0,
          interestPaid: 0,
          totalPaid: 0,
          remainingBalance: balance,
          months: []
        };
      }

      currentYearSchedule.principalPaid += monthPrincipal;
      currentYearSchedule.interestPaid += monthInterest;
      currentYearSchedule.totalPaid += emi;
      currentYearSchedule.remainingBalance = balance;
      currentYearSchedule.months.push({
        monthNumber: m,
        emi: Math.round(emi),
        principalPaid: Math.round(monthPrincipal),
        interestPaid: Math.round(monthInterest),
        remainingBalance: Math.round(balance)
      });

      if (m === n) {
        yearlySchedule.push(currentYearSchedule);
      }
    }

    // Clean up decimal additions
    yearlySchedule.forEach(yr => {
      yr.principalPaid = Math.round(yr.principalPaid);
      yr.interestPaid = Math.round(yr.interestPaid);
      yr.totalPaid = Math.round(yr.totalPaid);
      yr.remainingBalance = Math.round(yr.remainingBalance);
    });

    setSchedule(yearlySchedule);
  }, [loanAmount, interestRate, tenure, tenureType]);

  // Format currency
  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0
    }).format(val).replace('NPR', 'रू');
  };

  const interestRatio = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;
  const principalRatio = totalPayment > 0 ? (loanAmount / totalPayment) * 100 : 100;

  // Donut SVG circumference math (Radius R=40, Circumference = 251.3)
  const strokeCircumference = 251.3;
  const interestStrokeOffset = strokeCircumference - (interestRatio / 100) * strokeCircumference;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300 print:text-black">
      
      {/* Top Hero Header */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-20 pb-8 md:pt-24 md:pb-12 print:hidden">
        <div className="w-full px-4 md:px-8 mx-auto">
          <div className="flex flex-col items-start gap-4">
            <button 
              onClick={() => navigate('services')}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={13} />
              Back to Services
            </button>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                Interactive EMI & Loan Calculator
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed max-w-3xl">
                Plan your finances. Drag sliders to adjust principal, interest, and tenure. Instantly see monthly payments, interest totals, and full amortization charts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full px-4 md:px-8 py-8 print:py-0">
        
        {/* Top dashboard summary for Printing */}
        <div className="hidden print:block mb-8 text-center border-b pb-6">
          <h1 className="text-2xl font-bold">Loan Amortization Report</h1>
          <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="border p-3 rounded">
              <div className="text-xs text-slate-500 uppercase font-bold">Principal Loan Amount</div>
              <div className="text-lg font-bold">{formatCurrency(loanAmount)}</div>
            </div>
            <div className="border p-3 rounded">
              <div className="text-xs text-slate-500 uppercase font-bold">Annual Interest Rate</div>
              <div className="text-lg font-bold">{interestRate}%</div>
            </div>
            <div className="border p-3 rounded">
              <div className="text-xs text-slate-500 uppercase font-bold">Loan Tenure</div>
              <div className="text-lg font-bold">{tenure} {tenureType}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* Inputs Section (5 Columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm print:hidden">
            
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Landmark size={18} className="text-[#e52521]" />
                Loan Parameters
              </h2>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                <button
                  onClick={() => { setTenureType('years'); if (tenure > 30) setTenure(5); }}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-colors ${
                    tenureType === 'years'
                      ? 'bg-white dark:bg-slate-950 text-[#e52521] dark:text-[#d01f1c] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
                  }`}
                >
                  Years
                </button>
                <button
                  onClick={() => { setTenureType('months'); setTenure(Math.min(360, tenure * 12)); }}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-colors ${
                    tenureType === 'months'
                      ? 'bg-white dark:bg-slate-950 text-[#e52521] dark:text-[#d01f1c] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
                  }`}
                >
                  Months
                </button>
              </div>
            </div>

            {/* Slider 1: Loan Amount */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Loan Amount (रू)</span>
                <span className="text-[#e52521] dark:text-[#d01f1c]">{formatCurrency(loanAmount)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="50000000"
                step="10000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                className="w-full accent-[#e52521] dark:accent-red-500 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center overflow-hidden">
                <span className="pl-3.5 text-slate-400"><DollarSign size={14} /></span>
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-transparent border-0 outline-none px-2 py-2 text-xs font-bold placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Slider 2: Interest Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Interest Rate (%)</span>
                <span className="text-[#e52521] dark:text-[#d01f1c]">{interestRate}% p.a.</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.05"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full accent-[#e52521] dark:accent-red-500 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center overflow-hidden">
                <span className="pl-3.5 text-slate-400"><Percent size={14} /></span>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent border-0 outline-none px-2 py-2 text-xs font-bold placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Slider 3: Loan Tenure */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Tenure ({tenureType})</span>
                <span className="text-[#e52521] dark:text-[#d01f1c]">
                  {tenure} {tenureType === 'years' ? (tenure === 1 ? 'Year' : 'Years') : (tenure === 1 ? 'Month' : 'Months')}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={tenureType === 'years' ? 30 : 360}
                value={tenure}
                onChange={(e) => setTenure(parseInt(e.target.value))}
                className="w-full accent-[#e52521] dark:accent-red-500 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center overflow-hidden">
                <span className="pl-3.5 text-slate-400"><Calendar size={14} /></span>
                <input
                  type="number"
                  min="1"
                  max={tenureType === 'years' ? 40 : 480}
                  value={tenure}
                  onChange={(e) => setTenure(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-transparent border-0 outline-none px-2 py-2 text-xs font-bold placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Section (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visual Dashboard Grid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Calculations Block (7 Cols) */}
              <div className="md:col-span-7 space-y-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  Loan Summary Breakdown
                </h3>
                
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monthly Installment (EMI)</div>
                  <div className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white">
                    {formatCurrency(monthlyEmi)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-[#e52521] shrink-0 inline-block" />
                      Principal Amount
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(loanAmount)}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0 inline-block" />
                      Total Interest
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(totalInterest)}
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Amount Payable</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-slate-200">
                    {formatCurrency(totalPayment)}
                  </div>
                </div>
              </div>

              {/* Native SVG Donut Chart Block (5 Cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-2">
                <div className="relative w-36 h-36">
                  {/* SVG Donut Circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle (Principal - Blue) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-[#e52521] dark:text-[#e52521]"
                      strokeWidth="11"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Foreground Circle (Interest - Amber) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-amber-500"
                      strokeWidth="11"
                      stroke="currentColor"
                      fill="transparent"
                      strokeDasharray={strokeCircumference}
                      strokeDashoffset={interestStrokeOffset}
                    />
                  </svg>
                  
                  {/* Internal text metrics */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wide">Interest</span>
                    <span className="text-sm font-extrabold text-amber-500">{interestRatio.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#e52521]" />Principal</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" />Interest</span>
                </div>
              </div>

            </div>

            {/* Print/Export Bar */}
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Amortization Ledger</h3>
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#d01f1c] dark:hover:text-[#d01f1c] transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer"
              >
                <Printer size={14} />
                Print Statement
              </button>
            </div>

            {/* Amortization Ledger Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-5">Timeline</th>
                      <th className="py-3.5 px-4 text-right">Principal (रू)</th>
                      <th className="py-3.5 px-4 text-right">Interest (रू)</th>
                      <th className="py-3.5 px-4 text-right">Total Payment (रू)</th>
                      <th className="py-3.5 px-5 text-right">Remaining Balance (रू)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {schedule.map((yr) => (
                      <React.Fragment key={yr.year}>
                        
                        {/* Yearly Summarized Row */}
                        <tr 
                          onClick={() => setExpandedYear(expandedYear === yr.year ? null : yr.year)}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors cursor-pointer select-none font-semibold text-slate-900 dark:text-slate-250 group print:bg-slate-50"
                        >
                          <td className="py-4 px-5 flex items-center gap-2">
                            <span className="text-slate-400 dark:text-slate-500 group-hover:text-[#e52521] font-bold">
                              {expandedYear === yr.year ? '▼' : '▶'}
                            </span>
                            Year {yr.year}
                          </td>
                          <td className="py-4 px-4 text-right">{formatCurrency(yr.principalPaid)}</td>
                          <td className="py-4 px-4 text-right text-amber-600 dark:text-amber-500/90">{formatCurrency(yr.interestPaid)}</td>
                          <td className="py-4 px-4 text-right">{formatCurrency(yr.totalPaid)}</td>
                          <td className="py-4 px-5 text-right font-extrabold text-slate-950 dark:text-white">{formatCurrency(yr.remainingBalance)}</td>
                        </tr>

                        {/* Expanded Monthly Rows */}
                        {expandedYear === yr.year && yr.months.map((m) => (
                          <tr key={m.monthNumber} className="bg-slate-50/20 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-[11px] print:hidden">
                            <td className="py-2.5 pl-9 pr-4 text-slate-400 font-medium">Month {m.monthNumber}</td>
                            <td className="py-2.5 px-4 text-right">{formatCurrency(m.principalPaid)}</td>
                            <td className="py-2.5 px-4 text-right">{formatCurrency(m.interestPaid)}</td>
                            <td className="py-2.5 px-4 text-right">{formatCurrency(m.emi)}</td>
                            <td className="py-2.5 pr-9 pl-4 text-right font-bold text-slate-700 dark:text-slate-300">{formatCurrency(m.remainingBalance)}</td>
                          </tr>
                        ))}

                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Disclaimer */}
            <div className="hidden print:block text-center mt-12 text-[10px] text-slate-400 border-t pt-4">
              This loan amortization calculation is based on standard banking amortization formulas. Interest is compounded monthly.
            </div>

          </div>

        </div>

      </div>

      <SeoGuideSection toolId="emi-calculator" />

    </div>
  );
};

export default EmiCalculator;
