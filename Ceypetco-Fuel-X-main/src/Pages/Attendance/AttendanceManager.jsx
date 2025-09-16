// import React, { useEffect, useMemo, useState } from 'react';
// import http from '../../api/http';
// import Header from '../../Components/Header';
// import Footer from '../../Components/Footer';
// import { ROLES } from '../../constants/roles';
// import { useAuth } from '../../auth/AuthContext';
// import './AttendanceManager.css';

// const pad = (n) => String(n).padStart(2, '0');
// const toISOAtDate = (dateKey, timeStr) => {
//   if (!timeStr) return undefined;
//   const [hh, mm] = timeStr.split(':');
//   const d = new Date(`${dateKey}T${pad(hh)}:${pad(mm)}:00`);
//   return d.toISOString();
// };
// const fromISOToTime = (iso) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '');

// export default function AttendanceManager() {
//   const { user: me } = useAuth();
//   const role = (me?.role || '').toLowerCase();

//   const isSA = role === ROLES.SUPER_ADMIN;
//   const isManager = role === ROLES.MANAGER;
//   const isAccountant = role === ROLES.ACCOUNTANT;

//   if (!(isSA || isManager || isAccountant)) {
//     return (
//       <div>
//         <Header />
//         <div style={{ maxWidth: 960, margin: '24px auto', padding: 16 }}>
//           <h2>Access denied</h2>
//           <p>Only Super Admin, Manager, or Accountant can view Attendance Manager.</p>
//         </div>
//         <Footer />
//       </div>
//     );
//   }

//   const today = new Date();
//   const [dateKey, setDateKey] = useState(
//     `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
//   );
//   const [filterRole, setFilterRole] = useState('');
//   const [q, setQ] = useState('');
//   const [page, setPage] = useState(1);

//   const [rows, setRows] = useState([]); // roster rows [{ user fields..., attendance?, edit{...} }]
//   const [total, setTotal] = useState(0);
//   const [pages, setPages] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');
//   const [busy, setBusy] = useState(false);

//   const canWrite = isSA || isManager;
//   const canMarkPaid = isSA || isManager || isAccountant;

//   const loadRoster = async () => {
//     setLoading(true); setErr('');
//     try {
//       const { data } = await http.get('/attendance/roster', {
//         params: { dateKey, role: filterRole || undefined, q: q || undefined, page, limit: 50 },
//       });
//       setTotal(data.total);
//       setPages(data.pages);
//       // Map items -> editable rows
//       const mapped = (data.items || []).map((it) => {
//         const a = it.attendance || {};
//         return {
//           userId: it._id,
//           name: it.name,
//           nic: it.nic,
//           role: it.role,
//           email: it.email,
//           telephoneNo: it.telephoneNo,
//           attId: a?._id || null,
//           status: a?.status || '',
//           checkInAt: a?.checkInAt || null,
//           checkOutAt: a?.checkOutAt || null,
//           dailySalary: a?.dailySalary ?? '',
//           salaryPaid: !!a?.salaryPaid,
//           salaryPaidAmount: a?.salaryPaidAmount ?? '',
//           salaryNote: a?.salaryNote || '',
//           edited: false,
//           edit: {
//             status: a?.status || 'present',
//             inTime: fromISOToTime(a?.checkInAt),
//             outTime: fromISOToTime(a?.checkOutAt),
//             dailySalary: a?.dailySalary != null ? String(a.dailySalary) : '',
//             salaryPaid: !!a?.salaryPaid,
//             salaryPaidAmount: a?.salaryPaidAmount != null ? String(a.salaryPaidAmount) : '',
//             salaryNote: a?.salaryNote || '',
//           },
//         };
//       });
//       setRows(mapped);
//     } catch (e) {
//       setErr(e?.response?.data?.message || 'Failed to load roster');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadRoster(); /* eslint-disable-next-line */ }, [dateKey, filterRole, q, page]);

//   const setRow = (idx, patch) =>
//     setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

//   const onChangeEdit = (idx, field, value) => {
//     const r = rows[idx]; if (!r) return;
//     setRow(idx, { edit: { ...r.edit, [field]: value }, edited: true });
//   };

//   const markAllStatus = (status) => {
//     setRows((prev) =>
//       prev.map((r) => ({
//         ...r,
//         edited: true,
//         edit: { ...r.edit, status },
//       }))
//     );
//   };

//   const bulkSave = async () => {
//     const toSend = rows
//       .filter((r) => r.edited)
//       .map((r) => ({
//         userId: r.userId,
//         status: r.edit.status,
//         checkInAt: toISOAtDate(dateKey, r.edit.inTime),
//         checkOutAt: toISOAtDate(dateKey, r.edit.outTime),
//         dailySalary: r.edit.dailySalary !== '' ? Number(r.edit.dailySalary) : undefined,
//         salaryPaid: canMarkPaid ? r.edit.salaryPaid : undefined,
//         salaryPaidAmount:
//           canMarkPaid && r.edit.salaryPaidAmount !== ''
//             ? Number(r.edit.salaryPaidAmount)
//             : undefined,
//         salaryNote: canMarkPaid ? r.edit.salaryNote : undefined,
//       }));

