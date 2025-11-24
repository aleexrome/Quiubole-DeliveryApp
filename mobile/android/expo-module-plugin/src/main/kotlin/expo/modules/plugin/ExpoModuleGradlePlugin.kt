package expo.modules.plugin

import org.gradle.api.Plugin
import org.gradle.api.Project

/**
 * Placeholder plugin for expo-module-gradle-plugin.
 * This provides the plugin ID that expo modules expect.
 * The actual configuration is handled by expo-modules-autolinking.
 */
class ExpoModuleGradlePlugin : Plugin<Project> {
    override fun apply(project: Project) {
        // This is a placeholder plugin.
        // Expo modules autolinking handles the actual configuration.
        project.logger.info("expo-module-gradle-plugin applied to ${project.name}")
    }
}
