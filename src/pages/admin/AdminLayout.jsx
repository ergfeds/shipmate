import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Anchor, LayoutDashboard, Package, Users, Bell, Settings, MessageSquare,
  LogOut, Menu, X, ChevronRight, Shield, Headset
} from 'lucide-react';
import GlobalCallListener from '../../components/GlobalCallListener';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/shipments', label: 'Shipments', icon: Package },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/contacts', label: 'Contacts', icon: MessageSquare },
  { to: '/admin/live', label: 'Live Support', icon: Headset },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-logo">
          <Link to="/admin" className="admin-logo-link">
            <div className="admin-logo-icon"><Anchor size={18} strokeWidth={2.5} /></div>
            <div>
              <div className="admin-logo-text">Cargo Parcel Express</div>
              <div className="admin-logo-sub">Admin Panel</div>
            </div>
          </Link>
        </div>

        <div className="admin-nav-label">Navigation</div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              <ChevronRight size={13} className="admin-nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="admin-user-name">{user?.name}</div>
              <div className="admin-user-role"><Shield size={10} /> Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button className="show-mobile admin-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ flex: 1 }} />
          <Link to="/" className="btn btn-ghost btn-sm">← View Site</Link>
        </header>
        <div className="admin-content page-enter">
          <Outlet />
        </div>
      </div>
      <GlobalCallListener />
    </div>
  );
}
