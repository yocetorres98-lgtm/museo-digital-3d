<?php
// ============================================================
// panel.php — Panel de administración del Museo Virtual 3D
// 1) Si no existe administrador: formulario de registro del admin
// 2) Si ya existe: inicio de sesión y lista de usuarios
// ============================================================
require __DIR__ . "/config.php";
session_start();

$error = "";
$aviso = "";

// ---------- Salir ----------
if (isset($_POST["salir"])) {
    session_destroy();
    header("Location: panel.php");
    exit;
}

$pdo = null;
$hayAdmin = false;

try {
    $pdo = conexion();
    $hayAdmin = (bool)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'")->fetchColumn();
} catch (PDOException $e) {
    $error = "No se pudo conectar con la base de datos. ¿Importaste museo_virtual.sql?";
}

// ---------- Registro del administrador (solo si aún no existe) ----------
if (!$hayAdmin && isset($_POST["accion"]) && $_POST["accion"] === "crear_admin") {
    $nombre  = trim($_POST["nombre"] ?? "");
    $correo  = strtolower(trim($_POST["correo"] ?? ""));
    $clave   = $_POST["clave"] ?? "";
    $repetir = $_POST["repetir"] ?? "";

    if ($nombre === "" || mb_strlen($nombre) > 100) {
        $error = "Escribe tu nombre (máximo 100 caracteres).";
    } elseif (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $error = "Escribe un correo válido.";
    } elseif (strlen($clave) !== 8) {
        $error = "La contraseña debe tener exactamente 8 caracteres.";
    } elseif ($clave !== $repetir) {
        $error = "Las contraseñas no coinciden.";
    } else {
        try {
            $existe = $pdo->prepare("SELECT id FROM usuarios WHERE correo = ?");
            $existe->execute([$correo]);
            if ($existe->fetch()) {
                $error = "Ya hay una cuenta con ese correo.";
            } else {
                $hash = password_hash($clave, PASSWORD_DEFAULT);
                $pdo->prepare("INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, 'admin')")
                    ->execute([$nombre, $correo, $hash]);
                $aviso = "Cuenta de administrador creada. Ya puedes iniciar sesión.";
                $hayAdmin = true;
            }
        } catch (PDOException $e) {
            $error = "No se pudo crear la cuenta.";
        }
    }
}

// ---------- Inicio de sesión del administrador ----------
if (isset($_POST["accion"]) && $_POST["accion"] === "login") {
    $correo = strtolower(trim($_POST["correo"] ?? ""));
    $clave  = $_POST["clave"] ?? "";

    try {
        $st = $pdo->prepare("SELECT * FROM usuarios WHERE correo = ? AND rol = 'admin' AND activo = 1");
        $st->execute([$correo]);
        $u = $st->fetch();

        if ($u && password_verify($clave, $u["password_hash"])) {
            $_SESSION["admin_id"]   = (int)$u["id"];
            $_SESSION["admin_nombre"] = $u["nombre"];
            header("Location: panel.php");
            exit;
        }
        $error = "Correo o contraseña incorrectos.";
    } catch (PDOException $e) {
        $error = "Error de conexión con la base de datos.";
    }
}

$autenticado = isset($_SESSION["admin_id"]);
$usuarios = [];

