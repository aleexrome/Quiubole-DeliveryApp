plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
}

repositories {
    mavenCentral()
    google()
    gradlePluginPortal()
}

dependencies {
    implementation("com.android.tools.build:gradle:8.6.1")
}

gradlePlugin {
    plugins {
        create("expoModuleGradlePlugin") {
            id = "expo-module-gradle-plugin"
            implementationClass = "expo.modules.plugin.ExpoModuleGradlePlugin"
        }
    }
}
