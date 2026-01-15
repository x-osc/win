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

  // taskbar height
  const thickness = 35;
  const width = window.innerWidth;
  const height = window.innerHeight;

  walls = [
    Bodies.rectangle(
      width / 2,
      height - thickness / 2,
      width + 5000,
      thickness,
      {
        isStatic: true,
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
