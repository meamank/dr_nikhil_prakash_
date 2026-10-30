package com.example.drnikhilprakash.feature.main

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.SplitButtonDefaults
import androidx.compose.material3.SplitButtonLayout
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TooltipAnchorPosition
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.drnikhilprakash.R
import com.example.drnikhilprakash.data.dashboard.remote.DashboardSummaryResponse
import com.example.drnikhilprakash.ui.common.LoadingScreen
import java.text.SimpleDateFormat
import java.util.Date
import java.util.TimeZone

@Composable
fun DashboardScreen(
    state: DashboardUiState
){
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        when(state){
            is DashboardUiState.Loading -> LoadingScreen()
            is DashboardUiState.Content -> DashboardGroup(summary = state.summary)
            is DashboardUiState.Error -> Text("Error")
            is DashboardUiState.Forbidden -> Text("Forbid")
            is DashboardUiState.StorageError -> Text("Storage")
            is DashboardUiState.SigninRequired -> Text("Signin again")
        }
    }
}

@Composable
fun DashboardGroup(
    summary: DashboardSummaryResponse
){
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            LocationDatePicker()
        }
        item {
            AppointmentDetails(
                summary = summary
            )
        }
        item {
            TodaysAppointment()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LocationDatePicker(){
    var locationChecked by rememberSaveable { mutableStateOf(false) }
    var locationButtonWidth by remember { mutableStateOf(0.dp) }
    var dateButtonWidth by remember { mutableStateOf(0.dp) }
    val density = LocalDensity.current
    var showDatePickerModal by rememberSaveable { mutableStateOf(false)}
    var selectedStartDateMillis by rememberSaveable { mutableStateOf<Long?>(null)}
    var selectedEndDateMillis by rememberSaveable {mutableStateOf<Long?>(null) }

    val locale = LocalConfiguration.current.locales[0]
    val dateFormatter = remember(locale) {
        SimpleDateFormat("dd MMM yy", locale).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
    }

    val startMillis = selectedStartDateMillis
    val endMillis = selectedEndDateMillis

    val dateRangeLabel = if (startMillis != null && endMillis !=  null){
        val start = dateFormatter.format(Date(startMillis))
        val end = dateFormatter.format(Date(endMillis))
        if (start == end ) "$start" else "$start - $end"
    } else {
        "Today"
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
        ) {
            SplitButtonLayout(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight()
                    .onSizeChanged { size ->
                        locationButtonWidth = with(density) { size.width.toDp() }
                    },
                leadingButton = {
                    SplitButtonDefaults.LeadingButton(
                        onClick = {},
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight()
                    ) {
                        Icon(
                            painter = painterResource(R.drawable.location_on_filled),
                            modifier = Modifier.size(SplitButtonDefaults.LeadingIconSize),
                            contentDescription = "clinic location icon"
                        )
                        Spacer(Modifier.size(ButtonDefaults.IconSpacing))

                        Text(
                            text = "Fardo Gola",
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                },
                trailingButton = {
                    val description = "dropdown selector icon"
                    TooltipBox(
                        modifier = Modifier.fillMaxHeight(),
                        positionProvider = TooltipDefaults.rememberTooltipPositionProvider(
                            TooltipAnchorPosition.Above
                        ),
                        tooltip = {
                            PlainTooltip(
                                modifier = Modifier.semantics {
                                    liveRegion = LiveRegionMode.Assertive
                                    paneTitle = description
                                }
                            ) {
                                Text(description)
                            }
                        },
                        state = rememberTooltipState()
                    ) {
                        SplitButtonDefaults.TrailingButton(
                            checked = locationChecked,
                            onCheckedChange = { locationChecked = it },
                            modifier = Modifier
                                .fillMaxHeight()
                                .semantics {
                                    stateDescription =
                                        if (locationChecked) "Expanded" else "Collapsed"
                                    contentDescription = description
                                }
                        ) {
                            val rotation: Float by animateFloatAsState(
                                targetValue = if (locationChecked) 180f else 0f,
                                label = "Dropdown Icon rotation"
                            )
                            Icon(
                                painter = painterResource(R.drawable.keyboard_arrow_down),
                                modifier = Modifier
                                    .size(SplitButtonDefaults.TrailingIconSize)
                                    .graphicsLayer { this.rotationZ = rotation },
                                contentDescription = "Dropdown Icon"
                            )
                        }
                    }
                }
            )
            DropdownMenu(
                expanded = locationChecked,
                onDismissRequest = { locationChecked = false },
                modifier = if (locationButtonWidth > 0.dp) Modifier.width(locationButtonWidth) else Modifier,
                containerColor = MaterialTheme.colorScheme.onPrimaryContainer,
            ) {
                DropdownMenuItem(
                    text = { Text("Fardo Gola") },
                    onClick = { locationChecked = false },
                )
                HorizontalDivider()
                DropdownMenuItem(
                    text = { Text("Juran Chhapra") },
                    onClick = { locationChecked = false }
                )
            }
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
        ) {
            SplitButtonLayout(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight()
                    .onSizeChanged { size ->
                        dateButtonWidth = with(density) { size.width.toDp() }
                    },
                leadingButton = {
                    SplitButtonDefaults.LeadingButton(
                        onClick = {showDatePickerModal = true},
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight()
                    ) {
                        Icon(
                            painter = painterResource(R.drawable.calendar_today),
                            modifier = Modifier.size(SplitButtonDefaults.LeadingIconSize),
                            contentDescription = "calendar icon"
                        )
                        Spacer(Modifier.size(ButtonDefaults.IconSpacing))

                        Text(
                            text = dateRangeLabel,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.width(80.dp)
                        )
                    }
                },
                trailingButton = {
                    val description = "dropdown selector icon"
                    TooltipBox(
                        modifier = Modifier.fillMaxHeight(),
                        positionProvider = TooltipDefaults.rememberTooltipPositionProvider(
                            TooltipAnchorPosition.Above
                        ),
                        tooltip = {
                            PlainTooltip(
                                modifier = Modifier.semantics {
                                    liveRegion = LiveRegionMode.Assertive
                                    paneTitle = description
                                }
                            ) {
                                Text(description)
                            }
                        },
                        state = rememberTooltipState()
                    ) {
                        SplitButtonDefaults.TrailingButton(
                            checked = showDatePickerModal,
                            onCheckedChange = { showDatePickerModal = it },
                            modifier = Modifier
                                .fillMaxHeight()
                                .semantics {
                                    stateDescription =
                                        if (showDatePickerModal) "Expanded" else "Collapsed"
                                    contentDescription = description
                                }
                        ) {
                            val rotation: Float by animateFloatAsState(
                                targetValue = if (showDatePickerModal) 180f else 0f,
                                label = "Dropdown Icon rotation"
                            )
                            Icon(
                                painter = painterResource(R.drawable.keyboard_arrow_down),
                                modifier = Modifier
                                    .size(SplitButtonDefaults.TrailingIconSize)
                                    .graphicsLayer { this.rotationZ = rotation },
                                contentDescription = "Dropdown Icon"
                            )
                        }
                    }
                }
            )
            if (showDatePickerModal){
                DateRangePickerModal(
                    initialStartDateMillis = selectedStartDateMillis,
                    initialEndDateMillis = selectedEndDateMillis,
                    onDateRangeSelected = {range ->
                        selectedStartDateMillis = range.first
                        selectedEndDateMillis = range.second
                    },
                    onDismiss = { showDatePickerModal = false }
                )
            }
        }
    }
}

@Composable
fun AppointmentDetails(
    summary: DashboardSummaryResponse
){
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                MaterialTheme.colorScheme.surfaceContainer,
                MaterialTheme.shapes.medium
            )
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        AppointmentDetailsCard(
            title = "Appointments",
            icon = R.drawable.calendar_today,
            data = summary.totalAppointments.toString(),
            iconColor = MaterialTheme.colorScheme.primary,
            modifier = Modifier.weight(1f)
        )
        AppointmentDetailsCard(
            title = "Paid",
            icon = R.drawable.check_circle_filled,
            data = summary.paidAppointments.toString(),
            iconColor = MaterialTheme.colorScheme.tertiaryContainer,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun AppointmentDetailsCard(
    title: String,
    icon: Int,
    iconColor: Color,
    data: String,
    modifier: Modifier = Modifier
){
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainerLow
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium
                )
                Icon(
                    painter = painterResource(icon),
                    contentDescription = "$title icon",
                    tint = iconColor
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = data,
                style = MaterialTheme.typography.headlineLarge,
            )
        }
    }
}

