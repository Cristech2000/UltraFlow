# UltraFlow Configuration

**Project:** UltraFlow  
**Version:** 1.0

---

# Purpose

This document contains the configuration required for UltraFlow to communicate with external services.

Sensitive credentials should never be hardcoded into source code. Instead, they should be loaded using environment variables during development and production.

---

# Firebase Configuration

## Project Information

| Property | Value |
|----------|-------|
| Project Name | UltraFlow |
| Firebase Project ID | ultraflaw-cffd2 |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Analytics | Google Analytics |

---

## Firebase Web Configuration

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAGcdfMdFyyoEyDf8ZWAaT3cFL0BeGEUvw",
  authDomain: "ultraflaw-cffd2.firebaseapp.com",
  projectId: "ultraflaw-cffd2",
  storageBucket: "ultraflaw-cffd2.firebasestorage.app",
  messagingSenderId: "336513344888",
  appId: "1:336513344888:web:a648b30f0ac3e2d92e948d",
  measurementId: "G-PG5GT22PY5"
};
```

---

# Environment Variables

During development, the project should use the following environment variables.

```env
VITE_FIREBASE_API_KEY=AIzaSyAGcdfMdFyyoEyDf8ZWAaT3cFL0BeGEUvw

VITE_FIREBASE_AUTH_DOMAIN=ultraflaw-cffd2.firebaseapp.com

VITE_FIREBASE_PROJECT_ID=ultraflaw-cffd2

VITE_FIREBASE_STORAGE_BUCKET=ultraflaw-cffd2.firebasestorage.app

VITE_FIREBASE_MESSAGING_SENDER_ID=336513344888

VITE_FIREBASE_APP_ID=1:336513344888:web:a648b30f0ac3e2d92e948d

VITE_FIREBASE_MEASUREMENT_ID=G-PG5GT22PY5
```

---

# Google Drive Configuration

Google Drive shall be used as the primary storage location for:

- Progress Photos
- Reports
- Drawings
- Assessments
- Inspection Sheets
- Certificates
- Project Documents

## Configuration

| Property | Value |
|----------|-------|
| Root Folder ID | `<GOOGLE_DRIVE_ROOT_FOLDER_ID>` |
| Service Account | `<SERVICE_ACCOUNT_EMAIL>` |
| Credentials File | `<SERVICE_ACCOUNT_JSON>` |

---

# OpenAI Configuration

UltraFlow uses OpenAI to power AI-assisted features.

## Configuration

```env
OPENAI_API_KEY=<OPENAI_API_KEY>
```

Future AI capabilities include:

- Report generation
- Progress summarization
- Grammar improvement
- AI project assistant
- Intelligent search
- Predictive analytics

---

# GitHub Configuration

| Property | Value |
|----------|-------|
| Repository | https://github.com/Cristech2000/UltraFlow |
| Hosting | GitHub Pages |
| Branch | main |

---

# Required Firebase Services

The following Firebase services shall be enabled:

- Authentication
- Firestore Database
- Firebase Storage
- Analytics
- Cloud Messaging (Future)
- Cloud Functions (Future)

---

# Authentication Providers

Current:

- Email / Password

Future:

- Google Sign-In
- Microsoft Sign-In
- Phone Authentication

---

# Deployment Checklist

Before deployment:

- Configure Firebase Authentication.
- Deploy Firestore Security Rules.
- Configure Firestore Indexes.
- Configure Google Drive API.
- Configure OpenAI API.
- Verify environment variables.
- Test authentication.
- Test Firestore connectivity.
- Test Google Drive uploads.
- Test report generation.

---

# Security Notes

- Never expose Service Account credentials.
- Store sensitive keys securely.
- Restrict Firestore using Security Rules.
- Authenticate every user before granting database access.
- Use Role-Based Access Control (RBAC) throughout the application.

---

# Version History

| Version | Date | Changes |
|----------|------|---------|
| 1.0 | Initial Release | Firebase configuration established |
