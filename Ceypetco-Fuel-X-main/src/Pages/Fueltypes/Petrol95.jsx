import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Petrol95.css";
import Footer from "../../Components/Footer";
import Header from "../../Components/Header";

const API_BASE = "http://localhost:5000";
const PRODUCT_NAME = "Lanka Petrol 95 Octane";
const TZ = "Asia/Colombo";

// -------- helpers --------
function yyyymmddInTZ(d, timeZone = TZ) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d); // YYYY-MM-DD
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function localYYYYMMDD(iso, timeZone = TZ) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(iso));
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
// accept common variants like "95 Petrol", "Octane 95", etc.
function productMatches(name, wanted = PRODUCT_NAME) {
  const a = normalize(name);
  const b = normalize(wanted);
  if (a === b) return true;
  return a.includes("petrol") && (a.includes("95") || a.includes("octane 95") || a.includes("95 octane"));
}
// -------------------------

const Petrol95 = () => {
  const [yesterdayLast, setYesterdayLast] = useState(null);
  const [todayLast, setTodayLast] = useState(null);
  const [deliveries, setDeliveries] = useState([]); // today's bowser rows (this product)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Dates in Asia/Colombo
  const now = useMemo(() => new Date(), []);
  const todayStr = yyyymmddInTZ(now);
  const yesterdayStr = yyyymmddInTZ(addDays(now, -1));

  // ---- Tank levels (analytics first, scanned-text fallback) ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) analytics
        const url = `${API_BASE}/analytics/tank-levels?from=${yesterdayStr}&to=${todayStr}&fuelTypes=${encodeURIComponent(PRODUCT_NAME)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = await res.json();

        const series = json?.data?.series ?? [];
        const s =
          series.find((s) => s.fuelType === PRODUCT_NAME) ||
          series.find(
            (s) =>
              normalize(s.fuelType).includes("petrol") &&
              normalize(s.fuelType).includes("95")
          );

        const map = Object.fromEntries((s?.points ?? []).map((p) => [p.date, p.level]));
        let yVal = typeof map[yesterdayStr] === "number" ? map[yesterdayStr] : null;
        let tVal = typeof map[todayStr] === "number" ? map[todayStr] : null;

        // 2) fallback to scanned-text (array root) if missing
        if (yVal === null || tVal === null) {
          const resScan = await fetch(`${API_BASE}/api/scanned-text/`);
          const scanPayload = await resScan.json();
          const rows = Array.isArray(scanPayload) ? scanPayload : (scanPayload?.data || []);

          const pickLatestForDate = (dateStr) => {
            const candidates = rows
              .filter((r) => productMatches(r.fuelType) && localYYYYMMDD(r.createdAt) === dateStr)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const n = Number(candidates[0]?.scannedText);
            return Number.isFinite(n) ? n : null;
          };

          if (yVal === null) yVal = pickLatestForDate(yesterdayStr);
          if (tVal === null) tVal = pickLatestForDate(todayStr);
        }

        setYesterdayLast(yVal);
        setTodayLast(tVal);
      } catch (e) {
        setErr("Could not load tank levels. Check endpoint and fuelTypes encoding.");
      } finally {
        setLoading(false);
      }
    })();
  }, [yesterdayStr, todayStr]);

  // ---- Bowser deliveries for today (this product) ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/browser-details/`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        const todays = rows.filter(
          (b) => b.date === todayStr && productMatches(b.product)
        );
        setDeliveries(todays);
      } catch {
        setDeliveries([]);
      }
    })();
  }, [todayStr]);

  // ---- Calculations ----
  const recordedRefill = deliveries.reduce(
    (sum, b) => sum + (Number(b.quantity) || 0), 0
  );

  const netChange =
    typeof yesterdayLast === "number" && typeof todayLast === "number"
      ? todayLast - yesterdayLast
      : null;

  const deltaRefill = netChange != null ? Math.max(netChange, 0) : 0;

  // Prefer recorded, but never below the positive tank delta (infers when rows missing)
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
    <div className="petrol95">
      {/* Top nav (kept as-is; styled in CSS) */}
      <Header />

      <div className="petrol95-container">
        <div className="details-card">
          <h1 className="title">Lanka Petrol 95 Octane</h1>

          <p className="muted">
            Day: {todayStr}
            {loading ? " — loading…" : ""}
          </p>
          {err && (
            <p className="error">{err}</p>
          )}

          {/* Tank snapshot */}
          <div className="snapshot">
            <label>Yesterday Last (from API / scan)</label>
            <input
              type="text"
              value={typeof yesterdayLast === "number" ? `${yesterdayLast} ℓ` : "—"}
              readOnly
            />

            <label>Today Last (from API / scan)</label>
            <input
              type="text"
              value={typeof todayLast === "number" ? `${todayLast} ℓ` : "—"}
              readOnly
            />

            <div className="row">
              <label style={{ marginBottom: 0 }}>Change (since yesterday)</label>
              <span className="badge" style={{ background: changeBadge.bg }}>
                {changeBadge.text}
              </span>
            </div>
            <input
              type="text"
              value={
                netChange === null
                  ? "—"
                  : netChange > 0
                  ? `${netChange} ℓ (refilled)`
                  : netChange < 0
                  ? `${Math.abs(netChange)} ℓ used`
                  : "0 ℓ (no change)"
              }
              readOnly
            />
          </div>

          {/* Today Refilled */}
          <div className="browser-info">
            <h3>Today Refilled</h3>
            <p className="big">
              <strong>{formatLiters(effectiveRefill)}</strong>
              {inferenceUsed && (
                <span className="hint">
                  (inferred from tank increase)
                </span>
              )}
            </p>
            <small className="dim">
              Recorded: {formatLiters(recordedRefill)} · Tank Δ (positive): {formatLiters(deltaRefill)}
            </small>

            {deliveries.length > 0 ? (
              <div className="browser-list">
                {deliveries.map((b) => (
                  <div key={b._id || `${b.invoiceNo}-${b.browserNo}-${b.quantity}`} className="browser-row">
                    <div><strong>Invoice:</strong> {b.invoiceNo || "—"}</div>
                    <div><strong>Browser No:</strong> {b.browserNo || "—"}</div>
                    <div><strong>Quantity:</strong> {formatLiters(b.quantity || 0)}</div>
                    <div><strong>Driver Check:</strong> {b.driverCheck || "—"}</div>
                    <div><strong>Dealer Check:</strong> {b.dealerCheck || "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <small className="dim">
                No recorded bowser deliveries for {todayStr} ({PRODUCT_NAME}).
              </small>
            )}
          </div>

          {/* Today Fuel Expenditure */}
          <div className="expenditure">
            <h3>Today Fuel Expenditure</h3>
            <p className="big"><strong>{formatLiters(usageLiters)}</strong></p>
            <small className="dim">usage = (Yesterday + Today Refilled) − Today.</small>
          </div>

          {/* Navigation */}
          <div className="nav-buttons">
            <Link to="/Petrol92"><button className="ghost-btn">Octane 92 Petrol</button></Link>
            <Link to="/Diesel"><button className="ghost-btn">Lanka Auto Diesel</button></Link>
            <Link to="/SuperDiesel"><button className="ghost-btn">Super Diesel</button></Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Petrol95;
