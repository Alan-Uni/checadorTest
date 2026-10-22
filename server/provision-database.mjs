import 'dotenv/config';
import fs from 'node:fs/promises';
import sql from 'mssql';
const raw = process.env.AZURE_SQL_CONNECTION_STRING;
if (!raw || /REPLACE_LOCALLY|your_password/i.test(raw)) throw new Error('Configura AZURE_SQL_CONNECTION_STRING en .env antes de continuar.');
if (!/shield-server\.database\.windows\.net/i.test(raw) || !/(Initial Catalog|Database)=checador(?:;|$)/i.test(raw)) throw new Error('La conexión de .env no coincide con el servidor/base checador esperados.');
const masterConnection = raw.replace(/(Initial Catalog|Database)=[^;]*/i, '$1=master');
const master = await new sql.ConnectionPool(masterConnection).connect();
let databaseCreated = false;
try {
  try { await master.request().query("IF DB_ID(N'checador') IS NULL CREATE DATABASE [checador];"); databaseCreated = true; }
  catch (error) { if (error.number !== 1801) throw error; }
} finally { await master.close(); }
let target;
for (let attempt=0; attempt<20; attempt++) {
  try { target=await new sql.ConnectionPool(raw).connect(); break; }
  catch (error) { if (attempt===19) throw error; await new Promise(resolve=>setTimeout(resolve,3000)); }
}
try {
  const schema=await fs.readFile(new URL('../database/schema.sql', import.meta.url),'utf8');
  const batches=schema.split(/^\s*GO\s*$/gim).map(part=>part.trim()).filter(Boolean);
  for (const batch of batches) await target.request().batch(batch);
  const check=await target.request().query("SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID('dbo') AND name IN ('organizaciones','sitios','usuarios_app','asistencias') ORDER BY name");
  if(check.recordset.length!==4) throw new Error('La verificación de tablas no encontró el esquema esperado completo.');
  console.log(`Azure SQL conectado. Base checador ${databaseCreated?'creada':'ya existente'}; tablas verificadas: ${check.recordset.map(row=>row.name).join(', ')}.`);
} finally { await target.close(); }
