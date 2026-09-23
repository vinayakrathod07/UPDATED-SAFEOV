// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.1.0" apply false
    id("com.google.gms.google-services") version "4.4.2" apply false
}

// Standard clean task
tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

// Resilience Rule: Catch and ignore phantom tasks passed by buggy IDE sync
tasks.addRule("Pattern: <taskName>: Catch phantom IDE tasks") {
    val taskName = this
    val phantoms = setOf("JDK", "Embedded", "Gradle", "Android", "Studio", "17", "(17)", "=", "(", ")", "1.7.0", "jbr-21")
    if (phantoms.any { taskName.contains(it) }) {
        tasks.register(taskName) {
            group = "help"
            description = "Bypass IDE sync bug"
        }
    }
}
