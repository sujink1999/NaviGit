import path from "path";
import fs from "fs";
const { remote } = window.require("electron");

class Store {
  constructor(opts = {}) {
    this.syncData(opts);
  }

  syncData(opts = {}) {
    const userDataPath = remote.app.getPath("userData");
    opts.defaults = { username: null, repos: {}, issues: {}, pr: {} };
    this.path = path.join(userDataPath, "pref.json");
    this.data = parseDataFile(this.path, opts.defaults);
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    this.sync();
  }

  getSorted(key) {
    this.syncData();
    if (key !== "repos") {
      return Object.values(this.data[key]).sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      );
    }
    return Object.values(this.data[key]).sort((a, b) => b.visited - a.visited);
  }

  repoGet(key) {
    return this.data["repos"][key];
  }

  repoSet(key, value) {
    this.data["repos"][key] = value;
    this.registerVisited(this.data["repos"], key);
  }

  issueSet(key, value) {
    this.data["issues"][key] = value;
    this.registerVisited(this.data["issues"], key);
  }

  prSet(key, value) {
    this.data["pr"][key] = value;
    this.registerVisited(this.data["pr"], key);
  }

  issueGet(key) {
    return this.data["issues"][key];
  }

  prGet(key) {
    return this.data["pr"][key];
  }

  registerVisited(obj, key) {
    if (!("visited" in obj[key])) {
      obj[key].visited = 0;
      return;
    }
  }

  registerTime(isIssue, id, time) {
    const access = isIssue ? "issues" : "pr";
    this.data[access][id].time = time;
  }

  markVisited(branch, key) {
    if (this.data[branch][key]) {
      this.data[branch][key].visited += 1;
    }
    this.sync();
  }

  clear() {
    this.data = { username: null, repos: {}, issues: {}, pr: {} };
    this.sync();
  }

  sync(localDump, name, since) {
    if (localDump) {
      if (name == "repos") {
        if (since === undefined) {
          this.data[name] = {};
        }
        Object.keys(localDump).forEach((key) => {
          this.repoSet(key, localDump[key]);
        });
      } else if (name == "pr") {
        this.data[name] = {};
        Object.keys(localDump).forEach((key) => {
          this.prSet(key, localDump[key]);
        });
      } else if (name == "issues") {
        this.data[name] = {};
        Object.keys(localDump).forEach((key) => {
          this.issueSet(key, localDump[key]);
        });
      }
    }

    fs.writeFileSync(this.path, JSON.stringify(this.data));
    return true;
  }

  get src() {
    return this.data;
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return defaults;
  }
}

export default Store;
