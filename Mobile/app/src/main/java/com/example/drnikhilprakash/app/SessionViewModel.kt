package com.example.drnikhilprakash.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.drnikhilprakash.data.auth.AuthRepository
import com.example.drnikhilprakash.data.auth.LoginResult
import com.example.drnikhilprakash.data.auth.LogoutResult
import com.example.drnikhilprakash.data.auth.SessionRestoreResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SessionViewModel(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<AppSessionState>(
        AppSessionState.Loading
    )

    val state: StateFlow<AppSessionState> = _state.asStateFlow()

    private var operation: Job? = null

    init {
        restoreSession()
    }

    fun retrySession() {
        when (_state.value) {
            is AppSessionState.Retry,
            is AppSessionState.StorageError -> restoreSession()

            else -> Unit
        }
    }

    fun signIn(username: String, password: String) {
        val current = _state.value as? AppSessionState.SignedOut
            ?: return

        if (current.isSigningIn || operation?.isActive == true) {
            return
        }

        _state.value = AppSessionState.SignedOut(
            isSigningIn = true
        )

        operation = viewModelScope.launch {
            _state.value = when (
                val result = authRepository.signIn(username, password)
            ) {
                is LoginResult.Success -> AppSessionState.SignedIn(
                    user = result.session.user,
                    expiresAt = result.session.session.expiresAt,
                )

                is LoginResult.Failure -> AppSessionState.SignedOut(
                    message = result.message
                )
            }
        }
    }

    fun logout(){
        val current = _state.value as? AppSessionState.SignedIn ?: return

        if (operation?.isActive == true){
            return
        }

        _state.value = current.copy(
            isSigningOut = true,
            logoutMessage = null
        )

        operation = viewModelScope.launch {
            _state.value = when(
                val result = authRepository.logout()
            ){
                is LogoutResult.SignedOut -> AppSessionState.SignedOut()
                is LogoutResult.Retry -> current.copy(
                    isSigningOut = false,
                    logoutMessage = result.message
                )
                is LogoutResult.StorageError -> AppSessionState.StorageError(
                    result.message
                )
            }
        }
    }

    fun resetLocalSession() {
        if (
            _state.value !is AppSessionState.StorageError ||
            operation?.isActive == true
        ) {
            return
        }

        _state.value = AppSessionState.Loading

        operation = viewModelScope.launch {
            _state.value = if (authRepository.resetLocalSession()) {
                AppSessionState.SignedOut(
                    message = "Saved sign-in cleared. Please sign in again."
                )
            } else {
                AppSessionState.StorageError(
                    message = "Unable to clear the saved sign-in. Please retry."
                )
            }
        }
    }

    private fun restoreSession() {
        if (operation?.isActive == true) {
            return
        }

        _state.value = AppSessionState.Loading

        operation = viewModelScope.launch {
            _state.value = when (
                val result = authRepository.restoreSession()
            ) {
                is SessionRestoreResult.Authenticated ->
                    AppSessionState.SignedIn(
                        user = result.session.user,
                        expiresAt = result.session.session.expiresAt,
                    )

                is SessionRestoreResult.SignedOut ->
                    AppSessionState.SignedOut(
                        message = result.message
                    )

                is SessionRestoreResult.Retry ->
                    AppSessionState.Retry(
                        message = result.message
                    )

                is SessionRestoreResult.StorageError ->
                    AppSessionState.StorageError(
                        message = result.message
                    )
            }
        }
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val application = checkNotNull(
                    this[APPLICATION_KEY]
                ) as ClinicApplication

                SessionViewModel(
                    authRepository =
                        application.container.authRepository
                )
            }
        }
    }
}