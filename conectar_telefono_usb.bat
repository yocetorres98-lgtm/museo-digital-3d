@echo off
REM ============================================================
REM  Conecta el telefono por USB con el servidor del museo.
REM  Requiere: telefono conectado por USB y depuracion USB activa.
REM  Deja el telefono escuchando en 127.0.0.1:8080 -> PC:80
REM ============================================================

set ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe

if not exist "%ADB%" (
    echo No se encontro adb en:
    echo %ADB%
    echo Abre Android Studio una vez o instala las herramientas de plataforma.
    pause
    exit /b 1
)

echo Dispositivos conectados:
"%ADB%" devices
echo.

"%ADB%" reverse tcp:8080 tcp:80
if errorlevel 1 (
    echo No se pudo activar la conexion USB.
    echo Revisa que el telefono este conectado y autorizado.
    pause
    exit /b 1
)

echo.
echo Listo: el telefono ya puede usar el servidor por USB.
echo Direccion interna: http://127.0.0.1:8080/servidor
echo.
echo Si desconectas el telefono, vuelve a ejecutar este archivo.
pause
