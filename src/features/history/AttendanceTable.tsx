import { useState } from 'react';
import type { Attendance } from '../attendance/demoRecords';

type PhotoView = { src: string; title: string };

export function AttendanceTable({ rows }: { rows: Attendance[] }) {
  const [photo, setPhoto] = useState<PhotoView | null>(null);
  const [photoError, setPhotoError] = useState(false);

  function openPhoto(id: string, kind: 'entry' | 'exit', title: string) {
    setPhotoError(false);
    setPhoto({ src: `/api/attendance/${encodeURIComponent(id)}/photo/${kind}`, title });
  }

  return <>
    <div className="table-card">
      <div className="table-head"><span>FECHA</span><span>CENTRO DE TRABAJO</span><span>ENTRADA</span><span>SALIDA</span><span>ESTADO</span><span>FOTOS</span></div>
      {rows.map((row) => <div className="table-row" key={row.id}>
        <strong>{row.day}</strong><span>{row.site}</span><span>{row.entry}</span><span>{row.exit}</span>
        <span><i className={'state-dot '+(row.state==='Completa'?'done':'pending')}/>{row.state}</span>
        <span className="photo-links">
          {row.photoEntry && <button type="button" className="photo-link" onClick={()=>openPhoto(row.id,'entry',`Foto de entrada · ${row.day}`)}>Entrada</button>}
          {row.photoExit && <button type="button" className="photo-link" onClick={()=>openPhoto(row.id,'exit',`Foto de salida · ${row.day}`)}>Salida</button>}
          {!row.photoEntry && !row.photoExit && <span className="no-photo">Sin foto</span>}
        </span>
      </div>)}
      {!rows.length&&<div className="empty">Aún no hay registros.</div>}
    </div>
    {photo&&<div className="photo-viewer-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setPhoto(null)}}>
      <section className="photo-viewer" role="dialog" aria-modal="true" aria-label={photo.title}>
        <header className="photo-viewer-header"><div><p className="eyebrow">EVIDENCIA DE ASISTENCIA</p><h2>{photo.title}</h2></div><button type="button" className="camera-close" onClick={()=>setPhoto(null)} aria-label="Cerrar foto">×</button></header>
        {photoError?<div className="photo-load-error">No se pudo cargar esta foto. Inicia sesión de nuevo o comprueba la conexión.</div>:<img className="photo-viewer-image" src={photo.src} alt={photo.title} onError={()=>setPhotoError(true)}/>}
        <footer className="photo-viewer-footer"><span>Imagen guardada en Azure SQL</span><button type="button" className="secondary photo-close-button" onClick={()=>setPhoto(null)}>Cerrar</button></footer>
      </section>
    </div>}
  </>;
}
