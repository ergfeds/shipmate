import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Anchor, Menu, X, ChevronDown, Bell, User2, LogOut,
  Package, LayoutDashboard, Shield, Globe, ChevronRight
} from 'lucide-react';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Services' },
  { to: '/track', label: 'Track' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="container navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" aria-label="Velox Global Cargo Home">
            <div className="navbar-logo-icon">
              <Anchor size={20} strokeWidth={2.5} />
            </div>
            <span className="navbar-logo-text">Velox Global<span> Cargo</span></span>
          </Link>

          {/* Desktop Links */}
          <div className="navbar-links hide-mobile" role="list">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                role="listitem"
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* CTA / User */}
          <div className="navbar-actions">
            <Link to="/book" className="btn btn-primary btn-sm hide-mobile">
              <Package size={15} /> Book Shipment
            </Link>

            {isLoggedIn ? (
              <div className="user-menu-wrap" ref={userMenuRef}>
                <button
                  className="user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="user-avatar">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hide-mobile">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="user-menu-dropdown" role="menu">
                    <div className="user-menu-header">
                      <div className="user-menu-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="user-menu-name">{user?.name}</div>
                        <div className="user-menu-email">{user?.email}</div>
                      </div>
                    </div>
                    <div className="divider" style={{ margin: '8px 0' }} />
                    <Link to="/dashboard" className="user-menu-item" role="menuitem">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link to="/notifications" className="user-menu-item" role="menuitem">
                      <Bell size={15} /> Notifications
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="user-menu-item user-menu-item-admin" role="menuitem">
                        <Shield size={15} /> Admin Panel
                      </Link>
                    )}
                    <div className="divider" style={{ margin: '8px 0' }} />
                    <button onClick={handleLogout} className="user-menu-item user-menu-logout" role="menuitem">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-sm hide-mobile">
                <User2 size={15} /> Sign In
              </Link>
            )}

            <button
              className="navbar-hamburger show-mobile"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}>
        {/* Drawer header */}
        <div className="mobile-drawer-header">
          <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
            <div className="navbar-logo-icon"><Anchor size={18} strokeWidth={2.5} /></div>
            <span className="navbar-logo-text">Velox Global<span> Cargo</span></span>
          </Link>
          <button className="mobile-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="mobile-drawer-inner">
          {isLoggedIn && (
            <div className="mobile-user-card">
              <div className="user-avatar" style={{ width:38, height:38, fontSize:'0.9rem' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700, color:'var(--clr-white)', fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize:'0.73rem', color:'var(--clr-slate-500)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
              </div>
            </div>
          )}

          <nav role="navigation" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              >
                <span>{link.label}</span>
                <ChevronRight size={15} className="mobile-nav-chevron" />
              </NavLink>
            ))}
          </nav>

          <div className="mobile-drawer-divider" />

          <div className="mobile-drawer-actions">
            <Link to="/book" className="btn btn-primary w-full">
              <Package size={16} /> Book Shipment
            </Link>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="btn btn-ghost w-full"><LayoutDashboard size={16} /> Dashboard</Link>
                {isAdmin && <Link to="/admin" className="btn btn-ghost w-full" style={{ color:'var(--clr-gold-400)' }}><Shield size={16} /> Admin Panel</Link>}
                <Link to="/notifications" className="btn btn-ghost w-full"><Bell size={16} /> Notifications</Link>
                <button onClick={handleLogout} className="btn btn-ghost w-full" style={{ color: 'hsl(357,78%,65%)' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary w-full"><User2 size={16} /> Sign In</Link>
                <Link to="/register" className="btn btn-ghost w-full"><User2 size={16} /> Create Account</Link>
              </>
            )}
          </div>
        </div>
      </div>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
