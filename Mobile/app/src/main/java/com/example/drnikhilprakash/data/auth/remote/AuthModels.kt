package com.example.drnikhilprakash.data.auth.remote

import kotlinx.serialization.Serializable

@Serializable
data class UsernameSignInRequest (
    val username: String,
    val password: String,

)

@Serializable
data class StaffSessionResponse(
    val user: StaffUserDetails,
    val session: SessionDetails
)

@Serializable
data class StaffUserDetails(
    val id: String,
    val name: String,
    val role: String,
    val isFirstLogin: Boolean,
)

@Serializable
data class SessionDetails(
    val expiresAt: String,
)