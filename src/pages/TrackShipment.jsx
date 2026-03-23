import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import { Search, Package, MapPin, Clock, ArrowRight, AlertCircle, CheckCircle2, Plane, Ship, Truck, User, Mail, Phone, Building2, AlertTriangle, XCircle, RotateCcw, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';
import './TrackShipment.css';

// ─── Milestone configuration ────────────────────────────────────────────────
const MILESTONE_STEPS = [
  { label: 'Order Confirmed', icon: CheckCircle2, step: 0 },
  { label: 'Picked Up',       icon: Package,      step: 1 },
  { label: 'In Transit',      icon: Truck,        step: 2 },
  { label: 'At Facility',     icon: Building2,    step: 3 },
  { label: 'Out for Delivery',icon: Truck,        step: 4 },
  { label: 'Delivered',       icon: PackageCheck, step: 5 },
];

const STATUS_TO_STEP = {
  'Pending': -1, 'Order Confirmed': 0, 'Awaiting Pickup': 0,
  'Picked Up': 1, 'In Transit': 2, 'On Hold': 2,
  'Arrived at Facility': 3, 'Customs Clearance in Progress': 3, 'Held at Customs': 3,
  'Out for Delivery': 4, 'Delivery Attempted': 4,
  'Delivered': 5, 'Delayed': 2, 'Exception': 2,
  'Returned to Sender': 5, 'Cancelled': -1,
};

const SPECIAL_STATUSES = {
  'On Hold':               { color: 'warning', icon: Clock,         message: 'Your shipment is currently on hold and will resume shortly.' },
  'Delayed':               { color: 'warning', icon: AlertTriangle, message: 'Your shipment is experiencing a delay. We apologize for the inconvenience.' },
  'Exception':             { color: 'error',   icon: AlertCircle,   message: 'An exception occurred with your shipment. Please contact support.' },
  'Held at Customs':       { color: 'warning', icon: AlertTriangle, message: 'Your shipment is held at customs. This is usually resolved within 2-5 business days.' },
  'Delivery Attempted':    { color: 'info',    icon: Clock,         message: 'Delivery was attempted but unsuccessful. Another attempt will be made.' },
  'Returned to Sender':    { color: 'error',   icon: RotateCcw,     message: 'Your shipment is being returned to the sender.' },
  'Cancelled':             { color: 'error',   icon: XCircle,       message: 'This shipment has been cancelled.' },
};

const SPECIAL_COLORS = {
  warning: { bg: 'hsla(38,90%,50%,0.1)', border: 'hsla(38,90%,50%,0.3)', text: 'var(--clr-warning)' },
  error:   { bg: 'hsla(357,78%,52%,0.1)', border: 'hsla(357,78%,52%,0.3)', text: 'var(--clr-error)' },
  info:    { bg: 'hsla(205,82%,50%,0.1)', border: 'hsla(205,82%,50%,0.3)', text: 'var(--clr-info)' },
};

function ShipmentMilestones({ status }) {
  const currentStep = STATUS_TO_STEP[status] ?? -1;
  const special = SPECIAL_STATUSES[status];
  const isTerminal = status === 'Cancelled' || status === 'Returned to Sender';

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Special status alert — only shows when active */}
      {special && (() => {
        const col = SPECIAL_COLORS[special.color];
        const Icon = special.icon;
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 14, background: col.bg, border: `1px solid ${col.border}`, marginBottom: 20 }}>
            <Icon size={18} color={col.text} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: col.text, fontSize: '0.9rem', marginBottom: 2 }}>{status}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--clr-slate-300)' }}>{special.message}</div>
            </div>
          </div>
        );
      })()}

      {/* Milestone progress bar */}
      {!isTerminal && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
          {MILESTONE_STEPS.map((step, idx) => {
            const done = currentStep > step.step;
            const active = currentStep === step.step;
            const upcoming = currentStep < step.step;
            const Icon = step.icon;
            const isLast = idx === MILESTONE_STEPS.length - 1;
            return (
              <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? '0 0 auto' : 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--clr-success)' : active ? 'var(--clr-gold-500)' : 'hsla(0,0%,100%,0.05)',
                    border: `2px solid ${done ? 'var(--clr-success)' : active ? 'var(--clr-gold-500)' : 'hsla(0,0%,100%,0.1)'}`,
                    boxShadow: active ? '0 0 0 4px hsla(40,95%,52%,0.2), 0 0 16px hsla(40,95%,52%,0.4)' : done ? '0 0 0 2px hsla(145,65%,38%,0.2)' : 'none',
                    transition: 'all 0.3s',
                    animation: active ? 'milestone-pulse 2s infinite' : 'none',
                  }}>
                    <Icon size={16} color={done ? '#fff' : active ? 'var(--clr-navy-950)' : 'var(--clr-slate-500)'} />
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: active ? 700 : 500, color: done ? 'var(--clr-success)' : active ? 'var(--clr-gold-400)' : 'var(--clr-slate-500)', marginTop: 6, textAlign: 'center', lineHeight: 1.3, maxWidth: 64, wordBreak: 'break-word' }}>
                    {step.label}
                  </div>
                </div>
                {!isLast && (
                  <div style={{ flex: 1, height: 2, marginTop: 19, background: done ? 'var(--clr-success)' : 'hsla(0,0%,100%,0.08)', transition: 'background 0.4s', minWidth: 12 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes milestone-pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsla(40,95%,52%,0.5), 0 0 16px hsla(40,95%,52%,0.4); }
          50% { box-shadow: 0 0 0 8px hsla(40,95%,52%,0), 0 0 24px hsla(40,95%,52%,0.2); }
        }
      `}</style>
    </div>
  );
}

function PartyInfoCard({ party, label, accentColor }) {
  return (
    <div style={{ flex: 1, background: 'hsla(0,0%,100%,0.03)', border: '1px solid hsla(0,0%,100%,0.07)', borderRadius: 16, padding: '18px 20px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: 10 }}>{party.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--clr-slate-400)' }}>
          <MapPin size={12} color={accentColor} style={{ flexShrink: 0 }} />
          <span>{party.address}, {party.city}, {party.country}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--clr-slate-400)' }}>
          <Mail size={12} color={accentColor} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{party.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--clr-slate-400)' }}>
          <Phone size={12} color={accentColor} style={{ flexShrink: 0 }} />
          <span>{party.phone}</span>
        </div>
      </div>
    </div>
  );
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

const MODE_ICONS = { 'Air Freight': Plane, 'Sea Freight': Ship, 'Road Freight': Truck, 'Express': Plane };

export default function TrackShipment() {
  const { trackingNumber: paramTracking } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(paramTracking || '');
  const [searched, setSearched] = useState(paramTracking || '');
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const shipment = useQuery(
    api.shipments.getByTracking,
    searched ? { trackingNumber: searched } : 'skip'
  );
  const history = useQuery(
    api.shipments.getStatusHistory,
    shipment ? { shipmentId: shipment._id } : 'skip'
  );

  useEffect(() => {
    if (paramTracking) { setInput(paramTracking); setSearched(paramTracking); }
  }, [paramTracking]);

  useEffect(() => {
    if (!shipment || !mapContainerRef.current) return;

    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [
        shipment.senderLng || 0,
        shipment.senderLat || 20,
      ],
      zoom: 2,
    });
    mapRef.current = map;

    map.on('load', () => {
      const origin = shipment.senderLng && shipment.senderLat ? [shipment.senderLng, shipment.senderLat] : null;
      const dest = shipment.receiverLng && shipment.receiverLat ? [shipment.receiverLng, shipment.receiverLat] : null;

      if (origin) {
        new mapboxgl.Marker({ color: '#f0b429' })
          .setLngLat(origin)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Origin</strong><br>${shipment.senderCity}, ${shipment.senderCountry}`))
          .addTo(map);
      }
      if (dest) {
        new mapboxgl.Marker({ color: '#3bb8c9' })
          .setLngLat(dest)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Destination</strong><br>${shipment.receiverCity}, ${shipment.receiverCountry}`))
          .addTo(map);
      }

      if (origin && dest) {
        let routeGeoJSON;
        if (['Air Freight', 'Sea Freight', 'Express'].includes(shipment.shippingMode)) {
          const from = turf.point(origin);
          const to   = turf.point(dest);
          routeGeoJSON = turf.greatCircle(from, to, { properties: {}, npoints: 100 });
        } else {
          routeGeoJSON = { type: 'Feature', geometry: { type: 'LineString', coordinates: [origin, dest] } };
        }

        /* ── Base route line (dim, static) ── */
        map.addSource('route', { type: 'geojson', data: routeGeoJSON });
        map.addLayer({
          id: 'route-bg',
          type: 'line',
          source: 'route',
          paint: { 'line-color': 'hsla(40,95%,52%,0.15)', 'line-width': 2 },
        });
        map.addLayer({
          id: 'route-dash',
          type: 'line',
          source: 'route',
          paint: { 'line-color': 'hsla(40,95%,52%,0.45)', 'line-width': 1.5, 'line-dasharray': [5, 4] },
        });

        /* ── Animated fiber-optic light ── */
        const lightPt = { type: 'Feature', geometry: { type: 'Point', coordinates: origin } };
        map.addSource('light-pos', { type: 'geojson', data: lightPt });

        map.addLayer({ id: 'light-outer', type: 'circle', source: 'light-pos',
          paint: { 'circle-radius': 20, 'circle-color': '#f0b429', 'circle-opacity': 0.08, 'circle-blur': 1 } });
        map.addLayer({ id: 'light-mid', type: 'circle', source: 'light-pos',
          paint: { 'circle-radius': 10, 'circle-color': '#f0b429', 'circle-opacity': 0.28, 'circle-blur': 0.6 } });
        map.addLayer({ id: 'light-core', type: 'circle', source: 'light-pos',
          paint: { 'circle-radius': 4.5, 'circle-color': '#ffffff', 'circle-opacity': 1, 'circle-blur': 0.15 } });

        /* ── Animate ── */
        const totalKm = turf.length(routeGeoJSON, { units: 'kilometers' });
        const STEPS   = 320;
        let step = 0;
        const animId = setInterval(() => {
          step = (step + 1) % STEPS;
          const km = (step / STEPS) * totalKm;
          try {
            const pt = turf.along(routeGeoJSON, km, { units: 'kilometers' });
            map.getSource('light-pos')?.setData(pt);
          } catch (_) {}
        }, 45);
        map._shipAnimId = animId;

        map.fitBounds([origin, dest], { padding: 80 });
      }

      if (shipment.currentLng && shipment.currentLat) {
        const locLabel = shipment.currentLocation
          ? shipment.currentLocation
          : `${shipment.senderCity}, ${shipment.senderCountry}`;
        new mapboxgl.Marker({ color: '#ffffff', scale: 0.9 })
          .setLngLat([shipment.currentLng, shipment.currentLat])
          .setPopup(new mapboxgl.Popup({ offset: 10 }).setHTML(
            `<div style="font-family:sans-serif;padding:2px 4px"><strong style="font-size:0.82rem">Current Location</strong><br><span style="font-size:0.78rem;color:#888">${locLabel}</span></div>`
          ))
          .addTo(map);
      }
    });

    return () => {
      if (mapRef.current) {
        if (mapRef.current._shipAnimId) clearInterval(mapRef.current._shipAnimId);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [shipment]);

  const handleSearch = () => {
    if (input.trim()) {
      setSearched(input.trim().toUpperCase());
      navigate(`/track/${input.trim().toUpperCase()}`);
    }
  };

  const ModeIcon = shipment ? (MODE_ICONS[shipment.shippingMode] || Package) : null;

  return (
    <div className="track-page page-enter">
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Hero */}
        <section className="track-hero">
          <div className="container">
            <div className="section-label"><span>Shipment Tracker</span></div>
            <h1 className="text-h1" style={{ marginBottom: 12 }}>
              Track Your <span className="text-gold">Shipment</span>
            </h1>
            <p className="text-body" style={{ marginBottom: 36, maxWidth: 480 }}>
              Enter your tracking number for real-time status updates and live map tracking.
            </p>
            <div className="track-search-bar">
              <Search size={18} color="var(--clr-slate-400)" />
              <input
                type="text"
                className="track-input"
                placeholder="e.g. SHMJK2A4RP"
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                aria-label="Tracking number"
              />
              <button onClick={handleSearch} className="btn btn-primary" disabled={!input.trim()}>
                Track <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        {searched && (
          <section className="section">
            <div className="container">
              {shipment === undefined && (
                <div className="track-loading">
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                  <p className="text-body">Fetching shipment data...</p>
                </div>
              )}
              {shipment === null && (
                <div className="track-not-found glass">
                  <AlertCircle size={48} color="hsl(357,78%,60%)" />
                  <h2 className="text-h2">Tracking Not Found</h2>
                  <p className="text-body">No shipment found for <strong style={{ color: 'var(--clr-white)' }}>{searched}</strong>. Please verify your tracking number.</p>
                  <Link to="/contact" className="btn btn-secondary">Contact Support</Link>
                </div>
              )}
              {shipment && (
                <div className="track-result stagger">
                  {/* Status Header */}
                  <div className="track-status-card glass">
                    <div className="track-status-top">
                      <div>
                        <div className="text-xs" style={{ marginBottom: 4 }}>Tracking Number</div>
                        <div className="track-number">{shipment.trackingNumber}</div>
                        <div style={{ marginTop: 10 }}>
                          <StatusBadge status={shipment.status} size="lg" />
                        </div>
                      </div>
                      {ModeIcon && (
                        <div className="track-mode-icon">
                          <ModeIcon size={28} strokeWidth={1.5} />
                          <span>{shipment.shippingMode}</span>
                        </div>
                      )}
                    </div>

                    {/* Milestone progress tracker */}
                    <div style={{ borderTop: '1px solid hsla(0,0%,100%,0.06)', paddingTop: 24 }}>
                      <div className="text-xs" style={{ marginBottom: 16, fontWeight: 600, color: 'var(--clr-slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shipping Progress</div>
                      <ShipmentMilestones status={shipment.status} />
                    </div>

                    <div className="track-route">
                      <div className="track-route-point">
                        <MapPin size={16} color="var(--clr-gold-400)" />
                        <div>
                          <div className="text-xs">Origin</div>
                          <div className="track-route-city">{shipment.senderCity}</div>
                          <div className="text-xs">{shipment.senderCountry}</div>
                          <div className="text-xs" style={{ color: 'var(--clr-slate-300)', marginTop: 4, fontWeight: 500 }}>{shipment.senderName}</div>
                        </div>
                      </div>
                      <div className="track-route-line">
                        <div className="track-route-dot" />
                        <div className="track-route-linebar" />
                        <div className="track-route-dot track-route-dot-dest" />
                      </div>
                      <div className="track-route-point">
                        <MapPin size={16} color="var(--clr-teal-400)" />
                        <div>
                          <div className="text-xs">Destination</div>
                          <div className="track-route-city">{shipment.receiverCity}</div>
                          <div className="text-xs">{shipment.receiverCountry}</div>
                          <div className="text-xs" style={{ color: 'var(--clr-slate-300)', marginTop: 4, fontWeight: 500 }}>{shipment.receiverName}</div>
                        </div>
                      </div>
                    </div>
                    <div className="track-meta">
                      <div className="track-meta-item">
                        <Clock size={13} />
                        <span>Pickup: {shipment.pickupDate}</span>
                      </div>
                      <div className="track-meta-item">
                        <Package size={13} />
                        <span>{shipment.packageType} · {shipment.weight}{shipment.weightUnit}</span>
                      </div>
                      <div className="track-meta-item">
                        <CheckCircle2 size={13} />
                        <span>Est. Delivery: {shipment.estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sender & Receiver Info Cards */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <PartyInfoCard
                      label="Sender"
                      accentColor="var(--clr-gold-400)"
                      party={{
                        name: shipment.senderName,
                        email: shipment.senderEmail,
                        phone: shipment.senderPhone,
                        address: shipment.senderAddress,
                        city: shipment.senderCity,
                        country: shipment.senderCountry,
                      }}
                    />
                    <PartyInfoCard
                      label="Recipient"
                      accentColor="var(--clr-teal-400)"
                      party={{
                        name: shipment.receiverName,
                        email: shipment.receiverEmail,
                        phone: shipment.receiverPhone,
                        address: shipment.receiverAddress,
                        city: shipment.receiverCity,
                        country: shipment.receiverCountry,
                      }}
                    />
                  </div>

                  {/* Map */}
                  <div className="track-map-wrap">
                    <div ref={mapContainerRef} className="track-map" style={{ height: 420 }} />
                  </div>

                  {/* Timeline */}
                  <div className="track-timeline-wrap glass">
                    <h3 className="text-h3" style={{ marginBottom: 28 }}>Shipment Journey</h3>
                    <div className="timeline">
                      {history?.map((item, i) => (
                        <div key={item._id} className={`timeline-item ${i === (history.length - 1) ? 'active' : 'completed'}`}>
                          <div className="timeline-node"></div>
                          <div className="timeline-content">
                            <div className="timeline-time">
                              {format(new Date(item.timestamp), 'MMM dd, yyyy · HH:mm')}
                            </div>
                            <div className="timeline-status">
                              <StatusBadge status={item.status} size="sm" />
                            </div>
                            {item.location && <div className="timeline-loc"><MapPin size={12} /> {item.location}</div>}
                            {item.note && <div className="timeline-note">{item.note}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {!searched && (
          <section className="section">
            <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
              <Package size={64} color="var(--clr-navy-700)" style={{ margin: '0 auto 24px' }} />
              <h2 className="text-h2" style={{ color: 'var(--clr-slate-400)' }}>Enter a tracking number above</h2>
              <p className="text-body" style={{ marginTop: 8 }}>Your shipment details will appear here.</p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
