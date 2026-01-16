import { thud1Sfx } from "@os/audio/sounds";
import { Body, Box, Settings, Vec2, World } from "planck";
import {
  savePreviousStates,
  startWindowPhysics,
  updateVisuals,
} from "./windows";

export let world = new World({
  allowSleep: true,
  gravity: new Vec2(0, 5000),
});

let prevTime = performance.now();
let accumulator = 0;
const frameRate = 1000 / 60;

let lastSoundTime = 0;
const activeImpacts = new Set<string>();

let walls: Body[] = [];

export const CATEGORY_WALL = 0x0008;
export const CATEGORY_MINIMIZED_WINDOW = 0x0004;
export const CATEGORY_STATIC_WINDOW = 0x0002;
export const CATEGORY_ACTIVE_WINDOW = 0x0001;
export const CATEGORY_NONE = 0x0000;

export function initPhysics() {
  Settings.lengthUnitsPerMeter = 500;

  createWalls();
  startWindowPhysics();

  window.addEventListener("resize", createWalls);

  world.on("end-contact", (contact) => {
    const id = getContactId(contact);
    activeImpacts.delete(id);
  });

  world.on("post-solve", (contact, impulse) => {
    const now = performance.now();
    if (now - lastSoundTime < 200) return;

    const id = getContactId(contact);
    if (activeImpacts.has(id)) return;

    const categoryA = contact.getFixtureA().getFilterCategoryBits();
    const categoryB = contact.getFixtureB().getFilterCategoryBits();
    const totalImpulse = impulse.normalImpulses[0];

    const isWindowA = categoryA === CATEGORY_ACTIVE_WINDOW;
    const isWindowB = categoryB === CATEGORY_ACTIVE_WINDOW;
    const isWall = categoryA === CATEGORY_WALL || categoryB === CATEGORY_WALL;

    console.log(totalImpulse);

    if ((isWindowA || isWindowB) && isWall) {
      if (totalImpulse > 900_000_000) {
        thud1Sfx.play();
        lastSoundTime = now;
      }
    } else if (isWindowA && isWindowB) {
      if (totalImpulse > 800_000_000) {
        thud1Sfx.play();
        lastSoundTime = now;
      }
    }
  });

  requestAnimationFrame(loop);
}

function loop(time: number) {
  const deltaTime = time - prevTime;
  prevTime = time;

  accumulator += Math.min(deltaTime, 250);

  while (accumulator >= frameRate) {
    savePreviousStates();

    world.step(frameRate / 1000, 12, 4);
    accumulator -= frameRate;
  }

  const alpha = accumulator / frameRate;
  updateVisuals(alpha);

  requestAnimationFrame(loop);
}

function createWalls() {
  walls.forEach((wall) => world.destroyBody(wall));
  walls = [];

  const taskbarHeight = 35;

  const thickness = 500;

  const extraWidth = 2000;
  const winWidth = window.innerWidth;
  const fullWidth = winWidth + extraWidth;

  const extraHeight = 2000;
  const winHeight = window.innerHeight;
  const fullHeight = winHeight + extraHeight;

  walls = [
    // top
    createWall(
      winWidth / 2,
      -extraHeight - thickness / 2,
      fullWidth,
      thickness,
    ),
    // left
    createWall(
      -extraWidth / 2 - thickness / 2,
      winHeight / 2,
      thickness,
      fullHeight,
    ),
    // right
    createWall(
      winWidth + thickness / 2 + extraWidth / 2,
      winHeight / 2,
      thickness,
      fullHeight,
    ),
    // bottom
    createWall(
      winWidth / 2,
      winHeight + thickness / 2 - taskbarHeight,
      fullWidth,
      thickness,
    ),
  ];
}

function createWall(x: number, y: number, w: number, h: number) {
  const body = world.createBody({
    position: new Vec2(x, y),
    type: "static",
  });
  body.createFixture({
    shape: new Box(w / 2, h / 2),
    friction: 0.25,
    filterCategoryBits: CATEGORY_WALL,
  });
  return body;
}

function getContactId(contact: any): string {
  const idA = contact.getFixtureA().getBody().getUserData() || "wall";
  const idB = contact.getFixtureB().getBody().getUserData() || "wall";
  return [idA, idB].sort().join("-");
}
