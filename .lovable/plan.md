
# Fix "Failed to Fetch" Login Error

## Root Cause
The login fails because of two cascading issues:
1. **`useAuth` hook**: The `getSession()` call on mount has no `.catch()` handler. When a stale token triggers a network error, the promise rejects silently and `loading` stays `true` forever, or the auth state becomes inconsistent.
2. **`handleLogin`**: The `supabase.auth.signOut()` call tries to revoke the stale token on the server, which also fails with "Failed to fetch". Since this isn't wrapped in try/catch, it throws and prevents `signIn()` from executing.

## Fix

### 1. `src/pages/SuperAdminLogin.tsx`
- Wrap the entire `handleLogin` body in a try/catch
- Use `supabase.auth.signOut({ scope: 'local' })` instead of plain `signOut()` -- this clears localStorage tokens without making a network request to the server, avoiding the "Failed to fetch" on stale token revocation
- Catch any unexpected errors and show a user-friendly toast

### 2. `src/hooks/useAuth.ts`
- Add `.catch()` to the `getSession()` promise chain so a network failure sets `loading: false` instead of hanging
- Also add `.catch()` to the `onAuthStateChange` role-fetching `setTimeout` callback to prevent unhandled rejections

## Technical Details

**SuperAdminLogin.tsx handleLogin:**
```text
const handleLogin = async (e) => {
  e.preventDefault();
  if (!email || !password) { ... }
  setLoading(true);
  try {
    // Local-only signout avoids network call on stale token
    await supabase.auth.signOut({ scope: 'local' });
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Login Failed', description: error.message });
      setLoading(false);
      return;
    }
  } catch (err) {
    toast({ title: 'Login Failed', description: 'Network error. Please try again.' });
    setLoading(false);
  }
};
```

**useAuth.ts getSession chain:**
```text
supabase.auth.getSession()
  .then(({ data, error }) => { ... })
  .catch(() => {
    setAuthState(prev => ({ ...prev, loading: false }));
  });
```

### Files Modified
| File | Change |
|---|---|
| `src/pages/SuperAdminLogin.tsx` | Use `signOut({ scope: 'local' })` + try/catch |
| `src/hooks/useAuth.ts` | Add `.catch()` to `getSession()` promise |
