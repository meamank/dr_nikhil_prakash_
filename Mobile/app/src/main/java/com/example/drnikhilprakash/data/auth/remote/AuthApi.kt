package com.example.drnikhilprakash.data.auth.remote

import kotlinx.serialization.json.JsonObject
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface AuthApi {
    @POST("api/auth/sign-in/username")
    suspend fun signin(
        @Body request: UsernameSignInRequest
    ): Response<Unit>

    @GET("api/session")
    suspend fun getSession(
        @Header("Authorization") authorization: String
    ): Response<StaffSessionResponse>

    @POST("api/auth/sign-out")
    suspend fun signOut(
        @Header("Authorization") authorization: String,
        @Body body: JsonObject
    ): Response<Unit>
}