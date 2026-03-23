import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Search, Shield, User2, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const users = useQuery(api.users.getAll) || [];
  const promote = useMutation(api.users.setRole);
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const handleRole = async (userId, newRole) => {
    try {
      await promote({ userId, role: newRole });
      toast.success(`Role updated to ${newRole}`);
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-h2" style={{ marginBottom: 4 }}>Users</h1>
          <p className="text-sm">{filtered.length} of {users.length} registered users</p>
        </div>
      </div>

      <div className="track-search-bar" style={{ maxWidth: 360, marginBottom: 20 }}>
        <Search size={15} color="var(--clr-slate-500)" />
        <input className="track-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--clr-slate-400)', cursor: 'pointer' }}><X size={14} /></button>}
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '20px', overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-navy-950)', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--clr-white)', fontSize: '0.85rem' }}>{u.name}</div>
                    </div>
                  </td>
                  <td className="text-sm">{u.email}</td>
                  <td className="text-xs">{u.phone || '—'}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-neutral'} badge-sm`}>
                      {u.role === 'admin' && <Shield size={10} />} {u.role}
                    </span>
                  </td>
                  <td className="text-xs">{format(new Date(u.createdAt), 'MMM dd, yyyy')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {u.role !== 'admin' ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRole(u._id, 'admin')}>
                          <Shield size={13} /> Make Admin
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRole(u._id, 'user')}>
                          <User2 size={13} /> Demote
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--clr-slate-400)' }}>No users found.</div>}
        </div>
      </div>
    </div>
  );
}
