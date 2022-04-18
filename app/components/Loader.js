import React from "react";
import BarLoader from "react-spinners/BarLoader";


export default function Loader({text}) {

  return (
      <>
        <div className="loader">
            <BarLoader width="90%" height="6px" color="#69CC8E" speedMultiplier="0.5" css="background-color : #232143; border-radius:3px; align-self : center; margin : 0 auto;"/>
        </div>
        <div className="loader-text">{text}</div>
        </>

  );
}