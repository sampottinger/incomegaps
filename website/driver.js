function addCheckboxListener(target) {
  target.addEventListener("change", () => {
    hardRedraw();
  });
}


function init() {
  updateViz();

  rememberClientWidth();
  window.addEventListener("resize", onResize);

  document.getElementById("metric").addEventListener("change", () => {
    updateViz();
  });
  
  addCheckboxListener(document.getElementById("groupSizeCheck"));
  addCheckboxListener(document.getElementById("colorblindModeCheck"));
}


init();
