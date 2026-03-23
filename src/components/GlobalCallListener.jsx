import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocation } from 'react-router-dom';
import { PhoneCall, Phone, PhoneOff, Package, MicOff, Mic, Clock } from 'lucide-react';
import { useRingTone } from '../hooks/useRingTone';

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function GlobalCallListener() {
  const { pathname } = useLocation();
  const isOnLivePage = pathname.startsWith('/admin/live');

  const calls = useQuery(api.calls.getActiveCalls) || [];
  const answerCall = useMutation(api.calls.answerCall);
  const rejectCall = useMutation(api.calls.rejectCall);
  const endCall = useMutation(api.calls.endCall);
  const addSignal = useMutation(api.calls.addSignal);

  // Which call the admin answered from this widget
  const [answeredCallId, setAnsweredCallId] = useState(null);
  const [uiState, setUiState] = useState('idle'); // idle | ringing | answering | connected
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [micError, setMicError] = useState('');

  const pcRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const processedSignals = useRef(new Set());
  const notifiedCalls = useRef(new Set());

  const { play: playRing, stop: stopRing } = useRingTone();

  // Ringing call from user (admin hasn't answered yet)
  const ringingCall = calls.find(c => c.status === 'ringing' && c.caller === 'user');

  // Track the answered call's current state
  const activeCall = answeredCallId ? calls.find(c => c._id === answeredCallId) : null;

  // Signals for the answered call
  const signals = useQuery(
    api.calls.getSignals,
    answeredCallId ? { callId: answeredCallId } : 'skip'
  ) || [];

  // Shipment info for the ringing call
  const shipment = useQuery(
    api.shipments.getByTracking,
    ringingCall?.trackingNumber && !ringingCall.trackingNumber.includes('@')
      ? { trackingNumber: ringingCall.trackingNumber }
      : 'skip'
  );

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle new ringing calls — intentionally excludes uiState from deps to
  // prevent re-triggering playRing() when uiState changes after stopRing().
  useEffect(() => {
    if (ringingCall && !isOnLivePage) {
      // Only start ringing if we aren't already in a call
      setUiState(prev => (prev === 'idle' ? 'ringing' : prev));
      playRing(); // guarded internally: no-op if already playing
      // OS notification (once per call)
      if (!notifiedCalls.current.has(ringingCall._id)) {
        notifiedCalls.current.add(ringingCall._id);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('📞 Incoming Support Call', {
            body: ringingCall.trackingNumber
              ? `Shipment #${ringingCall.trackingNumber}`
              : 'Guest user requesting support',
            icon: '/favicon.ico',
          });
        }
      }
    } else if (!ringingCall) {
      // Call gone (rejected/missed/answered) — stop ring and reset if still ringing
      stopRing();
      setUiState(prev => (prev === 'ringing' ? 'idle' : prev));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringingCall?._id, isOnLivePage]);

  // Monitor answered call status changes
  useEffect(() => {
    if (!activeCall) return;
    if (activeCall.status === 'ended' || activeCall.status === 'missed' || activeCall.status === 'busy') {
      cleanup();
    }
  }, [activeCall?.status]);

  // Call duration timer
  useEffect(() => {
    if (uiState !== 'connected') { setDuration(0); return; }
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [uiState]);

  // Process WebRTC signals when we have an answered call
  useEffect(() => {
    if (!pcRef.current || !answeredCallId || signals.length === 0) return;
    processIncomingSignals();
  }, [signals.length, answeredCallId]);

  const processIncomingSignals = async () => {
    const userSignals = signals.filter(
      s => s.sender === 'user' && !processedSignals.current.has(s._id)
    );
    for (const sig of userSignals) {
      processedSignals.current.add(sig._id);
      try {
        const data = JSON.parse(sig.data);
        if (sig.type === 'offer') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          await addSignal({ callId: answeredCallId, sender: 'admin', type: 'answer', data: JSON.stringify(answer) });
        } else if (sig.type === 'ice-candidate') {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(data)); } catch (_) {}
        }
      } catch (e) { console.warn('Signal error (admin):', e); }
    }
  };

  const cleanup = useCallback(() => {
    stopRing();
    if (pcRef.current) { try { pcRef.current.close(); } catch (_) {} pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.srcObject = null; audioRef.current = null; }
    processedSignals.current.clear();
    setAnsweredCallId(null);
    setUiState('idle');
    setMuted(false);
    setMicError('');
  }, [stopRing]);

  const handleAnswer = async () => {
    if (!ringingCall) return;
    stopRing();
    setUiState('answering');
    setMicError('');
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });
      pcRef.current = pc;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = e => {
        if (!audioRef.current) {
          const a = new Audio();
          a.autoplay = true;
          a.srcObject = e.streams[0];
          audioRef.current = a;
          a.play().catch(() => {});
        }
      };

      pc.onicecandidate = e => {
        if (e.candidate) {
          addSignal({ callId: ringingCall._id, sender: 'admin', type: 'ice-candidate', data: JSON.stringify(e.candidate) });
        }
      };

      await answerCall({ callId: ringingCall._id });
      setAnsweredCallId(ringingCall._id);
      setUiState('connected');
    } catch (err) {
      console.warn('Answer error:', err);
      setMicError('Microphone access required to answer.');
      setUiState('ringing');
    }
  };

  const handleReject = async () => {
    if (!ringingCall) return;
    stopRing();
    await rejectCall({ callId: ringingCall._id });
    setUiState('idle');
  };

  const handleHangup = async () => {
    if (answeredCallId) await endCall({ callId: answeredCallId });
    cleanup();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = muted; });
      setMuted(m => !m);
    }
  };

  // Don't render anything if admin is on the live page (it handles its own UI)
  if (isOnLivePage) return null;
  if (uiState === 'idle' && !ringingCall) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 99999,
      background: 'var(--clr-navy-900)',
      border: uiState === 'connected'
        ? '1px solid hsla(145,65%,38%,0.5)'
        : '1px solid hsla(40,95%,52%,0.4)',
      borderRadius: 'var(--radius-xl)',
      padding: 20,
      boxShadow: uiState === 'connected'
        ? '0 10px 50px hsla(145,65%,20%,0.5), 0 0 0 1px hsla(145,65%,38%,0.2)'
        : '0 10px 50px rgba(0,0,0,0.6)',
      width: 300,
      display: 'flex', flexDirection: 'column', gap: 14,
      animation: 'slideInLeft 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>

      {/* Ringing state */}
      {(uiState === 'ringing' || uiState === 'answering') && ringingCall && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="pulse-dot pulse-dot-gold" style={{
              width: 52, height: 52, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
            }}>
              <PhoneCall size={22} color="var(--clr-navy-950)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-gold-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                {uiState === 'answering' ? 'Connecting...' : 'Incoming Call'}
              </div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ringingCall.trackingNumber ? `#${ringingCall.trackingNumber}` : 'Guest User'}
              </div>
            </div>
          </div>

          {shipment && (
            <div style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.07)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--clr-slate-400)', fontSize: '0.78rem', marginBottom: 6 }}>
                <Package size={12} /> {shipment.packageType} · {shipment.weight}{shipment.weightUnit}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ color: 'var(--clr-slate-500)', fontSize: '0.7rem' }}>From</div>
                  <div style={{ color: '#fff', fontWeight: 600, maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shipment.senderName}</div>
                  <div style={{ color: 'var(--clr-slate-400)', fontSize: '0.7rem' }}>{shipment.senderCity}</div>
                </div>
                <div style={{ color: 'var(--clr-gold-500)', alignSelf: 'center', fontSize: '1.1rem' }}>→</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--clr-slate-500)', fontSize: '0.7rem' }}>To</div>
                  <div style={{ color: '#fff', fontWeight: 600, maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shipment.receiverName}</div>
                  <div style={{ color: 'var(--clr-slate-400)', fontSize: '0.7rem' }}>{shipment.receiverCity}</div>
                </div>
              </div>
            </div>
          )}

          {micError && (
            <div style={{ fontSize: '0.78rem', color: 'var(--clr-error)', background: 'hsla(357,78%,52%,0.1)', padding: '8px 10px', borderRadius: 8 }}>
              {micError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleAnswer}
              disabled={uiState === 'answering'}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Phone size={15} />
              {uiState === 'answering' ? 'Connecting...' : 'Answer'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleReject}
              disabled={uiState === 'answering'}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <PhoneOff size={15} /> Reject
            </button>
          </div>
        </>
      )}

      {/* Connected state */}
      {uiState === 'connected' && activeCall && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'hsla(145,65%,38%,0.15)',
              border: '2px solid var(--clr-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px hsla(145,65%,38%,0.3)',
              animation: 'pulse-success 2s infinite',
            }}>
              <Phone size={20} color="var(--clr-success)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                Call Active
              </div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeCall.trackingNumber ? `#${activeCall.trackingNumber}` : 'Guest User'}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--clr-success)', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
              <Clock size={12} />
              {formatDuration(duration)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleMute}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                border: `1px solid ${muted ? 'hsla(357,78%,52%,0.5)' : 'hsla(0,0%,100%,0.12)'}`,
                background: muted ? 'hsla(357,78%,52%,0.12)' : 'hsla(0,0%,100%,0.05)',
                color: muted ? 'var(--clr-error)' : 'var(--clr-slate-300)',
                cursor: 'pointer', fontSize: '0.84rem',
              }}
            >
              {muted ? <MicOff size={14} /> : <Mic size={14} />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleHangup}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <PhoneOff size={14} /> End Call
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes pulse-success {
          0%, 100% { box-shadow: 0 0 0 0 hsla(145,65%,38%,0.4); }
          50% { box-shadow: 0 0 0 8px hsla(145,65%,38%,0); }
        }
      `}</style>
    </div>
  );
}
