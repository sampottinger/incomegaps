let currentPresenter = null;
let cachedDataset = null;
let filtersOpen = false;
let lastClientWidth = -1;


function addCheckboxListener(target) {
  target.addEventListener("change", () => {
    hardRedraw();
  });
}


function addCheckboxListenerById(targetId) {
  const target = document.getElementById(targetId);
  addCheckboxListener(target);
}


function addRedrawListener(target) {
  target.addEventListener("change", () => {
    updateViz();
  });
}


function onScroll(event) {
  const scolledDown = window.pageYOffset > 300;
  const glyphHolder = d3.select("#glyphLegendHolder");
  glyphHolder.classed("fixed", scolledDown);
}


function initalLoadViz() {
  const fadeInViz = () => {
    d3.select("#loadingIndicator")
      .transition()
      .style("opacity", 0)
      .on("end", () => {
        d3.select("#loadingIndicator").style("display", "none");
        d3.select("#vizHolder").transition().style("opacity", "1");
      });
  };
  
  updateViz().then(fadeInViz);
}


function toggleFiltersPanel(event) {
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
}


function getGapMinMax() {
  const zoomingAxisCheck = document.getElementById("zoomingAxisCheck");
  const isZoomingAxis = zoomingAxisCheck.checked;

  const selectedMetric = document.getElementById("metric").value;
  return isZoomingAxis ? GAP_SIZES[selectedMetric] : {"max": MAX_GAP, "min": MIN_GAP};
}


function isColorblindModeEnabled() {
  const colorblindCheck = document.getElementById("colorblindModeCheck");
  const isColorblindMode = colorblindCheck.checked;
  return isColorblindMode;
}


function isSizingEnabled() {
  const sizingCheck = document.getElementById("groupSizeCheck");
  const isSizingMode = sizingCheck.checked;
  return isSizingMode;
}


function getClientWidth() {
  return document.documentElement.clientWidth;
}


function rememberClientWidth() {
  lastClientWidth = getClientWidth();
}


function getRemovalList() {
  const filterChecks = Array.from(document.getElementsByClassName("filter-check"));
  const unchecked = filterChecks.filter((x) => !x.checked);
  const values = unchecked.map((x) => x.getAttribute("filtervalue"));
  return values;
}


function updateViz(removalList) {
  if (currentPresenter === null) {
    currentPresenter = createNewPresenter();
  }

  const curTarget = document.getElementById("metric").value;
  return loadSourceData().then((result) => {
    if (removalList === undefined) {
      removalList = getRemovalList();
    }
    
    const queryResults = result.query(curTarget, removalList);
    
    const vizBody = document.getElementById("vizBody");
    const noDataMessage = document.getElementById("noDataMessage");
    if (queryResults === null) {
      vizBody.style.display = "none";
      noDataMessage.style.display = "block";
    } else {
      vizBody.style.display = "block";
      noDataMessage.style.display = "none";
      currentPresenter.draw(queryResults);
    }

    const numFilters = removalList.length;
    const filterCountLabel = numFilters == 0 ? "No" : numFilters;
    const filterUnitLabel = numFilters == 1 ? "filter" : "filters"
    const filterLabel = filterCountLabel + " " + filterUnitLabel;
    document.getElementById("filtersCountLabel").innerHTML = filterLabel;

    return queryResults;
  });
}


function hardRedraw() {
  createNewPresenter();
  updateViz();
}


function onResize() {
  if (lastClientWidth == getClientWidth()) {
    return;
  }

  rememberClientWidth();
  hardRedraw();
}


function init() {
  initalLoadViz();

  rememberClientWidth();
  window.addEventListener("resize", onResize);

  addCheckboxListenerId("zoomingAxisCheck");
  addCheckboxListenerId("colorblindModeCheck");
  const otherChecks = document.querySelectorAll(".filter-check");
  otherChecks.forEach(addCheckboxListener);
  
  addRedrawListener(document.getElementById("metric"));
  addRedrawListener(document.getElementById("groupSizeCheck"));

  document.addEventListener("scroll", onScroll);

  const editFilterLink = document.getElementById("editFilterLink");
  editFilterLink.addEventListener("click", toggleFiltersPanel);
}
