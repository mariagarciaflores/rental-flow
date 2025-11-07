import { initializeApp, getApps, App, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// This is a server-only file.

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

// Function to get or initialize the admin app
function getAdminApp(): App {
  if (getApps().some((app) => app.name === 'admin')) {
    return getApp('admin');
  }

  if (serviceAccountKey) {
    return initializeApp(
      {
        credential: cert(serviceAccountKey),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      },
      'admin'
    );
  }
  
  // For local development without service account
  console.warn("Firebase Admin SDK initialized without a service account. This is for local development only.");
  return initializeApp({
      projectId: firebaseConfig.projectId
  }, 'admin');
}

const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
