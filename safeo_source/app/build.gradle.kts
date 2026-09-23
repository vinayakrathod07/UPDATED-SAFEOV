plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.kotlinAndroid)
}

android {
    namespace = "com.example.safeov"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.safeov"
        minSdk = 28
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation(libs.androidxCoreKtx)
    implementation(libs.androidxAppcompat)
    implementation(libs.material)
    implementation(libs.androidxActivity)
    implementation(libs.androidxConstraintlayout)

    // Coroutines + lifecycleScope (used throughout MainActivity)
    implementation(libs.kotlinxCoroutinesAndroid)
    implementation(libs.androidxLifecycleRuntimeKtx)

    // Location
    implementation(libs.playServicesLocation)

    // CameraX
    implementation(libs.androidxCameraCore)
    implementation(libs.androidxCameraCamera2)
    implementation(libs.androidxCameraLifecycle)
    implementation(libs.androidxCameraView)
    implementation(libs.androidxCameraVideo)

    // Gemini AI
    implementation(libs.generativeai)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidxJunit)
    androidTestImplementation(libs.androidxEspressoCore)
}