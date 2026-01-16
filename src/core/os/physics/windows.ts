import { wmApi } from "@os/wm/wm.svelte";
import { Bodies, Body, Composite, Constraint, Events } from "matter-js";
import {
  CATEGORY_ACTIVE_WINDOW,
  CATEGORY_MINIMIZED_WINDOW,
  CATEGORY_STATIC_WINDOW,
  CATEGORY_WALL,
  engine,
} from "./physics";

interface WinBodyData {
  body: Body;
  wasPhysicsActiveBeforeMinimize: boolean;
  physicsActive: boolean;
}

let windowBodies: Map<number, WinBodyData> = new Map();
let activeConstraint: Constraint | null = null;

export function startWindowPhysics() {
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

  Events.on(engine, "afterUpdate", () => {});
}

export function enablePhysics(id: number) {
  const win = wmApi.getWindows().get(id);
  if (!win) return;

  removeWindow(id);
  win.data.physicsEnabled = true;
  addWindow(id);
}

export function disablePhysics(id: number) {
  const win = wmApi.getWindows().get(id);
  if (!win) return;

  removeWindow(id);
  win.data.physicsEnabled = false;
  addWindow(id);
}

function addWindow(id: number, opts?: Partial<WinBodyData>) {
  const data = wmApi.getWindows().get(id)?.data;
  if (!data) return;

  const centerX = data.x + data.width / 2;
  const centerY = data.y + data.height / 2;

  let category;
  if (data.isMinimized) {
    category = CATEGORY_MINIMIZED_WINDOW;
  } else if (data.physicsEnabled) {
    category = CATEGORY_ACTIVE_WINDOW;
  } else {
    category = CATEGORY_STATIC_WINDOW;
  }

  const body = Bodies.rectangle(centerX, centerY, data.width, data.height, {
    friction: 0.9,
    density: 0.005,
    frictionAir: 0.01,
    restitution: 0.1,
    collisionFilter: {
      category: category,
      mask: CATEGORY_WALL | CATEGORY_ACTIVE_WINDOW | CATEGORY_STATIC_WINDOW,
    },
    isStatic: !data.physicsEnabled,
    angle: data.rotation,
    label: id.toString(),
  });

  windowBodies.set(id, {
    body,
    physicsActive: data.physicsEnabled,
    wasPhysicsActiveBeforeMinimize: data.physicsEnabled,
    ...opts,
  });
  Composite.add(engine.world, body);
}

function removeWindow(id: number) {
  const data = windowBodies.get(id);
  if (data) {
    Composite.remove(engine.world, data.body);
    windowBodies.delete(id);
  }
}

// ???? why does this work with normal resizing windows aswell
// im scared
function resizeWindow(id: number, newWidth: number, newHeight: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win) return;

  const body = data.body;

  const currentAngle = body.angle;

  const halfW = newWidth / 2;
  const halfH = newHeight / 2;

  const newVertices = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];

  Body.setAngle(body, 0);
  Body.setVertices(body, newVertices);
  Body.setAngle(body, currentAngle);
}

function moveWindowStatic(id: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win || data.physicsActive) return;

  const centerX = win.data.x + win.data.width / 2;
  const centerY = win.data.y + win.data.height / 2;

  Body.setPosition(data.body, { x: centerX, y: centerY });
}

function removeCollision(id: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win) return;

  removeWindow(id);
  win.data.physicsEnabled = false;
  addWindow(id, { wasPhysicsActiveBeforeMinimize: data.physicsActive });
}

function restoreCollision(id: number) {
  const data = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!data || !win) return;

  if (data.wasPhysicsActiveBeforeMinimize) {
    removeWindow(id);
    win.data.physicsEnabled = true;
    addWindow(id);
  } else {
    removeWindow(id);
    win.data.physicsEnabled = false;
    addWindow(id);
  }
}

export function grabWindow(id: number, x: number, y: number) {
  const body = windowBodies.get(id)?.body;
  if (!body) return;

  const localOffset = {
    x: x - body.position.x,
    y: y - body.position.y,
  };

  activeConstraint = Constraint.create({
    pointA: { x, y },
    bodyB: body,
    pointB: localOffset,
    stiffness: 0.5,
    length: 0,
    damping: 0.1,
  });

  Composite.add(engine.world, activeConstraint);
}

export function updateGrab(x: number, y: number) {
  if (activeConstraint) {
    activeConstraint.pointA.x = x;
    activeConstraint.pointA.y = y;
  }
}

export function releaseWindow() {
  if (activeConstraint) {
    Composite.remove(engine.world, activeConstraint);
    activeConstraint = null;
  }
}

// smoothly interpolate window positions faster than 60hz

let previousStates = new Map<number, { x: number; y: number; angle: number }>();

export function savePreviousStates() {
  for (const [id, { body, physicsActive }] of windowBodies) {
    if (!physicsActive) continue;

    previousStates.set(id, {
      x: body.position.x,
      y: body.position.y,
      angle: body.angle,
    });
  }
}

export function updateVisuals(alpha: number) {
  for (const [id, { body, physicsActive }] of windowBodies) {
    if (!physicsActive) continue;

    const prev = previousStates.get(id);
    if (!prev) continue;

    const interX = prev.x + (body.position.x - prev.x) * alpha;
    const interY = prev.y + (body.position.y - prev.y) * alpha;
    const interAngle = prev.angle + (body.angle - prev.angle) * alpha;
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
