-- ============================================================
-- Base de datos del Museo Virtual 3D
-- Importar desde phpMyAdmin (pestaña "Importar")
-- ============================================================

CREATE DATABASE IF NOT EXISTS `museo_virtual`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `museo_virtual`;

-- ------------------------------------------------------------
-- Usuarios registrados de la aplicación
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`         VARCHAR(100) NOT NULL,
  `correo`         VARCHAR(150) NOT NULL,
  `password_hash`  VARCHAR(255) NOT NULL,
  `rol`            ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  `activo`         TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_registro` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Sesiones (tokens de inicio de sesión de la app)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_usuario` INT UNSIGNED NOT NULL,
  `token`      VARCHAR(64) NOT NULL,
  `expira`     DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_sesiones_usuario` (`id_usuario`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Vista para el panel de administración
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW `vista_usuarios` AS
SELECT `id`, `nombre`, `correo`, `rol`, `activo`, `fecha_registro`
FROM `usuarios`
ORDER BY `fecha_registro` DESC;

-- ------------------------------------------------------------
-- NOTA: el usuario administrador NO se crea aquí porque la
-- contraseña debe guardarse con hash bcrypt. Ejecuta una sola vez
-- desde el navegador:
--   http://TU-SERVIDOR/servidor/crear_admin.php
-- y después ELIMINA ese archivo por seguridad.
-- ------------------------------------------------------------
