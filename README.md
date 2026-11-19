# Museo Digital 3D

Guía virtual en 3D de la Región de los Volcanes, desarrollada en Android (Kotlin + Jetpack Compose).

## Descarga

La página de descarga está publicada con GitHub Pages en:

**https://yocetorres98-lgtm.github.io/museo-digital-3d/**

El archivo instalable también está en `docs/MuseoDigital3D-con-base-de-datos.apk`.

## Contenido del repositorio

- `app/src/main/java/com/museo/guia/` — código Kotlin de la aplicación.
- `app/src/main/assets/` — modelos y recursos 3D.
- `app/src/main/res/` — layouts, idioma e iconos.
- `servidor/` — backend PHP (MySQL `museo_virtual`) y esquema SQL.
- `docs/` — sitio web de descarga (GitHub Pages).
- `conectar_telefono_usb.bat` — activa el túnel USB con el servidor local.
- `abrir_puerto_museo.bat` — abre el puerto de Apache en el Firewall (requiere administrador).

## Servidor

El registro de visitantes necesita el backend PHP con Apache y MySQL:

1. Iniciar Apache y MySQL desde `C:\xamppyoce\xampp-control.exe`.
2. Copiar el contenido de `servidor/` en `C:\xamppyoce\htdocs\servidor`.
3. Importar `servidor/museo_virtual.sql` en phpMyAdmin.
4. Visitar `http://localhost/servidor/crear_admin.php` una sola vez.
5. Panel de administración web: `http://localhost/servidor/panel.php`.

Teléfono conectado por USB: ejecutar `conectar_telefono_usb.bat` y dejar la depuración USB autorizada.

## Contraseñas

Las cuentas usan contraseñas de **exactamente 8 caracteres**.
