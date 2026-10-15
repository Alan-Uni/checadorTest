import { supabase } from './supabase';

/** Zona horaria del centro de trabajo. Todas las fechas/horas se muestran y se agrupan con ella. */
export const APP_TIMEZONE = 'America/Mexico_City';

/*
 * Reloj de confianza.
 * - Se sincroniza con el servidor (RPC `get_server_time`) y guarda la diferencia usando
 *   performance.now(), que es un reloj monotónico: NO cambia si el usuario modifica la hora del dispositivo.
 * - Mientras no haya sincronización (por ejemplo, en el modo de demostración) se usa la hora del dispositivo.
 */
let baseServerMs = 0; // hora del servidor (ms epoch) en el instante basePerf
let basePerf = 0; // performance.now() en el instante de la sincronización
let synced = false;

export function hasServerClock() {
  return synced;
}

export async function syncServerTime(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const t0 = performance.now();
    const { data, error } = await supabase.rpc('get_server_time');
    const t1 = performance.now();
    if (error || !data) return false;
    const serverMs = Date.parse(String(data));
    if (Number.isNaN(serverMs)) return false;
    baseServerMs = serverMs + (t1 - t0) / 2; // compensa la mitad de la latencia de ida y vuelta
    basePerf = t1;
    synced = true;
    return true;
  } catch {
    return false;
  }
}

export function resetServerClock() {
  synced = false;
}

export function trustedNow(): Date {
  return synced ? new Date(baseServerMs + (performance.now() - basePerf)) : new Date();
}

/* ---------- Formato (siempre en la zona horaria del centro) ---------- */

/** Fecha 'YYYY-MM-DD' en la zona del centro. */
export function dateKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Convierte 'YYYY-MM-DD' o un timestamp ISO del backend a 'YYYY-MM-DD' (o undefined si no es válido). */
export function toDateKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : dateKey(new Date(ms));
}

export const formatClock = (d: Date) =>
  new Intl.DateTimeFormat('es-MX', { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(d);

export const formatTime = (d: Date) =>
  new Intl.DateTimeFormat('es-MX', { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

export const formatLongDate = (d: Date) =>
  d.toLocaleDateString('es-MX', { timeZone: APP_TIMEZONE, weekday: 'long', day: 'numeric', month: 'long' });

export const formatShortDate = (d: Date) =>
  d.toLocaleDateString('es-MX', { timeZone: APP_TIMEZONE, day: '2-digit', month: 'short' });

/** Etiqueta amigable ("Hoy", "Ayer" o fecha) para una 'YYYY-MM-DD'. */
export function labelForDateKey(key: string, now: Date): string {
  if (key === dateKey(now)) return 'Hoy';
  if (key === dateKey(new Date(now.getTime() - 86_400_000))) return 'Ayer';
  return new Date(`${key}T12:00:00Z`).toLocaleDateString('es-MX', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
}
