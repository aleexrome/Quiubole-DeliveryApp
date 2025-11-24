plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
}

repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
}

gradlePlugin {
    plugins {
        create("expoModuleGradlePlugin") {
            id = "expo-module-gradle-plugin"
            implementationClass = "expo.modules.plugin.ExpoModuleGradlePlugin"
        }
    }
}
