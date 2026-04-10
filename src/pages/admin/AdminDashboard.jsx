import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Package, Users, MessageSquare, Bell, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const shipments = useQuery(api.shipments.getAll) || [];
  const users = useQuery(api.users.getAll) || [];
  const contacts = useQuery(api.contact.getAll) || [];
  const notifications = useQuery(api.notifications.getAll) || [];

  const stats = [
    { label: 'Total Shipments', value: shipments.length, icon: Package, color: 'gold' },
    { label: 'Registered Users', value: users.length, icon: Users, color: 'teal' },
    { label: 'New Inquiries', value: contacts.filter(c => c.status === 'new').length, icon: MessageSquare, color: 'warning' },
    { label: 'Notifications Sent', value: notifications.length, icon: Bell, color: 'neutral' },
  ];

  const recent = [...shipments].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  const statusBreakdown = {
    'In Transit': shipments.filter(s => s.status === 'In Transit').length,
    'Pending': shipments.filter(s => s.status === 'Pending').length,
    'Delivered': shipments.filter(s => s.status === 'Delivered').length,
    'On Hold': shipments.filter(s => s.status === 'On Hold').length,
  };

  return (
    <div>
      <h1 className="text-h2" style={{ marginBottom: 4 }}>Admin Dashboard</h1>
      <p className="text-sm" style={{ marginBottom: 32 }}>Overview of all Velox Global Cargo operations</p>

      {/* Stats */}
      <div className="grid-4 stagger" style={{ marginBottom: 32 }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div className="text-xs">{label}</div>
              <div style={{ width: 34, height: 34, background: 'var(--grad-gold)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-navy-950)' }}>
                <Icon size={15} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--clr-white)', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'flex-start' }}>
        {/* Recent shipments */}
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 className="text-h3">Recent Shipments</h2>
            <Link to="/admin/shipments" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tracking</th><th>From → To</th><th>Mode</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recent.map(s => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--clr-gold-400)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.04em', fontFamily: 'var(--font-serif)' }}>{s.trackingNumber}</td>
                    <td className="text-sm">{s.senderCity} → {s.receiverCity}</td>
                    <td><span className="badge badge-neutral badge-sm">{s.shippingMode}</span></td>
                    <td><StatusBadge status={s.status} size="sm" /></td>
                    <td className="text-xs">{format(new Date(s.createdAt), 'MMM dd')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '24px' }}>
          <h2 className="text-h3" style={{ marginBottom: 20 }}>Status Overview</h2>
          {Object.entries(statusBreakdown).map(([status, count]) => (
            <div key={status} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <StatusBadge status={status} size="sm" />
                <span className="text-xs">{count}</span>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: 'hsla(0,0%,100%,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: 'var(--grad-gold)', width: `${shipments.length ? (count / shipments.length * 100) : 0}%`, transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
