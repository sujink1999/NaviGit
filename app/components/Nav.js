import React, { useState, useEffect } from "react";

import GitN from "../../assets/GitN.svg";
import Issue from "../../assets/Issue.svg";
import PR from "../../assets/PR.svg";

export default function Nav({
  currentTab,
  keyUpdate = "Repos",
  issueBadgeCount,
  prBadgeCount,
  repoBadgeCount,
  handleBadgeChange
}) {
  // const [issueBadge, setIssueBadge] = useState(issueBadgeCount);
  // const [repoBadge, setRepoBadge] = useState(repoBadgeCount);
  // const [prBadge, setPrBadge] = useState(prBadgeCount);

  const style = {
    active: {
      background: "#69CC8E",
      boxShadow: "0px 14px 50px 26px rgba(0, 0, 0, 0.3)",
      borderRadius: "52px",
      width: "100%",
      height: "90%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-evenly",
      cursor: "pointer",
      fontWeight: "700",
    },
    normal: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-evenly",
      cursor: "pointer",
    },
  };

  useEffect(() => {
    handleBadgeChange()
    // if (keyUpdate === "Issues") {
    //   handleBadgeChange("issue",0);
    // } else if (keyUpdate === "Repos") {
    //   handleBadgeChange("repo",0);
    // } else if (keyUpdate === "PRs") {
    //   handleBadgeChange("pr",0);
    // }
  }, [keyUpdate]);

  return (
    <div className="bg">
      <div
        style={keyUpdate === "Issues" ? style.active : style.normal}
        onClick={() => {
          currentTab("Issues");
          handleBadgeChange("issue",0);
        }}
      >
        <label>
          <div className="centerIcon">
            <Issue />
          </div>
        </label>
        Issues
        {issueBadgeCount !== 0 ? (
          <label>
            <div className="badge">{issueBadgeCount}</div>
          </label>
        ) : null}
      </div>
      <div
        style={keyUpdate === "Repos" ? style.active : style.normal}
        onClick={() => {
          currentTab("Repos");
          handleBadgeChange("repo",0);
        }}
      >
        <label>
          <div className="centerIcon">
            <GitN />
          </div>
        </label>
        Repos
        {repoBadgeCount !== 0 ? (
          <label>
            <div className="badge">{repoBadgeCount}</div>
          </label>
        ) : null}
      </div>
      <div
        style={keyUpdate === "PRs" ? style.active : style.normal}
        onClick={() => {
          currentTab("PRs");
          handleBadgeChange("pr",0);
        }}
      >
        <label>
          <div className="centerIcon">
            <PR />
          </div>
        </label>
        PR's
        {prBadgeCount !== 0 ? (
          <label>
            <div className="badge">{prBadgeCount}</div>
          </label>
        ) : null}
      </div>
    </div>
  );
}
