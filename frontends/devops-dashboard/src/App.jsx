import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5005';

function App() {
  const [activeTab, setActiveTab] = useState('health');
  const [healthSubTab, setHealthSubTab] = useState('topology'); // 'grid' or 'topology'
  const [healthData, setHealthData] = useState([]);
  const [trafficLogs, setTrafficLogs] = useState([]);
  const [clickMetrics, setClickMetrics] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab]);

  const loadData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    try {
      if (activeTab === 'health') {
        const res = await fetch(`${API_BASE}/api/devops/health`);
        if (res.ok) {
          const data = await res.json();
          setHealthData(data);
        }
      } else if (activeTab === 'traffic') {
        const res = await fetch(`${API_BASE}/api/devops/traffic`);
        if (res.ok) {
          const data = await res.json();
          setTrafficLogs(data);
        }
      } else if (activeTab === 'clicks') {
        const res = await fetch(`${API_BASE}/api/devops/metrics`);
        if (res.ok) {
          const data = await res.json();
          setClickMetrics(data);
        }
      }
    } catch (e) {
      console.error('Failed to query devops telemetry data:', e);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagRunning(true);
    await loadData();
    setTimeout(() => {
      setDiagRunning(false);
    }, 1000);
  };

  // Helper stats for traffic
  const totalRequests = trafficLogs.length;
  const avgLatency = totalRequests 
    ? Math.round(trafficLogs.reduce((sum, log) => sum + log.response_time, 0) / totalRequests)
    : 0;
  const maxLatency = totalRequests
    ? Math.max(...trafficLogs.map(log => log.response_time))
    : 0;
  const totalBytesTransferred = trafficLogs.reduce((sum, log) => sum + (log.payload_size || 0), 0);

  // Helper stats for click metrics
  const uniqueCities = [...new Set(clickMetrics.map(m => m.city))].length;
  const mostClickedElement = clickMetrics.reduce((acc, curr) => {
    acc[curr.element_id] = (acc[curr.element_id] || 0) + 1;
    return acc;
  }, {});
  const topClickedElement = Object.keys(mostClickedElement).length
    ? Object.keys(mostClickedElement).reduce((a, b) => mostClickedElement[a] > mostClickedElement[b] ? a : b)
    : 'None';

  // Helper mapping to check service status by name
  const getServiceStatus = (name) => {
    const service = healthData.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
    return service ? service.status === 'UP' : false;
  };

  const getServiceLatency = (name) => {
    const service = healthData.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
    return service && service.status === 'UP' ? `${service.latency}ms` : 'offline';
  };

  const isGatewayUp = getServiceStatus('Gateway');
  const isDbUp = getServiceStatus('Database');

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="glow-dot glow-green pulse-active" style={{ width: '12px', height: '12px' }}></div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-mono)' }}>
              ASST DevOps
            </h2>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginTop: '4px' }}>
            Diagnostics Hub
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            className={`btn ${activeTab === 'health' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-mono)' }} 
            onClick={() => setActiveTab('health')}
          >
            🩺 System Health Grid
          </button>
          <button 
            className={`btn ${activeTab === 'traffic' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-mono)' }} 
            onClick={() => setActiveTab('traffic')}
          >
            📈 Gateway Flow Logs
          </button>
          <button 
            className={`btn ${activeTab === 'clicks' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-mono)' }} 
            onClick={() => setActiveTab('clicks')}
          >
            🌍 Geolocation Metrics
          </button>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto Refresh (5s)</span>
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ width: '36px', height: '20px', cursor: 'pointer' }}
            />
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '8px', fontSize: '13px' }} 
            onClick={() => loadData(false)}
            disabled={loading}
          >
            {loading ? 'Fetching...' : '🔄 Sync Telemetry'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
              {activeTab === 'health' && '🖥️ Microservices Status Grid'}
              {activeTab === 'traffic' && '📬 Live Network Flow logs'}
              {activeTab === 'clicks' && '🌍 User Click Geolocation Metrics'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              {activeTab === 'health' && 'Real-time telemetry pings for distributed system services'}
              {activeTab === 'traffic' && 'Gateway traffic analysis capturing payload sizes, latencies, and responses'}
              {activeTab === 'clicks' && 'Interactive geographical telemetry mapping clicks and client actions'}
            </p>
          </div>
          {activeTab === 'health' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`btn ${healthSubTab === 'topology' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '13px', padding: '8px 16px' }}
                onClick={() => setHealthSubTab('topology')}
              >
                🗺️ Connection Topology
              </button>
              <button 
                className={`btn ${healthSubTab === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '13px', padding: '8px 16px' }}
                onClick={() => setHealthSubTab('grid')}
              >
                📊 Service Grid
              </button>
              <button 
                className="btn btn-primary" 
                onClick={runDiagnostics}
                disabled={diagRunning}
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                {diagRunning ? 'Testing pings...' : '⚡ Diagnostics'}
              </button>
            </div>
          )}
        </header>

        {/* Tab content */}
        {activeTab === 'health' && (
          <div>
            {healthSubTab === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {healthData.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Running health checks...' : 'No health data available.'}
                  </div>
                ) : (
                  healthData.map((service, index) => {
                    const isUp = service.status === 'UP';
                    return (
                      <div key={index} className="glass-panel" style={{ padding: '24px', borderLeft: `4px solid ${isUp ? 'var(--color-green)' : 'var(--color-red)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <strong style={{ fontSize: '16px', fontWeight: '600' }}>{service.name}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className={`glow-dot ${isUp ? 'glow-green' : 'glow-red'}`}></span>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: isUp ? 'var(--color-green)' : 'var(--color-red)' }}>
                              {service.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                          <div>URL: <code className="font-code" style={{ color: 'var(--text-main)' }}>{service.url}</code></div>
                          <div>Tech Stack: <strong style={{ color: 'var(--text-main)' }}>{service.tech}</strong></div>
                          <div>Internal Port: <code className="font-code" style={{ color: 'var(--text-main)' }}>{service.port}</code></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <span>Round-trip latency:</span>
                            <strong style={{ color: isUp ? 'var(--color-cyan)' : 'var(--color-red)', fontFamily: 'var(--font-mono)' }}>
                              {isUp ? `${service.latency}ms` : 'Offline'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Live Connection Topology View */
              <div className="glass-panel" style={{ padding: '40px', minHeight: '550px', position: 'relative', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '32px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                  📡 ASST Infrastructure Connectivity Map
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: '900px', height: '400px', position: 'relative' }}>
                  
                  {/* Layer 1: Frontends */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', zIndex: 10 }}>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', marginBottom: '-20px' }}>Frontends</h4>
                    
                    {/* Admin Portal Node */}
                    <div style={{ width: '180px', padding: '16px', background: 'rgba(10, 15, 30, 0.95)', border: `1px solid ${isGatewayUp ? 'var(--color-green)' : 'var(--color-red)'}`, borderRadius: '10px', boxShadow: `0 0 10px ${isGatewayUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PORT 3000</span>
                        <span className={`glow-dot ${isGatewayUp ? 'glow-green' : 'glow-red'}`}></span>
                      </div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>🖥️ Admin Portal</strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-dark)' }}>Client SPA (Vite)</span>
                    </div>

                    {/* Campus Portal Node */}
                    <div style={{ width: '180px', padding: '16px', background: 'rgba(10, 15, 30, 0.95)', border: `1px solid ${isGatewayUp ? 'var(--color-green)' : 'var(--color-red)'}`, borderRadius: '10px', boxShadow: `0 0 10px ${isGatewayUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PORT 3001</span>
                        <span className={`glow-dot ${isGatewayUp ? 'glow-green' : 'glow-red'}`}></span>
                      </div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>🖥️ Campus Portal</strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-dark)' }}>Client SPA (Vite)</span>
                    </div>

                    {/* DevOps Portal Node */}
                    <div style={{ width: '180px', padding: '16px', background: 'rgba(10, 15, 30, 0.95)', border: '1px solid var(--color-cyan)', borderRadius: '10px', boxShadow: '0 0 10px rgba(6,182,212,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PORT 3002</span>
                        <span className="glow-dot glow-green"></span>
                      </div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-cyan)' }}>🖥️ DevOps Portal</strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-dark)' }}>Diagnostics Hub</span>
                    </div>
                  </div>

                  {/* Connective Line Overlay from Frontends to Gateway */}
                  <div style={{ position: 'absolute', left: '180px', top: '150px', width: '120px', height: '2px', backgroundColor: isGatewayUp ? 'var(--color-green)' : 'var(--color-red)', zIndex: 1, opacity: 0.4 }}></div>
                  <div style={{ position: 'absolute', left: '180px', top: '250px', width: '120px', height: '2px', backgroundColor: isGatewayUp ? 'var(--color-green)' : 'var(--color-red)', zIndex: 1, opacity: 0.4 }}></div>

                  {/* Layer 2: API Gateway & Postgres DB */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', zIndex: 10, position: 'relative' }}>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', marginBottom: '-30px' }}>Gateway & Store</h4>

                    {/* API Gateway Node */}
                    <div style={{ width: '200px', padding: '20px', background: 'rgba(15, 23, 42, 0.95)', border: `2px solid ${isGatewayUp ? 'var(--color-cyan)' : 'var(--color-red)'}`, borderRadius: '12px', boxShadow: `0 0 15px ${isGatewayUp ? 'rgba(6,182,212,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-cyan)', fontWeight: '700' }}>REVERSE PROXY</span>
                        <span className={`glow-dot ${isGatewayUp ? 'glow-green' : 'glow-red'}`}></span>
                      </div>
                      <strong style={{ fontSize: '14px', display: 'block' }}>🛡️ Express API Gateway</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Port 5005 • {isGatewayUp ? getServiceLatency('Gateway') : 'offline'}</span>
                    </div>

                    {/* Connective Link from Gateway to Postgres */}
                    <div style={{ position: 'absolute', left: '90px', top: '100px', width: '2px', height: '80px', backgroundColor: isDbUp ? 'var(--color-green)' : 'var(--color-red)', zIndex: 1, opacity: 0.4 }}></div>

                    {/* Postgres Database Node */}
                    <div style={{ width: '200px', padding: '16px', background: 'rgba(10, 15, 30, 0.95)', border: `1px solid ${isDbUp ? 'var(--color-green)' : 'var(--color-red)'}`, borderRadius: '10px', boxShadow: `0 0 10px ${isDbUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PORT 5432</span>
                        <span className={`glow-dot ${isDbUp ? 'glow-green' : 'glow-red'}`}></span>
                      </div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>🗄️ PostgreSQL Auth DB</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isDbUp ? getServiceLatency('Database') : 'offline'}</span>
                    </div>
                  </div>

                  {/* Connective Line Overlay from Gateway to Microservices */}
                  <div style={{ position: 'absolute', left: '500px', top: '180px', width: '120px', height: '2px', backgroundColor: 'var(--color-cyan)', zIndex: 1, opacity: 0.2 }}></div>

                  {/* Layer 3: Backend Microservices List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '10px', zIndex: 10 }}>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', marginBottom: '4px' }}>Backend Services</h4>
                    
                    {[
                      { key: 'Academic', label: '🎓 Academic Service', port: 8081, tech: 'Go' },
                      { key: 'Scheduling', label: '📅 Scheduling Service', port: 8082, tech: 'Go' },
                      { key: 'Library', label: '📚 Library Service', port: 8083, tech: 'Go' },
                      { key: 'Finance', label: '💵 Finance Service', port: 8084, tech: 'Go' },
                      { key: 'Inventory', label: '🔬 Inventory Service', port: 8085, tech: 'Go' },
                      { key: 'Cafe', label: '🍔 Cafe Service', port: 8086, tech: 'Go' },
                      { key: 'Assignment', label: '📝 Assignment/Quiz', port: 8001, tech: 'Python' },
                      { key: 'Research', label: '🔬 Research & Labs', port: 8002, tech: 'Python' },
                      { key: 'Parking', label: '🚗 Parking & Alumni', port: 8003, tech: 'Python' },
                      { key: 'Report', label: '📄 Report Service', port: 8004, tech: 'Python' },
                    ].map((svc) => {
                      const isSvcUp = getServiceStatus(svc.key);
                      return (
                        <div 
                          key={svc.port} 
                          style={{ 
                            width: '240px', 
                            padding: '10px 14px', 
                            background: 'rgba(10, 15, 30, 0.85)', 
                            border: `1px solid ${isSvcUp ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '13px'
                          }}
                        >
                          <div>
                            <strong style={{ display: 'block' }}>{svc.label}</strong>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Port {svc.port} • {svc.tech}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: isSvcUp ? 'var(--color-cyan)' : 'var(--color-red)', fontFamily: 'var(--font-mono)' }}>
                              {isSvcUp ? getServiceLatency(svc.key) : 'offline'}
                            </span>
                            <span className={`glow-dot ${isSvcUp ? 'glow-green' : 'glow-red'}`}></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Stats Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transactions Tracked</span>
                <h3 style={{ fontSize: '28px', fontWeight: '700', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>{totalRequests}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Latency</span>
                <h3 style={{ fontSize: '28px', fontWeight: '700', marginTop: '6px', color: 'var(--color-green)', fontFamily: 'var(--font-mono)' }}>{avgLatency}ms</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Latency Spike</span>
                <h3 style={{ fontSize: '28px', fontWeight: '700', marginTop: '6px', color: 'var(--color-yellow)', fontFamily: 'var(--font-mono)' }}>{maxLatency}ms</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payload Data volume</span>
                <h3 style={{ fontSize: '28px', fontWeight: '700', marginTop: '6px', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {(totalBytesTransferred / 1024).toFixed(2)} KB
                </h3>
              </div>
            </div>

            {/* Flow Logs Table */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>📬 Request Pipeline flow logs (Mutations & Queries)</h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Method</th>
                      <th>URL Request Path</th>
                      <th>Response Status</th>
                      <th>Payload Size</th>
                      <th>Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>
                          No traffic logs captured yet. Interacting with portals generates activity.
                        </td>
                      </tr>
                    ) : (
                      trafficLogs.map((log) => {
                        const statusClass = log.status_code >= 200 && log.status_code < 300 
                          ? 'badge-success' 
                          : log.status_code >= 300 && log.status_code < 400
                            ? 'badge-info'
                            : 'badge-danger';
                        return (
                          <tr key={log.id}>
                            <td className="font-code" style={{ color: 'var(--text-muted)' }}>
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td>
                              <span className={`badge ${log.method === 'GET' ? 'badge-info' : log.method === 'POST' ? 'badge-success' : 'badge-warning'}`}>
                                {log.method}
                              </span>
                            </td>
                            <td className="font-code" style={{ fontWeight: '600' }}>{log.path}</td>
                            <td>
                              <span className={`badge ${statusClass}`}>
                                HTTP {log.status_code}
                              </span>
                            </td>
                            <td className="font-code">{log.payload_size} bytes</td>
                            <td className="font-code" style={{ fontWeight: '700', color: log.response_time > 100 ? 'var(--color-red)' : 'var(--color-green)' }}>
                              {log.response_time}ms
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clicks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Click Metrics Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Telemetry Clicks</span>
                <h3 style={{ fontSize: '28px', fontWeight: '700', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>{clickMetrics.length}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unique Active Locations</span>
                <h3 style={{ fontSize: '28px', fontWeight: '700', marginTop: '6px', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>{uniqueCities} Cities</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Most Popular Click Option</span>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '16px', color: 'var(--color-purple)' }}>{topClickedElement}</h3>
              </div>
            </div>

            {/* Simulated Live World Map Grid & Telemetry Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', alignItems: 'start' }}>
              {/* Geolocation map nodes */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📍 Geolocation Coordinates</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', pr: '4px' }}>
                  {clickMetrics.length === 0 ? (
                    <span style={{ color: 'var(--text-dark)', fontSize: '13px' }}>No location pings mapped yet.</span>
                  ) : (
                    clickMetrics.map((m) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--color-cyan)' }}>
                        <span style={{ fontSize: '20px' }}>📍</span>
                        <div style={{ fontSize: '12px' }}>
                          <strong style={{ display: 'block', color: 'var(--text-main)' }}>{m.city}, {m.country}</strong>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>{parseFloat(m.latitude).toFixed(4)}°, {parseFloat(m.longitude).toFixed(4)}°</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Roster Click Metrics Table */}
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>🖱️ Frontend User Click Streams</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Clicked Element</th>
                        <th>Origin View / Portal</th>
                        <th>Client IP Address</th>
                        <th>Location Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clickMetrics.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>
                            No UI click telemetry tracked yet. Click buttons on other portals.
                          </td>
                        </tr>
                      ) : (
                        clickMetrics.map((m) => (
                          <tr key={m.id}>
                            <td className="font-code" style={{ color: 'var(--text-muted)' }}>
                              {new Date(m.created_at).toLocaleTimeString()}
                            </td>
                            <td>
                              <span className="badge badge-info" style={{ textTransform: 'none' }}>
                                {m.element_id}
                              </span>
                            </td>
                            <td>{m.page}</td>
                            <td className="font-code">{m.user_ip}</td>
                            <td>
                              <strong>{m.city}, {m.country}</strong>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
