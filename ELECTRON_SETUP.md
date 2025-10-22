# Electron Setup Guide - Horse Racing Dashboard

This guide will help you set up, develop, and build the Horse Racing Dashboard as a Windows desktop application using Electron.

## Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Windows 7/10/11 (for testing and building)

## Installation

### 1. Install Frontend Dependencies

```bash
cd horseraceDashboard
npm install
```

This will install all dependencies including:
- `electron` - Desktop application framework
- `electron-builder` - Packaging and distribution
- `electron-is-dev` - Development/production detection
- `concurrently` - Run multiple commands
- `wait-on` - Wait for server to start

### 2. Install Backend Dependencies

```bash
cd ../horseraceBackend
npm install
```

## Development Mode

To run the application in development mode with hot-reload:

```bash
cd horseraceDashboard
npm run electron:dev
```

This command will:
1. Start the Vite dev server (React frontend) on port 8000
2. Wait for the dev server to be ready
3. Launch Electron with the backend server
4. Open DevTools automatically

### What Happens in Dev Mode:
- Frontend runs on `http://localhost:8000` (Vite dev server)
- Backend runs on `http://localhost:5000` (Express server)
- Electron creates a window pointing to the Vite dev server
- Hot Module Replacement (HMR) works for frontend changes
- Backend auto-restarts on changes (if using nodemon)

## Building for Production

### Build Desktop Application

```bash
cd horseraceDashboard
npm run electron:build:win
```

This creates a Windows installer in `horseraceDashboard/release/` folder.

### Build Options:

1. **Full Windows Build** (Installer + Portable)
   ```bash
   npm run electron:build:win
   ```
   Creates:
   - `Horse Racing Dashboard-1.0.0-x64.exe` (NSIS Installer)
   - `Horse Racing Dashboard-1.0.0-portable.exe` (Portable version)

2. **Build for Testing** (unpacked directory)
   ```bash
   npm run electron:build:dir
   ```
   Creates an unpacked directory for quick testing without installation.

3. **Standard Build** (all platforms configured)
   ```bash
   npm run electron:build
   ```

## Output Files

After building, check the `release/` folder:

```
release/
├── Horse Racing Dashboard-1.0.0-x64.exe          # NSIS Installer (recommended)
├── Horse Racing Dashboard-1.0.0-portable.exe     # Portable executable
└── win-unpacked/                                  # Unpacked app files (for testing)
```

### Installer Types:

1. **NSIS Installer** (`-x64.exe`)
   - Professional Windows installer
   - User can choose installation directory
   - Creates desktop and start menu shortcuts
   - Supports uninstallation
   - Best for distribution

2. **Portable** (`-portable.exe`)
   - Single executable file
   - No installation required
   - Runs from any folder
   - Good for USB drives or testing

## Architecture

### File Structure

```
horseraceDashboard/
├── electron/
│   ├── main.js              # Electron main process (window creation, backend startup)
│   ├── preload.js           # Security bridge (contextBridge)
│   └── prepare-backend.js   # Backend preparation script
├── src/                     # React frontend source
├── dist/                    # Built frontend (after npm run build)
├── build/
│   └── icon.ico            # Windows application icon
├── release/                 # Built installers (after electron:build)
├── package.json            # Dependencies and build configuration
└── vite.config.ts          # Vite build configuration
```

### How It Works

1. **Main Process** (`electron/main.js`):
   - Creates the browser window
   - Starts the Express backend server as a child process
   - Handles window lifecycle
   - Cleans up backend on app close

2. **Renderer Process** (React App):
   - Runs in the Electron window
   - Makes API calls to `http://localhost:5000`
   - No changes needed from web version!

3. **Backend Process** (Express):
   - Starts automatically with Electron
   - Runs on port 5000 (localhost only)
   - Bundled with the app in production

### Communication Flow

```
User Interface (React)
    ↓ HTTP Fetch
Backend API (Express on :5000)
    ↓ Web Scraping
Sportsbet.com.au
    ↓ Data
LowDB (db.json)
    ↓ JSON Response
React Components
```

## Configuration

### App Details

Edit in `package.json`:

```json
{
  "name": "horse-racing-dashboard",
  "version": "1.0.0",
  "description": "Horse Racing Dashboard - Desktop Application",
  "author": "Your Name",
  "build": {
    "appId": "com.horseracing.dashboard",
    "productName": "Horse Racing Dashboard"
  }
}
```

### Window Settings

Edit in `electron/main.js`:

