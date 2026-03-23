import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Anchor, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', textAlign: 'center' }}>
        <div className="page-enter" style={{ padding: '0 16px' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(6rem, 20vw, 12rem)', fontWeight: 700, background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>404</div>
          <h1 className="text-h2" style={{ marginTop: 16, marginBottom: 12 }}>Page Not Found</h1>
          <p className="text-body" style={{ maxWidth: 400, margin: '0 auto 32px' }}>The page you're looking for has sailed off to sea. Let us help you find your way back.</p>
          <Link to="/" className="btn btn-primary btn-lg"><ArrowLeft size={16} /> Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
