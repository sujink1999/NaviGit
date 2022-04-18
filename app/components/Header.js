import React from "react";
import { useHistory } from "react-router-dom";

import Logo from "../../assets/Logo.svg";
import LogoL from "../../assets/LogoL.svg";
import NaviGit from "../../assets/Navi-Git.svg";
import NaviGitL from "../../assets/Navi-Git.svg";
import Settings from "../../assets/Cog.svg";
import LogoSpin from "../../assets/LogoSpin.svg";

export default function Header({ settings, from, sync = false }) {
  const history = useHistory();

  function renderLogo() {
    if (sync) return <LogoSpin />;
    return <Logo />;
  }

  return (
    <div className={settings ? "header-large" : "header-center"}>
      <div className={settings ? "logo" : "logo-center"}>{settings ? renderLogo() : <LogoL />}</div>
      <div className="title" styles={{
        width : '20%'
      }}>{settings ? <NaviGit /> : <NaviGitL />}</div>
      <div className="settings">
        {settings && (
          <div
            onClick={() =>
              from === "/settings"
                ? history.push(from)
                : history.push("/settings")
            }
          >
            <Settings />
          </div>
        )}
      </div>
    </div>
  );
}
