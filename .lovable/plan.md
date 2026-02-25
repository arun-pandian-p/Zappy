

# Fix Super Admin Login — "Failed to Fetch" Error

## Problem
The login page has a stale/expired session stored in localStorage. The browser keeps trying to refresh this dead token, flooding requests that all fail with "Failed to fetch". When you try to sign in fresh, the same stale session interferes.

## Solution
Clear any existing stale session before attempting a new login. Two changes:

### 1. `src/pages/SuperAdminLogin.tsx`
- Import `supabase` client directly
- In `handleLogin`, call `supabase.auth.signOut()` before `signIn()` to clear any stale tokens from localStorage
- This ensures a clean authentication attempt every time

### 2. `src/hooks/useAuth.ts`
- Add error handling in the `getSession` flow so that if the initial session refresh fails (stale token), it clears the loading state instead of hanging forever

## Technical Details

In `handleLogin`:
```text
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  // Clear any stale session first
  await supabase.auth.signOut();
  const { error } = await signIn(email, password);
  ...
};
```

In `useAuth.ts` initial session check:
```text
supabase.auth.getSession().then(({ data, error }) => {
  if (error || !data.session) {
    setAuthState(prev => ({ ...prev, loading: false }));
    return;
  }
  // ... existing role fetch logic
});
```

### Files Modified
| File | Change |
|---|---|
| `src/pages/SuperAdminLogin.tsx` | Add stale session cleanup before login |
| `src/hooks/useAuth.ts` | Handle getSession errors gracefully |

