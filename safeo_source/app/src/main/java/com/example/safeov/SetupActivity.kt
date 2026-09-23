package com.example.safeov

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText

class SetupActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_setup)

        val userNameInput = findViewById<TextInputEditText>(R.id.userNameInput)
        val contact1Input = findViewById<TextInputEditText>(R.id.contact1Input)
        val contact2Input = findViewById<TextInputEditText>(R.id.contact2Input)
        val contact3Input = findViewById<TextInputEditText>(R.id.contact3Input)
        val gmailContactInput = findViewById<TextInputEditText>(R.id.gmailContactInput)
        val saveButton = findViewById<MaterialButton>(R.id.saveButton)

        // Pre-fill name if it was saved during registration
        val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
        userNameInput.setText(prefs.getString("user_name", ""))

        saveButton.setOnClickListener {
            val name = userNameInput.text.toString().trim()
            val c1 = contact1Input.text.toString().trim()
            val c2 = contact2Input.text.toString().trim()
            val c3 = contact3Input.text.toString().trim()
            val gmail = gmailContactInput.text.toString().trim()

            if (name.isBlank() || c1.isBlank() || gmail.isBlank()) {
                Toast.makeText(this, "Please provide your name, primary contact, and email.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(gmail).matches()) {
                Toast.makeText(this, "Please enter a valid Gmail address.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            saveLocally(name, c1, c2, c3, gmail)
        }
    }

    private fun saveLocally(name: String, c1: String, c2: String, c3: String, gmail: String) {
        val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("user_name", name)
            putString("contact_1", c1)
            putString("contact_2", c2)
            putString("contact_3", c3)
            putString("gmail_contact", gmail)
            putBoolean("setup_complete", true)
            apply()
        }

        Toast.makeText(this, "Shield Activated Locally!", Toast.LENGTH_LONG).show()
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
