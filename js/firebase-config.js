// ---------------------------------------------------------------------------
// Firebase configuration
//
// Paste the values from Firebase Console → Project settings → General →
// "Your apps" → SDK setup and configuration → Config.
//
// NOTE: This config is safe to keep in your public repo. Firebase web app
// config identifies your project, it is not a secret. Your data is protected
// by the Firestore/Storage *security rules* (see firestore.rules and
// storage.rules), not by hiding these values. Full explanation:
// https://firebase.google.com/docs/projects/api-keys
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};
