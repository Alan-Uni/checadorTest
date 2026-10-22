# Checador Web

Aplicación web con React, TypeScript y Vite. La interfaz está en `src/`, agrupada por función. El servidor Express (`server/`) gestiona sesiones y consultas a Azure SQL; las credenciales nunca se envían al navegador.

## Requisitos y ejecución

Instala Node.js LTS y copia `.env.example` como `.env` en esta carpeta. Completa en `.env` `AZURE_SQL_CONNECTION_STRING` con la contraseña real (mantén toda la cadena entre comillas dobles si tiene caracteres especiales), y crea un `JWT_SECRET` largo y aleatorio. No compartas estos valores ni los subas al repositorio. Luego instala e inicia:

```powershell
cd A:\checadorTest
npm install
npm run start
```

Vite sirve la web en `http://localhost:5173` y el backend en `http://localhost:4000`. La cámara requiere localhost o HTTPS y permiso concedido en el navegador.

## Preparar Azure SQL

La cadena que compartiste apunta a **Azure SQL (SQL Server)**. Si el catálogo `checador` aún no existe, ejecuta `database/create-database.sql` conectado al catálogo `master`. Después selecciona la base `checador` y ejecuta `database/schema.sql`. Los scripts pueden ejecutarse de nuevo sin recrear las tablas existentes.

Para crear el primer usuario administrador, coloca temporalmente `BOOTSTRAP_EMAIL`, `BOOTSTRAP_PASSWORD` (12 caracteres como mínimo), y opcionalmente nombre/matrícula/centro en `.env`, y ejecuta `npm run db:bootstrap-user`. La contraseña se guarda como hash. El script no cambia una cuenta existente.

En Azure Portal, agrega la IP de salida del equipo/servidor que ejecutará la API a las reglas de firewall del servidor SQL. Para producción, despliega la API y el frontend bajo el mismo origen HTTPS; establece `NODE_ENV=production` y un `JWT_SECRET` seguro.

## Acceso de prueba

Pulsa **Entrar sin cuenta**. El modo demo conserva registros ficticios en el almacenamiento local del navegador y no los envía a Azure SQL. En una sesión real, tanto entrada como salida requieren foto; la imagen se guarda en `varbinary(max)` como evidencia. Este flujo **no realiza reconocimiento facial** ni valida identidad biométrica.

## Comprobación local

```powershell
npm run typecheck
npm run build
```

Con `.env` configurado, visita `http://localhost:4000/api/health` para verificar la conexión a Azure SQL.

