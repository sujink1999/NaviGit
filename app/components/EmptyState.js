import React, { useState } from "react";
import Lottie from "lottie-react";
import Astronaut from '../../assets/astronaut.json'
import Rocket from '../../assets/rocket.json'

import Icecream from '../../assets/icecream.json'

export default function EmptyState({ active, text }) {
    const [rand, setRand] = useState((() => {
        if (text === "") return Math.floor(Math.random() * 2 + 1)
        else return 0
    })()
    )



    const getPun = (i) => {
        const puns = ["Search returned no results. Are you lost?", `No ${active === "Issues" ? "issues" : active === "Repos" ? "repos" : "pr’s"} found in this realm, wanna explore others?`, "Nothing to show here, You deserve a dessert!"]
        return puns[i]
    }


    const getLottieJson = (i) => {
        const jsons = [Astronaut, Rocket, Icecream]
        return jsons[i]
    }

    return (
        <div className="empty-state">
            <Lottie className={rand === 0 ? "animation-large" : "animation-small"} animationData={getLottieJson(rand)} />
            <p>{getPun(rand)}</p>
        </div>
    );
};