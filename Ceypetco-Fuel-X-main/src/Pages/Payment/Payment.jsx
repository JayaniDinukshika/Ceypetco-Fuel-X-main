import React, { useEffect, useMemo, useState } from 'react';
import './Payment.css';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import http from '../../api/http';

// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, '0');

const MAX_PAGE_LIMIT_USERS = 100;  // for /users (<= your validator)
const MAX_PAGE_LIMIT_ATT   = 20;   // for /attendance (<= your validator)

// YYYY-MM-DD in Asia/Colombo
const toColomboKey = (date = new Date()) => {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return f.format(date);
};

const monthRange = (year, month) => {
  const last = new Date(year, month, 0);
  return {
    firstKey: `${year}-${pad(month)}-01`,
    lastKey: `${year}-${pad(month)}-${pad(last.getDate())}`,
    daysInMonth: last.getDate(),
  };
};

// Attendance-eligible roles
const ATTENDANCE_ROLES = new Set(['manager', 'pumper', 'accountant']);

// Compact + filtered users
const cleanUsers = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter(Boolean)
    .map((u) => {
      const roleLc = (u?.role || '').toString().trim().toLowerCase();
      return {
        _id: u?._id || u?.id,
        name: u?.name ?? 'User',
        nic: u?.nic ?? '',
        role: roleLc,
        email: u?.email ?? '',
        telephoneNo: u?.telephoneNo ?? '',
      };
    })
    .filter((u) => u._id && u.nic && ATTENDANCE_ROLES.has(u.role));

/** Normalize any attendance record shape to { _id, user, dateKey, present, dailySalary } */
function normalizeAttendance(x) {
  if (!x) return null;
  const statusStr = typeof x.status === 'string' ? x.status.toLowerCase() : '';
  const present =
    typeof x.present === 'boolean'
      ? x.present
      : statusStr === 'present' || statusStr === 'half-day';

  const dailySalary =
    x.dailySalary != null
      ? Number(x.dailySalary)
      : x.salaryPaidAmount != null
      ? Number(x.salaryPaidAmount)
      : null;

  const dateKey =
    x.dateKey ||
    (x.date ? toColomboKey(new Date(x.date)) : undefined) ||
    undefined;

  const userId = x.user?._id || x.user; // populated or id

  return {
    _id: x._id,
    user: userId,
    dateKey,
    present: !!present,
    dailySalary,
  };
}

/** ---- SAVE uses your working NIC-based endpoint ---- **/
async function saveAttendance({ http, user, present, dailySalary, dateKey }) {
  const body = {
    nic: user.nic,
    present: !!present,
    dateKey,
  };
  if (dailySalary !== '' && dailySalary != null) body.dailySalary = Number(dailySalary);
  return http.post('/attendance/mark', body);
}

/** ---- READ uses ONLY your working list endpoint: GET /api/attendance ---- **/
async function fetchAttendancePaged({ http, params }) {
  const all = [];
  let page = 1;
  let pages = 1;

  do {
    const { data } = await http.get('/attendance', {
      params: { ...params, page, limit: MAX_PAGE_LIMIT_ATT },
    });
    const items = Array.isArray(data?.items) ? data.items : [];
    all.push(...items);
    pages = Number(
      data?.pages || Math.ceil((Number(data?.total || 0) / MAX_PAGE_LIMIT_ATT)) || 1
    );
    page += 1;
    if (!items.length) break;
  } while (page <= pages);

  return all.map(normalizeAttendance).filter(Boolean);
}

async function fetchDailyForUser({ http, userId, dateKey }) {
  const items = await fetchAttendancePaged({
    http,
    params: { userId, dateFrom: dateKey, dateTo: dateKey },
  });
  // try exact match
  return items.find((x) => x.dateKey === dateKey) || items[0] || null;
}

async function fetchMonthlyForUser({ http, userId, firstKey, lastKey }) {
  return fetchAttendancePaged({
    http,
    params: { userId, dateFrom: firstKey, dateTo: lastKey },
  });
}

