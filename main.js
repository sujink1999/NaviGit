const {
  BrowserWindow,
  app,
  ipcMain,
  Tray,
  Menu,
  globalShortcut,
  screen,
  remote,
} = require("electron");
const path = require("path");
const open = require("open");
const { electron } = require("process");

let mainWindow;
let tray;
let trayX = 0, trayY = 0;
let hotKey = "CommandOrControl+B";
let isGlobalShortcutSet = false

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    height: 632,
    width: 536,
    frame: false,
    show: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(
    false,
    process.platform === "win32" ? "screen-saver" : "floating",
    1
  );
  mainWindow.setFullScreenable(false);
  mainWindow.loadFile(`${__dirname}/app/index.html`);

  // Configuring Tray
  const iconName = "Logo.png"; // Irrespective of OS png works fine
  const iconPath = path.join(__dirname, `/assets/${iconName}`);

  if (tray) tray.destroy()

  tray = new Tray(iconPath);
  tray.setToolTip("Navi~Git");

  const isMac = process.platform === "darwin";

  const trayTemplate = [
    {
      label: "Quit",
      role: "quit",
    },
    {
      label: "Settings",
      click: () => {
        // Invoke event cycle to infrom UI to trigger settings route.
        if (!mainWindow.isVisible()) {
          const yPos = parseInt((screen.getPrimaryDisplay().workAreaSize.height - 632) / 2);
          const xPos = parseInt((screen.getPrimaryDisplay().workAreaSize.width - 536) / 2);

          mainWindow.setBounds({
            x: xPos,
            y: yPos,
            width: 536,
            height: 632,
          });

          mainWindow.show();
        }
        mainWindow.webContents.send('show-settings')
      },
      accelerator: "CommandOrControl+S",
    },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(trayTemplate));

  // Configuring Application Menu
  const menuTemplate = [
    {
      label: "Navi~Git",
      submenu: [
        {
          role: "quit",
        },
      ],
    },
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "View",
      submenu: [{ role: "toggleDevTools" }],
    },

    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));



  // Tray event handlers
  tray.on("click", (events, bound) => {
    const { x, y } = bound;
    trayX = x;
    trayY = y;
    console.log("tray clicked", bound)

    // Toggling Visibility
    toggleView();
  });

  // Close when focus is outside
  mainWindow.on("blur", (event, bound) => {
    event.preventDefault()
    if (isGlobalShortcutSet) {
      mainWindow.webContents.send('hide')
      mainWindow.hide();
      process.platform === "darwin" && app.dock.show();
    }
  });
});

function toggleView() {
  let x = trayX;
  let y = trayY;
  console.log(x, y)

  const { height, width } = mainWindow.getBounds();
  if (mainWindow.isVisible()) {
    mainWindow.webContents.send('hide')
    mainWindow.hide();
  } else {
    const yPos = parseInt((screen.getPrimaryDisplay().workAreaSize.height - 632) / 2);
    const xPos = parseInt((screen.getPrimaryDisplay().workAreaSize.width - 536) / 2);

    mainWindow.setBounds({
      x: xPos,
      y: yPos,
      width: 536,
      height: 632,
    });

    mainWindow.webContents.send('show')
    mainWindow.show();
  }
}

// Handle IPC
ipcMain.on("open-repo", async (event, data) => {
  console.log(data, "Inside Electron");
  await open(data);
  // event.reply("Enter-reply", "Gotcha");
});

ipcMain.on("global-shortcut", (event, data) => {
  globalShortcut.unregisterAll()
  // Setting up Global Shortcuts
  globalShortcut.register(data, () => {
    toggleView();
  });
  isGlobalShortcutSet = true
})

ipcMain.on("clear-global-shortcut", (event, data) => {
  console.log("clear global")
  globalShortcut.unregisterAll()
  isGlobalShortcutSet = false
})

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})