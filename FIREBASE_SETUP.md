# Firebase Setup Instructions

## Current Error
`Firebase: Error (auth/configuration-not-found)` means Email/Password authentication is not enabled.

## Steps to Fix

### 1. Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **tasksync-0711**
3. In the left sidebar, click **Build** → **Authentication**
4. If first time, click **"Get started"**
5. Click **"Sign-in method"** tab
6. Click **"Email/Password"** provider
7. **Toggle "Enable"** to ON
8. Click **"Save"**

### 2. Set Up Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** or **"Start in test mode"**
4. Select your preferred location (e.g., us-central1)
5. Click **"Enable"**

### 3. Add Firestore Security Rules

Go to **Firestore Database** → **Rules** tab and paste this:

**IMPORTANT: For development, use test mode rules first:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **"Publish"**

**For production, use these secure rules instead:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /lists/{listId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    
    match /activities/{activityId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **"Publish"**

### 4. Enable Storage (Optional)

1. Go to **Build** → **Storage**
2. Click **"Get started"**
3. Choose security rules
4. Click **"Done"**

## Verify Setup

After enabling Email/Password authentication:
1. Refresh your browser at http://localhost:3002
2. Try signing up with an email and password
3. It should work now!

## Check Authentication Users

After successful signup:
1. Go to Firebase Console → **Authentication** → **Users** tab
2. You should see your newly created user account

## Current Firebase Configuration

- Project ID: tasksync-0711
- Auth Domain: tasksync-0711.firebaseapp.com
- API Key: AIzaSyDPUwV4smJnn2agPvE1RN1y1l9fJEfb1J8

## Troubleshooting

If you still get errors:
1. Make sure you're in the correct Firebase project
2. Check browser console for detailed error messages
3. Verify Firebase SDK versions are up to date
4. Clear browser cache and reload
