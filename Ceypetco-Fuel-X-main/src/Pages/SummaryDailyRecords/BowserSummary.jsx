import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import './BowserSummary.css';
import { Link, useNavigate } from 'react-router-dom';

Chart.register(annotationPlugin);

// === config ===
const API_BASE = 'http://localhost:5000';
const FUEL_TYPES = [
  'Lanka Petrol 92 Octane',
  'Lanka Petrol 95 Octane',
  'Lanka Auto Diesel',
  'Lanka Super Diesel',
];

const COLORS = {
  'Lanka Petrol 92 Octane': '#4bc0c0',
  'Lanka Petrol 95 Octane': '#ff6b6b',
  'Lanka Auto Diesel': '#7ed957',
  'Lanka Super Diesel': '#ffd600',
};

// LocalStorage keys
const LS_KEY_WARNINGS = 'cf_x_warningLevels';
const LS_KEY_GLOBAL_WARN = 'cf_x_globalWarn';

// --- helpers ---
function formatYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function lastNDays(n) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - n);
  return { from: formatYMD(from), to: formatYMD(to) };
}
function lastNYears(n) {
  const to = new Date();
  const from = new Date();
  from.setFullYear(to.getFullYear() - n);
  return { from: formatYMD(from), to: formatYMD(to) };
}
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function aggregatePoints(points, granularity) {
  if (granularity === 'day') return points.slice();
  const store = new Map();
  for (const p of points) {
    const key = granularity === 'month' ? p.date.slice(0, 7) : p.date.slice(0, 4);
    if (p.level == null) continue;
    store.set(key, p.level); // last write wins
  }
  const keys = Array.from(store.keys()).sort();
  return keys.map(k => ({ date: k, level: store.get(k) }));
}
function labelFor(key, gran) {
  if (gran === 'day') return key;
  if (gran === 'month') { const [y, m] = key.split('-'); return `${monthNames[Number(m)-1]} ${y}`; }
  return key; // year
}

// Default warnings
const DEFAULT_WARNINGS = {
  'Lanka Petrol 92 Octane': 10000,
  'Lanka Petrol 95 Octane': 8000,
  'Lanka Auto Diesel': 12000,
  'Lanka Super Diesel': 6000,
};
const normalizeWarnings = (saved) => {
  const merged = { ...DEFAULT_WARNINGS };
  if (saved && typeof saved === 'object') {
    for (const ft of FUEL_TYPES) {
      if (Object.prototype.hasOwnProperty.call(saved, ft)) {
        const v = saved[ft];
        merged[ft] = (v === '' || Number.isFinite(Number(v))) ? Number(v) : merged[ft];
      }
    }
  }
  return merged;
};

