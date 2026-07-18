import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, AlertCircle, ArrowRightLeft, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';

const ALL_CURRENCIES = [
  { code: 'NPR', name: 'Nepali Rupee',       flag: '🇳🇵' },
  { code: 'INR', name: 'Indian Rupee',        flag: '🇮🇳' },
  { code: 'PKR', name: 'Pakistani Rupee',     flag: '🇵🇰' },
  { code: 'LKR', name: 'Sri Lankan Rupee',   flag: '🇱🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka',   flag: '🇧🇩' },
  { code: 'IDR', name: 'Indonesian Rupiah',  flag: '🇮🇩' },
  { code: 'MUR', name: 'Mauritian Rupee',    flag: '🇲🇺' },
  { code: 'SCR', name: 'Seychellois Rupee',  flag: '🇸🇨' },
  { code: 'EUR', name: 'Euro',               flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',      flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar',    flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar',  flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen',       flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan',       flag: '🇨🇳' },
  { code: 'AED', name: 'UAE Dirham',         flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal',        flag: '🇸🇦' },
  { code: 'MYR', name: 'Malaysian Ringgit',  flag: '🇲🇾' },
  { code: 'SGD', name: 'Singapore Dollar',   flag: '🇸🇬' },
  { code: 'KRW', name: 'South Korean Won',   flag: '🇰🇷' },
  { code: 'THB', name: 'Thai Baht',          flag: '🇹🇭' },
  { code: 'QAR', name: 'Qatari Riyal',       flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar',      flag: '🇰🇼' },
];

const BASE_CURRENCY = { code: 'USD', name: 'US Dollar', flag: '🇺🇸' };
const ALL_OPTIONS = [BASE_CURRENCY, ...ALL_CURRENCIES];

type Range = '1mo' | '3mo' | '6mo' | '1y';
const RANGES: { label: string; value: Range }[] = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
];

interface ChartPoint { date: string; close: number; }
interface Rates { [code: string]: number; }

// Pure SVG line chart component — no external library
const LineChart: React.FC<{ points: ChartPoint[]; isUp: boolean }> = ({ points, isUp }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ChartPoint } | null>(null);

  if (!points.length) return null;

  const W = 600;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 54 };

  const minV = Math.min(...points.map(p => p.close));
  const maxV = Math.max(...points.map(p => p.close));
  const rangeV = maxV - minV || 1;

  const xScale = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const yScale = (v: number) => PAD.top + (1 - (v - minV) / rangeV) * (H - PAD.top - PAD.bottom);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.close).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${xScale(points.length - 1).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${xScale(0).toFixed(1)},${(H - PAD.bottom).toFixed(1)} Z`;

  const color = isUp ? '#16a34a' : '#dc2626';
  const gradId = `grad-${isUp ? 'up' : 'down'}`;

  // Y-axis labels
  const yTicks = [minV, minV + rangeV * 0.25, minV + rangeV * 0.5, minV + rangeV * 0.75, maxV];

  // X-axis date labels (first, middle, last)
  const xLabelIdxs = [0, Math.floor(points.length / 2), points.length - 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const chartW = W - PAD.left - PAD.right;
    const idx = Math.round(((svgX - PAD.left) / chartW) * (points.length - 1));
    const clamped = Math.max(0, Math.min(points.length - 1, idx));
    const pt = points[clamped];
    setTooltip({ x: xScale(clamped), y: yScale(pt.close), point: pt });
  };

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={PAD.left} y1={yScale(tick).toFixed(1)}
            x2={W - PAD.right} y2={yScale(tick).toFixed(1)}
            stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradId})`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={PAD.left - 6} y={yScale(tick)}
            textAnchor="end" dominantBaseline="middle"
            fontSize="10" fill="currentColor" opacity="0.45"
          >
            {tick < 10 ? tick.toFixed(4) : tick.toFixed(2)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabelIdxs.map(idx => (
          <text
            key={idx}
            x={xScale(idx)} y={H - 6}
            textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.4"
          >
            {points[idx]?.date?.slice(5) /* MM-DD */}
          </text>
        ))}

        {/* Tooltip crosshair */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x} y1={PAD.top}
              x2={tooltip.x} y2={H - PAD.bottom}
              stroke={color} strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} stroke="white" strokeWidth="1.5" />
          </>
        )}
      </svg>

      {/* Tooltip bubble */}
      {tooltip && (
        <div
          className="pointer-events-none absolute bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-md z-10"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          <p className="font-bold text-slate-800 dark:text-slate-100">{tooltip.point.close.toFixed(4)}</p>
          <p className="text-slate-400">{tooltip.point.date}</p>
        </div>
      )}
    </div>
  );
};

