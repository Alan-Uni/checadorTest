import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import sql from 'mssql';
import { getPool } from './db.mjs';
const rand=()=>randomBytes(5).toString('hex');
const pool=await getPool();
let email='admin@checador.local';
let exists=await pool.request().input('email',sql.NVarChar(320),email).query('SELECT TOP(1) 1 AS found FROM dbo.usuarios_app WHERE LOWER(email)=@email');
if(exists.recordset.length){email=`admin-${rand()}@checador.local`;exists=await pool.request().input('email',sql.NVarChar(320),email).query('SELECT TOP(1) 1 AS found FROM dbo.usuarios_app WHERE LOWER(email)=@email');if(exists.recordset.length)throw new Error('No se pudo reservar un correo de prueba único.');}

const password=randomBytes(24).toString('base64url');
const matricula=`ADMIN-${rand().toUpperCase()}`;
const envPath=new URL('../.env',import.meta.url);
const prior=await readFile(envPath,'utf8');
const preserved=prior.split(/\r?\n/).filter(line=>!/^\s*BOOTSTRAP_(EMAIL|PASSWORD|NAME|MATRICULA)=/.test(line));
preserved.push(`BOOTSTRAP_EMAIL=${email}`,`BOOTSTRAP_PASSWORD=${password}`,'BOOTSTRAP_NAME=Administrador de prueba',`BOOTSTRAP_MATRICULA=${matricula}`);
await writeFile(envPath,preserved.join('\n')+'\n');
process.env.BOOTSTRAP_EMAIL=email;process.env.BOOTSTRAP_PASSWORD=password;process.env.BOOTSTRAP_NAME='Administrador de prueba';process.env.BOOTSTRAP_MATRICULA=matricula;
await import('./bootstrap-user.mjs');
console.log(`Cuenta administrativa creada para pruebas: ${email}. Contraseña aleatoria guardada en .env (archivo ignorado por Git).`);

