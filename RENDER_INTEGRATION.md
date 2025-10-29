# Render Backend Integration

## Summary

The Electron app has been updated to use the deployed backend on Render instead of running a local backend server.

**Backend URL:** `https://horseracebackend.onrender.com`

## Changes Made

### 1. Created API Configuration ([src/config/api.ts](src/config/api.ts))
- Centralized API URL configuration
- Points to Render backend: `https://horseracebackend.onrender.com`
- All API calls now use this configuration

### 2. Updated Components
- **ScrapeButton.tsx** - Now uses `API_BASE_URL` from config
- **ScheduleButton.tsx** - Now uses `API_BASE_URL` from config
- **Index.tsx** - Auto-refresh now uses `API_BASE_URL` from config

### 3. Updated Electron Main Process ([electron/main.cjs](electron/main.cjs))
- Disabled local backend server startup
- App now connects directly to Render backend
- Added logging to confirm remote backend usage

## Testing the Integration

### 1. Development Mode

Test locally before building:

```bash
cd "horseraceDashboard(electron 22)"
npm run electron:dev
```

### 2. Test API Connection

When the app starts:
1. Click the **"Start"** button to scrape races
2. Check browser console for API calls to `https://horseracebackend.onrender.com`
3. Data should load from Render backend

### 3. Check Logs

Logs will show:
```
=== Horse Racing Dashboard Starting ===
Using remote backend: https://horseracebackend.onrender.com
```

## Important Notes

### ⚠️ First Request May Be Slow

- Render free tier **sleeps after 15 minutes** of inactivity
- First request after sleep takes **30-60 seconds** to wake up
- Subsequent requests are fast

**User Experience:**
- Show loading indicator
- Display message: "Waking up backend server..." (optional)

### Database Persistence

- Render free tier has **ephemeral storage**
- Database resets on backend restart/redeploy
- For persistent data, upgrade backend to use:
  - PostgreSQL
  - MongoDB Atlas
  - Firebase

## Building Production App

Build the updated Electron app:

```bash
cd "horseraceDashboard(electron 22)"

# Build for Windows
npm run electron:build:win

# Or quick directory build for testing
npm run electron:build:dir
```

Output: `dist-electron/Horse Racing Dashboard Setup.exe`

## Distribution

When distributing to users:

### Advantages:
✅ **No Node.js required** on user machines
✅ **Simpler deployment** - just the Electron app
✅ **Backend updates** without redistributing app
✅ **Centralized data** if you add user accounts later

### Considerations:
⚠️ **Requires internet connection**
⚠️ **Backend must stay online** (use UptimeRobot to keep awake)
⚠️ **Slower first load** after inactivity

## Troubleshooting

### "Failed to fetch" Error

**Causes:**
1. No internet connection
2. Backend is sleeping (first request)
3. CORS not configured

**Solutions:**
1. Check internet connection
2. Wait 30-60 seconds and retry
3. Verify CORS is set to `*` on Render

### Data Not Loading

1. Open DevTools (F12 in app)
2. Check Network tab for API calls
3. Verify API calls go to `https://horseracebackend.onrender.com`
4. Check backend is online: visit https://horseracebackend.onrender.com/api/health

### Backend Timeout

If scraping takes too long:
- Render free tier has 120-second timeout
- Complex scraping may need optimization
- Consider upgrading Render plan

## Monitoring

### Check Backend Health

Visit: https://horseracebackend.onrender.com/api/health

Should return:
```json
{
  "status": "Backend is running"
}
```

### Keep Backend Awake (Optional)

Use a service like **UptimeRobot**:
1. Sign up at https://uptimerobot.com (free)
2. Add monitor for: `https://horseracebackend.onrender.com/api/health`
3. Check every 10 minutes
4. Keeps backend warm 24/7

## Reverting to Local Backend

If needed, revert by:

1. Uncomment in `electron/main.cjs`:
```javascript
startBackend(); // Uncomment this line
```

2. Update `src/config/api.ts`:
```javascript
export const API_BASE_URL = 'http://localhost:5000';
```

## Next Steps

- ✅ Test the app in development mode
- ✅ Build production version
- ✅ Distribute to users
- ✅ Consider adding backend monitoring
- ✅ Plan for database persistence if needed
