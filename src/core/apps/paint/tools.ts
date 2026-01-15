export interface ToolContext {
  ctx: CanvasRenderingContext2D;
  color: string;
  size: number;
  lastX: number;
  lastY: number;
  x: number;
  y: number;
}

export interface ToolCursorContext {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  zoom: number;
}

export interface Tool {
  // start?: (params: ToolContext) => void;
  draw: (params: ToolContext) => void;
  // end?: (params: ToolContext) => void;
  drawCursor: (params: ToolCursorContext) => void;
}

export type ToolId = keyof typeof toolLibrary;

export const toolLibrary = {
  brush: {
    draw: ({ ctx, color, size, lastX, lastY, x, y }) => {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);

      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;

      ctx.lineTo(x, y);
      ctx.stroke();
    },
    drawCursor: drawCursorCircle,
  },
  pencil: {
    draw: ({ ctx, color, size, lastX, lastY, x, y }) => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = color;

      rectLineBetween(
        Math.floor(lastX),
        Math.floor(lastY),
        Math.floor(x),
        Math.floor(y),
        size,
        color,
        ctx,
      );
    },
    drawCursor: ({ ctx, x, y, size, zoom }) => {
      ctx.globalCompositeOperation = "difference";

      const radius = Math.floor(size / 2);

      ctx.beginPath();
      ctx.rect(Math.floor(x - radius), Math.floor(y - radius), size, size);

      ctx.strokeStyle = "white";
      ctx.lineWidth = getCursorLineWidth(zoom);
      ctx.stroke();
    },
  },
  eraser: {
    draw: ({ ctx, size, lastX, lastY, x, y }) => {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);

      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = size;
      ctx.lineCap = "round";

      ctx.lineTo(x, y);
      ctx.stroke();
    },
    drawCursor: drawCursorCircle,
  },
} as const satisfies Record<string, Tool>;

function rectLineBetween(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size: number,
  color: string,
  ctx: CanvasRenderingContext2D,
) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    ctx.fillStyle = color;
    const radius = Math.floor(size / 2);
    ctx.fillRect(x0 - radius, y0 - radius, size, size);

    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function getCursorLineWidth(zoom: number) {
  return 0.66 / Math.pow(zoom, 0.8);
}

function drawCursorCircle({ ctx, x, y, size, zoom }: ToolCursorContext) {
  ctx.globalCompositeOperation = "difference";

  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);

  ctx.strokeStyle = "white";
  ctx.lineWidth = getCursorLineWidth(zoom);
  ctx.stroke();
}
