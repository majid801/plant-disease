# PlantDoc AI - Vercel Deployment Guide

This app is optimized for Vercel deployment. Follow these steps to deploy:

## 1. Prerequisites
- A [Vercel](https://vercel.com) account.
- [Vercel CLI](https://vercel.com/cli) installed (optional, you can also use the web dashboard).

## 2. Environment Variables
You MUST set the following environment variables in your Vercel project settings:
- `GEMINI_API_KEY`: Your Google Gemini API Key.

### Firebase Configuration (Optional if using firebase-applet-config.json)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID` (Optional)

## 3. Deployment Steps (Web Dashboard)
1. Push your code to a GitHub/GitLab/Bitbucket repository.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your repository.
4. In the "Environment Variables" section, add `GEMINI_API_KEY`.
5. Click **Deploy**.

## 4. Deployment Steps (CLI)
1. Run `vercel login`.
2. Run `vercel`.
3. Follow the prompts.
4. Add the environment variable: `vercel env add GEMINI_API_KEY`.
5. Run `vercel --prod` to deploy to production.

## 5. App-Friendly Features
- **PWA Support**: The app includes a `manifest.json` for "Add to Home Screen" support.
- **SPA Routing**: The `vercel.json` handles client-side routing.
- **Image Compression**: Automatically handles large mobile photos.
