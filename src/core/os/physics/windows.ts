import { wmApi, type WinData } from "@os/wm/wm.svelte";
import { Bodies, Body, Composite, Constraint, Events } from "matter-js";
import { engine } from "./physics";

let windowBodies: Map<number, Body> = new Map();
let activeConstraint: Constraint | null = null;
let isUpdating = false;

export function startWindowPhysics() {
  wmApi.on("anymounted", (id) =>
    addWindow(id, wmApi.getWindows().get(id)!.data),
  );

  wmApi.on("anyclosed", (id) => removeWindow(id));

  wmApi.on("anyresized", (id, width, height) => {
    resizeWindow(id, width, height);
  });

  for (const [id, win] of wmApi.getWindows().entries()) {
    addWindow(id, win.data);
  }

  Events.on(engine, "afterUpdate", () => {
    isUpdating = true;
    for (const [id, body] of windowBodies) {
      const win = wmApi.getWindows().get(id);
      if (!win) continue;

      const topLeftX = body.position.x - win.data.width / 2;
      const topLeftY = body.position.y - win.data.height / 2;

      wmApi.moveWindowForce(id, topLeftX, topLeftY);
      wmApi.setWindowRotation(id, body.angle);
    }
    isUpdating = false;
  });
}

function addWindow(id: number, data: WinData) {
  wmApi.getWindows().get(id)!.data.physicsEnabled = true;

  const centerX = data.x + data.width / 2;
  const centerY = data.y + data.height / 2;

  const body = Bodies.rectangle(centerX, centerY, data.width, data.height, {
    friction: 0.9,
    density: 0.005,
    frictionAir: 0.01,
    restitution: 0.1,
    label: id.toString(),
  });

  windowBodies.set(id, body);
  Composite.add(engine.world, body);
}

function removeWindow(id: number) {
  const body = windowBodies.get(id);
  if (body) {
    Composite.remove(engine.world, body);
    windowBodies.delete(id);
  }
}

function resizeWindow(id: number, newWidth: number, newHeight: number) {
  const body = windowBodies.get(id);
  const win = wmApi.getWindows().get(id);
  if (!body || !win) return;

  const currentAngle = body.angle;
  console.log(currentAngle);

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

export function grabWindow(id: number, x: number, y: number) {
  const body = windowBodies.get(id);
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
