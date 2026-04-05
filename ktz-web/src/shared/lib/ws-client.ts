const WS_BASE = process.env.NEXT_PUBLIC_TELEMETRY_WS_URL ?? 'ws://localhost:8082';

export function connectWs(
  path: string,
  onMessage: (data: unknown) => void,
  onOpen?: () => void,
  onClose?: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function connect() {
    try {
      ws = new WebSocket(`${WS_BASE}${path}`);

      ws.onopen = () => { onOpen?.(); };

      ws.onmessage = (e) => {
        try { onMessage(JSON.parse(e.data as string)); } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => { /* handled in onclose */ };

      ws.onclose = () => {
        onClose?.();
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      };
    } catch {
      onClose?.();
      if (!closed) reconnectTimer = setTimeout(connect, 3000);
    }
  }

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}

export function connectBidirectionalWs(
  path: string,
  onMessage: (data: unknown) => void,
  onOpen?: () => void,
): { close: () => void; send: (data: unknown) => void } {
  if (typeof window === 'undefined') return { close: () => {}, send: () => {} };

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  const pendingQueue: unknown[] = [];

  function connect() {
    try {
      ws = new WebSocket(`${WS_BASE}${path}`);

      ws.onopen = () => {
        onOpen?.();
        while (pendingQueue.length > 0) {
          const msg = pendingQueue.shift();
          ws?.send(JSON.stringify(msg));
        }
      };

      ws.onmessage = (e) => {
        try { onMessage(JSON.parse(e.data as string)); } catch { /* ignore */ }
      };

      ws.onerror = () => { /* handled in onclose */ };

      ws.onclose = () => {
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      };
    } catch {
      if (!closed) reconnectTimer = setTimeout(connect, 3000);
    }
  }

  connect();

  return {
    close: () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    },
    send: (data: unknown) => {
      const msg = JSON.stringify(data);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(msg);
      } else {
        pendingQueue.push(data);
      }
    },
  };
}
