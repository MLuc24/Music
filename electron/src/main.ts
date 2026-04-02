import { app, BrowserWindow, dialog, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import getPort from 'get-port';
import path from 'path';
import { ChildProcess, fork } from 'child_process';

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow: BrowserWindow | null = null;
let beProcess: ChildProcess | null = null;
let serverPort: number;

function getBeBundlePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'be-bundle.cjs');
  }

  return path.join(__dirname, '..', 'dist', 'be-bundle.cjs');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForBackendHealth(port: number, timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const healthUrl = `http://127.0.0.1:${port}/health`;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(healthUrl, { cache: 'no-store' });
      if (response.ok) return;
    } catch {
      // Backend is still starting up.
    }

    await delay(250);
  }

  throw new Error(`Embedded backend did not respond on ${healthUrl}`);
}

async function startBackend(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const bundlePath = getBeBundlePath();
    const shouldPipeLogs = !app.isPackaged;
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
        ELECTRON_RUN_AS_NODE: '1',
        PORT: String(port),
        ELECTRON_RESOURCES_PATH: process.resourcesPath ?? path.dirname(bundlePath),
        ELECTRON_STATIC_DIR: app.isPackaged
          ? path.join(process.resourcesPath, 'public')
          : path.join(process.cwd(), 'be', 'public'),
        NODE_ENV: app.isPackaged ? 'production' : 'development',
      },
      stdio: shouldPipeLogs ? ['ignore', 'pipe', 'pipe', 'ipc'] : ['ignore', 'ignore', 'ignore', 'ipc'],
    });

    if (shouldPipeLogs) {
      beProcess.stdout?.on('data', (data: Buffer) => {
        console.log('[BE]', data.toString().trim());
      });

      beProcess.stderr?.on('data', (data: Buffer) => {
        console.error('[BE ERROR]', data.toString().trim());
      });
    }

    beProcess.on('error', finishReject);
    beProcess.on('exit', (code, signal) => {
      finishReject(
        new Error(`Embedded backend exited before startup (code: ${code ?? 'null'}, signal: ${signal ?? 'null'})`),
      );
    });

    waitForBackendHealth(port).then(finishResolve).catch(finishReject);
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: '#12071f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'Nhạc',
  });

  mainWindow.loadURL(`http://localhost:${serverPort}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

  setTimeout(() => {
    if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
}

app.whenReady().then(async () => {
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
