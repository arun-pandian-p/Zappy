
# Fresh Login System - Complete Rebuild

## Problem
The current login page has an auto-login loop that spams the backend with requests. When the backend has temporary connectivity hiccups ("Failed to fetch"), it retries endlessly, creating a bad experience.

## Solution: Clean, Manual Login System

### What Changes

**1. Rewrite `src/pages/Login.tsx` from scratch**
- Remove ALL auto-login logic (no hardcoded credentials)
- Clean email/password form with proper validation
- Google SSO button using `lovable.auth.signInWithOAuth`
- "Forgot password?" link
- Single sign-in attempt per form submit (no retry loops)
- Clear error messages for network failures vs wrong credentials
- Loading spinner only during active login attempt
- Auto-redirect if user is already authenticated (check session once, not in a loop)

**2. Rewrite `src/hooks/useAuth.ts` - Simplified**
- Remove the 3-retry loop from `signIn` -- just make one attempt and show the error
- Keep the `onAuthStateChange` listener and `getSession` initialization
- Keep role fetching from `user_roles` table
- Keep `getRouteForRole` for dashboard routing
- Remove aggressive localStorage clearing on every attempt

**3. Keep existing supporting files unchanged**
- `src/pages/ForgotPassword.tsx` - already works
- `src/pages/ResetPassword.tsx` - already works
- `src/pages/SuperAdminLogin.tsx` - redirects to `/login`
- `src/pages/TenantAdminLogin.tsx` - redirects to `/login`
- `src/App.tsx` - routes already correct

### Login Flow
1. User visits `/login`
2. If already authenticated, redirect to their dashboard immediately
3. If not, show login form
4. User enters email + password, clicks "Sign In"
5. One request to backend -- success redirects, failure shows toast error
6. Google SSO button available as alternative

### Technical Details
- No hardcoded credentials anywhere
- No auto-login on page load
- No retry loops -- single attempt, clear error feedback
- Session check on mount is a one-time `getSession()` call
- Default test account: `zappyscan@gmail.com` / `zappy1234` (user types it manually)

### Database
- No changes needed -- both super admin accounts already exist and work
- `user_roles` table has correct role assignments
