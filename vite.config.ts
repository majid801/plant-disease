import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // Try to load firebase config from file for local dev
  let firebaseConfig = {};
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not load firebase-applet-config.json');
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || (firebaseConfig as any).apiKey),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseConfig as any).authDomain),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || (firebaseConfig as any).projectId),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfig as any).storageBucket),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfig as any).messagingSenderId),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || (firebaseConfig as any).appId),
      'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
