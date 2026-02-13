

# Deploy QR Dine Pro to Vercel

## What Will Happen
Your app will be deployed to Vercel with all routes working correctly. Since this is a React SPA (Single Page Application), we need a `vercel.json` config to ensure all routes like `/admin/login`, `/super-admin/login`, `/login`, etc. don't return 404 errors on direct access or page refresh.

## Route Summary

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Staff login (Kitchen, Waiter, Billing) |
| `/admin/login` | Restaurant Admin login |
| `/super-admin/login` | Platform Super Admin login |
| `/admin` | Admin Dashboard |
| `/super-admin` | Super Admin Dashboard |
| `/kitchen` | Kitchen Dashboard |
| `/waiter` | Waiter Dashboard |
| `/billing` | Billing Counter |
| `/order` | Customer Menu (via QR) |
| `/feedback` | Feedback Page |

## Steps

### 1. Create `vercel.json`
Add a rewrite rule so all routes fall back to `index.html` (required for client-side routing with React Router):

```text
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 2. Deploy to Vercel
Use the Vercel deployment tool to push the project live.

### 3. Share URLs
Once deployed, all these URLs will work:
- `https://your-domain.vercel.app/login` -- Staff login
- `https://your-domain.vercel.app/admin/login` -- Admin login
- `https://your-domain.vercel.app/super-admin/login` -- Super Admin login

## Technical Notes
- Vite builds the app as a static SPA -- Vercel serves it as static files
- The `vercel.json` rewrite ensures deep links and page refreshes work on all routes
- No server-side rendering needed -- React Router handles all routing client-side

