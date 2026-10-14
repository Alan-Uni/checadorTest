export type Attendance={id:string;day:string;entry:string;exit:string;state:string;site:string};
const KEY='checador.web.demo.attendance.v2';
const sample:Attendance[]=[{id:'d2',day:'Ayer',entry:'07:56',exit:'16:04',state:'Completa',site:'Centro de trabajo de demostración'},{id:'d3',day:'Martes',entry:'08:10',exit:'16:12',state:'Completa',site:'Centro de trabajo de demostración'}];
export function loadDemoRecords():Attendance[]{try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):sample}catch{return sample}}
export function saveDemoRecords(records:Attendance[]){try{localStorage.setItem(KEY,JSON.stringify(records))}catch{/* private browsing may block local storage */}}
export function makeDemoEntry(records:Attendance[]){if(records.some(r=>r.day==='Hoy'&&r.entry!=='—'))return {records,error:'Ya hay una entrada de prueba para hoy.'};const entry=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});const next=[{id:crypto.randomUUID(),day:'Hoy',entry,exit:'—',state:'En jornada',site:'Centro de trabajo de demostración'},...records.filter(r=>r.day!=='Hoy')];return {records:next,error:''}}
export function makeDemoExit(records:Attendance[]){const today=records.find(r=>r.day==='Hoy');if(!today||today.entry==='—')return {records,error:'Registra una entrada de prueba primero.'};if(today.exit!=='—')return {records,error:'La salida de prueba ya está registrada.'};const exit=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});return {records:records.map(r=>r.id===today.id?{...r,exit,state:'Completa'}:r),error:''}}

