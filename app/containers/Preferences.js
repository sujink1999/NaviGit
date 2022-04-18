import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/Header";
import Button from "../components/Button";

import { ToastContainer, toast } from "react-toastify";
import Keyboard from "../../assets/Keyboard.svg";
import Retry from "../../assets/Retry.svg";
import { ipcRenderer } from "electron";

export default function Preferences(props) {
  const [hotKey, setHotKey] = useState("");
  const [keys, setKeys] = useState([])
  const history = useHistory();
  // const modifiers = useState(new Set(["Command" ,"Cmd" ,"Control","Ctrl","CommandOrControl","CmdOrCtrl","Alt","Option","AltGr","Shift"]))
  

  // useEffect(() => {
  //   let value = JSON.parse(localStorage.getItem("hotkey"));
  //   if (value != []) {
  //     setHotKey(value);
  //   }
  // }, []);

  useEffect(() => {
    // Listening for keypress
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  });

  function validateKeys() {
    const modifiers = new Set(["Command" ,"Cmd" ,"Control","Ctrl","CommandOrControl","CmdOrCtrl","Alt","Option","AltGr","Shift"])
    let modifierCount = 0
    let keycodeCount = 0
    keys.forEach((key) => {
      if (modifiers.has(key)) {
        modifierCount+=1
      } else {
        keycodeCount+=1
      }
    })
    return modifierCount > 0 && keycodeCount == 1
  }

  function handleKeyPress(e) {
    e.preventDefault();
    let key = e.code;
    // OS Exclusive change
    let OSName;
    if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
    if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
    if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux";
    if (key.includes("Meta")) {
      key = OSName === "Windows" || OSName === "Linux" ? "Win" : "Cmd";
    }

    // Control and Alt check
    if (key.includes("Alt")) {
      key = "Alt";
    }
    if (key.includes("Control")) {
      key = "Ctrl";
    }
    if (key.includes("Arrow")) {
      key = key.slice(5);
    }
    if (key.includes("Key")) {
      key = key.slice(3);
    }

    if (key.includes("Shift")) {
      key = "Shift"
    }
    if (!keys.includes(key)){
      setKeys([...keys, key])
      if (hotKey === "") {
        setHotKey(key);
      } else {
        setHotKey(hotKey + " + " + key);
      }
    }
  }

  function handleGlobalShotcut() {
    // Set global shortcut
    if (validateKeys()) {
      const shortcut = keys.join("+");
      localStorage.setItem("global", JSON.stringify(shortcut));
      ipcRenderer.send('global-shortcut', shortcut)
      if(props.location.state){
        history.goBack()
      }else{
        history.push( '/sync');
      }
    } else {
      toast.error("Invalid Hotkey", {
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
    <div className="container-preferences">
      <Header />
      <div className="command">
        <div className="hotkey">
          <Keyboard style={{ cursor: "pointer" }} />
          <input
            className="commandText"
            type="text"
            onChange={(e) => setHotKey(e.target.value)}
            value={hotKey}
            placeholder="Recording your shortcut..."
          />
          <Retry onClick={() => {
            setKeys([])
            setHotKey("")
          }} style={{ cursor: "pointer" }} />
        </div>
        <div className="hint">
          <p>Record a keystroke shortcut to quickly open the app</p>
          <p>Example : Press CMD + G </p>
        </div>
        <div className="finish">
          <Button
            type="Finish"
            text="Finish"
            active={hotKey != "" ? true : false}
            eventCall={handleGlobalShotcut}
          />
        </div>
      </div>
      </div>
      </>
  );
}
