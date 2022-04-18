import React, { useEffect, useRef, useState } from "react";

import Git from "../../assets/Git.svg";
import GitHover from "../../assets/GitHover.svg";
import Next from "../../assets/Next.svg";
import NextHover from "../../assets/NextHover.svg";
import Flag from "../../assets/Flag.svg";
import Pirate from "../../assets/Pirate.svg";
import Play from "../../assets/Play.svg";
import PlayHover from "../../assets/PlayHover.svg";

export default function Button({ type, text, active, eventCall }) {
  const [hover, setHover] = useState(false);

  const buttonRef = useRef();

  useEffect(() => {
    if (!active) {
      buttonRef.current.disabled = true;
    } else {
      buttonRef.current.disabled = false;
    }

    return () => {
      if (buttonRef.current) {
        buttonRef.current.disabled = false;
      }
    };
  }, [active]);

  if (type === "Git") {
    return (
      <button
        onMouseLeave={() => setHover(false)}
        onMouseEnter={() => setHover(true)}
        onClick={() => eventCall()}
        ref={buttonRef}
        className="button"
      >
        <label>{hover ? <GitHover /> : <Git />}</label>
        <p style={{ color: active ? "white" : "#adadb5", marginLeft: "0.5em" }}>
          {text}
        </p>
        <div style={{width: '10px'}}></div>
      </button>
    );
  }

  if (type === "Finish") {
    return (
      <button
        onMouseLeave={() => setHover(false)}
        onMouseEnter={() => setHover(true)}
        onClick={() => eventCall()}
        ref={buttonRef}
        className={active ? "button-finish" : "button-finish-disable"}
      >
        {active ? (
          <label>{hover ? <NextHover /> : <Next />}</label>
        ) : (
          <label>{<NextHover />}</label>
        )}
        <p style={{ color: active ? "white" : "#adadb5", fontSize: "25px" }}>
          {text}
        </p>
        {text === "Finish" && (
          <label>
            <Flag />
          </label>
        )}
      </button>
    );
  }

  if (type === "Tour") {
    return (
      <button
        onMouseLeave={() => setHover(false)}
        onMouseEnter={() => setHover(true)}
        onClick={() => eventCall()}
        ref={buttonRef}
        className="button-tour"
      >
        <label>{hover ? <PlayHover /> : <Play />}</label>
        <p style={{ color: active ? "white" : "#adadb5", fontSize: "25px" }}>
          {text}
        </p>
        <div style={{width: '10px'}}></div>
      </button>
    );
  }

  if (type === "Help") {
    return (
      <button
        onMouseLeave={() => setHover(false)}
        onMouseEnter={() => setHover(true)}
        onClick={() => eventCall()}
        ref={buttonRef}
        className="button-help"
      >
        {hover ? <NextHover /> : <Next />}

        <p style={{ color: active ? "white" : "#adadb5", fontSize: "25px" }}>
          {text}
        </p>
        <label>
          <Pirate />
        </label>
      </button>
    );
  }

  return (
    <button
      onClick={() => eventCall()}
      ref={buttonRef}
      className={
        text === "Continue"
          ? active
            ? "button-continue-active"
            : "button-continue"
          : "button"
      }
    >
      {text}
    </button>
  );
}
