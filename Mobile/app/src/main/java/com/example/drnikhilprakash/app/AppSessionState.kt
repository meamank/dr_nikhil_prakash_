package com.example.drnikhilprakash.app

import com.example.drnikhilprakash.data.auth.remote.StaffUserDetails

sealed interface AppSessionState {

    data object Loading : AppSessionState

    data class SignedOut(
        val message: String? = null,
        val isSigningIn: Boolean = false,
    ) : AppSessionState

    data class SignedIn(
        val user: StaffUserDetails,
        val expiresAt: String,
        val isSigningOut: Boolean = false,
        val logoutMessage: String? = null
    ) : AppSessionState

    data class Retry(
        val message: String,
    ) : AppSessionState

    data class StorageError(
        val message: String,
    ) : AppSessionState
}