package com.example.drnikhilprakash.feature.main

import com.example.drnikhilprakash.data.dashboard.remote.DashboardSummaryResponse

sealed interface DashboardUiState {
    data object Loading: DashboardUiState

    data class Content(
        val summary: DashboardSummaryResponse,
        val isRefreshing: Boolean = false,
        val refreshMessage: String? = null
    ): DashboardUiState

    data class Error(
        val message: String
    ): DashboardUiState

    data object SigninRequired: DashboardUiState

    data class Forbidden(
        val message: String
    ): DashboardUiState

    data class StorageError(
        val message: String
    ): DashboardUiState
}