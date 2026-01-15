import { LayerManager, type Layer } from "./layers.svelte";

type HistoryAction =
  | { type: "draw"; layerId: string; snapshot: ImageData }
  | { type: "delete_layer"; layerId: string; layer: Layer; index: number };

export class HistoryManager {
  undoStack: HistoryAction[] = [];
  redoStack: HistoryAction[] = [];
  maxUndo: number;
  render: () => void;

  constructor(render: () => void, maxUndo = 50) {
    this.render = render;
    this.maxUndo = maxUndo;
  }

  saveState(action: HistoryAction) {
    this.undoStack.push(action);
    while (this.undoStack.length >= this.maxUndo) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  undo(layerManager: LayerManager) {
    const action = this.undoStack.pop();
    if (!action) return;

    if (action.type === "draw") {
      const layer = layerManager.layers.find((l) => l.id === action.layerId);
      if (!layer) return;

      this.redoStack.push({
        type: "draw",
        layerId: layer.id,
        snapshot: layer.ctx.getImageData(
          0,
          0,
          layer.canvas.width,
          layer.canvas.height,
        ),
      });

      layer.ctx.putImageData(action.snapshot, 0, 0);
    } else if (action.type === "delete_layer") {
      layerManager.layers.splice(action.index, 0, action.layer);
      layerManager.activeIndex = action.index;

      this.redoStack.push(action);
    }

    this.render();
  }

  redo(layerManager: LayerManager) {
    const action = this.redoStack.pop();
    if (!action) return;

    this.undoStack.push(action);

    if (action.type === "draw") {
      const layer = layerManager.layers.find((l) => l.id === action.layerId);
      if (!layer) return;

      this.undoStack.push({
        type: "draw",
        layerId: layer.id,
        snapshot: layer.ctx.getImageData(
          0,
          0,
          layer.canvas.width,
          layer.canvas.height,
        ),
      });

      layer.ctx.putImageData(action.snapshot, 0, 0);
    } else if (action.type === "delete_layer") {
      const index = layerManager.layers.findIndex(
        (l) => l.id === action.layerId,
      );
      if (index === -1) return;

      const removedLayer = layerManager.layers[index];
      this.undoStack.push({
        type: "delete_layer",
        layerId: removedLayer.id,
        layer: removedLayer,
        index: index,
      });
      layerManager.layers = layerManager.layers.filter(
        (l) => l.id !== action.layerId,
      );
      layerManager.activeIndex = Math.min(
        layerManager.activeIndex,
        layerManager.layers.length - 1,
      );
    }

    this.render();
  }
}
