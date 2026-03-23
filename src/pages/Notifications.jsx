import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Bell, Check, CheckCheck, Package, AlertCircle, Star, Settings } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  shipment_update: { icon: Package, color: 'teal' },
  system: { icon: Settings, color: 'neutral' },
  promotion: { icon: Star, color: 'gold' },
  alert: { icon: AlertCircle, color: 'error' },
};

export default function Notifications() {
  const { user } = useAuth();
  const notifications = useQuery(api.notifications.getByUser, user ? { userId: user.userId } : 'skip') || [];
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllRead({ userId: user.userId });
    toast.success('All notifications marked as read');
  };

  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt);
  const unreadCount = sorted.filter(n => !n.isRead).length;

  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }} className="page-enter">
        <div className="container" style={{ padding: '48px clamp(16px,4vw,48px)', maxWidth: 720 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="section-label"><span>Notifications</span></div>
              <h1 className="text-h1">Your Updates</h1>
            </div>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={handleMarkAll}>
                <CheckCheck size={15} /> Mark all read ({unreadCount})
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Bell size={56} color="var(--clr-navy-700)" style={{ margin: '0 auto 20px' }} />
              <h2 className="text-h2" style={{ color: 'var(--clr-slate-400)' }}>No notifications yet</h2>
              <p className="text-body" style={{ marginTop: 8 }}>Updates on your shipments will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map(n => {
                const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                const Icon = conf.icon;
                return (
                  <div
                    key={n._id}
                    className="card"
                    style={{
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      background: n.isRead ? 'hsla(222,55%,13%,0.5)' : 'hsla(222,55%,15%,0.9)',
                      borderColor: n.isRead ? 'hsla(0,0%,100%,0.05)' : 'hsla(0,0%,100%,0.1)',
                      cursor: 'pointer',
                    }}
                    onClick={() => !n.isRead && markRead({ notificationId: n._id })}
                  >
                    <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `hsla(${conf.color === 'teal' ? '187,82%,40%' : conf.color === 'gold' ? '40,95%,52%' : conf.color === 'error' ? '357,78%,52%' : '218,30%,45%'},0.12)`, color: conf.color === 'teal' ? 'var(--clr-teal-400)' : conf.color === 'gold' ? 'var(--clr-gold-400)' : conf.color === 'error' ? 'hsl(357,78%,65%)' : 'var(--clr-slate-300)' }}>
                      <Icon size={17} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ fontWeight: n.isRead ? 500 : 700, color: 'var(--clr-white)', fontSize: '0.9rem' }}>{n.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--clr-gold-400)' }} />}
                          <span className="text-xs">{format(new Date(n.createdAt), 'MMM dd, HH:mm')}</span>
                        </div>
                      </div>
                      <p className="text-sm" style={{ marginTop: 4, lineHeight: 1.6 }}>{n.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
