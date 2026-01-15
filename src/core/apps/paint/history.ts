export interface HistoryAction {
  name: string;
  do: () => void;
  undo: () => void;
}

export class HistoryManager {
  undoStack: HistoryAction[] = [];
  redoStack: HistoryAction[] = [];
  maxUndo: number;

  constructor(maxUndo = 50) {
    this.maxUndo = maxUndo;
  }

  push(action: HistoryAction) {
    this.undoStack.push(action);
    while (this.undoStack.length >= this.maxUndo) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  execute(action: HistoryAction) {
    action.do();
    this.push(action);
  }

  undo() {
    const action = this.undoStack.pop();
    if (!action) return;

    action.undo();
    this.redoStack.push(action);
  }

  redo() {
    const action = this.redoStack.pop();
    if (!action) return;

    action.do();
    this.undoStack.push(action);
  }
}
