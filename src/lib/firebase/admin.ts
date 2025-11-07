import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// This is a server-only file.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

const apps = getApps();
const adminApp: App =
  apps.find((app) => app.name === 'admin') ||
  initializeApp(
    {
      credential: cert(
        serviceAccount || {
          projectId: firebaseConfig.projectId,
          clientEmail: 'dummy@example.com',
          privateKey: 'dummy',
        }
      ),
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
    },
    'admin'
  );

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
