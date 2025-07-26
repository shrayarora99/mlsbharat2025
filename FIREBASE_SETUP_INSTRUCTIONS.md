# Firebase Authentication Setup Instructions

## Current Issue
The Google sign-in is failing because the current domain is not authorized in your Firebase console.

## Required Domain to Add
Add this domain to your Firebase console authorized domains:
```
01dc7681-0a02-4771-bc81-602049cc9b25-00-3v6yp79rd6pam.spock.replit.dev
```

## Step-by-Step Setup Instructions

### 1. Access Firebase Console
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project: **mlsbharat-7be4b**

### 2. Navigate to Authentication Settings
- Click on "Authentication" in the left sidebar
- Go to "Settings" tab
- Click on "Authorized domains"

### 3. Add Replit Domain
- Click "Add domain"
- Enter: `01dc7681-0a02-4771-bc81-602049cc9b25-00-3v6yp79rd6pam.spock.replit.dev`
- Click "Done"

### 4. Verify Google Sign-in Method
- Go to "Sign-in method" tab
- Ensure "Google" provider is enabled
- Click on Google provider to configure if needed

### 5. Test Authentication
After adding the domain:
- Refresh your Replit app
- Try signing in with Google
- The authentication should now work properly

## Current Firebase Configuration
- **Project ID:** mlsbharat-7be4b
- **API Key:** Configured ✅
- **App ID:** Configured ✅
- **Auth Domain:** mlsbharat-7be4b.firebaseapp.com

## Backup Authentication Method
If redirect method continues failing, the app now includes popup-based authentication as a fallback option.

## After Deployment
When you deploy to production, you'll need to add your production domain to the authorized domains list as well.