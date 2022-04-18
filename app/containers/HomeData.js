import React, { useEffect, useState, useRef, memo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Octokit } from "@octokit/core";
import Store from "../js/store";
import Navigit from "../js/navigit";
import moment from "moment";
import Fuse from "fuse.js";

import Nav from "../components/Nav";
import RepoCard from "../components/RepoCard";
import BranchCard from "../components/BranchCard";
import PRCard from "../components/PRCard";
import IssueCard from "../components/IssueCard";
import PublicResultsHeader from "../components/PublicResultsHeader";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

import { useHistory } from "react-router-dom";

const { ipcRenderer } = window.require("electron");

const tabs = ["Repos", "PRs", "Issues"];
const store = new Store();

let token = JSON.parse(localStorage.getItem("signin"));

function areEqual(prevProps, nextProps) {
  return true;
}

export default memo(function Home({ setLogoSpin }) {
  const history = useHistory();
  const [active, setActive] = useState(tabs[0]);
  const [content, setContent] = useState([]);
  const [text, setText] = useState("");
  const [filteredContent, setFilteredContent] = useState([]);
  const [isInitialText, setIsInitialText] = useState(true);

  const isSyncing = useRef(false);

  const [filteredBranches, setFilteredBranches] = useState([]);
  const [showBranches, setShowBranches] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isPublicReposLoading, setIsPublicReposLoading] = useState(false);
  const [branches, setBranches] = useState([]);

  const [issue, setIssue] = useState(0);
  const [repo, setRepo] = useState(0);
  const [pr, setPr] = useState(0);

  const inputRef = useRef(null);
  const navigit = useRef(null);

  const [includeSearchResult, setIncludeSearchResult] = useState(0);
  const [publicRepos, setPublicRepos] = useState([]);

  //Optimizations
  const cardRefs = useRef({});
  const branchCardRefs = useRef({});
  const activeCardCursor = useRef(0);
  const activeBranchCursor = useRef(0);

  const [pageCount, setPageCount] = useState(1);
  const cardsPerPage = 15;

  useEffect(() => {
    let token = JSON.parse(localStorage.getItem("signin"));
    let pat = token ? token.authKey : "";
    const store = new Store();

    const octo = new Octokit({
      auth: pat,
    });
    navigit.current = new Navigit(octo, store, pat);
  }, []);

  useEffect(() => {
    // Listening for keypress
    document.addEventListener("keydown", handleKeyPress);
    ipcRenderer.on("hide", () => {});
    ipcRenderer.on("show", async () => {
      inputRef.current.focus();
      const since = localStorage.getItem("last_opened");
      let result;
      if (since) {
        result = await navigit.current.syncRepos(since);
      } else {
        result = await navigit.current.syncRepos();
      }
      const now = new Date().toISOString();
      localStorage.setItem("last_opened", now);
      if (result && result > 0) {
        setRepo(result);
        if (active === "Repos") {
          const repos = store.getSorted("repos");
          setContent(repos);
        }
      }
    });
    ipcRenderer.on("show-settings", () => {
      history.push("/settings");
    });
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      ipcRenderer.removeAllListeners();
    };
  });

  useEffect(() => {
    clearBranches();

    if (active === "Repos") {
      const repos = store.getSorted("repos");
      console.log(repos.length);
      setContent(repos);
    } else if (active === "PRs") {
      const prs = store.getSorted("pr");
      setContent(prs);
    } else if (active === "Issues") {
      const issues = store.getSorted("issues");
      setContent(issues);
    }
    setPageCount(1);
    setText("");

    return () => {
      setContent([]);
    };
  }, [active]);

  const handleBadgeUpdate = () => {
    if (active == "Repos") {
      if (repo > 0) setRepo(0);
    } else if (active == "Issues") {
      if (issue > 0) setIssue(0);
    } else {
      if (pr > 0) setPr(0);
    }
  };

  // Debouncing text box
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitialText) {
        setIsInitialText(false);
      } else if (active === "Repos" && text.includes(":")) {
        if (!showBranches) {
          selectBranchCard(0);
          setShowBranches(true);
          if (branches.length > 0) setBranches([]);
          if (filteredBranches.length > 0) setFilteredBranches([]);
          const repo = getRepoWithCursor();
          fetchBranches(repo.ownedBy, repo.name);
        } else {
          if (branches.length == 0) {
            const repo = getRepoWithCursor();
            fetchBranches(repo.ownedBy, repo.name);
          } else filterBranches(branches);
        }
      } else {
        if (showBranches) {
          setShowBranches(false);
        } else {
          setIsLoading(true);
          filterContent();
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    if (active != "Repos" || text === "") return;
    setPublicRepos([]);
    setIsPublicReposLoading(true);
    const timer = setTimeout(() => {
      (async () => {
        const searchText = text;
        const result = await navigit.current.search(searchText);
        if (inputRef.current.value === searchText) {
          // const data = [
          //   ...filteredContent,
          //   ...result
          // ]
          setPublicRepos(result);
          setIsPublicReposLoading(false);
        } else if (inputRef.current.value === "") {
          setIsPublicReposLoading(false);
        }
      })();
    }, 400);

    return () => clearTimeout(timer);
  }, [includeSearchResult]);

  useEffect(() => {
    filterContent();
  }, [content]);

  // Sync Issues
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isSyncing.current) {
        setLogoSpin(true);
        isSyncing.current = true;
      }
      const result = await navigit.current.syncIssues();
      if (result && result > 0) {
        setIssue(result);
        if (active === "Issues") {
          const issues = store.getSorted("issues");
          setContent(issues);
        }
      }
      if (isSyncing.current) {
        setLogoSpin(false);
        isSyncing.current = false;
      }
    }, 8000);

    return () => clearInterval(interval);
  });

  // Sync PR
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isSyncing.current) {
        setLogoSpin(true);
        isSyncing.current = true;
      }
      const result = await navigit.current.syncPR();
      if (result && result > 0) {
        setPr(result);
        if (active === "PRs") {
          const prs = store.getSorted("pr");
          setContent(prs);
        }
      }
      if (isSyncing.current) {
        setLogoSpin(false);
        isSyncing.current = false;
      }
    }, 8000);

    return () => clearInterval(interval);
  });

  const getRepoWithCursor = () => {
    const i =
      activeCardCursor.current >= getPageContent().length
        ? activeCardCursor.current - getPageContent().length
        : activeCardCursor.current;
    const repo =
      activeCardCursor.current >= getPageContent().length
        ? publicRepos[i]
        : getPageContent()[i];
    return repo;
  };

  const filterBranches = (allBranches) => {
    const branchSplit = text.split(":");
    const query = branchSplit[branchSplit.length - 1];
    if (query != "") {
      const options = {
        keys: ["name"],
        threshold: 0.1,
      };
      const fuse = new Fuse(allBranches, options);
      const data = fuse.search(query).map((val) => {
        return val["item"];
      });
      setFilteredBranches(data);
      if (data.length > 0) {
        selectBranchCard(3);
      } else {
        selectBranchCard(0);
      }
    } else {
      setFilteredBranches(allBranches);
      selectBranchCard(0);
    }
  };

  const filterContent = () => {
    if (text != "") {
      let keys = [];
      if (active === "Repos") {
        keys = ["name", "ownedBy"];
      } else if (active === "PRs" || active === "Issues") {
        keys = ["repo", "title", "ownedBy"];
      }
      const options = {
        keys,
        threshold: 0.1,
      };
      const fuse = new Fuse(content, options);
      // Change the pattern
      const pattern = text;
      const data = fuse.search(pattern).map((val) => {
        return val["item"];
      });
      setFilteredContent(data);
      setIncludeSearchResult(includeSearchResult + 1);
    } else if (content.length != filteredContent.length) {
      setFilteredContent(content);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) {
      setPageCount(1);
      selectCard(0);
    }
  }, [filteredContent, isLoading]);

  useEffect(() => {
    if (!showBranches) selectCard(activeCardCursor.current);
  }, [showBranches]);

  const fetchBranches = async (ownedBy, name) => {
    const result = await navigit.current.searchBranches(ownedBy, name);
    if (inputRef.current.value !== text) return;
    const data = result.map((branch) => {
      return {
        name: branch,
      };
    });
    setBranches(data);
    filterBranches(data);
  };

  const clearBranches = async () => {
    if (showBranches) setShowBranches(false);
    if (branches.length > 0) setBranches([]);
    if (filteredBranches.length > 0) setFilteredBranches([]);
    const textArr = text.split(":");
    setText(textArr[0]);
  };

  const getSearchPlaceholder = () => {
    switch (active) {
      case "Repos":
        return "Type and search private and public repos";
      case "PRs":
        return "Type and search pull requests";
      case "Issues":
        return "Type and search issues";
    }
  };

  const handleKeyPress = async (e) => {
    if (e.code === "Tab") {
      e.preventDefault();
      var i = tabs.indexOf(active);
      i = (i + 1) % 3;
      setIsLoading(true);
      setActive(tabs[i]);
    } else if (e.code.includes("Arrow")) {
      // if (e.code.includes("Left")) {
      //   if(showBranches){
      //     ipcRenderer.send("open-repo", `${getRepoWithCursor().url}/tree/${filteredBranches[branchCursor]}`);
      //   }else{
      //     ipcRenderer.send("open-repo", getRepoWithCursor().issues);
      //   }
      //   markVisited()

      // } else if (e.code.includes("Right")) {
      //   if(showBranches){
      //     ipcRenderer.send("open-repo", `${getRepoWithCursor().url}/tree/${filteredBranches[branchCursor]}`);
      //   }else{
      //     ipcRenderer.send("open-repo", getRepoWithCursor().pr);
      //   }
      //   markVisited();
      // } else
      if (e.code.includes("Up")) {
        e.preventDefault();
        handleBadgeUpdate();
        if (showBranches) {
          var index =
            activeBranchCursor.current == 0
              ? filteredBranches.length + 3 - 1
              : (activeBranchCursor.current - 1) %
                (filteredBranches.length + 3);
          selectBranchCard(index);
        } else {
          if (activeCardCursor.current == 0) return;
          (activeCardCursor.current - 1) %
            (getPageContent().length + publicRepos.length);
          var index =
            (activeCardCursor.current - 1) %
            (getPageContent().length + publicRepos.length);
          // ? 0 getPageContent().length + publicRepos.length - 1
          selectCard(index);
        }
      } else if (e.code.includes("Down")) {
        handleBadgeUpdate();
        if (showBranches) {
          var index =
            (activeBranchCursor.current + 1) % (filteredBranches.length + 3);
          selectBranchCard(index);
        } else {
          var index =
            (activeCardCursor.current + 1) %
            (getPageContent().length + publicRepos.length);
          selectCard(index);
        }
      }
    } else if (e.code.includes("Enter")) {
      markVisited();
      if (showBranches) {
        let url = "";
        switch (activeBranchCursor.current) {
          case 0:
            url = `${getRepoWithCursor().pr}`;
            break;
          case 1:
            url = `${getRepoWithCursor().issues}`;
            break;
          case 2:
            url = `${getRepoWithCursor().url}/actions`;
            break;
          default:
            url = `${getRepoWithCursor().url}/tree/${
              filteredBranches[activeBranchCursor.current - 3].name
            }`;
        }
        ipcRenderer.send("open-repo", url);
      } else {
        ipcRenderer.send("open-repo", getRepoWithCursor().url);
      }
      // ipcRenderer.once("Enter-reply", (e, data) => {
      //   console.log(data, "From Main Process");
      // });
    }
  };

  const shouldShowEmptyState = () => {
    if (active == "Repos") {
      return (
        !isLoading &&
        !isPublicReposLoading &&
        publicRepos.length == 0 &&
        filteredContent.length == 0
      );
    } else {
      return !isLoading && filteredContent.length == 0;
    }
  };

  const markVisited = () => {
    if (activeCardCursor.current >= getPageContent().length) return;
    if (getPageContent()[activeCardCursor.current].key) {
      const branch =
        active === "Repos" ? "repos" : active == "PRs" ? "pr" : "issues";
      store.markVisited(branch, getPageContent()[activeCardCursor.current].key);
    }
  };

  const selectCard = (num) => {
    if (cardRefs.current[activeCardCursor.current])
      cardRefs.current[activeCardCursor.current].classList.remove("active");
    activeCardCursor.current = num;
    if (cardRefs.current[num]) {
      cardRefs.current[num].scrollIntoView();
      cardRefs.current[activeCardCursor.current].classList.add("active");
    }
  };

  const selectBranchCard = (num) => {
    if (branchCardRefs.current[activeBranchCursor.current])
      branchCardRefs.current[activeBranchCursor.current].classList.remove(
        "active"
      );
    activeBranchCursor.current = num;
    if (branchCardRefs.current[num]) {
      branchCardRefs.current[num].scrollIntoView();
      branchCardRefs.current[activeBranchCursor.current].classList.add(
        "active"
      );
    }
  };

  const getPageContent = () => {
    return filteredContent.slice(0, cardsPerPage * pageCount);
  };

  const renderCards = () => {
    // No content
    if (isLoading) {
      return <Loader text="Seaching in Github" />;
      // return (
      //   <div className="home-nocontent-wrapper">
      //     <p>We couldn't fetch you the required data</p>
      //     <p>
      //       Use <span>Cmd + Enter</span> to search{" "}
      //       {active === "Repos"
      //         ? "github in general"
      //         : active === "PRs"
      //         ? "closed PRs"
      //         : "closed issues"}
      //     </p>
      //     <p>
      //       or open <span>settings</span> and sync to update local cache.
      //     </p>
      //   </div>
      // );
    } else if (shouldShowEmptyState()) {
      return <EmptyState active={active} text={text} />;
    } else if ((active === "Repos") & showBranches) {
      const actionCards = [
        <BranchCard
          branchName="Pull requests"
          key={0}
          ref={(el) => {
            branchCardRefs.current[0] = el;
          }}
          active={activeBranchCursor.current == 0}
          handleCardClick={() => {
            selectBranchCard(0);
            ipcRenderer.send("open-repo", `${getRepoWithCursor().url}/pulls`);
          }}
          pullRequest={true}
        />,
        <BranchCard
          branchName="Issues"
          key={1}
          ref={(el) => {
            branchCardRefs.current[1] = el;
          }}
          active={activeBranchCursor.current == 1}
          handleCardClick={() => {
            selectBranchCard(1);
            ipcRenderer.send("open-repo", `${getRepoWithCursor().url}/issues`);
          }}
          issues={true}
        />,
        <BranchCard
          branchName="Actions"
          key={2}
          ref={(el) => {
            branchCardRefs.current[2] = el;
          }}
          active={activeBranchCursor.current == 2}
          handleCardClick={() => {
            selectBranchCard(2);
            ipcRenderer.send("open-repo", `${getRepoWithCursor().url}/actions`);
          }}
          actions={true}
        />,
      ];
      const branchCards = filteredBranches.map((branch, num) => {
        return (
          <BranchCard
            branchName={branch.name}
            key={num + 3}
            ref={(el) => {
              branchCardRefs.current[num + 3] = el;
            }}
            active={activeBranchCursor.current == num + 3}
            handleCardClick={() => {
              selectBranchCard(num + 3);
              ipcRenderer.send(
                "open-repo",
                `${getRepoWithCursor().url}/tree/${branch.name}`
              );
            }}
          />
        );
      });
      return [...actionCards, ...branchCards];
    } else if (active === "Repos") {
      // Repos
      return getPageContent().map((cont, num) => {
        let repo = {
          name: cont.name,
          source: cont.isOwnedByUser ? "individual" : "org",
          source_name: cont.ownedBy,
        };
        return (
          <RepoCard
            ref={(el) => {
              cardRefs.current[num] = el;
            }}
            data={repo}
            key={num}
            active={activeCardCursor.current === num}
            handleCardClick={() => {
              handleBadgeUpdate();
              selectCard(num);
              ipcRenderer.send("open-repo", cont.url);
            }}
            handleIssuesClick={() => {
              ipcRenderer.send("open-repo", cont.issues);
            }}
            handlePRClick={() => {
              ipcRenderer.send("open-repo", cont.pr);
            }}
          />
        );
      });
    } else if (active === "Issues") {
      //Issues
      return getPageContent().map((cont, num) => {
        let issue = {
          message: cont.title,
          status:
            cont.role === "author"
              ? "Opened"
              : cont.role === "assignee"
              ? "Assigned"
              : "Review",
          time: moment(cont.time).fromNow(),
          repo_name: cont.ownedBy + "/" + cont.repo,
        };
        return (
          <IssueCard
            data={issue}
            key={num}
            ref={(el) => {
              cardRefs.current[num] = el;
            }}
            active={activeCardCursor.current === num}
            handleCardClick={(msg) => {
              handleBadgeUpdate();
              selectCard(num);
              ipcRenderer.send("open-repo", cont.url);
            }}
          />
        );
      });
    } else if (active === "PRs") {
      // Prs
      return getPageContent().map((cont, num) => {
        let pr = {
          number: cont.number,
          message: cont.title,
          status:
            cont.role === "author"
              ? "Opened"
              : cont.role === "asignee"
              ? "Assigned"
              : "Review",
          time: moment(cont.time).fromNow(),
          repo_name: cont.ownedBy + "/" + cont.repo,
        };
        return (
          <PRCard
            data={pr}
            key={num}
            ref={(el) => {
              cardRefs.current[num] = el;
            }}
            active={activeCardCursor.current === num}
            handleCardClick={(msg) => {
              handleBadgeUpdate();
              selectCard(num);
              ipcRenderer.send("open-repo", cont.url);
            }}
          />
        );
      });
    }
  };

  const renderBranchRespository = () => {
    if (!showBranches) return;
    const repo = getRepoWithCursor();
    if (repo) {
      return (
        <RepoCard
          className="home-selected-repo"
          data={{
            name: repo.name,
            source: repo.isOwnedByUser ? "individual" : "org",
            source_name: repo.ownedBy,
          }}
          active={true}
          isStatic={true}
          handleCardClick={() => {}}
        />
      );
    } else {
      return <></>;
    }
  };

  const renderPublicRepos = () => {
    const cardsToShow = pageCount * cardsPerPage - filteredContent.length;
    if (active === "Repos" && !showBranches && cardsToShow > 0) {
      if (text != "" && isPublicReposLoading) {
        return <Loader text="Fetching public repos" />;
      } else if (publicRepos.length > 0) {
        const cards = publicRepos.slice(0, cardsToShow).map((cont, num) => {
          let repo = {
            name: cont.name,
            source: cont.isOwnedByUser ? "individual" : "org",
            source_name: cont.ownedBy,
          };
          const index = filteredContent.length + num;
          return (
            <RepoCard
              data={repo}
              key={index}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              active={activeCardCursor.current === index}
              handleCardClick={() => {
                selectCard(index);
              }}
              handleIssuesClick={() => {
                ipcRenderer.send("open-repo", cont.issues);
              }}
              handlePRClick={() => {
                ipcRenderer.send("open-repo", cont.pr);
              }}
            />
          );
        });
        return (
          <>
            <PublicResultsHeader />
            {cards}
          </>
        );
      }
    }
  };

  const onScroll = (e) => {
    console.log(
      Math.ceil(
        e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight)
      )
    );
    if (
      Math.ceil(
        e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight)
      ) < 500 &&
      filteredContent.length + (text === "" ? 0 : publicRepos.length) >
        cardsPerPage * pageCount
    ) {
      console.log(":sheeet");
      setPageCount(pageCount + 1);
    } else {
      console.log(":sheeet111");
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="home-data-container">
        <div className="home-nav">
          <Nav
            currentTab={(tab) => {
              setActive(tab);
              setIsLoading(true);
            }}
            keyUpdate={active}
            issueBadgeCount={issue}
            repoBadgeCount={repo}
            prBadgeCount={pr}
            handleBadgeChange={handleBadgeUpdate}
          />
        </div>
        <div className="home-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="home-input"
            placeholder={getSearchPlaceholder()}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            autoFocus={true}
          />
        </div>
        {renderBranchRespository()}
        <div className="home-list" onScroll={onScroll}>
          {renderCards()}
          {renderPublicRepos()}
        </div>
      </div>
    </>
  );
}, areEqual);
