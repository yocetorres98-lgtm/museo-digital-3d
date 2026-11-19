package com.museo.guia.compose.ui.map

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ViewInAr
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.museo.guia.R
import com.museo.guia.compose.ui.theme.MuseoTheme

private data class Region(val nombre: String, val categoria: String, val x: Float, val y: Float)

private val regiones = listOf(
    Region("Chalco", "Pueblos", 0.45f, 0.07f),
    Region("Tlalmanalco", "Sitios históricos", 0.33f, 0.14f),
    Region("Amecameca", "Atractivos turísticos", 0.61f, 0.16f),
    Region("Cocotitla", "Pueblos", 0.24f, 0.30f),
    Region("Ayapango", "Cultivos", 0.70f, 0.28f),
    Region("Tepetlixpa", "Cultivos", 0.40f, 0.44f),
    Region("Tenango del Aire", "Atractivos turísticos", 0.16f, 0.40f),
    Region("Atlautla", "Atractivos turísticos", 0.75f, 0.48f),
    Region("Ozumba", "Cultivos", 0.52f, 0.60f),
    Region("Temamatla", "Pueblos", 0.31f, 0.61f),
    Region("San Miguel Nepantla", "Sitios históricos", 0.66f, 0.40f),
    Region("Ecatzingo de Hidalgo", "Atractivos turísticos", 0.54f, 0.80f)
)

private val filtros = listOf("Pueblos", "Cultivos", "Sitios históricos", "Atractivos turísticos")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InteractiveMapScreen(onBack: () -> Unit, onStartTour: () -> Unit) {
    MuseoTheme {
        var zoom by remember { mutableFloatStateOf(1f) }
        var seleccionada by remember { mutableStateOf<Region?>(null) }
        var activos by remember { mutableStateOf(filtros.toSet()) }

        Scaffold(topBar = {
            TopAppBar(
                title = { Text("Mapa interactivo") },
                navigationIcon = { TextButton(onClick = onBack) { Text("Atrás") } }
            )
        }) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                    val w = maxWidth
                    val h = maxHeight
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .graphicsLayer(scaleX = zoom, scaleY = zoom)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.mapa_region),
                            contentDescription = "Mapa de la región",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.FillBounds
                        )
                        regiones
                            .filter { it.categoria in activos }
                            .forEach { r ->
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = r.nombre,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier
                                        .offset(x = w * r.x - 12.dp, y = h * r.y - 24.dp)
                                        .size(24.dp)
                                        .clickable { seleccionada = r }
                                )
                            }
                    }
                }

                Column(modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)) {
                    SmallFloatingActionButton(onClick = { if (zoom < 3f) zoom += 0.25f }) {
                        Icon(Icons.Default.Add, contentDescription = "Acercar")
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    SmallFloatingActionButton(onClick = { if (zoom > 0.75f) zoom -= 0.25f }) {
                        Icon(Icons.Default.Remove, contentDescription = "Alejar")
                    }
                }

                Card(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp)
                        .fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Button(
                            onClick = onStartTour,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                        ) {
                            Icon(Icons.Default.ViewInAr, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Iniciar recorrido 3D")
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Filtros", style = MaterialTheme.typography.titleSmall)
                        filtros.forEach { f ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Checkbox(
                                    checked = f in activos,
                                    onCheckedChange = { c ->
                                        activos = if (c) activos + f else activos - f
                                    }
                                )
                                Text(f)
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        val info = seleccionada
                        Text(
                            text = if (info != null)
                                info.nombre + " · " + info.categoria
                            else
                                "Toca un pin para ver su información",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
    }
}
