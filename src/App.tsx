import { useEffect, useState } from 'react';
import { api, type AppUser, type ApiAttendance } from './lib/api';
import { LoginPage } from './features/auth/LoginPage';
import { AttendanceTable } from './features/history/AttendanceTable';
import { StatCard } from './components/StatCard';
import { PhotoCaptureDialog } from './features/attendance/PhotoCaptureDialog';
import { type Attendance, loadDemoRecords, makeDemoEntry, makeDemoExit, resetDemoRecords, saveDemoRecords } from './features/attendance/demoRecords';
import './styles.css';

type View = 'home' | 'history' | 'profile';
type CaptureKind = 'entry' | 'exit';

const today = () => new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const liveTime = () => new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
const todayISO = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatRows = (records: ApiAttendance[]): Attendance[] => records.map(record => ({
  id: String(record.id),
  day: record.fecha === todayISO()
    ? 'Hoy'
    : new Date(`${record.fecha}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
  entry: record.hora_entrada?.slice(0, 5) || '—',
  exit: record.hora_salida?.slice(0, 5) || '—',
  state: record.hora_salida ? 'Completa' : 'En jornada',
  site: record.sitio_nombre || 'Centro sin nombre',
  photoCaptured: Boolean(record.foto_entrada || record.foto_salida),
}));

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [view, setView] = useState<View>('home');
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<Attendance[]>(loadDemoRecords);
  const [site, setSite] = useState('Centro de trabajo');
  const [captureKind, setCaptureKind] = useState<CaptureKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(liveTime);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(liveTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    api.me()
      .then(({ user: currentUser }) => { if (alive) setUser(currentUser); })
      .catch(() => { if (alive) setUser(null); });
    return () => { alive = false; };
  }, []);

  useEffect(() => { if (demo) saveDemoRecords(rows); }, [demo, rows]);

  useEffect(() => {
    if (!user || demo) return;
    let alive = true;
    (async () => {
      try {
        const [activeSite, attendance] = await Promise.all([api.site(), api.attendance()]);
        if (alive) {
          setSite(activeSite.site_name || 'Sin centro asignado');
          setRows(formatRows(attendance.records));
        }
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los registros.');
      }
    })();
    return () => { alive = false; };
  }, [user, demo]);

  const name = demo ? 'Usuario de prueba' : user?.nombre ?? '';
  const todayRow = rows.find(row => row.day === 'Hoy');

  function enterDemo() {
    setRows(loadDemoRecords());
    setDemo(true);
    setUser(null);
    setView('home');
    setError('');
  }

  async function logout() {
    if (demo) {
      setDemo(false);
      setRows(loadDemoRecords());
      setView('home');
      return;
    }
    try {
      await api.logout();
    } finally {
      setUser(null);
      setRows(loadDemoRecords());
      setView('home');
    }
  }

  async function completeCapture(photo: string) {
    const kind = captureKind;
    if (!kind) return;
    setBusy(true);
    setError('');
    try {
      if (demo) {
        const result = kind === 'entry' ? makeDemoEntry(rows, true) : makeDemoExit(rows, true);
        setRows(result.records);
        if (result.error) setError(result.error);
      } else if (kind === 'entry') {
        await api.entry(photo);
        setRows(formatRows((await api.attendance()).records));
      } else {
        await api.exit(photo);
        setRows(formatRows((await api.attendance()).records));
      }
      setCaptureKind(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el registro.');
    } finally {
      setBusy(false);
    }
  }

  if (!user && !demo) return <LoginPage onEnterDemo={enterDemo} onLogin={setUser} />;

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand"><div className="brand-mark small">C</div><div><strong>Checador</strong><small>CONTROL INSTITUCIONAL</small></div></div>
          <div className="site-switch"><span className="site-dot" /><div><small>CENTRO ACTIVO</small><strong>{demo ? 'Centro de demostración' : site}</strong></div><span className="chevron">⌄</span></div>
          <nav className="nav">
            <span className="nav-label">MENÚ</span>
            <button className={view === 'home' ? 'nav-item active' : 'nav-item'} onClick={() => setView('home')}><span>◫</span> Jornada</button>
            <button className={view === 'history' ? 'nav-item active' : 'nav-item'} onClick={() => setView('history')}><span>◷</span> Historial</button>
            <button className={view === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => setView('profile')}><span>◎</span> Perfil</button>
          </nav>
          <div className="sidebar-bottom"><div className="help-card"><strong>¿Necesitas ayuda?</strong><p>Consulta con el administrador de tu centro.</p><span>Soporte →</span></div><button className="logout" onClick={logout}><span>↪</span> Salir</button></div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="breadcrumb">Panel <span>/</span> {view === 'home' ? 'Jornada' : view === 'history' ? 'Historial' : 'Perfil'}</div>
            <div className="top-actions">{demo && <span className="demo-chip"><i /> Modo de prueba</span>}<div className="avatar">{name.slice(0, 1).toUpperCase()}</div><div className="user-short"><strong>{name}</strong><small>{demo ? 'Sesión local' : 'Cuenta activa'}</small></div></div>
          </header>

          <div className="content">
            {view === 'home' && <>
              <div className="page-heading"><div><p className="eyebrow">{today().toUpperCase()}</p><h1>Hola, {name.split(' ')[0]}</h1><p className="muted">Aquí tienes el resumen de tu jornada.</p></div><div className="date-card"><span>HOY</span><strong>{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</strong></div></div>
              <section className="hero-card">
                <div className="hero-message"><span className="pill-light">JORNADA DE HOY</span><h2>{todayRow?.exit && todayRow.exit !== '—' ? 'Jornada completada' : todayRow?.entry && todayRow.entry !== '—' ? 'Tu jornada está en curso' : '¿Listo para comenzar?'}</h2><p>{todayRow?.entry && todayRow.entry !== '—' ? `Entrada registrada a las ${todayRow.entry}.` : 'Toma una foto para confirmar cada movimiento.'}</p></div>
                <div className="hero-live-clock"><span>HORA ACTUAL</span><strong>{clock}</strong><small>La hora se fija al confirmar la foto</small></div>
                <div className="hero-actions"><button className="hero-button" onClick={() => setCaptureKind('entry')} disabled={busy || (!!todayRow?.entry && todayRow.entry !== '—')}>↓ &nbsp;Registrar entrada</button><button className="hero-button outline" onClick={() => setCaptureKind('exit')} disabled={busy || !todayRow?.entry || todayRow.exit !== '—'}>↑ &nbsp;Registrar salida</button></div>
                <div className="hero-decoration">◷</div>
              </section>
              {error && <div className="alert inline-alert">{error}</div>}
              <div className="section-title"><div><h2>Resumen de hoy</h2><p className="muted">Actividad registrada</p></div><button className="text-button" onClick={() => setView('history')}>Ver historial →</button></div>
              <div className="stats-grid"><StatCard label="Hora de entrada" value={todayRow?.entry ?? '—'} icon="↓" /><StatCard label="Hora de salida" value={todayRow?.exit ?? '—'} icon="↑" /><StatCard label="Estado" value={todayRow?.state ?? 'Pendiente'} icon="◷" /></div>
              <div className="section-title recent-heading"><div><h2>Actividad reciente</h2><p className="muted">Tus últimos registros</p></div></div><AttendanceTable rows={rows.slice(0, 3)} />
            </>}
            {view === 'history' && <><div className="page-heading"><div><p className="eyebrow">TUS REGISTROS</p><h1>Historial</h1><p className="muted">Consulta la actividad de tus jornadas.</p></div></div><AttendanceTable rows={rows} /></>}
            {view === 'profile' && <>
              <div className="page-heading"><div><p className="eyebrow">TU CUENTA</p><h1>Perfil</h1><p className="muted">Información de la sesión actual.</p></div></div>
              <section className="profile-card"><div className="profile-avatar">{name.slice(0, 1).toUpperCase()}</div><div><h2>{name}</h2><p>{demo ? 'Acceso de demostración' : user?.email}</p><span className="status-tag">{demo ? 'Prueba local' : 'Cuenta activa'}</span></div></section>
              <section className="info-card"><h3>Centro de trabajo</h3><p>{demo ? 'Centro de demostración' : site}</p><p className="muted">Los cambios de perfil se administran desde tu organización.</p>{demo && <button className="secondary reset-demo" onClick={() => { setRows(resetDemoRecords()); setView('home'); setError(''); }}>Restablecer datos de prueba</button>}</section>
            </>}
          </div>
          <footer className="footer">Checador <span>·</span> {demo ? 'Los datos de prueba solo se guardan en este navegador.' : 'Sistema de asistencia'}</footer>
        </main>
      </div>
      {captureKind && <PhotoCaptureDialog kind={captureKind} onCancel={() => setCaptureKind(null)} onCaptured={completeCapture} busy={busy} />}
    </>
  );
}

export default App;
