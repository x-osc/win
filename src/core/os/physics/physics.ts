import { Bodies, Body, Composite, Engine, Render } from "matter-js";
import { savePreviousStates, updateVisuals } from "./windows";

export let engine = Engine.create();
let render: Render;

let prevTime = performance.now();
let accumulator = 0;
const frameRate = 1000 / 60;

let walls: Body[] = [];

export const CATEGORY_WALL = 0x0004;
export const CATEGORY_MINIMIZED_WINDOW = 0x0002;
export const CATEGORY_WINDOW = 0x0001;
export const CATEGORY_NONE = 0x0000;

export function initPhysics() {
  createWalls();
  engine.gravity.y = 5;

  window.addEventListener("resize", createWalls);

  requestAnimationFrame(loop);
}

function loop(time: number) {
  const deltaTime = time - prevTime;
  prevTime = time;

  accumulator += Math.min(deltaTime, 250);

  while (accumulator >= frameRate) {
    savePreviousStates();

    Engine.update(engine, frameRate);
    accumulator -= frameRate;
  }

  const alpha = accumulator / frameRate;
  updateVisuals(alpha);

  requestAnimationFrame(loop);
}

function createWalls() {
  if (walls.length > 0) {
    Composite.remove(engine.world, walls);
  }

  const taskbarHeight = 35;

  const thickness = 100;

  const extraWidth = 1000;
  const winWidth = window.innerWidth;
  const fullWidth = winWidth + extraWidth;

  const extraHeight = 1000;
  const winHeight = window.innerHeight;
  const fullHeight = winHeight + extraHeight;

  walls = [
    // top
    Bodies.rectangle(
      winWidth / 2,
      -extraHeight - thickness / 2,
      fullWidth,
      thickness,
      {
        isStatic: true,
      },
    ),
    // left
    Bodies.rectangle(
      -extraWidth / 2 - thickness / 2,
      winHeight / 2,
      thickness,
      fullHeight,
      {
        isStatic: true,
      },
    ),
    // right
    Bodies.rectangle(
      winWidth + thickness / 2 + extraWidth / 2,
      winHeight / 2,
      thickness,
      fullHeight,
      {
        isStatic: true,
      },
    ),
    // bottom
    Bodies.rectangle(
      winWidth / 2,
      winHeight + thickness / 2 - taskbarHeight,
      fullWidth,
      thickness,
      {
        isStatic: true,
        friction: 0.8,
      },
    ),
  ];

  Composite.add(engine.world, walls);
}

export function setupDebugRender(container: HTMLElement) {
  render = Render.create({
    element: container,
    engine: engine,
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      wireframes: true,
      background: "transparent",
      hasBounds: true,
    },
  });
}

export function startDebugRender() {
  Render.run(render);
}

export function stopDebugRender() {
  Render.stop(render);
}
