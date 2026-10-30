package com.example.drnikhilprakash.data.dashboard

import com.example.drnikhilprakash.data.dashboard.remote.DashboardSummaryResponse

sealed interface DashboardResult {
    data class Success(
        val summary: DashboardSummaryResponse
    ): DashboardResult

    data object SigninRequired: DashboardResult

    data class Forbidden(
        val message: String
    ): DashboardResult

    data class Failure(
        val message: String
    ): DashboardResult

    data class StorageError(
        val message: String
    ): DashboardResult
}