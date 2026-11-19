<?php
// ============================================================
// POST /servidor/login.php
// Body JSON: { "correo": "...", "password": "..." }
// ============================================================
require __DIR__ . "/config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonSalida(405, ["error" => "Método no permitido"]);
}

$datos = jsonEntrada();
$correo = strtolower(trim((string)($datos["correo"] ?? "")));
$clave  = (string)($datos["password"] ?? "");

if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || $clave === "") {
    jsonSalida(400, ["error" => "Correo o contraseña no válidos."]);
}

try {
    $pdo = conexion();
    $pdo->prepare("DELETE FROM sesiones WHERE expira < NOW()")->execute();

    $st = $pdo->prepare("SELECT * FROM usuarios WHERE correo = ? AND activo = 1");
    $st->execute([$correo]);
    $u = $st->fetch();

    // mensaje genérico: no revelar si el correo existe o no
    if (!$u || !password_verify($clave, $u["password_hash"])) {
        jsonSalida(401, ["error" => "Correo o contraseña incorrectos."]);
    }

    $token = tokenNuevo();
    $expira = date("Y-m-d H:i:s", time() + TOKEN_DIAS * 86400);
    $pdo->prepare("INSERT INTO sesiones (id_usuario, token, expira) VALUES (?, ?, ?)")
        ->execute([$u["id"], $token, $expira]);

    jsonSalida(200, [
        "ok"    => true,
        "token" => $token,
        "usuario" => [
            "id"    => (int)$u["id"],
            "nombre" => $u["nombre"],
            "correo" => $u["correo"],
            "rol"   => $u["rol"],
        ],
    ]);
} catch (PDOException $e) {
    jsonSalida(500, ["error" => "Error interno del servidor."]);
}
