# 🚨 QUICK FIX: "Missing or insufficient permissions" Error

## The Problem
You're seeing this error because the Firebase security rules haven't been updated yet. The default rules block all access to your data.

## ⚡ IMMEDIATE SOLUTION (5 minutes)

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your `asset-audit-v1` project

### Step 2: Update Firestore Rules
1. Click **"Firestore Database"** in the left sidebar
2. Click the **"Rules"** tab
3. **Replace ALL existing rules** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    match /assessments/{assessmentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click **"Publish"**

### Step 3: Update Storage Rules
1. Click **"Storage"** in the left sidebar
2. Click the **"Rules"** tab
3. **Replace ALL existing rules** with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /assessments/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click **"Publish"**

### Step 4: Test Your App
1. Refresh your application
2. Sign in with a user account
3. Try accessing the admin dashboard
4. The error should be resolved!

## 🔍 What These Rules Do

**Firestore Rules:**
- Allow any authenticated user to read/write user profiles
- Allow any authenticated user to read/write assessments
- This enables the role system to work properly

**Storage Rules:**
- Allow any authenticated user to upload/download assessment images
- This enables image capture and viewing to work

## ⚠️ Important Notes

1. **These are development rules** - they're more permissive than production rules
2. **Use for testing only** - upgrade to production rules before going live
3. **All authenticated users can access all data** - this is temporary for testing

## 🔄 Next Steps (After Testing)

Once everything is working, you can upgrade to more secure production rules:

1. Follow the guide in `FIREBASE_SECURITY_RULES.md`
2. Implement proper role-based restrictions
3. Test thoroughly with different user roles

## 🐛 Still Having Issues?

If you still see permission errors:

1. **Check Authentication**: Make sure you're signed in
2. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)
3. **Check Browser Console**: Look for additional error messages
4. **Verify Rules Published**: Ensure you clicked "Publish" in Firebase Console

## 📞 Need Help?

If you're still stuck:
1. Check the browser console for detailed error messages
2. Verify your Firebase project configuration
3. Ensure you're using the correct Firebase project

## 🎯 Expected Result

After following these steps:
- ✅ Admin dashboard loads without errors
- ✅ All assessments are visible to admin users
- ✅ Staff users can create assessments
- ✅ Image upload/download works properly
- ✅ User management functions correctly

The role-based access control will work properly once these basic permissions are in place!
