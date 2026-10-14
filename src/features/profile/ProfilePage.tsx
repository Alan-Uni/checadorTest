type ProfilePageProps = {
  name: string;
  email?: string;
  isDemo: boolean;
  site: string;
  onResetDemo: () => void;
};

export function ProfilePage({
  name,
  email,
  isDemo,
  site,
  onResetDemo,
}: ProfilePageProps) {
  const initialLetter = name.slice(0, 1).toUpperCase();

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU CUENTA</p>
          <h1>Perfil</h1>
          <p className="muted">Información de la sesión actual y organización.</p>
        </div>
      </div>

      <section className="profile-card">
        <div className="profile-avatar">{initialLetter}</div>
        <div>
          <h2>{name}</h2>
          <p>{isDemo ? 'Acceso de demostración' : email}</p>
          <span className="status-tag">
            {isDemo ? 'Prueba local' : 'Cuenta activa'}
          </span>
        </div>
      </section>

      <section className="info-card">
        <h3>Centro de trabajo</h3>
        <p>{isDemo ? 'Centro de demostración' : site}</p>
        <p className="muted">
          Los turnos, asignaciones y cambios de perfil se administran directamente desde la consola de tu organización.
        </p>

        {isDemo && (
          <button className="secondary reset-demo" onClick={onResetDemo}>
            Restablecer datos de prueba
          </button>
        )}
      </section>
    </>
  );
}
