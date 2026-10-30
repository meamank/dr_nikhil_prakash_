package com.example.drnikhilprakash.app

import android.content.Context
import com.example.drnikhilprakash.core.network.NetworkClient
import com.example.drnikhilprakash.data.auth.AuthRepository
import com.example.drnikhilprakash.data.auth.local.SecureTokenStore
import com.example.drnikhilprakash.data.auth.remote.AuthApi
import com.example.drnikhilprakash.data.dashboard.DashboardRepository
import com.example.drnikhilprakash.data.dashboard.remote.DashboardApi

class AppContainer (context: Context){
    private val tokenStore = SecureTokenStore(
        context.applicationContext
    )

    private val authApi by lazy {
        NetworkClient.retrofit.create(
            AuthApi::class.java
        )
    }

    private val dashboardApi by lazy {
        NetworkClient.retrofit.create(
            DashboardApi::class.java
        )
    }

    val authRepository by lazy {
        AuthRepository(
            api = authApi,
            tokenStore = tokenStore
        )
    }

    val dashboardRepository by lazy {
        DashboardRepository(
            api = dashboardApi,
            tokenStore = tokenStore
        )
    }
}