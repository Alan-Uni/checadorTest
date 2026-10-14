# Checador Web

Aplicación web construida con React, TypeScript y Vite. No usa Expo ni React Native. La interfaz se organiza en `src/features` (acceso, asistencia e historial), `src/components` y `src/lib`.

## Iniciar en desarrollo

```powershell
cd A:\checadorTest
npm run start
```

Abre la URL local que indique Vite (normalmente `http://localhost:5173`). También puedes ejecutar `npm run dev`.

## Acceso para pruebas

En la pantalla de bienvenida pulsa **Entrar sin cuenta**. El modo de demostración permite cambiar entre Jornada, Historial y Perfil, registrar entradas y salidas ficticias y conservarlas en el `localStorage` de ese navegador. La interfaz muestra el indicador **Modo de prueba**; estos datos no se envían a Supabase.

## Cuenta real

Las variables están en `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Usa `.env.example` como referencia. El login real y las consultas de sitio e historial usan Supabase. La escritura real de asistencia está bloqueada hasta integrar en web el proveedor facial que genera el descriptor de 128 valores esperado por las funciones SQL; el modo de prueba no altera esa validación.

## Comprobaciones

- `npm run typecheck`
- `npm run build`
