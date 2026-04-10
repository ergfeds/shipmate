import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Phone, X, Send, Minimize2, Clock, AlertTriangle, PhoneCall, PhoneOff, Mic, MicOff } from 'lucide-react';
import { format } from 'date-fns';
import { useRingTone } from '../hooks/useRingTone';
import './LiveWidget.css';

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Generate or get stable fingerprint
const getFingerprint = () => {
  let fp = localStorage.getItem('shipmate_fp');
  if (!fp) {
    fp = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('shipmate_fp', fp);
  }
  return fp;
};

export default function LiveWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('chat'); // 'chat' or 'call'
  const [minimized, setMinimized] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [connectedCallInfo, setConnectedCallInfo] = useState(null);
  const { pathname } = useLocation();
  const fingerprint = getFingerprint();
  
  const activeCall = useQuery(api.calls.getActiveCallForFingerprint, { fingerprint });
  const { play: playRing, stop: stopRing } = useRingTone();

  // Auto-open widget when admin is calling this user
  useEffect(() => {
    if (activeCall?.status === 'ringing' && activeCall?.caller === 'admin') {
      setIsOpen(true);
      setTab('call');
      setMinimized(false);
      playRing();
    } else {
      stopRing();
    }
  }, [activeCall?.status, activeCall?.caller]);

  // Track connected state for floating bar
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      setCallConnected(true);
      setConnectedCallInfo(activeCall);
      stopRing();
    } else if (!activeCall || activeCall.status === 'ended' || activeCall.status === 'missed' || activeCall.status === 'busy') {
      setCallConnected(false);
      setConnectedCallInfo(null);
    }
  }, [activeCall?.status]);

  // Heartbeat
  const sendHeartbeat = useMutation(api.online.heartbeat);
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    const region = Intl.DateTimeFormat().resolvedOptions().timeZone;
    sendHeartbeat({ fingerprint, path: pathname, region });
    const int = setInterval(() => sendHeartbeat({ fingerprint, path: pathname, region }), 30000);
    return () => clearInterval(int);
  }, [pathname]);

  const showFloatingBar = callConnected && (!isOpen || minimized);

  return (
    <>
      {/* Floating connected call bar — shows when widget is closed/minimized */}
      {showFloatingBar && (
        <FloatingCallBar
          call={connectedCallInfo}
          onOpen={() => { setIsOpen(true); setTab('call'); setMinimized(false); }}
        />
      )}

      <div className={`live-widget ${isOpen ? 'open' : ''}`}>
        {!isOpen && (
          <div className="widget-triggers">
            <button 
              className="widget-trigger call-trigger"
              onClick={() => { setTab('call'); setIsOpen(true); }}
              aria-label="Open Call Support"
            >
              <PhoneCall size={24} />
              {activeCall?.status === 'ringing' && activeCall?.caller === 'admin' && (
                <span className="widget-badge">!</span>
              )}
            </button>
            <button 
              className="widget-trigger chat-trigger"
              onClick={() => { setTab('chat'); setIsOpen(true); }}
              aria-label="Open Live Chat"
            >
              <MessageSquare size={24} />
            </button>
          </div>
        )}

        {isOpen && (
          <div className="widget-panel glass">
            <div className="widget-header">
              <div style={{ display: 'flex', gap: 16 }}>
                <button className={`widget-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
                  <MessageSquare size={16} /> Chat
                </button>
                <button className={`widget-tab ${tab === 'call' ? 'active' : ''}`} onClick={() => setTab('call')}>
                  <Phone size={16} /> Live Call
                  {activeCall?.status === 'ringing' && activeCall?.caller === 'admin' && (
                    <span className="widget-badge" style={{ position: 'static', marginLeft: 4 }}>!</span>
                  )}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="widget-action" onClick={() => setMinimized(!minimized)}>
                  <Minimize2 size={16} />
                </button>
                <button className="widget-action" onClick={() => setIsOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="widget-body" style={{ display: minimized ? 'none' : 'flex' }}>
              {tab === 'chat' ? <ChatTab fingerprint={fingerprint} /> : <CallTab fingerprint={fingerprint} activeCall={activeCall} stopRing={stopRing} />}
            </div>
          </div>
        )}
      </div>
      {isOpen && <div className="widget-mobile-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

function FloatingCallBar({ call, onOpen }) {
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      onClick={onOpen}
      style={{
        position: 'fixed', bottom: 100, right: 24, zIndex: 9998,
        background: 'hsla(145,65%,15%,0.95)',
        border: '1px solid hsla(145,65%,38%,0.5)',
        borderRadius: 40, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', boxShadow: '0 8px 32px hsla(145,65%,20%,0.5)',
        animation: 'slideInRight 0.3s ease',
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--clr-success)', animation: 'pulseDot 1.5s infinite' }} />
      <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
        {call?.trackingNumber ? `Call · #${call.trackingNumber}` : 'Call Connected'}
      </span>
      <span style={{ color: 'var(--clr-success)', fontWeight: 700, fontSize: '0.82rem' }}>
        {formatDuration(duration)}
      </span>
    </div>
  );
}

function ChatTab({ fingerprint }) {
  const session = useQuery(api.chat.getSession, { fingerprint });
  const startSession = useMutation(api.chat.startSession);
  const sendMessage = useMutation(api.chat.sendMessage);
  const messages = useQuery(api.chat.getMessages, { sessionId: session?._id }) || [];
  
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await startSession({ fingerprint, userName: name });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !session) return;
    await sendMessage({ sessionId: session._id, sender: 'user', text });
    setText('');
  };

  if (!session) {
    return (
      <form onSubmit={handleStart} className="widget-start">
        <h3 className="text-h3" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Welcome to Velox Global Cargo</h3>
        <p className="text-sm" style={{ marginBottom: 20 }}>Please enter your name to start chatting with our logistics experts.</p>
        <input className="form-input" placeholder="Your Name" value={name} onChange={e=>setName(e.target.value)} required />
        <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 12 }}>Start Chat</button>
      </form>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40, fontSize: '0.8rem' }}>
            Say hello to a Velox Global Cargo representative!
          </div>
        )}
        {messages.map(m => (
          <div key={m._id} className={`chat-bubble ${m.sender === 'user' ? 'outgoing' : 'incoming'}`}>
            <div className="chat-text">{m.text}</div>
            <div className="chat-time">{format(new Date(m.createdAt), 'HH:mm')}</div>
          </div>
        ))}
      </div>
      <form className="chat-input-area" onSubmit={handleSend}>
        <input className="form-input" style={{ borderRadius: 'var(--radius-full)' }} placeholder="Type a message..." value={text} onChange={e=>setText(e.target.value)} />
        <button type="submit" className="chat-send-btn" disabled={!text.trim()}><Send size={15} /></button>
      </form>
    </div>
  );
}

