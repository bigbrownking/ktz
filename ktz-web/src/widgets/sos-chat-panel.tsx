'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, AlertOctagon, MessageSquare, X, CheckCheck, User, Users } from 'lucide-react';
import { loadSession } from '@/shared/lib/auth-store';
import { connectBidirectionalWs } from '@/shared/lib/ws-client';
import { driversApi, chatApi, ApiDriver, ApiChatMessage } from '@/shared/lib/api-client';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'driver' | 'dispatcher';
  text: string;
  timestamp: Date;
  type: 'message' | 'sos' | 'alert';
  threadId: string;
}

interface WsMessage {
  messageId?: string | number;
  senderId?: string | number;
  senderName?: string;
  senderRole?: string;
  text?: string;
  type?: string;
  timestamp?: string;
  threadId?: string | number;
}

function strId(v: unknown): string {
  if (v == null || v === '') return '';
  return String(v);
}

/** Одинаковые user/thread id после JSON/Java/Spring: 5, "5", "5.0", 5n → "5" */
function normalizeId(v: unknown): string {
  if (v == null || v === '') return '';
  if (typeof v === 'bigint') return String(v);
  if (typeof v === 'number' && Number.isFinite(v)) return String(Math.trunc(v));
  const t = String(v).trim();
  if (t === '') return '';
  const n = Number(t);
  if (!Number.isNaN(n) && Number.isFinite(n)) return String(Math.trunc(n));
  return t;
}

