import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { Package, User, MapPin, Calendar, CheckCircle2, ArrowRight, ArrowLeft, Loader } from 'lucide-react';
import './BookShipment.css';

const STEPS = [
  { n: 1, label: 'Sender', icon: User },
  { n: 2, label: 'Receiver', icon: MapPin },
  { n: 3, label: 'Package', icon: Package },
  { n: 4, label: 'Schedule', icon: Calendar },
  { n: 5, label: 'Confirm', icon: CheckCircle2 },
];

const PACKAGE_TYPES = ['Document','Parcel','Freight','Live Animal','Fragile','Hazardous','Perishable','Oversized'];
const SHIPPING_MODES = ['Air Freight','Sea Freight','Road Freight','Express'];

const INITIAL_FORM = {
  senderName: '', senderEmail: '', senderPhone: '', senderAddress: '', senderCity: '', senderCountry: '', senderLng: null, senderLat: null,
  receiverName: '', receiverEmail: '', receiverPhone: '', receiverAddress: '', receiverCity: '', receiverCountry: '', receiverLng: null, receiverLat: null,
  packageType: 'Parcel', shippingMode: 'Air Freight', weight: '', weightUnit: 'kg',
  description: '', quantity: 1, isFragile: false, requiresRefrigeration: false, specialInstructions: '',
  pickupDate: '', estimatedDelivery: '',
};

