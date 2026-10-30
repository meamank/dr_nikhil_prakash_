package com.example.drnikhilprakash.core.network

import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

//creates one reusable Retrofit instance

object NetworkClient {
    private const val BASE_URL =
        "https://portal.drnikhilprakash.com/"

    private val json = Json {
        ignoreUnknownKeys = true
    }

    val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }
}