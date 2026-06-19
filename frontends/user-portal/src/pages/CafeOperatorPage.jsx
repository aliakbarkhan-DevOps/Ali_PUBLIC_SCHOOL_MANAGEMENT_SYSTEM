import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';

export const CafeOperatorPage = ({
  users = [],
  cafeMenu,
  cafeOrders,
  cafeGroceries,
  handlePost,
  triggerUpdateOrderStatus,
  triggerUpdateGroceryStatus,
  triggerGeneratePDF
}) => {
  const [newMenu, setNewMenu] = useState({
    name: '',
    description: '',
    price: '',
    category: 'meal',
    is_available: true
  });

  const [newGrocery, setNewGrocery] = useState({
    item_name: '',
    quantity: '',
    status: 'needed'
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const handleMenuSubmit = (e) => {
    e.preventDefault();
    if (!newMenu.name || !newMenu.price) return;
    handlePost('/api/cafe/menu', {
      name: newMenu.name,
      description: newMenu.description,
      price: parseFloat(newMenu.price),
      category: newMenu.category,
      is_available: newMenu.is_available
    }, 'Menu item added successfully!', () => {
      setNewMenu({ name: '', description: '', price: '', category: 'meal', is_available: true });
    });
  };

  const handleGrocerySubmit = (e) => {
    e.preventDefault();
    if (!newGrocery.item_name || !newGrocery.quantity) return;
    handlePost('/api/cafe/groceries', newGrocery, 'Grocery item added!', () => {
      setNewGrocery({ item_name: '', quantity: '', status: 'needed' });
    });
  };

  const handleGenerateBill = () => {
    if (!selectedCustomerId) return;
    const customer = users.find(u => u.id === parseInt(selectedCustomerId));
    if (!customer) return;

    const customerOrders = cafeOrders.filter(o => o.user_id === customer.id);
    if (customerOrders.length === 0) {
      alert(`No order history found for ${customer.firstName} ${customer.lastName}`);
      return;
    }

    const headers = ['Order ID', 'Items Description', 'Total Price', 'Status', 'Date'];
    const rows = customerOrders.map(o => {
      const parsedItems = JSON.parse(o.items || '[]');
      const desc = parsedItems.map(itm => `${itm.name} x${itm.quantity}`).join(', ');
      return [
        `#${o.id}`,
        desc,
        `$${o.total_price.toFixed(2)}`,
        o.status.toUpperCase(),
        o.order_date
      ];
    });

    triggerGeneratePDF(
      'ASST Cafeteria Invoice',
      `Invoice statement of accounts for customer: ${customer.firstName} ${customer.lastName} (${customer.email})`,
      headers,
      rows,
      '#10b981'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>🍔 Cafeteria Control Portal</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage orders, update menus, and monitor kitchen grocery inventory</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px', alignItems: 'start' }}>
        {/* Orders Management */}
        <GlassCard style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>🛒 Active Dining Orders</h2>
          <DataTable headers={['Order ID', 'Student ID', 'Items Ordered', 'Total Cost', 'Status', 'Actions']}>
            {cafeOrders.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>No orders placed today.</td>
              </tr>
            ) : (
              cafeOrders.map(o => {
                const parsed = JSON.parse(o.items || '[]');
                return (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>#{o.id}</td>
                    <td>Student #{o.user_id}</td>
                    <td>
                      {parsed.map((itm, i) => (
                        <div key={i} style={{ fontSize: '13px' }}>• {itm.name} x{itm.quantity}</div>
                      ))}
                    </td>
                    <td style={{ fontWeight: '600' }}>${o.total_price.toFixed(2)}</td>
                    <td>
                      <Badge type={o.status === 'completed' ? 'success' : o.status === 'ready' ? 'blue' : 'warning'}>
                        {o.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {o.status === 'pending' && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }} 
                            onClick={() => triggerUpdateOrderStatus(o.id, 'ready')}
                          >
                            Mark Ready
                          </button>
                        )}
                        {o.status === 'ready' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--color-green)', borderColor: 'var(--color-green)' }} 
                            onClick={() => triggerUpdateOrderStatus(o.id, 'completed')}
                          >
                            Complete Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </DataTable>
        </GlassCard>

        {/* Generate Customer Bill */}
        <GlassCard style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>🧾 Generate Customer Bill</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Select Customer</label>
              <select 
                value={selectedCustomerId} 
                onChange={e => setSelectedCustomerId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
              >
                <option value="">-- Choose User --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role.toUpperCase()})</option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '10px' }}
              onClick={handleGenerateBill}
              disabled={!selectedCustomerId}
            >
              📄 Generate Cafe Bill PDF
            </button>
          </div>
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Menu Management */}
        <GlassCard style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>📋 Menu & Pricing</h2>
          <form onSubmit={handleMenuSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Food name..." 
              value={newMenu.name}
              onChange={e => setNewMenu(p => ({ ...p, name: e.target.value }))}
              style={{ flex: '1 1 180px' }}
              required 
            />
            <input 
              type="number" 
              step="0.01" 
              placeholder="Price..." 
              value={newMenu.price}
              onChange={e => setNewMenu(p => ({ ...p, price: e.target.value }))}
              style={{ width: '90px' }}
              required 
            />
            <select 
              value={newMenu.category} 
              onChange={e => setNewMenu(p => ({ ...p, category: e.target.value }))}
              style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="meal">Meal</option>
              <option value="beverage">Beverage</option>
              <option value="snack">Snack</option>
            </select>
            <input 
              type="text" 
              placeholder="Description..." 
              value={newMenu.description}
              onChange={e => setNewMenu(p => ({ ...p, description: e.target.value }))}
              style={{ flex: '1 1 100%' }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Menu Item</button>
          </form>

          <DataTable headers={['Item', 'Type', 'Price', 'Status']}>
            {cafeMenu.map(m => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong><br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.description}</span></td>
                <td>{m.category.toUpperCase()}</td>
                <td>${m.price.toFixed(2)}</td>
                <td>
                  <Badge type={m.is_available ? 'success' : 'danger'}>
                    {m.is_available ? 'Available' : 'Sold Out'}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </GlassCard>

        {/* Groceries Management */}
        <GlassCard style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>🥦 Kitchen Groceries & Stock</h2>
          <form onSubmit={handleGrocerySubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input 
              type="text" 
              placeholder="Item (e.g. Fresh Milk)..." 
              value={newGrocery.item_name}
              onChange={e => setNewGrocery(p => ({ ...p, item_name: e.target.value }))}
              style={{ flex: 2 }}
              required 
            />
            <input 
              type="text" 
              placeholder="Qty (e.g. 10 Litres)..." 
              value={newGrocery.quantity}
              onChange={e => setNewGrocery(p => ({ ...p, quantity: e.target.value }))}
              style={{ flex: 1 }}
              required 
            />
            <button type="submit" className="btn btn-primary">Add</button>
          </form>

          <DataTable headers={['Grocery Item', 'Quantity Required', 'Status', 'Mark Done']}>
            {cafeGroceries.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>No groceries listed.</td>
              </tr>
            ) : (
              cafeGroceries.map(g => (
                <tr key={g.id}>
                  <td><strong>{g.item_name}</strong></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{g.quantity}</td>
                  <td>
                    <Badge type={g.status === 'purchased' ? 'success' : 'warning'}>
                      {g.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    {g.status === 'needed' ? (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--color-green)', borderColor: 'var(--color-green)' }}
                        onClick={() => triggerUpdateGroceryStatus(g.id, 'purchased')}
                      >
                        ✓ Purchased
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => triggerUpdateGroceryStatus(g.id, 'needed')}
                      >
                        Re-open
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </GlassCard>
      </div>
    </div>
  );
};