@Composable
fun DateRangePickerModal(
    onDateRangeSelected: (Pair<Long?, Long?>) -> Unit,
    initialStartDateMillis: Long?,
    initialEndDateMillis: Long?,
    onDismiss: () -> Unit
 ){
    val dateRangePickerState =  rememberDateRangePickerState(
        initialStartDateMillis,
        initialEndDateMillis
    )

    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    val start = dateRangePickerState.selectedStartDateMillis ?: return@TextButton
                    val end = dateRangePickerState.selectedEndDateMillis ?: start
                    onDateRangeSelected(
                        start to end
                    )
                    onDismiss()
                },
                enabled = dateRangePickerState.selectedStartDateMillis != null
            ) {
                Text("OK")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss
            ) {
                Text("Cancel")
            }
        }
    ) {
        DateRangePicker(
            state = dateRangePickerState,
            title = {
                Text(
                    text = "Select date or range"
                )
            },
            showModeToggle = false,
            modifier = Modifier
                .fillMaxWidth()
                .height(500.dp)
                .padding(16.dp)
        )
    }
}

@Composable
fun TodaysAppointment(){
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Today's appointments",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        TextButton(
            onClick = {},
            contentPadding = PaddingValues(
                start = 12.dp,
                end = 0.dp,
                top = 8.dp,
                bottom = 8.dp
            )
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "View all"
                )
                Icon(
                    painter = painterResource(R.drawable.chevron_forward),
                    contentDescription = "view all icon"
                )
            }
        }
    }
}