const BowserSummary = ({ onClose }) => {
  const navigate = useNavigate();

  // canvases + charts refs (parallel to FUEL_TYPES)
  const canvasRefs = useRef(FUEL_TYPES.map(() => React.createRef()));
  const chartRefs = useRef(FUEL_TYPES.map(() => null));

  // warnings (persisted)
  const [warningLevels, setWarningLevels] = useState(DEFAULT_WARNINGS);
  const [globalWarn, setGlobalWarn] = useState(10000);

  // range + inputs
  const [range, setRange] = useState(lastNYears(1));
  const [pendingFrom, setPendingFrom] = useState(range.from);
  const [pendingTo, setPendingTo] = useState(range.to);

  // granularity
  const [granularity, setGranularity] = useState('day'); // 'day' | 'month' | 'year'

  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState({});
  const [error, setError] = useState(null);

  // Load persisted
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_WARNINGS);
      if (raw) setWarningLevels(normalizeWarnings(JSON.parse(raw)));
      const gw = localStorage.getItem(LS_KEY_GLOBAL_WARN);
      if (gw !== null && gw !== '') setGlobalWarn(Number(gw));
    } catch {}
  }, []);

  // Save persisted
  useEffect(() => {
    try { localStorage.setItem(LS_KEY_WARNINGS, JSON.stringify(warningLevels)); } catch {}
  }, [warningLevels]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY_GLOBAL_WARN, String(globalWarn)); } catch {}
  }, [globalWarn]);

  // Auto-change range when granularity changes
  useEffect(() => {
    const preset =
      granularity === 'day'   ? lastNDays(30)  :
      granularity === 'month' ? lastNYears(1)  :
                                lastNYears(5);
    setPendingFrom(preset.from);
    setPendingTo(preset.to);
    setRange(preset); // apply immediately
  }, [granularity]);

  // Fetch for applied range
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: range.from,
        to: range.to,
        fuelTypes: FUEL_TYPES.join(','),
      });
      const res = await fetch(`${API_BASE}/analytics/tank-levels?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const byFuel = {};
      for (const s of json?.data?.series ?? []) {
        byFuel[s.fuelType] = s.points || [];
      }
      setSeries(byFuel);
    } catch (e) {
      console.error(e);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [range.from, range.to]);

  // Build / update charts
  useEffect(() => {
    if (loading) return;
    chartRefs.current.forEach((inst) => { if (inst) inst?.destroy(); });

    const tickLimits = granularity === 'day' ? 12 : (granularity === 'month' ? 12 : 6);

    FUEL_TYPES.forEach((fuel, idx) => {
      const raw = series[fuel] || [];
      const aggregated = aggregatePoints(raw, granularity);
      const labels = aggregated.map(p => labelFor(p.date, granularity));
      const data = aggregated.map(p => p.level);

      const ctx = canvasRefs.current[idx].current?.getContext('2d');
      if (!ctx) return;

      const threshold = warningLevels[fuel] ?? null;

      chartRefs.current[idx] = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `${fuel} level (L)`,
            data,
            borderColor: COLORS[fuel] || '#2a71d0',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            spanGaps: true,
            tension: 0.2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y ?? '—'} L` } },
            annotation: threshold != null && threshold !== '' ? {
              annotations: {
                warningLine: {
                  type: 'line',
                  yMin: Number(threshold),
                  yMax: Number(threshold),
                  borderColor: '#e11d48',
                  borderWidth: 2,
                  borderDash: [6, 6],
                  label: {
                    display: true,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    content: `Warning: ${Number(threshold)} L`,
                    position: 'start',
                    padding: 4,
                  },
                },
              },
            } : {},
          },
          scales: {
            x: {
              title: { display: true, text: `Date (${range.from} → ${range.to}) • ${granularity.toUpperCase()}` },
              grid: { display: false },
              ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: tickLimits },
            },
            y: { beginAtZero: true, title: { display: true, text: 'Liters (L)' } },
          },
        },
      });
    });

    return () => { chartRefs.current.forEach((c) => c?.destroy()); };
  }, [loading, series, warningLevels, range.from, range.to, granularity]);

  // Update annotation line live when user edits
  const handleWarnChange = (fuel, value) => {
    const v = value === '' ? '' : Number(value);
    setWarningLevels((prev) => ({ ...prev, [fuel]: v === '' ? '' : (Number.isFinite(v) ? v : prev[fuel]) }));
    const idx = FUEL_TYPES.indexOf(fuel);
    const chart = chartRefs.current[idx];
    if (!chart) return;
    const thr = value === '' ? null : Number(value);
    if (thr != null && Number.isFinite(thr)) {
      chart.options.plugins.annotation = {
        annotations: {
          warningLine: {
            type: 'line',
            yMin: thr, yMax: thr,
            borderColor: '#e11d48',
            borderWidth: 2, borderDash: [6, 6],
            label: {
              display: true, backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#fff', content: `Warning: ${thr} L`, position: 'start', padding: 4,
            },
          },
        },
      };
    } else {
      chart.options.plugins.annotation = {};
    }
    chart.update('none');
  };

  const applyGlobalWarning = () => {
    const n = Number(globalWarn);
    const next = {};
    FUEL_TYPES.forEach(ft => { next[ft] = Number.isFinite(n) ? n : 0; });
    setWarningLevels(next);

    chartRefs.current.forEach((chart) => {
      if (!chart) return;
      const thr = Number.isFinite(n) ? n : 0;
      chart.options.plugins.annotation = {
        annotations: {
          warningLine: {
            type: 'line',
            yMin: thr, yMax: thr,
            borderColor: '#e11d48',
            borderWidth: 2, borderDash: [6, 6],
            label: {
              display: true, backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#fff', content: `Warning: ${thr} L`, position: 'start', padding: 4,
            },
          },
        },
      };
      chart.update('none');
    });
  };

  // manual date controls
  const todayStr = formatYMD(new Date());
  const applyRange = () => {
    if (!pendingFrom || !pendingTo) { setError('Please select both dates.'); return; }
    const fromDate = new Date(pendingFrom);
    const toDate = new Date(pendingTo);
    if (Number.isNaN(fromDate) || Number.isNaN(toDate)) { setError('Invalid dates.'); return; }
    if (fromDate > toDate) { setError('From date must be before To date.'); return; }
    setError(null);
    setRange({ from: pendingFrom, to: pendingTo });
  };
  const preset = (which) => {
    let r;
    if (which === '30d') r = lastNDays(30);
    else if (which === '90d') r = lastNDays(90);
    else r = lastNYears(1);
    setPendingFrom(r.from);
    setPendingTo(r.to);
  };

  return (
    <div className="bowser-summary-container">
      {/* Header */}
      <div className="summary-header-bar">
        <div className="container header-inner">
          <div className="header-left">
            <button className="btn ghost" onClick={() => navigate(-1)}>← Back</button>
            <span className="brand">Sri Lanka Ceypetco Fuel Station</span>
          </div>
          <div className="header-right">
            <button className="btn" onClick={fetchData}>⟳ Refresh</button>
            <Link to="/Summary"><button className="btn outline" onClick={onClose}>Summary</button></Link>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-extended container">
        <div className="tool-group">
          <div className="label-muted">Applied Range</div>
          <div className="value-strong">{range.from} → {range.to}</div>
        </div>

        <div className="tool-group">
          <div className="label-muted">View</div>
          <div className="seg">
            <button className={`seg-btn ${granularity === 'day' ? 'active' : ''}`} onClick={() => setGranularity('day')}>Daily</button>
            <button className={`seg-btn ${granularity === 'month' ? 'active' : ''}`} onClick={() => setGranularity('month')}>Monthly</button>
            <button className={`seg-btn ${granularity === 'year' ? 'active' : ''}`} onClick={() => setGranularity('year')}>Yearly</button>
          </div>
        </div>

        <div className="tool-group wide">
          <div className="label-muted">Custom Range</div>
          <div className="date-inline">
            <label>From
              <input type="date" value={pendingFrom} max={pendingTo || todayStr}
                     onChange={(e) => setPendingFrom(e.target.value)} />
            </label>
            <label>To
              <input type="date" value={pendingTo} min={pendingFrom} max={todayStr}
                     onChange={(e) => setPendingTo(e.target.value)} />
            </label>
            <div className="preset-row">
              <button className="btn tiny" onClick={() => preset('30d')}>Last 30d</button>
              <button className="btn tiny" onClick={() => preset('90d')}>Last 90d</button>
              <button className="btn tiny" onClick={() => preset('1y')}>Last 1y</button>
            </div>
            <button className="btn primary" onClick={applyRange}>Apply</button>
          </div>
        </div>

        <div className="tool-group">
          <div className="label-muted">Warning for all</div>
          <div className="inline">
            <input type="number" min="0" value={globalWarn}
                   onChange={(e) => setGlobalWarn(e.target.value)} className="input sm" />
            <button className="btn primary" onClick={applyGlobalWarning}>Apply</button>
          </div>
        </div>
      </div>

      {/* States */}
      {error && <div className="state danger container">{error}</div>}
      {loading && <div className="state info container">Loading charts…</div>}

      {/* Charts grid */}
      <div className="charts-grid container">
        {FUEL_TYPES.map((fuel, idx) => (
          <div className="card" key={fuel}>
            <div className="card-header">
              <div className="title">
                <span className="dot" style={{ background: COLORS[fuel] }}></span>
                <h3>{fuel}</h3>
              </div>
              <div className="warning-control">
                <label>
                  Warning (L)
                  <input
                    type="number"
                    min="0"
                    value={warningLevels[fuel]}
                    onChange={(e) => handleWarnChange(fuel, e.target.value)}
                    placeholder="e.g., 10000"
                    inputMode="numeric"
                    className="input"
                  />
                </label>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-wrap">
                <canvas ref={canvasRefs.current[idx]} />
              </div>
              {!loading && (!series[fuel] || series[fuel].length === 0) && (
                <div className="state muted">No data for this period.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BowserSummary;
