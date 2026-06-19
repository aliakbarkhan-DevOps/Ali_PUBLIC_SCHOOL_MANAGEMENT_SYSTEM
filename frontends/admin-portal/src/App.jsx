import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { API_BASE } from './config/api';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AcademicsPage } from './pages/AcademicsPage';
import { FinancePage } from './pages/FinancePage';
import { LibraryPage } from './pages/LibraryPage';
import { AssetsPage } from './pages/AssetsPage';
import { CafePage } from './pages/CafePage';
import { ParkingAlumniPage } from './pages/ParkingAlumniPage';
import { UsersPage } from './pages/UsersPage';

function MainApp() {
  const { token, user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dynamic UI States
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [assets, setAssets] = useState([]);
  const [cafeMenu, setCafeMenu] = useState([]);
  const [cafeOrders, setCafeOrders] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [donations, setDonations] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Form Addition Inputs
  const [newCourse, setNewCourse] = useState({ code: '', name: '', description: '', credits: 3 });
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: 'Computer Science', total_copies: 5 });
  const [newAsset, setNewAsset] = useState({ name: '', category: 'IT Equipment', quantity: 1, location: '', status: 'active' });
  const [newCafeItem, setNewCafeItem] = useState({ name: '', description: '', price: '', category: 'meal', is_available: true });
  const [newInvoice, setNewInvoice] = useState({ user_id: '', title: '', amount: '', due_date: '' });
  const [newPayroll, setNewPayroll] = useState({ employee_id: '', role: '', salary: '', pay_date: '' });
  const [newAlumni, setNewAlumni] = useState({ name: '', email: '', graduation_year: '', company: '', job_title: '', skills: '', is_mentor: true });
  
  // Toast feedback
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // WebSockets for real-time notifications
  useEffect(() => {
    if (!token) return;
    
    // Connect WS
    const ws = new WebSocket(API_BASE.replace('http', 'ws'));
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    };
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'notification') {
        setNotifications((prev) => [msg.data, ...prev]);
        showFeedback('info', `Notification: ${msg.data.title}`);
      }
    };
    
    return () => ws.close();
  }, [token]);

  // Click Telemetry tracking hook
  useEffect(() => {
    const handleTelemetryClick = (e) => {
      const btn = e.target.closest('button, a, [role="button"], input[type="submit"]');
      if (!btn) return;
      const elementId = btn.id || btn.innerText.trim().substring(0, 30) || btn.tagName;
      fetch(`${API_BASE}/api/devops/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementId, page: `Admin Portal - Tab: ${activeTab}` })
      }).catch(() => {});
    };
    window.addEventListener('click', handleTelemetryClick);
    return () => window.removeEventListener('click', handleTelemetryClick);
  }, [activeTab]);

  // Load active tab data
  useEffect(() => {
    if (!token) return;
    loadTabData();
  }, [token, activeTab, dateFilter]);

  const loadTabData = () => {
    setFeedback({ type: '', msg: '' });
    if (activeTab === 'dashboard') {
      fetchList('/api/academics/courses', setCourses);
      fetchList('/api/finance/invoices', setInvoices);
      fetchList('/api/inventory/assets', setAssets);
      fetchList('/api/alumni/donations', setDonations);
      fetchList('/api/notifications', setNotifications);
    } else if (activeTab === 'academics') {
      fetchList('/api/academics/courses', setCourses);
      fetchList('/api/academics/classes', setClasses);
    } else if (activeTab === 'finance') {
      fetchList('/api/finance/invoices', setInvoices);
      fetchList('/api/finance/payroll', setPayroll);
    } else if (activeTab === 'library') {
      fetchList('/api/library/books', setBooks);
      fetchList('/api/library/borrows', setBorrows);
    } else if (activeTab === 'assets') {
      fetchList('/api/inventory/assets', setAssets);
    } else if (activeTab === 'cafe') {
      fetchList('/api/cafe/menu', setCafeMenu);
      fetchList('/api/cafe/orders', setCafeOrders);
    } else if (activeTab === 'parking-alumni') {
      fetchList('/api/alumni/directory', setAlumni);
      fetchList('/api/alumni/donations', setDonations);
      fetchList('/api/parking/slots', setParkingSlots);
    } else if (activeTab === 'users') {
      fetchList('/api/users', setUsers);
      fetchList('/api/users/activities', setActivities);
      fetchList(`/api/users/attendance?date=${dateFilter}`, setAttendance);
    }
  };

  const fetchList = async (path, setter) => {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setter(data);
      }
    } catch (err) {
      console.error(`Error loading ${path}:`, err);
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  const handlePost = async (path, body, successMsg, callback) => {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showFeedback('success', successMsg);
        if (callback) callback();
        loadTabData();
      } else {
        const err = await res.json();
        showFeedback('danger', err.error || 'Operation failed');
      }
    } catch (e) {
      showFeedback('danger', 'Network error');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/cafe/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: orderId, status })
      });
      if (res.ok) {
        showFeedback('success', `Order status updated to: ${status}`);
        loadTabData();
      }
    } catch (e) {
      showFeedback('danger', 'Network error');
    }
  };

  const updateAssetStatus = async (assetId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/assets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: assetId, status })
      });
      if (res.ok) {
        showFeedback('success', 'Asset condition updated');
        loadTabData();
      }
    } catch (e) {
      showFeedback('danger', 'Network error');
    }
  };

  const triggerUpdateStatus = async (userId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showFeedback('success', `User status updated to ${status}`);
        loadTabData();
      } else {
        const err = await res.json();
        showFeedback('danger', err.error || 'Failed to update status');
      }
    } catch (e) {
      showFeedback('danger', 'Network error');
    }
  };

  const triggerDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showFeedback('success', 'User deleted successfully');
        loadTabData();
      } else {
        const err = await res.json();
        showFeedback('danger', err.error || 'Failed to delete user');
      }
    } catch (e) {
      showFeedback('danger', 'Network error');
    }
  };

  const triggerGeneratePDF = async (title, subtitle, headers, rows, themeColor = "#3b82f6") => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          subtitle,
          theme_color: themeColor,
          headers,
          rows,
          summary: [
            { label: "Report Date", value: new Date().toLocaleDateString() },
            { label: "Record Count", value: rows.length.toString() }
          ]
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showFeedback('success', 'PDF Report generated!');
      } else {
        showFeedback('danger', 'Failed to generate report PDF');
      }
    } catch (e) {
      showFeedback('danger', 'Report microservice unavailable');
    }
  };

  if (!token) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ASST Admin
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '1px' }}>Control Panel</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard
          </button>
          <button className={`btn ${activeTab === 'academics' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('academics')}>
            🎓 Academics
          </button>
          <button className={`btn ${activeTab === 'finance' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('finance')}>
            💵 Finance & Fees
          </button>
          <button className={`btn ${activeTab === 'library' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('library')}>
            📚 Library
          </button>
          <button className={`btn ${activeTab === 'assets' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('assets')}>
            🔬 Assets & Labs
          </button>
          <button className={`btn ${activeTab === 'cafe' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('cafe')}>
            🍔 Cafeteria
          </button>
          <button className={`btn ${activeTab === 'parking-alumni' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('parking-alumni')}>
            🚗 Parking & Alumni
          </button>
          <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('users')}>
            👥 Users & Logs
          </button>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Logged in as: <strong style={{ color: 'var(--text-main)' }}>{user?.firstName}</strong>
          </div>
          <button className="btn btn-danger" style={{ width: '100%', padding: '8px' }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content animate-fade">
        {feedback.msg && (
          <div className={`badge badge-${feedback.type}`} style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', borderRadius: '12px', zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontSize: '14px' }}>
            {feedback.msg}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage 
            courses={courses} 
            invoices={invoices} 
            assets={assets} 
            donations={donations} 
            notifications={notifications} 
          />
        )}
        {activeTab === 'academics' && (
          <AcademicsPage 
            courses={courses} 
            classes={classes} 
            newCourse={newCourse} 
            setNewCourse={setNewCourse} 
            handlePost={handlePost} 
          />
        )}
        {activeTab === 'finance' && (
          <FinancePage 
            invoices={invoices} 
            payroll={payroll} 
            newInvoice={newInvoice} 
            setNewInvoice={setNewInvoice} 
            newPayroll={newPayroll} 
            setNewPayroll={setNewPayroll} 
            handlePost={handlePost} 
          />
        )}
        {activeTab === 'library' && (
          <LibraryPage 
            books={books} 
            borrows={borrows} 
            newBook={newBook} 
            setNewBook={setNewBook} 
            handlePost={handlePost} 
          />
        )}
        {activeTab === 'assets' && (
          <AssetsPage 
            assets={assets} 
            newAsset={newAsset} 
            setNewAsset={setNewAsset} 
            updateAssetStatus={updateAssetStatus} 
            handlePost={handlePost} 
          />
        )}
        {activeTab === 'cafe' && (
          <CafePage 
            cafeMenu={cafeMenu} 
            cafeOrders={cafeOrders} 
            newCafeItem={newCafeItem} 
            setNewCafeItem={setNewCafeItem} 
            updateOrderStatus={updateOrderStatus} 
            handlePost={handlePost} 
          />
        )}
        {activeTab === 'parking-alumni' && (
          <ParkingAlumniPage 
            alumni={alumni} 
            donations={donations} 
            parkingSlots={parkingSlots} 
            newAlumni={newAlumni} 
            setNewAlumni={setNewAlumni} 
            handlePost={handlePost} 
          />
        )}
        {activeTab === 'users' && (
          <UsersPage 
            users={users} 
            activities={activities} 
            attendance={attendance}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            handlePost={handlePost} 
            triggerUpdateStatus={triggerUpdateStatus} 
            triggerDeleteUser={triggerDeleteUser} 
            triggerGeneratePDF={triggerGeneratePDF}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
