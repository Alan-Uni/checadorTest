-- Ejecutar dentro de la base de datos checador.
IF OBJECT_ID(N'dbo.organizaciones',N'U') IS NULL
CREATE TABLE dbo.organizaciones(
 id uniqueidentifier NOT NULL CONSTRAINT DF_organizaciones_id DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
 nombre nvarchar(160) NOT NULL,
 slug nvarchar(180) NOT NULL,
 activo bit NOT NULL CONSTRAINT DF_organizaciones_activo DEFAULT 1,
 created_at datetime2(3) NOT NULL CONSTRAINT DF_organizaciones_created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT UQ_organizaciones_slug UNIQUE(slug)
);
GO
IF OBJECT_ID(N'dbo.sitios',N'U') IS NULL
CREATE TABLE dbo.sitios(
 id uniqueidentifier NOT NULL CONSTRAINT DF_sitios_id DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
 organizacion_id uniqueidentifier NOT NULL,
 nombre nvarchar(160) NOT NULL,
 activo bit NOT NULL CONSTRAINT DF_sitios_activo DEFAULT 1,
 created_at datetime2(3) NOT NULL CONSTRAINT DF_sitios_created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT FK_sitios_organizaciones FOREIGN KEY(organizacion_id) REFERENCES dbo.organizaciones(id),
 CONSTRAINT UQ_sitios_org_nombre UNIQUE(organizacion_id,nombre)
);
GO
IF OBJECT_ID(N'dbo.usuarios_app',N'U') IS NULL
CREATE TABLE dbo.usuarios_app(
 id uniqueidentifier NOT NULL CONSTRAINT DF_usuarios_app_id DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
 organizacion_id uniqueidentifier NOT NULL,
 sitio_id uniqueidentifier NULL,
 nombre nvarchar(160) NOT NULL,
 matricula nvarchar(80) NOT NULL,
 email nvarchar(320) NOT NULL,
 password_hash nvarchar(100) NOT NULL,
 rol nvarchar(32) NOT NULL CONSTRAINT DF_usuarios_app_rol DEFAULT 'usuario',
 activo bit NOT NULL CONSTRAINT DF_usuarios_app_activo DEFAULT 1,
 created_at datetime2(3) NOT NULL CONSTRAINT DF_usuarios_app_created DEFAULT SYSUTCDATETIME(),
 updated_at datetime2(3) NOT NULL CONSTRAINT DF_usuarios_app_updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT FK_usuarios_app_organizacion FOREIGN KEY(organizacion_id) REFERENCES dbo.organizaciones(id),
 CONSTRAINT FK_usuarios_app_sitio FOREIGN KEY(sitio_id) REFERENCES dbo.sitios(id),
 CONSTRAINT CK_usuarios_app_rol CHECK(rol IN('usuario','admin','supervisor','superadmin')),
 CONSTRAINT UQ_usuarios_app_org_matricula UNIQUE(organizacion_id,matricula)
);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'UX_usuarios_app_email' AND object_id=OBJECT_ID(N'dbo.usuarios_app'))
CREATE UNIQUE INDEX UX_usuarios_app_email ON dbo.usuarios_app(email);
GO
IF OBJECT_ID(N'dbo.asistencias',N'U') IS NULL
CREATE TABLE dbo.asistencias(
 id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
 usuario_id uniqueidentifier NOT NULL,
 organizacion_id uniqueidentifier NOT NULL,
 sitio_id uniqueidentifier NOT NULL,
 fecha date NOT NULL,
 hora_entrada datetime2(3) NOT NULL CONSTRAINT DF_asistencias_entrada DEFAULT SYSUTCDATETIME(),
 foto_entrada varbinary(max) NOT NULL,
 hora_salida datetime2(3) NULL,
 foto_salida varbinary(max) NULL,
 estado nvarchar(40) NOT NULL CONSTRAINT DF_asistencias_estado DEFAULT 'entrada_registrada',
 observacion nvarchar(1000) NOT NULL CONSTRAINT DF_asistencias_observacion DEFAULT '',
 created_at datetime2(3) NOT NULL CONSTRAINT DF_asistencias_created DEFAULT SYSUTCDATETIME(),
 updated_at datetime2(3) NOT NULL CONSTRAINT DF_asistencias_updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT FK_asistencias_usuario FOREIGN KEY(usuario_id) REFERENCES dbo.usuarios_app(id),
 CONSTRAINT FK_asistencias_organizacion FOREIGN KEY(organizacion_id) REFERENCES dbo.organizaciones(id),
 CONSTRAINT FK_asistencias_sitio FOREIGN KEY(sitio_id) REFERENCES dbo.sitios(id),
 CONSTRAINT CK_asistencias_estado CHECK(estado IN('entrada_registrada','asistencia_completa','revision_requerida'))
);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'UX_asistencias_usuario_fecha' AND object_id=OBJECT_ID(N'dbo.asistencias'))
CREATE UNIQUE INDEX UX_asistencias_usuario_fecha ON dbo.asistencias(usuario_id,fecha);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_asistencias_org_fecha' AND object_id=OBJECT_ID(N'dbo.asistencias'))
CREATE INDEX IX_asistencias_org_fecha ON dbo.asistencias(organizacion_id,fecha DESC);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_asistencias_sitio_fecha' AND object_id=OBJECT_ID(N'dbo.asistencias'))
CREATE INDEX IX_asistencias_sitio_fecha ON dbo.asistencias(sitio_id,fecha DESC);
GO

