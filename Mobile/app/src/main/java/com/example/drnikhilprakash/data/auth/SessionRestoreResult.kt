package com.example.drnikhilprakash.data.auth

import com.example.drnikhilprakash.data.auth.remote.StaffSessionResponse

sealed interface SessionRestoreResult {
    class Authenticated(
        val bearerToken: String,
        val session: StaffSessionResponse
    ): SessionRestoreResult

    data class SignedOut(
        val message: String? = null
    ): SessionRestoreResult

    data class Retry(
        val message: String
    ): SessionRestoreResult

    data class StorageError(
        val message: String
    ): SessionRestoreResult
}