# Checador Web

Aplicación web construida con React, TypeScript y Vite. No usa Expo ni React Native. La interfaz se organiza en `src/features` (acceso, asistencia e historial), `src/components` y `src/lib`.

## Iniciar en desarrollo

```powershell
cd A:\checadorTest
npm run start
```

Abre la URL que indique Vite (normalmente `http://localhost:5173`). Para producción usa `npm run build`.

## Acceso y pruebas

En la bienvenida, pulsa **Entrar sin cuenta**. El modo de demostración permite recorrer Jornada, Historial y Perfil, y registrar una entrada y salida ficticias. Antes de cada movimiento solicita una foto desde la cámara web. La imagen solo vive en memoria durante la captura; no se sube ni conserva como archivo. El historial demo guarda únicamente la marca de que se capturó la foto y se queda en el `localStorage` del navegador. La app muestra el indicador **Modo de prueba**.

La cámara requiere permiso del navegador y un contexto seguro: `localhost` o HTTPS. La hora actual se muestra en vivo en la tarjeta de jornada; al confirmar la foto se fija la hora del movimiento.

## Cuenta real

Las variables están en `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); consulta `.env.example`. El login y las consultas de sitio e historial usan Supabase. La escritura real de asistencia permanece bloqueada hasta integrar el proveedor facial compatible con el descriptor que exigen las funciones SQL. No se envían fotos ni registros parciales al backend.

## Comprobaciones

- `npm run typecheck`
- `npm run build`
