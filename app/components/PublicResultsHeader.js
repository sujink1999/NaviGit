import React from "react";

export default function PublicResultsHeader() {
  return (
      <div className="public-results-header">
        <div>public results</div>
        <div className="separator"></div>
      </div>
    // <div
    //   className="card-branch-wrapper"
    //   ref={card}
    //   onClick={() => handleCardClick(name)}
    //   style={
    //     isStatic? {
    //       background:'none'
    //     }: {}
    //   }
    // >
    //     <div className="card-type">{active ? <BranchSec /> : <BranchPri />}</div>
    //     <p className="card-content-branch">{branchName}</p>
    // </div>
  );
}
