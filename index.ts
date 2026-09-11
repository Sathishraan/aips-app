import { polyfillWebCrypto } from 'expo-standard-web-crypto';
import { registerRootComponent } from 'expo';

import App from './App';

try {
  const g = globalThis as any;
  if (typeof g.window === 'undefined') {
    g.window = g;
  }
  polyfillWebCrypto();
} catch {
  // Native crypto is optional; chat still works without E2EE.
}

registerRootComponent(App);
