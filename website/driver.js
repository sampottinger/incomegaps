function addCheckboxListener(target) {
  target.addEventListener("change", () => {
    hardRedraw();
  });
}


function init() {
  updateViz().then(() => {
    d3.select("#loadingIndicator")
      .transition()
      .style("opacity", 0)
      .on("end", () => {
        d3.select("#loadingIndicator").style("display", "none");
        d3.select("#vizHolder").transition().style("opacity", "1");
      });
  });

  rememberClientWidth();
  window.addEventListener("resize", onResize);

  document.getElementById("metric").addEventListener("change", () => {
    updateViz();
  });

  addCheckboxListener(document.getElementById("zoomingAxisCheck"));
  addCheckboxListener(document.getElementById("groupSizeCheck"));
  addCheckboxListener(document.getElementById("colorblindModeCheck"));
}


init();
