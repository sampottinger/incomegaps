updateViz();

window.addEventListener("resize", onResize);

document.getElementById("metric").addEventListener("change", () => {
  updateViz();
});
