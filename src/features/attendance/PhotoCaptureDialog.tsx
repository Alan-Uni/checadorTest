import { useEffect, useRef, useState } from 'react';

type Action = 'entrada' | 'salida';

export function PhotoCaptureDialog({
  action,
  onCancel,
  onCaptured,
  busy = false,
}: {
  action: Action;
  onCancel: () => void;
  onCaptured: (photo: string) => void;
  busy?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [starting, setStarting] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let readyTimer = 0;

    async function startCamera() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError('La cámara requiere abrir la app en localhost o mediante HTTPS.');
        setStarting(false);
        return;
      }

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (disposed) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = media;
        const video = videoRef.current;
        if (!video) throw new Error('No se encontró la vista previa de la cámara.');
        video.srcObject = media;
        await video.play();
        setStarting(false);

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
          setReady(true);
        } else {
          readyTimer = window.setTimeout(() => {
            if (!disposed && !video.videoWidth) {
              setError('La cámara se activó, pero no entrega imagen. Cierra otras apps que la estén usando e inténtalo de nuevo.');
            }
          }, 10000);
        }
      } catch (cause) {
        if (!disposed) {
          const name = cause instanceof DOMException ? cause.name : '';
          setError(name === 'NotAllowedError'
            ? 'El permiso de cámara está bloqueado. Permítelo en la configuración del sitio y vuelve a intentarlo.'
            : name === 'NotFoundError'
              ? 'No se encontró una cámara disponible en este dispositivo.'
              : 'No se pudo iniciar la vista previa. Revisa el permiso de cámara y vuelve a intentarlo.');
          setStarting(false);
        }
      }
    }

    void startCamera();
    return () => {
      disposed = true;
      window.clearTimeout(readyTimer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
      setError('La vista previa todavía no está lista. Espera un momento e inténtalo de nuevo.');
      return;
    }

    const scale = Math.min(1, 1280 / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      setError('No se pudo preparar la foto. Inténtalo de nuevo.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCaptured(canvas.toDataURL('image/jpeg', 0.72));
  }

  return (
    <div className="camera-overlay">
      <section className="camera-dialog" role="dialog" aria-modal="true" aria-labelledby="camera-title">
        <div className="camera-dialog-heading">
          <div>
            <p className="eyebrow">EVIDENCIA DE ASISTENCIA</p>
            <h2 id="camera-title">Foto para registrar {action}</h2>
            <p className="muted">Colócate frente a la cámara y toma la foto para continuar.</p>
          </div>
          <button className="camera-close" type="button" onClick={onCancel} disabled={busy} aria-label="Cerrar cámara">×</button>
        </div>

        <div className="camera-frame">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-preview"
            onLoadedData={() => { setReady(true); setStarting(false); setError(''); }}
            onError={() => setError('El navegador no pudo mostrar la cámara. Cierra otras apps que la estén usando e inténtalo de nuevo.')}
          />
          {starting && <div className="camera-status">Preparando la cámara…</div>}
          {!starting && !ready && !error && <div className="camera-status">Esperando imagen de la cámara…</div>}
          {error && <div className="camera-status camera-status-error">{error}</div>}
        </div>

        <div className="camera-dialog-footer">
          <span className="camera-hint">La foto se adjuntará a este registro.</span>
          <div className="camera-actions">
            <button className="secondary" type="button" onClick={onCancel} disabled={busy}>Cancelar</button>
            <button className="primary" type="button" onClick={capture} disabled={!ready || !!error || busy}>
              {busy ? 'Guardando…' : 'Tomar foto y registrar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
