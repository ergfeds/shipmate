import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Package, Plane, Ship, Truck, PawPrint, Globe, Shield, Clock,
  ArrowRight, Star, TrendingUp, MapPin, CheckCircle2, ChevronRight
} from 'lucide-react';
import './Home.css';

const STATS = [
  { label: 'Countries Served', value: '190+', icon: Globe },
  { label: 'Shipments Delivered', value: '2.8M+', icon: Package },
  { label: 'Client Satisfaction', value: '99.2%', icon: Star },
  { label: 'Years of Excellence', value: '18+', icon: Shield },
];

const SERVICES = [
  {
    icon: Plane, label: 'Air Freight', color: 'teal',
    desc: 'Express air cargo solutions connecting 190+ countries with guaranteed speed and security.',
    img: '/service-air.png',
  },
  {
    icon: Ship, label: 'Sea Freight', color: 'gold',
    desc: 'Full and Less-than-Container-Load ocean freight with real-time vessel tracking.',
    img: '/service-sea.png',
  },
  {
    icon: Truck, label: 'Road Freight', color: 'teal',
    desc: 'Door-to-door overland freight across continents with live GPS monitoring.',
    img: '/service-road.png',
  },
  {
    icon: PawPrint, label: 'Live Animals', color: 'gold',
    desc: 'IATA-certified animal transport with veterinary oversight and climate control.',
    img: '/service-animals.png',
  },
];

const WHY_US = [
  { icon: Shield, title: 'Fully Insured', desc: 'Every shipment covered by comprehensive cargo insurance.' },
  { icon: Clock, title: '24/7 Support', desc: 'Round-the-clock customer care across all time zones.' },
  { icon: Globe, title: 'Global Network', desc: 'Partnerships with 500+ carriers across 190 countries.' },
  { icon: CheckCircle2, title: 'Customs Experts', desc: 'In-house customs brokers to clear goods at every port.' },
  { icon: TrendingUp, title: 'Real-Time Tracking', desc: 'Live GPS and status updates at every stage of transit.' },
  { icon: MapPin, title: 'Door-to-Door', desc: 'Seamless pickup-to-delivery service worldwide.' },
];

function useCountUp(target, isVisible) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const num = parseInt(target.replace(/\D/g, ''));
    let start = 0;
    const dur = 2000;
    const step = dur / num;
    const timer = setInterval(() => {
      start += Math.ceil(num / 80);
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(start);
    }, step < 5 ? 5 : step);
    return () => clearInterval(timer);
  }, [isVisible]);
  return count;
}

