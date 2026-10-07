plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val signingStorePath = System.getenv("BLUEPREMIUM_KEYSTORE")
val signingStorePassword = System.getenv("BLUEPREMIUM_STORE_PASSWORD")
val signingKeyAlias = System.getenv("BLUEPREMIUM_KEY_ALIAS") ?: "bluepremium"
val signingKeyPassword = System.getenv("BLUEPREMIUM_KEY_PASSWORD")

android {
    namespace = "app.bluepremium"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.bluepremium"
        minSdk = 24
        targetSdk = 35
        versionCode = System.getenv("BLUEPREMIUM_VERSION_CODE")?.toIntOrNull() ?: 2
        versionName = System.getenv("BLUEPREMIUM_VERSION_NAME") ?: "1.3.0"
    }

    signingConfigs {
        if (!signingStorePath.isNullOrBlank() && !signingStorePassword.isNullOrBlank() && !signingKeyPassword.isNullOrBlank()) {
            create("release") {
                storeFile = file(signingStorePath)
                storePassword = signingStorePassword
                keyAlias = signingKeyAlias
                keyPassword = signingKeyPassword
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
                enableV4Signing = true
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            signingConfig = signingConfigs.findByName("release")
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
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
}
