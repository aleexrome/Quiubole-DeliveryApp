package expo.modules.plugin

import org.gradle.api.Plugin
import org.gradle.api.Project

/**
 * Plugin that configures expo modules with Android SDK settings.
 * Configures SDK versions immediately when com.android.library is applied.
 */
class ExpoModuleGradlePlugin : Plugin<Project> {
    override fun apply(project: Project) {
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

        // Apply android library plugin
        project.plugins.apply("com.android.library")

        // Configure immediately after applying
        project.plugins.withId("com.android.library") {
            configureAndroidSdk(project, compileSdk, minSdk, targetSdk)
        }

        project.logger.info("expo-module-gradle-plugin applied to ${project.name}")
    }

    private fun configureAndroidSdk(project: Project, compileSdk: Int, minSdk: Int, targetSdk: Int) {
        try {
            val android = project.extensions.findByName("android") ?: return

            // Use reflection to set compileSdk
            try {
                val setCompileSdk = android.javaClass.getMethod("setCompileSdk", Integer::class.java)
                setCompileSdk.invoke(android, compileSdk)
            } catch (e: Exception) {
                // Try alternative method name
                try {
                    val method = android.javaClass.getMethod("compileSdkVersion", Int::class.javaPrimitiveType)
                    method.invoke(android, compileSdk)
                } catch (e2: Exception) {
                    project.logger.warn("Could not set compileSdk: ${e2.message}")
                }
            }

            // Get defaultConfig and set minSdk/targetSdk
            try {
                val defaultConfig = android.javaClass.getMethod("getDefaultConfig").invoke(android)
                if (defaultConfig != null) {
                    try {
                        defaultConfig.javaClass.getMethod("setMinSdk", Integer::class.java).invoke(defaultConfig, minSdk)
                    } catch (e: Exception) {
                        try {
                            defaultConfig.javaClass.getMethod("minSdkVersion", Int::class.javaPrimitiveType).invoke(defaultConfig, minSdk)
                        } catch (e2: Exception) {
                            project.logger.warn("Could not set minSdk: ${e2.message}")
                        }
                    }

                    try {
                        defaultConfig.javaClass.getMethod("setTargetSdk", Integer::class.java).invoke(defaultConfig, targetSdk)
                    } catch (e: Exception) {
                        try {
                            defaultConfig.javaClass.getMethod("targetSdkVersion", Int::class.javaPrimitiveType).invoke(defaultConfig, targetSdk)
                        } catch (e2: Exception) {
                            project.logger.warn("Could not set targetSdk: ${e2.message}")
                        }
                    }
                }
            } catch (e: Exception) {
                project.logger.warn("Could not configure defaultConfig: ${e.message}")
            }

            project.logger.info("Configured SDK: compileSdk=$compileSdk, minSdk=$minSdk, targetSdk=$targetSdk")
        } catch (e: Exception) {
            project.logger.warn("Could not configure Android SDK: ${e.message}")
        }
    }
}
