const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Alias react-native-web-webview to react-native-webview for web support
// This fixes the resolution error in react-native-youtube-iframe on web
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react-native-web-webview': path.resolve(__dirname, 'node_modules/react-native-webview'),
};

module.exports = config;
