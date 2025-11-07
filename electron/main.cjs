const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { join, extname } = require('path');
const { spawn, execSync } = require('child_process');
const { createServer } = require('http');
const { readFile } = require('fs/promises');
const os = require('os');

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let backendProcess;
let frontendServer;
let backendReady = false;

// Server ports
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 8000;

// Windows 7 compatibility flag
const isWin7 = process.platform === 'win32' && os.release().startsWith('6.1');
const platformInfo = `${process.platform} ${os.release()}`;

/**
 * Start a simple HTTP server to serve the frontend files in production
 */
function startFrontendServer() {
  const distPath = join(__dirname, '..', 'dist');
  console.log('Starting frontend server, serving from:', distPath);

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  frontendServer = createServer(async (req, res) => {
    let filePath = join(distPath, req.url === '/' ? 'index.html' : req.url);
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      console.log('Served:', req.url);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('File not found:', filePath);
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        console.error('Error serving file:', error);
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
    }
  });

  frontendServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${FRONTEND_PORT} is already in use. Frontend server not started.`);
    } else {
      console.error('Frontend server error:', error);
    }
  });

  frontendServer.listen(FRONTEND_PORT, () => {
    console.log(`Frontend server running on http://localhost:${FRONTEND_PORT}`);
  });
}

/**
 * Check if Node.js is available
 */
function checkNodeAvailable() {
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log('Node.js version:', nodeVersion);
    
    // Extract version number
    const versionMatch = nodeVersion.match(/v(\d+\.\d+)/);
    if (versionMatch) {
      const majorMinor = versionMatch[1];
      const majorVersion = parseInt(majorMinor.split('.')[0]);
      
      if (majorVersion < 13) {
        console.error('Node.js v13.14.0+ required (for Windows 7 support), found:', nodeVersion);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Node.js not found in PATH:', error.message);
    return false;
  }
}

/**
 * Start the Express backend server with Windows 7 optimizations
 */
function startBackend() {
  // Check Node.js before starting
  if (!checkNodeAvailable()) {
    const msg = `Node.js v13.14.0 or higher is required but not found.\n\nPlease install Node.js v13.14.0 from:\nhttps://nodejs.org/en/blog/release/v13.14.0/`;
    console.error(msg);
    if (mainWindow) {
      dialog.showErrorBox('Node.js Not Found', msg);
    }
    return;
  }

  const backendPath = isDev
    ? join(__dirname, '..', '..', 'horseraceBackend', 'server.js')
    : join(process.resourcesPath, 'backend', 'server.js');

  console.log('Starting backend server from:', backendPath);
  console.log('Platform:', platformInfo);
  if (isWin7) console.log('⚠️  Windows 7 detected - applying compatibility settings');

  backendProcess = spawn('node', [backendPath], {
    env: {
      ...process.env,
      PORT: BACKEND_PORT,
      NODE_ENV: isDev ? 'development' : 'production',
      NODE_OPTIONS: isWin7 ? '--no-experimental-fetch' : '',
    },
    stdio: 'pipe', // Capture output to see errors
    windowsHide: true,
    detached: false,
  });

  // Capture stdout for debugging
  if (backendProcess.stdout) {
    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend]`, data.toString().trim());
    });
  }

  // Capture stderr for errors
  if (backendProcess.stderr) {
    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error]`, data.toString().trim());
    });
  }

  backendProcess.on('error', (error) => {
    console.error('❌ Failed to start backend:', error.message);
    const msg = `Backend server failed to start:\n\n${error.message}\n\nEnsure Node.js v14+ is installed.`;
    if (mainWindow) {
      dialog.showErrorBox('Backend Error', msg);
    }
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    backendReady = false;
    if (code !== 0) {
      const msg = `Backend process exited unexpectedly (code: ${code})`;
      console.error(msg);
      if (mainWindow && !isDev) {
        dialog.showErrorBox('Backend Crashed', msg);
      }
    }
  });

  // Wait for backend to be ready (longer delay for Windows 7)
  const startupDelay = isWin7 ? 3000 : 1000;
  setTimeout(() => {
    checkBackendHealth();
  }, startupDelay);
}

/**
 * Check if backend is running and healthy
 */
async function checkBackendHealth() {
  const maxRetries = isWin7 ? 15 : 10;  // More retries for Windows 7
  let attempts = 0;

  return new Promise((resolve) => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`, {
          timeout: isWin7 ? 3000 : 2000,  // Longer timeout for Windows 7
        });
        if (response.ok) {
          console.log('✅ Backend is healthy');
          backendReady = true;
          resolve(true);
          return;
        }
      } catch (error) {
        // Expected on first attempts
      }

      attempts++;
      if (attempts < maxRetries) {
        setTimeout(checkHealth, 500);
      } else {
        console.warn('⚠️  Backend health check failed after retries');
        resolve(false);
      }
    };

    checkHealth();
  });
}

/**
 * Create the main application window
 */
function createWindow() {
  const preloadPath = join(__dirname, 'preload.cjs');
  console.log('Preload path:', preloadPath);
  console.log('Is dev:', isDev);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false, // Allow file:// protocol to load ES modules
    },
    title: 'Horse Racing Dashboard',
    backgroundColor: '#0a0a0a',
    show: false, // Don't show until ready
    autoHideMenuBar: !isDev, // Hide menu bar in production
  });

  // Show window when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (isDev) {
    // Development: Load from Vite dev server
    mainWindow.loadURL('http://localhost:8000');

    // Open DevTools in development only
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from local HTTP server
    console.log('Loading from frontend server: http://localhost:' + FRONTEND_PORT);

    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`).catch(err => {
      console.error('Failed to load from frontend server:', err);
    });
  }

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App lifecycle events
 */

// When Electron has finished initialization
app.whenReady().then(() => {
  console.log('=== Horse Racing Dashboard Starting ===');
  console.log('Using local bundled backend');
  console.log('Platform:', platformInfo);
  console.log('Is packaged:', app.isPackaged);
  console.log('Electron version:', process.versions.electron);

  // Start the local backend server (bundled with app)
  startBackend();

  if (!isDev) {
    // In production, start frontend server
    startFrontendServer();
  }

  // Windows 7 needs more time for backend startup
  const startupDelay = isWin7 ? 3000 : 2000;
  console.log(`Waiting ${startupDelay}ms for backend to start...`);

  // Wait for servers to start, then create window
  setTimeout(createWindow, startupDelay);

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up servers on quit
app.on('before-quit', () => {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
  }
  if (frontendServer) {
    console.log('Stopping frontend server...');
    frontendServer.close();
  }
});

// Handle app quit
app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendServer) {
    frontendServer.close();
  }
});

/**
 * IPC Handlers (for communication between renderer and main process)
 */

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Get app path
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// Get system info for debugging
ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    osRelease: os.release(),
    osVersion: os.version ? os.version() : 'Unknown',
    nodeVersion: process.version,
    isWin7,
    electronVersion: process.versions.electron,
  };
});

// Check if backend is ready
ipcMain.handle('check-backend-health', async () => {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`);
    return {
      healthy: response.ok,
      ready: backendReady,
      url: `http://localhost:${BACKEND_PORT}`,
    };
  } catch (error) {
    return {
      healthy: false,
      ready: backendReady,
      error: error.message,
    };
  }
});

// Get backend status
ipcMain.handle('get-backend-status', () => {
  return {
    running: backendProcess && !backendProcess.killed,
    ready: backendReady,
    port: BACKEND_PORT,
  };
});
