import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Phone, MessageSquare, PhoneOff, PhoneCall, Globe, Send, Clock, Mic, MicOff, ChevronLeft, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useRingTone } from '../../hooks/useRingTone';
import './AdminLive.css';

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AdminLive() {
  const [tab, setTab] = useState('calls');

  const onlineUsers = useQuery(api.online.getOnlineUsers) || [];
  const calls = useQuery(api.calls.getActiveCalls) || [];
  const sessions = useQuery(api.chat.getActiveSessions) || [];

  return (
    <div>
      <div className="al-page-header">
        <div>
          <h1 className="text-h2" style={{ marginBottom: 2 }}>Live Support</h1>
          <p className="text-sm">Manage real-time chats, calls &amp; active users</p>
        </div>
        <div className="al-tabs">
          <button className={`al-tab${tab === 'calls' ? ' active' : ''}`} onClick={() => setTab('calls')}>
            <Phone size={14} /> Calls
            {calls.length > 0 && <span className="al-tab-badge">{calls.length}</span>}
          </button>
          <button className={`al-tab${tab === 'chats' ? ' active' : ''}`} onClick={() => setTab('chats')}>
            <MessageSquare size={14} /> Chats
            {sessions.length > 0 && <span className="al-tab-badge">{sessions.length}</span>}
          </button>
          <button className={`al-tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
            <Globe size={14} /> Users
            {onlineUsers.length > 0 && <span className="al-tab-badge">{onlineUsers.length}</span>}
          </button>
        </div>
      </div>

      <div className="glass al-body">
        {tab === 'calls' && <AdminCalls calls={calls} />}
        {tab === 'chats' && <AdminChats sessions={sessions} />}
        {tab === 'users' && <AdminUsers users={onlineUsers} />}
      </div>
    </div>
  );
}

function AdminCalls({ calls }) {
  const [activeId, setActiveId] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const activeCall = calls.find(c => c._id === activeId);
  const ringingCalls = calls.filter(c => c.status === 'ringing' && c.caller === 'user');

  const answerCall = useMutation(api.calls.answerCall);
  const rejectCall = useMutation(api.calls.rejectCall);
  const endCall = useMutation(api.calls.endCall);
  const addSignal = useMutation(api.calls.addSignal);
  const signals = useQuery(api.calls.getSignals, activeId ? { callId: activeId } : 'skip') || [];

  const pcRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const processedSignals = useRef(new Set());
  const prevRingingCount = useRef(0);

  const { play: playRing, stop: stopRing } = useRingTone();

  useEffect(() => {
    if (ringingCalls.length > prevRingingCount.current) playRing();
    if (ringingCalls.length === 0) stopRing();
    prevRingingCount.current = ringingCalls.length;
  }, [ringingCalls.length]);

  useEffect(() => {
    const adminInitConnected = calls.find(
      c => c.status === 'connected' && c.caller === 'admin' && c._id !== activeId
    );
    if (adminInitConnected && !pcRef.current) {
      setupWebRTC(adminInitConnected._id, false);
      setActiveId(adminInitConnected._id);
      setMobileDetail(true);
    }
  }, [calls]);

  useEffect(() => {
    if (!pcRef.current || !activeId || signals.length === 0) return;
    processIncomingSignals();
  }, [signals.length, activeId]);

  useEffect(() => {
    if (activeCall?.status !== 'connected') { setDuration(0); return; }
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [activeCall?.status]);

  useEffect(() => {
    if (activeCall && (activeCall.status === 'ended' || activeCall.status === 'missed')) {
      cleanup();
    }
  }, [activeCall?.status]);

  const processIncomingSignals = async () => {
    const userSignals = signals.filter(s => s.sender === 'user' && !processedSignals.current.has(s._id));
    for (const sig of userSignals) {
      processedSignals.current.add(sig._id);
      try {
        const data = JSON.parse(sig.data);
        if (sig.type === 'offer') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          await addSignal({ callId: activeId, sender: 'admin', type: 'answer', data: JSON.stringify(answer) });
        } else if (sig.type === 'ice-candidate') {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(data)); } catch (_) {}
        }
      } catch (e) { console.warn('Admin signal error:', e); }
    }
  };

  const setupWebRTC = async (callId, andAnswer = true) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
      });
      pcRef.current = pc;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.ontrack = e => {
        if (!audioRef.current) {
          const a = new Audio(); a.autoplay = true; a.srcObject = e.streams[0];
          audioRef.current = a; a.play().catch(() => {});
        }
      };
      pc.onicecandidate = e => {
        if (e.candidate) addSignal({ callId, sender: 'admin', type: 'ice-candidate', data: JSON.stringify(e.candidate) });
      };
      if (andAnswer) await answerCall({ callId });
    } catch (err) {
      toast.error('Microphone access required to take calls.');
    }
  };

  const cleanup = useCallback(() => {
    stopRing();
    if (pcRef.current) { try { pcRef.current.close(); } catch (_) {} pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.srcObject = null; audioRef.current = null; }
    processedSignals.current.clear();
    setActiveId(null); setMuted(false); setMobileDetail(false);
  }, [stopRing]);

  const handleAnswer = async (callId) => {
    stopRing();
    processedSignals.current.clear();
    await setupWebRTC(callId, true);
    setActiveId(callId);
    setMobileDetail(true);
  };

  const handleEnd = async (callId) => {
    await endCall({ callId });
    cleanup();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = muted; });
      setMuted(m => !m);
    }
  };

  const isDetailOpen = mobileDetail && !!activeId;

  return (
    <div className={`al-split${isDetailOpen ? ' detail-open' : ''}`}>
      {/* ── Sidebar / list ── */}
      <div className="al-sidebar">
        {calls.length === 0 ? (
          <div className="al-empty">
            <PhoneOff size={36} style={{ opacity: 0.15 }} />
            <p style={{ fontSize: '0.85rem' }}>No active calls</p>
          </div>
        ) : calls.map(c => (
          <div
            key={c._id}
            className={`al-item${activeId === c._id ? ' active' : ''}`}
            onClick={() => { if (c.status === 'connected') { setActiveId(c._id); setMobileDetail(true); } }}
          >
            <div className="al-item-row">
              <span className={`badge badge-sm badge-${c.status === 'ringing' ? 'warning' : 'success'}`}>
                {c.status === 'ringing' ? '● Ringing' : '● Connected'}
              </span>
              <span className="text-xs" style={{ color: 'var(--clr-slate-500)' }}>{format(new Date(c.createdAt), 'HH:mm')}</span>
            </div>
            <div className="al-item-title">{c.trackingNumber ? `#${c.trackingNumber}` : 'Guest User'}</div>
            <div className="al-item-sub">{c.caller === 'user' ? 'User requesting support' : 'Admin initiated'}</div>
            {c.status === 'ringing' && c.caller === 'user' && (
              <div className="al-action-row">
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px' }}
                  onClick={e => { e.stopPropagation(); handleAnswer(c._id); }}
                >
                  <Phone size={13} /> Answer
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px' }}
                  onClick={e => { e.stopPropagation(); rejectCall({ callId: c._id }); stopRing(); }}
                >
                  <PhoneOff size={13} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main / detail ── */}
      <div className="al-main">
        <button className="al-back-btn" onClick={() => { setMobileDetail(false); }}>
          <ChevronLeft size={16} /> Back to Calls
        </button>

        <div className="al-call-panel">
          {!activeCall || activeCall.status !== 'connected' ? (
            <>
              <PhoneOff size={44} style={{ opacity: 0.12, marginBottom: 14 }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--clr-slate-500)' }}>Answer a call to manage it here</p>
            </>
          ) : (
            <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'hsla(145,65%,38%,0.12)',
                border: '2px solid var(--clr-success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                animation: 'al-pulse-call 2s infinite',
              }}>
                <PhoneCall size={32} color="var(--clr-success)" />
              </div>
              <h2 className="text-h2" style={{ marginBottom: 4 }}>Call Active</h2>
              <div style={{ color: 'var(--clr-success)', fontWeight: 700, fontSize: '1.15rem', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Clock size={15} /> {formatDuration(duration)}
              </div>
              <p style={{ color: 'var(--clr-slate-400)', marginBottom: 24, fontSize: '0.88rem' }}>
                {activeCall.trackingNumber ? `Shipment #${activeCall.trackingNumber}` : 'Guest User'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={toggleMute}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    border: `1px solid ${muted ? 'hsla(357,78%,52%,0.5)' : 'hsla(0,0%,100%,0.12)'}`,
                    background: muted ? 'hsla(357,78%,52%,0.1)' : 'hsla(0,0%,100%,0.05)',
                    color: muted ? 'var(--clr-error)' : 'var(--clr-slate-300)',
                    cursor: 'pointer', fontSize: '0.88rem',
                  }}
                >
                  {muted ? <MicOff size={14} /> : <Mic size={14} />}
                  {muted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, padding: '12px 8px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => handleEnd(activeCall._id)}
                >
                  <PhoneOff size={15} /> End Call
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminChats({ sessions }) {
  const [activeId, setActiveId] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const activeSession = sessions.find(s => s._id === activeId);
  const sendMessage = useMutation(api.chat.sendMessage);
  const scrollRef = useRef();
  const [text, setText] = useState('');

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeSession?.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    await sendMessage({ sessionId: activeId, sender: 'admin', text });
    setText('');
  };

  const openChat = (id) => { setActiveId(id); setMobileDetail(true); };
  const goBack = () => { setMobileDetail(false); };

  const isDetailOpen = mobileDetail && !!activeId;

  return (
    <div className={`al-split${isDetailOpen ? ' detail-open' : ''}`}>
      {/* ── Sessions list ── */}
      <div className="al-sidebar">
        {sessions.length === 0 ? (
          <div className="al-empty">
            <MessageSquare size={36} style={{ opacity: 0.15 }} />
            <p style={{ fontSize: '0.85rem' }}>No active chats</p>
          </div>
        ) : sessions.map(s => (
          <div
            key={s._id}
            className={`al-item${activeId === s._id ? ' active' : ''}`}
            onClick={() => openChat(s._id)}
          >
            <div className="al-item-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clr-success)', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
                  {s.userName || 'Guest User'}
                </span>
                <span className="text-xs" style={{ color: 'var(--clr-slate-500)' }}>·{s.fingerprint.substring(0,6)}</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--clr-slate-500)', flexShrink: 0 }}>
                {format(new Date(s.lastActive), 'HH:mm')}
              </span>
            </div>
            <div className="al-item-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
              {s.messages?.[s.messages.length - 1]?.text || 'No messages yet'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Chat detail ── */}
      <div className="al-main">
        <button className="al-back-btn" onClick={goBack}>
          <ChevronLeft size={16} /> Back to Chats
        </button>

        {!activeSession ? (
          <div className="al-empty" style={{ flex: 1 }}>
            <MessageSquare size={44} style={{ opacity: 0.12 }} />
            <p style={{ fontSize: '0.88rem' }}>Select a chat to start responding</p>
          </div>
        ) : (
          <>
            <div className="al-chat-header">
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: 2 }}>
                {activeSession.userName || 'Guest User'}
              </div>
              <div className="text-xs" style={{ color: 'var(--clr-slate-400)' }}>
                ID: {activeSession.fingerprint}
              </div>
            </div>

            <div className="al-chat-messages" ref={scrollRef}>
              {activeSession.messages?.map(m => (
                <div
                  key={m._id}
                  style={{ maxWidth: '78%', alignSelf: m.sender === 'admin' ? 'flex-end' : 'flex-start' }}
                >
                  <div style={{
                    padding: '10px 14px', borderRadius: 16, fontSize: '0.88rem', lineHeight: 1.5,
                    background: m.sender === 'admin' ? 'var(--grad-gold)' : 'hsla(0,0%,100%,0.08)',
                    color: m.sender === 'admin' ? '#000' : '#fff',
                    fontWeight: m.sender === 'admin' ? 500 : 400,
                    borderBottomRightRadius: m.sender === 'admin' ? 4 : 16,
                    borderBottomLeftRadius: m.sender === 'user' ? 4 : 16,
                  }}>
                    {m.text}
                  </div>
                  <div className="text-xs" style={{ marginTop: 4, textAlign: m.sender === 'admin' ? 'right' : 'left', color: 'var(--clr-slate-500)' }}>
                    {format(new Date(m.createdAt), 'MMM dd, HH:mm')}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="al-chat-form">
              <input
                className="form-input"
                style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
                placeholder="Type a response..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button className="chat-send-btn" type="submit" disabled={!text.trim()}>
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function AdminUsers({ users }) {
  const initiateCall = useMutation(api.calls.initiateCall);

  const handleCallUser = async (fingerprint) => {
    try {
      await initiateCall({ fingerprint, caller: 'admin' });
      toast.success('Calling user...');
    } catch (e) {
      toast.error(e.message || 'Failed to call');
    }
  };

  if (users.length === 0) {
    return (
      <div className="al-empty" style={{ width: '100%' }}>
        <Globe size={44} style={{ opacity: 0.12 }} />
        <p style={{ fontSize: '0.9rem' }}>No users online right now</p>
      </div>
    );
  }

  return (
    <div className="al-users-wrap">
      {/* Desktop table — hidden on mobile via CSS */}
      <div className="table-wrap al-users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Region</th>
              <th>Page</th>
              <th>Last Seen</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clr-success)', flexShrink: 0, boxShadow: '0 0 8px hsla(145,65%,50%,0.5)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--clr-white)', fontSize: '0.82rem' }}>{u.fingerprint}</span>
                  </div>
                </td>
                <td className="text-xs">{u.region || 'Unknown'}</td>
                <td className="text-sm">{u.currentPath}</td>
                <td className="text-xs">{format(new Date(u.lastSeen), 'HH:mm:ss')}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleCallUser(u.fingerprint)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <PhoneCall size={13} /> Call
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — shown on mobile via CSS */}
      <div className="al-user-cards al-users-cards-mobile">
        {users.map(u => (
          <div key={u._id} className="al-user-card">
            <div className="al-user-info">
              <div className="al-user-fp">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clr-success)', flexShrink: 0, boxShadow: '0 0 6px hsla(145,65%,50%,0.5)' }} />
                {u.fingerprint}
              </div>
              <div className="al-user-meta">
                <span>{u.region || 'Unknown'}</span>
                <span>·</span>
                <span>{u.currentPath}</span>
                <span>·</span>
                <span>{format(new Date(u.lastSeen), 'HH:mm')}</span>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleCallUser(u.fingerprint)}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10 }}
            >
              <PhoneCall size={14} /> Call
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
