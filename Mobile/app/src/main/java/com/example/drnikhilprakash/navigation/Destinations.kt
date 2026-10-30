package com.example.drnikhilprakash.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
sealed interface AuthDestination: NavKey{

    @Serializable
    data object Login: AuthDestination
    @Serializable
    data object ForgotPassword: AuthDestination
}

@Serializable
sealed interface MainDestination: NavKey{
    @Serializable
    data object Dashboard: MainDestination

    @Serializable
    data object Appointments: MainDestination

    @Serializable
    data class PatientDetails(
        val pid: String
    ): MainDestination
}