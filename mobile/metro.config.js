const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Redirect react-native-reanimated to our shim
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-reanimated': path.resolve(__dirname, 'src/utils/reanimatedShim.ts'),
};

module.exports = config;
