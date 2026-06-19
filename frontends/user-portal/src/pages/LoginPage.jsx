import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { API_BASE } from '../config/api';

export const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('student@asst.edu');
  const [password, setPassword] = useState('student123');
  const [selectedPortal, setSelectedPortal] = useState('student');
  const [authError, setAuthError] = useState('');

  const handlePortalChange = (val) => {
    setSelectedPortal(val);
    if (val === 'admin') {
      window.location.href = 'http://localhost:3000';
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
        if (data.user.role !== selectedPortal) {
          setAuthError(`Access Denied: Your account role does not match the selected ${selectedPortal.replace('_', ' ')} portal.`);
          return;
        }
        login(data.token, data.user);
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('API Gateway not online.');
    }
  };

  const selectShortcut = (role, mail, pass) => {
    setSelectedPortal(role);
    setEmail(mail);
    setPassword(pass);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Ali School
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Science & Technology • Campus Portal</p>
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
              <option value="student">Student Portal</option>
              <option value="teacher">Teacher Portal</option>
              <option value="cafe_operator">Cafeteria Portal</option>
              <option value="librarian">Library Portal</option>
              <option value="admin">Admin Portal</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Campus Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Sign In</button>
        </form>
        
        <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
          <p style={{ marginBottom: '8px' }}><strong>Mock Account Shortcuts:</strong></p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => selectShortcut('student', 'student@asst.edu', 'student123')}>Student</button>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => selectShortcut('teacher', 'teacher@asst.edu', 'teacher123')}>Teacher</button>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => selectShortcut('cafe_operator', 'cafe@asst.edu', 'cafe123')}>Cafe Operator</button>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => selectShortcut('librarian', 'library@asst.edu', 'library123')}>Librarian</button>
          </div>
        </div>
      </div>
    </div>
  );
};
