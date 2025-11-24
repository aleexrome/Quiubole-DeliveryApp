package expo.modules.plugin

import org.gradle.api.Plugin
import org.gradle.api.Project

/**
 * Plugin that configures expo modules with default Android SDK settings.
 */
class ExpoModuleGradlePlugin : Plugin<Project> {
    override fun apply(project: Project) {
        project.plugins.apply("com.android.library")

        project.afterEvaluate {
            project.extensions.findByName("android")?.let { android ->
                val androidExt = android as com.android.build.gradle.LibraryExtension

                // Get values from root project or use defaults
                val compileSdk = project.rootProject.findProperty("compileSdkVersion")?.toString()?.toIntOrNull() ?: 35
                val minSdk = project.rootProject.findProperty("minSdkVersion")?.toString()?.toIntOrNull() ?: 24
                val targetSdk = project.rootProject.findProperty("targetSdkVersion")?.toString()?.toIntOrNull() ?: 35

                if (androidExt.compileSdk == null) {
                    androidExt.compileSdk = compileSdk
                }
                androidExt.defaultConfig {
                    if (it.minSdk == null) {
                        it.minSdk = minSdk
                    }
                    if (it.targetSdk == null) {
                        it.targetSdk = targetSdk
                    }
                }
            }
        }

        project.logger.info("expo-module-gradle-plugin applied to ${project.name}")
    }
}
