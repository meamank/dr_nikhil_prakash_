package com.example.drnikhilprakash.app

import android.app.Application

class ClinicApplication : Application() {
    val container: AppContainer by lazy {
        AppContainer(this)
    }
}