function addCheckboxListener(target) {
  target.addEventListener("change", () => {
    hardRedraw();
  });
}


function addRedrawListener(target) {
  target.addEventListener("change", () => {
    updateViz();
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

  addCheckboxListener(document.getElementById("zoomingAxisCheck"));
  addCheckboxListener(document.getElementById("colorblindModeCheck"));
  addRedrawListener(document.getElementById("metric"));
  addRedrawListener(document.getElementById("groupSizeCheck"));

  document.addEventListener("scroll", (event) => {
    d3.select("#glyphLegendHolder").classed("fixed", window.pageYOffset > 300);
  });
}


init();
