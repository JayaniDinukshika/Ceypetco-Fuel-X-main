import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Diesel.css";
import Header from "../../Components/Header";
import Footer from "../../Components/Footer";

const API_BASE = "http://localhost:5000";
const PRODUCT_NAME = "Lanka Auto Diesel";

function yyyymmddInTZ(d, timeZone = "Asia/Colombo") {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d); // YYYY-MM-DD
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function formatLiters(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${Number(n).toLocaleString("en-US")} ℓ`;
}
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function productMatches(bowserProduct, wanted = PRODUCT_NAME) {
  const a = normalize(bowserProduct);
  const b = normalize(wanted);
  return a === b || (a.includes("diesel") && a.includes("auto"));
}

const Diesel = () => {
  const [yesterdayLast, setYesterdayLast] = useState(null);
  const [todayLast, setTodayLast] = useState(null);
  const [deliveries, setDeliveries] = useState([]); // today's bowser rows (this product)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const now = useMemo(() => new Date(), []);
  const todayStr = yyyymmddInTZ(now);
  const yesterdayStr = yyyymmddInTZ(addDays(now, -1));

  // Tank levels
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const url = `${API_BASE}/analytics/tank-levels?from=${yesterdayStr}&to=${todayStr}&fuelTypes=${encodeURIComponent(PRODUCT_NAME)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = await res.json();
        const series = json?.data?.series ?? [];
        const s =
          series.find((s) => s.fuelType === PRODUCT_NAME) ||
          series.find((s) => normalize(s.fuelType).includes("auto diesel"));
        const points = s?.points ?? [];
        const map = Object.fromEntries(points.map((p) => [p.date, p.level]));
        setYesterdayLast(typeof map[yesterdayStr] === "number" ? map[yesterdayStr] : null);
        setTodayLast(typeof map[todayStr] === "number" ? map[todayStr] : null);
      } catch (e) {
        setErr("Could not load tank levels. Check endpoint and fuelTypes encoding.");
      } finally {
        setLoading(false);
      }
    })();
  }, [yesterdayStr, todayStr]);

  // Bowser deliveries (today, this product)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/browser-details`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        setDeliveries(rows.filter((b) => b.date === todayStr && productMatches(b.product)));
      } catch {
        setDeliveries([]);
      }
    })();
  }, [todayStr]);

  // --- Calculations ---------------------------------------------------------
  const recordedRefill = deliveries.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

  const netChange =
    typeof yesterdayLast === "number" && typeof todayLast === "number"
      ? todayLast - yesterdayLast
      : null;

  const deltaRefill = netChange != null ? Math.max(netChange, 0) : 0;

  // Prefer recorded, but never below the positive tank delta (handles your screenshot case)
  const effectiveRefill =
    netChange == null ? recordedRefill : Math.max(recordedRefill, deltaRefill);

  let usageLiters = null;
  if (typeof yesterdayLast === "number" && typeof todayLast === "number") {
    const raw = (yesterdayLast + effectiveRefill) - todayLast;
    usageLiters = raw >= 0 ? raw : 0;
  }

  const changeBadge =
    netChange === null
      ? { text: "—", bg: "#999" }
      : netChange > 0
      ? { text: "Refilled", bg: "#16a34a" }
      : netChange < 0
      ? { text: "Consumed", bg: "#dc2626" }
      : { text: "No change", bg: "#6b7280" };

  const inferenceUsed = effectiveRefill !== recordedRefill;

  return (
    <div className="diesel">
      <Header />
      <div className="diesel-container">
        <div className="details-card">
          <h1 className="title">{PRODUCT_NAME}</h1>

          <p style={{ marginTop: 0 }}>
            Day: {todayStr}
            {loading ? " — loading…" : ""}
          </p>
          {err && <p style={{ color: "crimson", fontWeight: 500 }}>{err}</p>}

          {/* Tank snapshot */}
          <div className="snapshot">
            <label>Yesterday Last (from API)</label>
            <input type="text" value={typeof yesterdayLast === "number" ? formatLiters(yesterdayLast) : "—"} readOnly />
            <label>Today Last (from API)</label>
            <input type="text" value={typeof todayLast === "number" ? formatLiters(todayLast) : "—"} readOnly />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ marginBottom: 0 }}>Change (since yesterday)</label>
              <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 12, fontSize: 12, color: "white", background: changeBadge.bg }}>
                {changeBadge.text}
              </span>
            </div>
            <input type="text" value={netChange === null ? "—" : `${netChange} ℓ (${changeBadge.text})`} readOnly />
          </div>

          {/* Today Refilled */}
          <div className="browser-info">
            <h3>Today Refilled</h3>
            <p>
              <strong>{formatLiters(effectiveRefill)}</strong>
              {inferenceUsed && <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>(inferred from tank increase)</span>}
            </p>
            <small style={{ color: "#6b7280" }}>
              Recorded: {formatLiters(recordedRefill)} · Tank Δ (positive): {formatLiters(deltaRefill)}
            </small>

            {deliveries.length > 0 ? (
              <div className="browser-list" style={{ marginTop: 8 }}>
                {deliveries.map((b) => (
                  <div key={b._id} className="browser-row">
                    <div><strong>Invoice:</strong> {b.invoiceNo || "—"}</div>
                    <div><strong>Browser No:</strong> {b.browserNo || "—"}</div>
                    <div><strong>Quantity:</strong> {formatLiters(b.quantity || 0)}</div>
                    <div><strong>Driver Check:</strong> {b.driverCheck || "—"}</div>
                    <div><strong>Dealer Check:</strong> {b.dealerCheck || "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <small style={{ color: "#6b7280" }}>
                No recorded bowser deliveries for {todayStr} ({PRODUCT_NAME}).
              </small>
            )}
          </div>

          {/* Today Fuel Expenditure */}
          <div className="expenditure">
            <h3>Today Fuel Expenditure</h3>
            <p><strong>{formatLiters(usageLiters)}</strong></p>
            <small style={{ color: "#6b7280" }}>
              usage = (Yesterday + Today Refilled) − Today.
            </small>
          </div>

          {/* Nav */}
          <div style={{ marginTop: 16 }}>
            <Link to="/Petrol92"><button className="octane92-btn">Octane 92 Petrol</button></Link>
            <span style={{ display: "inline-block", width: 12 }} />
            <Link to="/Petrol95"><button className="petrol95-btn">Petrol 95</button></Link>
            <span style={{ display: "inline-block", width: 12 }} />
            <Link to="/SuperDiesel"><button className="SuperDiesel-btn">Super Diesel</button></Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Diesel;
