import { useEffect, useRef, useState } from 'react';

export interface ServerTimeResponse {
  serverTime: string;
}

export const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000;
export const DEFAULT_DRIFT_THRESHOLD_MS = 30 * 1000;

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
  const baseTimeMsRef = useRef<number | null>(null);
  const lastSyncDeviceMsRef = useRef<number | null>(null);
  const lastServerMsRef = useRef<number | null>(null);
  const syncInFlightRef = useRef(false);

  const syncFromServer = async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      const response = await fetch('/api/time');
      if (!response.ok) return;
      const data = (await response.json()) as ServerTimeResponse;
      const serverMs = Date.parse(data.serverTime);
      if (!Number.isNaN(serverMs)) {
        const now = Date.now();
        const prevServerMs = lastServerMsRef.current;
        const prevDeviceMs = lastSyncDeviceMsRef.current;
        lastServerMsRef.current = serverMs;
        lastSyncDeviceMsRef.current = now;
        baseTimeMsRef.current = serverMs;
        setClock(formatClock(serverMs));

        // Re-sincronización extra solo si el reloj del cliente se desfató
        // más de 30 s con respecto al servidor durante el intervalo anterior.
        if (
          prevServerMs !== null &&
          prevDeviceMs !== null &&
          Math.abs((now - prevDeviceMs) - (serverMs - prevServerMs)) >= DEFAULT_DRIFT_THRESHOLD_MS
        ) {
          try {
            const extra = await fetch('/api/time');
            if (extra.ok) {
              const extraData = (await extra.json()) as ServerTimeResponse;
              const extraMs = Date.parse(extraData.serverTime);
              if (!Number.isNaN(extraMs)) {
                lastServerMsRef.current = extraMs;
                lastSyncDeviceMsRef.current = Date.now();
                baseTimeMsRef.current = extraMs;
                setClock(formatClock(extraMs));
              }
            }
          } catch {
            // Falla silenciosamente; el reloj conserva el último valor.
          }
        }
      }
    } catch {
      // El reloj continúa con el último valor; se re-sincroniza periódicamente.
    } finally {
      syncInFlightRef.current = false;
    }
  };

  useEffect(() => {
    let periodicSyncTimer: number | null = null;
    let tickTimer: number | null = null;

    const schedulePeriodicSync = () => {
      periodicSyncTimer = window.setTimeout(() => {
        syncFromServer();
        schedulePeriodicSync();
      }, DEFAULT_SYNC_INTERVAL_MS);
    };
    schedulePeriodicSync();

    tickTimer = window.setInterval(() => {
      const currentBase = baseTimeMsRef.current;
      if (currentBase === null) return;
      setClock(formatClock(currentBase));
    }, 1000);

    return () => {
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
