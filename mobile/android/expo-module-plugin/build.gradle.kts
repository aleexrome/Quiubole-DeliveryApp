plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
}

repositories {
    mavenCentral()
    google()
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
