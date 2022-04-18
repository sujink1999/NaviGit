import React, { useState } from "react";
import HomeData from "./HomeData";
import Header from "../components/Header";

export default function Sync() {
  const [isSyncing, setIsSyncing] = useState(false);

  const changeIsSyncing = (val) => {
    setIsSyncing(val)
  }

  return (
    <div className="home-container">
      <Header settings={true} from="/" sync={isSyncing} />
      <HomeData setLogoSpin={changeIsSyncing} />
    </div>
  );
}
