package com.example.drnikhilprakash.data.dashboard.remote

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

interface DashboardApi {
    @GET("api/booking/dashboard-summary")
    suspend fun getSummary(
        @Header("Authorization") authorization: String,
        @Query("period") period: String,
        @Query("clinic") clinic: String
    ): Response<DashboardSummaryResponse>
}