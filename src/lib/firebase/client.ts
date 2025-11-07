"use client"
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCLfqz7y7wmsqsR_nLnk6GbAmxe8WryEAg",
  authDomain: "studio-4697983154-6ba04.firebaseapp.com",
  projectId: "studio-4697983154-6ba04",
  storageBucket: "studio-4697983154-6ba04.firebasestorage.app",
  messagingSenderId: "895863737077",
  appId: "1:895863737077:web:ff85ba96a7148e56db93bc"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