function mapApiToChat(m: ApiChatMessage): ChatMessage {
  return {
    id: String(m.id),
    senderId: String(m.senderId),
    senderName: m.senderName,
    senderRole: m.senderRole === 'dispatcher' ? 'dispatcher' : 'driver',
    text: m.text,
    timestamp: new Date(m.createdAt),
    type: (m.type === 'sos' || m.type === 'alert' ? m.type : 'message') as ChatMessage['type'],
    threadId: String(m.threadUserId),
  };
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<((msg: unknown) => void) | null>(null);
  const isOpenRef = useRef(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const session = loadSession();
  const myId = session?.userId?.toString() ?? 'guest';
  const myName = session
    ? `${session.name} ${session.surname}`.trim() || session.username
    : (role === 'driver' ? 'Машинист' : 'Диспетчер');
  const myRole: 'driver' | 'dispatcher' = session?.role === 'ROLE_ADMIN' ? 'dispatcher' : 'driver';

  const [drivers, setDrivers] = useState<ApiDriver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const selectedDriverIdRef = useRef<number | null>(null);
  useEffect(() => { selectedDriverIdRef.current = selectedDriverId; }, [selectedDriverId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, selectedDriverId]);

  useEffect(() => {
    if (isOpen) setUnread(0);
  }, [isOpen]);

  useEffect(() => {
    if (myRole !== 'dispatcher' || !isOpen) return;
    let cancelled = false;
    setDriversLoading(true);
    driversApi.getAll()
      .then(list => {
        if (!cancelled) {
          const onlyDrivers = list.filter(d => d.role === 'ROLE_USER');
          setDrivers(onlyDrivers);
          setSelectedDriverId(prev => {
            if (prev !== null && onlyDrivers.some(d => d.id === prev)) return prev;
            return onlyDrivers[0]?.id ?? null;
          });
        }
      })
      .catch(() => { if (!cancelled) setDrivers([]); })
      .finally(() => { if (!cancelled) setDriversLoading(false); });
    return () => { cancelled = true; };
  }, [myRole, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (myRole === 'dispatcher' && selectedDriverId === null) return;
    let cancelled = false;
    const tid = myRole === 'dispatcher' ? selectedDriverId : undefined;
    setLoadError(null);
    chatApi.getMessages(tid)
      .then(rows => {
        if (cancelled) return;
        const mapped = rows.map(mapApiToChat);
        setMessages(mapped);
        seenMessageIdsRef.current = new Set(mapped.map(m => m.id));
        setLoadError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setMessages([]);
        const msg = e instanceof Error ? e.message : 'Не удалось загрузить историю';
        setLoadError(msg);
        console.error('[chat] load history', e);
      });
    return () => { cancelled = true; };
  }, [isOpen, myRole, selectedDriverId]);

  const handleIncoming = useCallback((raw: unknown) => {
    const session = loadSession();
    const myIdStr = session?.userId != null ? String(session.userId) : 'guest';
    const roleHere: 'driver' | 'dispatcher' = session?.role === 'ROLE_ADMIN' ? 'dispatcher' : 'driver';

    const data = raw as WsMessage;
    if (!data?.text) return;
    const serverMid = data.messageId != null ? String(data.messageId) : '';
    if (serverMid && seenMessageIdsRef.current.has(serverMid)) return;
    const sr = strId(data.senderRole).toLowerCase();
    const isDispatcherMsg = sr === 'dispatcher';
    let tid = normalizeId(data.threadId);
    if (!tid && !isDispatcherMsg && data.senderId != null) {
      tid = normalizeId(data.senderId);
    }
    const incoming: ChatMessage = {
      id: serverMid || `${Date.now()}-${Math.random()}`,
      senderId: strId(data.senderId) || 'unknown',
      senderName: data.senderName ?? (isDispatcherMsg ? 'Диспетчер' : 'Машинист'),
      senderRole: isDispatcherMsg ? 'dispatcher' : 'driver',
      text: data.text,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      type: (data.type as ChatMessage['type']) ?? 'message',
      threadId: tid,
    };
    if (normalizeId(incoming.senderId) === normalizeId(myIdStr)) return;

    if (roleHere === 'driver') {
      const mid = normalizeId(myIdStr);
      if (mid !== 'guest' && tid && tid !== mid) return;
    }

    if (roleHere === 'dispatcher') {
      if (!tid) return;
      setMessages(prev => [...prev, incoming]);
      if (serverMid) seenMessageIdsRef.current.add(serverMid);
      const cur = selectedDriverIdRef.current;
      const open = isOpenRef.current;
      if (!open || cur === null || tid !== normalizeId(cur)) {
        setUnread(n => n + 1);
      }
      return;
    }

    setMessages(prev => [...prev, incoming]);
    if (serverMid) seenMessageIdsRef.current.add(serverMid);
    if (!isOpenRef.current) setUnread(n => n + 1);
  }, []);

  useEffect(() => {
    const conn = connectBidirectionalWs('/ws/chat', handleIncoming, () => setWsConnected(true));
    sendRef.current = conn.send;
    return () => { conn.close(); setWsConnected(false); sendRef.current = null; };
  }, [handleIncoming]);

  const sendMessage = useCallback(async (text: string, type: ChatMessage['type'] = 'message') => {
    if (!text.trim()) return;
    const s = loadSession();
    const sendMyId = s?.userId != null ? String(s.userId) : 'guest';
    const sendRole: 'driver' | 'dispatcher' = s?.role === 'ROLE_ADMIN' ? 'dispatcher' : 'driver';
    const sendName = s
      ? `${s.name} ${s.surname}`.trim() || s.username
      : (role === 'driver' ? 'Машинист' : 'Диспетчер');

    if (sendRole === 'dispatcher' && selectedDriverId === null) return;
    if (sendMyId === 'guest') return;

    setSendError(null);
    try {
      const saved = await chatApi.send({
        threadUserId: sendRole === 'dispatcher' ? selectedDriverId : undefined,
        text: text.trim(),
        type,
      });
      const msg = mapApiToChat(saved);
      seenMessageIdsRef.current.add(String(saved.id));
      setMessages(prev => [...prev, msg]);

      const threadId = sendRole === 'driver' ? sendMyId : normalizeId(selectedDriverId);
      const payload: WsMessage = {
        messageId: saved.id,
        senderId: sendMyId,
        senderName: sendName,
        senderRole: sendRole,
        text: text.trim(),
        type,
        timestamp: new Date().toISOString(),
        threadId,
      };
      sendRef.current?.(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить сообщение';
      setSendError(msg);
      console.error('[chat]', e);
    }
    setInput('');
  }, [role, selectedDriverId]);

  const triggerSOS = useCallback(() => {
    if (!sosConfirm) { setSosConfirm(true); return; }
    setSosConfirm(false);
    setSosSent(true);
    void sendMessage(`🆘 SOS-СИГНАЛ! Машинист ${myName} сообщает об экстренной ситуации! Локомотив остановлен.`, 'sos');
    setIsOpen(true);
    setTimeout(() => setSosSent(false), 5000);
  }, [sosConfirm, myName, sendMessage]);

  /** Как в WhatsApp/Telegram: сегодня — только часы:минуты; вчера — «Вчера, …»; иначе дата + время */
  const formatChatTimestamp = (d: Date) => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);

    const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const time = timeFmt.format(d);

    if (diffDays === 0) return time;
    if (diffDays === 1) return `Вчера, ${time}`;

    const sameYear = d.getFullYear() === now.getFullYear();
    if (sameYear) {
      const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
      return `${dateFmt.format(d)}, ${time}`;
    }
    const dateFmt = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${dateFmt.format(d)}, ${time}`;
  };

  const isMyMsg = (m: ChatMessage) => normalizeId(m.senderId) === normalizeId(myId);

  const visibleMessages = myRole === 'dispatcher' && selectedDriverId !== null
    ? messages.filter(m => normalizeId(m.threadId) === normalizeId(selectedDriverId))
    : messages.filter(m => !m.threadId || normalizeId(m.threadId) === normalizeId(myId));

  const selectedDriver = drivers.find(d => d.id === selectedDriverId) ?? null;
  const panelWidth = myRole === 'dispatcher' ? 520 : 384;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
      {isOpen && (
        <div style={{ width: `${panelWidth}px`, maxHeight: '520px', height: 'min(520px, 85vh)', background: '#141414', border: '1px solid #2e2e2e', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #2a2a2a', background: '#0f0f0f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: wsConnected ? '#22c55e' : '#6b7280', animation: wsConnected ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ color: '#06b6d4', fontWeight: 600, fontSize: '14px' }}>
                {myRole === 'driver' ? 'Чат с диспетчером' : 'Чат с машинистами'}
              </span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} style={{ color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {myRole === 'dispatcher' && (
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', flex: '1 1 auto', minHeight: 0, maxHeight: 'min(360px, 50vh)' }}>
              <div style={{ width: 168, flexShrink: 0, background: '#0a0a0a', borderRight: '1px solid #2a2a2a', overflowY: 'auto', padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '4px 6px', color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Users className="w-3.5 h-3.5" />
                  Машинисты
                </div>
                {driversLoading && (
                  <div style={{ color: '#64748b', fontSize: 12, padding: 8 }}>Загрузка…</div>
                )}
                {!driversLoading && drivers.length === 0 && (
                  <div style={{ color: '#64748b', fontSize: 12, padding: 8 }}>Нет пользователей с ролью машиниста</div>
                )}
                {drivers.map(d => {
                  const active = selectedDriverId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDriverId(d.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 10px',
                        borderRadius: 10,
                        marginBottom: 4,
                        border: active ? '1px solid rgba(6,182,212,0.45)' : '1px solid transparent',
                        background: active ? 'rgba(6,182,212,0.12)' : 'transparent',
                        color: active ? '#e2e8f0' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.name} {d.surname}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>
                        @{d.username}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {selectedDriver && (
                  <div style={{ padding: '8px 12px', background: '#111', borderBottom: '1px solid #262626', fontSize: 12, color: '#94a3b8' }}>
                    Переписка с: <span style={{ color: '#06b6d4', fontWeight: 600 }}>{selectedDriver.name} {selectedDriver.surname}</span>
                  </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myRole === 'dispatcher' && selectedDriverId === null && (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '32px 12px' }}>
                      Выберите машиниста слева, чтобы открыть переписку.
                    </div>
                  )}
                  {visibleMessages.length === 0 && (myRole !== 'dispatcher' || selectedDriverId !== null) && (
                    <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '13px', padding: '32px 0' }}>
                      Нет сообщений. Начните переписку.
                    </div>
                  )}
                  {visibleMessages.map(msg => {
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
                            <span suppressHydrationWarning>{formatChatTimestamp(msg.timestamp)}</span>
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
              </div>
            </div>
          )}

          {myRole === 'driver' && (
            <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visibleMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '13px', padding: '32px 0' }}>
                  Нет сообщений. Начните переписку.
                </div>
              )}
              {visibleMessages.map(msg => {
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
                        <span suppressHydrationWarning>{formatChatTimestamp(msg.timestamp)}</span>
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
          )}

          <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a', background: '#0f0f0f' }}>
            {loadError && (
              <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 10, fontSize: 12, color: '#fecaca', background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.35)' }}>
                {loadError}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); if (sendError) setSendError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { void sendMessage(input); } }}
                placeholder={myRole === 'dispatcher' && selectedDriverId === null ? 'Сначала выберите машиниста…' : 'Написать сообщение…'}
                disabled={myRole === 'dispatcher' && selectedDriverId === null}
                style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', color: '#e2e8f0', outline: 'none', opacity: myRole === 'dispatcher' && selectedDriverId === null ? 0.5 : 1 }}
                onFocus={e => (e.target.style.borderColor = '#06b6d4')}
                onBlur={e => (e.target.style.borderColor = '#333')}
              />
              <button
                type="button"
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || (myRole === 'dispatcher' && selectedDriverId === null)}
                style={{ width: '40px', height: '40px', borderRadius: '12px', background: input.trim() && (myRole !== 'dispatcher' || selectedDriverId !== null) ? '#0891b2' : '#1a1a1a', border: 'none', cursor: input.trim() && (myRole !== 'dispatcher' || selectedDriverId !== null) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Send style={{ width: '16px', height: '16px', color: input.trim() && (myRole !== 'dispatcher' || selectedDriverId !== null) ? '#fff' : '#4b5563' }} />
              </button>
            </div>
            {sendError && (
              <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, fontSize: 12, color: '#fecaca', background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.35)' }}>
                {sendError}
              </div>
            )}
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
                  <button type="button" onClick={triggerSOS} style={{ flex: 1, background: '#dc2626', color: '#fff', padding: '8px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', border: 'none', cursor: 'pointer' }}>ОТПРАВИТЬ</button>
                  <button type="button" onClick={() => setSosConfirm(false)} style={{ flex: 1, background: '#1e1e1e', color: '#94a3b8', padding: '8px', borderRadius: '10px', fontSize: '12px', border: '1px solid #333', cursor: 'pointer' }}>Отмена</button>
                </div>
              </div>
            )}
            <button
              type="button"
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
            type="button"
            onClick={() => setIsOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '16px', fontWeight: 600, fontSize: '14px', background: isOpen ? 'linear-gradient(135deg,#0891b2,#0e7490)' : 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 4px 24px rgba(6,182,212,0.4)', border: '1px solid rgba(103,232,249,0.25)', color: '#fff', cursor: 'pointer' }}
          >
            {isOpen ? <><X style={{ width: 18, height: 18 }} /> Закрыть</> : <><MessageSquare style={{ width: 18, height: 18 }} /> Чат</>}
          </button>
          {!isOpen && unread > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: '#ef4444', borderRadius: '50%', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', border: '2px solid #0f0f0f' }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
