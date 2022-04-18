const { ipcRenderer, contextBridge } = require("electron");

window.ipcRenderer = ipcRenderer;

contextBridge.exposeInMainWorld("Electron", {
  send: (channel, data) => {
    // allowed channels
    console.log("In preload", data);
    ipcRenderer.send(channel, data);
  },
  receive: (channel, callback) => {
    const newCallback = (_, data) => callback(data);
    ipcRenderer.on(channel, newCallback);
  },
  removeListener: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
