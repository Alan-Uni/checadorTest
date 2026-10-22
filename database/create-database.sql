-- Ejecutar en la base master del servidor. Requiere permiso para crear bases de datos.
IF DB_ID(N'checador') IS NULL
BEGIN
    CREATE DATABASE [checador];
END;
GO
