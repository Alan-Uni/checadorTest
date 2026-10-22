import 'dotenv/config';
import sql from 'mssql';
let poolPromise;
export function getPool(){
 if(!process.env.AZURE_SQL_CONNECTION_STRING)throw new Error('AZURE_SQL_CONNECTION_STRING no está configurada.');
 if(!poolPromise)poolPromise=new sql.ConnectionPool(process.env.AZURE_SQL_CONNECTION_STRING).connect().catch(error=>{poolPromise=undefined;throw error});
 return poolPromise;
}
export {sql};
