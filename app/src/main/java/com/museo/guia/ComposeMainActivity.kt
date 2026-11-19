package com.museo.guia

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.museo.guia.compose.nav.Screen
import com.museo.guia.compose.ui.admin.AdminScreen
import com.museo.guia.compose.ui.auth.AuthScreen
import com.museo.guia.compose.ui.home.HomeScreen
import com.museo.guia.compose.ui.map.InteractiveMapScreen
import com.museo.guia.compose.ui.profile.UserProfileScreen
import com.museo.guia.compose.ui.theme.MuseoTheme
import com.museo.guia.compose.ui.tour.Tour3DScreen

class ComposeMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MuseoTheme {
                MuseoApp()
            }
        }
    }
}

@Composable
fun MuseoApp() {
    val navController = rememberNavController()
    Surface {
        NavHost(navController = navController, startDestination = Screen.Home.route) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToLogin = { navController.navigate(Screen.Login.route) },
                    onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                    onNavigateToAdmin = { navController.navigate(Screen.Admin.route) }
                )
            }
            composable(Screen.Login.route) {
                AuthScreen(
                    inicialRegistro = false,
                    onBack = { navController.popBackStack() },
                    onAuthenticated = {
                        navController.navigate(Screen.InteractiveMap.route) {
                            popUpTo(Screen.Home.route)
                        }
                    }
                )
            }
            composable(Screen.Register.route) {
                AuthScreen(
                    inicialRegistro = true,
                    onBack = { navController.popBackStack() },
                    onAuthenticated = {
                        navController.navigate(Screen.InteractiveMap.route) {
                            popUpTo(Screen.Home.route)
                        }
                    }
                )
            }
            composable(Screen.Admin.route) { AdminScreen(onBack = { navController.popBackStack() }) }
            composable(Screen.InteractiveMap.route) {
                InteractiveMapScreen(
                    onBack = { navController.popBackStack() },
                    onStartTour = { navController.navigate(Screen.Tour3D.route) }
                )
            }
            composable(Screen.Tour3D.route) { Tour3DScreen(onBack = { navController.popBackStack() }) }
            composable(Screen.UserProfile.route) { UserProfileScreen(onBack = { navController.popBackStack() }) }
        }
    }
}
