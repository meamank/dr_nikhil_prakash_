package com.example.drnikhilprakash.data.dashboard

import com.example.drnikhilprakash.data.auth.local.SecureTokenStore
import com.example.drnikhilprakash.data.dashboard.remote.DashboardApi
import kotlinx.serialization.SerializationException
import java.io.IOException
import java.security.GeneralSecurityException

class DashboardRepository (
    private val api: DashboardApi,
    private val tokenStore: SecureTokenStore
){
    suspend fun getSummary(
        period: String,
        clinic: String
    ): DashboardResult{
        val token = try {
            tokenStore.read()
        }catch (_: IOException){
            return DashboardResult.StorageError(
                "Unable to read saved session"
            )
        }catch (_: GeneralSecurityException){
            return DashboardResult.StorageError(
                "Unable to decrypt your saved session"
            )
        }

        if (token == null){
            return DashboardResult.SigninRequired
        }

        return try {
            val response = api.getSummary(
                authorization = "Bearer $token",
                period,
                clinic
            )

            if (response.isSuccessful){
                val summary = response.body()
                    ?: return DashboardResult.Failure(
                        "The server returned an empty dashboard response. Please retry."
                    )

                return DashboardResult.Success(
                    summary = summary
                )
            }

            val status = response.code()
            response.errorBody()?.close()

            when(status){
                401 -> DashboardResult.SigninRequired
                403 -> DashboardResult.Forbidden(
                    "Staff access is required"
                )
                429 -> DashboardResult.Failure(
                    "Too many requests. Please try again shortly."
                )
                else -> DashboardResult.Failure(
                    "Dashboard loading failed."
                )
            }
        }catch (_: IOException){
            DashboardResult.Failure(
                "Unable to connect. Check your connection and retry."
            )
        }catch (_: SerializationException){
            DashboardResult.Failure(
                "The server returned an unexpected response. Please retry."
            )
        }
    }
}