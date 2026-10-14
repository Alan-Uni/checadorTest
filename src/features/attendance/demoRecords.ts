export type Attendance = {
  id: string;
  date: string;          // Formato ISO: YYYY-MM-DD (Permite saber qué día real se registró)
  day: string;           // Etiqueta legible para la UI: 'Hoy', 'Ayer', '14 de oct', etc.
  entry: string;
  exit: string;
  state: 'En jornada' | 'Completa' | 'Incompleta' | 'Pendiente';
  site: string;
  photoCaptured?: boolean;
};

const KEY = 'checador.web.demo.attendance.v3';

// Obtiene la fecha local en formato 'YYYY-MM-DD'
export function getLocalDateISO(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Devuelve el texto legible relativo o fecha formateada
export function formatDayLabel(dateStr: string): string {
  const todayStr = getLocalDateISO(new Date());
  if (dateStr === todayStr) return 'Hoy';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === getLocalDateISO(yesterday)) return 'Ayer';

  // Si tiene formato YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  return dateStr;
}

// Muestra inicial de datos de prueba
function getDefaultSample(): Attendance[] {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = getLocalDateISO(yesterday);

  const prev = new Date();
  prev.setDate(prev.getDate() - 2);
  const prevISO = getLocalDateISO(prev);

  return [
    {
      id: 'd1',
      date: yesterdayISO,
      day: 'Ayer',
      entry: '08:02',
      exit: '16:15',
      state: 'Completa',
      site: 'Centro de trabajo de demostración',
      photoCaptured: true,
    },
    {
      id: 'd2',
      date: prevISO,
      day: formatDayLabel(prevISO),
      entry: '07:55',
      exit: '16:04',
      state: 'Completa',
      site: 'Centro de trabajo de demostración',
      photoCaptured: true,
    },
  ];
}

// Carga registros y actualiza dinámicamente las etiquetas y jornadas huérfanas
export function loadDemoRecords(): Attendance[] {
  try {
    const raw = localStorage.getItem(KEY);
    const records: Attendance[] = raw ? JSON.parse(raw) : getDefaultSample();
    const todayISO = getLocalDateISO(new Date());

    // Normalizar registros: si tienen fecha vieja pero decían 'Hoy', se actualizan y se cierran si quedaron colgados
    return records.map(r => {
      const recordDate = r.date || (r.day === 'Hoy' ? todayISO : '2026-01-01');
      const dynamicLabel = formatDayLabel(recordDate);
      
      // Si el registro es de un día anterior pero se quedó "En jornada" (nunca marcó salida), cerrarlo como Incompleta
      let state = r.state;
      if (recordDate !== todayISO && state === 'En jornada') {
        state = 'Incompleta';
      }

      return {
        ...r,
        date: recordDate,
        day: dynamicLabel,
        state,
      };
    });
  } catch {
    return getDefaultSample();
  }
}

export function resetDemoRecords(): Attendance[] {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* localStorage no disponible */
  }
  return getDefaultSample();
}

export function saveDemoRecords(records: Attendance[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    /* almacenamiento privado */
  }
}

export function makeDemoEntry(records: Attendance[], photoCaptured: boolean) {
  const todayISO = getLocalDateISO(new Date());
  
  // Buscar si ya existe una entrada para HOY (por fecha real ISO)
  const existingToday = records.find(r => r.date === todayISO);
  if (existingToday && existingToday.entry !== '—') {
    return { records, error: 'Ya hay una entrada de prueba registrada para hoy.' };
  }

  const entryTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const newRecord: Attendance = {
    id: crypto.randomUUID(),
    date: todayISO,
    day: 'Hoy',
    entry: entryTime,
    exit: '—',
    state: 'En jornada',
    site: 'Centro de trabajo de demostración',
    photoCaptured,
  };

  const next = [newRecord, ...records.filter(r => r.date !== todayISO)];
  return { records: next, error: '' };
}

export function makeDemoExit(records: Attendance[], photoCaptured: boolean) {
  const todayISO = getLocalDateISO(new Date());
  const today = records.find(r => r.date === todayISO);

  if (!today || today.entry === '—') {
    return { records, error: 'Registra una entrada de prueba primero.' };
  }
  if (today.exit !== '—') {
    return { records, error: 'La salida de prueba ya está registrada.' };
  }

  const exitTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const next = records.map(r =>
    r.id === today.id
      ? { ...r, exit: exitTime, state: 'Completa' as const, photoCaptured }
      : r
  );

  return { records: next, error: '' };
}
