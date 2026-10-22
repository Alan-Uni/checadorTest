export type AppUser = { id: string; nombre: string; email: string; rol: string };
export type ApiAttendance = { id: string | number; fecha: string; hora_entrada: string; hora_salida: string | null; sitio_nombre: string | null; foto_entrada: number; foto_salida: number; estado: string };
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Error de servidor (${response.status}).`);
  }
  return response.status === 204 ? undefined as T : response.json();
}
export const api = {
  login: (email: string, password: string) => request<{user: AppUser}>('/api/auth/login', {method:'POST',body:JSON.stringify({email,password})}),
  me: () => request<{user: AppUser}>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', {method:'POST'}),
  site: () => request<{site_name: string}>('/api/site/active'),
  attendance: () => request<{records: ApiAttendance[]}>('/api/attendance'),
  entry: (photo: string) => request('/api/attendance/entry', {method:'POST',body:JSON.stringify({photo})}),
  exit: (photo: string) => request('/api/attendance/exit', {method:'POST',body:JSON.stringify({photo})}),
};
