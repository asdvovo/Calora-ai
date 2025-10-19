const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve('stream-browserify'),
  events: require.resolve('events'),
  buffer: require.resolve('buffer'),
  crypto: require.resolve('crypto-browserify'),
  vm: require.resolve('vm-browserify'),
  http: require.resolve('https-browserify'),
  https: require.resolve('https-browserify'),
  net: require.resolve('react-native-tcp-socket'),
  tls: require.resolve('react-native-tcp-socket'),
  url: require.resolve('url'), // الإضافة الأخيرة
};

module.exports = config;