export default function BookShipment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createShipment = useMutation(api.shipments.create);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await createShipment({
        ...form,
        userId: user?._id || undefined,
        weight: parseFloat(form.weight),
        quantity: parseInt(form.quantity),
        senderLng: form.senderLng || undefined,
        senderLat: form.senderLat || undefined,
        receiverLng: form.receiverLng || undefined,
        receiverLat: form.receiverLat || undefined,
        specialInstructions: form.specialInstructions || undefined,
      });
      setResult(res);
      toast.success('Shipment booked successfully!');
    } catch (e) {
      toast.error(e.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="book-page page-enter">
        <Navbar />
        <main style={{ paddingTop: 'var(--nav-h)', minHeight: '80dvh', display: 'flex', alignItems: 'center' }}>
          <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="book-success">
              <div className="book-success-icon"><CheckCircle2 size={48} strokeWidth={1.5} /></div>
              <h1 className="text-h1">Shipment Booked!</h1>
              <p className="text-body" style={{ maxWidth: 480, margin: '0 auto' }}>
                Your shipment has been created and is now pending confirmation.
              </p>
              <div className="book-tracking-number">{result.trackingNumber}</div>
              <p className="text-sm">Save this tracking number to monitor your shipment.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                <Link to={`/track/${result.trackingNumber}`} className="btn btn-primary btn-lg">Track Shipment <ArrowRight size={16} /></Link>
                <Link to="/" className="btn btn-secondary">Back to Home</Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="book-page page-enter">
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <section className="book-hero">
          <div className="container">
            <div className="section-label"><span>Book a Shipment</span></div>
            <h1 className="text-h1">Ship Anything, <span className="text-gold">Anywhere</span></h1>
            <p className="text-body" style={{ marginTop: 12, maxWidth: 500 }}>
              Complete the booking form below. No hidden surcharges — only transparent logistics.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {/* Step Indicator */}
            <div className="step-indicator">
              {STEPS.map(({ n, label, icon: Icon }, i) => (
                <div key={n} className={`step-item ${step === n ? 'active' : step > n ? 'done' : ''}`}>
                  <div className="step-num">
                    {step > n ? <CheckCircle2 size={16} /> : <Icon size={15} />}
                  </div>
                  <span className="hide-mobile" style={{ fontSize: '0.78rem', fontWeight: 600, color: step === n ? 'var(--clr-white)' : 'var(--clr-slate-500)' }}>{label}</span>
                  {i < STEPS.length - 1 && <div className="step-line" />}
                </div>
              ))}
            </div>

            <div className="book-form-card glass">
              {/* Step 1 — Sender */}
              {step === 1 && (
                <div className="stagger">
                  <h2 className="text-h3" style={{ marginBottom: 24 }}>Sender Information</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[['senderName','Full Name'],['senderEmail','Email'],['senderPhone','Phone'],['senderCountry','Country'],['senderCity','City']].map(([k,l]) => (
                      <div key={k} className="form-group">
                        <label className="form-label">{l}</label>
                        <input className="form-input" value={form[k]} onChange={e => set(k, e.target.value)} type={k.includes('Email') ? 'email' : 'text'} />
                      </div>
                    ))}
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Full Address</label>
                      <input className="form-input" value={form.senderAddress} onChange={e => set('senderAddress', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 — Receiver */}
              {step === 2 && (
                <div className="stagger">
                  <h2 className="text-h3" style={{ marginBottom: 24 }}>Receiver Information</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[['receiverName','Full Name'],['receiverEmail','Email'],['receiverPhone','Phone'],['receiverCountry','Country'],['receiverCity','City']].map(([k,l]) => (
                      <div key={k} className="form-group">
                        <label className="form-label">{l}</label>
                        <input className="form-input" value={form[k]} onChange={e => set(k, e.target.value)} type={k.includes('Email') ? 'email' : 'text'} />
                      </div>
                    ))}
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Full Address</label>
                      <input className="form-input" value={form.receiverAddress} onChange={e => set('receiverAddress', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 — Package */}
              {step === 3 && (
                <div className="stagger">
                  <h2 className="text-h3" style={{ marginBottom: 24 }}>Package Details</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Package Type</label>
                      <select className="form-select" value={form.packageType} onChange={e => set('packageType', e.target.value)}>
                        {PACKAGE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Shipping Mode</label>
                      <select className="form-select" value={form.shippingMode} onChange={e => set('shippingMode', e.target.value)}>
                        {SHIPPING_MODES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weight</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="form-input" type="number" min="0.1" step="0.1" value={form.weight} onChange={e => set('weight', e.target.value)} style={{ flex: 1 }} />
                        <select className="form-select" value={form.weightUnit} onChange={e => set('weightUnit', e.target.value)} style={{ width: 80 }}>
                          <option>kg</option><option>lbs</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Quantity</label>
                      <input className="form-input" type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of contents..." />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Special Instructions (optional)</label>
                      <textarea className="form-textarea" rows={2} value={form.specialInstructions} onChange={e => set('specialInstructions', e.target.value)} />
                    </div>
                    <label className="book-checkbox">
                      <input type="checkbox" checked={form.isFragile} onChange={e => set('isFragile', e.target.checked)} />
                      <span>Fragile — handle with care</span>
                    </label>
                    <label className="book-checkbox">
                      <input type="checkbox" checked={form.requiresRefrigeration} onChange={e => set('requiresRefrigeration', e.target.checked)} />
                      <span>Requires refrigeration</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4 — Schedule */}
              {step === 4 && (
                <div className="stagger">
                  <h2 className="text-h3" style={{ marginBottom: 24 }}>Schedule Pickup</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Pickup Date</label>
                      <input className="form-input" type="date" value={form.pickupDate} onChange={e => set('pickupDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estimated Delivery</label>
                      <input className="form-input" type="date" value={form.estimatedDelivery} onChange={e => set('estimatedDelivery', e.target.value)} min={form.pickupDate || new Date().toISOString().split('T')[0]} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5 — Confirm */}
              {step === 5 && (
                <div className="stagger">
                  <h2 className="text-h3" style={{ marginBottom: 24 }}>Confirm Shipment</h2>
                  <div className="book-summary">
                    {[
                      ['Sender', `${form.senderName} · ${form.senderCity}, ${form.senderCountry}`],
                      ['Receiver', `${form.receiverName} · ${form.receiverCity}, ${form.receiverCountry}`],
                      ['Package', `${form.packageType} · ${form.weight}${form.weightUnit} · Qty: ${form.quantity}`],
                      ['Mode', form.shippingMode],
                      ['Pickup', form.pickupDate],
                      ['Est. Delivery', form.estimatedDelivery],
                    ].map(([l, v]) => (
                      <div key={l} className="book-summary-row">
                        <span className="book-summary-label">{l}</span>
                        <span className="book-summary-value">{v}</span>
                      </div>
                    ))}
                  </div>
                  {(form.isFragile || form.requiresRefrigeration) && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                      {form.isFragile && <span className="badge badge-warning">Fragile</span>}
                      {form.requiresRefrigeration && <span className="badge badge-teal">Refrigerated</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="book-nav">
                {step > 1 && (
                  <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {step < 5 ? (
                  <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><div className="spinner" /> Processing...</> : <><CheckCircle2 size={16} /> Confirm Booking</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
