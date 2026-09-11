import Constants from 'expo-constants';

/** Minimal shape so Chat/Videos compile without shipping expo-av native code. */
type ExpoAvModule = {
  Audio?: any;
  Video?: any;
  ResizeMode?: { CONTAIN?: string };
};

let cached: ExpoAvModule | null | undefined;

/** expo-av is excluded from the APK (ABI crash). Keep this stub for JS fallbacks. */
export function getExpoAv(): ExpoAvModule | null {
  if (cached !== undefined) return cached;
  if (Constants.appOwnership === 'expo') {
    cached = null;
    return cached;
  }
  try {
    cached = require('expo-av');
  } catch {
    cached = null;
  }
  return cached;
}

export function getExpoAudio() {
  return getExpoAv()?.Audio ?? null;
}
