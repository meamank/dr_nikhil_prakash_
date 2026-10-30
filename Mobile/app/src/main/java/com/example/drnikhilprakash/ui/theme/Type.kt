package com.example.drnikhilprakash.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private fun clinicText(
    size: Int,
    height: Int,
    weight: FontWeight = FontWeight.Normal,
    spacing: Float = 0f,
) = TextStyle(
    fontFamily = FontFamily.SansSerif,
    fontWeight = weight,
    fontSize = size.sp,
    lineHeight = height.sp,
    letterSpacing = spacing.sp,
)

val ClinicTypography = Typography(
    displayLarge = clinicText(57, 64, FontWeight.Bold, -1.5f),
    displayMedium = clinicText(45, 52, FontWeight.Bold, -1f),
    displaySmall = clinicText(36, 44, FontWeight.Bold, -0.5f),

    headlineLarge = clinicText(32, 40, FontWeight.Bold),
    headlineMedium = clinicText(28, 36, FontWeight.SemiBold),
    headlineSmall = clinicText(24, 32, FontWeight.SemiBold),

    titleLarge = clinicText(22, 28, FontWeight.SemiBold),
    titleMedium = clinicText(16, 24, FontWeight.SemiBold, 0.15f),
    titleSmall = clinicText(14, 20, FontWeight.SemiBold, 0.1f),

    bodyLarge = clinicText(16, 24, spacing = 0.15f),
    bodyMedium = clinicText(14, 20, spacing = 0.25f),
    bodySmall = clinicText(12, 16, spacing = 0.4f),

    labelLarge = clinicText(14, 20, FontWeight.SemiBold, 0.1f),
    labelMedium = clinicText(12, 16, FontWeight.SemiBold, 0.5f),
    labelSmall = clinicText(11, 16, FontWeight.SemiBold, 0.5f),
)