if ($autenticado) {
    try {
        $usuarios = $pdo->query("SELECT * FROM vista_usuarios")->fetchAll();
    } catch (PDOException $e) {
        $error = "Error al consultar los usuarios.";
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Panel de administración — Museo Virtual 3D</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; background: #f2f6f3; color: #1c2b21; padding: 24px; }
        .caja { max-width: 860px; margin: 0 auto; }
        h1 { font-size: 22px; margin-bottom: 18px; color: #0b3d2c; }
        h2 { font-size: 16px; margin-bottom: 12px; color: #0b3d2c; }
        .tarjeta { background: #fff; border: 1px solid #d5e2da; border-radius: 12px; padding: 22px; margin-bottom: 18px; }
        label { display: block; font-size: 13px; font-weight: 600; margin: 12px 0 4px; }
        input[type=email], input[type=password], input[type=text] {
            width: 100%; padding: 10px 12px; border: 1px solid #bcd0c4; border-radius: 8px; font-size: 14px;
        }
        button { margin-top: 16px; padding: 10px 18px; border: 0; border-radius: 8px; background: #0b3d2c; color: #fff; font-size: 14px; cursor: pointer; }
        button.rojo { background: #a33; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e3ece6; }
        th { font-size: 12px; text-transform: uppercase; color: #5b7266; letter-spacing: .04em; }
        .error { background: #fdecea; color: #a33; border: 1px solid #f5c6c2; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 14px; }
        .ok { background: #e8f5ee; color: #0b3d2c; border: 1px solid #bfe0cd; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 14px; }
        .rol { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; background: #e8f5ee; }
        .rol.admin { background: #0b3d2c; color: #fff; }
        .cabecera { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .cuenta { font-size: 13px; color: #5b7266; }
        .ayuda { font-size: 12px; color: #5b7266; margin-top: 8px; }
    </style>
</head>
<body>
<div class="caja">
    <div class="cabecera">
        <h1>🏛️ Panel de administración</h1>
        <?php if ($autenticado): ?>
            <div class="cuenta">
                <?= htmlspecialchars($_SESSION["admin_nombre"]) ?>
                <form method="post" style="display:inline"><button class="rojo" name="salir" value="1" style="margin:0 0 0 8px">Salir</button></form>
            </div>
        <?php endif; ?>
    </div>

    <?php if ($error): ?><div class="error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
    <?php if ($aviso): ?><div class="ok"><?= htmlspecialchars($aviso) ?></div><?php endif; ?>

    <?php if ($autenticado): ?>
        <!-- ============ Lista de usuarios ============ -->
        <div class="tarjeta">
            <h2>Usuarios registrados (<?= count($usuarios) ?>)</h2>
            <table>
                <thead>
                    <tr><th>#</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Fecha de registro</th></tr>
                </thead>
                <tbody>
                <?php if (!$usuarios): ?>
                    <tr><td colspan="6">No hay usuarios registrados todavía.</td></tr>
                <?php endif; ?>
                <?php foreach ($usuarios as $u): ?>
                    <tr>
                        <td><?= (int)$u["id"] ?></td>
                        <td><?= htmlspecialchars($u["nombre"]) ?></td>
                        <td><?= htmlspecialchars($u["correo"]) ?></td>
                        <td><span class="rol <?= $u["rol"] === "admin" ? "admin" : "" ?>"><?= htmlspecialchars($u["rol"]) ?></span></td>
                        <td><?= $u["activo"] ? "Activo" : "Inactivo" ?></td>
                        <td><?= htmlspecialchars($u["fecha_registro"]) ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>

    <?php elseif (!$hayAdmin): ?>
        <!-- ============ Primera vez: crear administrador ============ -->
        <div class="tarjeta" style="max-width: 460px;">
            <h2>Crear cuenta de administrador</h2>
            <p class="ayuda" style="margin:0 0 8px;">Aún no existe administrador. Regístrate una sola vez con tu correo y una contraseña.</p>
            <form method="post">
                <input type="hidden" name="accion" value="crear_admin">
                <label for="nombre">Nombre</label>
                <input type="text" id="nombre" name="nombre" required maxlength="100" autocomplete="name">
                <label for="correo">Correo electrónico</label>
                <input type="email" id="correo" name="correo" required autocomplete="email">
                <label for="clave">Contraseña (exactamente 8 caracteres)</label>
                <input type="password" id="clave" name="clave" required minlength="8" maxlength="8" autocomplete="new-password">
                <label for="repetir">Repite la contraseña</label>
                <input type="password" id="repetir" name="repetir" required minlength="8" maxlength="8" autocomplete="new-password">
                <button type="submit">Crear cuenta de administrador</button>
            </form>
        </div>

    <?php else: ?>
        <!-- ============ Inicio de sesión ============ -->
        <div class="tarjeta" style="max-width: 420px;">
            <h2>Acceso de administrador</h2>
            <form method="post">
                <input type="hidden" name="accion" value="login">
                <label for="correo">Correo de administrador</label>
                <input type="email" id="correo" name="correo" required autocomplete="username">
                <label for="clave">Contraseña</label>
                <input type="password" id="clave" name="clave" required autocomplete="current-password">
                <button type="submit">Entrar</button>
            </form>
        </div>
    <?php endif; ?>
</div>
</body>
</html>