export default function Payment() {
  // ---- tabs ----
  const [tab, setTab] = useState('mark'); // 'mark' | 'view'

  // ---- users ----
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [banner, setBanner] = useState('');

  const loadUsers = async () => {
    setBanner('');
    setLoadingUsers(true);
    try {
      const all = [];
      let page = 1;
      let pages = 1;

      do {
        const { data } = await http.get('/users', { params: { page, limit: MAX_PAGE_LIMIT_USERS } });
        const items = cleanUsers(data?.items);
        all.push(...items);
        pages =
          Number(data?.pages || Math.ceil((Number(data?.total || 0) / MAX_PAGE_LIMIT_USERS)) || 1);
        page += 1;
        if (!items.length) break; // safety
      } while (page <= pages);

      setUsers(all);
      if (!all.length) setBanner('No eligible users (manager / pumper / accountant).');
    } catch (e) {
      setBanner(e?.response?.data?.message || 'Failed to load users.');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // =========================================================
  // TAB 1: MARK ATTENDANCE (roll-call for all)
  // =========================================================
  const [markDate, setMarkDate] = useState(toColomboKey());
  const [dailyMap, setDailyMap] = useState({}); // userId ->  { present, dailySalary, dateKey, _id? }
  const [rowEdits, setRowEdits] = useState({}); // userId -> patch
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [saveAllProgress, setSaveAllProgress] = useState({ done: 0, total: 0 });

  const loadDailyForAll = async (dateKey) => {
    if (!users.length) return;
    const next = {};
    for (const u of users) {
      try {
        const rec = await fetchDailyForUser({ http, userId: u._id, dateKey });
        if (rec) {
          next[u._id] = {
            _id: rec._id,
            present: !!rec.present,
            dailySalary: rec.dailySalary ?? '',
            dateKey: rec.dateKey,
          };
        } else {
          next[u._id] = { present: false, dailySalary: '', dateKey };
        }
      } catch {
        next[u._id] = { present: false, dailySalary: '', dateKey };
      }
    }
    setDailyMap(next);
    setRowEdits({});
  };

  useEffect(() => { if (users.length) loadDailyForAll(markDate); /* eslint-disable-line */ }, [users, markDate]);

  const getRowValue = (uid) => {
    const base = dailyMap[uid] || { present: false, dailySalary: '', dateKey: markDate };
    const edit = rowEdits[uid] || {};
    return { ...base, ...edit };
  };
  const setRowValue = (uid, patch) =>
    setRowEdits((p) => ({ ...p, [uid]: { ...(p[uid] || {}), ...patch } }));

  const saveRow = async (u) => {
    if (!u?._id) return;
    const v = getRowValue(u._id);
    setSavingId(u._id);
    setBanner('');
    try {
      await saveAttendance({
        http,
        user: u,
        present: v.present,
        dailySalary: v.dailySalary,
        dateKey: markDate,
      });
      // refresh just this row
      const rec = await fetchDailyForUser({ http, userId: u._id, dateKey: markDate });
      const next = rec || { present: v.present, dailySalary: v.dailySalary, dateKey: markDate };
      setDailyMap((p) => ({
        ...p,
        [u._id]: {
          _id: next?._id,
          present: !!next.present,
          dailySalary: next?.dailySalary ?? '',
          dateKey: next?.dateKey || markDate,
        },
      }));
      setRowEdits((p) => ({ ...p, [u._id]: {} }));
    } catch (e) {
      setBanner(e?.response?.data?.message || `Save failed for ${u.name}.`);
    } finally {
      setSavingId(null);
    }
  };

  const markAllPresent = () => {
    const patch = {};
    for (const u of users) patch[u._id] = { ...(rowEdits[u._id] || {}), present: true };
    setRowEdits((p) => ({ ...p, ...patch }));
  };

  const markAllAbsent = () => {
    const patch = {};
    for (const u of users) patch[u._id] = { ...(rowEdits[u._id] || {}), present: false };
    setRowEdits((p) => ({ ...p, ...patch }));
  };

  const setSalaryAll = (amountStr) => {
    const amount = amountStr === '' ? '' : Number(amountStr);
    if (amountStr !== '' && Number.isNaN(amount)) return;
    const patch = {};
    for (const u of users) patch[u._id] = { ...(rowEdits[u._id] || {}), dailySalary: amountStr };
    setRowEdits((p) => ({ ...p, ...patch }));
  };

  const saveAll = async () => {
    if (!users.length) return;
    setSavingAll(true);
    setSaveAllProgress({ done: 0, total: users.length });
    setBanner('');
    let done = 0;
    try {
      for (const u of users) {
        const v = getRowValue(u._id);
        try {
          await saveAttendance({
            http,
            user: u,
            present: v.present,
            dailySalary: v.dailySalary,
            dateKey: markDate,
          });
        } catch (e) {
          setBanner(e?.response?.data?.message || `Save failed for ${u.name}. Continuing…`);
        }
        done += 1;
        setSaveAllProgress({ done, total: users.length });
      }
      await loadDailyForAll(markDate); // refresh after bulk
      setBanner(`Saved ${done}/${users.length} records for ${markDate}.`);
    } finally {
      setSavingAll(false);
      setTimeout(() => setSaveAllProgress({ done: 0, total: 0 }), 800);
    }
  };

  const presentCount = useMemo(() => {
    return users.reduce((acc, u) => acc + (getRowValue(u._id).present ? 1 : 0), 0);
  }, [users, rowEdits, dailyMap]);

  // =========================================================
  // TAB 2: SEE ATTENDANCE (DAILY + MONTHLY) — via GET /attendance
  // =========================================================
  const [selUserId, setSelUserId] = useState('');
  useEffect(() => { if (users.length) setSelUserId(users[0]?._id || ''); }, [users]);
  const selUser = useMemo(() => users.find((u) => u._id === selUserId) || null, [users, selUserId]);

  // daily
  const [viewDate, setViewDate] = useState(toColomboKey());
  const [viewDaily, setViewDaily] = useState(null);
  const loadViewDaily = async () => {
    if (!selUser) return setViewDaily(null);
    try {
      const rec = await fetchDailyForUser({ http, userId: selUser._id, dateKey: viewDate });
      setViewDaily(rec || null);
    } catch {
      setViewDaily(null);
    }
  };
  useEffect(() => { loadViewDaily(); /* eslint-disable-line */ }, [selUserId, viewDate]);

  // monthly
  const now = new Date();
  const [monthStr, setMonthStr] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);
  const year = Number(monthStr.slice(0, 4));
  const month = Number(monthStr.slice(5, 7));
  const { firstKey, lastKey, daysInMonth } = useMemo(() => monthRange(year, month), [year, month]);
  const [monthRows, setMonthRows] = useState([]);

  const loadMonthly = async () => {
    if (!selUser) return setMonthRows([]);
    try {
      const items = await fetchMonthlyForUser({
        http,
        userId: selUser._id,
        firstKey,
        lastKey,
      });
      setMonthRows(items);
    } catch {
      setMonthRows([]);
    }
  };
  useEffect(() => { loadMonthly(); /* eslint-disable-line */ }, [selUserId, monthStr]);

  const monthByDay = useMemo(() => {
    const map = new Map();
    for (const r of monthRows) {
      if (r?.dateKey) map.set(r.dateKey, r);
    }
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${pad(month)}-${pad(d)}`;
      const r = map.get(key);
      list.push(r || { dateKey: key, present: false, dailySalary: null });
    }
    return list;
  }, [monthRows, daysInMonth, year, month]);

  const monthStats = useMemo(() => {
    const presentDays = monthByDay.filter((r) => r.present).length;
    const totalSalary = monthByDay.reduce((a, r) => a + (Number(r.dailySalary) || 0), 0);
    return { presentDays, totalSalary };
  }, [monthByDay]);

  // ---------- render ----------
  return (
    <div>
      <Header />

      <div className="payment-container">
        <div className="tabs">
          <button
            className={`tab ${tab === 'mark' ? 'active' : ''}`}
            onClick={() => setTab('mark')}
          >
            Mark Attendance
          </button>
          <button
            className={`tab ${tab === 'view' ? 'active' : ''}`}
            onClick={() => setTab('view')}
          >
            See Attendance
          </button>
        </div>

        {banner && (
          <div className="banner-error">
            {banner}
            <button className="banner-btn" onClick={() => setBanner('')}>Close</button>
          </div>
        )}

        {/* ---------- MARK TAB ---------- */}
        {tab === 'mark' && (
          <div className="section">
            <div className="row" style={{ alignItems: 'center' }}>
              <div>
                <label className="label">Date</label>
                <input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
              </div>

              {/* Re-arranged toolbar (grid) */}
              <div className="toolbar">
                <button className="btn" onClick={markAllPresent}>Mark All Present</button>
                <button className="btn" onClick={markAllAbsent}>Mark All Absent</button>

                <div className="salary-all">
                  <span>Set salary for all:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    onChange={(e) => setSalaryAll(e.target.value)}
                  />
                </div>

                <button className="btn primary" disabled={savingAll} onClick={saveAll}>
                  {savingAll ? `Saving… (${saveAllProgress.done}/${saveAllProgress.total})` : 'Save All'}
                </button>
              </div>

              <div style={{ opacity: .7, marginLeft: 'auto' }}>
                {loadingUsers ? 'Loading users…' : `${users.length} user(s), Present: ${presentCount}`}
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>NIC</th>
                    <th>Role</th>
                    <th>Present</th>
                    <th>Daily Salary (Rs.)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const v = getRowValue(u._id);
                    const roleLabel = u.role.replace(/\b\w/g, (m) => m.toUpperCase());
                    return (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.nic}</td>
                        <td>{roleLabel}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!v.present}
                            onChange={(e) => setRowValue(u._id, { present: e.target.checked })}
                          />
                        </td>
                        <td style={{ maxWidth: 140 }}>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={v.dailySalary === '' ? '' : v.dailySalary}
                            onChange={(e) => setRowValue(u._id, { dailySalary: e.target.value })}
                            style={{ width: 130 }}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn"
                            disabled={savingId === u._id || savingAll}
                            onClick={() => saveRow(u)}
                          >
                            {savingId === u._id ? 'Saving…' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr><td colSpan={6} style={{ opacity: .7, textAlign: 'center' }}>No users.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------- VIEW TAB ---------- */}
        {tab === 'view' && (
          <div className="section">
            <div className="row">
              <div>
                <label className="label">User</label>
                <select value={selUserId} onChange={(e) => setSelUserId(e.target.value)}>
                  {users.map((u) => (
                    <option value={u._id} key={u._id}>{u.name} — {u.nic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Daily date</label>
                <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} />
              </div>

              <div>
                <label className="label">Month</label>
                <input type="month" value={monthStr} onChange={(e) => setMonthStr(e.target.value)} />
              </div>
            </div>

            {/* Daily card */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Daily</h3>
              {viewDaily ? (
                <div className="grid-2">
                  <div><b>Date:</b> {viewDaily.dateKey}</div>
                  <div><b>Status:</b> {viewDaily.present ? 'Present' : 'Absent'}</div>
                  <div><b>Daily Salary:</b> Rs.{Number(viewDaily.dailySalary || 0).toFixed(2)}</div>
                  <div><b>NIC:</b> {selUser?.nic}</div>
                </div>
              ) : (
                <div style={{ opacity: .7 }}>No record for {viewDate}.</div>
              )}
            </div>

            {/* Monthly table */}
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>
                Monthly — {monthStr} • Present days: {monthStats.presentDays} • Salary total: Rs.{monthStats.totalSalary.toFixed(2)}
              </h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Daily Salary (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthByDay.map((r) => (
                      <tr key={r.dateKey}>
                        <td>{r.dateKey}</td>
                        <td>{r.present ? 'Present' : 'Absent'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {r.dailySalary != null ? `Rs.${Number(r.dailySalary || 0).toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
