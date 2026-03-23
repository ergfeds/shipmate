import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import StatusBadge, { STATUS_CONFIG } from '../../components/StatusBadge';
import {
  Search, Plus, ArrowLeft, Edit2, Trash2, X, MapPin, Clock,
  User, Mail, Phone, Home, Package, Truck, Calendar, CheckCircle,
  AlertTriangle, Globe, RefreshCw, Eye, ChevronRight, Box, Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import './AdminShipments.css';

const ALL_STATUSES = Object.keys(STATUS_CONFIG);
const PACKAGE_TYPES = ['Document','Parcel','Freight','Live Animal','Fragile','Hazardous','Perishable','Oversized'];
const SHIPPING_MODES = ['Air Freight','Sea Freight','Road Freight','Express'];

const FORM_INIT = {
  senderName:'', senderEmail:'', senderPhone:'', senderAddress:'', senderCity:'', senderCountry:'', senderLat:null, senderLng:null,
  receiverName:'', receiverEmail:'', receiverPhone:'', receiverAddress:'', receiverCity:'', receiverCountry:'', receiverLat:null, receiverLng:null,
  packageType:'Parcel', shippingMode:'Air Freight',
  weight:'', weightUnit:'kg',
  description:'', quantity:1,
  isFragile:false, requiresRefrigeration:false, specialInstructions:'',
  pickupDate:'', estimatedDelivery:'',
  useDimensions:false, dimLength:'', dimWidth:'', dimHeight:'', dimUnit:'cm',
};

/* ── Root controller ─────────────────────────────────────────────────────── */
export default function AdminShipments() {
  const [view, setView] = useState('list');       // 'list' | 'create' | 'detail' | 'edit'
  const [selectedId, setSelectedId] = useState(null);

  const openDetail = useCallback((id) => { setSelectedId(id); setView('detail'); }, []);
  const openEdit   = useCallback((id) => { setSelectedId(id); setView('edit');   }, []);
  const openCreate = useCallback(() => setView('create'), []);
  const goList     = useCallback(() => { setView('list'); setSelectedId(null); }, []);

  if (view === 'create') return <ShipmentForm onBack={goList} onDone={openDetail} />;
  if (view === 'edit' && selectedId) return <ShipmentForm id={selectedId} onBack={() => openDetail(selectedId)} onDone={openDetail} />;
  if (view === 'detail' && selectedId) return <ShipmentDetail id={selectedId} onBack={goList} onEdit={() => openEdit(selectedId)} />;
  return <ShipmentList onSelect={openDetail} onCreate={openCreate} />;
}

/* ── Stats bar ───────────────────────────────────────────────────────────── */
function StatsBar() {
  const stats = useQuery(api.shipments.getStats) || {};
  const cards = [
    { label:'Total', value: stats.total ?? '—', color:'var(--clr-gold-400)',    bg:'hsla(40,95%,52%,0.1)',  icon:<Package size={14}/> },
    { label:'In Transit', value: stats.inTransit ?? '—', color:'hsl(199,80%,60%)', bg:'hsla(199,80%,60%,0.1)', icon:<Truck size={14}/> },
    { label:'Delivered', value: stats.delivered ?? '—', color:'var(--clr-success)', bg:'hsla(145,65%,38%,0.1)', icon:<CheckCircle size={14}/> },
    { label:'Delayed', value: stats.delayed ?? '—', color:'hsl(357,78%,65%)',   bg:'hsla(357,78%,52%,0.1)', icon:<AlertTriangle size={14}/> },
  ];
  return (
    <div className="as-stats">
      {cards.map(c => (
        <div className="as-stat" key={c.label}>
          <div className="as-stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
          <div className="as-stat-value" style={{ color: c.color }}>{c.value}</div>
          <div className="as-stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Shipment List ───────────────────────────────────────────────────────── */
function ShipmentList({ onSelect, onCreate }) {
  const shipments = useQuery(api.shipments.getAll) || [];
  const deleteShipment = useMutation(api.shipments.deleteShipment);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.trackingNumber.toLowerCase().includes(q)
      || s.senderName?.toLowerCase().includes(q)
      || s.receiverName?.toLowerCase().includes(q)
      || s.senderCity?.toLowerCase().includes(q)
      || s.receiverCity?.toLowerCase().includes(q);
    const matchS = !statusFilter || s.status === statusFilter;
    const matchM = !modeFilter || s.shippingMode === modeFilter;
    return matchQ && matchS && matchM;
  });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteShipment({ shipmentId: confirmDelete });
      toast.success('Shipment deleted');
      setConfirmDelete(null);
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  return (
    <div>
      <StatsBar />

      <div className="as-page-header">
        <div>
          <h1 className="text-h2" style={{ marginBottom: 4 }}>Shipments</h1>
          <p className="text-sm" style={{ color:'var(--clr-slate-400)' }}>{filtered.length} of {shipments.length} shipments</p>
        </div>
        <div className="as-header-actions">
          <button className="btn btn-primary btn-sm as-create-btn" onClick={onCreate} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={15} /> New Shipment
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="as-toolbar">
        <div className="as-search">
          <Search size={15} color="var(--clr-slate-500)" />
          <input placeholder="Search tracking, name, city…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'var(--clr-slate-400)', cursor:'pointer', display:'flex' }}><X size={14}/></button>}
        </div>
        <div className="as-filter-row">
          <select className="form-select" style={{ height:42, fontSize:'0.82rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select" style={{ height:42, fontSize:'0.82rem' }} value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
            <option value="">All Modes</option>
            {SHIPPING_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="glass as-table-desktop" style={{ borderRadius:'var(--radius-xl)', padding:'4px 0', overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tracking</th>
                <th>From</th>
                <th>To</th>
                <th>Mode</th>
                <th>Package</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id} style={{ cursor:'pointer' }} onClick={() => onSelect(s._id)}>
                  <td style={{ fontWeight:700, color:'var(--clr-gold-400)', fontFamily:'var(--font-serif)', letterSpacing:'0.04em', fontSize:'0.82rem' }}>{s.trackingNumber}</td>
                  <td>
                    <div style={{ fontWeight:600, color:'var(--clr-white)', fontSize:'0.82rem' }}>{s.senderName}</div>
                    <div className="text-xs">{s.senderCity}, {s.senderCountry}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight:600, color:'var(--clr-white)', fontSize:'0.82rem' }}>{s.receiverName}</div>
                    <div className="text-xs">{s.receiverCity}, {s.receiverCountry}</div>
                  </td>
                  <td><span className="badge badge-neutral badge-sm">{s.shippingMode}</span></td>
                  <td className="text-xs">{s.packageType} · {s.weight}{s.weightUnit}</td>
                  <td><StatusBadge status={s.status} size="sm" /></td>
                  <td className="text-xs">{format(new Date(s.createdAt), 'MMM dd, yyyy')}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onSelect(s._id)} title="View"><Eye size={13}/></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(s._id)} title="Delete" style={{ color:'var(--clr-error)' }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="as-empty">No shipments found.</div>}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="as-cards">
        {filtered.length === 0 && <div className="as-empty">No shipments found.</div>}
        {filtered.map(s => (
          <div className="as-card" key={s._id} onClick={() => onSelect(s._id)}>
            <div className="as-card-header">
              <div className="as-card-tracking">{s.trackingNumber}</div>
              <StatusBadge status={s.status} size="sm" />
            </div>
            <div className="as-card-route">
              <span style={{ fontWeight:600, color:'var(--clr-white)' }}>{s.senderCity}</span>
              <span className="as-card-route-sep">→</span>
              <span style={{ fontWeight:600, color:'var(--clr-white)' }}>{s.receiverCity}</span>
            </div>
            <div className="text-xs" style={{ color:'var(--clr-slate-400)', marginBottom:6 }}>
              {s.senderName} → {s.receiverName}
            </div>
            <div className="as-card-meta">
              <span className="badge badge-neutral badge-sm">{s.shippingMode}</span>
              <span>{s.packageType}</span>
              <span>{s.weight}{s.weightUnit}</span>
              <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
                <Clock size={11}/> {format(new Date(s.createdAt), 'MMM dd')}
              </span>
              <ChevronRight size={14} style={{ color:'var(--clr-slate-600)' }}/>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="as-fab" onClick={onCreate} aria-label="New Shipment"><Plus size={24}/></button>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="as-modal-bg">
          <div className="as-modal glass">
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'hsla(357,78%,52%,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Trash2 size={20} color="var(--clr-error)"/>
              </div>
              <div>
                <div style={{ fontWeight:700, color:'var(--clr-white)' }}>Delete Shipment</div>
                <div className="text-xs" style={{ color:'var(--clr-slate-400)' }}>This action cannot be undone</div>
              </div>
              <button onClick={() => setConfirmDelete(null)} style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--clr-slate-400)', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <p style={{ fontSize:'0.875rem', color:'var(--clr-slate-300)', marginBottom:20 }}>
              Are you sure you want to permanently delete this shipment and all its status history?
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }} onClick={handleDelete} disabled={deleting}>
                {deleting ? <><div className="spinner"/> Deleting…</> : <><Trash2 size={14}/> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shipment Form (Create & Edit) ───────────────────────────────────────── */
function ShipmentForm({ id, onBack, onDone }) {
  const existing = useQuery(api.shipments.getById, id ? { shipmentId: id } : 'skip');
  const createShipment = useMutation(api.shipments.create);
  const updateShipment = useMutation(api.shipments.updateShipment);

  const [form, setForm] = useState(FORM_INIT);
  const [loading, setLoading] = useState(false);

  // Populate form when editing existing shipment
  useEffect(() => {
    if (!existing) return;
    setForm({
      senderName: existing.senderName || '',
      senderEmail: existing.senderEmail || '',
      senderPhone: existing.senderPhone || '',
      senderAddress: existing.senderAddress || '',
      senderCity: existing.senderCity || '',
      senderCountry: existing.senderCountry || '',
      senderLat: existing.senderLat ?? null,
      senderLng: existing.senderLng ?? null,
      receiverName: existing.receiverName || '',
      receiverEmail: existing.receiverEmail || '',
      receiverPhone: existing.receiverPhone || '',
      receiverAddress: existing.receiverAddress || '',
      receiverCity: existing.receiverCity || '',
      receiverCountry: existing.receiverCountry || '',
      receiverLat: existing.receiverLat ?? null,
      receiverLng: existing.receiverLng ?? null,
      packageType: existing.packageType || 'Parcel',
      shippingMode: existing.shippingMode || 'Air Freight',
      weight: String(existing.weight || ''),
      weightUnit: existing.weightUnit || 'kg',
      description: existing.description || '',
      quantity: existing.quantity || 1,
      isFragile: existing.isFragile || false,
      requiresRefrigeration: existing.requiresRefrigeration || false,
      specialInstructions: existing.specialInstructions || '',
      pickupDate: existing.pickupDate || '',
      estimatedDelivery: existing.estimatedDelivery || '',
      useDimensions: !!existing.dimensions,
      dimLength: existing.dimensions?.length ? String(existing.dimensions.length) : '',
      dimWidth:  existing.dimensions?.width  ? String(existing.dimensions.width)  : '',
      dimHeight: existing.dimensions?.height ? String(existing.dimensions.height) : '',
      dimUnit:   existing.dimensions?.unit   || 'cm',
    });
  }, [existing?._id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dims = form.useDimensions && form.dimLength && form.dimWidth && form.dimHeight
        ? { length: Number(form.dimLength), width: Number(form.dimWidth), height: Number(form.dimHeight), unit: form.dimUnit }
        : undefined;
      const payload = {
        senderName: form.senderName, senderEmail: form.senderEmail, senderPhone: form.senderPhone,
        senderAddress: form.senderAddress, senderCity: form.senderCity, senderCountry: form.senderCountry,
        senderLat: form.senderLat ?? undefined, senderLng: form.senderLng ?? undefined,
        receiverName: form.receiverName, receiverEmail: form.receiverEmail, receiverPhone: form.receiverPhone,
        receiverAddress: form.receiverAddress, receiverCity: form.receiverCity, receiverCountry: form.receiverCountry,
        receiverLat: form.receiverLat ?? undefined, receiverLng: form.receiverLng ?? undefined,
        packageType: form.packageType, shippingMode: form.shippingMode,
        weight: Number(form.weight), weightUnit: form.weightUnit,
        description: form.description, quantity: Number(form.quantity),
        isFragile: form.isFragile, requiresRefrigeration: form.requiresRefrigeration,
        specialInstructions: form.specialInstructions || undefined,
        pickupDate: form.pickupDate, estimatedDelivery: form.estimatedDelivery,
        dimensions: dims,
      };
      if (id) {
        await updateShipment({ shipmentId: id, ...payload });
        toast.success('Shipment updated');
        onDone(id);
      } else {
        const { shipmentId } = await createShipment(payload);
        toast.success('Shipment created!');
        onDone(shipmentId);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  const F = ({ label, name, type='text', required, placeholder, children, full, ...rest }) => (
    <div className={`form-group${full ? ' as-form-full' : ''}`}>
      <label className="form-label">{label}{required && <span style={{ color:'var(--clr-error)', marginLeft:3 }}>*</span>}</label>
      {children || <input className="form-input" type={type} value={form[name]} onChange={e => set(name, e.target.value)} placeholder={placeholder} required={required} {...rest} />}
    </div>
  );

  return (
    <div className="as-form-wrap">
      <button className="as-back-btn" onClick={onBack}><ArrowLeft size={16}/> Back to Shipments</button>
      <h1 className="text-h2" style={{ marginBottom:6 }}>{id ? 'Edit Shipment' : 'New Shipment'}</h1>
      <p className="text-sm" style={{ color:'var(--clr-slate-400)', marginBottom:24 }}>
        {id ? 'Update shipment details below' : 'Fill in all details to create a new shipment'}
      </p>

      <form onSubmit={handleSubmit}>
        {/* Sender */}
        <div className="as-form-section">
          <div className="as-form-section-title"><User size={14}/> Sender Information</div>
          <div className="as-form-grid">
            <F label="Full Name" name="senderName" required placeholder="John Smith"/>
            <F label="Email" name="senderEmail" type="email" required placeholder="sender@email.com"/>
            <F label="Phone" name="senderPhone" required placeholder="+1 234 567 8900"/>
            <F label="Country" name="senderCountry" required placeholder="United States"/>
            <F label="City" name="senderCity" required placeholder="New York"/>
            <div className="form-group as-form-full">
              <label className="form-label">Address <span style={{ color:'var(--clr-error)', marginLeft:3 }}>*</span></label>
              <AddressAutocomplete
                value={form.senderAddress}
                onChange={v => set('senderAddress', v)}
                onSelect={({ address, city, country, lat, lng }) => setForm(f => ({ ...f,
                  senderAddress: address,
                  senderCity: city || f.senderCity,
                  senderCountry: country || f.senderCountry,
                  senderLat: lat ?? f.senderLat,
                  senderLng: lng ?? f.senderLng,
                }))}
                placeholder="Start typing an address…"
                required
              />
            </div>
          </div>
        </div>

        {/* Receiver */}
        <div className="as-form-section">
          <div className="as-form-section-title"><Globe size={14}/> Receiver Information</div>
          <div className="as-form-grid">
            <F label="Full Name" name="receiverName" required placeholder="Jane Doe"/>
            <F label="Email" name="receiverEmail" type="email" required placeholder="receiver@email.com"/>
            <F label="Phone" name="receiverPhone" required placeholder="+44 20 7946 0000"/>
            <F label="Country" name="receiverCountry" required placeholder="United Kingdom"/>
            <F label="City" name="receiverCity" required placeholder="London"/>
            <div className="form-group as-form-full">
              <label className="form-label">Address <span style={{ color:'var(--clr-error)', marginLeft:3 }}>*</span></label>
              <AddressAutocomplete
                value={form.receiverAddress}
                onChange={v => set('receiverAddress', v)}
                onSelect={({ address, city, country, lat, lng }) => setForm(f => ({ ...f,
                  receiverAddress: address,
                  receiverCity: city || f.receiverCity,
                  receiverCountry: country || f.receiverCountry,
                  receiverLat: lat ?? f.receiverLat,
                  receiverLng: lng ?? f.receiverLng,
                }))}
                placeholder="Start typing an address…"
                required
              />
            </div>
          </div>
        </div>

        {/* Package */}
        <div className="as-form-section">
          <div className="as-form-section-title"><Box size={14}/> Package Details</div>
          <div className="as-form-grid">
            <F label="Package Type" name="packageType" required>
              <select className="form-select" value={form.packageType} onChange={e => set('packageType', e.target.value)} required>
                {PACKAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </F>
            <F label="Shipping Mode" name="shippingMode" required>
              <select className="form-select" value={form.shippingMode} onChange={e => set('shippingMode', e.target.value)} required>
                {SHIPPING_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </F>
            <F label="Weight" name="weight" type="number" required placeholder="e.g. 12.5" min="0.01" step="0.01"/>
            <F label="Unit" name="weightUnit" required>
              <select className="form-select" value={form.weightUnit} onChange={e => set('weightUnit', e.target.value)}>
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </F>
            <F label="Quantity" name="quantity" type="number" required min="1" placeholder="1"/>
            <F label="Description" name="description" required placeholder="Brief description of contents" full>
              <textarea className="form-textarea" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of contents" required/>
            </F>
            <div className="as-form-full" style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
              <label className="as-checkbox-row">
                <input type="checkbox" checked={form.isFragile} onChange={e => set('isFragile', e.target.checked)}/>
                <span style={{ fontSize:'0.875rem', color:'var(--clr-slate-300)' }}>Fragile</span>
              </label>
              <label className="as-checkbox-row">
                <input type="checkbox" checked={form.requiresRefrigeration} onChange={e => set('requiresRefrigeration', e.target.checked)}/>
                <span style={{ fontSize:'0.875rem', color:'var(--clr-slate-300)' }}>Requires Refrigeration</span>
              </label>
              <label className="as-checkbox-row">
                <input type="checkbox" checked={form.useDimensions} onChange={e => set('useDimensions', e.target.checked)}/>
                <span style={{ fontSize:'0.875rem', color:'var(--clr-slate-300)' }}>Add Dimensions</span>
              </label>
            </div>
            {form.useDimensions && (
              <>
                <F label="Length" name="dimLength" type="number" min="0" step="0.1" placeholder="0"/>
                <F label="Width"  name="dimWidth"  type="number" min="0" step="0.1" placeholder="0"/>
                <F label="Height" name="dimHeight" type="number" min="0" step="0.1" placeholder="0"/>
                <F label="Dim Unit" name="dimUnit">
                  <select className="form-select" value={form.dimUnit} onChange={e => set('dimUnit', e.target.value)}>
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </select>
                </F>
              </>
            )}
            <F label="Special Instructions" name="specialInstructions" placeholder="Any special handling notes…" full>
              <textarea className="form-textarea" rows={2} value={form.specialInstructions} onChange={e => set('specialInstructions', e.target.value)} placeholder="Any special handling notes…"/>
            </F>
          </div>
        </div>

        {/* Dates */}
        <div className="as-form-section">
          <div className="as-form-section-title"><Calendar size={14}/> Schedule</div>
          <div className="as-form-grid">
            <F label="Pickup Date" name="pickupDate" type="date" required/>
            <F label="Estimated Delivery" name="estimatedDelivery" type="date" required/>
          </div>
        </div>

        <div className="as-form-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack} style={{ minWidth:120 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth:180, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading ? <><div className="spinner"/> Saving…</> : <>{id ? <><RefreshCw size={15}/> Update Shipment</> : <><Plus size={15}/> Create Shipment</>}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Shipment Detail ─────────────────────────────────────────────────────── */
function ShipmentDetail({ id, onBack, onEdit }) {
  const shipment = useQuery(api.shipments.getById, { shipmentId: id });
  const history  = useQuery(api.shipments.getStatusHistory, { shipmentId: id }) || [];
  const updateStatus   = useMutation(api.shipments.updateStatus);
  const deleteShipment = useMutation(api.shipments.deleteShipment);

  const [newStatus, setNewStatus]   = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusLoc, setStatusLoc]   = useState('');
  const [statusLat, setStatusLat]   = useState(null);
  const [statusLng, setStatusLng]   = useState(null);
  const [updating, setUpdating]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  if (!shipment) return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'40px 0', color:'var(--clr-slate-400)' }}>
      <div className="spinner"/> Loading shipment…
    </div>
  );

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setUpdating(true);
    try {
      await updateStatus({
        shipmentId: id,
        status: newStatus,
        note: statusNote || undefined,
        location: statusLoc || undefined,
        lat: statusLat ?? undefined,
        lng: statusLng ?? undefined,
      });
      toast.success('Status updated');
      setNewStatus(''); setStatusNote(''); setStatusLoc(''); setStatusLat(null); setStatusLng(null);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteShipment({ shipmentId: id });
      toast.success('Shipment deleted');
      onBack();
    } catch (err) { toast.error(err.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const InfoRow = ({ icon, label, value }) => (
    <div className="as-info-row">
      <span style={{ color:'var(--clr-slate-500)', flexShrink:0 }}>{icon}</span>
      <span className="as-info-row-label">{label}</span>
      <span style={{ color:'var(--clr-white)', fontWeight:500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <button className="as-back-btn" onClick={onBack}><ArrowLeft size={16}/> Back to Shipments</button>

      {/* Header */}
      <div className="as-page-header" style={{ marginBottom:20 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <h1 className="text-h2" style={{ fontFamily:'var(--font-serif)', color:'var(--clr-gold-400)', marginBottom:0 }}>{shipment.trackingNumber}</h1>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="text-xs" style={{ color:'var(--clr-slate-500)', marginTop:4 }}>
            Created {format(new Date(shipment.createdAt), 'MMMM dd, yyyy')}
          </p>
        </div>
        <div className="as-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={onEdit} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Edit2 size={14}/> Edit
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(true)} style={{ color:'var(--clr-error)', display:'flex', alignItems:'center', gap:6 }}>
            <Trash2 size={14}/> Delete
          </button>
        </div>
      </div>

      {/* Sender / Receiver cards */}
      <div className="as-detail-grid">
        <div className="as-info-card">
          <div className="as-info-label" style={{ color:'hsl(199,80%,60%)' }}><User size={12} style={{ marginRight:6 }}/>Sender</div>
          <InfoRow icon={<User size={13}/>}    label="Name"    value={shipment.senderName}/>
          <InfoRow icon={<Mail size={13}/>}    label="Email"   value={shipment.senderEmail}/>
          <InfoRow icon={<Phone size={13}/>}   label="Phone"   value={shipment.senderPhone}/>
          <InfoRow icon={<MapPin size={13}/>}  label="City"    value={`${shipment.senderCity}, ${shipment.senderCountry}`}/>
          <InfoRow icon={<Home size={13}/>}    label="Address" value={shipment.senderAddress}/>
        </div>
        <div className="as-info-card">
          <div className="as-info-label" style={{ color:'var(--clr-gold-400)' }}><Globe size={12} style={{ marginRight:6 }}/>Receiver</div>
          <InfoRow icon={<User size={13}/>}    label="Name"    value={shipment.receiverName}/>
          <InfoRow icon={<Mail size={13}/>}    label="Email"   value={shipment.receiverEmail}/>
          <InfoRow icon={<Phone size={13}/>}   label="Phone"   value={shipment.receiverPhone}/>
          <InfoRow icon={<MapPin size={13}/>}  label="City"    value={`${shipment.receiverCity}, ${shipment.receiverCountry}`}/>
          <InfoRow icon={<Home size={13}/>}    label="Address" value={shipment.receiverAddress}/>
        </div>
      </div>

      {/* Package & Schedule */}
      <div className="as-detail-grid">
        <div className="as-info-card">
          <div className="as-info-label" style={{ color:'var(--clr-success)' }}><Package size={12} style={{ marginRight:6 }}/>Package</div>
          <InfoRow icon={<Box size={13}/>}     label="Type"    value={shipment.packageType}/>
          <InfoRow icon={<Truck size={13}/>}   label="Mode"    value={shipment.shippingMode}/>
          <InfoRow icon={<Layers size={13}/>}  label="Weight"  value={`${shipment.weight} ${shipment.weightUnit}`}/>
          <InfoRow icon={<Layers size={13}/>}  label="Qty"     value={String(shipment.quantity)}/>
          {shipment.dimensions && (
            <InfoRow icon={<Box size={13}/>} label="Dims" value={`${shipment.dimensions.length}×${shipment.dimensions.width}×${shipment.dimensions.height} ${shipment.dimensions.unit}`}/>
          )}
          <InfoRow icon={<Package size={13}/>} label="Desc" value={shipment.description}/>
          {shipment.isFragile && <div className="text-xs" style={{ color:'hsl(30,95%,65%)', marginTop:6 }}>⚠ Fragile</div>}
          {shipment.requiresRefrigeration && <div className="text-xs" style={{ color:'hsl(199,80%,60%)', marginTop:4 }}>❄ Requires Refrigeration</div>}
        </div>
        <div className="as-info-card">
          <div className="as-info-label" style={{ color:'hsl(280,80%,70%)' }}><Calendar size={12} style={{ marginRight:6 }}/>Schedule</div>
          <InfoRow icon={<Calendar size={13}/>} label="Pickup"   value={shipment.pickupDate}/>
          <InfoRow icon={<Calendar size={13}/>} label="Delivery" value={shipment.estimatedDelivery}/>
          {shipment.specialInstructions && (
            <div style={{ marginTop:12, fontSize:'0.8rem', color:'var(--clr-slate-300)', lineHeight:1.6 }}>
              <div style={{ fontSize:'0.7rem', color:'var(--clr-slate-500)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Special Instructions</div>
              {shipment.specialInstructions}
            </div>
          )}
        </div>
      </div>

      {/* Status update + Timeline side by side */}
      <div className="as-detail-grid">
        {/* Update status */}
        <div className="as-status-panel">
          <div className="as-info-label" style={{ color:'var(--clr-gold-400)', marginBottom:16 }}><RefreshCw size={12} style={{ marginRight:6 }}/>Update Status</div>
          <form onSubmit={handleStatusUpdate} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">New Status <span style={{ color:'var(--clr-error)' }}>*</span></label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)} required>
                <option value="">Select status…</option>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Location</label>
              <AddressAutocomplete
                value={statusLoc}
                onChange={v => { setStatusLoc(v); setStatusLat(null); setStatusLng(null); }}
                onSelect={({ address, city, country, lat, lng }) => {
                  setStatusLoc(city && country ? `${city}, ${country}` : address);
                  setStatusLat(lat ?? null);
                  setStatusLng(lng ?? null);
                }}
                placeholder="e.g. Dubai, UAE"
              />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Note</label>
              <textarea className="form-textarea" rows={2} value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Additional details…"/>
            </div>
            <button type="submit" className="btn btn-primary" disabled={updating} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {updating ? <><div className="spinner"/> Updating…</> : <><RefreshCw size={14}/> Push Update</>}
            </button>
          </form>
        </div>

        {/* Timeline */}
        <div className="as-info-card">
          <div className="as-info-label" style={{ color:'var(--clr-slate-400)', marginBottom:16 }}><Clock size={12} style={{ marginRight:6 }}/>Status History</div>
          {history.length === 0 && <div style={{ fontSize:'0.8rem', color:'var(--clr-slate-500)' }}>No history yet.</div>}
          <div className="as-timeline">
            {[...history].reverse().map((h, i) => {
              const isDone = h.status === 'Delivered';
              const isLatest = i === 0;
              return (
                <div className="as-timeline-item" key={h._id}>
                  <div className={`as-timeline-dot ${isDone ? 'done' : isLatest ? 'active' : ''}`}>
                    {isDone ? <CheckCircle size={13} color="var(--clr-success)"/> : isLatest ? <Clock size={12} color="var(--clr-gold-400)"/> : <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--clr-slate-600)'}}/>}
                  </div>
                  <div className="as-timeline-content">
                    <div className="as-timeline-time">{format(new Date(h.timestamp), 'MMM dd, yyyy · HH:mm')}</div>
                    <StatusBadge status={h.status} size="sm"/>
                    {h.location && <div className="as-timeline-loc"><MapPin size={11}/> {h.location}</div>}
                    {h.note && <div className="as-timeline-note">{h.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDel && (
        <div className="as-modal-bg">
          <div className="as-modal glass">
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'hsla(357,78%,52%,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Trash2 size={20} color="var(--clr-error)"/>
              </div>
              <div>
                <div style={{ fontWeight:700, color:'var(--clr-white)' }}>Delete Shipment</div>
                <div className="text-xs" style={{ color:'var(--clr-slate-400)' }}>{shipment.trackingNumber}</div>
              </div>
              <button onClick={() => setConfirmDel(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--clr-slate-400)', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <p style={{ fontSize:'0.875rem', color:'var(--clr-slate-300)', marginBottom:20 }}>
              Permanently delete this shipment and all its status history? This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setConfirmDel(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }} onClick={handleDelete} disabled={deleting}>
                {deleting ? <><div className="spinner"/> Deleting…</> : <><Trash2 size={14}/> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
