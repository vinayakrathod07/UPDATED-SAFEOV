package com.example.safeov

import android.Manifest
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Geocoder
import android.location.Location
import android.media.MediaPlayer
import android.net.Uri
import android.os.*
import android.provider.MediaStore
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.telephony.SmsManager
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.safeov.databinding.LayoutAccidentDialogBinding
import com.google.ai.client.generativeai.Chat
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.sqrt

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener, SensorEventListener {

    private lateinit var statusText: TextView
    private lateinit var sosButton: FrameLayout
    private lateinit var botCard: View
    private lateinit var botResponseText: TextView
    private lateinit var viewFinder: PreviewView
    private lateinit var liveIndicator: LinearLayout
    private lateinit var liveDot: View
    private lateinit var overlay: View
    private lateinit var settingsButton: ImageView
    
    private lateinit var btnFakeCall: LinearLayout
    private lateinit var btnSiren: LinearLayout
    private lateinit var btnShield: LinearLayout
    private var mediaPlayer: MediaPlayer? = null

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var tts: TextToSpeech? = null
    private var speechRecognizer: SpeechRecognizer? = null
    
    private var videoCapture: VideoCapture<Recorder>? = null
    private var recording: Recording? = null

    private lateinit var generativeModel: GenerativeModel
    private var chatSession: Chat? = null
    private val GEMINI_API_KEY = "AIzaSyBcIHMaZpLgiMVEQFvDMXSzqs-2_6pDOcg"

    private var tapCount = 0
    private var lastTapTime: Long = 0
    private val tapTimeout: Long = 1000
    private val handler = Handler(Looper.getMainLooper())
    private var isLongPressing = false
    private var isSosActive = false

    // Accident Detection
    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    private var isAccidentDetected = false
    private var alertPlayer: MediaPlayer? = null

    private val longPressRunnable = Runnable {
        if (isLongPressing) {
            if (isSosActive) deactivateSOS() else activateSOS("3-Second Hold")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        generativeModel = GenerativeModel(
            modelName = "gemini-1.5-flash",
            apiKey = GEMINI_API_KEY,
            systemInstruction = content {
                text("You are 'SafeOV Elite', an advanced AI safety companion. Respond in Hindi (using Devanagari script). Provide calm, direct safety instructions.")
            }
        )
        chatSession = generativeModel.startChat()

        statusText = findViewById(R.id.statusText)
        sosButton = findViewById(R.id.sosButtonContainer)
        botCard = findViewById(R.id.botCard)
        botResponseText = findViewById(R.id.botResponseText)
        viewFinder = findViewById(R.id.viewFinder)
        liveIndicator = findViewById(R.id.liveIndicator)
        liveDot = findViewById(R.id.liveDot)
        overlay = findViewById(R.id.overlay)
        settingsButton = findViewById(R.id.settingsButton)
        
        btnFakeCall = findViewById(R.id.btnFakeCall)
        btnSiren = findViewById(R.id.btnSiren)
        btnShield = findViewById(R.id.btnShield)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        tts = TextToSpeech(this, this)
        
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        setupSpeechRecognizer()
        setupAdditionalIntents()
        checkAndRequestPermissions()
        startCamera()
        setupSOSButton()
        
        val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
        val name = prefs.getString("user_name", "User") ?: "User"
        statusText.text = "WELCOME, ${name.uppercase()} - SYSTEM ARMED"

        settingsButton.setOnClickListener {
            startActivity(Intent(this, SetupActivity::class.java))
        }
        
        settingsButton.setOnLongClickListener {
            showLogoutDialog()
            true
        }

        handleIntent(intent)
    }

    private fun showLogoutDialog() {
        AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to deactivate your shield and logout?")
            .setPositiveButton("Logout") { _, _ ->
                val prefs = getSharedPreferences("SafeOV_Prefs", MODE_PRIVATE)
                prefs.edit().putBoolean("is_logged_in", false).apply()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent?.getBooleanExtra("TRIGGER_ACCIDENT", false) == true) {
            triggerAccidentResponse()
        }
    }

    private fun setupAdditionalIntents() {
        btnFakeCall.setOnClickListener {
            Toast.makeText(this, "Simulating Urgent Call...", Toast.LENGTH_SHORT).show()
        }
        btnSiren.setOnClickListener { toggleSiren() }
        btnShield.setOnClickListener {
            val status = if (isSosActive) "SOS ACTIVE - LOCAL SHIELD" else "SHIELD FULLY ARMED"
            Toast.makeText(this, status, Toast.LENGTH_SHORT).show()
        }
    }

    private fun toggleSiren() {
        if (mediaPlayer?.isPlaying == true) {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
            Toast.makeText(this, "Siren Stopped", Toast.LENGTH_SHORT).show()
        } else {
            mediaPlayer = MediaPlayer.create(this, android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI)
            mediaPlayer?.isLooping = true
            mediaPlayer?.start()
            Toast.makeText(this, "Siren Active", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
            speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) { botResponseText.text = "सुन रहा हूँ..." }
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onError(error: Int) { if (isSosActive) startListening() }
                override fun onResults(results: Bundle?) {
                    val data = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val userSpeech = data?.get(0) ?: ""
                    if (userSpeech.isNotEmpty()) processUserSpeech(userSpeech) else if (isSosActive) startListening()
                }
                override fun onPartialResults(partialResults: Bundle?) {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }
    }

    private fun startListening() {
        if (!isSosActive) return
        handler.post {
            try {
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                }
                speechRecognizer?.startListening(intent)
            } catch (e: Exception) { Log.e("SafeOV", "Speech error: ${e.message}") }
        }
    }

    private fun processUserSpeech(text: String) {
        if (text.lowercase(Locale.ROOT).contains("help") || text.contains("मदद")) {
            getCurrentLocationAndGuide()
            return
        }
        lifecycleScope.launch {
            try {
                botResponseText.text = "विश्लेषण कर रहा हूँ..."
                val response = withContext(Dispatchers.IO) { chatSession?.sendMessage(text) }
                val aiText = response?.text ?: "मैं यहाँ हूँ।"
                botResponseText.text = aiText
                speak(aiText)
            } catch (e: Exception) { if (isSosActive) startListening() }
        }
    }

    private fun getCurrentLocationAndGuide() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null).addOnSuccessListener { location ->
                location?.let { getAiGuidance(it) } ?: run { speak("स्थान खोजने में त्रुटि।") }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.CAMERA,
            Manifest.permission.SEND_SMS,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CALL_PHONE
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        
        val requestLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { results ->
            if (results[Manifest.permission.CAMERA] == true) startCamera()
            val serviceIntent = Intent(this, SafetyService::class.java)
            ContextCompat.startForegroundService(this, serviceIntent)
        }
        requestLauncher.launch(permissions.toTypedArray())
    }

    private fun startCamera() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) return
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also { it.setSurfaceProvider(viewFinder.surfaceProvider) }
                val recorder = Recorder.Builder().setQualitySelector(QualitySelector.from(Quality.HIGHEST)).build()
                videoCapture = VideoCapture.withOutput(recorder)
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, videoCapture)
            } catch (e: Exception) { Log.e("SafeOV", "Camera error: ${e.message}") }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startRecording() {
        if (!isSosActive) return
        val videoCapture = this.videoCapture ?: return
        val name = "SafeOV_Elite_" + SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(System.currentTimeMillis())
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, name)
            put(MediaStore.MediaColumns.MIME_TYPE, "video/mp4")
            if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/SafeOV")
        }
        val outputOptions = MediaStoreOutputOptions.Builder(contentResolver, MediaStore.Video.Media.EXTERNAL_CONTENT_URI).setContentValues(contentValues).build()

        recording = videoCapture.output.prepareRecording(this, outputOptions)
            .withAudioEnabled()
            .start(ContextCompat.getMainExecutor(this)) { recordEvent ->
                if (recordEvent is VideoRecordEvent.Finalize) {
                    if (!recordEvent.hasError()) notifyEvidenceSaved(recordEvent.outputResults.outputUri)
                    if (isSosActive) handler.postDelayed({ startRecording() }, 1000)
                }
            }
        handler.postDelayed({ if (isSosActive) recording?.stop() }, 60000)
    }

    private fun notifyEvidenceSaved(uri: Uri) {
        sendEmergencySmsToAll("CRITICAL! SOS Active. Evidence recording started on my device.")
    }

    private fun setupSOSButton() {
        sosButton.setOnTouchListener { v, event ->
            if (event.action == MotionEvent.ACTION_DOWN) {
                isLongPressing = true
                handler.postDelayed(longPressRunnable, 3000)
                val currentTime = System.currentTimeMillis()
                if (currentTime - lastTapTime < tapTimeout) tapCount++ else tapCount = 1
                lastTapTime = currentTime
                if (tapCount == 3) {
                    handler.removeCallbacks(longPressRunnable)
                    if (isSosActive) deactivateSOS() else activateSOS("3 Taps")
                    tapCount = 0
                }
            } else if (event.action == MotionEvent.ACTION_UP || event.action == MotionEvent.ACTION_CANCEL) {
                isLongPressing = false
                handler.removeCallbacks(longPressRunnable)
                v.performClick()
            }
            true
        }
    }

    private fun activateSOS(trigger: String) {
        if (isSosActive) return
        isSosActive = true
        statusText.text = "CRITICAL: SOS ACTIVE"
        statusText.setTextColor(Color.RED)
        botCard.visibility = View.VISIBLE
        viewFinder.alpha = 1.0f
        overlay.alpha = 0.1f
        liveIndicator.visibility = View.VISIBLE
        
        val anim = AlphaAnimation(1.0f, 0.2f).apply {
            duration = 400
            repeatMode = Animation.REVERSE
            repeatCount = Animation.INFINITE
        }
        liveDot.startAnimation(anim)
        
        speak("एसओएस सक्रिय हो गया है। साक्ष्य सहेजना शुरू कर दिया गया है।")
        startRecording()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null).addOnSuccessListener { location ->
                location?.let {
                    val locUrl = "https://www.google.com/maps?q=${it.latitude},${it.longitude}"
                    sendEmergencySmsToAll("CRITICAL! I am in danger. GPS: $locUrl")
                    getAiGuidance(it)
                }
            }
        }
    }

    private fun deactivateSOS() {
        if (!isSosActive) return
        isSosActive = false
        recording?.stop()
        val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
        val name = prefs.getString("user_name", "User") ?: "User"
        statusText.text = "WELCOME, ${name.uppercase()} - SYSTEM ARMED"
        statusText.setTextColor(Color.parseColor("#00E676"))
        botCard.visibility = View.GONE
        liveIndicator.visibility = View.GONE
        liveDot.clearAnimation()
        viewFinder.alpha = 0.25f
        overlay.alpha = 1.0f
        speak("एसओएस बंद कर दिया गया है।")
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
        speechRecognizer?.stopListening()
    }

    private fun getAiGuidance(location: Location?) {
        lifecycleScope.launch {
            val address = withContext(Dispatchers.IO) {
                location?.let {
                    try {
                        val geocoder = Geocoder(this@MainActivity, Locale.getDefault())
                        geocoder.getFromLocation(it.latitude, it.longitude, 1)?.firstOrNull()?.getAddressLine(0)
                    } catch (e: Exception) { null }
                }
            }
            val prompt = "User is in danger at $address. Find nearest Police Station. Guide in Hindi. Direct command: '50 मीटर आगे बढ़ें और बाएं मुड़ें'."
            try {
                val response = withContext(Dispatchers.IO) { chatSession?.sendMessage(prompt) }
                val aiText = response?.text ?: "निकटतम सुरक्षित स्थान पर जाएं।"
                botResponseText.text = aiText
                speak(aiText)
                val gmmIntentUri = Uri.parse("google.navigation:q=police+station")
                val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri).setPackage("com.google.android.apps.maps")
                if (mapIntent.resolveActivity(packageManager) != null) startActivity(mapIntent)
            } catch (e: Exception) { Log.e("SafeOV", "AI error: ${e.message}") }
        }
    }

    private fun sendEmergencySmsToAll(message: String) {
        val prefs = getSharedPreferences("SafeOV_Prefs", Context.MODE_PRIVATE)
        val contacts = listOfNotNull(prefs.getString("contact_1", null), prefs.getString("contact_2", null), prefs.getString("contact_3", null)).filter { it.isNotBlank() }
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED) {
            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) getSystemService(SmsManager::class.java) else SmsManager.getDefault()
            contacts.forEach { number -> try { smsManager.sendTextMessage(number, null, message, null, null) } catch (e: Exception) {} }
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type == Sensor.TYPE_ACCELEROMETER) {
            val x = event.values[0]; val y = event.values[1]; val z = event.values[2]
            val gForce = sqrt((x * x + y * y + z * z).toDouble()) / SensorManager.GRAVITY_EARTH
            if (gForce > 7.0 && !isAccidentDetected) {
                isAccidentDetected = true
                triggerAccidentResponse()
            }
        }
    }

    private fun triggerAccidentResponse() {
        handler.post {
            vibrate(1000)
            alertPlayer = MediaPlayer.create(this, android.provider.Settings.System.DEFAULT_RINGTONE_URI)
            alertPlayer?.start()

            var countdown = 3
            val dialogBinding = LayoutAccidentDialogBinding.inflate(layoutInflater)
            val dialog = AlertDialog.Builder(this).setView(dialogBinding.root).setCancelable(false).create()
            dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) { setShowWhenLocked(true); setTurnScreenOn(true) }
            dialog.show()

            dialogBinding.btnCancelAccident.setOnClickListener {
                isAccidentDetected = false; alertPlayer?.stop(); alertPlayer?.release(); alertPlayer = null
                handler.removeCallbacksAndMessages(null); dialog.dismiss()
            }

            val countdownRunnable = object : Runnable {
                override fun run() {
                    if (countdown > 1) {
                        countdown--; dialogBinding.countdownText.text = countdown.toString()
                        handler.postDelayed(this, 1000)
                    } else {
                        alertPlayer?.stop(); alertPlayer?.release(); alertPlayer = null
                        dialog.dismiss(); makeAmbulanceCall(); activateSOS("Accident Detected")
                    }
                }
            }
            handler.postDelayed(countdownRunnable, 1000)
        }
    }

    private fun vibrate(duration: Long) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator else getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE)) else vibrator.vibrate(duration)
    }

    private fun makeAmbulanceCall() {
        val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:108"))
        startActivity(dialIntent)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale("hi", "IN")
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {}
                override fun onDone(utteranceId: String?) { runOnUiThread { if (isSosActive) startListening() } }
                override fun onError(utteranceId: String?) {}
            })
        }
    }

    override fun onResume() {
        super.onResume()
        accelerometer?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI) }
    }

    override fun onPause() {
        super.onPause()
        sensorManager.unregisterListener(this)
    }

    private fun speak(text: String) { tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "SafetyID") }

    override fun onDestroy() {
        isSosActive = false; recording?.stop(); mediaPlayer?.release(); alertPlayer?.release(); tts?.shutdown(); speechRecognizer?.destroy()
        super.onDestroy()
    }
}
