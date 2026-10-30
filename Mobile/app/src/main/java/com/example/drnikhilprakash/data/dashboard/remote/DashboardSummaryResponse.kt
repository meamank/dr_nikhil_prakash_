package com.example.drnikhilprakash.data.dashboard.remote

import kotlinx.serialization.Serializable

@Serializable
data class DashboardSummaryResponse(
    val totalRevenue: Long,
    val totalAppointments: Long,
    val paidAppointments: Long,
    val totalPatients: Long
)