import React, { useEffect, useMemo, useState } from 'react';
import './Payment.css';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import http from '../../api/http';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../constants/roles';

const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const monthRange = (year, month) => {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  return {
    firstKey: `${year}-${pad(month)}-01`,
    lastKey: `${year}-${pad(month)}-${pad(last.getDate())}`,
    daysInMonth: last.getDate(),
    firstWeekday: first.getDay(),
  };
};

export default function Payment() {
  const { user: me } = useAuth();
  const myRole = (me?.role || '').toLowerCase();

  const isManager = myRole === ROLES.MANAGER;
  const isAccountant = myRole === ROLES.ACCOUNTANT;
  const isPumper = myRole === ROLES.PUMPER;

  const canSeeAll = isManager || isAccountant;
  const canMarkOthers = isManager;
  const canPay = isManager || isAccountant;

  const now = new Date();
  const [monthStr, setMonthStr] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);
  const year = Number(monthStr.slice(0, 4));
  const month = Number(monthStr.slice(5, 7));
  const { firstKey, lastKey, daysInMonth, firstWeekday } = useMemo(
    () => monthRange(year, month), [year, month]
  );
  const tKey = useMemo(() => todayKey(), []);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [monthAtt, setMonthAtt] = useState([]);
  const [monthAllAtt, setMonthAllAtt] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [todayRec, setTodayRec] = useState(null);
  const [msg, setMsg] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(''); // <- visible error banner

  const [form, setForm] = useState({
    status: 'present',
    checkInAt: '',
    checkOutAt: '',
    dailySalary: '',
    salaryPaid: false,
    salaryPaidAmount: '',
    salaryNote: '',
  });
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const sanitizeUsers = (arr) =>
    (Array.isArray(arr) ? arr : [])
      .filter(Boolean)
      .map((u) => {
        const id = u?._id || u?.id || null;
        return {
          _id: id,
          id,
          name: u?.name ?? 'User',
          nic: u?.nic ?? '-',
          role: u?.role ?? '-',
          email: u?.email ?? '',
          telephoneNo: u?.telephoneNo ?? '',
        };
      })
      .filter((u) => u._id);

  const loadUsers = async () => {
    setError('');
    try {
      if (canSeeAll) {
        const { data } = await http.get('/users', { params: { page: 1, limit: 200 } });
        return sanitizeUsers(data?.items);
      }
      const { data } = await http.get('/auth/me');
      return sanitizeUsers([data?.user]);
    } catch (e) {
      const status = e?.response?.status;
      // Fallback: if /users failed, try /auth/me (works for accountant too in a pinch)
      if (status === 401 || status === 403 || status === 404) {
        try {
          const { data } = await http.get('/auth/me');
          return sanitizeUsers([data?.user]);
        } catch (e2) {
          setError(
            e2?.response?.data?.message ||
            `Failed to load users. Status: ${e?.response?.status ?? 'network'}`
          );
        }
      } else {
        setError(
          e?.response?.data?.message ||
          `Failed to load users. Status: ${status ?? 'network'}`
        );
      }
      return [];
    }
  };

  const loadUserMonth = async (userId) => {
    if (!userId) return [];
    try {
      const { data } = await http.get('/attendance', {
        params: { userId, dateFrom: firstKey, dateTo: lastKey, page: 1, limit: 400 },
      });
      return Array.isArray(data?.items) ? data.items.filter(Boolean) : [];
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load attendance.');
      return [];
    }
  };

  const loadAllMonth = async () => {
    if (!canSeeAll) return [];
    try {
      const { data } = await http.get('/attendance', {
        params: { dateFrom: firstKey, dateTo: lastKey, page: 1, limit: 5000 },
      });
      return Array.isArray(data?.items) ? data.items.filter(Boolean) : [];
    } catch (e) {
      // not fatal
      return [];
    }
  };

  const refresh = async (keepSelection = false) => {
    setLoading(true);
    try {
      const u = await loadUsers();
      setUsers(u);
      const prevId = selectedUser?._id || selectedUser?.id;
      const sel = keepSelection ? u.find((x) => x._id === prevId) : u[0];
      setSelectedUser(sel || null);

      if (sel?._id) {
        const items = await loadUserMonth(sel._id);
        setMonthAtt(items);
        const todays = items.find((x) => x?.dateKey === tKey);
        setTodayRec(todays || null);
      } else {
        setMonthAtt([]);
        setTodayRec(null);
      }

      const all = await loadAllMonth();
      setMonthAllAtt(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [monthStr]);

  const seedFormFromToday = (rec) => {
    setForm({
      status: rec?.status || 'present',
      checkInAt: rec?.checkInAt ? new Date(rec.checkInAt).toISOString().slice(0, 16) : '',
      checkOutAt: rec?.checkOutAt ? new Date(rec.checkOutAt).toISOString().slice(0, 16) : '',
      dailySalary: rec?.dailySalary != null ? String(rec.dailySalary) : '',
      salaryPaid: !!rec?.salaryPaid,
      salaryPaidAmount: rec?.salaryPaidAmount != null ? String(rec.salaryPaidAmount) : '',
      salaryNote: rec?.salaryNote || '',
    });
  };

  const openPopup = async (user) => {
    if (!user) return;
    setMsg('');
    setSelectedUser(user);
    const items = await loadUserMonth(user._id);
    setMonthAtt(items);
    const todays = items.find((x) => x?.dateKey === tKey);
    setTodayRec(todays || null);
    seedFormFromToday(todays);
    setIsPopupOpen(true);
  };
  const closePopup = () => { setIsPopupOpen(false); setMsg(''); };

  const saveAttendance = async () => {
    if (!selectedUser?._id) return;
    setWorking(true); setMsg('');
    try {
      if (isPumper && String(selectedUser._id) === String(me?._id || me?.id)) {
        if (!todayRec?.checkInAt) {
          await http.post('/attendance/check-in', { note: form.salaryNote || undefined });
        } else if (!todayRec?.checkOutAt) {
          await http.post('/attendance/check-out', { note: form.salaryNote || undefined });
        } else {
          setMsg('Already checked in and out for today.');
        }
      } else {
        if (!canMarkOthers && String(selectedUser._id) !== String(me?._id || me?.id)) {
          setMsg('You do not have permission to modify others.');
          setWorking(false); return;
        }
        const payload = {
          userId: selectedUser._id,
          dateKey: tKey,
          status: form.status,
          note: form.salaryNote || undefined,
        };
        if (form.checkInAt) payload.checkInAt = new Date(form.checkInAt).toISOString();
        if (form.checkOutAt) payload.checkOutAt = new Date(form.checkOutAt).toISOString();
        if (form.dailySalary !== '') payload.dailySalary = Number(form.dailySalary);
        if (form.salaryPaid) {
          payload.salaryPaid = true;
          payload.salaryPaidAmount =
            form.salaryPaidAmount !== ''
              ? Number(form.salaryPaidAmount)
              : form.dailySalary !== ''
              ? Number(form.dailySalary)
              : 0;
          payload.salaryPaidAt = new Date().toISOString();
        } else {
          payload.salaryPaid = false;
          if (form.salaryPaidAmount !== '') payload.salaryPaidAmount = Number(form.salaryPaidAmount);
        }
        const { data } = await http.post('/attendance/mark', payload);
        setTodayRec(data || null);
        const items = await loadUserMonth(selectedUser._id);
        setMonthAtt(items);
        setMsg('Saved.');
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Save failed.');
    } finally { setWorking(false); }
  };

  const payNow = async () => {
    if (!selectedUser?._id || !canPay) return;
    setWorking(true); setMsg('');
    try {
      let rec = todayRec;
      if (!rec?._id) {
        const { data } = await http.post('/attendance/mark', {
          userId: selectedUser._id,
          dateKey: tKey,
          status: form.status || 'present',
          dailySalary: form.dailySalary !== '' ? Number(form.dailySalary) : 0,
          salaryPaid: true,
          salaryPaidAmount:
            form.salaryPaidAmount !== ''
              ? Number(form.salaryPaidAmount)
              : form.dailySalary !== ''
              ? Number(form.dailySalary)
              : 0,
          salaryPaidAt: new Date().toISOString(),
          salaryNote: form.salaryNote || 'Paid via Payment screen',
        });
        rec = data || null;
      } else {
        const { data } = await http.post(`/attendance/${rec._id}/pay`, {
          amount:
            form.salaryPaidAmount !== ''
              ? Number(form.salaryPaidAmount)
              : form.dailySalary !== ''
              ? Number(form.dailySalary)
              : 0,
          note: form.salaryNote || 'Paid via Payment screen',
        });
        rec = data || null;
      }
      setTodayRec(rec);
      const items = await loadUserMonth(selectedUser._id);
      setMonthAtt(items);
      setMsg('Paid.');
      const all = await loadAllMonth();
      setMonthAllAtt(all);
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Payment failed.');
    } finally { setWorking(false); }
  };

  const perUserMonthlyTotals = useMemo(() => {
    const sum = monthAtt.reduce((acc, r) => {
      if (!r) return acc;
      const amt = r.salaryPaid ? (r.salaryPaidAmount || 0) : (r.dailySalary || 0);
      return acc + (amt || 0);
    }, 0);
    const presentDays = monthAtt.filter((r) => r && (r.status === 'present' || r.status === 'half-day')).length;
    const paidDays = monthAtt.filter((r) => r && r.salaryPaid).length;
    return { sum, presentDays, paidDays };
  }, [monthAtt]);

  const globalTotals = useMemo(() => {
    if (!canSeeAll) return null;
    const byUser = new Map();
    for (const r of monthAllAtt) {
      if (!r) continue;
      const uid = r.user?._id || r.user;
      if (!uid) continue;
      const name = r.user?.name || 'User';
      const role = r.user?.role || '-';
      const amt = r.salaryPaid ? (r.salaryPaidAmount || 0) : (r.dailySalary || 0);
      const prev = byUser.get(uid) || { name, role, sum: 0 };
      prev.sum += (amt || 0);
      byUser.set(uid, prev);
    }
    const rows = Array.from(byUser.entries()).map(([id, v]) => ({ id, ...v }));
    const total = rows.reduce((a, r) => a + (r.sum || 0), 0);
    return { rows, total };
  }, [monthAllAtt, canSeeAll]);

  return (
    <div>
      <Header />
      <div className="payment-container">
        <div className="pay-topbar">
          <div className="pay-month">
            <label>Month</label>
            <input type="month" value={monthStr} onChange={(e) => setMonthStr(e.target.value)} />
          </div>
          {canSeeAll && globalTotals && (
            <div className="pay-total">
              <div className="pay-total-label">Total month salary (all members)</div>
              <div className="pay-total-amount">Rs.{globalTotals.total.toFixed(2)}</div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ maxWidth: 960, margin: '0 auto 12px', padding: 12, borderRadius: 8,
                        background: '#2a1215', border: '1px solid #6d2a31', color: '#ffd6da' }}>
            {error}
            <button style={{ marginLeft: 12 }} onClick={() => refresh(true)}>Retry</button>
          </div>
        )}

        <div className="employee-cards">
          {loading ? (
            <div style={{ padding: 16 }}>Loading…</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 16, opacity: .8 }}>No users visible. Check your role/permissions or token.</div>
          ) : (
            users.map((u) => {
              const name = u?.name ?? 'User';
              const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
              const paidToday = (Array.isArray(monthAllAtt) ? monthAllAtt : [])
                .find((r) => r && (r.user?._id || r.user) === (u?._id || u?.id) && r.dateKey === tKey)?.salaryPaid;
              return (
                <div className={`employee-card ${paidToday ? 'paid' : ''}`} key={u._id}>
                  <img className="employee-avatar" src={avatar} alt={name} />
                  <button className="next-btn" onClick={() => openPopup(u)}>DETAILS</button>
                  <div className="employee-info">
                    <div className="emp-name">{name}</div>
                    <div className="emp-id">NIC: {u.nic}</div>
                    <div className="emp-job">Role: {u.role}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canSeeAll && globalTotals && globalTotals.rows.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>This month per person</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Role</th><th style={{ textAlign: 'right' }}>Monthly Salary (Rs.)</th></tr>
                </thead>
                <tbody>
                  {globalTotals.rows.map(r => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.role}</td>
                      <td style={{ textAlign: 'right' }}>Rs.{(r.sum || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isPopupOpen && selectedUser && (
          <div className="popup-overlay" onClick={() => setIsPopupOpen(false)}>
            <div className="popup-content wide" onClick={(e) => e.stopPropagation()}>
              {/* (left panel: editor) + (right panel: calendar + history) stays same as before */}
              {/* ... keep the editor/calculator UI from previous answer ... */}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
