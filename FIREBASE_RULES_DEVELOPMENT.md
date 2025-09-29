# Firebase Security Rules - Development Version

## 🚨 URGENT FIX for "Missing or insufficient permissions" Error

Use these simplified rules for immediate testing and development. Deploy these rules first to fix the current error, then upgrade to the production rules later.

## Step-by-Step Fix

### 1. Deploy Development Firestore Rules (IMMEDIATE)

Go to Firebase Console → Firestore Database → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DEVELOPMENT RULES - Allow authenticated users to read/write
    // TODO: Replace with production rules after testing
    
    match /users/{userId} {
      // Users can manage their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow authenticated users to read all user profiles (for admin functionality)
      allow read: if request.auth != null;
      
      // Allow authenticated users to update any user (for admin role changes)
      allow write: if request.auth != null;
    }
    
    match /assessments/{assessmentId} {
      // Allow authenticated users to create assessments
      allow create: if request.auth != null;
      
      // Allow users to read their own assessments
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Allow authenticated users to read all assessments (for admin functionality)
      allow read: if request.auth != null;
      
      // Allow users to update/delete their own assessments
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 2. Deploy Development Storage Rules

Go to Firebase Console → Storage → Rules and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // DEVELOPMENT RULES - Allow authenticated users to read/write
    // TODO: Replace with production rules after testing
    
    match /assessments/{allPaths=**} {
      // Allow authenticated users to read and write all assessment images
      allow read, write: if request.auth != null;
    }
  }
}
```

## 3. How to Deploy Rules

### For Firestore:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Firestore Database" in the left sidebar
4. Click "Rules" tab
5. Replace the existing rules with the development rules above
6. Click "Publish"

### For Storage:
1. In the same Firebase Console
2. Click "Storage" in the left sidebar
3. Click "Rules" tab
4. Replace the existing rules with the development storage rules above
5. Click "Publish"

## 4. Test the Application

After deploying these rules:
1. Sign in to your app
2. Try creating an assessment as a staff user
3. Try accessing the admin dashboard
4. Verify that the "Missing or insufficient permissions" error is resolved

## 5. Upgrade to Production Rules (Later)

Once everything is working, upgrade to the production rules in `FIREBASE_SECURITY_RULES.md` which provide:
- Proper role-based access control
- Data isolation between staff and admin
- Enhanced security features

## Why This Fixes the Error

The current error occurs because:
1. The default Firebase rules deny all access
2. Our app is trying to query assessments without proper permissions
3. The user profile/role system needs to be established first

These development rules:
- Allow authenticated users to access data
- Enable the role system to work properly
- Provide a foundation for testing the RBAC implementation

## Security Note

⚠️ **These development rules are more permissive than production rules**
- Use only for development and testing
- Replace with production rules before going live
- Monitor usage in Firebase Console

## Troubleshooting

If you still get permission errors after deploying these rules:

1. **Check Authentication**: Ensure users are properly signed in
2. **Clear Cache**: Clear browser cache and restart the app
3. **Check Console**: Look for additional error messages in browser console
4. **Verify Rules**: Ensure rules were published successfully in Firebase Console

## Next Steps

1. Deploy these development rules immediately
2. Test the application functionality
3. Create test users for both staff and admin roles
4. Verify role-based features work correctly
5. Upgrade to production rules when ready for deployment
