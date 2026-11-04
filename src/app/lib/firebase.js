"use client";

/**
 * Firebase client setup (Google sign-in).
 *
 * All configuration is read from the frontend .env file by name —
 * NEXT_PUBLIC_FIREBASE_* — and is never hardcoded here. The app's identity
 * system remains the backend JWT (see lib/AuthContext.jsx); Firebase only
 * performs the Google account chooser and issues the short-lived ID token
 * that the backend verifies before issuing the app session.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** Initialize Firebase exactly once per page load. */
export function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

/** Lazily get the Firebase Auth instance (client-side only). */
export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

/**
 * Opens the Google account picker popup.
 * Resolves with the Firebase ID token (which the backend verifies) plus the
 * basic Google profile for the UI. Rejects if the user closes the popup.
 */
export async function googleSignIn() {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  // Always show the account chooser so users can switch Google accounts.
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    profile: {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    },
  };
}

/** Map common Firebase auth errors to short, user-friendly messages. */
export function googleSignInErrorMessage(error) {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in window was closed before finishing.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow popups and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email is already used with a different sign-in method.";
    case "auth/network-request-failed":
      return "Network problem during Google sign-in. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled yet for this Firebase project.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google sign-in in the Firebase console.";
    case "auth/configuration-not-found":
      return "Firebase authentication is not configured for this project yet.";
    default:
      return "Google sign-in failed. Please try again.";
  }
}
