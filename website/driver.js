let filtersOpen = false;


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
  document.querySelectorAll(".filter-check").forEach((target) => {
    addCheckboxListener(target);
  });
  addRedrawListener(document.getElementById("metric"));
  addRedrawListener(document.getElementById("groupSizeCheck"));

  document.addEventListener("scroll", (event) => {
    d3.select("#glyphLegendHolder").classed("fixed", window.pageYOffset > 300);
  });

  const editFilterLink = document.getElementById("editFilterLink");
  editFilterLink.addEventListener("click", (event) => {
    const filtersPanel = document.getElementById("filtersPanel");
    if (filtersOpen) {
      filtersPanel.style.display = "none";
      editFilterLink.innerHTML = "Edit filters";
      filtersOpen = false;
    } else {
      filtersPanel.style.display = "block";
      editFilterLink.innerHTML = "Close filters";
      filtersOpen = true;
    }

    event.preventDefault();

    document.getElementById("femaleCheck").focus();
  });
}


init();
