package com.example.drnikhilprakash.data.auth.local

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException
import java.security.GeneralSecurityException
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class SecureTokenStore (
    context: Context,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
){
    private val appContext = context.applicationContext
    private val mutex = Mutex()

    private val tokenFile by lazy {
        AtomicFile(
            File(appContext.noBackupFilesDir, "session_token.bin")
        )
    }

    private val keyStore by lazy {
        KeyStore.getInstance(KEYSTORE_PROVIDER).apply {
            load(null)
        }
    }

    suspend fun save(token: String): Unit = withContext(ioDispatcher){
        mutex.withLock {
            require(token.isNotBlank()){
                "Cannot store an empty token"
            }

            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())

            check(cipher.iv.size == IV_SIZE)

            val encrypted = cipher.doFinal(
                token.toByteArray(Charsets.UTF_8)
            )

            // Format: version byte + IV + authenticated ciphertext.

            val payload =
                byteArrayOf(FORMAT_VERSION) + cipher.iv + encrypted

            val output = tokenFile.startWrite()

            try {
                output.write(payload)
                tokenFile.finishWrite(output)
            } catch (error: Exception){
                tokenFile.failWrite(output)
                throw error
            }

        }

    }

    suspend fun read(): String? = withContext(ioDispatcher){
        mutex.withLock {
            val payload = try {
                tokenFile.openRead().use { it.readBytes() }
            } catch (_: FileNotFoundException){
                return@withLock null
            }

            if (
                payload.size < HEADER_SIZE + TAG_SIZE_BYTES ||
                payload[0] != FORMAT_VERSION
            ){
                throw IOException("Invalid stored session format.")
            }

            val key  = existingKey()
                ?: throw GeneralSecurityException(
                    "The stored session key is unavailable"
                )

            val iv = payload.copyOfRange(1, HEADER_SIZE)

            val encrypted = payload.copyOfRange(
                HEADER_SIZE,
                payload.size
            )
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(
                Cipher.DECRYPT_MODE,
                key,
                GCMParameterSpec(TAG_SIZE_BITS, iv),
            )

            String(cipher.doFinal(encrypted), Charsets.UTF_8)
        }
    }

    suspend fun clear(): Unit = withContext(ioDispatcher) {
        mutex.withLock {
            tokenFile.delete()

            if (tokenFile.baseFile.exists()) {
                throw IOException("Unable to remove the stored session.")
            }
        }
    }

    // Explicit recovery for an unreadable local credential. This does not
    // revoke a server session; it removes this device's file and encryption key.
    suspend fun reset(): Unit = withContext(ioDispatcher) {
        mutex.withLock {
            tokenFile.delete()

            if (tokenFile.baseFile.exists()) {
                throw IOException("Unable to remove the stored session.")
            }

            keyStore.deleteEntry(KEY_ALIAS)
        }
    }

    private fun existingKey(): SecretKey? =
        keyStore.getKey(KEY_ALIAS, null) as? SecretKey

    private fun getOrCreateKey(): SecretKey {
        existingKey()?.let { return it }

        val generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            KEYSTORE_PROVIDER,
        )

        generator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or
                        KeyProperties.PURPOSE_DECRYPT,
            )
                .setKeySize(256)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(
                    KeyProperties.ENCRYPTION_PADDING_NONE
                )
                .setRandomizedEncryptionRequired(true)
                .build()
        )

        return generator.generateKey()
    }

    private companion object {
        const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        const val KEY_ALIAS =
            "com.example.drnikhilprakash.session.v1"

        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val FORMAT_VERSION: Byte = 1
        const val IV_SIZE = 12
        const val HEADER_SIZE = 1 + IV_SIZE
        const val TAG_SIZE_BITS = 128
        const val TAG_SIZE_BYTES = TAG_SIZE_BITS / 8
    }
}