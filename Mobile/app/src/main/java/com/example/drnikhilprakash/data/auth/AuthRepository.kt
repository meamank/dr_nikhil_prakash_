package com.example.drnikhilprakash.data.auth

import com.example.drnikhilprakash.data.auth.local.SecureTokenStore
import com.example.drnikhilprakash.data.auth.remote.AuthApi
import com.example.drnikhilprakash.data.auth.remote.UsernameSignInRequest
import java.io.IOException
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.JsonObject
import java.security.GeneralSecurityException

class AuthRepository(
    private val api: AuthApi,
    private val tokenStore: SecureTokenStore
) {

    suspend fun signIn(
        username: String,
        password: String,
    ): LoginResult {
        val cleanUsername = username.trim()

        if (cleanUsername.isEmpty() || password.isEmpty()) {
            return LoginResult.Failure(
                "Enter your username and password."
            )
        }

        return try {
            val loginResponse = api.signin(
                UsernameSignInRequest(
                    username = cleanUsername,
                    password = password,
                )
            )

            if (!loginResponse.isSuccessful) {
                loginResponse.errorBody()?.close()

                return LoginResult.Failure(
                    when (loginResponse.code()) {
                        400, 401 -> "Incorrect username or password."
                        403 -> "Sign-in is not allowed for this account."
                        429 -> "Too many attempts. Try again later."
                        else -> "Unable to sign in. Try again."
                    }
                )
            }

            val token = loginResponse.headers()["set-auth-token"]

            if (token.isNullOrBlank()) {
                return LoginResult.Failure(
                    "The server did not return a signed session token."
                )
            }

            val sessionResponse = api.getSession(
                authorization = "Bearer $token"
            )

            if (!sessionResponse.isSuccessful) {
                sessionResponse.errorBody()?.close()

                if (sessionResponse.code() == 403) {
                    revokeRejectedSession(token)
                }

                return LoginResult.Failure(
                    when (sessionResponse.code()) {
                        401 -> "Your session is invalid. Sign in again."
                        403 -> "This account does not have staff access."
                        429 -> "Too many requests. Try again later."
                        else -> "Unable to verify your session. Try again."
                    }
                )
            }

            val session = sessionResponse.body()
                ?: return LoginResult.Failure(
                    "The server returned an empty session."
                )

            val saved = try {
                tokenStore.save(token)
                true
            } catch (_: IOException) {
                false
            } catch (_: GeneralSecurityException) {
                false
            }

            if (!saved) {
                revokeRejectedSession(token)

                return LoginResult.Failure(
                    "Unable to save your session securely. Please try again."
                )
            }

            LoginResult.Success(
                bearerToken = token,
                session = session,
            )


        } catch (_: IOException) {
            LoginResult.Failure(
                "Unable to connect. Check your connection and try again."
            )
        } catch (_: SerializationException) {
            LoginResult.Failure(
                "The server returned an unexpected response."
            )
        }
    }

    suspend fun logout(): LogoutResult{

        val token = try {
            tokenStore.read()
        }catch (_: IOException){
            return LogoutResult.StorageError(
                "Unable to read your saved session"
            )
        }catch (_: GeneralSecurityException){
            return LogoutResult.StorageError(
                "Unable to decrypt your saved session"
            )
        }

        if (token == null){
           return LogoutResult.SignedOut
        }


        val logoutResponse = try {
            api.signOut(
                authorization = "Bearer $token",
                body = JsonObject(emptyMap())
            )
        }catch (_: IOException){
            return LogoutResult.Retry(
                "Unable to connect. Check your connection and try signing out again."
            )
        }

        logoutResponse.errorBody()?.close()

        if (!logoutResponse.isSuccessful && logoutResponse.code() != 401){
            return LogoutResult.Retry(
                when(logoutResponse.code()){
                    429 -> "Too many requests. Please try again shortly."
                    else -> "Unable to sign out. Please try again."
                }
            )
        }

        return try {
            tokenStore.clear()
            LogoutResult.SignedOut
        }catch (_: IOException){
            LogoutResult.StorageError(
                "Your session has ended, but the saved sign-in couldn't be removed."
            )
        }

    }
    suspend fun restoreSession(): SessionRestoreResult {
        val token = try {
            tokenStore.read()
        } catch (_: IOException) {
            return SessionRestoreResult.StorageError(
                "Unable to read your saved session."
            )
        } catch (_: GeneralSecurityException) {
            return SessionRestoreResult.StorageError(
                "Unable to decrypt your saved session."
            )
        }

        if (token == null) {
            return SessionRestoreResult.SignedOut()
        }

        return try {
            val response = api.getSession(
                authorization = "Bearer $token"
            )

            if (response.isSuccessful) {
                val session = response.body()
                    ?: return SessionRestoreResult.Retry(
                        "The server returned an empty session. Please retry."
                    )

                return SessionRestoreResult.Authenticated(
                    bearerToken = token,
                    session = session,
                )
            }

            val status = response.code()
            response.errorBody()?.close()

            when (status) {
                401, 403 -> {
                    try {
                        tokenStore.clear()
                    } catch (_: IOException) {
                        return SessionRestoreResult.StorageError(
                            "Unable to remove your rejected session."
                        )
                    }

                    if (status == 403) {
                        revokeRejectedSession(token)
                    }

                    SessionRestoreResult.SignedOut(
                        message = if (status == 403) {
                            "This account no longer has staff access."
                        } else {
                            "Your session has expired. Please sign in again."
                        }
                    )
                }

                429 -> SessionRestoreResult.Retry(
                    "Too many requests. Please try again shortly."
                )

                else -> SessionRestoreResult.Retry(
                    "Unable to verify your session. Please retry."
                )
            }
        } catch (_: IOException) {
            SessionRestoreResult.Retry(
                "Unable to connect. Check your connection and retry."
            )
        } catch (_: SerializationException) {
            SessionRestoreResult.Retry(
                "The server returned an unexpected response. Please retry."
            )
        }
    }

    suspend fun resetLocalSession(): Boolean {
        return try {
            tokenStore.reset()
            true
        } catch (_: IOException) {
            false
        } catch (_: GeneralSecurityException) {
            false
        }
    }

    private suspend fun revokeRejectedSession(token: String) {
        try {
            val response = api.signOut(
                authorization = "Bearer $token",
                body = JsonObject(emptyMap()),
            )

            response.errorBody()?.close()
        } catch (_: IOException) {
            // Best effort: network failure can prevent remote revocation.
            // The rejected token is never returned as a successful login.
        }
    }
}