import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { randFromArray, randint } from "../../core/utils/utils";
import { hydraError } from "../error";

let count = 1;

async function launch(api: AppApi) {
  await api.showDialog({
    message: "hey gangalang its me the hydra",
    title: "hydra dot exe",
    buttons: ["thanks hydra ur the best", "oh no"],
    position: {
      x: randint(0, window.innerWidth) - 300,
      y: randint(0, window.innerHeight) - 100,
    },
  });
  spawnHydras(api);
}

function spawnHydras(api: AppApi) {
  count++;

  if (count >= 20) {
    hydraError();
  }

  api
    .showDialog({
      message: randFromArray(hydraDialogs),
      title: "hydra dot exe",
      buttons: ["thanks hydra ur the best", "oh no"],
      position: {
        x: randint(0, window.innerWidth) - 300,
        y: randint(0, window.innerHeight) - 100,
      },
    })
    .then(() => {
      spawnHydras(api);
    });

  api
    .showDialog({
      message: randFromArray(hydraDialogs),
      title: "hydra dot exe",
      buttons: ["thanks hydra ur the best", "oh no"],
      position: {
        x: randint(0, window.innerWidth),
        y: randint(0, window.innerHeight),
      },
    })
    .then(() => {
      spawnHydras(api);
    });
}

const hydraDialogs = [
  "hey gangalang im the hydra",
  "why dont u talk to the other head",
  "im feeling like some coffee do u want any",
  "im hydra",
  "let me come and play too guys",
  "uhoh im gonna die goodby world :(((",
  "i liek beans",
  "go follow hydra.exe on twitter",
  "i liek computers",
  "yummy",
  `Garry Hoy (January 28, 1954 - July 9, 1993) was a Canadian lawyer who died when he fell from the 24th floor of his office building at the Toronto-Dominion Centre in Toronto, Ontario. 
  In an attempt to prove to a group of prospective articling students that the building's glass windows were unbreakable — 
  a stunt he had performed without incident many times before — he threw his body against the glass; 
  however this time the entire window frame gave way, and Hoy fell to his death.`,
  "shobaleder one",
  "monkey see monkey do",
];

export let hydraManifest: AppManifest = {
  appId: "hydra",

  launch,
};
