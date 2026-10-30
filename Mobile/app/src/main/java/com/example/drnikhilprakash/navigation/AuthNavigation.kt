package com.example.drnikhilprakash.navigation

import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.drnikhilprakash.app.AppSessionState
import com.example.drnikhilprakash.feature.auth.ForgotPasswordScreen
import com.example.drnikhilprakash.feature.auth.LoginScreen

@Composable
fun AuthNavigation(
    state: AppSessionState.SignedOut,
    onSignIn: (String, String) -> Unit
){
    val backStack = rememberNavBackStack(AuthDestination.Login)

    val goBack: () -> Unit = {
        if (backStack.size > 1){
            backStack.removeLastOrNull()
        }
    }

    NavDisplay(
        backStack = backStack,
        onBack = goBack,
        entryProvider = entryProvider {
            entry <AuthDestination.Login>{
                LoginScreen(
                    isSigningIn = state.isSigningIn,
                    message = state.message,
                    onSignIn = onSignIn,
                    onForgotPassword = {
                        if (
                            !state.isSigningIn &&
                            backStack.lastOrNull() != AuthDestination.ForgotPassword){
                            backStack.add(AuthDestination.ForgotPassword)
                        }
                    },

                )

            }
            entry <AuthDestination.ForgotPassword>{
                ForgotPasswordScreen(
                    onBack = goBack
                )
            }
        }
    )
}