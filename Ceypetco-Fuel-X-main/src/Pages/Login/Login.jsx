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
  const [showPw, setShowPw] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Case-insensitive, resilient role routing
  const norm = (v) => String(v || '').trim().toLowerCase();
  function routeForRole(role) {
    const map = {
      [norm(ROLES.SUPER_ADMIN)]: '/Home',
      [norm(ROLES.MANAGER)]: '/Home',
      [norm(ROLES.ACCOUNTANT)]: '/Home',
      [norm(ROLES.HEAD_OFFICER)]: '/Home',
      [norm(ROLES.AREA_MANAGER)]: '/Home',
      [norm(ROLES.PUMPER)]: '/',
    };
    return map[norm(role)] || '/';
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
      className="login"
      data-theme="dark"
      style={{
        backgroundImage: `
          radial-gradient(1200px 800px at 75% -10%, rgba(96,165,250,0.14), transparent 60%),
          radial-gradient(900px 600px at -10% 30%, rgba(34,211,238,0.12), transparent 55%),
          linear-gradient(180deg, rgba(11,15,20,0.65), rgba(11,15,20,0.85)),
          url(${process.env.PUBLIC_URL}/background.jpg)
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="login__wrap">
        {/* Brand / minimal header */}
        <header className="login__brand">
          <div className="brand__dot" aria-hidden="true" />
          <span className="brand__name">Ceypetco Fuel:X</span>
        </header>

        {/* Centered panel */}
        <main className="login__grid">
          {/* Left: message (hidden on small) */}
          <section className="login__copy">
            <h1 className="copy__title">Welcome Back</h1>
            <p className="copy__subtitle">
              Sign in to monitor distribution, manage stations, and keep operations running smoothly.
            </p>
          </section>

          {/* Right: form card */}
          <section className="login__panel" aria-labelledby="signin-title">
            <div className="panel__header">
              <h2 id="signin-title" className="panel__title">Sign in</h2>
              <p className="panel__hint">Use your email or NIC and password</p>
            </div>

            <form className="form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="alert" role="alert" aria-live="assertive">
                  {error}
                </div>
              )}

              <div className="field">
                <label htmlFor="emailOrNic" className="label">Email or NIC</label>
                <input
                  type="text"
                  id="emailOrNic"
                  name="emailOrNic"
                  value={formData.emailOrNic}
                  onChange={handleChange}
                  placeholder="you@example.com / 9XXXXXXXXV"
                  required
                  autoComplete="username"
                  autoFocus
                  className="input"
                />
              </div>

              <div className="field">
                <label htmlFor="password" className="label">Password</label>
                <div className="inputWrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="input input--pw"
                  />
                  <button
                    type="button"
                    className="pwToggle"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw(s => !s)}
                    tabIndex={0}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn--primary w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </section>
        </main>

        <footer className="login__footer">
          <p>© {new Date().getFullYear()} Ceypetco Fuel:X. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
