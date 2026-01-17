import { thud1Sfx } from "@os/audio/sounds";
import { Body, Box, Settings, Vec2, World } from "planck";
import type { BoxShape } from "planck/with-testbed";
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

  world.on("pre-solve", (contact) => {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    const bodyA = fixtureA.getBody();
    const bodyB = fixtureB.getBody();

    const categoryA = contact.getFixtureA().getFilterCategoryBits();
    const categoryB = contact.getFixtureB().getFilterCategoryBits();

    const isStaticA = categoryA === CATEGORY_STATIC_WINDOW;
    const isStaticB = categoryB === CATEGORY_STATIC_WINDOW;

    if (isStaticA) {
      const platformY =
        bodyA.getPosition().y -
        (fixtureA.getShape() as BoxShape).m_vertices[1].y;
      const objectY = bodyB.getPosition().y;
      const objectVel = bodyB.getLinearVelocity();

      console.log(platformY);

      if (objectY > platformY) {
        contact.setEnabled(false);
      }
    } else if (isStaticB) {
      const platformY =
        bodyB.getPosition().y -
        (fixtureB.getShape() as BoxShape).m_vertices[1].y;
      const objectY = bodyA.getPosition().y;
      const objectVel = bodyA.getLinearVelocity();

      if (objectY > platformY) {
        contact.setEnabled(false);
      }
    }
  });

  world.on("begin-contact", (contact) => {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const bodyA = fixtureA.getBody();
    const bodyB = fixtureB.getBody();

    const vA = bodyA.getLinearVelocity();
    const vB = bodyB.getLinearVelocity();

    const relVelX = vA.x - vB.x;
    const relVelY = vA.y - vB.y;

    // TODO: add slight mass effect

    const posA = bodyA.getPosition();
    const posB = bodyB.getPosition();

    const nx = posB.x - posA.x;
    const ny = posB.y - posA.y;
    const dist = Math.sqrt(nx * nx + ny * ny);

    const normalX = nx / dist;
    const normalY = ny / dist;

    const approachSpeed = relVelX * normalX + relVelY * normalY;

    const categoryA = contact.getFixtureA().getFilterCategoryBits();
    const categoryB = contact.getFixtureB().getFilterCategoryBits();

    const isWindowA = categoryA === CATEGORY_ACTIVE_WINDOW;
    const isWindowB = categoryB === CATEGORY_ACTIVE_WINDOW;
    const isWall = categoryA === CATEGORY_WALL || categoryB === CATEGORY_WALL;

    if ((isWindowA || isWindowB) && isWall) {
      if (approachSpeed > 380) {
        thud1Sfx.play();
      }
    } else if (isWindowA && isWindowB) {
      if (approachSpeed > 350) {
        thud1Sfx.play();
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
