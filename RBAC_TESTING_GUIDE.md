# Role-Based Access Control Testing Guide

This guide provides comprehensive testing scenarios to validate the role-based access control implementation in the Asset Audit application.

## Pre-Testing Setup

1. **Firebase Configuration**:
   - Ensure Firebase Security Rules are updated (see `FIREBASE_SECURITY_RULES.md`)
   - Verify Firestore and Storage rules are published
   - Test rules in Firebase Console Rules Playground

2. **Test User Accounts**:
   Create test accounts for each role:
   - Staff User: `staff@test.com` / `password123`
   - Admin User: `admin@test.com` / `password123`

## Testing Scenarios

### 1. User Registration and Role Assignment

#### Test Case 1.1: Staff Registration
- [ ] Navigate to sign-up screen
- [ ] Fill in user details
- [ ] Select "Staff Member" role
- [ ] Complete registration
- [ ] Verify user is redirected to staff dashboard `/(app)/(tabs)`
- [ ] Verify user profile shows "STAFF" role

#### Test Case 1.2: Admin Registration
- [ ] Navigate to sign-up screen
- [ ] Fill in user details
- [ ] Select "Administrator" role
- [ ] Complete registration
- [ ] Verify user is redirected to admin dashboard `/(app)/(admin-tabs)`
- [ ] Verify user profile shows "ADMIN" role

### 2. Authentication and Navigation

#### Test Case 2.1: Staff User Navigation
- [ ] Sign in as staff user
- [ ] Verify redirect to `/(app)/(tabs)`
- [ ] Verify access to: Dashboard, Capture, Assess, Settings
- [ ] Attempt to access admin routes manually
- [ ] Verify automatic redirect back to staff routes

#### Test Case 2.2: Admin User Navigation
- [ ] Sign in as admin user
- [ ] Verify redirect to `/(app)/(admin-tabs)`
- [ ] Verify access to: Admin Dashboard, All Assessments, User Management, Settings
- [ ] Verify admin can also access staff routes (flexibility)

#### Test Case 2.3: Unauthenticated Access
- [ ] Sign out completely
- [ ] Attempt to access any app route
- [ ] Verify redirect to sign-in screen
- [ ] Verify no data is accessible

### 3. Data Access Control

#### Test Case 3.1: Staff Data Isolation
- [ ] Sign in as staff user
- [ ] Create several assessments
- [ ] Navigate to history/dashboard
- [ ] Verify only own assessments are visible
- [ ] Sign in as different staff user
- [ ] Verify cannot see other staff's assessments

#### Test Case 3.2: Admin Data Access
- [ ] Sign in as admin user
- [ ] Navigate to "All Assessments"
- [ ] Verify all assessments from all users are visible
- [ ] Verify assessments show creator information
- [ ] Verify filtering by user works correctly

#### Test Case 3.3: Assessment Creation
- [ ] Sign in as staff user
- [ ] Create assessment with image upload
- [ ] Verify assessment is saved with correct userId
- [ ] Sign in as admin user
- [ ] Verify admin can see the staff's assessment
- [ ] Verify assessment details are complete

### 4. Feature Access Control

#### Test Case 4.1: Image Capture (Staff)
- [ ] Sign in as staff user
- [ ] Navigate to Capture tab
- [ ] Verify camera/photo picker functionality
- [ ] Complete image capture and assessment
- [ ] Verify image upload to Firebase Storage

#### Test Case 4.2: Image Capture (Admin)
- [ ] Sign in as admin user
- [ ] Verify admin can access staff capture functionality
- [ ] Complete image capture and assessment
- [ ] Verify admin-created assessments appear in all views

#### Test Case 4.3: User Management (Admin Only)
- [ ] Sign in as admin user
- [ ] Navigate to User Management
- [ ] Verify list of all users is displayed
- [ ] Test role change functionality
- [ ] Verify role changes are persisted
- [ ] Sign in as staff user
- [ ] Verify staff cannot access user management

### 5. Security Validation

#### Test Case 5.1: Direct URL Access
- [ ] Sign in as staff user
- [ ] Manually navigate to `/(app)/(admin-tabs)/users`
- [ ] Verify access is denied or redirected
- [ ] Test other admin-only routes

#### Test Case 5.2: API Security
- [ ] Use browser dev tools to inspect network requests
- [ ] Verify Firebase security rules block unauthorized requests
- [ ] Test with different authentication tokens

#### Test Case 5.3: Component-Level Security
- [ ] Verify RoleGuard components work correctly
- [ ] Test fallback messages for unauthorized access
- [ ] Verify loading states during role verification

### 6. User Experience Testing

#### Test Case 6.1: Role Indicators
- [ ] Verify role badges appear correctly in UI
- [ ] Check role-specific welcome messages
- [ ] Verify role-appropriate navigation options

#### Test Case 6.2: Error Handling
- [ ] Test behavior with network errors
- [ ] Test behavior when user role is undefined
- [ ] Verify graceful degradation

#### Test Case 6.3: Sign Out Functionality
- [ ] Test sign out from staff account
- [ ] Test sign out from admin account
- [ ] Verify complete session cleanup
- [ ] Verify redirect to sign-in screen

## Performance Testing

### Test Case 7.1: Role Loading Performance
- [ ] Measure time to load user profile after sign-in
- [ ] Verify role-based redirects are fast
- [ ] Test with slow network conditions

### Test Case 7.2: Data Loading Performance
- [ ] Test admin dashboard with large datasets
- [ ] Verify filtering performance in All Assessments
- [ ] Test image loading performance

## Security Checklist

- [ ] Firebase Security Rules are properly configured
- [ ] User roles are stored securely in Firestore
- [ ] Role changes require admin privileges
- [ ] Image access is properly restricted
- [ ] No sensitive data is exposed in client-side code
- [ ] Authentication tokens are handled securely
- [ ] Route protection works at all levels

## Common Issues and Solutions

### Issue 1: User Profile Not Loading
**Symptoms**: Role-based navigation fails, user stuck on loading
**Solution**: Check Firebase connection, verify user document exists

### Issue 2: Unauthorized Access
**Symptoms**: Users can access routes they shouldn't
**Solution**: Verify RoleGuard implementation, check route protection

### Issue 3: Data Not Filtering Correctly
**Symptoms**: Staff sees other users' data, admin doesn't see all data
**Solution**: Check Firestore queries, verify security rules

### Issue 4: Image Upload Failures
**Symptoms**: Images don't upload, storage errors
**Solution**: Check Firebase Storage rules, verify authentication

## Test Data Cleanup

After testing:
- [ ] Remove test user accounts
- [ ] Clean up test assessments
- [ ] Remove test images from storage
- [ ] Reset any modified user roles

## Automated Testing Considerations

For future implementation:
- Unit tests for role checking functions
- Integration tests for authentication flow
- E2E tests for complete user journeys
- Security tests for unauthorized access attempts
