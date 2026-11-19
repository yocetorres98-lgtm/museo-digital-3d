package com.museo.guia.compose.nav

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Login : Screen("login")
    data object Register : Screen("register")
    data object Admin : Screen("admin")
    data object InteractiveMap : Screen("map")
    data object Tour3D : Screen("tour")
    data object UserProfile : Screen("profile")
}
