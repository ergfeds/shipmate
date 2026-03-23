import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Anchor, Mail, Phone, MapPin, Clock, ExternalLink, Link as LinkIcon } from 'lucide-react';
import './Footer.css';

function SettingVal({ settingKey, fallback = '' }) {
  const settings = useQuery(api.settings.getAll);
  if (!settings) return fallback;
  const found = settings.find(s => s.key === settingKey);
  return found?.value || fallback;
}

const FOOTER_LINKS = {
  'Quick Links': [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Our Services', to: '/services' },
    { label: 'Track Shipment', to: '/track' },
    { label: 'Book a Shipment', to: '/book' },
  ],
  'Account': [
    { label: 'Sign In', to: '/login' },
    { label: 'Register', to: '/register' },
    { label: 'My Dashboard', to: '/dashboard' },
    { label: 'Notifications', to: '/notifications' },
  ],
  'Legal': [
    { label: 'Terms & Conditions', to: '/terms' },
    { label: 'Privacy Policy', to: '/privacy' },
  ],
};

const SOCIAL_LABELS = {
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
};

export default function Footer() {
  const settings = useQuery(api.settings.getAll);
  const getVal = (key, fallback = '') => settings?.find(s => s.key === key)?.value || fallback;

  const socials = ['twitter', 'linkedin', 'facebook', 'instagram'].map(s => ({
    key: s,
    url: getVal(`social_${s}`),
    label: SOCIAL_LABELS[s],
  })).filter(s => s.url);

  return (
    <footer className="footer">
      <div className="footer-bg-orbs">
        <div className="orb orb-teal" style={{ width: 400, height: 400, top: -100, left: -100, opacity: 0.12 }} />
      </div>
      <div className="container">
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon"><Anchor size={18} strokeWidth={2.5} /></div>
              <span className="footer-logo-text">Ship<span>Mate</span></span>
            </Link>
            <p className="footer-tagline">{getVal('company_tagline', 'Global Logistics, Delivered with Precision')}</p>
            {socials.length > 0 && (
              <div className="footer-socials">
                {socials.map(({ key, url, label }) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label={label} title={label}>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="footer-col">
              <h4 className="footer-col-title">{group}</h4>
              <ul>
                {links.map(({ label, to }) => (
                  <li key={to}>
                    <Link to={to} className="footer-link">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contact</h4>
            <div className="footer-contact-items">
              {getVal('contact_email') && (
                <a href={`mailto:${getVal('contact_email')}`} className="footer-contact-item">
                  <Mail size={14} /> {getVal('contact_email')}
                </a>
              )}
              {getVal('contact_phone') && (
                <a href={`tel:${getVal('contact_phone')}`} className="footer-contact-item">
                  <Phone size={14} /> {getVal('contact_phone')}
                </a>
              )}
              {getVal('contact_address') && (
                <div className="footer-contact-item">
                  <MapPin size={14} /> {getVal('contact_address')}
                </div>
              )}
              {getVal('contact_hours') && (
                <div className="footer-contact-item">
                  <Clock size={14} /> {getVal('contact_hours')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-text">
            © {new Date().getFullYear()} {getVal('company_name', 'ShipMate')}. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <Link to="/terms">Terms</Link>
            <span>·</span>
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
