package com.museo.guia.compose.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val CafeProfundo = Color(0xFF241A12)
private val Gold = Color(0xFFE2B04A)
private val Cream = Color(0xFFF5EAD6)

private val ColorScheme = lightColorScheme(
    primary = Gold,
    onPrimary = CafeProfundo,
    background = CafeProfundo,
    onBackground = Cream,
    surface = Color(0xFF3A2A1D),
    onSurface = Cream,
    error = Color(0xFFE57373),
    onError = CafeProfundo
)

@Composable
fun MuseoTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ColorScheme,
        content = content
    )
}