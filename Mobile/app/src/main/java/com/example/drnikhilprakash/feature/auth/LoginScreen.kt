package com.example.drnikhilprakash.feature.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.CircularWavyProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialShapes
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.toShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.graphics.shapes.RoundedPolygon
import com.example.drnikhilprakash.R

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun LoginScreen(
    onSignIn: (String, String) -> Unit,
    onForgotPassword: () -> Unit,
    isSigningIn: Boolean = false,
    message: String? = null
){


    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
    ) {innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .consumeWindowInsets(innerPadding)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(
                space = 16.dp,
            ),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(180.dp)
                    .background(
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        shape = MaterialShapes.Cookie12Sided.toShape()
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    painter = painterResource(R.drawable.dr_logo),
                    contentDescription = "Clinic Logo",
                    tint = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.padding(48.dp)
                )

            }


            Text(
                text = "Dr (Maj) Nikhil Prakash",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,

            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Welcome to Portal",
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.onSurface,
                autoSize = TextAutoSize.StepBased(
                    minFontSize = 28.sp,
                    maxFontSize = 45.sp,
                    stepSize = 1.sp
                ),
                maxLines = 1
            )

            Text(
                text = "Book appointments and access medical records of you and your family.",
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Sign in with your login details",
                modifier = Modifier.align(Alignment.Start),
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface

            )

            LoginForm(
                isSigningIn = isSigningIn,
                onSignIn = onSignIn,
                message = message,
                onForgotPassword = onForgotPassword
            )
        }

    }
}

@Composable
fun LoginForm(
    isSigningIn: Boolean = false,
    onSignIn: (String, String) -> Unit,
    message: String? = null,
    onForgotPassword: () -> Unit,

){
    var username by rememberSaveable { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    var showPassword by remember { mutableStateOf(false)}


    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current

    val canSubmit = username.isNotEmpty() &&
            password.isNotEmpty() && !isSigningIn

    val submit: () -> Unit = {
        if (canSubmit){
            keyboardController?.hide()
            focusManager.clearFocus()
            onSignIn(username, password)
        }
    }
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Username") },
            singleLine = true,
            enabled = !isSigningIn,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.None,
                autoCorrectEnabled = false,
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            ),
            keyboardActions = KeyboardActions(
                onNext = {
                    focusManager.moveFocus(focusDirection = FocusDirection.Down)
                }
            ),
            leadingIcon = {
                Icon(
                    painter = painterResource(R.drawable.person),
                    contentDescription = "Username"
                )
            }
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Password") },
            singleLine = true,
            enabled = !isSigningIn,
            visualTransformation = if (showPassword) {
                VisualTransformation.None
            } else {
                PasswordVisualTransformation()
            },
            leadingIcon = {
                Icon(
                    painterResource(R.drawable.lock),
                    contentDescription = "Password"
                )
            },
            trailingIcon = {
                IconButton(
                    onClick = { showPassword = !showPassword },
                    enabled = !isSigningIn
                ) {
                    if (showPassword) {
                        Icon(
                            painter = painterResource(R.drawable.visibility_off),
                            contentDescription = "password visible",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        Icon(
                            painter = painterResource(R.drawable.visibility),
                            contentDescription = "password visible",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            },
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.None,
                autoCorrectEnabled = false,
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = { submit() }
            )
        )


        if (message != null) {
            Text(
                text = message,
                modifier = Modifier.semantics {
                    liveRegion = LiveRegionMode.Polite
                },
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        TextButton(
            onClick = onForgotPassword,
            modifier = Modifier.align(Alignment.End),
            enabled = !isSigningIn,
        ) {
            Text(
                text = "Forgot password?",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Button(
            onClick = submit,
            modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp),
            enabled = canSubmit,
        ) {
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = if (isSigningIn) "Signing in" else " Sign in",
                style = MaterialTheme.typography.titleLarge
            )
            Spacer(modifier = Modifier.weight(1f))
            if (isSigningIn) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }else{
                Icon(
                    painter = painterResource(R.drawable.arrow_forward),
                    contentDescription = "Sign in",
                )
            }
        }
    }
}