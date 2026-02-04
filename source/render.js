// Event listener when the DOM is loaded
// Title bar: dash.html has minimize, maximize, close; start.html has minimize, close only.
window.addEventListener("DOMContentLoaded", () => {
  const btnMin = document.getElementById("minimize");
  const btnMax = document.getElementById("maximize");
  const btnClose = document.getElementById("close");

  if (btnMin) btnMin.addEventListener('click', () => window.electronAPI.windowControl('minimize'));
  if (btnMax) btnMax.addEventListener('click', () => window.electronAPI.windowControl('maximize'));
  if (btnClose) btnClose.addEventListener('click', () => window.electronAPI.windowControl('close'));
});

