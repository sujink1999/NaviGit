import React from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/Header";
import Button from "../components/Button";

export default function SignIn() {
  const history = useHistory();
  return (
    <div className="container-signin">
      <Header center={true}/>
      <div className="main">
        <p className="subtitle">
          Navigate around git without leaving your keyboard
        </p>
        <div className="signin">
          <Button
            type="Git"
            text="Get Started"
            active={true}
            eventCall={() => {
              history.push("/pat");
            }}
          />
        </div>
      </div>
    </div>
  );
}
