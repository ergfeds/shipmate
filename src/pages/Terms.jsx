import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div style={{ background: 'var(--clr-navy-950)', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <div className="container" style={{ padding: '64px clamp(16px,4vw,48px)', maxWidth: 820 }}>
          <div className="section-label"><span>Legal</span></div>
          <h1 className="text-h1" style={{ marginBottom: 8 }}>Terms & <span className="text-gold">Conditions</span></h1>
          <p className="text-sm" style={{ marginBottom: 48 }}>Effective Date: 1 January 2025</p>

          {[
            { title: '1. Acceptance of Terms', body: 'By accessing or using ShipMate\'s services, website, or mobile application, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.' },
            { title: '2. Services Description', body: 'ShipMate provides global logistics services including air freight, sea freight, road freight, live animal transport, courier services, and customs brokerage. All services are subject to availability, applicable laws, and these terms.' },
            { title: '3. Account Registration', body: 'Users are responsible for maintaining the confidentiality of their account credentials. You agree to immediately notify ShipMate of any unauthorized use of your account. We reserve the right to terminate accounts at our discretion.' },
            { title: '4. Prohibited Shipments', body: 'Certain goods are prohibited from shipment, including but not limited to: illegal substances, weapons, explosives, unregistered pharmaceuticals, currency, and any items that violate international trade law. ShipMate reserves the right to refuse any shipment.' },
            { title: '5. Liability Limitation', body: 'ShipMate\'s liability for loss or damage to shipments is limited to the actual value declared at time of booking, not exceeding applicable international conventions. ShipMate is not liable for indirect, consequential, or punitive damages.' },
            { title: '6. Privacy', body: 'Your use of ShipMate\'s services is also governed by our Privacy Policy, incorporated herein by reference. We collect and process personal data in accordance with applicable data protection laws.' },
            { title: '7. Governing Law', body: 'These Terms shall be governed by and construed in accordance with the laws of the State of New York, United States. Any disputes shall be resolved by binding arbitration in New York County.' },
            { title: '8. Changes to Terms', body: 'ShipMate reserves the right to modify these Terms at any time. We will provide notice of significant changes. Continued use of our services following such changes constitutes acceptance.' },
          ].map(({ title, body }) => (
            <div key={title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid hsla(0,0%,100%,0.05)' }}>
              <h2 className="text-h3" style={{ marginBottom: 12, color: 'var(--clr-white)' }}>{title}</h2>
              <p className="text-body">{body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
