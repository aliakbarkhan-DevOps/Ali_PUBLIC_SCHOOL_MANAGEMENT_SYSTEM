import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { API_BASE } from '../config/api';

export const UsersPage = ({ 
  users, 
  activities, 
  attendance, 
  dateFilter, 
  setDateFilter, 
  handlePost, 
  triggerUpdateStatus, 
  triggerDeleteUser,
  triggerGeneratePDF 
}) => {
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'student',
    firstName: '',
    lastName: ''
  });
  
  const [imageBase64, setImageBase64] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' or 'attendance'
  const [logFilter, setLogFilter] = useState('all');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) return;

    let profileDetails = {};
    if (newUser.role === 'student') {
      profileDetails = { grade: '12th', major: 'General Science' };
    } else if (newUser.role === 'teacher') {
      profileDetails = { department: 'Sciences', designation: 'Lecturer' };
    }

    handlePost('/api/users', { ...newUser, profileDetails, image: imageBase64 }, 'User created successfully!', () => {
      setNewUser({
        email: '',
        password: '',
        role: 'student',
        firstName: '',
        lastName: ''
      });
      setImageBase64('');
    });
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = activities.filter(log => {
    if (logFilter === 'all') return true;
    return log.role === logFilter;
  });

  // PDF Export Helpers
  const exportUsersPDF = () => {
    const headers = ['Name', 'Email', 'Role', 'Status'];
    const rows = filteredUsers.map(u => [
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.role.toUpperCase(),
      u.status.toUpperCase()
    ]);
    triggerGeneratePDF('ASST User Roster', 'System Access Accounts', headers, rows, '#8b5cf6');
  };

  const exportLogsPDF = () => {
    const headers = ['Timestamp', 'Email', 'Role', 'Action', 'Metadata'];
    const rows = filteredLogs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.email,
      l.role.toUpperCase(),
      l.action,
      l.details || ''
    ]);
    triggerGeneratePDF('ASST Auditing Trails', 'Gateway Mutating Requests Log', headers, rows, '#6b7280');
  };

  const exportAttendancePDF = () => {
    const headers = ['User Name', 'Email', 'Role', 'Date', 'Status', 'Check-in Time'];
    const rows = attendance.map(a => [
      a.name,
      a.email,
      a.role.toUpperCase(),
      a.date.split('T')[0],
      a.status.toUpperCase(),
      new Date(a.checkinTime).toLocaleTimeString()
    ]);
    triggerGeneratePDF(`ASST Attendance Roster`, `Roster Check-Ins for ${dateFilter}`, headers, rows, '#10b981');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>👥 User Account Control</h1>
        <p style={{ color: 'var(--text-muted)' }}>Create users, configure access levels, and monitor system activity logs</p>
      </div>

      {/* Subtab selection */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: '12px' }}>
        <button 
          className={`btn ${activeSubTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('users')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          👤 User Administration
        </button>
        <button 
          className={`btn ${activeSubTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('attendance')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          🕒 Daily Attendance logs
        </button>
      </div>

      {activeSubTab === 'users' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px', alignItems: 'start' }}>
          {/* User Management Table */}
          <GlassCard style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Active System Users</h2>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={exportUsersPDF}>
                  📄 Export PDF
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', maxWidth: '240px' }}
              />
            </div>

            <DataTable headers={['Avatar', 'Name', 'Email', 'Role', 'Status', 'Actions']}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>No users found matching search query.</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      {u.imageUrl ? (
                        <img 
                          src={`${API_BASE}${u.imageUrl}`} 
                          alt="avatar" 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                          {u.firstName[0]}
                        </div>
                      )}
                    </td>
                    <td><strong>{u.firstName} {u.lastName}</strong></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{u.email}</td>
                    <td>
                      <Badge type={u.role === 'admin' ? 'purple' : u.role === 'teacher' ? 'blue' : u.role === 'student' ? 'green' : 'yellow'}>
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Badge type={u.status === 'active' ? 'success' : u.status === 'blocked' ? 'danger' : 'warning'}>
                        {u.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {u.role !== 'admin' && (
                          <>
                            {u.status === 'active' ? (
                              <>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '11px', background: '#d97706', borderColor: '#d97706' }} 
                                  onClick={() => triggerUpdateStatus(u.id, 'frozen')}
                                >
                                  Freeze
                                </button>
                                <button 
                                  className="btn btn-danger" 
                                  style={{ padding: '4px 8px', fontSize: '11px' }} 
                                  onClick={() => triggerUpdateStatus(u.id, 'blocked')}
                                >
                                  Block
                                </button>
                              </>
                            ) : (
                              <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '4px 8px', fontSize: '11px' }} 
                                  onClick={() => triggerUpdateStatus(u.id, 'active')}
                                >
                                  Activate
                                </button>
                            )}
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--color-red)' }} 
                              onClick={() => triggerDeleteUser(u.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </DataTable>
          </GlassCard>

          {/* Create User Form */}
          <GlassCard style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>⚡ Add User</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>First Name</label>
                <input 
                  type="text" 
                  value={newUser.firstName} 
                  onChange={e => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Last Name</label>
                <input 
                  type="text" 
                  value={newUser.lastName} 
                  onChange={e => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input 
                  type="email" 
                  value={newUser.email} 
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
                <input 
                  type="password" 
                  value={newUser.password} 
                  onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Access Role</label>
                <select 
                  value={newUser.role} 
                  onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="cafe_operator">Cafe Operator</option>
                  <option value="librarian">Librarian</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Profile Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ border: 'none', background: 'transparent', padding: 0 }}
                />
                {imageBase64 && (
                  <img 
                    src={imageBase64} 
                    alt="preview" 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginTop: '10px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Register User</button>
            </form>
          </GlassCard>
        </div>
      ) : (
        /* Daily Attendance monitor logs */
        <GlassCard style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Daily Attendance Check-Ins</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={exportAttendancePDF}>
                📄 Export PDF
              </button>
            </div>
            <input 
              type="date" 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', width: '160px' }}
            />
          </div>

          <DataTable headers={['User ID', 'Name', 'Email', 'Role', 'Date', 'Status', 'Check-in Time']}>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>No attendance entries logged for this date.</td>
              </tr>
            ) : (
              attendance.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>#{a.userId}</td>
                  <td><strong>{a.name}</strong></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{a.email}</td>
                  <td>
                    <Badge type={a.role === 'admin' ? 'purple' : a.role === 'teacher' ? 'blue' : a.role === 'student' ? 'green' : 'yellow'}>
                      {a.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td>{a.date.split('T')[0]}</td>
                  <td>
                    <Badge type={a.status === 'present' ? 'success' : a.status === 'late' ? 'warning' : 'danger'}>
                      {a.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {new Date(a.checkinTime).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </GlassCard>
      )}

      {/* Audit Logs / Activity logs */}
      <GlassCard style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>🔒 System Audit Trails (Mutating Requests)</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Real-time user actions captured by API Gateway</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '10px' }} onClick={exportLogsPDF}>
              📄 Export PDF
            </button>
            {['all', 'admin', 'teacher', 'student', 'cafe_operator', 'librarian'].map(role => (
              <button 
                key={role} 
                className={`btn ${logFilter === role ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setLogFilter(role)}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
          <DataTable headers={['Timestamp', 'User Identity', 'Role', 'Action Executed', 'Meta Details']}>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>No activities logged for selected role filter.</td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} style={{ fontSize: '13px' }}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td><strong>{log.email}</strong></td>
                  <td>
                    <Badge type={log.role === 'admin' ? 'purple' : log.role === 'teacher' ? 'blue' : log.role === 'student' ? 'green' : 'yellow'}>
                      {log.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-blue)' }}>
                    {log.action}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                    {log.details || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </div>
      </GlassCard>
    </div>
  );
};
