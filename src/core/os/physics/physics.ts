import { Bodies, Body, Composite, Engine, Render } from "matter-js";

export let engine = Engine.create();
let render: Render;
let prevTime = 0;
let walls: Body[] = [];

export function initPhysics() {
  requestAnimationFrame(loop);
  createWalls();
}

function loop(time: number) {
  const deltaTime = time - prevTime;
  prevTime = time;

  // idk why but putting deltatime here doesnt work
  Engine.update(engine, 1000 / 60);

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
