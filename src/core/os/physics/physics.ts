import { Bodies, Body, Composite, Engine } from "matter-js";

export let engine = Engine.create();
let render;
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
