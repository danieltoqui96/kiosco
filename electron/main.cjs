const { app, BrowserWindow, Menu, dialog } = require('electron');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

let mainWindow;
let logFile;
const BACKUP_RETENTION_DAYS = 30;

app.setName('Inventario');

function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  console.log(message);
  if (!logFile) return;
  try {
    fs.appendFileSync(logFile, line);
  } catch {
    // Logging must never prevent the app from opening.
  }
}

function getDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pruneOldBackups(backupsDir) {
  const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  for (const entry of fs.readdirSync(backupsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !/^inventario-\d{4}-\d{2}-\d{2}\.sqlite$/.test(entry.name)) {
      continue;
    }

    const fullPath = path.join(backupsDir, entry.name);
    const stats = fs.statSync(fullPath);
    if (stats.mtimeMs < cutoff) {
      fs.unlinkSync(fullPath);
      log(`Old backup removed: ${fullPath}`);
    }
  }
}

function ensureDailyBackup() {
  const dataDir = process.env.KIOSCO_DATA_DIR;
  if (!dataDir) return;

  const databasePath = path.join(dataDir, 'kiosco.sqlite');
  if (!fs.existsSync(databasePath)) {
    log('No database found yet; backup skipped');
    return;
  }

  const backupsDir = path.join(dataDir, 'backups');
  fs.mkdirSync(backupsDir, { recursive: true });

  const backupPath = path.join(backupsDir, `inventario-${getDateStamp()}.sqlite`);
  if (fs.existsSync(backupPath)) {
    log(`Daily backup already exists: ${backupPath}`);
    pruneOldBackups(backupsDir);
    return;
  }

  fs.copyFileSync(databasePath, backupPath);
  log(`Daily backup created: ${backupPath}`);
  pruneOldBackups(backupsDir);
}

async function startBackend() {
  process.env.PORT = process.env.PORT || '3000';
  process.env.KIOSCO_ELECTRON = '1';
  process.env.KIOSCO_DATA_DIR = app.getPath('userData');
  logFile = path.join(process.env.KIOSCO_DATA_DIR, 'kiosco-electron.log');
  log(`Using data dir: ${process.env.KIOSCO_DATA_DIR}`);
  ensureDailyBackup();

  const backendEntry = path.join(__dirname, '..', 'backend', 'dist', 'app.js');
  log(`Starting backend: ${backendEntry}`);
  await import(pathToFileURL(backendEntry).href);
  log('Backend import completed');
}

function createWindow() {
  log('Creating main window');
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'Inventario',
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('did-finish-load', () => log('Frontend loaded'));
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => {
    log(`Frontend failed to load: ${code} ${description}`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log(`Renderer gone: ${details.reason}`);
  });
  mainWindow.on('closed', () => {
    log('Main window closed');
    mainWindow = null;
  });
}

function loadFrontend() {
  if (!mainWindow) return;

  const frontendEntry = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  log(`Loading frontend: ${frontendEntry}`);
  void mainWindow.loadFile(frontendEntry);
}

app.whenReady().then(async () => {
  try {
    Menu.setApplicationMenu(null);
    createWindow();
    await startBackend();
    loadFrontend();
  } catch (error) {
    log(`Startup error: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    dialog.showErrorBox(
      'No se pudo iniciar Kiosco',
      error instanceof Error ? error.message : String(error),
    );
    app.quit();
  }
});

app.on('before-quit', () => log('App before-quit'));

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
