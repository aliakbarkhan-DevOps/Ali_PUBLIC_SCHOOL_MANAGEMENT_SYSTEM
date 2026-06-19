import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { API_BASE } from '../config/api';

export const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('admin@asst.edu');
  const [password, setPassword] = useState('admin123');
  const [selectedPortal, setSelectedPortal] = useState('admin');
  const [authError, setAuthError] = useState('');

  const handlePortalChange = (val) => {
    setSelectedPortal(val);
    if (val !== 'admin') {
      window.location.href = 'http://localhost:3001';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user.role !== 'admin') {
          setAuthError('Unauthorized. Only Admins can access this portal.');
          return;
        }
        login(data.token, data.user);
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('Connection error to API Gateway.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Ali School
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Science & Technology • Admin Portal</p>
        </div>
        
        {authError && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Select Portal Access</label>
            <select 
              value={selectedPortal} 
              onChange={e => handlePortalChange(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
            >
              <option value="admin">Admin Portal</option>
              <option value="student">Student Portal</option>
              <option value="teacher">Teacher Portal</option>
              <option value="cafe_operator">Cafeteria Portal</option>
              <option value="librarian">Library Portal</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Admin Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Sign In</button>
        </form>
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-dark)' }}>
          <p>Mock login credentials: <br/><strong>admin@asst.edu</strong> / <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
};
