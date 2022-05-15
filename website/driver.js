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
 * @param target The HTMLElement to which the event listener should be added.
 */
function addRedrawListener(target) {
  target.addEventListener("change", () => {
    updateViz();
  });
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
  const scolledDown = window.pageYOffset > 300;
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

  const selectedMetric = document.getElementById("metric").value;
  return isZoomingAxis ? GAP_SIZES[selectedMetric] : {"max": MAX_GAP, "min": MIN_GAP};
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
  const filterChecks = Array.from(document.getElementsByClassName("filter-check"));
  const unchecked = filterChecks.filter((x) => !x.checked);
  const values = unchecked.map((x) => x.getAttribute("filtervalue"));
  return values;
}


/**
 * Clear the contents of the viz table and create a new presenter.
 *
 * @returns Newly created presenter.
 */
function createNewPresenter() {
  d3.select("#vizTableBody").html("");
  currentPresenter = new VizPresenter(MAX_PAY, MIN_GAP, MAX_GAP, MAX_GINI);
  return currentPresenter;
}


/**
 * Update the visualization.
 *
 * @param removalList List of groups (names of groups like Male, Female) to
 *   exclude.
 */
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


/**
 * Clear existing elements and create a new presenter.
 */
function hardRedraw() {
  createNewPresenter();
  updateViz();
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
  initalLoadViz();

  rememberClientWidth();
  window.addEventListener("resize", onResize);

  addHardRedrawListenerId("zoomingAxisCheck");
  addHardRedrawListenerId("colorblindModeCheck");
  const otherChecks = document.querySelectorAll(".filter-check");
  otherChecks.forEach(addHardRedrawListener);
  
  addRedrawListener(document.getElementById("metric"));
  addRedrawListener(document.getElementById("groupSizeCheck"));

  document.addEventListener("scroll", onScroll);

  const editFilterLink = document.getElementById("editFilterLink");
  editFilterLink.addEventListener("click", toggleFiltersPanel);
}
