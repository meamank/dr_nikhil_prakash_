package com.example.drnikhilprakash.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import com.example.drnikhilprakash.app.DashboardViewModel
import com.example.drnikhilprakash.feature.main.DashboardScreen

@Composable
fun MainNavigation(
    name: String,
    onLogout: () -> Unit,
    isSigningOut: Boolean = false,
    logoutMessage: String? = null
){
    val backStack = rememberNavBackStack(MainDestination.Dashboard)

    val goback: () -> Unit = {
        if (backStack.size > 1){
            backStack.removeLastOrNull()
        }
    }

    val title = when(backStack.lastOrNull()){
        MainDestination.Dashboard -> "Welcome, ${name.substringBefore(" ")}"
        is MainDestination.Appointments -> "Appointments"
        is MainDestination.PatientDetails -> "Patients Profile"
        else -> "Clinic Portal"
    }

    MainScaffold(
        title = title,
        onLogout = onLogout,
        isSigningOut = isSigningOut,
        logoutMessage = logoutMessage,
        onBack = if (backStack.size > 1 ) goback else null
    ) {
        NavDisplay(
            modifier = Modifier.fillMaxSize()
                .padding(vertical = 16.dp),
            backStack = backStack,
            onBack = goback,
            entryDecorators = listOf(
                rememberSaveableStateHolderNavEntryDecorator(),
                rememberViewModelStoreNavEntryDecorator(),
            ),
            entryProvider = entryProvider{
                entry <MainDestination.Dashboard>{
                    val dashboardViewModel: DashboardViewModel = viewModel(
                        factory = DashboardViewModel.Factory
                    )
                    val state by dashboardViewModel.state.collectAsStateWithLifecycle()
                    DashboardScreen(
                        state = state
                    )
                }
                entry <MainDestination.Appointments>{
                    Column(
                        modifier = Modifier
                            .fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(
                            space = 16.dp,
                            alignment = Alignment.CenterVertically,
                        ),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = "Appointments Preview",
                            style = MaterialTheme.typography.headlineSmall
                        )
                        Button(
                            onClick = {
                                val destination = MainDestination.PatientDetails("DEMO")

                                if (backStack.lastOrNull() != destination){
                                    backStack.add(destination)
                                }
                            }
                        ) {
                            Text("Open demo patient")
                        }
                    }
                }
                entry <MainDestination.PatientDetails>{ destination ->
                    Column(
                        modifier = Modifier.fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Patient ID: ${destination.pid}")
                    }
                }
            }
        )
    }
}

