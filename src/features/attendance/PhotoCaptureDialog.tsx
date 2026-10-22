import { useEffect, useRef, useState } from 'react';

type Props = {
  kind: 'entry' | 'exit';
  onCancel: () => void;
  onCaptured: (photo: string) => void;
  busy?: boolean;
};

export function PhotoCaptureDialog({ kind, onCancel, onCaptured, busy = false }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('La cámara requiere un navegador compatible y una conexión segura (HTTPS o localhost).');
        const current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (!active) { current.getTracks().forEach(track => track.stop()); return; }
        stream.current = current;
        if (video.current) video.current.srcObject = current;
        setReady(true);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo acceder a la cámara. Revisa el permiso del navegador.');
      }
    }
    void start();
    return () => { active = false; stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; };
  }, []);

  function takePhoto() {
    const element = video.current;
    if (!element || !element.videoWidth) { setError('La cámara todavía se está iniciando. Inténtalo de nuevo.'); return; }
    const scale = Math.min(1, 1280 / element.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(element.videoWidth * scale);
    canvas.height = Math.round(element.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(element, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.88));
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    setReady(false);
    setError('');
  }

  return <div className="camera-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section className="camera-dialog" role="dialog" aria-modal="true" aria-labelledby="camera-title">
      <header className="camera-header"><div><span className="eyebrow">EVIDENCIA FOTOGRÁFICA</span><h2 id="camera-title">Foto para {kind === 'entry' ? 'registrar entrada' : 'registrar salida'}</h2></div><button className="camera-close" onClick={onCancel} aria-label="Cerrar" disabled={busy}>×</button></header>
      <div className="camera-frame">{photo ? <img className="camera-preview" src={photo} alt="Vista previa de la foto tomada" /> : <><video ref={video} autoPlay muted playsInline className="camera-video" /><div className="camera-frame-hint">Centra tu rostro dentro del encuadre</div>{!ready && !error && <div className="camera-loading">Iniciando cámara…</div>}</>}</div>
      {error && <div className="alert camera-error">{error}</div>}
      <p className="camera-privacy">Al confirmar, la foto se envía como evidencia del registro. En modo demo solo se conserva la marca de captura en este navegador.</p>
      <div className="camera-actions"><button className="secondary" onClick={onCancel} disabled={busy}>Cancelar</button>{photo ? <button className="primary" onClick={() => onCaptured(photo)} disabled={busy}>{busy ? 'Guardando…' : 'Confirmar foto y hora'}</button> : <button className="primary" onClick={takePhoto} disabled={!ready || busy}>Tomar foto</button>}</div>
    </section>
  </div>;
}
