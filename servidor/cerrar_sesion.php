<?php
// ============================================================
// POST /servidor/cerrar_sesion.php
// Header: Authorization: Bearer <token>
// ============================================================
require __DIR__ . "/config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonSalida(405, ["error" => "Método no permitido"]);
}

$cabecera = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
if (!preg_match("/^Bearer\s+(\S+)$/i", $cabecera, $m)) {
    jsonSalida(401, ["error" => "Falta el token de sesión."]);
}

try {
    $pdo = conexion();
    $pdo->prepare("DELETE FROM sesiones WHERE token = ?")->execute([$m[1]]);
    jsonSalida(200, ["ok" => true, "mensaje" => "Sesión cerrada."]);
} catch (PDOException $e) {
    jsonSalida(500, ["error" => "Error interno del servidor."]);
}
