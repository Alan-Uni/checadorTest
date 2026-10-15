import { dateKey, formatTime, trustedNow } from '../../lib/serverTime';

/** `date` es la fecha real del registro ('YYYY-MM-DD'); `day` es solo texto de respaldo para mostrar. */
export type Attendance = { id: string; date?: string; day: string; entry: string; exit: string; state: string; site: string; photoCaptured?: boolean };

// v3: los registros anteriores guardaban el día como el texto fijo "Hoy", lo que bloqueaba los días siguientes.
const KEY = 'checador.web.demo.attendance.v3';
const DEMO_SITE = 'Centro de trabajo de demostración';
const DAY_MS = 86_400_000;

function sample(): Attendance[] {
  const now = trustedNow();
  const day = (n: number) => dateKey(new Date(now.getTime() - n * DAY_MS));
  return [
    { id: 'd2', date: day(1), day: day(1), entry: '07:56', exit: '16:04', state: 'Completa', site: DEMO_SITE },
    { id: 'd3', date: day(2), day: day(2), entry: '08:10', exit: '16:12', state: 'Completa', site: DEMO_SITE },
  ];
}

export function loadDemoRecords(): Attendance[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : sample();
  } catch {
    return sample();
  }
}

export function resetDemoRecords() {
  try { localStorage.removeItem(KEY); } catch { /* storage may be unavailable */ }
  return sample();
}

export function saveDemoRecords(records: Attendance[]) {
  try { localStorage.setItem(KEY, JSON.stringify(records)); } catch { /* private browsing may block local storage */ }
}

export function makeDemoEntry(records: Attendance[], photoCaptured: boolean, now: Date) {
  const key = dateKey(now);
  if (records.some(r => r.date === key && r.entry !== '—')) return { records, error: 'Ya hay una entrada de prueba para hoy.' };
  const row: Attendance = { id: crypto.randomUUID(), date: key, day: key, entry: formatTime(now), exit: '—', state: 'En jornada', site: DEMO_SITE, photoCaptured };
  return { records: [row, ...records.filter(r => r.date !== key)], error: '' };
}

export function makeDemoExit(records: Attendance[], photoCaptured: boolean, now: Date) {
  const key = dateKey(now);
  const today = records.find(r => r.date === key);
  if (!today || today.entry === '—') return { records, error: 'Registra una entrada de prueba primero.' };
  if (today.exit !== '—') return { records, error: 'La salida de prueba ya está registrada.' };
  return { records: records.map(r => (r.id === today.id ? { ...r, exit: formatTime(now), state: 'Completa', photoCaptured } : r)), error: '' };
}
