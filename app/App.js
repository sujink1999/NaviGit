import React, { useEffect, useState } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import Home from "./containers/Home";
import Preferences from "./containers/Preferences";
import SignIn from "./containers/SignIn";
import Sync from "./containers/Sync";
import Settings from "./containers/Settings";
import Pat from "./containers/Pat";

const { ipcRenderer } = window.require("electron");

import "./App.css";

export default function App() {
  const [signIn, setSignIn] = useState(() => {
    console.log("trying to get auth")
    if (localStorage.getItem("signin")) {
      const pat = JSON.parse(localStorage.getItem("signin"));
      if (pat.authKey) {
        return true;
      }
    }
    return false;
  });
  const [global, setGlobal] = useState(() => {
    if (localStorage.getItem("global")) {
      const cmd = JSON.parse(localStorage.getItem("global"));
      if (cmd !== "") {
        ipcRenderer.send('global-shortcut', cmd)
        return true;
      }
    }
    return false;
  });

  const [sync, setSync] = useState(() => {
    if (localStorage.getItem("sync")) {
      return true;
    }
    return false;
  });

  function renderPage() {
    if (!signIn) {
      return <Redirect to="/signin" />;
    } else if (!global) {
      return <Redirect to="/preferences" />;
    } else if (!sync) {
      return <Redirect to="/sync" />;
    } else {
      return <Redirect to="/" />;
    }
  }

  return (
    <>
      {renderPage()}
      <Switch>
        <Route path="/settings" component={Settings} />
        <Route path="/pat" component={Pat} />
        <Route path="/sync" component={Sync} />
        <Route path="/signin" component={SignIn} />
        <Route path="/preferences" component={Preferences} />
        <Route exact path="/" component={Home} />
      </Switch>
    </>
  );
}
