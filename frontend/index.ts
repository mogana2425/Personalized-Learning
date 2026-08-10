// Polyfill FormData globally before any modules initialize (prevents Hermes ReferenceError crash)
if (typeof (global as any).FormData === 'undefined') {
  (global as any).FormData = require('react-native/Libraries/Network/FormData');
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
