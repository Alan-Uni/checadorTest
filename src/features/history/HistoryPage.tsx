import type { Attendance } from '../attendance/demoRecords';
import { AttendanceTable } from './AttendanceTable';

type HistoryPageProps = {
  rows: Attendance[];
};

export function HistoryPage({ rows }: HistoryPageProps) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TUS REGISTROS</p>
          <h1>Historial</h1>
          <p className="muted">Consulta la actividad detallada de tus jornadas anteriores.</p>
        </div>
      </div>
      <AttendanceTable rows={rows} />
    </>
  );
}
