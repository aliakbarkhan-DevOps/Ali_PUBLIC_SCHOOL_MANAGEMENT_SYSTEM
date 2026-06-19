import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';

export const LibrarianPage = ({
  books,
  borrows,
  handlePost,
  triggerReturnBook
}) => {
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    total_copies: 5
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || !newBook.isbn) return;
    handlePost('/api/library/books', {
      ...newBook,
      total_copies: parseInt(newBook.total_copies)
    }, 'Book successfully cataloged!', () => {
      setNewBook({ title: '', author: '', isbn: '', category: 'Computer Science', total_copies: 5 });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>📚 Library Management Portal</h1>
        <p style={{ color: 'var(--text-muted)' }}>Catalog new literature, track copies, and register checked-out book returns</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px', alignItems: 'start' }}>
        {/* Book Catalog */}
        <GlassCard style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>📖 Current Catalog</h2>
          <DataTable headers={['Book Details', 'Category', 'ISBN', 'Copies Available']}>
            {books.map(b => (
              <tr key={b.id}>
                <td>
                  <strong>{b.title}</strong><br/>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {b.author}</span>
                </td>
                <td>{b.category}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{b.isbn}</td>
                <td>
                  <Badge type={b.available_copies > 0 ? 'success' : 'danger'}>
                    {b.available_copies} / {b.total_copies} Left
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </GlassCard>

        {/* Add Book Form */}
        <GlassCard style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>⚡ Catalog Book</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Book Title</label>
              <input 
                type="text" 
                value={newBook.title}
                onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))}
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Author</label>
              <input 
                type="text" 
                value={newBook.author}
                onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))}
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>ISBN Code</label>
              <input 
                type="text" 
                value={newBook.isbn}
                onChange={e => setNewBook(p => ({ ...p, isbn: e.target.value }))}
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Total Copies</label>
              <input 
                type="number" 
                value={newBook.total_copies}
                onChange={e => setNewBook(p => ({ ...p, total_copies: e.target.value }))}
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
              <select 
                value={newBook.category} 
                onChange={e => setNewBook(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Physics">Physics</option>
                <option value="Genomics">Genomics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Literature">Literature</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Register Book</button>
          </form>
        </GlassCard>
      </div>

      {/* Checked-out Books loan tracker */}
      <GlassCard style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>📋 Checked-out Book Registries</h2>
        <DataTable headers={['Loan ID', 'Student ID', 'Book Checked Out', 'Checked Out On', 'Due Date', 'Fine Status', 'Actions']}>
          {borrows.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>No active books borrowed.</td>
            </tr>
          ) : (
            borrows.map(b => (
              <tr key={b.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>#{b.id}</td>
                <td>Student #{b.user_id}</td>
                <td><strong>{b.book_title}</strong></td>
                <td>{b.borrow_date}</td>
                <td>{b.due_date}</td>
                <td>
                  {b.fine_amount > 0 ? (
                    <Badge type="danger">${b.fine_amount.toFixed(2)} Overdue</Badge>
                  ) : b.return_date ? (
                    <Badge type="success">Returned</Badge>
                  ) : (
                    <Badge type="success">On Time</Badge>
                  )}
                </td>
                <td>
                  {!b.return_date && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--color-green)', borderColor: 'var(--color-green)' }} 
                      onClick={() => triggerReturnBook(b.id)}
                    >
                      Process Return
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </GlassCard>
    </div>
  );
};
