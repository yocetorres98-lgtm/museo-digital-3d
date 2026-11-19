<?php
// ============================================================
// Configuración de la base de datos del Museo Virtual 3D
// Ajusta las credenciales de tu servidor (XAMPP / WAMP / hosting)
// ============================================================

const DB_SERVIDOR = "localhost";
const DB_NOMBRE   = "museo_virtual";
const DB_USUARIO  = "root";
const DB_CLAVE    = "";        // en XAMPP/WAMP por defecto está vacía
const TOKEN_DIAS  = 30;        // vigencia del token de sesión

function conexion(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_SERVIDOR . ";dbname=" . DB_NOMBRE . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USUARIO, DB_CLAVE, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function jsonEntrada(): array
{
    $datos = json_decode(file_get_contents("php://input"), true);
    return is_array($datos) ? $datos : [];
}

function jsonSalida(int $codigo, array $datos): void
{
    http_response_code($codigo);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function tokenNuevo(): string
{
    return bin2hex(random_bytes(32));   // 64 caracteres hexadecimales
}
