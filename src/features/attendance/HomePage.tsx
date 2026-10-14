import type { Attendance } from '../attendance/demoRecords';
import { StatCard } from '../../components/StatCard';
import { AttendanceTable } from '../history/AttendanceTable';

type HomePageProps = {
  name: string;
  clock: string;
  todayRow?: Attendance;
  rows: Attendance[];
  error: string;
  onStartCapture: (kind: 'entry' | 'exit') => void;
  onNavigateHistory: () => void;
};

export function HomePage({
  name,
  clock,
  todayRow,
  rows,
  error,
  onStartCapture,
  onNavigateHistory,
}: HomePageProps) {
  const todayLabel = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const isEntryDone = !!todayRow?.entry && todayRow.entry !== '—';
  const isExitDone = !!todayRow?.exit && todayRow.exit !== '—';

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{todayLabel.toUpperCase()}</p>
          <h1>Hola, {name.split(' ')[0]}</h1>
          <p className="muted">Aquí tienes el resumen de tu jornada.</p>
        </div>
        <div className="date-card">
          <span>HOY</span>
          <strong>
            {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
          </strong>
        </div>
      </div>

      <section className="hero-card">
        <div className="hero-message">
          <span className="pill-light">JORNADA DE HOY</span>
          <h2>
            {isExitDone
              ? 'Jornada completada'
              : isEntryDone
              ? 'Tu jornada está en curso'
              : '¿Listo para comenzar?'}
          </h2>
          <p>
            {isEntryDone
              ? `Entrada registrada a las ${todayRow?.entry}.`
              : 'Toma una foto con tu cámara web para confirmar cada movimiento.'}
          </p>
        </div>

        <div className="hero-live-clock">
          <span>HORA ACTUAL</span>
          <strong>{clock}</strong>
          <small>La hora se fija al confirmar la foto</small>
        </div>

        <div className="hero-actions">
          <button
            className="hero-button"
            onClick={() => onStartCapture('entry')}
            disabled={isEntryDone}
          >
            ↓ &nbsp;Registrar entrada
          </button>
          <button
            className="hero-button outline"
            onClick={() => onStartCapture('exit')}
            disabled={!isEntryDone || isExitDone}
          >
            ↑ &nbsp;Registrar salida
          </button>
        </div>

        <div className="hero-decoration">◷</div>
      </section>

      {error && <div className="alert inline-alert">{error}</div>}

      <div className="section-title">
        <div>
          <h2>Resumen de hoy</h2>
          <p className="muted">Actividad registrada</p>
        </div>
        <button className="text-button" onClick={onNavigateHistory}>
          Ver historial →
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Hora de entrada" value={todayRow?.entry ?? '—'} icon="↓" />
        <StatCard label="Hora de salida" value={todayRow?.exit ?? '—'} icon="↑" />
        <StatCard label="Estado" value={todayRow?.state ?? 'Pendiente'} icon="◷" />
      </div>

      <div className="section-title recent-heading">
        <div>
          <h2>Actividad reciente</h2>
          <p className="muted">Tus últimos registros</p>
        </div>
      </div>

      <AttendanceTable rows={rows.slice(0, 3)} />
    </>
  );
}
