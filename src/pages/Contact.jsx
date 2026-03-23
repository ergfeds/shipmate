import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

export default function Contact() {
  const submit = useMutation(api.contact.submit);
  const settings = useQuery(api.settings.getAll);
  const getSetting = (key, fallback = '') => settings?.find(s => s.key === key)?.value || fallback;

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const CONTACT_INFO = [
    { icon: Mail, val: getSetting('contact_email'), href: `mailto:${getSetting('contact_email')}` },
    { icon: Phone, val: getSetting('contact_phone'), href: `tel:${getSetting('contact_phone')}` },
    { icon: MapPin, val: getSetting('contact_address'), href: null },
    { icon: Clock, val: getSetting('contact_hours'), href: null },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submit(form);
      toast.success('Message sent! We\'ll be in touch shortly.');
      setDone(true);
    } catch (err) {
      toast.error('Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <section style={{ padding: 'clamp(80px, 12vw, 140px) 0', background: 'var(--grad-hero)', borderBottom: '1px solid hsla(0,0%,100%,0.05)' }}>
          <div className="container">
            <div className="section-label"><span>Get in Touch</span></div>
            <h1 className="text-hero" style={{ marginBottom: 20 }}>
              We're Here to <span className="text-gold">Help</span>
            </h1>
            <p className="text-body" style={{ maxWidth: 500, fontSize: '1.05rem' }}>
              Reach out for quotes, support, or any enquiry. Our team responds within 2 business hours.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 56, alignItems: 'flex-start' }}>
              {/* Info */}
              <div>
                <h2 className="text-h2" style={{ marginBottom: 28 }}>Contact Information</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                  {CONTACT_INFO.filter(c => c.val).map(({ icon: Icon, val, href }) => (
                    <div key={val} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px' }}>
                      <div style={{ width: 36, height: 36, background: 'hsla(40,95%,52%,0.1)', border: '1px solid hsla(40,95%,52%,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-gold-400)', flexShrink: 0 }}>
                        <Icon size={16} />
                      </div>
                      {href ? (
                        <a href={href} style={{ color: 'var(--clr-slate-200)', textDecoration: 'none', fontSize: '0.9rem', lineHeight: 1.6 }} onMouseEnter={e => e.target.style.color = 'var(--clr-gold-400)'} onMouseLeave={e => e.target.style.color = 'var(--clr-slate-200)'}>{val}</a>
                      ) : (
                        <span style={{ color: 'var(--clr-slate-200)', fontSize: '0.9rem', lineHeight: 1.6 }}>{val}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 'clamp(28px,5vw,48px)' }}>
                {done ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: 64, height: 64, background: 'hsla(145,65%,38%,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Send size={28} color="hsl(145,65%,55%)" />
                    </div>
                    <h2 className="text-h2" style={{ marginBottom: 12 }}>Message Sent!</h2>
                    <p className="text-body">We'll get back to you within 2 business hours.</p>
                    <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => { setDone(false); setForm({ name:'',email:'',phone:'',subject:'',message:'' }); }}>Send Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h2 className="text-h3" style={{ marginBottom: 8 }}>Send a Message</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label className="form-label">Phone (optional)</label>
                        <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subject</label>
                        <input className="form-input" required value={form.subject} onChange={e => set('subject', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message</label>
                      <textarea className="form-textarea" rows={5} required value={form.message} onChange={e => set('message', e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={loading}>
                      {loading ? <><div className="spinner" /> Sending...</> : <><Send size={15} /> Send Message</>}
                    </button>
                  </form>
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
