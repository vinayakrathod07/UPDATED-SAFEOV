package com.example.safeov

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val developerText = findViewById<TextView>(R.id.developerCreditText)

        developerText.animate()
            .alpha(1f)
            .setDuration(1000)
            .start()

        Handler(Looper.getMainLooper()).postDelayed({
            val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
            val isLoggedIn = prefs.getBoolean("is_logged_in", false)
            val isSetupComplete = prefs.getBoolean("setup_complete", false)

            // Local Routing Logic
            val intent = when {
                !isLoggedIn -> Intent(this, LoginActivity::class.java)
                !isSetupComplete -> Intent(this, SetupActivity::class.java)
                else -> Intent(this, MainActivity::class.java)
            }
            
            startActivity(intent)
            finish()
        }, 3000)
    }
}