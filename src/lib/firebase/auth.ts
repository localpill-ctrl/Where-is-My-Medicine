import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';

// Google Auth Provider instance
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account selection
});

/**
 * Detect mobile browsers and in-app WebViews (Instagram, WhatsApp, etc.)
 * These environments block popups, so we must use redirect instead.
 */
const isMobileOrInAppBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  // Covers Android, iOS, and common in-app browsers
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua) ||
    // Detect in-app browsers (Instagram, Facebook, Line, etc.)
    /FBAN|FBAV|Instagram|Line\/|KAKAOTALK|Twitter/i.test(ua);
};

/**
 * Sign in with Google.
 * - Desktop: uses popup (faster, no page navigation)
 * - Mobile / in-app browser: uses redirect (the only reliable option)
 *
 * On mobile, this function triggers a redirect and never resolves —
 * the result is captured on page load via handleRedirectResult().
 */
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  if (isMobileOrInAppBrowser()) {
    await signInWithRedirect(auth, googleProvider);
    // Never reached — browser navigates away
    return new Promise(() => {});
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

/**
 * Call this once on the login page mount to capture the Google redirect result.
 * Returns the FirebaseUser if returning from a redirect sign-in, otherwise null.
 */
export const handleRedirectResult = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (err) {
    console.error('Error handling redirect result:', err);
    throw err;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Subscribe to authentication state changes
 */
export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the currently signed-in user (synchronous)
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
