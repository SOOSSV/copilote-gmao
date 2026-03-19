'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2, Plus, Clock, X, MessageCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type Session = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

const N8N_CHAT_URL = process.env.NEXT_PUBLIC_N8N_CHAT_URL || '';
const SESSIONS_KEY = 'copilote_sessions_manager';
const CURRENT_KEY = 'copilote_current_manager';

function loadSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); } catch { return []; }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function createNewSession(): Session {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: 'Nouvelle conversation',
    createdAt: new Date().toISOString(),
    messages: [{
      id: '0',
      role: 'assistant',
      content: 'Bonjour ! Votre nom svp ?',
      timestamp: new Date().toISOString(),
    }],
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function ChatPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>(() => {
    const s = loadSessions();
    return s.length > 0 ? s : [createNewSession()];
  });
  const [currentId, setCurrentId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const saved = localStorage.getItem(CURRENT_KEY);
    const s = loadSessions();
    if (saved && s.find(x => x.id === saved)) return saved;
    return s[0]?.id || '';
  });
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const current = sessions.find(s => s.id === currentId) || sessions[0];
  const messages = current?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { saveSessions(sessions); }, [sessions]);
  useEffect(() => { if (currentId) localStorage.setItem(CURRENT_KEY, currentId); }, [currentId]);

  function updateCurrentMessages(newMessages: Message[]) {
    setSessions(prev => prev.map(s =>
      s.id === currentId ? { ...s, messages: newMessages, title: getTitle(newMessages) } : s
    ));
  }

  function getTitle(msgs: Message[]): string {
    const first = msgs.find(m => m.role === 'user');
    if (!first) return 'Nouvelle conversation';
    return first.content.slice(0, 40) + (first.content.length > 40 ? '...' : '');
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    updateCurrentMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(N8N_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendMessage', sessionId: currentId, chatInput: userMsg.content }),
      });
      const data = await res.json();
      const reply = data?.output || data?.text || data?.message || 'Pas de réponse.';
      updateCurrentMessages([...newMessages, { id: Date.now().toString() + '-ai', role: 'assistant', content: reply, timestamp: new Date().toISOString() }]);
    } catch {
      updateCurrentMessages([...newMessages, { id: Date.now().toString() + '-err', role: 'assistant', content: '⚠️ Erreur de connexion.', timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    const s = createNewSession();
    setSessions(prev => [s, ...prev]);
    setCurrentId(s.id);
    setShowHistory(false);
  }

  function switchSession(id: string) { setCurrentId(id); setShowHistory(false); }

  function deleteSession(id: string) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (id === currentId) {
        if (next.length === 0) { const s = createNewSession(); setCurrentId(s.id); return [s]; }
        setCurrentId(next[0].id);
      }
      return next;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button onClick={() => router.push('/manager')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={18} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px' }}>RR GMAO</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {current?.title || 'Nouvelle conversation'}
          </div>
        </div>
        <button onClick={() => setShowHistory(true)} title="Historique" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6 }}>
          <Clock size={18} />
        </button>
        <button onClick={newConversation} title="Nouvelle conversation" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 6 }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '140px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: msg.role === 'assistant' ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {msg.role === 'assistant' ? <Bot size={14} color="white" /> : <User size={14} color="var(--text-secondary)" />}
            </div>
            <div style={{ maxWidth: '78%' }}>
              <div style={{ background: msg.role === 'assistant' ? 'var(--bg-card)' : 'var(--accent)', border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none', borderRadius: msg.role === 'assistant' ? '14px 14px 14px 4px' : '14px 14px 4px 14px', padding: '10px 13px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: 3, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {formatDate(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="white" />
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', padding: '12px 16px', display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-secondary)', animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite`, display: 'inline-block' }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Décrivez la panne ou posez une question..." rows={1} style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', resize: 'none', outline: 'none', maxHeight: '100px', fontFamily: 'inherit', lineHeight: '1.5' }} />
        <button onClick={sendMessage} disabled={!input.trim() || loading} style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? 'var(--accent)' : 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
          {loading ? <Loader2 size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color={input.trim() ? 'white' : 'var(--text-secondary)'} />}
        </button>
      </div>

      {/* Drawer Historique */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div onClick={() => setShowHistory(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ width: '85%', maxWidth: 340, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={16} color="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Historique</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: 20, padding: '1px 8px' }}>{sessions.length}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={newConversation} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '6px 11px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={13} /> Nouvelle
                </button>
                <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {sessions.map(s => (
                <div key={s.id} onClick={() => switchSession(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, marginBottom: 3, cursor: 'pointer', background: s.id === currentId ? 'rgba(99,102,241,0.15)' : 'transparent', border: `1px solid ${s.id === currentId ? 'rgba(99,102,241,0.4)' : 'transparent'}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageCircle size={13} color={s.id === currentId ? 'var(--accent)' : 'var(--text-secondary)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: s.id === currentId ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: s.id === currentId ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {formatDate(s.createdAt)} · {s.messages.length} msg
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, flexShrink: 0, opacity: 0.5 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        textarea::placeholder{color:var(--text-secondary);}
      `}</style>
    </div>
  );
}
