import React, { forwardRef, useEffect, useRef } from "react";

import PRPri from "../../assets/PRPri.svg";
import PlusOnePri from "../../assets/PlusOnePri.svg";
import MentionedPri from "../../assets/MentionPri.svg";
import OpenPri from "../../assets/OpenPri.svg";
import AssignedPri from "../../assets/IdPri.svg";
import Pending from "../../assets/Pending.svg";

const Card = forwardRef(({ data, active, handleCardClick, shouldScroll = true }, ref) => {
  const { number = 1, message, status, time, repo_name = "kq" } = data;
  // const card = useRef();

  // useEffect(() => {
  //   if (active) {
  //     card.current.classList.add("active");
  //     if(shouldScroll) card.current.scrollIntoView();
  //   } else if (card.current && card.current.classList.contains("active") > -1) {
  //     card.current.classList.remove("active");
  //   }
  //   // return card.current;
  // });

  function renderIcon() {
    if (status === "Review") {
      return <PlusOnePri />;
    } else if (status === "Assigned") {
      return <AssignedPri />;
    } else if (status === "Opened") {
      return <OpenPri />;
    } else if (status === "Mentioned") {
      return <MentionedPri />;
    }
  }

  return (
    <div
      className={`card-wrapper ${active? "active" : ""}`}
      ref={ref}
      onClick={() => handleCardClick(message)}
    >
      <div className="card-pr-type">
        <div className="card-type-icon svg"> <PRPri /></div>
        <p
          className="card-pr-type-number"
        >
          # {" " + number}
        </p>
      </div>
      <div className="card-content-pr">
        <div className="card-content-pr-repo-name">{repo_name}</div>
        <div className="card-content-pr-message">{message}</div>
        <label className="card-content-pr-status">
          <Pending />
          <p className="card-content-pr-status-message">{status}</p>
        </label>
        <p className="card-content-pr-time">{"- " + time}</p>
      </div>
      <div className="card-specification svg">{renderIcon()}</div>
    </div>
  );
})

export default Card
