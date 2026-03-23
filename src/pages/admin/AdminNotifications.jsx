import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useQuery as useConvexQuery } from 'convex/react';
import { Bell, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminNotifications() {
  const notifications = useQuery(api.notifications.getAll) || [];
  const users = useQuery(api.users.getAll) || [];
  const send = useMutation(api.notifications.send);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', title: '', message: '', type: 'system' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.title || !form.message) { toast.error('Title and message required'); return; }
    setLoading(true);
    try {
      await send({
        userId: form.userId || undefined,
        title: form.title,
        message: form.message,
        type: form.type,
        sendToAll: !form.userId,
      });
      toast.success(form.userId ? 'Notification sent to user' : 'Notification broadcast to all users');
      setShowForm(false);
      setForm({ userId: '', title: '', message: '', type: 'system' });
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt).slice(0, 40);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-h2" style={{ marginBottom: 4 }}>Notifications</h1>
          <p className="text-sm">Manage and send user notifications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Send size={15} /> Send Notification
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'hsla(220,65%,4%,0.85)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: 480, borderRadius: 'var(--radius-xl)', padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="text-h3">Send Notification</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--clr-slate-400)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Recipient</label>
                <select className="form-select" value={form.userId} onChange={e => set('userId', e.target.value)}>
                  <option value="">📢 Broadcast to ALL Users</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="system">System</option>
                  <option value="shipment_update">Shipment Update</option>
                  <option value="promotion">Promotion</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-textarea" rows={3} value={form.message} onChange={e => set('message', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSend} disabled={loading} style={{ flex: 1 }}>
                  {loading ? <><div className="spinner" /> Sending...</> : <><Send size={14} /> Send</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '20px', overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Message</th><th>Type</th><th>User</th><th>Read</th><th>Date</th></tr></thead>
            <tbody>
              {sorted.map(n => (
                <tr key={n._id}>
                  <td style={{ fontWeight: 600, color: 'var(--clr-white)', fontSize: '0.85rem' }}>{n.title}</td>
                  <td className="text-xs" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</td>
                  <td><span className="badge badge-neutral badge-sm">{n.type}</span></td>
                  <td className="text-xs">{n.userId ? users.find(u => u._id === n.userId)?.name || '—' : 'All Users'}</td>
                  <td><span className={`badge badge-sm ${n.isRead ? 'badge-success' : 'badge-neutral'}`}>{n.isRead ? 'Read' : 'Unread'}</span></td>
                  <td className="text-xs">{format(new Date(n.createdAt), 'MMM dd, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--clr-slate-400)' }}>No notifications found.</div>}
        </div>
      </div>
    </div>
  );
}
