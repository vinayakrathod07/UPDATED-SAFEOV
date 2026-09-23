package com.example.safeov

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.safeov.databinding.ActivityRegisterBinding

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnRegister.setOnClickListener {
            val name = binding.nameInput.text.toString().trim()
            // Normalize email to lowercase so login isn't broken by case differences
            // (e.g. "John@Gmail.com" at registration vs "john@gmail.com" at login).
            val email = binding.emailInput.text.toString().trim().lowercase()
            val password = binding.passwordInput.text.toString().trim()

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                Toast.makeText(this, "Please enter a valid email address", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (password.length < 6) {
                Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Fully Local Registration
            val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
            prefs.edit().apply {
                putString("user_name", name)
                putString("local_email", email)
                putString("local_password", password)
                putBoolean("is_logged_in", true)
                putBoolean("setup_complete", false)
                apply()
            }
            
            Toast.makeText(this, "Welcome, $name!", Toast.LENGTH_SHORT).show()
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
        }

        binding.btnGoToLogin.setOnClickListener {
            finish()
        }
    }
}
