let settingsDisplayed = false;


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

  addCheckboxListener(document.getElementById("zoomingAxisCheck"));
  addCheckboxListener(document.getElementById("groupSizeCheck"));
  addCheckboxListener(document.getElementById("colorblindModeCheck"));

  const settingsLink = document.getElementById("moreSettingsLink");
  settingsLink.addEventListener("click", (event) => {
    const d3Controls = d3.select("#vizDetailControls");
    const settingsLink = document.getElementById("moreSettingsLink");

    event.preventDefault();

    if (settingsDisplayed) {
      d3Controls.transition().duration(500)
        .style("opacity", 0)
        .on("end", () => {
          d3Controls.style("display", "none");
        });
      settingsLink.innerHTML = "more settings >>";
    } else {
      d3Controls.style("display", "block");
      settingsLink.innerHTML = "close settings";

      d3Controls.style("opacity", 0);
      d3Controls.transition().duration(500)
        .style("opacity", 1);
    }

    settingsDisplayed = !settingsDisplayed;
  });
}


init();
