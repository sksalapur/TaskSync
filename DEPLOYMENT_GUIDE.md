# TaskSync Deployment Guide

Complete guide to deploy your TaskSync app to production.

---

## 🚀 Option 1: Firebase Hosting (Recommended)

**Best for:** Firebase projects, free tier, automatic SSL, global CDN, perfect integration

### Prerequisites
- Firebase CLI installed globally
- Firebase project created (tasksync-0711)

### Steps

#### 1. Install Firebase CLI
```powershell
npm install -g firebase-tools
```

#### 2. Login to Firebase
```powershell
firebase login
```

#### 3. Initialize Firebase Hosting
```powershell
cd D:\PROJECTS\TaskSync
firebase init hosting
```

**Configuration answers:**
- **Project setup:** Use existing project → Select `tasksync-0711`
- **Public directory:** `dist` (NOT public)
- **Configure as SPA:** `Yes`
- **Set up automatic builds:** `No`
- **Overwrite index.html:** `No`

#### 4. Build Your App
```powershell
npm run build
```

This creates optimized production files in the `dist` folder.

#### 5. Deploy to Firebase
```powershell
firebase deploy
```

Your app will be live at: `https://tasksync-0711.web.app`

#### 6. Configure Custom Domain (Optional)
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps
4. Firebase provides free SSL certificate

### Update App
To deploy updates:
```powershell
npm run build
firebase deploy
```

---

## 🌐 Option 2: Vercel (Excellent Alternative)

**Best for:** Zero-config deployments, automatic deployments from Git, excellent DX

### Steps

#### 1. Install Vercel CLI
```powershell
npm install -g vercel
```

#### 2. Deploy
```powershell
cd D:\PROJECTS\TaskSync
vercel
```

Follow the prompts:
- **Set up and deploy:** `Yes`
- **Which scope:** Your account
- **Link to existing project:** `No`
- **Project name:** `tasksync`
- **Directory:** `./`
- **Override settings:** `No`

#### 3. Production Deployment
```powershell
vercel --prod
```

### Environment Variables
Add to Vercel dashboard (Settings → Environment Variables):
```
VITE_FIREBASE_API_KEY=AIzaSyDtCzB0...
VITE_FIREBASE_AUTH_DOMAIN=tasksync-0711.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tasksync-0711
VITE_FIREBASE_STORAGE_BUCKET=tasksync-0711.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=824933882046
VITE_FIREBASE_APP_ID=1:824933882046:web:7fcc...
VITE_FIREBASE_MEASUREMENT_ID=G-DX0X1GV0NC
```

### GitHub Integration (Recommended)
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Auto-deploys on every push to main branch

---

## 🔷 Option 3: Netlify

**Best for:** Quick deployments, drag-and-drop option, generous free tier

### Method A: Netlify CLI

#### 1. Install Netlify CLI
```powershell
npm install -g netlify-cli
```

#### 2. Build App
```powershell
npm run build
```

#### 3. Deploy
```powershell
netlify deploy
```

- **Create new site:** `Yes`
- **Team:** Your team
- **Site name:** `tasksync` (or custom)
- **Publish directory:** `dist`

#### 4. Production Deploy
```powershell
netlify deploy --prod
```

### Method B: Drag and Drop
1. Build your app: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist` folder to Netlify
4. Done! Instant deployment

### Environment Variables
Add in Netlify Dashboard → Site settings → Environment variables

---

## 📦 Option 4: GitHub Pages

**Best for:** Free static hosting, simple projects

### Steps

#### 1. Install gh-pages package
```powershell
npm install --save-dev gh-pages
```

#### 2. Update vite.config.js
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/TaskSync/', // Replace with your repo name
})
```

#### 3. Update package.json
Add these scripts:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

#### 4. Deploy
```powershell
npm run deploy
```

Your app will be at: `https://yourusername.github.io/TaskSync/`

**⚠️ Important:** Update Firebase authorized domains:
- Firebase Console → Authentication → Settings → Authorized domains
- Add: `yourusername.github.io`

---

## 🔧 Pre-Deployment Checklist

### 1. Update Firebase Configuration
Remove hardcoded values from `firebaseConfig.js` and rely only on environment variables.

### 2. Configure Authorized Domains
In Firebase Console → Authentication → Settings → Authorized domains:
- Add your production domain
- Examples: 
  - `tasksync-0711.web.app`
  - `yourdomain.com`
  - `tasksync.vercel.app`

### 3. Update Firestore Security Rules
Change from test mode to production rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Lists collection
    match /lists/{listId} {
      allow read: if request.auth != null && (
        resource.data.owner == request.auth.uid || 
        request.auth.token.email in resource.data.sharedWith
      );
      allow create: if request.auth != null && request.resource.data.owner == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.owner == request.auth.uid;
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Activities collection
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

### 4. Enable Google OAuth in Production
- Firebase Console → Authentication → Sign-in method → Google
- Add production domain to authorized domains

### 5. Test Environment Variables
Ensure all `VITE_` variables are set in your hosting platform.

---

## 🎯 Recommended Deployment Flow

**For best results:**

1. **Development:** Local testing on `localhost:3002`
2. **Staging:** Deploy to Firebase Hosting preview channel
   ```powershell
   firebase hosting:channel:deploy staging
   ```
3. **Production:** Deploy to Firebase Hosting main site
   ```powershell
   firebase deploy --only hosting
   ```

---

## 📊 Performance Optimization

### Already Included
✅ Vite production build with code splitting
✅ React optimizations (lazy loading ready)
✅ TailwindCSS purging unused styles
✅ Firebase SDK tree-shaking

### Additional Optimizations

#### 1. Enable Lazy Loading
Update `App.jsx`:
```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// Wrap routes in Suspense
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    {/* ... */}
  </Routes>
</Suspense>
```

#### 2. Enable Compression
Most hosting platforms enable this automatically.

#### 3. Add PWA Support (Optional)
Install workbox:
```powershell
npm install -D vite-plugin-pwa
```

---

## 🐛 Common Deployment Issues

### Issue: Environment Variables Not Working
**Solution:** Ensure they start with `VITE_` prefix and restart build

### Issue: 404 on Refresh
**Solution:** Your hosting platform needs SPA configuration (redirect all to index.html)

### Issue: Firebase Auth Error on Production
**Solution:** Add production domain to Firebase authorized domains

### Issue: CORS Errors
**Solution:** Check Firebase security rules and ensure domain is authorized

---

## 📈 Monitoring & Analytics

Your app includes Firebase Analytics. View data at:
- Firebase Console → Analytics

Track:
- User engagement
- Authentication flows
- Real-time users
- Page views

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` to Git** (already in `.gitignore`)
2. ✅ **Use environment variables** for all sensitive data
3. ✅ **Enable Firebase App Check** (prevents unauthorized API usage)
4. ✅ **Update Firestore rules** from test mode to production
5. ✅ **Enable Firebase Authentication email verification** (optional)

---

## 🚀 Quick Start (Firebase Hosting)

**TL;DR - Three commands:**
```powershell
npm install -g firebase-tools
firebase login
firebase init hosting  # Choose dist, SPA:yes
npm run build
firebase deploy
```

**Done!** Your app is live at `https://tasksync-0711.web.app`

---

## 📞 Support Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

## 🎉 Next Steps After Deployment

1. Test all features in production
2. Share app URL with team
3. Monitor Firebase Console for usage
4. Set up custom domain (if needed)
5. Enable email verification for new users
6. Add error tracking (e.g., Sentry)
7. Set up automated backups for Firestore

---

**Need help?** Check the Firebase Console for deployment logs and errors.
