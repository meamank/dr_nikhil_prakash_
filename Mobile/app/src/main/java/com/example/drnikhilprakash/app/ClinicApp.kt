package com.example.drnikhilprakash.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.drnikhilprakash.feature.auth.LoginScreen
import com.example.drnikhilprakash.feature.auth.SessionStatusScreen
import com.example.drnikhilprakash.navigation.AuthNavigation
import com.example.drnikhilprakash.navigation.MainNavigation

@Composable
fun ClinicApp(
    sessionViewModel: SessionViewModel = viewModel(
        factory = SessionViewModel.Factory
    )
){
    val state by sessionViewModel.state.collectAsStateWithLifecycle()

    ClinicAppContent(
        state = state,
        onSignIn = sessionViewModel::signIn,
        onRetrySession = sessionViewModel::retrySession,
        onResetSavedSession = sessionViewModel::resetLocalSession,
        onLogout = sessionViewModel::logout
    )
}

@Composable
fun ClinicAppContent(
    state: AppSessionState,
    onSignIn: (String, String) -> Unit,
    onRetrySession: () -> Unit,
    onResetSavedSession: () -> Unit,
    onLogout: () -> Unit
){
    when(state){
        AppSessionState.Loading -> SessionStatusScreen(
            title = "Opening Clinic Portal",
            message = "Please wait",
            isLoading = true
        )
        is AppSessionState.SignedOut -> key("auth") {
            AuthNavigation(
                state = state,
                onSignIn = onSignIn
            )
        }

        is AppSessionState.SignedIn -> key("main", state.user.id) {
            MainNavigation(
                name = state.user.name,
                onLogout = onLogout,
                isSigningOut = state.isSigningOut,
                logoutMessage = state.logoutMessage
            )
        }

        is AppSessionState.Retry -> SessionStatusScreen(
            title = "Unable to check your session",
            message = state.message,
            onRetry = onRetrySession,
        )

        is AppSessionState.StorageError -> SessionStatusScreen(
            title = "Saved sign-in unavailable",
            message = state.message +
                    "\nIf retry does not help, clear this device’s saved sign-in and sign in again.",
            onRetry = onRetrySession,
            onReset = onResetSavedSession,
        )
    }
}