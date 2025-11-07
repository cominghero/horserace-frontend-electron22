import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { spawn, execSync } from 'child_process';
import { createServer } from 'http';
import { readFile } from 'fs/promises';

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let backendProcess;
let frontendServer;

// Server ports
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 8000;

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

  frontendServer.listen(FRONTEND_PORT, () => {
    console.log(`Frontend server running on http://localhost:${FRONTEND_PORT}`);
  });
}

/**
 * Check if Node.js is installed on the system
 */
function checkNodeInstalled() {
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log('Node.js found:', nodeVersion);
    return true;
  } catch (error) {
    console.error('Node.js not found:', error);
    return false;
  }
}

/**
 * Show error dialog when Node.js is not found
 */
function showNodeNotFoundDialog() {
  dialog.showErrorBox(
    'Node.js Required',
    'Node.js is not installed on this system.\n\n' +
    'The Horse Racing Dashboard requires Node.js to run.\n\n' +
    'Please install Node.js from:\nhttps://nodejs.org/\n\n' +
    'For Windows 7: Download Node.js v13.14.0 (last version supporting Win 7)\n' +
    'For Windows 10: Download the LTS version\n\n' +
    'Restart the application after installation.'
  );
  app.quit();
}

/**
 * Start the Express backend server
 */
function startBackend() {
  // Check if Node.js is installed (production only)
  if (!isDev && !checkNodeInstalled()) {
    showNodeNotFoundDialog();
    return;
  }

  const backendPath = isDev
    ? join(__dirname, '..', '..', 'horseraceBackend', 'server.js')
    : join(process.resourcesPath, 'backend', 'server.js');

  console.log('Starting backend server from:', backendPath);

  backendProcess = spawn('node', [backendPath], {
    env: {
      ...process.env,
      PORT: BACKEND_PORT,
      NODE_ENV: isDev ? 'development' : 'production',
    },
    stdio: isDev ? 'inherit' : 'pipe', // Capture output in production for logging
    windowsHide: true, // Hide window on Windows
    detached: false, // Keep attached to parent process
  });

  // Log backend output in production (for debugging)
  if (!isDev && backendProcess.stdout) {
    backendProcess.stdout.on('data', (data) => {
      console.log('[Backend]', data.toString());
    });
  }

  if (!isDev && backendProcess.stderr) {
    backendProcess.stderr.on('data', (data) => {
      console.error('[Backend Error]', data.toString());
    });
  }

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error);
    if (!isDev) {
      dialog.showErrorBox(
        'Backend Error',
        'Failed to start the backend server.\n\n' +
        'Error: ' + error.message + '\n\n' +
        'Please check that Node.js is properly installed.'
      );
    }
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0 && code !== null && !isDev) {
      dialog.showErrorBox(
        'Backend Stopped',
        `The backend server stopped unexpectedly (exit code: ${code}).\n\n` +
        'The application may not function properly.\n\n' +
        'Please restart the application.'
      );
    }
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
  // Start servers
  startBackend();

  if (!isDev) {
    // In production, start frontend server
    startFrontendServer();
  }

  // Wait a moment for servers to start, then create window
  setTimeout(createWindow, 2000);

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

// Example: Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Example: Get app path
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// Check if backend is ready
ipcMain.handle('check-backend-health', async () => {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
});
