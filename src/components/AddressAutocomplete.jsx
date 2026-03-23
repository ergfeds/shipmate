import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader } from 'lucide-react';
import './AddressAutocomplete.css';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

/**
 * AddressAutocomplete
 *
 * Props:
 *   value      — controlled text value
 *   onChange   — (text: string) => void   — raw text changes
 *   onSelect   — ({ address, city, country, lat, lng }) => void — suggestion picked
 *   placeholder, required, className
 */
export default function AddressAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Enter address…',
  required = false,
  className = 'form-input',
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [activeIdx, setActiveIdx]     = useState(-1);
  const wrapRef  = useRef(null);
  const abortRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (q) => {
      if (!q || q.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
          + `?access_token=${TOKEN}&types=address,place&limit=6&autocomplete=true&language=en`;
        const res  = await fetch(url, { signal: abortRef.current.signal });
        const data = await res.json();
        setSuggestions(data.features || []);
        setOpen(true);
        setActiveIdx(-1);
      } catch (e) {
        if (e.name !== 'AbortError') setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => { fetchSuggestions(value); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (feature) => {
    const ctx     = feature.context || [];
    const cityCtx = ctx.find(c => c.id.startsWith('place') || c.id.startsWith('locality'));
    const regCtx  = ctx.find(c => c.id.startsWith('region'));
    const cntCtx  = ctx.find(c => c.id.startsWith('country'));
    const city    = cityCtx?.text || regCtx?.text || '';
    const country = cntCtx?.text || '';
    const [lng, lat] = feature.center || [undefined, undefined];
    const address = feature.place_name?.split(',')[0]?.trim() || feature.text || '';

    onSelect?.({ address, city, country, lat, lng });
    onChange?.(address);
    setOpen(false);
    setSuggestions([]);
  };

  const handleKey = (e) => {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(suggestions[activeIdx]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const subText = (feat) => feat.place_name?.split(',').slice(1).join(',').trim() || '';

  return (
    <div ref={wrapRef} className="addr-wrap">
      <div className="addr-input-wrap">
        <input
          className={className}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        <span className="addr-icon">
          {loading
            ? <Loader size={14} className="addr-spin"/>
            : <MapPin size={14}/>
          }
        </span>
      </div>

      {open && suggestions.length > 0 && (
        <div className="addr-dropdown">
          {suggestions.map((feat, i) => (
            <button
              key={feat.id}
              type="button"
              className={`addr-item${i === activeIdx ? ' active' : ''}`}
              onMouseDown={() => pick(feat)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <MapPin size={12} className="addr-item-icon"/>
              <div className="addr-item-text">
                <span className="addr-item-main">{feat.place_name?.split(',')[0]?.trim() || feat.text}</span>
                {subText(feat) && <span className="addr-item-sub">{subText(feat)}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
