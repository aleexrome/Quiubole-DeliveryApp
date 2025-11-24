package expo.modules.plugin

import com.android.build.gradle.LibraryExtension
import org.gradle.api.Plugin
import org.gradle.api.Project

/**
 * Plugin that configures expo modules with default Android SDK settings.
 */
class ExpoModuleGradlePlugin : Plugin<Project> {
    override fun apply(project: Project) {
        project.plugins.apply("com.android.library")

        project.afterEvaluate {
            val android = project.extensions.findByType(LibraryExtension::class.java)
            if (android != null) {
                // Get values from root project or use defaults
                val compileSdkVal = project.rootProject.findProperty("compileSdkVersion")?.toString()?.toIntOrNull() ?: 35
                val minSdkVal = project.rootProject.findProperty("minSdkVersion")?.toString()?.toIntOrNull() ?: 24
                val targetSdkVal = project.rootProject.findProperty("targetSdkVersion")?.toString()?.toIntOrNull() ?: 35

                if (android.compileSdk == null) {
                    android.compileSdk = compileSdkVal
                }
                if (android.defaultConfig.minSdk == null) {
                    android.defaultConfig.minSdk = minSdkVal
                }
                if (android.defaultConfig.targetSdk == null) {
                    android.defaultConfig.targetSdk = targetSdkVal
                }
            }
        }

        project.logger.info("expo-module-gradle-plugin applied to ${project.name}")
    }
}
