package com.example.drnikhilprakash.data.auth

sealed interface LogoutResult {
    data object SignedOut: LogoutResult

    data class Retry(
        val message: String
    ): LogoutResult

    data class StorageError(
        val message: String
    ): LogoutResult
}