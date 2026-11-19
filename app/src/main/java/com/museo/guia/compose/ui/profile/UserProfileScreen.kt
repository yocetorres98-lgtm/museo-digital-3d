package com.museo.guia.compose.ui.profile

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.museo.guia.compose.ui.theme.MuseoTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserProfileScreen(onBack: () -> Unit) {
    MuseoTheme {
        var expanded by remember { mutableStateOf(false) }
        Scaffold(topBar = {
            TopAppBar(
                title = { Text("Perfil") },
                navigationIcon = { TextButton(onClick = onBack) { Text("Atrás") } },
                actions = {
                    Box {
                        IconButton(onClick = { expanded = true }) { Icon(Icons.Default.MoreVert, contentDescription = "Menu") }
                        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                            DropdownMenuItem(text = { Text("Mi perfil") }, onClick = { expanded = false })
                            DropdownMenuItem(text = { Text("Configuracion") }, onClick = { expanded = false })
                            DropdownMenuItem(text = { Text("Cerrar sesion") }, onClick = { expanded = false })
                        }
                    }
                }
            )
        }) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                Text("Usuario activo: Ana Lopez", style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}