import { initializeApp, getApps, App, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// This is a server-only file.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

let adminApp: App;

if (getApps().some((app) => app.name === 'admin')) {
  adminApp = getApp('admin');
} else {
  // In a local development environment, the Admin SDK can be initialized without credentials.
  // This is useful for running server actions locally.
  // In a deployed environment, you MUST provide a service account.
  if (serviceAccount) {
    adminApp = initializeApp(
      {
        credential: cert(serviceAccount),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      },
      'admin'
    );
  } else {
    console.warn("Firebase Admin SDK initialized without a service account. This is for local development only.");
    adminApp = initializeApp({
        projectId: firebaseConfig.projectId
    }, 'admin');
  }
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
