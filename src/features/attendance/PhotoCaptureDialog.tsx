import { useEffect, useRef, useState } from 'react';

type Action = 'entrada' | 'salida';
type Props = { action: Action; onCancel: () => void; onCaptured: (photo: string) => void; busy?: boolean };

export function PhotoCaptureDialog({ action, onCancel, onCaptured, busy = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [starting, setStarting] = useState(true);
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    async function startCamera() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError('La cámara requiere abrir la app en localhost o mediante HTTPS.');
        setStarting(false);
        return;
      }
      try {
        const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
        if (disposed) { media.getTracks().forEach(track => track.stop()); return; }
        streamRef.current = media;
        const video = videoRef.current;
        if (!video) throw new Error('No se encontró la vista previa de la cámara.');
        video.srcObject = media;
        await video.play();
        setStarting(false);
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) setReady(true);
      } catch (cause) {
        if (disposed) return;
        const name = cause instanceof DOMException ? cause.name : '';
        setError(name === 'NotAllowedError' ? 'El permiso de cámara está bloqueado. Permítelo en la configuración del sitio e inténtalo de nuevo.' : name === 'NotFoundError' ? 'No se encontró una cámara disponible en este dispositivo.' : 'No se pudo iniciar la vista previa. Revisa el permiso de cámara e inténtalo de nuevo.');
        setStarting(false);
      }
    }
    void startCamera();
    return () => { disposed = true; streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) { setError('La vista previa todavía no está lista. Espera un momento e inténtalo de nuevo.'); return; }
    const scale = Math.min(1, 1280 / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) { setError('No se pudo preparar la foto. Inténtalo de nuevo.'); return; }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.82));
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setReady(false);
    setError('');
  }

  return <div className="camera-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section className="camera-dialog" role="dialog" aria-modal="true" aria-labelledby="camera-title">
      <header className="camera-header"><div><span className="eyebrow">EVIDENCIA FOTOGRÁFICA</span><h2 id="camera-title">Foto para registrar {action}</h2><p className="muted">Colócate frente a la cámara y revisa la foto antes de confirmar.</p></div><button className="camera-close" type="button" onClick={onCancel} aria-label="Cerrar cámara" disabled={busy}>×</button></header>
      <div className="camera-frame">
        {photo ? <img className="camera-preview" src={photo} alt="Vista previa de la foto tomada" /> : <><video ref={videoRef} autoPlay playsInline muted className="camera-video" onLoadedData={() => { setReady(true); setStarting(false); setError(''); }} onError={() => setError('El navegador no pudo mostrar la cámara. Cierra otras apps que la estén usando e inténtalo de nuevo.')} /><div className="camera-frame-hint">Centra tu rostro dentro del encuadre</div>{starting && <div className="camera-loading">Preparando la cámara…</div>}{!starting && !ready && !error && <div className="camera-loading">Esperando imagen de la cámara…</div>}</>}
      </div>
      {error && <div className="alert camera-error">{error}</div>}
      <p className="camera-privacy">Al confirmar, la foto se envía como evidencia del registro. En modo demo solo se guarda la marca de captura en este navegador.</p>
      <div className="camera-actions"><button className="secondary" type="button" onClick={onCancel} disabled={busy}>Cancelar</button>{photo ? <><button className="secondary" type="button" onClick={() => { setPhoto(''); setError(''); }}>Tomar otra</button><button className="primary" type="button" onClick={() => onCaptured(photo)} disabled={busy}>{busy ? 'Guardando…' : 'Confirmar foto y hora'}</button></> : <button className="primary" type="button" onClick={capture} disabled={!ready || !!error || busy}>{busy ? 'Guardando…' : 'Tomar foto'}</button>}</div>
    </section>
  </div>;
}