//     if (toSend.length === 0) return;

//     setBusy(true); setErr('');
//     try {
//       await http.post('/attendance/bulk-mark', { dateKey, entries: toSend });
//       await loadRoster(); // refresh table
//     } catch (e) {
//       setErr(e?.response?.data?.message || 'Bulk save failed');
//     } finally {
//       setBusy(false);
//     }
//   };

//   const payRow = async (idx) => {
//     const r = rows[idx]; if (!r) return;
//     setBusy(true); setErr('');
//     try {
//       if (!r.attId) {
//         // create via mark + paid in one go
//         const payload = {
//           userId: r.userId,
//           dateKey,
//           status: r.edit.status,
//           dailySalary: r.edit.dailySalary !== '' ? Number(r.edit.dailySalary) : 0,
//           salaryPaid: true,
//           salaryPaidAmount:
//             r.edit.salaryPaidAmount !== ''
//               ? Number(r.edit.salaryPaidAmount)
//               : r.edit.dailySalary !== ''
//               ? Number(r.edit.dailySalary)
//               : 0,
//           salaryPaidAt: new Date().toISOString(),
//           salaryNote: r.edit.salaryNote || 'Paid',
//         };
//         await http.post('/attendance/mark', payload);
//       } else {
//         await http.post(`/attendance/${r.attId}/pay`, {
//           amount:
//             r.edit.salaryPaidAmount !== ''
//               ? Number(r.edit.salaryPaidAmount)
//               : r.edit.dailySalary !== ''
//               ? Number(r.edit.dailySalary)
//               : 0,
//           note: r.edit.salaryNote || 'Paid',
//         });
//       }
//       await loadRoster();
//     } catch (e) {
//       setErr(e?.response?.data?.message || 'Payment failed');
//     } finally {
//       setBusy(false);
//     }
//   };

//   // drawer: month history for one user
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [historyUser, setHistoryUser] = useState(null);
//   const [historyMonth, setHistoryMonth] = useState(() => {
//     const d = new Date(dateKey);
//     return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
//   });
//   const [historyRows, setHistoryRows] = useState([]);
//   const loadHistory = async (user) => {
//     const y = Number(historyMonth.slice(0, 4));
//     const m = Number(historyMonth.slice(5, 7));
//     const firstKey = `${y}-${pad(m)}-01`;
//     const lastKey = `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`;
//     try {
//       const { data } = await http.get('/attendance', {
//         params: { userId: user.userId, dateFrom: firstKey, dateTo: lastKey, page: 1, limit: 500 },
//       });
//       setHistoryRows(data.items || []);
//     } catch {
//       setHistoryRows([]);
//     }
//   };

//   const openHistory = async (idx) => {
//     const r = rows[idx]; if (!r) return;
//     setHistoryUser(r);
//     setDrawerOpen(true);
//     await loadHistory(r);
//   };

//   const historySum = useMemo(() => {
//     return historyRows.reduce((acc, r) => {
//       const amt = r.salaryPaid ? (r.salaryPaidAmount || 0) : (r.dailySalary || 0);
//       return acc + (amt || 0);
//     }, 0);
//   }, [historyRows]);

//   return (
//     <div>
//       <Header />
//       <div className="am-wrap">
//         <h2>Attendance Manager</h2>

//         <div className="am-filters">
//           <div>
//             <label>Date</label>
//             <input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
//           </div>
//           <div>
//             <label>Role</label>
//             <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
//               <option value="">All</option>
//               <option value={ROLES.MANAGER}>Manager</option>
//               <option value={ROLES.PUMPER}>Pumper</option>
//               <option value={ROLES.ACCOUNTANT}>Accountant</option>
//               <option value="head officer">Head officer</option>
//               <option value="area manager">Area manager</option>
//               <option value="super admin">Super admin</option>
//             </select>
//           </div>
//           <div className="grow">
//             <label>Search</label>
//             <input
//               placeholder="name / email / NIC / phone"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//           </div>
//           <div>
//             <label>&nbsp;</label>
//             <button onClick={() => { setPage(1); loadRoster(); }}>Refresh</button>
//           </div>
//         </div>

//         {err && <div className="am-error">{err}</div>}

//         <div className="am-actions">
//           <div className="left">
//             <button onClick={() => markAllStatus('present')} disabled={!canWrite}>Mark all Present</button>
//             <button onClick={() => markAllStatus('absent')} disabled={!canWrite}>Mark all Absent</button>
//             <button onClick={() => markAllStatus('leave')} disabled={!canWrite}>Mark all Leave</button>
//           </div>
//           <div className="right">
//             <button onClick={bulkSave} disabled={!canWrite || busy}>
//               {busy ? 'Saving…' : 'Save all changes'}
//             </button>
//           </div>
//         </div>

