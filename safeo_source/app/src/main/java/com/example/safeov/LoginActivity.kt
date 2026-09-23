package com.example.safeov

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.safeov.databinding.ActivityLoginBinding

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            val email = binding.emailInput.text.toString().trim().lowercase()
            val password = binding.passwordInput.text.toString().trim()

            if (email.isNotEmpty() && password.isNotEmpty()) {
                val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
                val savedEmail = prefs.getString("local_email", null)
                val savedPassword = prefs.getString("local_password", null)

                if (email == savedEmail && password == savedPassword) {
                    prefs.edit().putBoolean("is_logged_in", true).apply()
                    proceedAfterLogin()
                } else {
                    Toast.makeText(this, "Invalid credentials or User not registered", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun proceedAfterLogin() {
        val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
        val setupComplete = prefs.getBoolean("setup_complete", false)
        
        if (setupComplete) {
            startActivity(Intent(this, MainActivity::class.java))
        } else {
            startActivity(Intent(this, SetupActivity::class.java))
        }
        finish()
    }
}
