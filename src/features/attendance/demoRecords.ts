export type Attendance = {
  id: string; day: string; entry: string; exit: string; state: string; site: string;
  photoEntry?: boolean; photoExit?: boolean; photosStored?: boolean;
};

const KEY = 'checador.web.demo.attendance.v2';
const sample: Attendance[] = [
  { id: 'd2', day: 'Ayer', entry: '07:56', exit: '16:04', state: 'Completa', site: 'Centro de trabajo de demostración' },
  { id: 'd3', day: 'Martes', entry: '08:10', exit: '16:12', state: 'Completa', site: 'Centro de trabajo de demostración' },
];

export function loadDemoRecords(): Attendance[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return sample;
    return (JSON.parse(raw) as Array<Attendance & { photoCaptured?: boolean }>).map(record => ({
      ...record,
      photoEntry: record.photoEntry ?? record.photoCaptured ?? false,
      photoExit: record.photoExit ?? (record.photoCaptured && record.exit !== '—') ?? false,
    }));
  }
  catch { return sample; }
}
export function resetDemoRecords(): Attendance[] {
  try { localStorage.removeItem(KEY); } catch { /* storage may be unavailable */ }
  return sample;
}
export function saveDemoRecords(records: Attendance[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(records)); } catch { /* private browsing may block local storage */ }
}
export function makeDemoEntry(records: Attendance[], photoCaptured = false) {
  if (records.some(record => record.day === 'Hoy' && record.entry !== '—')) return { records, error: 'Ya hay una entrada de prueba para hoy.' };
  const entry = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const next: Attendance = { id: crypto.randomUUID(), day: 'Hoy', entry, exit: '—', state: 'En jornada', site: 'Centro de trabajo de demostración', photoEntry: photoCaptured };
  return { records: [next, ...records.filter(record => record.day !== 'Hoy')], error: '' };
}
export function makeDemoExit(records: Attendance[], photoCaptured = false) {
  const today = records.find(record => record.day === 'Hoy');
  if (!today || today.entry === '—') return { records, error: 'Registra una entrada de prueba primero.' };
  if (today.exit !== '—') return { records, error: 'La salida de prueba ya está registrada.' };
  const exit = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  return { records: records.map(record => record.id === today.id ? { ...record, exit, state: 'Completa', photoExit: photoCaptured } : record), error: '' };
}
