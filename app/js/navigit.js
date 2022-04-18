import parse from "parse-link-header";
import parallel from "async-await-parallel";
import axios from "axios";
import { difference } from "lodash";
class Navigit {
  constructor(git, store, authKey) {
    this.git = git;
    this.store = store;
    this.authKey = authKey;
    this.localDump = { repos: {}, pr: {}, issues: {} };
  }

  repoSet(key, value) {
    this.localDump["repos"][key] = value;
  }

  prSet(key, value) {
    this.localDump["pr"][key] = value;
  }

  issueSet(key, value) {
    this.localDump["issues"][key] = value;
  }

  async fetchUserReposV2(page, since = undefined, response) {
    try {
      if (!response) {
        let payload;
        if (since) {
          payload = { page, per_page: 100, since };
        } else {
          payload = { page, per_page: 100 };
        }
        response = await this.git.request("GET /user/repos", payload);
      }
      const { data } = response;
      for (let repo of data) {
        this.repoSet(repo.full_name, {
          name: repo.name,
          isOwnedByUser: repo.owner.type === "Organization" ? false : true,
          url: repo.html_url,
          ownedBy: repo.full_name.split("/")[0],
          pr: `${repo.html_url}/pulls`,
          key: repo.full_name,
          private: repo.private,
          issues: `${repo.html_url}/issues`,
        });
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  async fetchUserRepos(page = 1, since = undefined) {
    try {
      const response = await this.git.request("GET /user/repos", {
        page,
        per_page: 100,
        since,
      });
      const lastPage = checkLastPage(page, response);
      await this.fetchUserReposV2(page, since, response);
      if (lastPage != page) {
        const self = this;
        let tasks = [];
        for (let i = page + 1; i <= lastPage; i += 1) {
          tasks.push(async () => await self.fetchUserReposV2(i, since));
        }
        await parallel(tasks);
        return true;
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  async fetchUserOrgReposV2(org, page, response) {
    try {
      if (!response) {
        response = await this.git.request("GET /orgs/{org}/repos", {
          org: org,
          page,
          sort: "created",
          direction: "desc",
          per_page: 100,
        });
      }
      const { data } = response;
      for (let repo of data) {
        if (this.store.repoGet(repo.full_name)) {
          return false;
        }
        this.store.repoSet(repo.full_name, {
          name: repo.name,
          isOwnedByUser: repo.owner.type === "Organization" ? false : true,
          url: repo.html_url,
          ownedBy: repo.full_name.split("/")[0],
          key: repo.full_name,
          pr: `${repo.html_url}/pulls`,
          private: repo.private,
          issues: `${repo.html_url}/issues`,
        });
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  async fetchOrgRepos(org, page = 1) {
    try {
      const response = await this.git.request("GET /orgs/{org}/repos", {
        org: org,
        page,
        sort: "created",
        direction: "desc",
        per_page: 100,
      });
      const lastPage = checkLastPage(page, response);
      const notRedundant = await this.fetchUserOrgReposV2(org, page, response);
      let tasks = [];
      if (lastPage !== page) {
        const self = this;
        for (let i = page + 1; i <= lastPage; i += 1) {
          tasks.push(async () => {
            return await self.fetchUserOrgReposV2(org, i);
          });
        }
        await parallel(tasks);
        return true;
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  async fetchIssuesAndPr(page = 1, config) {
    try {
      let { role, username, isIssue } = config;
      if (!isIssue) {
        console.log("pr entry point");
      }
      const response = await this.git.request("GET /search/issues", {
        q: `${role}:${username} is:open ${
          isIssue ? "is:issue" : "is:pull-request"
        }`,
        sort: "updated",
        direction: "desc",
        per_page: 100,
        page,
      });

      for (let item of response.data.items) {
        const splitUrl = item.html_url.split("/");
        const time = await this.eventTime(item.events_url, role);
        const payload = {
          role,
          title: item.title,
          created: item.created_at,
          key: item.id,
          url: item.html_url,
          ownedBy: splitUrl[3],
          repo: splitUrl[4],
          number: splitUrl[splitUrl.length - 1],
          events: item.events_url,
          id: item.id,
          state: item.state,
          time: time || item.created_at,
        };
        if (isIssue) {
          this.issueSet(item.id, payload);
        } else {
          this.prSet(item.id, payload);
        }
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  async syncUserRepos(since = undefined) {
    try {
      this.store.set("lastSync", +new Date());
      const done = await this.fetchUserRepos(1, since);
      return true;
    } catch (e) {
      throw e;
    }
  }

  async syncUserOrgRepos() {
    this.store.set("lastSync", +new Date());
    try {
      const self = this;
      const { data } = await this.git.request("GET /user/orgs");
      const names = data.map((x) => x.login);
      if (names.length) {
        await parallel(
          names.map((x) => async () => {
            return await self.fetchOrgRepos(x);
          })
        );
        return true;
      }
    } catch (err) {
      throw err;
    }
  }

  async syncRepos(since = undefined) {
    try {
      await this.syncUserRepos(since);
      await this.syncUserOrgRepos();
      const syncDifference = difference(
        Object.keys(this.localDump["repos"]),
        Object.keys(this.store.get("repos"))
      );
      this.store.sync(this.localDump["repos"], "repos", since);
      this.localDump["repos"] = {};
      this.store.syncData();
      return syncDifference.length;
    } catch (e) {
      this.localDump["repos"] = {};
      throw e;
    }
  }

  async syncIssues() {
    this.store.set("lastSync", +new Date());
    try {
      const roles = ["author", "assignee"];
      const self = this;
      let tasks = [];
      for (let role of roles) {
        tasks.push(
          async () =>
            await self.fetchIssuesAndPr(1, {
              role,
              username: self.store.get("username"),
              isIssue: true,
            })
        );
      }
      await parallel(tasks);
      const syncDifference = difference(
        Object.keys(this.localDump["issues"]),
        Object.keys(this.store.get("issues"))
      );
      this.store.sync(this.localDump["issues"], "issues");
      this.localDump["issues"] = {};
      this.store.syncData();
      return syncDifference.length;
    } catch (e) {
      this.localDump["issues"] = {};
      throw e;
    }
  }

  async syncPR() {
    this.store.set("lastSync", +new Date());
    try {
      const roles = ["author", "review-requested", "assignee"];
      const self = this;
      let tasks = [];
      for (let role of roles) {
        tasks.push(async () => {
          await self.fetchIssuesAndPr(1, {
            role,
            username: self.store.get("username"),
            isIssue: false,
          });
          return true;
        });
      }
      await parallel(tasks);
      const syncDifference = difference(
        Object.keys(this.localDump["pr"]),
        Object.keys(this.store.get("pr"))
      );
      this.store.sync(this.localDump["pr"], "pr");
      this.localDump["pr"] = {};
      this.store.syncData();
      return syncDifference.length;
    } catch (e) {
      this.localDump["pr"] = {};
      throw e;
    }
  }

  async registerAccessToken() {
    this.store.clear();
    try {
      const response = await this.git.request("GET /user");
      const { headers, data } = response;
      let scopes = ["read:org", "repo"];
      let isPermit =
        headers["x-oauth-scopes"]
          .split(",")
          .filter((x) => ~scopes.indexOf(x.trim())).length === scopes.length;
      if (isPermit) {
        this.store.set("username", data.login);
      } else {
        return false;
      }
      return true;
    } catch (err) {
      throw "invalid_key";
    }
  }

  async initialSetup() {
    try {
      const self = this;
      await parallel([
        async function () {
          await self.syncRepos();
          return true;
        },
        async function () {
          await self.syncIssues();
          return true;
        },
        async function () {
          await self.syncPR();
          return true;
        },
      ]);
      this.store.syncData();
      return true;
    } catch (err) {
      throw err;
    }
  }

  async eventTime(url, role) {
    try {
      const event = await axios({
        method: "get",
        url: url,
        headers: {
          Authorization: `Bearer ${this.authKey}`,
          "Content-Type": "application/json",
        },
      });
      const filteredObj = event.data
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .find((x) => x === role);
      let time;
      if (filteredObj) {
        time = filteredObj.created_at;
      }
      return time;
    } catch (err) {
      throw err;
    }
  }

  async searchBranches(owner, repo) {
    const response = await this.git.request(
      "GET /repos/{owner}/{repo}/branches",
      {
        owner: owner,
        repo: repo,
        per_page: 100,
      }
    );
    const result = response.data.map((x) => x.name);
    const index = result.findIndex((x) => x === "master" || x === "main");
    if (~index) {
      result.unshift(result[index]);
      result.splice(index + 1, 1);
    }
    return result;
  }

  async search(term) {
    const res = await this.git.request("GET /search/repositories", {
      q: `${term} in:name`,
      per_page: 100,
    });
    return res.data.items.map((repo) => ({
      name: repo.name,
      isOwnedByUser: repo.owner.type === "Organization" ? false : true,
      ownedBy: repo.full_name.split("/")[0],
      url: repo.html_url,
      pr: `${repo.html_url}/pulls`,
      private: repo.private,
      issues: `${repo.html_url}/issues`,
    }));
  }
}

function checkLastPage(page, response) {
  link: '<https://api.github.com/search/issues?q=author%3Amohanpierce99+is%3Apull-request&per_page=30&page=2>; rel="next", <https://api.github.com/search/issues?q=author%3Amohanpierce99+is%3Apull-request&per_page=30&page=2>; rel="last"';
  if ("link" in response.headers) {
    const obj = parse(response.headers["link"]);
    if ("last" in obj) {
      return obj.last.page;
    }
    return false;
  } else {
    return page;
  }
}

export default Navigit;
