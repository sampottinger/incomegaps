let step = "step0";

const FLASH_TARGETS = {
  "step0": [],
  "step1": ["AllDisplay"],
  "step2": ["FoodpreparationandservingrelatedDisplay", "LegalDisplay"],
  "step3": ["groupSizeHolder", "InstallationmaintenanceandrepairDisplay"],
  "step4": ["dimensionHolder"],
  "step5": [
    "metricsCheckHolder",
    "HealthcarepractitionerandtechnicalDisplay",
    "HealthcaresupportDisplay",
    "valueLabel",
    "giniLabel"
  ],
  "step6": ["editFilterLink", "educationTitle"],
  "step7": ["variableHolder"],
  "step8": ["ArchitectureandengineeringDisplay"],
  "step9": ["shareLink"],
  "step10": []
}


function initIntro() {
  const elements = document.getElementsByClassName('step-link');
  for (var i=0; i < elements.length; i++) {
    let element = elements[i];
    element.addEventListener("click", (event) => {
      d3.select("#toolSection").classed("fade-in", true);

      step = event.target.getAttribute("targetstep");

      if (step === "step1") {
        applyDeepLinkObj({
          "variable": "income",
          "dimension": "female",
          "filters": "11111111111111111111111111110100",
          "config": "0010"
        });
        hardRedraw();
      }

      d3.selectAll(".active").classed("active", false);
      d3.select("#" + step).classed("active", true);
      updateFlashTargets();
    });
  }
}


function updateFlashTargets() {
  d3.selectAll(".flash").classed("flash", false);

  FLASH_TARGETS[step].forEach((x) => {
    d3.select("#" + x).classed("flash", true);
  });
}
