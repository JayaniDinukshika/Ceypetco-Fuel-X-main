import React, { useEffect, useMemo, useState } from 'react';
import http from '../../api/http';
import { ROLES } from '../../constants/roles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import './StaffRegistration.css';

const roleOptions = [
  // ROLES.SUPER_ADMIN, // keep disabled unless you really want admins to create super admins
  ROLES.MANAGER,
  ROLES.PUMPER,
  ROLES.ACCOUNTANT,
  ROLES.HEAD_OFFICER,
  ROLES.AREA_MANAGER,
];

export default function StaffRegistration() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // --- UI tabs ---
  const [tab, setTab] = useState('create'); // 'create' | 'manage'

  // --- create form state ---
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    nic: '',
    role: ROLES.PUMPER, // default role
    address: '',
    birthday: '',
    email: '',
    telephoneNo: '',
    password: '',
    confirmPassword: '',
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOkMsg('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        nic: form.nic.trim(),
        role: form.role,
        address: form.address.trim(),
        birthday: form.birthday,
        email: form.email.trim(),
        telephoneNo: form.telephoneNo.trim(),
        password: form.password,
      };
      await http.post('/auth/signup', payload);
      setOkMsg('User created successfully.');
      // clear form
      setForm({
        name: '',
        nic: '',
        role: ROLES.PUMPER,
        address: '',
        birthday: '',
        email: '',
        telephoneNo: '',
        password: '',
        confirmPassword: '',
      });
      // switch to Manage tab automatically (optional)
      setTimeout(() => setTab('manage'), 700);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors) && err.response.data.errors[0]?.msg) ||
        'Failed to create user. Please check inputs.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- manage users state ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = { page, limit };
      if (q) params.q = q;
      if (roleFilter) params.role = roleFilter;
      const { data } = await http.get('/users', { params });
      setUsers(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      // show inline error in list area
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (tab === 'manage') fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, roleFilter]);

  const onDelete = async (u) => {
    if (!u?._id) return;
    if (currentUser && String(currentUser._id || currentUser.id) === String(u._id)) {
      alert('You cannot delete your own account.');
      return;
    }
    const ok = window.confirm(`Delete user "${u.name}" (${u.email})?`);
    if (!ok) return;
    try {
      await http.delete(`/users/${u._id}`);
      await fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed.');
    }
  };

  const onResetPassword = async (u) => {
    const newPass = window.prompt(`Enter a new password for ${u.name} (min 8 chars):`);
    if (!newPass) return;
    if (newPass.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    try {
      await http.post(`/users/${u._id}/reset-password`, { newPassword: newPass });
      alert('Password reset successfully.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Reset failed.');
    }
  };

  const roleBadge = (r) => (
    <span className={`role-badge role-${(r || '').replace(/\s+/g, '-')}`}>{r}</span>
  );

  const fmtDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString();
  };

  return (
    <div className="sr-page">
      <Header />

      <div className="sr-container">
        <div className="sr-header">
          <h2>Staff Management</h2>
          <p className="sr-sub">
            Create staff accounts and manage existing users. Only <b>Super Admin</b> and <b>Manager</b> can access this page.
          </p>

          <div className="sr-tabs">
            <button
              className={`sr-tab ${tab === 'create' ? 'active' : ''}`}
              onClick={() => setTab('create')}
              type="button"
            >
              Create User
            </button>
            <button
              className={`sr-tab ${tab === 'manage' ? 'active' : ''}`}
              onClick={() => setTab('manage')}
              type="button"
            >
              Manage Users
            </button>
          </div>
        </div>

        {tab === 'create' && (
          <div className="card">
            {error && <div className="alert alert-error" aria-live="polite">{error}</div>}
            {okMsg && <div className="alert alert-ok" aria-live="polite">{okMsg}</div>}

            <form className="sr-form" onSubmit={onSubmit}>
              <div className="grid-2">
                <div className="field">
                  <label>Name</label>
                  <input name="name" value={form.name} onChange={onChange} required placeholder="Full name" />
                </div>

                <div className="field">
                  <label>NIC</label>
                  <input
                    name="nic"
                    value={form.nic}
                    onChange={onChange}
                    required
                    placeholder="123456789V or 200012345678"
                    pattern="(?:\d{9}[VXvx]|\d{12})"
                    title="Old NIC: 9 digits + V/X (e.g., 123456789V) or New NIC: 12 digits"
                  />
                </div>

                <div className="field">
                  <label>Role</label>
                  <select name="role" value={form.role} onChange={onChange} required>
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Birthday</label>
                  <input type="date" name="birthday" value={form.birthday} onChange={onChange} required />
                </div>

                <div className="field field-span">
                  <label>Address</label>
                  <input name="address" value={form.address} onChange={onChange} required placeholder="Address" />
                </div>

                <div className="field">
                  <label>Email</label>
                  <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="name@example.com" />
                </div>

                <div className="field">
                  <label>Telephone No</label>
                  <input
                    name="telephoneNo"
                    value={form.telephoneNo}
                    onChange={onChange}
                    required
                    placeholder="077xxxxxxx or +94xxxxxxxxx"
                    pattern="(?:0\d{9}|\+94\d{9})"
                    title="Start with 0 and 9 digits (e.g., 0771234567) or +94 then 9 digits"
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <input type="password" name="password" value={form.password} onChange={onChange} required minLength={8} />
                </div>

                <div className="field">
                  <label>Confirm Password</label>
                  <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} required minLength={8} />
                </div>
              </div>

              <div className="actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create User'}
                </button>
                <button type="button" className="btn" onClick={() => navigate(-1)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'manage' && (
          <div className="card">
            <div className="toolbar">
              <input
                className="input"
                placeholder="Search name, email, NIC, phone, address…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchUsers())}
              />
              <select
                className="select"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              >
                <option value="">All roles</option>
                {Object.values(ROLES).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button className="btn" onClick={() => { setPage(1); fetchUsers(); }}>
                Search
              </button>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>NIC</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr><td colSpan={7} className="muted">Loading…</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={7} className="muted">No users found.</td></tr>
                  ) : (
                    users.map((u) => {
                      const isMe = currentUser && String(currentUser._id || currentUser.id) === String(u._id);
                      const isSuperAdmin = (u.role || '').toLowerCase() === ROLES.SUPER_ADMIN;
                      const myRole = (currentUser?.role || '').toLowerCase();
                      const canTouch = !isMe && (myRole === ROLES.SUPER_ADMIN || !isSuperAdmin);

                      return (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{roleBadge(u.role)}</td>
                          <td>{u.email}</td>
                          <td>{u.telephoneNo}</td>
                          <td>{u.nic}</td>
                          <td>{fmtDate(u.createdAt)}</td>
                          <td className="row-actions">
                            <button
                              className="btn btn-ghost"
                              title="Reset password"
                              onClick={() => onResetPassword(u)}
                              disabled={!canTouch}
                            >
                              Reset
                            </button>
                            <button
                              className="btn btn-danger"
                              title="Delete user"
                              onClick={() => onDelete(u)}
                              disabled={!canTouch}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <div className="muted">
                Page {page} / {pages} · {total} users
              </div>
              <div className="pager-actions">
                <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Prev
                </button>
                <button className="btn" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