//         <div className="am-tablewrap">
//           {loading ? (
//             <div style={{ padding: 12 }}>Loading…</div>
//           ) : rows.length === 0 ? (
//             <div style={{ padding: 12, opacity: .8 }}>No users found.</div>
//           ) : (
//             <table className="am-table">
//               <thead>
//                 <tr>
//                   <th>Name</th>
//                   <th>Role</th>
//                   <th>NIC</th>
//                   <th>Status</th>
//                   <th>In</th>
//                   <th>Out</th>
//                   <th>Daily Salary</th>
//                   <th>Paid</th>
//                   <th>Paid Amount</th>
//                   <th>Note</th>
//                   <th>History</th>
//                   <th>Pay</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((r, idx) => (
//                   <tr key={r.userId}>
//                     <td>{r.name}</td>
//                     <td>{r.role}</td>
//                     <td>{r.nic}</td>
//                     <td>
//                       <select
//                         value={r.edit.status}
//                         onChange={(e) => onChangeEdit(idx, 'status', e.target.value)}
//                         disabled={!canWrite}
//                       >
//                         <option value="present">present</option>
//                         <option value="absent">absent</option>
//                         <option value="leave">leave</option>
//                         <option value="half-day">half-day</option>
//                       </select>
//                     </td>
//                     <td>
//                       <input
//                         type="time"
//                         value={r.edit.inTime}
//                         onChange={(e) => onChangeEdit(idx, 'inTime', e.target.value)}
//                         disabled={!canWrite}
//                       />
//                     </td>
//                     <td>
//                       <input
//                         type="time"
//                         value={r.edit.outTime}
//                         onChange={(e) => onChangeEdit(idx, 'outTime', e.target.value)}
//                         disabled={!canWrite}
//                       />
//                     </td>
//                     <td>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={r.edit.dailySalary}
//                         onChange={(e) => onChangeEdit(idx, 'dailySalary', e.target.value)}
//                         disabled={!canWrite}
//                       />
//                     </td>
//                     <td>
//                       <input
//                         type="checkbox"
//                         checked={r.edit.salaryPaid}
//                         onChange={(e) => onChangeEdit(idx, 'salaryPaid', e.target.checked)}
//                         disabled={!canMarkPaid}
//                       />
//                     </td>
//                     <td>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={r.edit.salaryPaidAmount}
//                         onChange={(e) => onChangeEdit(idx, 'salaryPaidAmount', e.target.value)}
//                         disabled={!canMarkPaid}
//                       />
//                     </td>
//                     <td>
//                       <input
//                         value={r.edit.salaryNote}
//                         onChange={(e) => onChangeEdit(idx, 'salaryNote', e.target.value)}
//                         disabled={!canMarkPaid}
//                       />
//                     </td>
//                     <td>
//                       <button onClick={() => openHistory(idx)}>Open</button>
//                     </td>
//                     <td>
//                       <button onClick={() => payRow(idx)} disabled={!canMarkPaid || busy}>Pay</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>

//         {/* pagination */}
//         <div className="am-pager">
//           <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
//           <span>Page {page} / {pages}</span>
//           <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
//         </div>
//       </div>

//       {/* Drawer */}
//       {drawerOpen && historyUser && (
//         <div className="am-drawer" onClick={() => setDrawerOpen(false)}>
//           <div className="am-drawer-content" onClick={(e) => e.stopPropagation()}>
//             <h3 style={{ marginTop: 0 }}>History — {historyUser.name}</h3>
//             <div className="am-historybar">
//               <input
//                 type="month"
//                 value={historyMonth}
//                 onChange={(e) => setHistoryMonth(e.target.value)}
//               />
//               <button onClick={() => loadHistory(historyUser)}>Load</button>
//             </div>
//             <div className="am-tablewrap">
//               <table className="am-table">
//                 <thead>
//                   <tr>
//                     <th>Date</th><th>Status</th><th>In</th><th>Out</th>
//                     <th style={{ textAlign:'right' }}>Amount (Rs.)</th><th>Paid</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {historyRows.length === 0 ? (
//                     <tr><td colSpan={6} className="muted">No records</td></tr>
//                   ) : historyRows
//                     .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
//                     .map((r) => (
//                       <tr key={r._id}>
//                         <td>{r.dateKey}</td>
//                         <td>{r.status}</td>
//                         <td>{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : '-'}</td>
//                         <td>{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : '-'}</td>
//                         <td style={{ textAlign:'right' }}>
//                           Rs.{(r.salaryPaid ? (r.salaryPaidAmount || 0) : (r.dailySalary || 0)).toFixed(2)}
//                         </td>
//                         <td>{r.salaryPaid ? 'Yes' : 'No'}</td>
//                       </tr>
//                     ))}
//                 </tbody>
//                 <tfoot>
//                   <tr>
//                     <td colSpan={4} />
//                     <td style={{ textAlign:'right', fontWeight: 700 }}>Rs.{historySum.toFixed(2)}</td>
//                     <td />
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//             <div style={{ textAlign: 'right', marginTop: 10 }}>
//               <button onClick={() => setDrawerOpen(false)}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//       <Footer />
//     </div>
//   );
// }
