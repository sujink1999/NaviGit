import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
const { ipcRenderer } = window.require("electron");

import { Octokit } from "@octokit/core";
import Store from "../js/store";
import Navigit from "../js/navigit";

import Header from "../components/Header";
import Paste from "../../assets/Paste.svg";

export default function Pat() {
  const [status, setStatus] = useState("");
  const [pat, setPat] = useState("");

  const inputRef = useRef();

  const history = useHistory();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Insert API calls
      if (status === "error" || status === "scope") {
        setStatus("");
        setPat("");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [status]);

  function renderClipboard() {
    navigator.clipboard.readText().then((text) => {
      setPat(text);
    });
  }

  async function registerToken() {
    const store = new Store();
    const octo = new Octokit({
      auth: pat,
    });
    const navigit = new Navigit(octo, store);
    try {
      const result = await navigit.registerAccessToken();
      if (!result) {
        setStatus("scope");
        return;
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (pat.length == 40) {
      setStatus("checking");
      registerToken();
    } else if (pat.length > 40) {
      setStatus("error");
    }
  }, [pat]);

  useEffect(() => {
    if (status === "success") {
      localStorage.setItem("signin", JSON.stringify({ authKey: pat }));
      history.push("/preferences");
    }
  }, [status]);

  function renderClass() {
    if (pat.length < 40) {
      return "pat-input";
    } else if (pat.length > 40 || status === "error") {
      return "pat-input-error";
    } else if (status === "scope") {
      return "pat-input-error";
    } else if (status === "checking") {
      return "pat-input-checking";
    } else if (status === "success") {
      return "pat-input-success";
    }
  }

  function renderText() {
    if (status === "") {
      return (
        <>
          <input
            placeholder="Enter your 40 character token"
            onChange={(e) => setPat(e.target.value)}
            ref={inputRef}
            type="text"
            value={pat}
          />
          <label
            onClick={renderClipboard}
            style={status === "" ? { cursor: "pointer" } : { display: none }}
          >
            <Paste />
          </label>
        </>
      );
    }
    if (status === "checking") {
      return <p>Checking and validating key....</p>;
    } else if (status === "error") {
      return <p>Invalid Key</p>;
    } else if (status === "success") {
      return <p>Success</p>;
    } else if (status == "scope") {
      return <p>Scope Error - Insufficient permission</p>;
    }
  }

  return (
    <div className="pat-container">
      <Header />
      <div className="pat-content">
        <p className="pat-subtitle">Signing in with a personal access token</p>
        <div className={renderClass()}>{renderText()}</div>
        <p className="pat-subtext">
          Generate a token at github{" "}
          <span className="pat-subtext-highlight" onClick={() => {
            ipcRenderer.send('open-repo', 'https://github.com/settings/tokens/new')
          }}>
            <u>here</u>
          </span>
          , with the scopes{" "}
          <span className="pat-checkbox">repo, read:org, notifications</span>
        </p>
      </div>
      <div className="pat-footer">
        <p className="pat-footer-text">
          Tokens allows navigit to behave more like your
          <span className="pat-footer-highlight"> personal gun slinger</span>,
          You dont have to bug your org admin for ‘installation’ or ‘approval’
        </p>
      </div>
    </div>
  );
}
