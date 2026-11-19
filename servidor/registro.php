<?php
// ============================================================
// POST /servidor/registro.php
// Body JSON: { "nombre": "...", "correo": "...", "password": "..." }
// ============================================================
require __DIR__ . "/config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonSalida(405, ["error" => "Método no permitido"]);
}

$datos = jsonEntrada();
$nombre = trim((string)($datos["nombre"] ?? ""));
$correo = strtolower(trim((string)($datos["correo"] ?? "")));
$clave  = (string)($datos["password"] ?? "");

// --- validación de datos ---
if ($nombre === "" || mb_strlen($nombre) > 100) {
    jsonSalida(400, ["error" => "El nombre es obligatorio (máximo 100 caracteres)."]);
}
if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || strlen($correo) > 150) {
    jsonSalida(400, ["error" => "Correo electrónico inválido."]);
}
if (strlen($clave) !== 8) {
    jsonSalida(400, ["error" => "La contraseña debe tener exactamente 8 caracteres."]);
}

try {
    $pdo = conexion();

    // --- evitar correos duplicados ---
    $existe = $pdo->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $existe->execute([$correo]);
    if ($existe->fetch()) {
        jsonSalida(409, ["error" => "El correo ya está registrado."]);
    }

    // --- guardar con hash seguro (bcrypt / argon2 según PHP) ---
    $hash = password_hash($clave, PASSWORD_DEFAULT);
    $pdo->prepare("INSERT INTO usuarios (nombre, correo, password_hash) VALUES (?, ?, ?)")
        ->execute([$nombre, $correo, $hash]);

    jsonSalida(201, ["ok" => true, "mensaje" => "Usuario registrado correctamente."]);
} catch (PDOException $e) {
    jsonSalida(500, ["error" => "Error interno del servidor."]);
}
