import { useEffect, useRef, useState } from 'react';

export interface ServerTimeResponse {
  serverTime: string;
}

export const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const RETRY_SYNC_INTERVAL_MS = 5 * 1000;

function formatClock(baseTimeMs: number): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(baseTimeMs));
}

export function useServerTime(): { clock: string } {
  const [clock, setClock] = useState(() => formatClock(Date.now()));
  const baseTimeMsRef = useRef(Date.now());
  const baseTimeMonotonicMsRef = useRef(performance.now());
  const syncInFlightRef = useRef(false);

  const syncFromServer = async (): Promise<boolean> => {
    if (syncInFlightRef.current) return false;
    syncInFlightRef.current = true;
    try {
      const response = await fetch('/api/time');
      if (!response.ok) return false;
      const data = (await response.json()) as ServerTimeResponse;
      const serverMs = Date.parse(data.serverTime);
      if (!Number.isNaN(serverMs)) {
        baseTimeMsRef.current = serverMs;
        baseTimeMonotonicMsRef.current = performance.now();
        setClock(formatClock(serverMs));

        return true;
      }
      return false;
    } catch {
      // Mantiene el avance local hasta que el servidor vuelva a estar disponible.
      return false;
    } finally {
      syncInFlightRef.current = false;
    }
  };

  useEffect(() => {
    let periodicSyncTimer: number | null = null;
    let tickTimer: number | null = null;

    let disposed = false;
    const scheduleSync = (delayMs: number) => {
      periodicSyncTimer = window.setTimeout(async () => {
        const synced = await syncFromServer();
        if (!disposed) {
          scheduleSync(synced ? DEFAULT_SYNC_INTERVAL_MS : RETRY_SYNC_INTERVAL_MS);
        }
      }, delayMs);
    };
    void syncFromServer().then((synced) => {
      if (!disposed) {
        scheduleSync(synced ? DEFAULT_SYNC_INTERVAL_MS : RETRY_SYNC_INTERVAL_MS);
      }
    });

    tickTimer = window.setInterval(() => {
      const elapsedMs = performance.now() - baseTimeMonotonicMsRef.current;
      setClock(formatClock(baseTimeMsRef.current + elapsedMs));
    }, 1000);

    return () => {
      disposed = true;
      if (periodicSyncTimer !== null) {
        window.clearTimeout(periodicSyncTimer);
        periodicSyncTimer = null;
      }
      if (tickTimer !== null) {
        window.clearInterval(tickTimer);
        tickTimer = null;
      }
    };
  }, []);

  return { clock };
}
