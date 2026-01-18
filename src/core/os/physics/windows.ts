import { wmApi } from "@os/wm/wm.svelte";
import { Body, Box, MouseJoint, Vec2 } from "planck";
import {
  CATEGORY_ACTIVE_WINDOW,
  CATEGORY_MINIMIZED_WINDOW,
  CATEGORY_STATIC_WINDOW,
  CATEGORY_WALL,
  world,
} from "./physics";

interface WinBodyData {
  body: Body;
  wasPhysicsActiveBeforeMinimize: boolean;
  physicsActive: boolean;
}

let windowBodies: Map<number, WinBodyData> = new Map();
let activeJoint: MouseJoint | null = null;
let groundBody: Body; // empty body for mousejoint

export function startWindowPhysics() {
  groundBody = world.createBody();

  wmApi.on("anymounted", (id) => addWindow(id));

  wmApi.on("anyclosed", (id) => removeWindow(id));

  wmApi.on("anyresized", (id, width, height) =>
    resizeWindow(id, width, height),
  );

  wmApi.on("anyminimized", (id) => removeCollision(id));
  wmApi.on("anyrestored", (id) => restoreCollision(id));

  wmApi.on("anymoved", (id) => moveWindowStatic(id));

  for (const [id, win] of wmApi.getWindows().entries()) {
    addWindow(id);
  }
}

export function enablePhysics(id: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win) return;

  win.data.physicsEnabled = true;
  data.physicsActive = true;
  data.body.getFixtureList()?.setFilterCategoryBits(CATEGORY_ACTIVE_WINDOW);
  data.body.setType("dynamic");
}

export function enablePhysicsForAll() {
  wmApi.getWindows().forEach((_, id) => {
    enablePhysics(id);
  });
}

export function disablePhysics(id: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win) return;

  win.data.physicsEnabled = false;
  data.physicsActive = false;
  data.body.getFixtureList()?.setFilterCategoryBits(CATEGORY_STATIC_WINDOW);
  data.body.setType("kinematic");
}

function addWindow(id: number) {
  const data = wmApi.getWindows().get(id)?.data;
  if (!data) return;

  const centerX = data.x + data.width / 2;
  const centerY = data.y + data.height / 2;

  const isPhysics = data.physicsEnabled && !data.isMinimized;

  let category;
  if (data.isMinimized) {
    category = CATEGORY_MINIMIZED_WINDOW;
  } else if (data.physicsEnabled) {
    category = CATEGORY_ACTIVE_WINDOW;
  } else {
    category = CATEGORY_STATIC_WINDOW;
  }

  const body = world.createBody({
    type: isPhysics ? "dynamic" : "kinematic",
    position: new Vec2(centerX, centerY),
    angle: data.rotation,
    // linearDamping: 0.5,
    angularDamping: 0.6,
  });

  body.createFixture({
    shape: new Box(data.width / 2, data.height / 2),
    density: 1,
    friction: 0.35,
    restitution: 0.1,
    filterCategoryBits: category,
    filterMaskBits:
      CATEGORY_WALL | CATEGORY_ACTIVE_WINDOW | CATEGORY_STATIC_WINDOW,
  });

  body.setUserData(id);

  windowBodies.set(id, {
    body,
    physicsActive: data.physicsEnabled,
    wasPhysicsActiveBeforeMinimize: data.physicsEnabled,
  });
}

function removeWindow(id: number) {
  const data = windowBodies.get(id);
  if (data) {
    world.destroyBody(data.body);
    windowBodies.delete(id);
  }
}

// ???? why does this work with normal resizing windows aswell
// im scared
function resizeWindow(id: number, newWidth: number, newHeight: number) {
  const body = windowBodies.get(id)?.body;
  const data = wmApi.getWindows().get(id)?.data;
  if (!body || !data) return;

  // const currentAngle = body.getAngle();
  const oldFixture = body.getFixtureList();
  if (oldFixture) body.destroyFixture(oldFixture);

  let category;
  if (data.isMinimized) {
    category = CATEGORY_MINIMIZED_WINDOW;
  } else if (data.physicsEnabled) {
    category = CATEGORY_ACTIVE_WINDOW;
  } else {
    category = CATEGORY_STATIC_WINDOW;
  }

  body.createFixture({
    shape: new Box(newWidth / 2, newHeight / 2),
    density: 1,
    friction: 0.35,
    restitution: 0.1,
    filterCategoryBits: category,
    filterMaskBits:
      CATEGORY_WALL | CATEGORY_ACTIVE_WINDOW | CATEGORY_STATIC_WINDOW,
  });
}

function moveWindowStatic(id: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win || data.physicsActive) return;

  const centerX = win.data.x + win.data.width / 2;
  const centerY = win.data.y + win.data.height / 2;

  data.body.setPosition({ x: centerX, y: centerY });
}

function removeCollision(id: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win) return;

  data.wasPhysicsActiveBeforeMinimize = data.physicsActive;

  data.body.getFixtureList()?.setFilterCategoryBits(CATEGORY_MINIMIZED_WINDOW);

  if (data.physicsActive) {
    win.data.physicsEnabled = false;
    data.physicsActive = false;
    data.body.setType("kinematic");
  }
}

function restoreCollision(id: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win) return;

  data.body.getFixtureList()?.setFilterCategoryBits(CATEGORY_ACTIVE_WINDOW);

  if (data.wasPhysicsActiveBeforeMinimize) {
    win.data.physicsEnabled = true;
    data.physicsActive = true;
    data.body.setType("dynamic");
  }
}

export function grabWindow(id: number, x: number, y: number) {
  const body = windowBodies.get(id)?.body;
  if (!body) return;

  activeJoint = new MouseJoint({
    bodyA: groundBody,
    bodyB: body,
    target: new Vec2(x, y),
    maxForce: 5000 * body.getMass() * world.getGravity().y,
    dampingRatio: 1.0,
    frequencyHz: 10,
  });

  world.createJoint(activeJoint);
}

export function updateGrab(x: number, y: number) {
  if (activeJoint) {
    activeJoint.setTarget({ x, y });
  }
}

export function releaseWindow() {
  if (activeJoint) {
    world.destroyJoint(activeJoint);
    activeJoint = null;
  }
}

// smoothly interpolate window positions faster than 60hz

let previousStates = new Map<number, { x: number; y: number; angle: number }>();

export function savePreviousStates() {
  for (const [id, { body, physicsActive }] of windowBodies) {
    if (!physicsActive) continue;

    previousStates.set(id, {
      x: body.getPosition().x,
      y: body.getPosition().y,
      angle: body.getAngle(),
    });
  }
}

export function updateVisuals(alpha: number) {
  for (const [id, { body, physicsActive }] of windowBodies) {
    if (!physicsActive) continue;

    const prev = previousStates.get(id);
    if (!prev) continue;

    const interX = prev.x + (body.getPosition().x - prev.x) * alpha;
    const interY = prev.y + (body.getPosition().y - prev.y) * alpha;
    const interAngle = prev.angle + (body.getAngle() - prev.angle) * alpha;
    const roundedAngle =
      Math.abs(interAngle % (2 * Math.PI)) > 0.01 ? interAngle : 0;

    const win = wmApi.getWindows().get(id);
    if (!win) continue;

    const topLeftX = interX - win.data.width / 2;
    const topLeftY = interY - win.data.height / 2;

    wmApi.moveWindowForce(id, Math.round(topLeftX), Math.round(topLeftY));
    wmApi.setWindowRotation(id, roundedAngle);
  }
}
