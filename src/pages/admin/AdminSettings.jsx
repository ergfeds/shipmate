import { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import toast from 'react-hot-toast';
import { Save, Building2, Mail, Phone, MapPin, Clock, Globe, Send, Link } from 'lucide-react';

const SETTING_GROUPS = [
  {
    heading: 'Company Information',
    icon: Building2,
    fields: [
      { key: 'company_name', label: 'Company Name', placeholder: 'Cargo Parcel Express' },
      { key: 'company_tagline', label: 'Tagline', placeholder: 'Global Logistics, Delivered with Precision' },
      { key: 'live_support_enabled', label: 'Live Support Enabled (true/false)', placeholder: 'true' },
      { key: 'call_wait_time', label: 'Estimated Wait Time (minutes)', placeholder: '2', type: 'number' },
    ],
  },
  {
    heading: 'Contact Details',
    icon: Mail,
    fields: [
      { key: 'contact_email', label: 'Contact Email', placeholder: 'info@veloxgloballogistics.com', type: 'email' },
      { key: 'contact_phone', label: 'Phone', placeholder: '+1 800 123 4567' },
      { key: 'contact_address', label: 'Address', placeholder: '350 Fifth Avenue, New York, NY 10118' },
      { key: 'contact_hours', label: 'Business Hours', placeholder: 'Mon–Fri 08:00–18:00 UTC' },
    ],
  },
  {
    heading: 'Social Media',
    icon: Globe,
    fields: [
      { key: 'social_twitter', label: 'Twitter/X URL', placeholder: 'https://twitter.com/veloxglobalcargo' },
      { key: 'social_linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/company/veloxglobalcargo' },
      { key: 'social_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/veloxglobalcargo' },
      { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/veloxglobalcargo' },
    ],
  },
  {
    heading: 'Email (SMTP)',
    icon: Send,
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
      { key: 'smtp_user', label: 'SMTP User', placeholder: 'youremail@gmail.com', type: 'email' },
      { key: 'smtp_pass', label: 'SMTP App Password', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password' },
      { key: 'smtp_from', label: 'From Address', placeholder: 'noreply@veloxgloballogistics.com', type: 'email' },
    ],
  },
];

export default function AdminSettings() {
  const settings = useQuery(api.settings.getAll) || [];
  const saveSetting = useMutation(api.settings.set);
  const sendTestEmail = useAction(api.email.sendTest);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState({});
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);

  const handleTestEmail = async () => {
    if (!testEmail) return toast.error('Enter a recipient email');
    setTestSending(true);
    try {
      await sendTestEmail({ to: testEmail });
      toast.success('Test email sent!');
    } catch (e) {
      toast.error(e.message || 'Failed to send test email');
    } finally {
      setTestSending(false);
    }
  };

  useEffect(() => {
    if (settings.length > 0) {
      const map = {};
      settings.forEach(s => { map[s.key] = s.value; });
      setValues(v => ({ ...map, ...v }));
    }
  }, [settings.length]);

  const handleSave = async (key) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await saveSetting({ key, value: values[key] || '' });
      toast.success('Setting saved');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const handleSaveGroup = async (fields) => {
    const keys = fields.map(f => f.key);
    for (const key of keys) {
      await handleSave(key);
    }
  };

  return (
    <div>
      <h1 className="text-h2" style={{ marginBottom: 4 }}>Settings</h1>
      <p className="text-sm" style={{ marginBottom: 36 }}>Configure contact info, footer content, and integrations</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {SETTING_GROUPS.map(({ heading, icon: Icon, fields }) => (
          <div key={heading} className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 'clamp(24px,4vw,36px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'hsla(40,95%,52%,0.1)', border: '1px solid hsla(40,95%,52%,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-gold-400)' }}>
                  <Icon size={16} />
                </div>
                <h2 className="text-h3">{heading}</h2>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleSaveGroup(fields)}
              >
                <Save size={13} /> Save All
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {fields.map(({ key, label, placeholder, type = 'text' }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-input"
                      type={type}
                      value={values[key] || ''}
                      onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleSave(key)}
                      disabled={saving[key]}
                      style={{ flexShrink: 0, padding: '0 12px' }}
                    >
                      {saving[key] ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Test Email */}
      <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 'clamp(24px,4vw,36px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: 'hsla(145,65%,38%,0.1)', border: '1px solid hsla(145,65%,38%,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(145,65%,55%)' }}>
            <Mail size={16} />
          </div>
          <h2 className="text-h3">Send Test Email</h2>
        </div>
        <p className="text-sm" style={{ marginBottom: 16 }}>Verify your SMTP configuration by sending a test email. Save your SMTP settings above first.</p>
        <div style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
          <input
            className="form-input"
            type="email"
            placeholder="recipient@example.com"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleTestEmail}
            disabled={testSending}
            style={{ flexShrink: 0, padding: '0 18px' }}
          >
            {testSending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Sending...</> : <><Send size={14} /> Send Test</>}
          </button>
        </div>
      </div>
    </div>
  );
}
