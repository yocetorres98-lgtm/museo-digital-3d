package com.museo.guia.compose.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.museo.guia.AdminSesion
import com.museo.guia.MuseoApi
import com.museo.guia.Visitas
import com.museo.guia.compose.ui.theme.MuseoTheme

private val RE_CORREO = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")

/**
 * Apartado del administrador del museo.
 *
 * La primera vez muestra el registro (nombre, correo y contraseña). Después
 * pide iniciar sesión y, una vez dentro, enseña el panel con la cuenta y las
 * estadísticas de visitas.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(onBack: () -> Unit) {
    MuseoTheme {
        val context = LocalContext.current
        val admin = remember { AdminSesion(context) }

        var registrado by remember { mutableStateOf(admin.registrado) }
        var activo by remember { mutableStateOf(admin.sesionActiva) }
        var nombreAdmin by remember { mutableStateOf(admin.nombre) }
        var correoAdmin by remember { mutableStateOf(admin.correo) }
        var bienvenida by remember { mutableStateOf(false) }

        val titulo = when {
            activo -> "Panel de administrador"
            registrado -> "Acceso administrador"
            else -> "Registro de administrador"
        }

        if (bienvenida) {
            AlertDialog(
                onDismissRequest = { bienvenida = false },
                icon = { Icon(Icons.Default.Badge, contentDescription = null) },
                title = { Text("Cuenta creada") },
                text = {
                    Text(
                        "Bienvenido, $nombreAdmin. Ya puedes administrar el museo " +
                            "con tu correo $correoAdmin."
                    )
                },
                confirmButton = {
                    Button(onClick = { bienvenida = false }) { Text("Ir al panel") }
                }
            )
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(titulo) },
                    navigationIcon = {
                        TextButton(onClick = onBack) { Text("Atrás") }
                    }
                )
            }
        ) { padding ->
            when {
                !registrado -> RegistroAdmin(
                    modifier = Modifier.padding(padding),
                    onRegistrar = { nombre, correo, clave ->
                        admin.registrar(nombre, correo, clave)
                        registrado = admin.registrado
                        activo = admin.sesionActiva
                        nombreAdmin = admin.nombre
                        correoAdmin = admin.correo
                        bienvenida = true
                    }
                )

                !activo -> LoginAdmin(
                    modifier = Modifier.padding(padding),
                    correoInicial = correoAdmin,
                    onEntrar = { correo, clave ->
                        if (admin.validar(correo, clave)) {
                            admin.abrirSesion()
                            activo = true
                            correoAdmin = admin.correo
                            true
                        } else {
                            false
                        }
                    }
                )

                else -> PanelAdmin(
                    modifier = Modifier.padding(padding),
                    nombre = nombreAdmin,
                    correo = correoAdmin,
                    visitas = remember { Visitas(context) },
                    onSalir = {
                        admin.cerrarSesion()
                        activo = false
                    },
                    onBorrarCuenta = {
                        admin.borrar()
                        registrado = admin.registrado
                        activo = admin.sesionActiva
                        nombreAdmin = admin.nombre
                        correoAdmin = admin.correo
                        bienvenida = false
                    }
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

@Composable
private fun RegistroAdmin(
    modifier: Modifier,
    onRegistrar: (String, String, String) -> Unit
) {
    var nombre by remember { mutableStateOf("") }
    var correo by remember { mutableStateOf("") }
    var clave by remember { mutableStateOf("") }
    var repetir by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Badge,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(40.dp)
        )
        Text(
            text = "Crea la cuenta del administrador",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Solo se pide una vez. Con estos datos entrarás al panel del museo " +
                "cada vez que abras la aplicación.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f)
        )

        Spacer(modifier = Modifier.height(4.dp))

        OutlinedTextField(
            value = nombre,
            onValueChange = {
                nombre = it
                error = ""
            },
            label = { Text("Nombre completo") },
            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = correo,
            onValueChange = {
                correo = it
                error = ""
            },
            label = { Text("Correo electrónico") },
            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth()
        )

        CampoClave(
            valor = clave,
            onValorChange = {
                clave = it
                error = ""
            },
            etiqueta = "Contraseña"
        )

        CampoClave(
            valor = repetir,
            onValorChange = {
                repetir = it
                error = ""
            },
            etiqueta = "Repetir contraseña"
        )

        if (error.isNotEmpty()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.ErrorOutline,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(error, color = MaterialTheme.colorScheme.error)
            }
        }

        Button(
            onClick = {
                error = when {
                    nombre.isBlank() -> "Escribe tu nombre."
                    nombre.trim().length < 3 -> "El nombre necesita al menos 3 caracteres."
                    !RE_CORREO.matches(correo.trim()) -> "Escribe un correo válido."
                    clave.length != 8 -> "La contraseña debe tener exactamente 8 caracteres."
                    clave != repetir -> "Las contraseñas no coinciden."
                    else -> ""
                }
                if (error.isEmpty()) onRegistrar(nombre.trim(), correo.trim(), clave)
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text("Crear cuenta de administrador", style = MaterialTheme.typography.titleMedium)
        }

        Text(
            text = "La contraseña se guarda cifrada en este dispositivo.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.65f),
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

// ---------------------------------------------------------------------------
// Inicio de sesión
// ---------------------------------------------------------------------------

@Composable
private fun LoginAdmin(
    modifier: Modifier,
    correoInicial: String,
    onEntrar: (String, String) -> Boolean
) {
    var correo by remember { mutableStateOf(correoInicial) }
    var clave by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Badge,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(40.dp)
        )
        Text(
            text = "Acceso del administrador",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Área exclusiva del personal del museo. Entra con el correo y la " +
                "contraseña que registraste.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f)
        )

        Spacer(modifier = Modifier.height(4.dp))

        OutlinedTextField(
            value = correo,
            onValueChange = {
                correo = it
                error = ""
            },
            label = { Text("Correo electrónico") },
            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth()
        )

        CampoClave(
            valor = clave,
            onValorChange = {
                clave = it
                error = ""
            },
            etiqueta = "Contraseña"
        )

        if (error.isNotEmpty()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.ErrorOutline,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(error, color = MaterialTheme.colorScheme.error)
            }
        }

        Button(
            onClick = {
                error = when {
                    correo.isBlank() || clave.isBlank() -> "Completa el correo y la contraseña."
                    !onEntrar(correo.trim(), clave) -> "Correo o contraseña incorrectos."
                    else -> ""
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text("Entrar al panel", style = MaterialTheme.typography.titleMedium)
        }
    }
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

@Composable
private fun PanelAdmin(
    modifier: Modifier,
    nombre: String,
    correo: String,
    visitas: Visitas,
    onSalir: () -> Unit,
    onBorrarCuenta: () -> Unit
) {
    var refresco by remember { mutableStateOf(0) }
    var confirmarBorrado by remember { mutableStateOf(false) }
    var confirmarCuenta by remember { mutableStateOf(false) }

    val total = remember(refresco) { visitas.total }
    val hoy = remember(refresco) { visitas.hoy }
    val entradas = remember(refresco) { visitas.entradas }

    // --- Personas registradas en la base de datos (solo lectura) ---
    var usuariosDb by remember { mutableStateOf<List<MuseoApi.UsuarioRemoto>>(emptyList()) }
    var totalDb by remember { mutableStateOf(0) }
    var baseDb by remember { mutableStateOf("") }
    var errorDb by remember { mutableStateOf("") }
    var cargandoDb by remember { mutableStateOf(true) }

    LaunchedEffect(refresco) {
        cargandoDb = true
        errorDb = ""
        Thread {
            val r = MuseoApi.listarUsuarios()
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                cargandoDb = false
                if (r.codigo == MuseoApi.OK) {
                    totalDb = r.total
                    usuariosDb = r.usuarios
                    baseDb = r.base
                    errorDb = ""
                } else {
                    baseDb = ""
                    errorDb = r.mensaje.ifEmpty { "No se pudo consultar la base de datos." }
                }
            }
        }.start()
    }

    if (confirmarCuenta) {
        AlertDialog(
            onDismissRequest = { confirmarCuenta = false },
            icon = { Icon(Icons.Default.DeleteForever, contentDescription = null) },
            title = { Text("Borrar cuenta") },
            text = {
                Text(
                    "Se borrarán el nombre, el correo y la contraseña de esta cuenta. " +
                        "El contador y la bitácora de visitas se conservan. " +
                        "Después podrás registrar una cuenta nueva para otra persona."
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onBorrarCuenta()
                        confirmarCuenta = false
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error,
                        contentColor = MaterialTheme.colorScheme.onError
                    )
                ) { Text("Borrar cuenta") }
            },
            dismissButton = {
                TextButton(onClick = { confirmarCuenta = false }) { Text("Cancelar") }
            }
        )
    }

    if (confirmarBorrado) {
        AlertDialog(
            onDismissRequest = { confirmarBorrado = false },
            title = { Text("Reiniciar contador") },
            text = {
                Text(
                    "Se borrará el contador y toda la bitácora de ingresos. " +
                        "Esta acción no se puede deshacer."
                )
            },
            confirmButton = {
                Button(onClick = {
                    visitas.reiniciar()
                    refresco++
                    confirmarBorrado = false
                }) { Text("Reiniciar") }
            },
            dismissButton = {
                TextButton(onClick = { confirmarBorrado = false }) { Text("Cancelar") }
            }
        )
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                shape = RoundedCornerShape(18.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = nombre.trim().take(1).uppercase().ifEmpty { "A" },
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Cuenta de administrador",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = nombre.ifBlank { "Administrador" },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = correo,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
                        )
                    }
                    IconButton(onClick = onSalir) {
                        Icon(
                            Icons.AutoMirrored.Filled.Logout,
                            contentDescription = "Cerrar sesión de administrador",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                TarjetaDato(
                    titulo = "INGRESOS EN LA APP",
                    valor = total.toString(),
                    detalle = "Bitácora de este teléfono",
                    icono = Icons.Default.People,
                    modifier = Modifier.weight(1f)
                )
                TarjetaDato(
                    titulo = "HOY",
                    valor = hoy.toString(),
                    detalle = "Nuevos ingresos",
                    icono = Icons.Default.Today,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Text(
                text = "Personas registradas en la base de datos",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 4.dp)
            )
            Text(
                text = "Cuentas guardadas en MySQL (museo_virtual). Solo lectura.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    when {
                        cargandoDb -> Text(
                            text = "Consultando la base de datos…",
                            style = MaterialTheme.typography.bodyMedium
                        )

                        errorDb.isNotEmpty() -> {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.ErrorOutline,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.error
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = errorDb,
                                    color = MaterialTheme.colorScheme.error,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Conecta el teléfono por USB y ejecuta " +
                                    "conectar_telefono_usb.bat, o usa una red donde el " +
                                    "teléfono sí pueda ver la computadora.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
                            )
                        }

                        else -> {
                            Text(
                                text = "$totalDb usuario(s) registrado(s)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Servidor: $baseDb",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            }
        }

        if (!cargandoDb && errorDb.isEmpty() && usuariosDb.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        text = "Todavía no hay personas registradas en la base de datos.",
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }

        items(usuariosDb) { u ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = u.nombre.trim().take(1).uppercase().ifEmpty { "?" },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = u.nombre.ifBlank { "(sin nombre)" },
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = u.correo,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )
                        Text(
                            text = u.fecha,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                    Text(
                        text = if (u.rol == "admin") "Admin" else "Usuario",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = { refresco++ },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Actualizar")
                }
                OutlinedButton(
                    onClick = { confirmarBorrado = true },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.DeleteSweep, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Reiniciar")
                }
            }
        }

        item {
            OutlinedButton(
                onClick = { confirmarCuenta = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.error
                )
            ) {
                Icon(Icons.Default.DeleteForever, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Borrar cuenta de administrador")
            }
        }

        item {
            Text(
                text = "Registro de ingresos",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Nombre del visitante · fecha y hora",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
            )
        }

        if (entradas.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        text = "Todavía no hay ingresos registrados.",
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        } else {
            items(entradas) { linea ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        text = linea,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun TarjetaDato(
    titulo: String,
    valor: String,
    detalle: String,
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(
                imageVector = icono,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = titulo,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = valor,
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = detalle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Campo de contraseña con botón para mostrar/ocultar
// ---------------------------------------------------------------------------

@Composable
private fun CampoClave(
    valor: String,
    onValorChange: (String) -> Unit,
    etiqueta: String
) {
    var visible by remember { mutableStateOf(false) }

    OutlinedTextField(
        value = valor,
        onValueChange = onValorChange,
        label = { Text(etiqueta) },
        singleLine = true,
        visualTransformation = if (visible) {
            VisualTransformation.None
        } else {
            PasswordVisualTransformation()
        },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        trailingIcon = {
            IconButton(onClick = { visible = !visible }) {
                Icon(
                    imageVector = if (visible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    contentDescription = if (visible) "Ocultar contraseña" else "Mostrar contraseña"
                )
            }
        },
        modifier = Modifier.fillMaxWidth()
    )
}
