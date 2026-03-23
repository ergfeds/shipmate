import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import { Package, Bell, TrendingUp, Clock, ArrowRight, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const shipments = useQuery(api.shipments.getByUser, user ? { userId: user.userId } : 'skip') || [];
  const notifications = useQuery(api.notifications.getByUser, user ? { userId: user.userId } : 'skip') || [];
  const unread = notifications.filter(n => !n.isRead).length;

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'In Transit').length,
    delivered: shipments.filter(s => s.status === 'Delivered').length,
    pending: shipments.filter(s => s.status === 'Pending' || s.status === 'Awaiting Pickup').length,
  };

  const recentShipments = [...shipments].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }} className="page-enter">
        <div className="container" style={{ padding: '48px clamp(16px,4vw,48px)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
            <div>
              <div className="section-label"><span>My Dashboard</span></div>
              <h1 className="text-h1">Welcome back, <span className="text-gold">{user?.name?.split(' ')[0]}</span></h1>
              <p className="text-body" style={{ marginTop: 6 }}>Here's an overview of your shipments.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/notifications" className="btn btn-ghost" style={{ position: 'relative' }}>
                <Bell size={16} /> Notifications
                {unread > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--clr-crimson-500)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread}</span>}
              </Link>
              <Link to="/book" className="btn btn-primary"><Plus size={15} /> New Shipment</Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid-4 stagger" style={{ marginBottom: 40 }}>
            {[
              { label: 'Total Shipments', value: stats.total, icon: Package, color: 'gold' },
              { label: 'In Transit', value: stats.inTransit, icon: TrendingUp, color: 'teal' },
              { label: 'Delivered', value: stats.delivered, icon: TrendingUp, color: 'success' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'warning' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm">{label}</span>
                  <div style={{ width: 36, height: 36, background: 'var(--grad-gold)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-navy-950)' }}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--clr-white)', lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Recent Shipments */}
          <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="text-h3">Recent Shipments</h2>
              <Link to="/track" className="btn btn-ghost btn-sm"><Package size={14} /> Track All</Link>
            </div>
            {recentShipments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Package size={48} color="var(--clr-navy-700)" style={{ margin: '0 auto 16px' }} />
                <p className="text-body">No shipments yet.</p>
                <Link to="/book" className="btn btn-primary" style={{ marginTop: 16 }}><Plus size={15} /> Book Your First Shipment</Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tracking No.</th>
                      <th>Destination</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentShipments.map(s => (
                      <tr key={s._id}>
                        <td style={{ fontWeight: 700, color: 'var(--clr-gold-400)', fontFamily: 'var(--font-serif)', letterSpacing: '0.04em' }}>{s.trackingNumber}</td>
                        <td>{s.receiverCity}, {s.receiverCountry}</td>
                        <td><span className="badge badge-neutral">{s.packageType}</span></td>
                        <td><StatusBadge status={s.status} size="sm" /></td>
                        <td className="text-xs">{format(new Date(s.createdAt), 'MMM dd, yyyy')}</td>
                        <td>
                          <Link to={`/track/${s.trackingNumber}`} className="btn btn-ghost btn-sm">
                            Track <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
