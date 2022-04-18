import React, { forwardRef, useEffect, useRef } from "react";

import RepoPri from "../../assets/RepoPri.svg";
import IssuePri from "../../assets/IssuePri.svg";
import PRPri from "../../assets/PRPri.svg";
import Org from "../../assets/Org.svg";
import Branch from "../../assets/Branch.svg";
import Individual from "../../assets/Host.svg";

const RepoCard = forwardRef(({ active, data, handleCardClick, handlePRClick, handleIssuesClick, isStatic = false, shouldScroll = true, num}, ref) => {
  const { name, source, source_name } = data;
  // const card = useRef(null);

  // useEffect(() => {
  //   if (active) {
  //     card.current.classList.add("active");
  //     if(!isStatic && shouldScroll) card.current.scrollIntoView();
  //   } else if (card.current && card.current.classList.contains("active") > -1) {
  //     card.current.classList.remove("active");
  //   }
  //   // return card.current;
  // });

  function renderRepoSource(source) {
    if (source === "org") {
      return <Org />;
    }

    if (source === "branch") {
      return <Branch />;
    }

    if (source === "individual") {
      return <Individual />;
    }
  }

  return (
    <div
      className={`card-wrapper ${active? "active" : ""}`}
      ref={ref}
      onClick={() => handleCardClick(name)}
      style={
        isStatic? {
          background:'none'
        }: {}
      }
    >
      <div className="card-type svg">{<RepoPri />}</div>
      <div className="card-content-repo">
        <p className="card-content-repo-name">{name}</p>
        <label className="card-content-repo-source">
          {renderRepoSource(source)}
        </label>
        <p className="card-content-repo-source-name">{source_name}</p>
      </div>
      <div className="card-specification svg">
        <IssuePri onClick={(e) => {
            e.stopPropagation()
            if(handleIssuesClick) handleIssuesClick()
          }} />
      <PRPri onClick={(e) => {
        if (handlePRClick) {
          e.stopPropagation()
          handlePRClick()
        }
      }}/>
      </div>
    </div>
  );
})

export default RepoCard
