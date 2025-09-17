import React, { useEffect, useMemo, useState } from "react";
import "./IncomeExpenses.css";
import Header from "../../Components/Header";
import Footer from "../../Components/Footer";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";
const CASHBOOK_ENDPOINT = `${API_BASE}/api/cashbook`;
const TZ = "Asia/Colombo";

const FUELS = [
  { key: "p92", name: "Lanka Petrol 92 Octane" },
  { key: "p95", name: "Lanka Petrol 95 Octane" },
  { key: "ad",  name: "Lanka Auto Diesel" },
  { key: "sd",  name: "Lanka Super Diesel" },
];

// ------------ helpers ------------
function yyyymmddInTZ(d, timeZone = TZ) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function matchFuel(name, wanted) {
  const a = normalize(name);
  const b = normalize(wanted);
  if (a === b) return true;
  if (b.includes("petrol 92")) return a.includes("petrol") && (a.includes("92") || a.includes("octane 92"));
  if (b.includes("petrol 95")) return a.includes("petrol") && (a.includes("95") || a.includes("octane 95"));
  if (b.includes("auto diesel")) return a.includes("diesel") && a.includes("auto");
  if (b.includes("super diesel")) return a.includes("super diesel");
  return false;
}
function formatRs(n) {
  if (n == null || Number.isNaN(n)) return "Rs.—";
  return `Rs.${Number(n).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function pickLatestScanForDate(rows, fuelName, dateStr) {
  const candidates = rows
    .filter((r) => r && r.createdAt && matchFuel(r.fuelType, fuelName))
    .filter((r) => yyyymmddInTZ(new Date(r.createdAt)) === dateStr)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const n = Number(candidates[0]?.scannedText);
  return Number.isFinite(n) ? n : null;
}
function barWidth(amount, maxAmount) {
  if (!maxAmount || maxAmount <= 0) return "0%";
  const pct = Math.max(2, (amount / maxAmount) * 100);
  return `${Math.min(100, pct)}%`;
}

/** --- NEW: compute liters for a date (analytics -> scans -> bowser) --- */
async function computeLitersForDate({ API_BASE, FUELS, selectedDate, yesterdayOfSelected }) {
  const [bowserRes, scanRes] = await Promise.all([
    fetch(`${API_BASE}/api/browser-details/`).then(r => r.json()).catch(() => ({})),
    fetch(`${API_BASE}/api/scanned-text/`).then(r => r.json()).catch(() => ({})),
  ]);

  const bowserRows = Array.isArray(bowserRes?.data) ? bowserRes.data : [];
  const scanRows = Array.isArray(scanRes) ? scanRes : (scanRes?.data || []);

  const litersMap = {};

  for (const f of FUELS) {
    let yVal = null, tVal = null;

    // try analytics first
    try {
      const url = `${API_BASE}/analytics/tank-levels?from=${yesterdayOfSelected}&to=${selectedDate}&fuelTypes=${encodeURIComponent(f.name)}`;
      const r = await fetch(url);
      if (r.ok) {
        const j = await r.json();
        const series = j?.data?.series ?? [];
        const s =
          series.find(s => s.fuelType === f.name) ||
          series.find(s => normalize(s.fuelType).includes(normalize(f.name).split(" ").slice(-2).join(" ")));
        const map = Object.fromEntries((s?.points ?? []).map(p => [p.date, p.level]));
        yVal = typeof map[yesterdayOfSelected] === "number" ? map[yesterdayOfSelected] : null;
        tVal = typeof map[selectedDate] === "number" ? map[selectedDate] : null;
      }
    } catch { /* ignore */ }

    // fallback to OCR scans
    if (yVal === null) yVal = pickLatestScanForDate(scanRows, f.name, yesterdayOfSelected);
    if (tVal === null) tVal = pickLatestScanForDate(scanRows, f.name, selectedDate);

    // bowser deliveries (recorded refills on that day)
    const dayDeliveries = bowserRows.filter(b => b && b.date === selectedDate && matchFuel(b.product, f.name));
    const recordedRefill = dayDeliveries.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

    let liters = 0;
    if (typeof yVal === "number" && typeof tVal === "number") {
      const netChange = tVal - yVal;
      const deltaRefill = Math.max(netChange, 0);
      const effectiveRefill = Math.max(recordedRefill, deltaRefill);
      const usage = (yVal + effectiveRefill) - tVal;
      liters = usage >= 0 ? usage : 0;
    }
    litersMap[f.key] = liters;
  }

  return litersMap;
}
// ----------------------------------

const IncomeExpenses = () => {
  // --- date selection ---
  const now = useMemo(() => new Date(), []);
  const todayStr = yyyymmddInTZ(now);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;
  const yesterdayOfSelected = yyyymmddInTZ(addDays(new Date(selectedDate), -1));

  // --- ui state ---
  const [loading, setLoading] = useState(true);
  const [sourceMsg, setSourceMsg] = useState("");
  const [err, setErr] = useState("");

  // --- data (view model) ---
  const [litersByFuel, setLitersByFuel] = useState({ p92: 0, p95: 0, ad: 0, sd: 0 });
  const [priceByFuel, setPriceByFuel]   = useState({ p92: "", p95: "", ad: "", sd: "" });
  const [incomeByFuel, setIncomeByFuel] = useState({ p92: 0, p95: 0, ad: 0, sd: 0 });

  // manual fields
  const [cardPayment, setCardPayment]       = useState("");
  const [otherIncome, setOtherIncome]       = useState("");
  const [salary, setSalary]                 = useState("");
  const [browserPayment, setBrowserPayment] = useState("");
  const [otherPayment, setOtherPayment]     = useState("");

  // totals
  const [totals, setTotals] = useState({
    totalFuelIncome: 0,
    totalFuelIncomeWithoutPayment: 0,
    incomeMain: 0,
    expensesMain: 0,
    profit: 0,
  });

  // Load local cache for today
  useEffect(() => {
    if (!isToday) return;
    const saved = JSON.parse(localStorage.getItem(`ie:${selectedDate}`) || "{}");
    const pb = saved.priceByFuel || {};
    setPriceByFuel({
      p92: pb.p92 != null ? String(pb.p92) : "",
      p95: pb.p95 != null ? String(pb.p95) : "",
      ad:  pb.ad  != null ? String(pb.ad)  : "",
      sd:  pb.sd  != null ? String(pb.sd)  : "",
    });
    if (saved.cardPayment != null) setCardPayment(String(saved.cardPayment));
    if (saved.otherIncome != null) setOtherIncome(String(saved.otherIncome));
    if (saved.salary != null) setSalary(String(saved.salary));
    if (saved.browserPayment != null) setBrowserPayment(String(saved.browserPayment));
    if (saved.otherPayment != null) setOtherPayment(String(saved.otherPayment));
  }, [selectedDate, isToday]);

  /** --- LOAD FLOW (fixed) --- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        setSourceMsg("");

        // 1) Try server history
        const historyRes = await fetch(`${CASHBOOK_ENDPOINT}/${selectedDate}`);
        if (historyRes.ok) {
          const hx = await historyRes.json();
          const doc = hx?.data;
          if (doc) {
            const savedLiters = {
              p92: Number(doc?.litersByFuel?.p92) || 0,
              p95: Number(doc?.litersByFuel?.p95) || 0,
              ad:  Number(doc?.litersByFuel?.ad)  || 0,
              sd:  Number(doc?.litersByFuel?.sd)  || 0,
            };
            const savedPrices = {
              p92: String(Number(doc?.pricePerLiterByFuel?.p92) || 0),
              p95: String(Number(doc?.pricePerLiterByFuel?.p95) || 0),
              ad:  String(Number(doc?.pricePerLiterByFuel?.ad)  || 0),
              sd:  String(Number(doc?.pricePerLiterByFuel?.sd)  || 0),
            };
            const manual = {
              cardPayment: String(Number(doc?.manual?.cardPayment) || 0),
              otherIncome: String(Number(doc?.manual?.otherIncome) || 0),
              salary: String(Number(doc?.manual?.salary) || 0),
              browserPayment: String(Number(doc?.manual?.browserPayment) || 0),
              otherPayment: String(Number(doc?.manual?.otherPayment) || 0),
            };

            // If liters are all zero/missing, compute them live as a fallback
            const litersSum = savedLiters.p92 + savedLiters.p95 + savedLiters.ad + savedLiters.sd;
            const liters =
              litersSum > 0
                ? savedLiters
                : await computeLitersForDate({ API_BASE, FUELS, selectedDate, yesterdayOfSelected });

            setLitersByFuel(liters);
            setPriceByFuel(savedPrices);
            setCardPayment(manual.cardPayment);
            setOtherIncome(manual.otherIncome);
            setSalary(manual.salary);
            setBrowserPayment(manual.browserPayment);
            setOtherPayment(manual.otherPayment);

            // Recompute income/totals from (prices + manual + liters)
            const priceNum = {
              p92: Number(savedPrices.p92) || 0,
              p95: Number(savedPrices.p95) || 0,
              ad:  Number(savedPrices.ad)  || 0,
              sd:  Number(savedPrices.sd)  || 0,
            };
            const inc = {
              p92: liters.p92 * priceNum.p92,
              p95: liters.p95 * priceNum.p95,
              ad:  liters.ad  * priceNum.ad,
              sd:  liters.sd  * priceNum.sd,
            };
            setIncomeByFuel(inc);

            const card = Number(manual.cardPayment) || 0;
            const otherInc = Number(manual.otherIncome) || 0;
            const salaryN = Number(manual.salary) || 0;
            const bowserPay = Number(manual.browserPayment) || 0;
            const otherPay = Number(manual.otherPayment) || 0;

            const totalFuelIncome = inc.p92 + inc.p95 + inc.ad + inc.sd;
            setTotals({
              totalFuelIncome,
              totalFuelIncomeWithoutPayment: Math.max(0, totalFuelIncome - card),
              incomeMain: totalFuelIncome + card + otherInc,
              expensesMain: salaryN + bowserPay + otherPay,
              profit: (totalFuelIncome + card + otherInc) - (salaryN + bowserPay + otherPay),
            });

            setSourceMsg(
              litersSum > 0 ? "Loaded from history" : "History (liters auto-computed from scans)"
            );
            return; // done
          }
        }

        // 2) No history → compute a live preview
        const litersMap = await computeLitersForDate({ API_BASE, FUELS, selectedDate, yesterdayOfSelected });
        setLitersByFuel(litersMap);

        if (!isToday) {
          setPriceByFuel({ p92: "", p95: "", ad: "", sd: "" });
          setCardPayment(""); setOtherIncome("");
          setSalary(""); setBrowserPayment(""); setOtherPayment("");
        }

        const price = {
          p92: Number(isToday ? (Number(priceByFuel.p92) || 0) : 0),
          p95: Number(isToday ? (Number(priceByFuel.p95) || 0) : 0),
          ad:  Number(isToday ? (Number(priceByFuel.ad)  || 0) : 0),
          sd:  Number(isToday ? (Number(priceByFuel.sd)  || 0) : 0),
        };
        const income = {
          p92: litersMap.p92 * price.p92,
          p95: litersMap.p95 * price.p95,
          ad:  litersMap.ad  * price.ad,
          sd:  litersMap.sd  * price.sd,
        };
        setIncomeByFuel(income);

        const card = Number(isToday ? (Number(cardPayment) || 0) : 0);
        const otherInc = Number(isToday ? (Number(otherIncome) || 0) : 0);
        const salaryN = Number(isToday ? (Number(salary) || 0) : 0);
        const bowserPay = Number(isToday ? (Number(browserPayment) || 0) : 0);
        const otherPay = Number(isToday ? (Number(otherPayment) || 0) : 0);

        const totalFuelIncome = income.p92 + income.p95 + income.ad + income.sd;
        setTotals({
          totalFuelIncome,
          totalFuelIncomeWithoutPayment: Math.max(0, totalFuelIncome - card),
          incomeMain: totalFuelIncome + card + otherInc,
          expensesMain: salaryN + bowserPay + otherPay,
          profit: (totalFuelIncome + card + otherInc) - (salaryN + bowserPay + otherPay),
        });

        setSourceMsg("Live (no saved record)");
      } catch (e) {
        console.error(e);
        setErr("Could not load data for the selected date.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Recalc totals whenever editable fields change (today only)
  useEffect(() => {
    if (!isToday) return;
    const price = {
      p92: Number(priceByFuel.p92) || 0,
      p95: Number(priceByFuel.p95) || 0,
      ad:  Number(priceByFuel.ad)  || 0,
      sd:  Number(priceByFuel.sd)  || 0,
    };
    const liters = {
      p92: Number(litersByFuel.p92) || 0,
      p95: Number(litersByFuel.p95) || 0,
      ad:  Number(litersByFuel.ad)  || 0,
      sd:  Number(litersByFuel.sd)  || 0,
    };
    const income = {
      p92: liters.p92 * price.p92,
      p95: liters.p95 * price.p95,
      ad:  liters.ad  * price.ad,
      sd:  liters.sd  * price.sd,
    };
    setIncomeByFuel(income);

    const card = Number(cardPayment) || 0;
    const otherInc = Number(otherIncome) || 0;
    const salaryN = Number(salary) || 0;
    const browPay = Number(browserPayment) || 0;
    const otherPay = Number(otherPayment) || 0;

    const totalFuelIncome = income.p92 + income.p95 + income.ad + income.sd;
    setTotals({
      totalFuelIncome,
      totalFuelIncomeWithoutPayment: Math.max(0, totalFuelIncome - card),
      incomeMain: totalFuelIncome + card + otherInc,
      expensesMain: salaryN + browPay + otherPay,
      profit: (totalFuelIncome + card + otherInc) - (salaryN + browPay + otherPay),
    });
  }, [isToday, priceByFuel, litersByFuel, cardPayment, otherIncome, salary, browserPayment, otherPayment]);

  // Save (upsert by selectedDate) — enabled only for today.
  const [saveMsg, setSaveMsg] = useState("");
  async function handleSave() {
    if (isToday) {
      localStorage.setItem(
        `ie:${selectedDate}`,
        JSON.stringify({
          priceByFuel: {
            p92: Number(priceByFuel.p92) || 0,
            p95: Number(priceByFuel.p95) || 0,
            ad:  Number(priceByFuel.ad)  || 0,
            sd:  Number(priceByFuel.sd)  || 0,
          },
          cardPayment: Number(cardPayment) || 0,
          otherIncome: Number(otherIncome) || 0,
          salary: Number(salary) || 0,
          browserPayment: Number(browserPayment) || 0,
          otherPayment: Number(otherPayment) || 0,
        })
      );
    }

    const payload = {
      date: selectedDate,
      litersByFuel: {
        p92: Number(litersByFuel.p92) || 0,
        p95: Number(litersByFuel.p95) || 0,
        ad:  Number(litersByFuel.ad)  || 0,
        sd:  Number(litersByFuel.sd)  || 0,
      },
      pricePerLiterByFuel: {
        p92: Number(priceByFuel.p92) || 0,
        p95: Number(priceByFuel.p95) || 0,
        ad:  Number(priceByFuel.ad)  || 0,
        sd:  Number(priceByFuel.sd)  || 0,
      },
      manual: {
        cardPayment: Number(cardPayment) || 0,
        otherIncome: Number(otherIncome) || 0,
        salary: Number(salary) || 0,
        browserPayment: Number(browserPayment) || 0,
        otherPayment: Number(otherPayment) || 0,
      },
    };

    try {
      const res = await fetch(CASHBOOK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`POST ${res.status}`);
      const json = await res.json();

      if (json?.data?.totals) setTotals(json.data.totals);
      if (json?.data?.incomeByFuel) setIncomeByFuel(json.data.incomeByFuel);

      setSaveMsg("Saved to cash ✅");
    } catch (e) {
      console.warn("Save failed:", e);
      setSaveMsg("Save failed. Check server.");
    } finally {
      setTimeout(() => setSaveMsg(""), 4000);
    }
  }

  const incomeBars = [
    ...FUELS.map((f) => ({ label: f.name, amount: incomeByFuel[f.key] || 0 })),
    { label: "Card Payment", amount: Number(cardPayment) || 0 },
    { label: "Other income", amount: Number(otherIncome) || 0 },
  ];
  const maxIncomeBar = Math.max(...incomeBars.map((b) => b.amount), 1);
  const expenseBars = [
    { label: "Salary", amount: Number(salary) || 0 },
    { label: "Bowser Payment", amount: Number(browserPayment) || 0 },
    { label: "Other payments", amount: Number(otherPayment) || 0 },
  ];
  const maxExpenseBar = Math.max(...expenseBars.map((b) => b.amount), 1);

  return (
    <div>
      <Header />
      <div className="income-expenses-container" data-theme="dark">

        {/* Date picker + Today button */}
        <div className="ie-datepicker">
          <label htmlFor="ie-date">Date</label>
          <input
            id="ie-date"
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => setSelectedDate(e.target.value || todayStr)}
          />
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            disabled={isToday}
            className="ie-today-btn"
            title="Jump to today"
          >
            Today
          </button>
          <span className="ie-source-tag">
            {loading ? "Loading…" : sourceMsg}
          </span>
        </div>

        {/* Controls */}
        <div className="ie-controls card">
          <div className="ie-control-grid">
            <div className="ie-control">
              <label>92 Octane Price (Rs/ℓ)</label>
              <input
                type="number" inputMode="decimal"
                value={priceByFuel.p92}
                onChange={(e) => setPriceByFuel({ ...priceByFuel, p92: e.target.value })}
                readOnly={!isToday}
                placeholder="e.g. 358"
              />
            </div>
            <div className="ie-control">
              <label>95 Octane Price (Rs/ℓ)</label>
              <input
                type="number" inputMode="decimal"
                value={priceByFuel.p95}
                onChange={(e) => setPriceByFuel({ ...priceByFuel, p95: e.target.value })}
                readOnly={!isToday}
                placeholder="e.g. 420"
              />
            </div>
            <div className="ie-control">
              <label>Auto Diesel Price (Rs/ℓ)</label>
              <input
                type="number" inputMode="decimal"
                value={priceByFuel.ad}
                onChange={(e) => setPriceByFuel({ ...priceByFuel, ad: e.target.value })}
                readOnly={!isToday}
                placeholder="e.g. 338"
              />
            </div>
            <div className="ie-control">
              <label>Super Diesel Price (Rs/ℓ)</label>
              <input
                type="number" inputMode="decimal"
                value={priceByFuel.sd}
                onChange={(e) => setPriceByFuel({ ...priceByFuel, sd: e.target.value })}
                readOnly={!isToday}
                placeholder="e.g. 370"
              />
            </div>
          </div>

          <div className="ie-control-grid">
            <div className="ie-control">
              <label>Card Payment</label>
              <input
                type="number" inputMode="decimal"
                value={cardPayment}
                onChange={(e) => setCardPayment(e.target.value)}
                readOnly={!isToday}
              />
            </div>
            <div className="ie-control">
              <label>Other Income</label>
              <input
                type="number" inputMode="decimal"
                value={otherIncome}
                onChange={(e) => setOtherIncome(e.target.value)}
                readOnly={!isToday}
              />
            </div>
            <div className="ie-control">
              <label>Salary</label>
              <input
                type="number" inputMode="decimal"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                readOnly={!isToday}
              />
            </div>
            <div className="ie-control">
              <label>Bowser Payment</label>
              <input
                type="number" inputMode="decimal"
                value={browserPayment}
                onChange={(e) => setBrowserPayment(e.target.value)}
                readOnly={!isToday}
              />
            </div>
            <div className="ie-control">
              <label>Other Payment</label>
              <input
                type="number" inputMode="decimal"
                value={otherPayment}
                onChange={(e) => setOtherPayment(e.target.value)}
                readOnly={!isToday}
              />
            </div>
          </div>

          <div className="ie-actions">
            <button
              className="ie-save-btn"
              onClick={handleSave}
              disabled={loading || !isToday}
              title={isToday ? "Save today’s cashbook" : "Read-only for past dates"}
            >
              Save
            </button>
            {saveMsg && <div className="ie-save-msg">{saveMsg}</div>}
            {err && <div className="ie-error">{err}</div>}
          </div>
        </div>

        {/* INCOME */}
        <div className="ie-section card">
          <h2>INCOME</h2>

          <div className="ie-table-row">
            <div className="ie-labels">
              {FUELS.map((f) => (<div key={f.key}>{f.name}</div>))}
              <div>Card Payment</div>
              <div className="bold">Other income</div>
            </div>

            <div className="ie-bars">
              {[
                ...FUELS.map((f) => ({ label: f.name, amount: incomeByFuel[f.key] || 0 })),
                { label: "Card Payment", amount: Number(cardPayment) || 0 },
                { label: "Other income", amount: Number(otherIncome) || 0 },
              ].map((b) => (
                <div
                  key={b.label}
                  className="ie-bar"
                  data-amount={b.amount}
                  style={{ "--w": barWidth(b.amount, maxIncomeBar) }}
                  title={`${b.label}: ${formatRs(b.amount)}`}
                >
                  <span>{formatRs(b.amount)}</span>
                </div>
              ))}
            </div>

            <div className="ie-totals">
              <div className="ie-total-box">
                <span>Total Fuel Income</span>
                <span>{formatRs(totals.totalFuelIncome)}</span>
              </div>
              <div className="ie-total-box">
                <span>Total Fuel Income<br />(Without payment)</span>
                <span>{formatRs(totals.totalFuelIncomeWithoutPayment)}</span>
              </div>
            </div>
          </div>

          <div className="ie-main-total">
            <span>Income</span>
            <span>{formatRs(totals.incomeMain)}</span>
          </div>
        </div>

        {/* EXPENSES */}
        <div className="ie-section card">
          <h2>EXPENSES</h2>
          <div className="ie-table-row">
            <div className="ie-labels">
              <div>Salary</div>
              <div>Bowser Payment</div>
              <div>Other payments</div>
            </div>

            <div className="ie-bars">
              {expenseBars.map((b) => (
                <div
                  key={b.label}
                  className="ie-bar"
                  data-amount={b.amount}
                  style={{ "--w": barWidth(b.amount, maxExpenseBar) }}
                  title={`${b.label}: ${formatRs(b.amount)}`}
                >
                  <span>{formatRs(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ie-main-total expense">
            <span>Expenses</span>
            <span>{formatRs(totals.expensesMain)}</span>
          </div>
        </div>

        {/* PROFIT */}
        <div className="ie-profit-section card">
          <h2>Profit of the day</h2>
          <div className="ie-profit-box">{formatRs(totals.profit)}</div>
        </div>

        {loading && <div className="ie-loading">Loading data…</div>}
      </div>
      <Footer />
    </div>
  );
};

export default IncomeExpenses;
