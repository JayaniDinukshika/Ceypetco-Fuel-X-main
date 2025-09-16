import React, { useState } from 'react';
import './Login.css';
import { useNavigate, useLocation } from 'react-router-dom';
import http from '../../api/http';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../constants/roles';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ emailOrNic: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Choose a default landing after login based on role
  function routeForRole(role) {
    const r = (role || '').toLowerCase();
    if (r === ROLES.SUPER_ADMIN || r === ROLES.MANAGER) return '/Home';
    if (r === ROLES.ACCOUNTANT) return '/Home';
    if (r === ROLES.HEAD_OFFICER || r === ROLES.AREA_MANAGER) return '/Home';
    if (r === ROLES.PUMPER) return '/'; // only public routes
    return '/'; // fallback
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await http.post('/auth/login', {
        emailOrNic: formData.emailOrNic,
        password: formData.password,
      });
      // backend returns { user, token }
      login(data.token, data.user);
      const from = location.state?.from?.pathname;
      navigate(from || routeForRole(data.user?.role), { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid email/NIC or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.jpg)` }}
    >
      <div className="login-box">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Please enter your details to sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label htmlFor="emailOrNic">Email or NIC</label>
            <input
              type="text"
              id="emailOrNic"
              name="emailOrNic"
              value={formData.emailOrNic}
              onChange={handleChange}
              placeholder="Enter your email or NIC"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
