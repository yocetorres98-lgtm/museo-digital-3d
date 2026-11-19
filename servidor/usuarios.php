<?php
// ============================================================
// GET /servidor/usuarios.php
// Header: Authorization: Bearer <token>
// Solo el administrador puede consultar la lista de usuarios.
// ============================================================
require __DIR__ . "/config.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    jsonSalida(405, ["error" => "Método no permitido"]);
}

$cabecera = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
if (!preg_match("/^Bearer\s+(\S+)$/i", $cabecera, $m)) {
    jsonSalida(401, ["error" => "Falta el token de sesión."]);
}

try {
    $pdo = conexion();
    $st = $pdo->prepare(
        "SELECT u.id, u.nombre, u.correo, u.rol, u.activo, u.fecha_registro
         FROM sesiones s
         JOIN usuarios u ON u.id = s.id_usuario
         WHERE s.token = ? AND s.expira > NOW()"
    );
    $st->execute([$m[1]]);
    $u = $st->fetch();

    if (!$u) {
        jsonSalida(401, ["error" => "Sesión inválida o expirada."]);
    }
    if ($u["rol"] !== "admin") {
        jsonSalida(403, ["error" => "Acceso reservado al administrador."]);
    }

    $lista = $pdo->query(
        "SELECT id, nombre, correo, rol, activo, fecha_registro
         FROM vista_usuarios"
    )->fetchAll();

    jsonSalida(200, ["ok" => true, "usuarios" => $lista]);
} catch (PDOException $e) {
    jsonSalida(500, ["error" => "Error interno del servidor."]);
}
