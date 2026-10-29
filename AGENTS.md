# Project instructions

## 🏗️ Stack Tecnológico y Reglas del Proyecto
This repository is a browser-only React application built with TypeScript and Vite. Do not add Expo, React Native, native mobile targets, or server-side rendering. Keep product code in `src/`, grouped by feature and shared components.
Use browser APIs for web capabilities. Keep the no-account demonstration mode local to the browser and clearly separated from Supabase data.

## 💻 Commands (Comandos de ejecución)
- `npm run start` starts the local web development server.
- `npm run typecheck` validates TypeScript.
- `npm run build` creates the production web bundle in `dist/`.

# Reglas de Comportamiento para esta Tarea

## 🎯 Alcance Estricto
- **Objetivo Único**: Corregir la vulnerabilidad del reloj (sincronización con la hora del servidor).
- **Prohibido**: No modificar otros archivos, componentes ni funcionalidades que no estén directamente relacionados con el reloj.
- **Prohibido**: No realizar refactorizaciones globales, cambios de arquitectura o actualizaciones de dependencias no solicitadas.
- **Prohibido**: No modificar `package.json` ni `package-lock.json` a menos que sea estrictamente necesario para instalar una nueva librería para el reloj (y en ese caso, debe justificarlo).

## 📝 Estilo de Trabajo (similar a Codex)
- **Verificación**: Antes de dar una tarea por terminada, ejecuta `npm run typecheck` para asegurar que no haya errores de tipado.
- **Cambios Atómicos**: Realiza la menor cantidad de cambios posible para lograr el objetivo.
- **Comunicación**: Si encuentras una ambigüedad, pregunta antes de asumir. Si necesitas instalar una dependencia, proporciona el comando exacto de `npm install` en tu respuesta.

## 🔒 Contexto de la Vulnerabilidad
- El reloj actual usa la hora local del dispositivo (`new Date()`).
- Se requiere que la hora provenga de una fuente confiable (servidor) para evitar manipulaciones.