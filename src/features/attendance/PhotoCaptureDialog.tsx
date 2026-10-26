import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

type Action = 'entrada' | 'salida';
type Props = { action: Action; onCancel: () => void; onCaptured: (photo: string) => void; busy?: boolean };
type LivenessStatus = 'loading' | 'waiting-face' | 'eyes-open' | 'blink' | 'reopen' | 'verified' | 'error';

const MEDIAPIPE_VERSION = '1.1.1';
const VISION_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const FACE_LANDMARKER_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export function PhotoCaptureDialog({ action, onCancel, onCaptured, busy = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<FaceLandmarker | null>(null);
  const detectionTimerRef = useRef<number | null>(null);
  const retakeRequestedRef = useRef(false);
  const [starting, setStarting] = useState(true);
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>('loading');
  const [livenessError, setLivenessError] = useState('');

  useEffect(() => {
    let disposed = false;
    let eyesOpened = false;
    let eyesClosedAfterOpening = false;
    let verified = false;
    let lastVideoTime = -1;
    let lastTimestamp = 0;

    function stopDetection() {
      if (detectionTimerRef.current !== null) {
        window.clearTimeout(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
      const detector = detectorRef.current;
      detectorRef.current = null;
      detector?.close();
    }

    async function startCameraAndLiveness() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError('La cámara requiere abrir la app en localhost o mediante HTTPS.');
        setStarting(false);
        return;
      }

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (disposed) {
          media.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = media;
        const video = videoRef.current;
        if (!video) throw new Error('No se encontró la vista previa de la cámara.');
        video.srcObject = media;
        await video.play();
        if (disposed) return;
        setStarting(false);
        setLivenessStatus('loading');

        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
        const detector = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
        });
        if (disposed) {
          detector.close();
          return;
        }
        detectorRef.current = detector;

        function detectFrame() {
          if (disposed || verified || !detectorRef.current) return;
          const currentVideo = videoRef.current;
          try {
            if (currentVideo && currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && currentVideo.currentTime !== lastVideoTime) {
              lastVideoTime = currentVideo.currentTime;
              const timestamp = Math.max(performance.now(), lastTimestamp + 1);
              lastTimestamp = timestamp;
              const result = detectorRef.current.detectForVideo(currentVideo, timestamp);

              if (!result.faceLandmarks.length) {
                eyesOpened = false;
                eyesClosedAfterOpening = false;
                setLivenessStatus('waiting-face');
              } else {
                const blendshapes = result.faceBlendshapes[0]?.categories ?? [];
                const blinkLeft = blendshapes.find(category => category.categoryName === 'eyeBlinkLeft')?.score ?? 0;
                const blinkRight = blendshapes.find(category => category.categoryName === 'eyeBlinkRight')?.score ?? 0;
                const bothEyesOpen = blinkLeft < 0.25 && blinkRight < 0.25;
                const bothEyesClosed = blinkLeft > 0.55 && blinkRight > 0.55;

                if (!eyesOpened) {
                  if (bothEyesOpen) {
                    eyesOpened = true;
                    setLivenessStatus('blink');
                  } else {
                    setLivenessStatus('eyes-open');
                  }
                } else if (bothEyesClosed) {
                  eyesClosedAfterOpening = true;
                  setLivenessStatus('reopen');
                } else if (eyesClosedAfterOpening && bothEyesOpen) {
                  verified = true;
                  setLivenessStatus('verified');
                  stopDetection();
                  return;
                }
              }
            }
            detectionTimerRef.current = window.setTimeout(detectFrame, 120);
          } catch {
            stopDetection();
            setLivenessStatus('error');
            setLivenessError('No se pudo analizar el rostro. Cierra y vuelve a abrir la cámara para intentarlo de nuevo.');
          }
        }

        detectFrame();
      } catch (cause) {
        if (disposed) return;
        const name = cause instanceof DOMException ? cause.name : '';
        if (name === 'NotAllowedError' || name === 'NotFoundError') {
          setError(name === 'NotAllowedError'
            ? 'El permiso de cámara está bloqueado. Permítelo en la configuración del sitio e inténtalo de nuevo.'
            : 'No se encontró una cámara disponible en este dispositivo.');
        } else {
          setLivenessStatus('error');
          setLivenessError('No se pudo cargar la detección de vida. Comprueba tu conexión e inténtalo de nuevo.');
        }
        setStarting(false);
      }
    }

    void startCameraAndLiveness();
    return () => {
      disposed = true;
      stopDetection();
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  useEffect(() => {
    if (photo || !retakeRequestedRef.current) return;
    retakeRequestedRef.current = false;
    let cancelled = false;

    async function reopenCamera() {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          media.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = media;
        const video = videoRef.current;
        if (!video) throw new Error('No se encontró la vista previa de la cámara.');
        video.srcObject = media;
        await video.play();
        if (!cancelled) {
          setReady(true);
          setStarting(false);
        }
      } catch {
        if (!cancelled) {
          setStarting(false);
          setError('No se pudo volver a abrir la cámara. Revisa el permiso del navegador e inténtalo de nuevo.');
        }
      }
    }

    void reopenCamera();
    return () => { cancelled = true; };
  }, [photo]);

  function capture() {
    const video = videoRef.current;
    if (livenessStatus !== 'verified') return;
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
    setPhoto(canvas.toDataURL('image/jpeg', 0.82));
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setReady(false);
    setError('');
  }

  const livenessMessage: Record<LivenessStatus, string> = {
    loading: 'Preparando la comprobación de vida…',
    'waiting-face': 'Centra tu rostro dentro del encuadre.',
    'eyes-open': 'Mira al frente y mantén los ojos abiertos.',
    blink: 'Ahora parpadea para confirmar que eres una persona real.',
    reopen: 'Bien. Abre los ojos para completar la verificación.',
    verified: '¡Verificado! La prueba de vida se completó.',
    error: livenessError || 'No se pudo iniciar la comprobación de vida.',
  };

  return <div className="camera-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section className="camera-dialog" role="dialog" aria-modal="true" aria-labelledby="camera-title">
      <header className="camera-header"><div><span className="eyebrow">EVIDENCIA FOTOGRÁFICA</span><h2 id="camera-title">Foto para registrar {action}</h2><p className="muted">Primero completa la prueba de vida y después toma la foto.</p></div><button className="camera-close" type="button" onClick={onCancel} aria-label="Cerrar cámara" disabled={busy}>×</button></header>
      <div className="camera-frame">
        {photo ? <img className="camera-preview" src={photo} alt="Vista previa de la foto tomada" /> : <><video ref={videoRef} autoPlay playsInline muted className="camera-video" onLoadedData={() => { setReady(true); setStarting(false); }} onError={() => setError('El navegador no pudo mostrar la cámara. Cierra otras apps que la estén usando e inténtalo de nuevo.')} /><div className="camera-frame-hint">Centra tu rostro dentro del encuadre</div>{starting && <div className="camera-loading">Preparando la cámara…</div>}{!starting && !ready && !error && <div className="camera-loading">Esperando imagen de la cámara…</div>}</>}
      </div>
      <div className={`liveness-status ${livenessStatus === 'verified' ? 'is-verified' : livenessStatus === 'error' ? 'has-error' : ''}`} role="status" aria-live="polite">
        <span className="liveness-indicator">{livenessStatus === 'verified' ? '✓' : livenessStatus === 'error' ? '!' : '•'}</span>
        <span>{livenessMessage[livenessStatus]}</span>
      </div>
      {error && <div className="alert camera-error">{error}</div>}
      <p className="camera-privacy">La comprobación analiza la imagen en este dispositivo. Al confirmar, la foto se envía como evidencia del registro.</p>
      <div className="camera-actions"><button className="secondary" type="button" onClick={onCancel} disabled={busy}>Cancelar</button>{photo ? <><button className="secondary" type="button" onClick={() => { retakeRequestedRef.current = true; setReady(false); setStarting(true); setPhoto(''); setError(''); }}>Tomar otra</button><button className="primary" type="button" onClick={() => onCaptured(photo)} disabled={busy}>{busy ? 'Guardando…' : 'Confirmar foto y hora'}</button></> : <button className="primary" type="button" onClick={capture} disabled={!ready || livenessStatus !== 'verified' || !!error || busy}>{busy ? 'Guardando…' : 'Tomar foto'}</button>}</div>
    </section>
  </div>;
}
