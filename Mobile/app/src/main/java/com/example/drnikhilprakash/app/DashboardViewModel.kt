package com.example.drnikhilprakash.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.drnikhilprakash.data.dashboard.DashboardRepository
import com.example.drnikhilprakash.data.dashboard.DashboardResult
import com.example.drnikhilprakash.feature.main.DashboardUiState
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class DashboardViewModel(
    private val dashboardRepository: DashboardRepository
): ViewModel(){

    private val _state = MutableStateFlow<DashboardUiState>(DashboardUiState.Loading)

    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    private var operation: Job? = null

    init {
        loadSummary()
    }

    fun loadSummary(){

        if (operation?.isActive == true) return

        val previousContent = _state.value as? DashboardUiState.Content

        _state.value = previousContent?.copy(
            isRefreshing = true,
            refreshMessage = null
        ) ?: DashboardUiState.Loading

        operation = viewModelScope.launch {
            _state.value = when(
                val result = dashboardRepository.getSummary(
                    period = "1d",
                    clinic = "bhagwanpur"
                )
            ){
                is DashboardResult.Success -> DashboardUiState.Content(
                    summary = result.summary
                )

                is DashboardResult.SigninRequired -> DashboardUiState.SigninRequired

                is DashboardResult.Forbidden -> DashboardUiState.Forbidden(
                    result.message
                )

                is DashboardResult.Failure -> previousContent?.copy(
                    isRefreshing = false,
                    refreshMessage = result.message
                )
                    ?: DashboardUiState.Error(
                        result.message
                    )
                is DashboardResult.StorageError -> DashboardUiState.StorageError(
                    result.message
                )
            }
        }
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val application = checkNotNull(this[APPLICATION_KEY]) as ClinicApplication

                DashboardViewModel(
                    dashboardRepository = (
                        application.container.dashboardRepository
                    )
                )
            }
        }
    }

}