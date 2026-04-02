import { app, BrowserWindow, dialog, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import getPort from 'get-port';
import path from 'path';
import { ChildProcess, fork } from 'child_process';

// ── Disable GPU sandbox issues on Linux ───────────────────────────────────────
app.commandLine.appendSwitch('no-sandbox');

let mainWindow: BrowserWindow | null = null;
let beProcess: ChildProcess | null = null;
let serverPort: number;

// ─── Resolve BE bundle path ────────────────────────────────────────────────────
function getBeBundlePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'be-bundle.cjs');
  }
  return path.join(__dirname, '..', 'dist', 'be-bundle.cjs');
}

// ─── Start the embedded Express server ────────────────────────────────────────
async function startBackend(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const bundlePath = getBeBundlePath();
    let settled = false;

    const finishResolve = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const finishReject = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    beProcess = fork(bundlePath, [], {
      env: {
        ...process.env,
        PORT: String(port),
        ELECTRON_RESOURCES_PATH: process.resourcesPath ?? path.dirname(bundlePath),
        ELECTRON_STATIC_DIR: app.isPackaged
          ? path.join(process.resourcesPath, 'public')
          : path.join(process.cwd(), 'be', 'public'),
        NODE_ENV: app.isPackaged ? 'production' : 'development',
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });

    beProcess.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      console.log('[BE]', msg);
      // Resolve once server signals it's ready
      if (msg.includes('running on')) finishResolve();
    });

    beProcess.stderr?.on('data', (data: Buffer) => {
      console.error('[BE ERROR]', data.toString().trim());
    });

    beProcess.on('error', finishReject);
    beProcess.on('exit', (code, signal) => {
      finishReject(new Error(`Embedded backend exited before startup (code: ${code ?? 'null'}, signal: ${signal ?? 'null'})`));
    });

    // Fallback resolve after 5 s only if the process is still alive and stdout signal was missed.
    setTimeout(() => {
      const currentProcess = beProcess;
      if (currentProcess && currentProcess.exitCode == null && !currentProcess.killed) {
        finishResolve();
      }
    }, 5000);
  });
}

// ─── Create the browser window ────────────────────────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'Nhạc',
  });

  mainWindow.loadURL(`http://localhost:${serverPort}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Auto updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Cập nhật sẵn sàng',
        message: `Phiên bản ${info.version} đã tải về. Khởi động lại ứng dụng để cài đặt?`,
        buttons: ['Khởi động lại', 'Để sau'],
      })
      .then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err.message);
  });

  // Check for updates 3 seconds after app is ready (non-blocking)
  setTimeout(() => {
    if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Handle preload IPC
  ipcMain.handle('get-app-version', () => app.getVersion());

  try {
    serverPort = await getPort({ port: 3001 });
    await startBackend(serverPort);
    createWindow();
    setupAutoUpdater();
  } catch (err) {
    console.error('Failed to start app:', err);
    dialog.showErrorBox('Lỗi khởi động', String(err));
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  beProcess?.kill();
  beProcess = null;
});
