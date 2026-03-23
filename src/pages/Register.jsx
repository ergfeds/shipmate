import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, Eye, EyeOff, Anchor, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const registerMutation = useMutation(api.users.register);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await registerMutation({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined });
      login(user);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { k: 'name', l: 'Full Name', type: 'text', Icon: User },
    { k: 'email', l: 'Email', type: 'email', Icon: Mail },
    { k: 'phone', l: 'Phone (optional)', type: 'tel', Icon: Phone },
    { k: 'password', l: 'Password', type: showPw ? 'text' : 'password', Icon: Lock, togglePw: true },
    { k: 'confirm', l: 'Confirm Password', type: showPw ? 'text' : 'password', Icon: Lock },
  ];

  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ width: '100%', maxWidth: 480, margin: '32px auto', padding: '0 16px' }} className="page-enter">
          <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 'clamp(28px, 5vw, 48px)' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 52, height: 52, background: 'var(--grad-gold)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--clr-navy-950)', boxShadow: 'var(--shadow-gold)' }}>
                <Anchor size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-h2" style={{ marginBottom: 6 }}>Create Account</h1>
              <p className="text-sm">Join ShipMate and start shipping today</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {fields.map(({ k, l, type, Icon, togglePw }) => (
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  <div style={{ position: 'relative' }}>
                    <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-slate-500)' }} />
                    <input className="form-input" type={type} value={form[k]} onChange={e => set(k, e.target.value)} required={k !== 'phone'} style={{ paddingLeft: 38, paddingRight: togglePw ? 44 : undefined }} />
                    {togglePw && (
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-slate-400)', cursor: 'pointer' }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? <><div className="spinner" /> Creating...</> : <>Create Account <ArrowRight size={16} /></>}
              </button>
            </form>
            <div className="divider" />
            <p className="text-sm" style={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--clr-gold-400)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
