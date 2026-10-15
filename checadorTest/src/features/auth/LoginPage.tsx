import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles.css';

export function LoginPage({onEnterDemo}:{onEnterDemo:()=>void}) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function login(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    if(!supabase){setError('No está configurado el acceso de Supabase. Puedes continuar con el modo de prueba.');return}
    setBusy(true);
    const {error:authError}=await supabase.auth.signInWithPassword({email,password});
    setBusy(false);
    if(authError)setError(authError.message);
  }
  return <main className="login-page"><section className="login-panel"><div className="brand-mark">C</div><p className="eyebrow">CONTROL DE ASISTENCIA</p><h1>Bienvenido</h1><p className="muted">Inicia sesión para continuar o explora la demostración sin crear una cuenta.</p><form onSubmit={login} className="login-form"><label>Correo electrónico<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@empresa.com"/></label><label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>{error&&<div className="alert">{error}</div>}<button className="primary" disabled={busy}>{busy?'Conectando…':'Iniciar sesión'}</button></form><div className="divider"><span>o prueba la app</span></div><button className="secondary full" onClick={onEnterDemo}>Entrar sin cuenta</button><p className="demo-note">Modo de demostración: datos locales, sin conexión con el backend.</p></section><aside className="login-aside"><div className="aside-orb orb-one"/><div className="aside-orb orb-two"/><div className="aside-copy"><span className="pill-light">ASISTENCIA · SIMPLE Y CLARA</span><h2>Tu jornada,<br/>bajo control.</h2><p>Consulta horarios y administra tus registros desde un solo lugar.</p><div className="aside-mini"><span>✓</span> Historial de asistencia</div><div className="aside-mini"><span>✓</span> Registro de jornada</div></div></aside></main>;
}
