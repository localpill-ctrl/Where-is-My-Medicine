import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton — safe across hot reloads)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = getAuth(app);

// Connect to Auth Emulator in local development
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.log('[Firebase] Connected to Auth Emulator');
}

// ─── Firestore & Storage ──────────────────────────────────────────────────────
export const db = getFirestore(app);
export const storage = getStorage(app);

// ─── Cloud Messaging (browser only) ──────────────────────────────────────────

/**
 * Returns the Firebase Messaging instance if the browser supports it.
 * Returns null in SSR or unsupported browsers (e.g. Safari < 16).
 */
export const getMessagingInstance = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getMessaging(app);
  }
  return null;
};

/**
 * Request notification permission and return the FCM registration token.
 * Requires NEXT_PUBLIC_FIREBASE_VAPID_KEY to be set in .env.local.
 * Returns null if permission is denied or messaging is unsupported.
 */
export const getFCMToken = async (): Promise<string | null> => {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || vapidKey === 'your_vapid_key_here') {
    console.warn('[Firebase] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. Push notifications will not work.');
    return null;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (err) {
    console.error('[Firebase] Failed to get FCM token:', err);
    return null;
  }
};

export default app;
