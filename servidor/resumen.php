<?php
// ============================================================
// GET /servidor/resumen.php
//
// Devuelve la lista de personas registradas en la base de datos
// para que el panel de administrador de la app pueda mostrarla.
//
// SOLO LEE. No inserta, no modifica y no borra nada.
//
// Parámetros opcionales:
//   limite = cuántos registros devolver (por omisión 200, máximo 1000)
// ============================================================
require __DIR__ . "/config.php";

if (($_SERVER["REQUEST_METHOD"] ?? "GET") !== "GET") {
    jsonSalida(405, ["error" => "Método no permitido"]);
}

$limite = isset($_GET["limite"]) ? (int)$_GET["limite"] : 200;
if ($limite < 1) {
    $limite = 200;
}
if ($limite > 1000) {
    $limite = 1000;
}

try {
    $pdo = conexion();

    $total = (int)$pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();

    $st = $pdo->prepare(
        "SELECT id, nombre, correo, rol, activo, fecha_registro
         FROM vista_usuarios
         LIMIT :limite"
    );
    $st->bindValue(":limite", $limite, PDO::PARAM_INT);
    $st->execute();
    $lista = $st->fetchAll();

    jsonSalida(200, [
        "ok"        => true,
        "total"     => $total,
        "servidor"  => gethostname(),
        "base"      => DB_NOMBRE,
        "usuarios"  => $lista,
    ]);
} catch (PDOException $e) {
    jsonSalida(500, ["error" => "No se pudo consultar la base de datos."]);
}
