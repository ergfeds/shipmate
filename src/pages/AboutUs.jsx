import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle2, Globe, Shield, Users, TrendingUp } from 'lucide-react';

const MILESTONES = [
  { year: '2007', event: 'Velox Global Cargo founded in New York with regional road freight operations.' },
  { year: '2010', event: 'Expanded to international air freight. First 10,000 shipments milestone.' },
  { year: '2014', event: 'Launched live animal transport division — IATA certified.' },
  { year: '2018', event: 'Opened 45 global offices. Surpassed 1 million annual shipments.' },
  { year: '2021', event: 'Launched proprietary real-time tracking platform with live Mapbox integration.' },
  { year: '2025', event: 'Serving 190+ countries. 2.8 million shipments delivered annually.' },
];

const VALUES = [
  { icon: Shield, title: 'Integrity First', desc: 'Every commitment honoured. Every shipment treated with the utmost care and transparency.' },
  { icon: Globe, title: 'Borderless Thinking', desc: 'We operate without boundaries — building bridges between people, businesses and cultures.' },
  { icon: Users, title: 'People-Powered', desc: 'Our 14,000 global team members are the engine of every successful delivery.' },
  { icon: TrendingUp, title: 'Relentless Innovation', desc: 'We invest in technology and processes to continuously raise the bar for logistics.' },
];

export default function AboutUs() {
  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Hero */}
        <div style={{ background: 'var(--grad-hero)', padding: 'clamp(80px, 12vw, 140px) 0', borderBottom: '1px solid hsla(0,0%,100%,0.05)' }}>
          <div className="container">
            <div className="section-label"><span>About Velox Global Cargo</span></div>
            <h1 className="text-hero" style={{ maxWidth: 700, marginBottom: 20 }}>
              18 Years of <span className="text-gold">Delivering</span><br />on Our Promises
            </h1>
            <p className="text-body" style={{ maxWidth: 540, fontSize: '1.05rem' }}>
              Founded in 2007, Velox Global Cargo began as a regional freight company with a bold vision: to redefine
              what global logistics could look like. Today, we are the world's most trusted logistics partner —
              connecting 190 countries with precision, care, and technology.
            </p>
          </div>
        </div>

        {/* Warehouse Image */}
        <section className="section">
          <div className="container">
            <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid hsla(0,0%,100%,0.07)', height: 460 }}>
              <img src="/about-warehouse.png" alt="Velox Global Cargo state-of-the-art warehouse" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section" style={{ background: 'var(--clr-navy-900)', borderTop: '1px solid hsla(0,0%,100%,0.05)' }}>
          <div className="container">
            <div className="section-label"><span>Our Values</span></div>
            <h2 className="text-h1" style={{ marginBottom: 48 }}>What We <span className="text-gold">Stand For</span></h2>
            <div className="grid-4 stagger">
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ width: 44, height: 44, background: 'var(--grad-gold)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-navy-950)' }}>
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3 className="text-h3">{title}</h3>
                  <p className="text-sm" style={{ lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="section">
          <div className="container">
            <div className="section-label"><span>Our Journey</span></div>
            <h2 className="text-h1" style={{ marginBottom: 56 }}>A Legacy of <span className="text-gold">Excellence</span></h2>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <div className="timeline" style={{ paddingLeft: 40 }}>
                {MILESTONES.map(({ year, event }) => (
                  <div key={year} className="timeline-item completed">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--clr-gold-400)' }}>{year}</span>
                    </div>
                    <p className="text-body">{event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
