import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Plane, Ship, Truck, PawPrint, Box, AlertTriangle, Thermometer, Maximize } from 'lucide-react';
import './Services.css';

const SERVICES = [
  {
    icon: Plane, label: 'Air Freight', color: 'teal', img: '/service-air.png',
    desc: 'When time is critical, our air freight solutions deliver. We operate with 150+ airline partners to move your cargo across 190 countries with speed and reliability. From same-day express to economy air, every consignment is tracked in real time.',
    features: ['Express & economy options', 'Door-to-door delivery', 'Dangerous goods certified', 'Live temperature monitoring'],
  },
  {
    icon: Ship, label: 'Sea Freight', color: 'gold', img: '/service-sea.png',
    desc: 'Our ocean freight solutions offer unmatched capacity and cost efficiency. Whether you need a Full Container Load (FCL) or Less than Container Load (LCL), we handle port clearance, documentation, and customs end-to-end.',
    features: ['FCL & LCL options', 'Port-to-port or door-to-door', 'Reefer container available', 'Real-time vessel tracking'],
  },
  {
    icon: Truck, label: 'Road Freight', color: 'teal', img: '/service-road.png',
    desc: 'Across continents, our fleet of modern freight trucks moves your cargo with GPS-tracked precision. Whether cross-border high-value freight or overland bulk cargo, our road network spans major arterial routes globally.',
    features: ['24/7 GPS fleet tracking', 'Full & part load options', 'Cross-border expertise', 'Refrigerated transport'],
  },
  {
    icon: PawPrint, label: 'Live Animal Transport', color: 'gold', img: '/service-animals.png',
    desc: 'We are IATA-certified specialists in live animal transportation. From thoroughbred racehorses and exotic birds to livestock and aquatic species — every animal is transported under expert veterinary supervision with climate-controlled, purpose-built stalls.',
    features: ['IATA LIVE certified', 'Veterinary supervision', 'Climate-controlled stalls', 'Equine & exotic specialists'],
  },
  {
    icon: Box, label: 'Courier & Parcel', color: 'teal', img: null,
    desc: 'From small packages to multi-parcel shipments, our global courier network ensures your parcels arrive on time with full proof-of-delivery and real-time tracking.',
    features: ['Door-to-door service', 'Signature on delivery', 'Real-time notifications', 'Worldwide coverage'],
  },
  {
    icon: AlertTriangle, label: 'Hazardous Goods', color: 'gold', img: null,
    desc: 'Certified handling for IMDG, IATA DGR and ADR regulated cargo. Our dangerous goods specialists manage classification, packaging, documentation, and transport compliance.',
    features: ['IATA DGR & IMDG certified', 'Proper labelling & documentation', 'Specialist vehicles', 'Full regulatory compliance'],
  },
];

export default function Services() {
  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <section className="services-hero">
          <div className="container">
            <div className="section-label"><span>Our Services</span></div>
            <h1 className="text-hero" style={{ marginBottom: 20 }}>
              Every Freight <span className="text-gold">Need,</span><br />One Partner
            </h1>
            <p className="text-body" style={{ maxWidth: 560, fontSize: '1.1rem' }}>
              From the smallest parcel to a herd of horses — Cargo Parcel Express has the specialists,
              infrastructure and reach to move it safely and punctually anywhere on earth.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="services-list">
              {SERVICES.map(({ icon: Icon, label, color, img, desc, features }, i) => (
                <div key={label} className={`service-detail-card ${i % 2 === 1 ? 'reverse' : ''}`}>
                  {img && (
                    <div className="service-detail-img">
                      <img src={img} alt={label} loading="lazy" />
                      <div className="service-detail-img-grad" />
                    </div>
                  )}
                  {!img && <div className="service-detail-no-img">
                    <div className={`svc-icon-lg svc-icon-${color}`}><Icon size={64} strokeWidth={1} /></div>
                  </div>}
                  <div className="service-detail-body">
                    <div className={`service-icon service-icon-${color}`} style={{ marginBottom: 16 }}>
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <h2 className="text-h2" style={{ marginBottom: 16 }}>{label}</h2>
                    <p className="text-body" style={{ marginBottom: 24 }}>{desc}</p>
                    <ul className="service-features">
                      {features.map(f => (
                        <li key={f}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8l3.5 3.5L13 4.5" stroke="hsl(40,95%,52%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
