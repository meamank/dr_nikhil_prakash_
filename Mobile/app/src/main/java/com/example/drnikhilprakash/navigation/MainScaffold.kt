package com.example.drnikhilprakash.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialShapes
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.toShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.drnikhilprakash.R

@Composable
fun MainScaffold(
    title: String,
    onLogout: () -> Unit,
    isSigningOut: Boolean = false,
    logoutMessage: String? = null,
    onBack: (() -> Unit)? = null,
    content: @Composable () -> Unit
){
    Scaffold(
        modifier = Modifier
            .fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            CustomTopBar(
                title = title,
                onLogout = onLogout,
                isSigningOut = isSigningOut,
                onBack = onBack
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier.fillMaxSize()
                .padding(innerPadding)
                .consumeWindowInsets(innerPadding)
        ) {
            content()
        }
    }
}

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun CustomTopBar(
    title: String,
    onLogout: () -> Unit,
    isSigningOut: Boolean = false,
    onBack: (() -> Unit)? = null
){
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.background
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp)
                .height(48.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (onBack != null){
                TextButton(
                    onClick = onBack
                ) {
                    Text("Back")
                }
            }

            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge
            )

            Spacer(modifier = Modifier.weight(1f))

            IconButton(
                onClick = onLogout,
                modifier = Modifier.background(
                    shape = MaterialShapes.Cookie4Sided.toShape(
                        startAngle = 30
                    ),
                    color = MaterialTheme.colorScheme.tertiaryContainer
                ),
                enabled = !isSigningOut
            ) {
                Text(
                    text = title.take(1),
                    color = MaterialTheme.colorScheme.onTertiaryContainer
                )
            }
        }
    }
}