export const CurrencyConverter: React.FC = () => {
  const { navigate } = useNavigation();

  // Live rates
  const [rates, setRates] = useState<Rates | null>(null);
  const [marketTime, setMarketTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Converter
  const [amount, setAmount] = useState('1');
  const [fromCode, setFromCode] = useState('USD');
  const [toCode, setToCode] = useState('NPR');

  // Chart
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [chartRange, setChartRange] = useState<Range>('1mo');
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Fetch live rates
  const fetchRates = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true); else setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/currency-rates');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load rates.');
      setRates({ ...data.rates, USD: 1 });
      setMarketTime(data.marketTime);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rates.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch historical chart data
  const fetchChart = useCallback(async (from: string, to: string, range: Range) => {
    setChartLoading(true);
    setChartError(null);
    try {
      // Build Yahoo Finance symbol: if from=USD just use USDNPR=X; else NPRUSD=X etc
      let symbol: string;
      if (from === 'USD') {
        symbol = `USD${to}=X`;
      } else if (to === 'USD') {
        symbol = `${from}USD=X`;
      } else {
        // Cross pair: route through USD
        symbol = `${from}${to}=X`;
      }
      const res = await fetch(`/api/currency-history?symbol=${encodeURIComponent(symbol)}&range=${range}`);
      if (!res.ok) throw new Error(`History server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No historical data available for this pair.');
      setChartPoints(data.points);
    } catch (err: any) {
      setChartError(err.message || 'Could not load historical data.');
      setChartPoints([]);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  useEffect(() => {
    fetchChart(fromCode, toCode, chartRange);
  }, [fromCode, toCode, chartRange, fetchChart]);

  // Conversion
  const convertedValue = (): string => {
    if (!rates) return '—';
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return '—';
    const fromRate = rates[fromCode];
    const toRate = rates[toCode];
    if (!fromRate || !toRate) return '—';
    const result = (num / fromRate) * toRate;
    if (result === 0) return '0';
    if (result < 0.001) return result.toFixed(8);
    if (result < 1) return result.toFixed(6);
    if (result < 100) return result.toFixed(4);
    return result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const unitRate = (): string => {
    if (!rates) return '';
    const fromRate = rates[fromCode];
    const toRate = rates[toCode];
    if (!fromRate || !toRate) return '';
    const r = toRate / fromRate;
    if (r < 0.001) return r.toFixed(8);
    if (r < 1) return r.toFixed(6);
    if (r < 100) return r.toFixed(4);
    return r.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSwap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const formatMarketTime = (ts: number) => {
    try {
      return new Date(ts * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      });
    } catch { return ''; }
  };

  // Chart trend
  const isUp = chartPoints.length >= 2 && chartPoints[chartPoints.length - 1].close >= chartPoints[0].close;
  const pctChange = chartPoints.length >= 2
    ? ((chartPoints[chartPoints.length - 1].close - chartPoints[0].close) / chartPoints[0].close) * 100
    : null;

  const fromCurrency = ALL_OPTIONS.find(c => c.code === fromCode) || BASE_CURRENCY;
  const toCurrency = ALL_OPTIONS.find(c => c.code === toCode) || ALL_CURRENCIES[0];

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Header */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 pt-24 pb-8 md:pt-32 md:pb-12">
        <div className="w-full px-4 md:px-8 mx-auto">
          <div className="flex flex-col items-start gap-4">
            <button
              onClick={() => navigate('services')}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
            >
              &larr; Back to Services
            </button>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                Currency Converter
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed mt-2">
                Live exchange rates from Yahoo Finance — same source as Google Finance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: converter + chart side by side */}
      <div className="w-full px-4 md:px-8 py-8">

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Could not load exchange rates</p>
              <p className="font-normal mt-0.5">{error}</p>
              <button onClick={() => fetchRates(true)} className="mt-2 text-xs font-bold underline cursor-pointer">Try again</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-6xl mx-auto">

          {/* === LEFT: Converter === */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">

            {/* From */}
            <div className="p-5 border-b-2 border-slate-900 dark:border-slate-700 flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Amount</label>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <select
                    value={fromCode}
                    onChange={e => setFromCode(e.target.value)}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-lg pl-3 pr-7 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-slate-900/20 max-w-[130px] sm:max-w-none"
                  >
                    {ALL_OPTIONS.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                </div>
                <input
                  type="number" min="0" step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="1"
                  className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-900 dark:border-slate-600 rounded-lg px-3 md:px-4 py-3 outline-none text-lg md:text-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 text-right focus:ring-2 focus:ring-slate-900/20 transition-colors"
                />
              </div>
            </div>

            {/* Swap */}
            <div className="relative h-0 flex items-center justify-center">
              <button
                onClick={handleSwap}
                className="absolute z-10 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-full p-2 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowRightLeft size={16} className="text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* To */}
            <div className="p-5 border-b-2 border-slate-900 dark:border-slate-700 flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Converted to</label>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <select
                    value={toCode}
                    onChange={e => setToCode(e.target.value)}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-lg pl-3 pr-7 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-slate-900/20"
                  >
                    {ALL_OPTIONS.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                </div>
                <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-900 dark:border-slate-600 rounded-lg px-3 md:px-4 py-3 text-right flex flex-col justify-center overflow-x-auto custom-scrollbar">
                  {isLoading ? (
                    <span className="text-lg md:text-2xl font-bold text-slate-400">...</span>
                  ) : (
                    <span className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white whitespace-nowrap" title={convertedValue()}>{convertedValue()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Rate + Refresh */}
            <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-950/20">
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                {rates && !isLoading && (
                  <>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      1 {fromCurrency.flag} {fromCurrency.code} = {unitRate()} {toCurrency.flag} {toCurrency.code}
                    </p>
                    {marketTime && (
                      <p className="flex items-center gap-1 text-slate-400">
                        <Clock size={11} />
                        {formatMarketTime(marketTime)} · Yahoo Finance
                      </p>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => fetchRates(true)}
                disabled={isLoading || isRefreshing}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer disabled:opacity-40 transition-colors shrink-0"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* === RIGHT: Historical Chart === */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">

            {/* Chart header */}
            <div className="px-5 pt-5 pb-3 border-b-2 border-slate-900 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historical Rate</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {fromCurrency.flag} {fromCode} → {toCurrency.flag} {toCode}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {RANGES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setChartRange(r.value)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      chartRange === r.value
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trend badge */}
            {!chartLoading && chartPoints.length >= 2 && pctChange !== null && (
              <div className="px-5 pt-4 pb-1 flex items-center gap-2">
                {isUp ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                <span className={`text-sm font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {isUp ? '+' : ''}{pctChange.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-400">over this period</span>
              </div>
            )}

            {/* Chart body */}
            <div className="px-3 pb-3 pt-1 flex-1 flex flex-col justify-end">
              {chartLoading ? (
                <div className="h-40 flex items-center justify-center text-sm text-slate-400 animate-pulse">
                  Loading historical data…
                </div>
              ) : chartError ? (
                <div className="h-40 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 text-center px-4">
                  <AlertCircle size={18} className="text-red-400" />
                  <p className="font-semibold text-slate-500">Chart unavailable</p>
                  <p>{chartError}</p>
                </div>
              ) : chartPoints.length > 1 ? (
                <LineChart points={chartPoints} isUp={isUp} />
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">No data available</div>
              )}
            </div>

            {/* Chart footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Historical data from Yahoo Finance. Market prices — actual traded rates may vary.
              </p>
            </div>
          </div>

        </div>

        {/* Disclaimer */}
        <div className="mt-6 flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-500 dark:text-slate-400">Note:</strong> Rates are mid-market interbank rates from{' '}
            <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300">
              Yahoo Finance
            </a>
            , the same source used by Google Finance. Actual bank/remittance rates differ. Not for binding financial decisions.
          </p>
        </div>

        <SeoGuideSection toolId="currency-converter" />

      </div>
    </div>
  );
};

export default CurrencyConverter;
