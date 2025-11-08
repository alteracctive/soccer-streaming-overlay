const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execFile, exec } = require('child_process');
const express = require('express'); // <-- New
const cors = require('cors'); // <-- New

let backendProcess = null;
let mainWindow = null;
let overlayServer = null; // <-- New
const OVERLAY_PORT = 8001; // <-- New

const isDev = !app.isPackaged;

function startBackend() {
  const backendName = 'soccer-streaming-backend.exe';
  const backendDir = isDev
    ? path.join(__dirname, 'resources')
    : path.join(process.resourcesPath, 'resources');
  
  const backendPath = path.join(backendDir, backendName);

  console.log(`Starting backend at: ${backendPath}`);
  
  const options = { cwd: backendDir };

  backendProcess = execFile(backendPath, options, (error, stdout, stderr) => {
    if (error) {
      console.error(`execFile error: ${error}`);
    }
    if (stdout) console.log(`Backend stdout: ${stdout}`);
    if (stderr) console.error(`Backend stderr: ${stderr}`);
  });

  if (backendProcess) {
    console.log(`Backend process started with PID: ${backendProcess.pid}`);
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });
    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend ERR: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
  }
}

// --- New Function to Start Overlay Server ---
function startOverlayServer() {
  const app = express();
  app.use(cors());
  
  // Find the static files
  const staticPath = path.join(__dirname, 'dist');
  
  // Serve the 'overlay' folder and all its assets
  app.use(express.static(staticPath));
  
  // Start the server
  overlayServer = app.listen(OVERLAY_PORT, () => {
    console.log(`Overlay server listening at http://localhost:${OVERLAY_PORT}`);
  }).on('error', (err) => {
    console.error('Failed to start overlay server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the control panel file directly
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  startBackend();
  startOverlayServer(); // <-- New
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  // Kill backend
  if (backendProcess) {
    console.log(`Killing backend process with PID: ${backendProcess.pid}`);
    if (process.platform === 'win32') {
      exec(`taskkill /PID ${backendProcess.pid} /T /F`);
    } else {
      process.kill(-backendProcess.pid, 'SIGKILL');
    }
    backendProcess = null;
  }
  
  // --- New: Stop overlay server ---
  if (overlayServer) {
    console.log('Stopping overlay server...');
    overlayServer.close();
    overlayServer = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});