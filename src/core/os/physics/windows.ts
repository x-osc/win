import { wmApi, type WinData } from "@os/wm/wm.svelte";
import { Bodies, Composite, Events, type Body } from "matter-js";
import { engine } from "./physics";

let windowBodies: Map<number, Body> = new Map();
let isUpdating = false;

export function startWindowPhysics() {
  wmApi.on("anymounted", (id) => {
    addWindow(id, wmApi.getWindows().get(id)!.data);
  });

  wmApi.on("anyclosed", (id) => removeWindow(id));

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
  const centerX = data.x + data.width / 2;
  const centerY = data.y + data.height / 2;

  const body = Bodies.rectangle(centerX, centerY, data.width, data.height, {
    frictionAir: 0.05,
    restitution: 0.6,
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