function StatCard({ stat, isVisible }) {
  const { icon: Icon, label, value } = stat;
  const count = useCountUp(value, isVisible);
  const suffix = value.replace(/[\d.]/g, '');
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={22} strokeWidth={1.8} /></div>
      <div className="stat-value">{count.toLocaleString()}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Home() {
  const initSettings = useMutation(api.settings.init);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [trackInput, setTrackInput] = useState('');

  useEffect(() => { initSettings(); }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-bg">
          <img src="/hero.png" alt="ShipMate global logistics hub" className="hero-bg-img" />
          <div className="hero-bg-overlay" />
        </div>
        <div className="hero-orbs">
          <div className="orb orb-gold" style={{ width: 600, height: 600, top: -100, right: -100 }} />
          <div className="orb orb-teal" style={{ width: 500, height: 500, bottom: -100, left: -100, animationDelay: '3s' }} />
        </div>
        <div className="container hero-content">
          <div className="hero-badge fade-up">
            <div className="pulse-dot pulse-dot-green" />
            <span>Global Operations Active — 190+ Countries</span>
          </div>
          <h1 className="text-hero hero-title fade-up" style={{ animationDelay: '0.1s' }}>
            The World's Most<br />
            <span className="text-gold">Trusted Logistics</span><br />
            Partner
          </h1>
          <p className="hero-subtitle fade-up" style={{ animationDelay: '0.2s' }}>
            From a single parcel to an entire fleet of cargo — air, sea, road,
            and live animals. Delivered with precision, tracked in real time,
            insured every mile.
          </p>
          <div className="hero-actions fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/book" className="btn btn-primary btn-lg">
              <Package size={18} /> Book a Shipment
            </Link>
            <Link to="/track" className="btn btn-secondary btn-lg">
              <MapPin size={18} /> Track Your Cargo
            </Link>
          </div>

          {/* Quick Track */}
          <div className="hero-track-bar fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="hero-track-inner">
              <MapPin size={18} color="var(--clr-gold-400)" />
              <input
                type="text"
                placeholder="Enter tracking number (e.g. SHMJK2A4RP)"
                value={trackInput}
                onChange={e => setTrackInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && trackInput && (window.location.href = `/track/${trackInput}`)}
                className="hero-track-input"
                aria-label="Quick shipment tracker"
              />
              <Link
                to={trackInput ? `/track/${trackInput}` : '/track'}
                className="btn btn-primary"
                style={{ borderRadius: '10px', padding: '10px 20px' }}
              >
                Track <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-indicator">
          <div className="hero-scroll-mouse">
            <div className="hero-scroll-wheel" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="stats-grid stagger">
            {STATS.map((stat) => (
              <StatCard key={stat.label} stat={stat} isVisible={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section services-section">
        <div className="container">
          <div className="section-label"><span>What We Do</span></div>
          <div className="services-header">
            <h2 className="text-h1">Comprehensive Freight<br /><span className="text-gold">Solutions</span></h2>
            <p className="text-body" style={{ maxWidth: 440 }}>
              From urgent express air cargo to ocean container loads and specialized
              live animal transport — one partner for every freight need.
            </p>
          </div>
          <div className="services-grid stagger">
            {SERVICES.map(({ icon: Icon, label, color, desc, img }) => (
              <div key={label} className="service-card">
                <div className="service-card-img">
                  <img src={img} alt={label} loading="lazy" />
                  <div className="service-card-img-overlay" />
                </div>
                <div className="service-card-body">
                  <div className={`service-icon service-icon-${color}`}>
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3 className="text-h3">{label}</h3>
                  <p className="text-sm" style={{ lineHeight: 1.7 }}>{desc}</p>
                  <Link to="/services" className="service-link">
                    Learn more <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-section">
        <div className="container">
          <div className="section-label"><span>How It Works</span></div>
          <h2 className="text-h1" style={{ marginBottom: 64 }}>
            Ship Anything, <span className="text-gold">Anywhere</span>
          </h2>
          <div className="how-steps stagger">
            {[
              { n: '01', title: 'Book Online', desc: 'Fill in sender, receiver, and package details in our easy multi-step booking form.' },
              { n: '02', title: 'We Collect', desc: 'Our agents pick up your shipment from your door at the scheduled time.' },
              { n: '03', title: 'Track Live', desc: 'Follow your cargo in real-time on our interactive map at every stage.' },
              { n: '04', title: 'Delivered', desc: 'Your shipment arrives at its destination safely and on time.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="how-step">
                <div className="how-step-num">{n}</div>
                <h3 className="text-h3">{title}</h3>
                <p className="text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/book" className="btn btn-primary btn-lg">
              <Package size={18} /> Start Booking <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why ShipMate */}
      <section className="section why-section">
        <div className="container">
          <div className="why-header">
            <div>
              <div className="section-label"><span>Why Choose Us</span></div>
              <h2 className="text-h1">Built for the<br /><span className="text-gold">World's Demands</span></h2>
              <p className="text-body" style={{ maxWidth: 400, marginTop: 16 }}>
                18 years of operational excellence across every continent, every cargo type,
                every challenge.
              </p>
              <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                <Link to="/about" className="btn btn-primary">Our Story <ArrowRight size={15} /></Link>
                <Link to="/contact" className="btn btn-secondary">Get a Quote</Link>
              </div>
            </div>
            <div className="why-grid stagger">
              {WHY_US.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="why-card">
                  <div className="why-icon"><Icon size={18} strokeWidth={1.8} /></div>
                  <div>
                    <div className="why-title">{title}</div>
                    <div className="text-xs" style={{ marginTop: 4, lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-orb" />
            <div className="cta-content">
              <h2 className="text-h1">Ready to Ship <span className="text-gold">Worldwide?</span></h2>
              <p className="text-body" style={{ maxWidth: 500 }}>
                Join over 250,000 businesses that trust ShipMate to move their most important freight.
                Start your first booking in under 3 minutes.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
                <Link to="/book" className="btn btn-primary btn-lg"><Package size={18} /> Book Now</Link>
                <Link to="/contact" className="btn btn-secondary btn-lg">Talk to an Expert</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
