'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, AlertOctagon, MessageSquare, X, CheckCheck, User } from 'lucide-react';
import { loadSession } from '@/shared/lib/auth-store';
import { connectBidirectionalWs } from '@/shared/lib/ws-client';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'driver' | 'dispatcher';
  text: string;
  timestamp: Date;
  type: 'message' | 'sos' | 'alert';
}

interface WsMessage {
  senderId?: string;
  senderName?: string;
  senderRole?: string;
  text?: string;
  type?: string;
  timestamp?: string;
}

interface Props {
  role?: 'driver' | 'dispatcher';
}

export function SosChatPanel({ role = 'driver' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sosConfirm, setSosConfirm] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [unread, setUnread] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<((msg: unknown) => void) | null>(null);

  const session = loadSession();
  const myId = session?.userId?.toString() ?? 'guest';
  const myName = session
    ? `${session.name} ${session.surname}`.trim() || session.username
    : (role === 'driver' ? 'Машинист' : 'Диспетчер');
  const myRole: 'driver' | 'dispatcher' = session?.role === 'ROLE_ADMIN' ? 'dispatcher' : 'driver';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setUnread(0);
  }, [isOpen]);

  const handleIncoming = useCallback((raw: unknown) => {
    const data = raw as WsMessage;
    if (!data?.text) return;
    const incoming: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      senderId: data.senderId ?? 'unknown',
      senderName: data.senderName ?? (data.senderRole === 'dispatcher' ? 'Диспетчер' : 'Машинист'),
      senderRole: (data.senderRole === 'dispatcher' ? 'dispatcher' : 'driver'),
      text: data.text,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      type: (data.type as ChatMessage['type']) ?? 'message',
    };
    if (incoming.senderId === myId) return;
    setMessages(prev => [...prev, incoming]);
    setUnread(n => n + 1);
  }, [myId]);

  useEffect(() => {
    const conn = connectBidirectionalWs('/ws/chat', handleIncoming, () => setWsConnected(true));
    sendRef.current = conn.send;
    return () => { conn.close(); setWsConnected(false); sendRef.current = null; };
  }, [handleIncoming]);

  const sendMessage = useCallback((text: string, type: ChatMessage['type'] = 'message') => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: myId,
      senderName: myName,
      senderRole: myRole,
      text: text.trim(),
      timestamp: new Date(),
      type,
    };
    setMessages(prev => [...prev, msg]);

    const payload: WsMessage = {
      senderId: myId,
      senderName: myName,
      senderRole: myRole,
      text: text.trim(),
      type,
      timestamp: new Date().toISOString(),
    };

    sendRef.current?.(payload);
    setInput('');
  }, [myId, myName, myRole]);

  const triggerSOS = useCallback(() => {
    if (!sosConfirm) { setSosConfirm(true); return; }
    setSosConfirm(false);
    setSosSent(true);
    sendMessage(`🆘 SOS-СИГНАЛ! Машинист ${myName} сообщает об экстренной ситуации! Локомотив остановлен.`, 'sos');
    setIsOpen(true);
    setTimeout(() => setSosSent(false), 5000);
  }, [sosConfirm, myName, sendMessage]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const isMyMsg = (m: ChatMessage) => m.senderId === myId;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
      {isOpen && (
        <div style={{ width: '384px', maxHeight: '520px', background: '#141414', border: '1px solid #2e2e2e', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #2a2a2a', background: '#0f0f0f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: wsConnected ? '#22c55e' : '#6b7280', animation: wsConnected ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ color: '#06b6d4', fontWeight: 600, fontSize: '14px' }}>
                {myRole === 'driver' ? 'Чат с диспетчером' : 'Чат с машинистами'}
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '13px', padding: '32px 0' }}>
                Нет сообщений. Начните переписку.
              </div>
            )}
            {messages.map(msg => {
              const mine = isMyMsg(msg);
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  {!mine && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e1e1e', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0 }}>
                      <User style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                    </div>
                  )}
                  <div style={{ maxWidth: '75%', borderRadius: '16px', padding: '10px 14px', background: msg.type === 'sos' ? 'rgba(127,29,29,0.5)' : msg.type === 'alert' ? 'rgba(120,53,15,0.3)' : mine ? 'rgba(8,145,178,0.3)' : '#1e1e1e', border: `1px solid ${msg.type === 'sos' ? 'rgba(239,68,68,0.4)' : msg.type === 'alert' ? 'rgba(245,158,11,0.3)' : mine ? 'rgba(6,182,212,0.3)' : '#333'}` }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: msg.senderRole === 'dispatcher' ? '#06b6d4' : '#22c55e', fontWeight: 600 }}>
                        {msg.senderName}
                      </span>
                      <span>·</span>
                      <span suppressHydrationWarning>{formatTime(msg.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: msg.type === 'sos' ? '#fca5a5' : '#e2e8f0', fontWeight: msg.type === 'sos' ? 600 : 400 }}>
                      {msg.text}
                    </div>
                    {mine && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <CheckCheck style={{ width: '12px', height: '12px', color: '#06b6d4' }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a', background: '#0f0f0f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { sendMessage(input); } }}
                placeholder="Написать сообщение..."
                style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', color: '#e2e8f0', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#06b6d4')}
                onBlur={e => (e.target.style.borderColor = '#333')}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                style={{ width: '40px', height: '40px', borderRadius: '12px', background: input.trim() ? '#0891b2' : '#1a1a1a', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Send style={{ width: '16px', height: '16px', color: input.trim() ? '#fff' : '#4b5563' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
        {myRole === 'driver' && (
          <div style={{ position: 'relative' }}>
            {sosConfirm && (
              <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '10px', width: '224px', zIndex: 10, background: '#1a0000', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '16px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', color: '#fca5a5', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Подтвердите SOS!</div>
                <div style={{ color: 'rgba(252,165,165,0.7)', fontSize: '12px', marginBottom: '12px' }}>Диспетчер получит экстренный сигнал.</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={triggerSOS} style={{ flex: 1, background: '#dc2626', color: '#fff', padding: '8px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', border: 'none', cursor: 'pointer' }}>ОТПРАВИТЬ</button>
                  <button onClick={() => setSosConfirm(false)} style={{ flex: 1, background: '#1e1e1e', color: '#94a3b8', padding: '8px', borderRadius: '10px', fontSize: '12px', border: '1px solid #333', cursor: 'pointer' }}>Отмена</button>
                </div>
              </div>
            )}
            <button
              onClick={triggerSOS}
              title="SOS — экстренный вызов"
              className={sosSent ? 'animate-pulse' : ''}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '16px', fontWeight: 700, fontSize: '14px', background: sosSent ? '#7f1d1d' : 'linear-gradient(135deg,#dc2626,#991b1b)', boxShadow: '0 4px 24px rgba(220,38,38,0.45)', border: '1px solid rgba(248,113,113,0.3)', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}
            >
              <AlertOctagon style={{ width: 18, height: 18, flexShrink: 0 }} />
              {sosSent ? 'ОТПРАВЛЕН' : 'SOS'}
            </button>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '16px', fontWeight: 600, fontSize: '14px', background: isOpen ? 'linear-gradient(135deg,#0891b2,#0e7490)' : 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 4px 24px rgba(6,182,212,0.4)', border: '1px solid rgba(103,232,249,0.25)', color: '#fff', cursor: 'pointer' }}
          >
            {isOpen ? <><X style={{ width: 18, height: 18 }} /> Закрыть</> : <><MessageSquare style={{ width: 18, height: 18 }} /> Чат</>}
          </button>
          {!isOpen && unread > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: '#ef4444', borderRadius: '50%', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', border: '2px solid #0f0f0f' }}>
              {unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
