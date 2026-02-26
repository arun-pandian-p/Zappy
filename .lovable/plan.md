

# Fix "Failed to Fetch" Login Error with Auto-Retry

## Problem
The Super Admin login keeps failing with "Failed to fetch" due to temporary backend connectivity issues (pooler restarts). Each failed attempt costs a credit in frustration.

## Solution
Add robust retry logic with automatic recovery so the login succeeds even when the backend has momentary hiccups.

### Changes

**1. `src/hooks/useAuth.ts` - Add retry logic to `signIn`**
- Wrap the `signInWithPassword` call in a retry loop (up to 3 attempts)
- Wait 1.5s between retries with exponential backoff
- Only retry on network errors ("Failed to fetch"), not on wrong credentials
- This ensures transient backend restarts don't block login

**2. `src/pages/SuperAdminLogin.tsx` - Auto-retry on failure + better UX**
- If login fails with a network error, automatically retry up to 2 more times before showing the error toast
- Show a "Retrying..." state in the button instead of immediately showing an error
- Pre-fill the email field with `arun@gmail.com` as default so you don't have to type it each time
- Remove the aggressive `localStorage.clear()` before every login (it was clearing valid sessions too)

### Technical Details

```text
Login Flow (Updated):
  User clicks "Access Console"
    -> Attempt 1: signInWithPassword()
       -> If "Failed to fetch": wait 1.5s -> Attempt 2
          -> If "Failed to fetch": wait 3s -> Attempt 3
             -> If still fails: show error toast
       -> If auth error (wrong password): show error immediately
       -> If success: redirect to /super-admin
```

**Files Modified:**
- `src/hooks/useAuth.ts` (retry logic in signIn)
- `src/pages/SuperAdminLogin.tsx` (auto-retry UX, default email)

