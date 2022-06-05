/**
 * Main entry point and logic for interfacing with the visualization webpage.
 *
 * @author A Samuel Pottinger
 * @license MIT
 */

let currentPresenter = null;
let cachedDataset = null;
let filtersOpen = false;
let lastClientWidth = -1;


/**
 * Add a listener to an input that performs a "hard" redraw.
 *
 * Add a listener to a input that performs a "hard" redraw when the value of
 * that input changes. A "hard" redraw will clear all existing elements and
 * make new ones, required if the structure of the underlying data
 * dramatically changes.
 *
 * @param target The HTMLElement to which the event listener should be added.
 */
function addHardRedrawListener(target) {
  target.addEventListener("change", () => {
    hardRedraw();
  });
}


/**
 * Add a listener to an input that performs a "hard" redraw.
 *
 * Add a listener to an input that performs a "hard" redraw when the value of
 * that input changes. A "hard" redraw will clear all existing elements and
 * make new ones, required if the structure of the underlying data
 * dramatically changes.
 *
 * @param targetId The ID (without #) of the element to which the event
 *   listener should be added.
 */
function addHardRedrawListenerId(targetId) {
  const target = document.getElementById(targetId);
  addHardRedrawListener(target);
}


/**
 * Add a listener to an input that performs a "soft" redraw.
 *
 * Add a listener to a input that performs a "soft" redraw when the value of
 * that input changes. A "soft" redraw will update existing elements.
 *
 * @param target The ID of element to which the event listener should be added.
 */
function addRedrawListener(target) {
  target.addEventListener("change", () => {
    updateViz();
  });
}


/**
 * Add a listener to an input that performs a "soft" redraw.
 *
 * Add a listener to a input that performs a "soft" redraw when the value of
 * that input changes. A "soft" redraw will update existing elements.
 *
 * @param target The HTMLElement to which the event listener should be added.
 */
function addRedrawListenerId(targetId) {
  const target = document.getElementById(targetId);
  addRedrawListener(target);
}


/**
 * Add a listener to an input that performs a "soft" redraw.
 *
 * Add a listener to an input that performs a "soft" redraw when the value of
 * that input changes. A "soft" redraw will update existing elements.
 *
 * @param targetId The ID (without #) of the element to which the event
 *   listener should be added.
 */
function onScroll(event) {
  const scolledDown = window.pageYOffset > (filtersOpen ? 600 : 300);
  const glyphHolder = d3.select("#glyphLegendHolder");
  glyphHolder.classed("fixed", scolledDown);
}


/**
 * Perform the initial drawing of the visualization.
 *
 * Perform the initial drawing of the visualization, causing an intro fade in
 * animation to play, hiding the loading indicator.
 */
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


/**
 * Toggle if the filters panel is shown to the user.
 *
 * @param event The event causing this filter panel visibility change.
 */
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


/**
 * Get the max value to show to the user on the percent difference gap axis.
 *
 * @returns The max percent gap value to show to the user. Values over this
 *   will be off screen.
 */
function getGapMinMax() {
  const zoomingAxisCheck = document.getElementById("zoomingAxisCheck");
  const isZoomingAxis = zoomingAxisCheck.checked;

  const selectedDimension = document.getElementById("dimension").value;
  const variable = getVariable();

  const globalMinMaxes = getMinMaxes();
  const maxGap = globalMinMaxes["maxValue"];
  const minGap = globalMinMaxes["minGap"];

  if (isZoomingAxis) {
    return GAP_SIZES[variable][selectedDimension];
  } else {
    return {"max": maxGap, "min": minGap};
  }
}


/**
 * Determine if the user has requested colorblind mode.
 *
 * @returns True if colorblind mode requested by the user. False otherwise.
 */
function isColorblindModeEnabled() {
  const colorblindCheck = document.getElementById("colorblindModeCheck");
  const isColorblindMode = colorblindCheck.checked;
  return isColorblindMode;
}


/**
 * Determine if the user has requested summary metrics.
 *
 * @returns True if colorblind summary metrics requested by the user. False
 *   otherwise.
 */
function isMetricDisplayEnabled() {
  const metricsCheck = document.getElementById("metricsCheck");
  const isMetricsCheck = metricsCheck.checked;
  return isMetricsCheck;
}


/**
 * Determine if the user has requested sizing of glyphs by subpopulation size.
 *
 * @returns True if glpyhs should be sized according to subpopulation size or
 *   false oterwise.
 */
function isSizingEnabled() {
  const sizingCheck = document.getElementById("groupSizeCheck");
  const isSizingMode = sizingCheck.checked;
  return isSizingMode;
}


/**
 * Get the width of the display area for the website.
 *
 * @returns Width of the display area in pixels.
 */
function getClientWidth() {
  return document.documentElement.clientWidth;
}


/**
 * Cache the current display area for the website.
 *
 * Cache the current display area for the website, will be used to determine if
 * the display area has changed.
 */
function rememberClientWidth() {
  lastClientWidth = getClientWidth();
}


/**
 * Get the list of groups to exclude (filter out) from dataset queries.
 *
 * @returns Array of strings for groups to exclude (names of groups like Male,
 *   Female).
 */
function getRemovalList() {
  const filterChecks = Array.from(
    document.getElementsByClassName("filter-check")
  );
  const unchecked = filterChecks.filter((x) => !x.checked);
  const values = unchecked.map((x) => x.getAttribute("filtervalue"));
  return values;
}


