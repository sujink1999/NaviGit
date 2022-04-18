import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/Header";

import Help from "./Help";
import ChangeHotkey from "../../assets/ChangeHotkey.svg";
import RetrySec from "../../assets/RetrySec.svg";
import Logout from "../../assets/Logout.svg";
import About from "../../assets/About.svg";
import Back from "../../assets/Back.svg";
import { Octokit } from "@octokit/core";
import Navigit from "../js/navigit";
import Store from "../js/store";
import { ToastContainer, toast } from "react-toastify";
import { ipcRenderer } from "electron";


export default function Settings() {
  const history = useHistory();
  const [help, setHelp] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  async function handleSync() {
    let pat = JSON.parse(localStorage.getItem("signin")).authKey;
    const store = new Store();
    const octo = new Octokit({
      auth: pat,
    });
    const navigit = new Navigit(octo, store, pat);
    try {
      setIsSyncing(true)
      await navigit.initialSetup();
      localStorage.setItem("sync", true);
      setIsSyncing(false)
      toast.success("Sync successsful", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (err) {
      toast.error("Unable to sync", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }

  if (help) {
    return (
      <Help closeTour={() => setHelp(false)} />
    )
  }

  function logout() {
    localStorage.removeItem('signin')
    localStorage.removeItem('global')
    localStorage.removeItem('sync')
    localStorage.removeItem('last_opened')
    ipcRenderer.send('clear-global-shortcut', 'val')
    const store = new Store();
    store.clear()
    history.push("/signin")
  }


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
      <div className="settings-container">
        {/*  Implement Settings toggle logic!! */}
        <Header settings={true} from="/settings" sync={isSyncing} />
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <div className="settings-back" onClick={() => { history.goBack() }}>
            <Back></Back>
            <p>Back</p>
          </div>
        </div>
        <div className="settings-content">
          <div
            className="settings-content-item"
            onClick={() => history.push({
              pathname: "/preferences",
              state: "fromSettings"
            })}
          >
            <ChangeHotkey />
            <p className="settings-text">Change HotKey Trigger</p>
          </div>
          <div className="settings-content-item" onClick={handleSync}>
            <RetrySec />
            <p className="settings-text">Sync</p>
          </div>
          <div
            className="settings-content-item"
            onClick={() => setHelp(true)}
          >
            <About />
            <p className="settings-text">Re-visit the Navigit shortcuts</p>
          </div>
          <div
            className="settings-content-item"
            onClick={logout}
          >
            <Logout />
            <p className="settings-text">Logout</p>
          </div>
        </div>
      </div>
    </>
  );
}
