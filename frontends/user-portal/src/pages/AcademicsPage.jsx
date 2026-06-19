import React from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { DataTable } from '../components/ui/DataTable';

export const AcademicsPage = ({ user, timetables, marks, markAttendance, setMarkAttendance, uploadMark, setUploadMark, handlePost, triggerGeneratePDF }) => {
  const isStudent = user?.role === 'student';

  const exportTranscriptPDF = () => {
    const headers = ['Exam Title', 'Course Module', 'Graded Score', 'Max Score', 'Graded At'];
    const rows = marks.map(m => [
      m.exam_title,
      m.course_name,
      m.score.toString(),
      m.max_score.toString(),
      new Date(m.graded_at).toLocaleDateString()
    ]);
    triggerGeneratePDF('ASST Academic Transcript', `Official Academic Transcript for Student: ${user.firstName} ${user.lastName} (${user.email})`, headers, rows, '#3b82f6');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <GlassCard style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>📅 Weekly Class Timetable</h2>
        <DataTable headers={['Day', 'Lecture Title', 'Time Slot', 'Location Room']}>
          {timetables.map(t => (
            <tr key={t.id}>
              <td><strong>{t.day_of_week}</strong></td>
              <td>{t.course_name}</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{t.start_time} - {t.end_time}</td>
              <td>{t.room}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>

      {isStudent ? (
        <GlassCard style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>📝 Academic Transcript (Grades & Exams)</h2>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={exportTranscriptPDF}>
              📄 Download PDF Transcript
            </button>
          </div>
          <DataTable headers={['Exam Name', 'Course Module', 'Graded Score', 'Max Score', 'Graded At']}>
            {marks.map(m => (
              <tr key={m.id}>
                <td><strong>{m.exam_title}</strong></td>
                <td>{m.course_name}</td>
                <td style={{ fontWeight: '700', color: 'var(--color-green)' }}>{m.score}</td>
                <td>{m.max_score}</td>
                <td>{new Date(m.graded_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </DataTable>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          <GlassCard style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Mark Student Attendance</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handlePost('/api/schedule/attendance', markAttendance, 'Student attendance recorded!');
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Class / Module</label>
                <select value={markAttendance.class_id} onChange={e => setMarkAttendance({ ...markAttendance, class_id: parseInt(e.target.value) })}>
                  <option value={1}>CS-101 (Intro to CS)</option>
                  <option value={2}>CS-402 (AI & Neural Nets)</option>
                  <option value={3}>PHYS-301 (Quantum Mechanics)</option>
                  <option value={4}>BIO-201 (Genomics Lab)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Student User ID</label>
                <input type="number" value={markAttendance.student_id} onChange={e => setMarkAttendance({ ...markAttendance, student_id: parseInt(e.target.value) })} required />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Status</label>
                <select value={markAttendance.status} onChange={e => setMarkAttendance({ ...markAttendance, status: e.target.value })}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Submit Log</button>
            </form>
          </GlassCard>
          
          <GlassCard style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Upload Exam Grade</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handlePost('/api/academics/marks', {
                exam_id: parseInt(uploadMark.exam_id),
                student_id: parseInt(uploadMark.student_id),
                score: parseFloat(uploadMark.score),
                max_score: parseFloat(uploadMark.max_score),
                grader_id: user.id
              }, 'Grade uploaded successfully!', () => {
                setUploadMark({ exam_id: 1, student_id: 3, score: '', max_score: 100 });
              });
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Exam Title ID</label>
                <select value={uploadMark.exam_id} onChange={e => setUploadMark({ ...uploadMark, exam_id: parseInt(e.target.value) })}>
                  <option value={1}>Python Midterm</option>
                  <option value={2}>Neural Net Final Project</option>
                  <option value={3}>Quantum Mechanics Exam 1</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Student User ID</label>
                <input type="number" value={uploadMark.student_id} onChange={e => setUploadMark({ ...uploadMark, student_id: parseInt(e.target.value) })} required />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Score</label>
                <input type="number" step="0.1" value={uploadMark.score} onChange={e => setUploadMark({ ...uploadMark, score: e.target.value })} placeholder="e.g. 92.5" required />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Max Score</label>
                <input type="number" value={uploadMark.max_score} onChange={e => setUploadMark({ ...uploadMark, max_score: parseInt(e.target.value) })} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Upload Marks</button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
