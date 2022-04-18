import React, { forwardRef } from "react";

import BranchPri from "../../assets/BranchPri.svg";
import RepoIssuesPri from "../../assets/RepoIssuesPri.svg";
import RepoPRPri from "../../assets/RepoPRPri.svg";
import RepoActionsPri from "../../assets/RepoActionsPri.svg";


const BranchCard = forwardRef(({ active, branchName, handleCardClick, pullRequest = false, issues = false, actions = false, shouldScroll = true }, ref) =>  {
  // const card = useRef(null);

  // useEffect(() => {
  //   if (active) {
  //     card.current.classList.add("active");
  //     if(shouldScroll) card.current.scrollIntoView();
  //   } else if (card.current && card.current.classList.contains("active") > -1) {
  //     card.current.classList.remove("active");
  //   }
  //   // return card.current;
  // });

  const getIcon = () => {
      if(pullRequest) return <RepoPRPri/>
      else if(issues) return <RepoIssuesPri/>
      else if(actions) return <RepoActionsPri/>
      else return <BranchPri/>
  }

  return (
    <div
      className={`card-branch-wrapper ${active? "active" : ""}`}
      ref={ref}
      onClick={() => handleCardClick()}
    >
        <div className="card-type svg">{getIcon()}</div>
        <p className="card-content-branch">{branchName}</p>
    </div>
  );
})
export default BranchCard
