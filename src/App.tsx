import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { LoginPage } from './features/auth/LoginPage';
import { PhotoCaptureDialog } from './features/attendance/PhotoCaptureDialog';
import { HomePage } from './features/attendance/HomePage';
import { HistoryPage } from './features/history/HistoryPage';
import { ProfilePage } from './features/profile/ProfilePage';
import {
  type Attendance,
  getLocalDateISO,
  loadDemoRecords,
  makeDemoEntry,
  makeDemoExit,
  resetDemoRecords,
  saveDemoRecords,
} from './features/attendance/demoRecords';
import './styles.css';

type View = 'home' | 'history' | 'profile';
type CaptureKind = 'entry' | 'exit';

const getLiveTimeString = () =>
  new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>('home');
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<Attendance[]>(loadDemoRecords);
  const [site, setSite] = useState('Centro de trabajo');
  const [cameraKind, setCameraKind] = useState<CaptureKind | null>(null);
  const [clock, setClock] = useState(getLiveTimeString);

  // Reloj en vivo
  useEffect(() => {
    const timer = window.setInterval(() => setClock(getLiveTimeString()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Escuchar estado de Supabase Auth
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  // Persistir registros en demo
  useEffect(() => {
    if (demo) saveDemoRecords(rows);
  }, [demo, rows]);

  // Carga de datos reales desde Supabase si hay sesión
  useEffect(() => {
    if (!supabase || !session) return;
    let isMounted = true;

    (async () => {
      try {
        const { data: activeSite } = await supabase.rpc('get_active_site');
        if (isMounted && activeSite) {
          setSite(activeSite.site_name ?? activeSite.nombre ?? activeSite.name ?? 'Centro de trabajo');
        }

        const { data: asistencias } = await supabase.rpc('get_visible_asistencias');
        if (isMounted && Array.isArray(asistencias)) {
          setRows(
            asistencias.map((r: any, idx: number) => ({
              id: String(r.id ?? idx),
              date: r.fecha ?? getLocalDateISO(),
              day: r.fecha ?? 'Registro',
              entry: r.hora_entrada ?? '—',
              exit: r.hora_salida ?? '—',
              state: r.hora_salida ? 'Completa' : 'En jornada',
              site: r.sitio_nombre ?? site,
            }))
          );
        }
      } catch (err) {
        console.error('Error al consultar datos de Supabase:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [session, site]);

  const userName = demo
    ? 'Usuario de prueba'
    : session?.user.user_metadata?.nombre ?? session?.user.email?.split('@')[0] ?? '';

  // Determinar la jornada del día actual usando la fecha ISO real
  const todayISO = getLocalDateISO();
  const todayRow = rows.find((r) => r.date === todayISO || r.day === 'Hoy');

  function enterDemo() {
    setRows(loadDemoRecords());
    setDemo(true);
    setView('home');
    setError('');
  }

  async function logout() {
    if (demo) {
      setDemo(false);
      setRows(loadDemoRecords());
      setView('home');
    } else {
      await supabase?.auth.signOut();
    }
  }

  function handleStartCapture(kind: CaptureKind) {
    setError('');
    setCameraKind(kind);
  }

  function handleCompleteCapture(photoBase64: string) {
    const kind = cameraKind;
    setCameraKind(null);
    if (!kind) return;

    if (!demo) {
      setError(
        'Foto capturada. La asistencia de una cuenta real aún requiere integrar el descriptor facial compatible con el backend; no se envió ningún registro.'
      );
      return;
    }

    const result =
      kind === 'entry'
        ? makeDemoEntry(rows, true)
        : makeDemoExit(rows, true);

    setRows(result.records);
    setError(result.error);
    void photoBase64; // La imagen en demo solo se usó para validar presencia
  }

  function handleResetDemo() {
    setRows(resetDemoRecords());
    setView('home');
    setError('');
  }

  // Si no hay sesión ni modo demo, renderizar Login
  if (!session && !demo) {
    return <LoginPage onEnterDemo={enterDemo} />;
  }

  return (
    <>
      <div className="app-shell">
        {/* Barra Lateral / Navegación */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark small">C</div>
            <div>
              <strong>Checador</strong>
              <small>CONTROL INSTITUCIONAL</small>
            </div>
          </div>

          <div className="site-switch">
            <span className="site-dot" />
            <div>
              <small>CENTRO ACTIVO</small>
              <strong>{demo ? 'Centro de demostración' : site}</strong>
            </div>
            <span className="chevron">⌄</span>
          </div>

          <nav className="nav">
            <span className="nav-label">MENÚ</span>
            <button
              className={`nav-item ${view === 'home' ? 'active' : ''}`}
              onClick={() => setView('home')}
            >
              <span>◫</span> Jornada
            </button>
            <button
              className={`nav-item ${view === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              <span>◷</span> Historial
            </button>
            <button
              className={`nav-item ${view === 'profile' ? 'active' : ''}`}
              onClick={() => setView('profile')}
            >
              <span>◎</span> Perfil
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="help-card">
              <strong>¿Necesitas ayuda?</strong>
              <p>Consulta con el administrador de tu centro.</p>
              <span>Soporte →</span>
            </div>
            <button className="logout" onClick={logout}>
              <span>↪</span> Salir
            </button>
          </div>
        </aside>

        {/* Panel Principal */}
        <main className="main">
          <header className="topbar">
            <div className="breadcrumb">
              Panel <span>/</span>{' '}
              {view === 'home' ? 'Jornada' : view === 'history' ? 'Historial' : 'Perfil'}
            </div>

            <div className="top-actions">
              {demo && (
                <span className="demo-chip">
                  <i /> Modo de prueba
                </span>
              )}
              <div className="avatar">{userName.slice(0, 1).toUpperCase()}</div>
              <div className="user-short">
                <strong>{userName}</strong>
                <small>{demo ? 'Sesión local' : 'Cuenta activa'}</small>
              </div>
            </div>
          </header>

          <div className="content">
            {view === 'home' && (
              <HomePage
                name={userName}
                clock={clock}
                todayRow={todayRow}
                rows={rows}
                error={error}
                onStartCapture={handleStartCapture}
                onNavigateHistory={() => setView('history')}
              />
            )}

            {view === 'history' && <HistoryPage rows={rows} />}

            {view === 'profile' && (
              <ProfilePage
                name={userName}
                email={session?.user.email}
                isDemo={demo}
                site={site}
                onResetDemo={handleResetDemo}
              />
            )}
          </div>

          <footer className="footer">
            Checador <span>·</span>{' '}
            {demo
              ? 'Los datos de prueba se guardan localmente en tu navegador.'
              : 'Sistema de control de asistencia'}
          </footer>
        </main>
      </div>

      {/* Modal flotante de la cámara web (se activa al pulsar 'Registrar entrada' o 'Registrar salida') */}
      {cameraKind && (
        <PhotoCaptureDialog
          kind={cameraKind}
          onCancel={() => setCameraKind(null)}
          onCaptured={handleCompleteCapture}
        />
      )}
    </>
  );
}

export default App;
