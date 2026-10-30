package com.example.drnikhilprakash.data.auth

import com.example.drnikhilprakash.data.auth.remote.StaffSessionResponse

sealed interface LoginResult{
    class Success (
        val bearerToken: String,
        val session: StaffSessionResponse
    ): LoginResult

    data class Failure(
        val message: String
    ): LoginResult
}