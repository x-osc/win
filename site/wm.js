let zIndexCounter = 1;

function createWindow(title) {
  const win = document.createElement("div");
  win.className = "window";
  win.style.zIndex = zIndexCounter++;
  win.innerHTML = `
        <div class="titlebar">
            <span class="window-title">${title}</span>
            <button class="close-button" onclick="closeWindow(this)">X</button>
        </div>
        <div class="content">ajsdlkjflkdsjf</div>
    `;

  titlebar = win.querySelector(".titlebar");

  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  titlebar.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    win.style.zIndex = zIndexCounter++;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  document.getElementById("desktop").appendChild(win);
}
