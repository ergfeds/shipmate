import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <div className="container" style={{ padding: '64px clamp(16px,4vw,48px)', maxWidth: 820 }}>
          <div className="section-label"><span>Legal</span></div>
          <h1 className="text-h1" style={{ marginBottom: 8 }}>Privacy <span className="text-gold">Policy</span></h1>
          <p className="text-sm" style={{ marginBottom: 48 }}>Effective Date: 1 January 2025</p>
          {[
            { title: '1. Information We Collect', body: 'We collect information you provide directly: name, email, phone, address, and shipment details. We also collect technical data such as IP address, browser type, and usage patterns through cookies and analytics tools.' },
            { title: '2. How We Use Your Data', body: 'We use your information to process shipments, provide customer support, send tracking notifications, improve our services, comply with legal obligations, and (with consent) send marketing communications.' },
            { title: '3. Data Sharing', body: 'We share data only with necessary partners: carriers, customs authorities, payment processors, and technology providers. We do not sell your personal data to third parties for marketing purposes.' },
            { title: '4. Data Security', body: 'We employ industry-standard security measures including SSL encryption, access controls, and regular security audits to protect your personal information from unauthorized access or disclosure.' },
            { title: '5. Data Retention', body: 'We retain your data for as long as necessary to provide services and comply with legal obligations, typically 7 years for shipment records. Account data is deleted upon request, subject to legal requirements.' },
            { title: '6. Your Rights', body: 'Subject to applicable law, you have the right to access, rectify, erase, and port your data. You may also object to processing and withdraw consent at any time. Contact privacy@veloxgloballogistics.com to exercise these rights.' },
            { title: '7. Cookies', body: 'We use essential, performance, and analytics cookies. You can control cookie preferences through your browser settings. Disabling certain cookies may limit functionality.' },
            { title: '8. Contact Us', body: 'For privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@veloxgloballogistics.com or by post to our registered address.' },
          ].map(({ title, body }) => (
            <div key={title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid hsla(0,0%,100%,0.05)' }}>
              <h2 className="text-h3" style={{ marginBottom: 12 }}>{title}</h2>
              <p className="text-body">{body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
