'use client';

import { useState, useEffect } from 'react';
import { SosChatPanel } from '@/widgets/sos-chat-panel';
import { loadSession, isAdmin } from '@/shared/lib/auth-store';

/**
 * Чат только на клиенте после mount — иначе SSR и гидратация расходятся (session в localStorage).
 */
export function ChatPanelRoot() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const session = loadSession();
  const role = session && isAdmin(session) ? 'dispatcher' : 'driver';
  return <SosChatPanel role={role} />;
}
