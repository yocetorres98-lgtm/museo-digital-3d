<?php
// ============================================================
// crear_admin.php — Ejecutar UNA SOLA VEZ desde el navegador:
//   http://localhost/servidor/crear_admin.php
// Crea (o actualiza) la cuenta de administrador.
// Después de usarlo, ELIMINA este archivo.
// ============================================================
require __DIR__ . "/config.php";

// ---- Cambia estos datos si lo deseas ----
$NOMBRE  = "Administrador";
$CORREO  = "admin@museo.mx";
$CLAVE   = "Museo123";         // contraseña inicial de 8 caracteres (cámbiala después)
// -----------------------------------------

if (!filter_var($CORREO, FILTER_VALIDATE_EMAIL)) {
    exit("El correo de configuración no es válido.");
}
if (strlen($CLAVE) !== 8) {
    exit("La contraseña debe tener exactamente 8 caracteres.");
}

try {
    $pdo   = conexion();
    $hash  = password_hash($CLAVE, PASSWORD_DEFAULT);

    $existe = $pdo->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $existe->execute([$CORREO]);
    $fila = $existe->fetch();

    if ($fila) {
        $pdo->prepare("UPDATE usuarios SET password_hash = ?, rol = 'admin', activo = 1 WHERE id = ?")
            ->execute([$hash, $fila["id"]]);
        $accion = "actualizada";
    } else {
        $pdo->prepare("INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, 'admin')")
            ->execute([$NOMBRE, $CORREO, $hash]);
        $accion = "creada";
    }
} catch (PDOException $e) {
    exit("Error: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Administrador</title></head>
<body style="font-family: sans-serif; max-width: 520px; margin: 60px auto;">
    <h1>Cuenta de administrador <?= $accion ?></h1>
    <p><strong>Correo:</strong> <?= htmlspecialchars($CORREO) ?></p>
    <p><strong>Contraseña:</strong> la que definiste en el archivo.</p>
    <p style="color: #b00;"><strong>Importante:</strong> elimina ahora el archivo
    <code>crear_admin.php</code> del servidor por seguridad.</p>
    <p><a href="panel.php">Ir al panel de administración</a></p>
</body>
</html>
