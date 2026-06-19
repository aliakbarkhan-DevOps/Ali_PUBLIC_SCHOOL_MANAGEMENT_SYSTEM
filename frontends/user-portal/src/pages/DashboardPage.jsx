import React from 'react';
import { GlassCard } from '../components/ui/GlassCard';

export const DashboardPage = ({ user, wallet, invoices, timetables, notifications, borrows = [], parkingSlots = [], todayAttendance = null, triggerCheckin }) => {
  const isStudent = user?.role === 'student';

  // Calculate consolidated bills
  const unpaidTuition = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.amount, 0);
  const libraryFines = borrows.reduce((sum, b) => sum + (b.fine_amount || 0), 0);
  const activeParkingSpot = parkingSlots.find(s => s.allocated_to === user?.id)?.slot_code || 'None';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Welcome, {user?.firstName}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>ASST Science and Technology Student/Teacher Portal Dashboard</p>
        </div>
        {/* Attendance card */}
        <GlassCard style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Daily Attendance</span>
            {todayAttendance ? (
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-green)' }}>
                ✓ Present ({new Date(todayAttendance.checkinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
              </span>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-red)' }}>Not Checked-In</span>
            )}
          </div>
          {!todayAttendance && (
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={triggerCheckin}>
              Check-In Present
            </button>
          )}
        </GlassCard>
      </div>

      {isStudent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '32px' }}>
          {/* Main metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <GlassCard style={{ padding: '24px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>CAFETERIA CARD BALANCE</span>
              <h3 style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>${wallet.balance.toFixed(2)}</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-green)', marginTop: '8px' }}>Cafe Card Active</p>
            </GlassCard>
            <GlassCard style={{ padding: '24px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>FINANCIAL DUES</span>
              <h3 style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>
                {invoices.filter(i => i.status === 'unpaid').length} Outstanding
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-red)', marginTop: '8px' }}>Tuition Invoices</p>
            </GlassCard>
            <GlassCard style={{ padding: '24px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>WEEKLY LECTURES</span>
              <h3 style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>{timetables.length} Classes</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-blue)', marginTop: '8px' }}>Mon - Fri Timetable</p>
            </GlassCard>
          </div>

          {/* Consolidated bills summary */}
          <GlassCard style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>💳 Consolidated Bills Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', borderLeft: '4px solid var(--color-red)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TUITION OUTSTANDING</span>
                <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>${unpaidTuition.toFixed(2)}</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', borderLeft: '4px solid var(--color-purple)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LIBRARY FINES</span>
                <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>${libraryFines.toFixed(2)}</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', borderLeft: '4px solid var(--color-blue)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PARKING RESERVE SPOT</span>
                <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>{activeParkingSpot}</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', borderLeft: '4px solid var(--color-green)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NET CAMPUS DUES</span>
                <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>${(unpaidTuition + libraryFines).toFixed(2)}</div>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <GlassCard style={{ padding: '24px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>TEACHING TIMETABLE</span>
            <h3 style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>{timetables.length} Lectures</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-green)', marginTop: '8px' }}>All slots active</p>
          </GlassCard>
          <GlassCard style={{ padding: '24px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>DEPARTMENT DESIGNATION</span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginTop: '16px' }}>{user?.profileDetails?.designation || 'Professor'}</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-purple)', marginTop: '8px' }}>{user?.profileDetails?.department || 'Science & Tech'}</p>
          </GlassCard>
        </div>
      )}

      <GlassCard style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>📢 Broadcast Announcements</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-dark)' }}>No active campus notifications.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `4px solid var(--color-blue)` }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>{n.title}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{n.message}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>{new Date(n.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
};
