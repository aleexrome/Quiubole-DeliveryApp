package expo.modules.plugin

import org.gradle.api.Plugin
import org.gradle.api.Project

/**
 * Plugin that configures expo modules with Android SDK settings.
 * Uses reflection to avoid compile-time AGP dependency.
 */
class ExpoModuleGradlePlugin : Plugin<Project> {
    override fun apply(project: Project) {
        project.plugins.apply("com.android.library")

        project.afterEvaluate {
            configureAndroidSdk(project)
        }

        project.logger.info("expo-module-gradle-plugin applied to ${project.name}")
    }

    private fun configureAndroidSdk(project: Project) {
        try {
            val android = project.extensions.findByName("android") ?: return

            // Get SDK versions from gradle.properties or use defaults
            val compileSdk = project.findProperty("android.compileSdkVersion")?.toString()?.toIntOrNull()
                ?: project.rootProject.findProperty("android.compileSdkVersion")?.toString()?.toIntOrNull()
                ?: 35
            val minSdk = project.findProperty("android.minSdkVersion")?.toString()?.toIntOrNull()
                ?: project.rootProject.findProperty("android.minSdkVersion")?.toString()?.toIntOrNull()
                ?: 24
            val targetSdk = project.findProperty("android.targetSdkVersion")?.toString()?.toIntOrNull()
                ?: project.rootProject.findProperty("android.targetSdkVersion")?.toString()?.toIntOrNull()
                ?: 35

            // Use reflection to set compileSdk
            val setCompileSdk = android.javaClass.getMethod("setCompileSdk", Integer::class.java)
            val currentCompileSdk = android.javaClass.getMethod("getCompileSdk").invoke(android)
            if (currentCompileSdk == null) {
                setCompileSdk.invoke(android, compileSdk)
            }

            // Get defaultConfig and set minSdk/targetSdk
            val defaultConfig = android.javaClass.getMethod("getDefaultConfig").invoke(android)
            if (defaultConfig != null) {
                val currentMinSdk = defaultConfig.javaClass.getMethod("getMinSdk").invoke(defaultConfig)
                if (currentMinSdk == null) {
                    defaultConfig.javaClass.getMethod("setMinSdk", Integer::class.java).invoke(defaultConfig, minSdk)
                }

                val currentTargetSdk = defaultConfig.javaClass.getMethod("getTargetSdk").invoke(defaultConfig)
                if (currentTargetSdk == null) {
                    defaultConfig.javaClass.getMethod("setTargetSdk", Integer::class.java).invoke(defaultConfig, targetSdk)
                }
            }

            project.logger.info("Configured SDK versions: compileSdk=$compileSdk, minSdk=$minSdk, targetSdk=$targetSdk")
        } catch (e: Exception) {
            project.logger.warn("Could not configure Android SDK: ${e.message}")
        }
    }
}