function CallTab({ fingerprint, activeCall, stopRing }) {
  const initiateCall = useMutation(api.calls.initiateCall);
  const answerCall = useMutation(api.calls.answerCall);
  const endCall = useMutation(api.calls.endCall);
  const rejectCall = useMutation(api.calls.rejectCall);
  const addSignal = useMutation(api.calls.addSignal);
  const signals = useQuery(api.calls.getSignals, activeCall?._id ? { callId: activeCall._id } : 'skip') || [];
  const waitTime = useQuery(api.calls.getUserWaitTime) || 0;
  const isAdminBusy = useQuery(api.calls.isAdminBusy) || false;

  const shipment = useQuery(
    api.shipments.getByTracking,
    activeCall?.trackingNumber && !activeCall.trackingNumber.includes('@')
      ? { trackingNumber: activeCall.trackingNumber }
      : 'skip'
  );

  const [trackingInput, setTrackingInput] = useState('');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const pcRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const processedSignals = useRef(new Set());

  // Send OS notification when admin calls user
  useEffect(() => {
    if (activeCall?.status === 'ringing' && activeCall?.caller === 'admin') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📞 Velox Global Cargo Agent Calling', {
          body: 'A Velox Global Cargo support agent is calling you.',
          icon: '/favicon.ico',
        });
      }
    }
  }, [activeCall?._id, activeCall?.status]);

  // Setup WebRTC when call becomes connected (user sends the offer)
  useEffect(() => {
    if (activeCall?.status === 'connected' && !pcRef.current) {
      setupWebRTC();
    }
  }, [activeCall?.status]);

  // Process incoming admin signals (answer + ice)
  useEffect(() => {
    if (!pcRef.current || !activeCall || signals.length === 0) return;
    processIncomingSignals();
  }, [signals.length]);

  // Call duration timer
  useEffect(() => {
    if (activeCall?.status !== 'connected') { setDuration(0); return; }
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [activeCall?.status]);

  // Cleanup WebRTC when call ends
  useEffect(() => {
    if (!activeCall || activeCall.status === 'ended' || activeCall.status === 'missed' || activeCall.status === 'busy') {
      cleanupWebRTC();
    }
  }, [activeCall?.status]);

  const cleanupWebRTC = () => {
    if (pcRef.current) { try { pcRef.current.close(); } catch (_) {} pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.srcObject = null; audioRef.current = null; }
    processedSignals.current.clear();
    setMuted(false);
  };

  const processIncomingSignals = async () => {
    const adminSignals = signals
      .filter(s => s.sender === 'admin' && !processedSignals.current.has(s._id))
      .sort((a, b) => (a.type === 'answer' ? -1 : b.type === 'answer' ? 1 : 0));
    for (const sig of adminSignals) {
      processedSignals.current.add(sig._id);
      try {
        const data = JSON.parse(sig.data);
        if (sig.type === 'answer') {
          if (pcRef.current && pcRef.current.signalingState === 'have-local-offer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
          }
        } else if (sig.type === 'ice-candidate') {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(data)); } catch (_) {}
        }
      } catch (e) { console.warn('User signal error:', e); }
    }
  };

  async function setupWebRTC() {
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
        const remoteStream = e.streams?.[0] || new MediaStream([e.track]);
        if (!audioRef.current) {
          const a = new Audio();
          a.autoplay = true;
          a.srcObject = remoteStream;
          audioRef.current = a;
          a.play().catch(() => {});
        } else {
          audioRef.current.srcObject = remoteStream;
          audioRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = e => {
        if (e.candidate && activeCall) {
          addSignal({ callId: activeCall._id, sender: 'user', type: 'ice-candidate', data: JSON.stringify(e.candidate) });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await addSignal({ callId: activeCall._id, sender: 'user', type: 'offer', data: JSON.stringify(offer) });
    } catch (err) {
      console.warn('WebRTC Setup Error', err);
      setError('Microphone access is required for voice calls.');
    }
  }

  const handleCall = async (e) => {
    e.preventDefault();
    setError('');
    const t = trackingInput.trim();
    if (!t) { setError('Please provide a Tracking Number or Email.'); return; }
    try {
      await initiateCall({ fingerprint, caller: 'user', trackingNumber: t });
    } catch (err) {
      setError(err.message || 'Call failed. Please check your tracking number or email.');
    }
  };

  const handleAnswer = async () => {
    setError('');
    if (stopRing) stopRing();
    try {
      await answerCall({ callId: activeCall._id });
      // WebRTC setup is triggered by useEffect watching status === 'connected'
    } catch (err) {
      console.warn('Answer error', err);
      setError('Could not access microphone.');
    }
  };

  const handleHangup = async () => {
    if (stopRing) stopRing();
    cleanupWebRTC();
    if (activeCall) await endCall({ callId: activeCall._id });
  };

  const handleReject = async () => {
    if (stopRing) stopRing();
    await rejectCall({ callId: activeCall._id });
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = muted; });
      setMuted(m => !m);
    }
  };

  if (!activeCall || activeCall.status === 'ended' || activeCall.status === 'missed') {
    return (
      <form onSubmit={handleCall} className="widget-start">
        <h3 className="text-h3" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Live Voice Support</h3>
        <p className="text-sm" style={{ marginBottom: 20 }}>
          Enter your <strong style={{ color: 'var(--clr-gold-400)' }}>Tracking Number</strong> or <strong style={{ color: 'var(--clr-gold-400)' }}>Email</strong> to verify and speak with a support agent.
        </p>
        <input
          className="form-input"
          placeholder="e.g. SHMJK2A4RP or email@example.com"
          value={trackingInput}
          onChange={e => setTrackingInput(e.target.value)}
          required
        />
        {error && <div className="form-error" style={{ marginTop: 10 }}>{error}</div>}
        <button className="btn btn-teal" type="submit" style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <PhoneCall size={15} /> Call Agent
        </button>
      </form>
    );
  }

  return (
    <div className="call-container">

      {/* ── Calling Agent (user initiated, waiting) ── */}
      {activeCall.status === 'ringing' && activeCall.caller === 'user' && !isAdminBusy && (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="pulse-dot pulse-dot-gold" style={{ width: 72, height: 72, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={28} color="var(--clr-navy-950)" />
          </div>
          <h3 className="text-h3" style={{ marginBottom: 8 }}>Calling Agent...</h3>
          <p className="text-sm" style={{ marginBottom: 4 }}>Please wait while we connect you.</p>
          {activeCall.trackingNumber && (
            <p className="text-xs" style={{ color: 'var(--clr-gold-400)', marginTop: 8 }}>
              Shipment #{activeCall.trackingNumber}
            </p>
          )}
        </div>
      )}

      {/* ── Waiting / Admin busy ── */}
      {activeCall.status === 'ringing' && activeCall.caller === 'user' && isAdminBusy && (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'hsla(38,90%,50%,0.15)', border: '2px solid var(--clr-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Clock size={28} color="var(--clr-warning)" />
          </div>
          <h3 className="text-h3" style={{ marginBottom: 8 }}>Waiting in Queue</h3>
          <p className="text-sm">Estimated wait: <strong style={{ color: 'var(--clr-warning)' }}>{waitTime} min{waitTime !== 1 ? 's' : ''}</strong></p>
        </div>
      )}

      {/* ── Incoming call from admin ── */}
      {activeCall.status === 'ringing' && activeCall.caller === 'admin' && (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="pulse-dot pulse-dot-gold" style={{ width: 72, height: 72, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall size={28} color="var(--clr-navy-950)" />
          </div>
          <h3 className="text-h3" style={{ marginBottom: 6 }}>Incoming Call</h3>
          <p className="text-sm" style={{ marginBottom: 4 }}>A Velox Global Cargo support agent is calling you.</p>
          {error && <div className="form-error" style={{ marginTop: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, width: '100%' }}>
            <button className="btn btn-primary" onClick={handleAnswer} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Phone size={15} /> Answer
            </button>
            <button className="btn btn-danger" onClick={handleReject} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <PhoneOff size={15} /> Decline
            </button>
          </div>
        </div>
      )}

      {/* ── Busy / No agents available ── */}
      {activeCall.status === 'busy' && (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={48} color="var(--clr-warning)" style={{ margin: '0 auto 16px' }} />
          <h3 className="text-h3" style={{ marginBottom: 8 }}>All Agents Busy</h3>
          <p className="text-sm">Please try again in a few minutes or use the chat tab.</p>
        </div>
      )}

      {/* ── Connected state ── */}
      {activeCall.status === 'connected' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'hsla(145,65%,38%,0.12)',
            border: '2px solid var(--clr-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 30px hsla(145,65%,38%,0.25)',
            animation: 'pulse-success-user 2s infinite',
          }}>
            <Phone size={30} color="var(--clr-success)" />
          </div>
          <h3 className="text-h3" style={{ marginBottom: 4 }}>Call Connected</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--clr-success)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
            <Clock size={14} /> {formatDuration(duration)}
          </div>

          {shipment && (
            <div style={{ textAlign: 'left', background: 'hsla(0,0%,100%,0.05)', padding: '12px 16px', borderRadius: 12, marginBottom: 20, border: '1px solid hsla(0,0%,100%,0.08)', width: '100%' }}>
              <p className="text-xs" style={{ color: 'var(--clr-gold-400)', marginBottom: 6, fontWeight: 600 }}>SHIPMENT #{shipment.trackingNumber}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <div>
                  <div className="text-xs" style={{ color: 'var(--clr-slate-500)' }}>From</div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>{shipment.senderName}</div>
                </div>
                <div style={{ color: 'var(--clr-gold-500)', alignSelf: 'center' }}>→</div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-xs" style={{ color: 'var(--clr-slate-500)' }}>To</div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>{shipment.receiverName}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
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
            <button className="btn btn-danger" onClick={handleHangup} style={{ flex: 1, padding: '10px 8px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <PhoneOff size={14} /> End Call
            </button>
          </div>
        </div>
      )}

      {/* Cancel button for ringing states (user-initiated) */}
      {activeCall.status === 'ringing' && activeCall.caller === 'user' && (
        <button className="btn btn-danger" onClick={handleHangup} style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <PhoneOff size={15} /> Cancel Call
        </button>
      )}

      <style>{`
        @keyframes pulse-success-user {
          0%, 100% { box-shadow: 0 0 0 0 hsla(145,65%,38%,0.4); }
          50% { box-shadow: 0 0 0 12px hsla(145,65%,38%,0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
