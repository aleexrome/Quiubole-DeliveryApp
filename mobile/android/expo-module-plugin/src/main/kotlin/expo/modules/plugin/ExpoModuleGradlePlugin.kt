package expo.modules.plugin

import org.gradle.api.Plugin
import org.gradle.api.Project

/**
 * Placeholder plugin that satisfies the expo-module-gradle-plugin requirement.
 * The actual expo module configuration is handled by expo-autolinking.
 */
class ExpoModuleGradlePlugin : Plugin<Project> {
    override fun apply(project: Project) {
        // This is a placeholder plugin.
        // The actual configuration is done by expo-autolinking through useExpoModules()
        project.logger.info("expo-module-gradle-plugin applied to ${project.name}")
    }
}