/**
 * Get the min max values to use for global metric displays.
 *
 * @returns Object with minValue, minGap, maxGap, maxGini.
 */
function getMinMaxes() {
  const variable = getVariable();
  return GLOBAL_MIN_MAXES[variable];
}


/**
 * Get the name of the variable selected by the user.
 *
 * @returns Name of the variable selected.
 */
function getVariable() {
  return document.getElementById("variable").value.split(".")[0];
}


/**
 * Get the name of the type of aggregation to use (mean, median).
 *
 * @returns Strategy name either mean or median.
 */
function getSummaryType() {
  return document.getElementById("variable").value.split(".")[1];
}


/**
 * Get the record attribute names for a variable.
 *
 * @returns Object with "variable" and "count" attributes.
 */
function getVariableAttrs() {
  const variable = getVariable();
  return VARIABLE_NAMES[variable];
}


/**
 * Get the tick information based on the variable.
 *
 * @returns Object with tick info;
 */
function getTickInfo() {
  const variable = getVariable();
  return TICK_INFO[variable];
}


/**
 * Clear the contents of the viz table and create a new presenter.
 *
 * @returns Newly created presenter.
 */
function createNewPresenter() {
  const minMaxes = getMinMaxes();

  d3.select("#gapAxes").html("");
  d3.select("#vizTableBody").html("");
  currentPresenter = new VizPresenter(
    minMaxes["maxValue"],
    minMaxes["minGap"],
    minMaxes["maxGap"],
    minMaxes["maxGini"]
  );
  return currentPresenter;
}


/**
 * Load the serialized visualization state from the URL if one avilable.
 */
function loadUrlState() {
  const urlComponents = window.location.href.split("?");
  if (urlComponents.length >= 2) {
    applyDeepLinkUrl(urlComponents[1]);
    d3.select("#toolSection").classed("fade-in", true);
  }
}


/**
 * Write the current visualization state to the URL.
 */
function saveUrlState() {
  const baseUrl = window.location.href.split("?")[0]
  const fullUrl = baseUrl + "?" + getDeepLinkUrl();
  history.pushState({}, "", fullUrl);
}


/**
 * Update the visualization.
 *
 * @param removalList List of groups (names of groups like Male, Female) to
 *   exclude.
 */
function updateViz(removalList) {
  saveUrlState();

  if (currentPresenter === null) {
    currentPresenter = createNewPresenter();
  }

  const curTarget = document.getElementById("dimension").value;
  return loadSourceData().then((result) => {
    if (removalList === undefined) {
      removalList = getRemovalList();
    }

    const requireMinCheck = document.getElementById("requireMinCheck");
    const requireMin = !requireMinCheck.checked;

    const minGroupSize = requireMin ? 0.00025 : 0;
    const queryResults = result.query(curTarget, removalList, minGroupSize);

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

    const numFilters = removalList.length + (requireMin ? 1 : 0);
    const filterCountLabel = numFilters == 0 ? "No" : numFilters;
    const filterUnitLabel = numFilters == 1 ? "filter" : "filters"
    const filterLabel = filterCountLabel + " " + filterUnitLabel;
    document.getElementById("filtersCountLabel").innerHTML = filterLabel;

    updateFlashTargets();

    return queryResults;
  });
}


/**
 * Clear existing elements and create a new presenter.
 */
function hardRedraw() {
  const lateLoadingIndicator = d3.select("#lateLoadingIndicator");

  lateLoadingIndicator.style("display", "block");
  lateLoadingIndicator.style("opacity", "0");
  lateLoadingIndicator.transition().style("opacity", 1).on("end", () => {
    createNewPresenter();
    updateViz();

    lateLoadingIndicator.transition().style("opacity", 0).on("end", () => {
      lateLoadingIndicator.style("display", "none");
    });
  });
}


/**
 * Callback for display area resize.
 *
 * On resize of window, create a new presenter and elements if the width of the
 * display has chnged.
 */
function onResize() {
  if (lastClientWidth == getClientWidth()) {
    return;
  }

  rememberClientWidth();
  hardRedraw();
}


/**
 * Register event listeners for the visualization and perform first render.
 */
function init() {
  loadUrlState();

  document.getElementById("shareLink").addEventListener("click", (event) => {
    const fullUrl = "https://incomegaps.com/?" + getDeepLinkUrl();
    navigator.clipboard.writeText(fullUrl);
    alert("URL copied to clipboard.");
    event.preventDefault();
  });

  const metricsCheck = document.getElementById("metricsCheck");
  metricsCheck.checked = getClientWidth() > 600;

  initalLoadViz();

  rememberClientWidth();
  window.addEventListener("resize", onResize);

  addHardRedrawListenerId("zoomingAxisCheck");
  addHardRedrawListenerId("colorblindModeCheck");
  addHardRedrawListenerId("metricsCheck");
  addHardRedrawListenerId("requireMinCheck");
  addHardRedrawListenerId("variable");

  const otherChecks = document.querySelectorAll(".filter-check");
  otherChecks.forEach(addHardRedrawListener);

  addRedrawListenerId("dimension");
  addRedrawListenerId("groupSizeCheck");

  document.addEventListener("scroll", onScroll);

  const editFilterLink = document.getElementById("editFilterLink");
  editFilterLink.addEventListener("click", toggleFiltersPanel);

  initIntro();
}
