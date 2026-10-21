# Project instructions

## 🎯 Objetivo Actual: Auditoría y Paridad Funcional
Este repositorio es una refactorización del software original. El objetivo de la IA es auditar y comparar esta versión (Nueva) con la original para asegurar que se comporten exactamente igual. 

## 📂 Ubicaciones de los Proyectos
- **Proyecto Original**: C:\Users\HUAWEI\Documents\Hub_Tech\Checador
- **Proyecto Nuevo (Este repositorio)**: C:\Users\HUAWEI\Documents\Hub_Tech\ChecadorTest

## 🏗️ Stack Tecnológico y Reglas del Proyecto
This repository is a browser-only React application built with TypeScript and Vite. Do not add Expo, React Native, native mobile targets, or server-side rendering. Keep product code in `src/`, grouped by feature and shared components.
Use browser APIs for web capabilities. Keep the no-account demonstration mode local to the browser and clearly separated from Supabase data.

## 💻 Commands (Comandos de ejecución)
- `npm run start` starts the local web development server.
- `npm run typecheck` validates TypeScript.
- `npm run build` creates the production web bundle in `dist/`.

## 📋 Reglas de Trabajo para la IA
1. **No modificar `master`**: Todos los cambios deben realizarse en la rama actual (`feature/auditoria-hermes`).
2. **Auditoría primero**: Antes de cambiar código, se debe generar un informe de brechas (qué falta o difiere).
3. **Revisión de cambios**: Siempre mostrar el `git diff` antes de confirmar cualquier modificación para que el usuario lo revise.
4. **Explicaciones simples**: El usuario es practicante y tiene poca experiencia en desarrollo web e IA. Explicar los conceptos de forma sencilla y proporcionar comandos exactos para copiar y pegar en la terminal.