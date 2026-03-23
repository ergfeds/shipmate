import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { MessageSquare, CheckCircle2, X, Clock } from 'lucide-react';

const STATUS_COLORS = { new: 'warning', read: 'neutral', resolved: 'success' };

export default function AdminContacts() {
  const contacts = useQuery(api.contact.getAll) || [];
  const markResolved = useMutation(api.contact.markResolved);
  const [viewing, setViewing] = useState(null);

  const sorted = [...contacts].sort((a, b) => b.createdAt - a.createdAt);
  const newCount = contacts.filter(c => c.status === 'new').length;

  const handleResolve = async (id) => {
    try {
      await markResolved({ contactId: id });
      toast.success('Marked as resolved');
      if (viewing?._id === id) setViewing(v => ({ ...v, status: 'resolved' }));
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-h2" style={{ marginBottom: 4 }}>Contact Inquiries</h1>
          <p className="text-sm">{newCount} new · {contacts.length} total</p>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '20px', overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => (
                <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => setViewing(c)}>
                  <td style={{ fontWeight: 600, color: 'var(--clr-white)', fontSize: '0.85rem' }}>{c.name}</td>
                  <td className="text-sm" style={{ maxWidth: 200 }}>{c.subject}</td>
                  <td className="text-xs">{c.email}</td>
                  <td>
                    <span className={`badge badge-${STATUS_COLORS[c.status] || 'neutral'} badge-sm`}>{c.status}</span>
                  </td>
                  <td className="text-xs">{format(new Date(c.createdAt), 'MMM dd, yyyy')}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {c.status !== 'resolved' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleResolve(c._id)}>
                        <CheckCircle2 size={13} /> Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--clr-slate-400)' }}>No contact inquiries found.</div>}
        </div>
      </div>

      {/* View modal */}
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'hsla(220,65%,4%,0.85)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: 560, borderRadius: 'var(--radius-xl)', padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <span className={`badge badge-${STATUS_COLORS[viewing.status] || 'neutral'} badge-sm`} style={{ marginBottom: 8 }}>{viewing.status}</span>
                <h2 className="text-h3">{viewing.subject}</h2>
              </div>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: 'var(--clr-slate-400)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className="text-xs">From: <strong style={{ color: 'var(--clr-white)' }}>{viewing.name}</strong></span>
                <span className="text-xs">·</span>
                <a href={`mailto:${viewing.email}`} className="text-xs" style={{ color: 'var(--clr-gold-400)' }}>{viewing.email}</a>
                {viewing.phone && <><span className="text-xs">·</span><span className="text-xs">{viewing.phone}</span></>}
              </div>
              <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={11} /> {format(new Date(viewing.createdAt), 'MMMM dd, yyyy · HH:mm')}
              </div>
            </div>
            <div style={{ background: 'hsla(222,55%,10%,0.8)', border: '1px solid hsla(0,0%,100%,0.07)', borderRadius: 'var(--radius-md)', padding: '16px 20px', lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--clr-slate-200)', marginBottom: 24 }}>
              {viewing.message}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={`mailto:${viewing.email}?subject=Re: ${encodeURIComponent(viewing.subject)}`} className="btn btn-primary" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>
                Reply via Email
              </a>
              {viewing.status !== 'resolved' && (
                <button className="btn btn-ghost" onClick={() => handleResolve(viewing._id)}>
                  <CheckCircle2 size={15} /> Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