```javascript
const mainWindow = new BrowserWindow({
  width: 1400,        // Window width
  height: 900,        // Window height
  minWidth: 1024,     // Minimum width
  minHeight: 768,     // Minimum height
  // ...
});
```

### Build Configuration

The `build` section in `package.json` controls electron-builder:

```json
"build": {
  "files": [
    "dist/**/*",           // Frontend build
    "electron/**/*",       // Electron files
    "package.json"
  ],
  "extraResources": [
    {
      "from": "../horseraceBackend",
      "to": "backend",
      "filter": ["**/*", "!node_modules/**/*", "!logs/**/*"]
    }
  ],
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico"
  }
}
```

## Custom Icons

### Creating Windows Icons

1. Create a 256x256px PNG icon
2. Convert to `.ico` format using online tools:
   - https://convertio.co/png-ico/
   - https://icoconvert.com/

3. Replace `build/icon.ico` with your custom icon

### Icon Sizes for .ico File:

Include these sizes in the .ico file:
- 16x16
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

## Troubleshooting

### Backend Not Starting

**Symptom:** Frontend loads but API calls fail

**Solution:**
1. Check if backend port 5000 is already in use
2. View console logs in DevTools (Ctrl+Shift+I)
3. Ensure backend dependencies are installed

### White Screen on Launch

**Symptom:** Electron window shows white screen

**Solution:**
1. Open DevTools (Ctrl+Shift+I) to check for errors
2. Ensure `npm run build` was successful
3. Check `base: './'` in `vite.config.ts`

### Build Fails

**Symptom:** electron-builder fails during build

**Solution:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Ensure no other Electron instance is running
4. Check Windows Defender isn't blocking the build

### Backend Database Issues

**Symptom:** Data not persisting between app launches

**Solution:**
1. Check backend logs in the console
2. Ensure `db.json` has write permissions
3. Check if backend is running in correct directory

## Environment Variables

### Development

Create `.env` in `horseraceBackend/`:

```env
PORT=5000
NODE_ENV=development
```

### Production

The backend automatically uses production settings when bundled with Electron.

## Updating the Application

### Auto-Update Support

To add auto-update functionality:

1. Install additional dependencies:
   ```bash
   npm install electron-updater
   ```

2. Configure code signing (required for auto-updates)
3. Set up a release server or use GitHub Releases
4. Implement update checking in `electron/main.js`

See: https://www.electron.build/auto-update

## Distribution

### Distributing to Users

1. **NSIS Installer** (Recommended):
   - Upload `Horse Racing Dashboard-1.0.0-x64.exe` to download server
   - Users download and run installer
   - App installs to `C:\Program Files\Horse Racing Dashboard`

2. **Portable Version**:
   - Upload `Horse Racing Dashboard-1.0.0-portable.exe`
   - Users can run directly without installation
   - Good for users without admin rights

### Minimum Requirements:

- Windows 7 SP1 or later (64-bit)
- 4 GB RAM minimum
- 200 MB free disk space
- Internet connection (for scraping)

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Run Vite dev server only (web mode) |
| `npm run build` | Build React app for production |
| `npm run electron:dev` | Run Electron in development mode |
| `npm run electron:build` | Build Electron app (all configured targets) |
| `npm run electron:build:win` | Build for Windows only |
| `npm run electron:build:dir` | Build unpacked directory for testing |
| `npm run lint` | Run ESLint |

## Performance Tips

1. **Reduce Bundle Size**:
   - Tree-shaking is enabled by default
   - Code splitting configured in `vite.config.ts`

2. **Faster Builds**:
   - Use `npm run electron:build:dir` for testing
   - Only build full installers for releases

3. **Memory Optimization**:
   - Limit number of concurrent API calls
   - Implement data pagination for large datasets

## Security

### Current Security Setup:

- ✅ Context Isolation enabled
- ✅ Node Integration disabled
- ✅ Sandbox enabled
- ✅ Preload script for safe IPC
- ✅ Backend runs on localhost only

### Best Practices:

1. Never disable `contextIsolation`
2. Keep `nodeIntegration` disabled
3. Use IPC for Electron API access
4. Validate all user input
5. Keep Electron updated

## Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Test in dev mode (`npm run electron:dev`)
3. ⬜ Replace placeholder icon in `build/icon.ico`
4. ⬜ Build for production (`npm run electron:build:win`)
5. ⬜ Test installer on clean Windows machine
6. ⬜ Distribute to users

## Support

For issues or questions:
- Check Electron docs: https://www.electronjs.org/docs
- Check electron-builder docs: https://www.electron.build/
- Check Vite docs: https://vitejs.dev/

## License

Same as your main application license.
