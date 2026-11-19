@echo off
REM ============================================================
REM  Permite que el telefono (misma red Wi-Fi) llegue a Apache
REM  del XAMPP del museo por el puerto 80.
REM  Ejecutar con: clic derecho > "Ejecutar como administrador"
REM ============================================================

net session >nul 2>&1
if errorlevel 1 (
    echo Solicitando permisos de administrador...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$reglas = @('TCP Query User{885C8481-6FC0-4A2D-85F9-C9F19A46F5EC}C:\xamppyoce\apache\bin\httpd.exe', 'UDP Query User{878E559B-1CB4-4454-93EE-8DCD08B899CB}C:\xamppyoce\apache\bin\httpd.exe');" ^
  "foreach ($n in $reglas) { if (Get-NetFirewallRule -Name $n -ErrorAction SilentlyContinue) { Remove-NetFirewallRule -Name $n; Write-Host ('Regla de bloqueo eliminada: ' + $n) } };" ^
  "if (-not (Get-NetFirewallRule -DisplayName 'Museo 3D - Apache HTTP 80' -ErrorAction SilentlyContinue)) {" ^
  "  New-NetFirewallRule -DisplayName 'Museo 3D - Apache HTTP 80' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 -Program 'C:\xamppyoce\apache\bin\httpd.exe' -Profile Private,Public -RemoteAddress LocalSubnet | Out-Null;" ^
  "  Write-Host 'Regla de entrada HTTP 80 creada (solo red local).' }" ^
  "else { Write-Host 'La regla de entrada ya existia.' }"

echo.
echo Listo. Ya puedes abrir http://192.168.1.219/servidor/panel.php desde el telefono.
pause
