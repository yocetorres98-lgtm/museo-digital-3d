package com.museo.guia.compose.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.museo.guia.MuseoApi
import com.museo.guia.Sesion
import com.museo.guia.compose.ui.theme.MuseoTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    inicialRegistro: Boolean = false,
    onBack: () -> Unit,
    onAuthenticated: () -> Unit
) {
    MuseoTheme {
        val context = LocalContext.current
        val sesion = remember { Sesion(context) }

        var modoRegistro by remember { mutableStateOf(inicialRegistro) }
        var nombre by remember { mutableStateOf("") }
        var correo by remember { mutableStateOf("") }
        var clave by remember { mutableStateOf("") }
        var error by remember { mutableStateOf("") }
        var bienvenida by remember { mutableStateOf(false) }
        var cargando by remember { mutableStateOf(false) }

        if (bienvenida) {
            AlertDialog(
                onDismissRequest = { },
                title = { Text("¡Bienvenido al Museo 3D!") },
                text = {
                    Text("Hola " + sesion.nombre + ", ya formas parte del Museo Digital 3D. Te llevamos al mapa interactivo.")
                },
                confirmButton = {
                    Button(onClick = {
                        bienvenida = false
                        onAuthenticated()
                    }) { Text("Ir al mapa interactivo") }
                }
            )
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(if (modoRegistro) "Registrarse" else "Iniciar sesión") },
                    navigationIcon = { TextButton(onClick = onBack) { Text("Atrás") } }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = if (modoRegistro)
                        "Crea tu cuenta para guardar tu recorrido en el museo."
                    else
                        "Accede con tu correo y contraseña para continuar.",
                    style = MaterialTheme.typography.bodyMedium
                )

                if (modoRegistro) {
                    OutlinedTextField(
                        value = nombre,
                        onValueChange = { nombre = it },
                        label = { Text("Nombre") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                OutlinedTextField(
                    value = correo,
                    onValueChange = { correo = it },
                    label = { Text("Correo") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = clave,
                    onValueChange = { clave = it },
                    label = { Text("Contraseña") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth()
                )

                if (error.isNotEmpty()) {
                    Text(error, color = MaterialTheme.colorScheme.error)
                }

                Button(
                    onClick = {
                        error = ""
                        cargando = true
                        if (correo.isBlank() || clave.isBlank() || (modoRegistro && nombre.isBlank())) {
                            error = "Completa todos los campos."
                            cargando = false
                            return@Button
                        }
                        if (modoRegistro && clave.length != 8) {
                            error = "La contraseña debe tener exactamente 8 caracteres."
                            cargando = false
                            return@Button
                        }
                        Thread {
                            val r = if (modoRegistro) {
                                MuseoApi.registrar(nombre.trim(), correo.trim(), clave)
                            } else {
                                MuseoApi.iniciarSesion(correo.trim(), clave)
                            }
                            (context as? android.app.Activity)?.runOnUiThread {
                                cargando = false
                                when {
                                    r.codigo == MuseoApi.OK -> {
                                        if (modoRegistro) {
                                            sesion.registrar(nombre.trim(), correo.trim(), clave)
                                        } else {
                                            sesion.guardarToken(r.token)
                                            sesion.registrar(nombre.trim().ifBlank { sesion.nombre }, correo.trim(), clave)
                                        }
                                        bienvenida = true
                                    }
                                    r.codigo == MuseoApi.ERROR_YA_EXISTE ->
                                        error = "Ese correo ya está registrado."
                                    r.codigo == MuseoApi.ERROR_CREDENCIALES ->
                                        error = "Correo o contraseña incorrectos."
                                    r.codigo == MuseoApi.ERROR_RED ->
                                        // sin servidor: usa almacenamiento local
                                        if (modoRegistro) {
                                            if (sesion.existeCorreo(correo)) {
                                                error = "Ese correo ya está registrado."
                                            } else {
                                                sesion.registrar(nombre.trim(), correo.trim(), clave)
                                                bienvenida = true
                                            }
                                        } else if (sesion.validar(correo, clave)) {
                                            bienvenida = true
                                        } else {
                                            error = "Correo o contraseña incorrectos."
                                        }
                                    else ->
                                        error = r.mensaje.ifEmpty { "Error del servidor." }
                                }
                            }
                        }.start()
                    },
                    enabled = !cargando,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(if (cargando) "Un momento…" else if (modoRegistro) "Registrarme" else "Ingresar")
                }

                TextButton(
                    onClick = {
                        modoRegistro = !modoRegistro
                        error = ""
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        if (modoRegistro)
                            "¿Ya tienes cuenta? Inicia sesión"
                        else
                            "¿No tienes cuenta? Regístrate"
                    )
                }
            }
        }
    }
}
