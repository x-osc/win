import { Body, Box, Settings, Vec2, World } from "planck";
import {
  savePreviousStates,
  startWindowPhysics,
  updateVisuals,
} from "./windows";

export let world = new World({
  allowSleep: false,
  gravity: new Vec2(0, 5000),
});

let prevTime = performance.now();
let accumulator = 0;
const frameRate = 1000 / 60;

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

  requestAnimationFrame(loop);
}

function loop(time: number) {
  const deltaTime = time - prevTime;
  prevTime = time;

  accumulator += Math.min(deltaTime, 250);

  while (accumulator >= frameRate) {
    savePreviousStates();

    world.step(frameRate / 1000, 8, 3);
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
