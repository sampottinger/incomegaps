const SOURCE_DATA_LOC = "/2021.csv";

const MAX_PAY = 60;
const MIN_GAP = -80;
const MAX_GAP = 80;
const MAX_GINI = 20;

const DEFAULT_GLYPH_SIZE = 7;
const MAX_GLYPH_SIZE = 9;
const MIN_GLYPH_SIZE = 2;

const ATTRS = [
  "female",
  "wbhaom",
  "educ",
  "region",
  "citistat",
  "age"
];

const GAP_SIZES = {
  "female": {"max": 40, "min": -40},
  "wbhaom": {"max": 60, "min": -60},
  "educ": {"max": 80, "min": -80},
  "region": {"max": 40, "min": -40},
  "citistat": {"max": 40, "min": -40},
  "age": {"max": 40, "min": -60}
}

let currentPresenter = null;
let cachedDataset = null;
let lastClientWidth = -1;


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


function getGroupFills(index) {
  return GROUP_FILLS[index];
}


function getGlyphStrategy(index) {
  const colorblindEnabled = isColorblindModeEnabled();
  return colorblindEnabled ? GLPH_STRATEGIES[index] : GLPH_STRATEGIES[0];
}


function getGlyphTransition(index) {
  const colorblindEnabled = isColorblindModeEnabled();
  return colorblindEnabled ? GLPH_TRANSITIONS[index] : GLPH_TRANSITIONS[0];
}


class Record {

  constructor(name, pay, gapInfo, gini) {
    const self = this;
    self._name = name;
    self._pay = pay;
    self._gapInfo = gapInfo;
    self._gini = gini;
  }

  getName() {
    const self = this;
    return self._name;
  }

  getPay() {
    const self = this;
    return self._pay;
  }

  getGapInfo() {
    const self = this;
    return self._gapInfo;
  }

  getGini() {
    const self = this;
    return self._gini;
  }

}


class Dataset {

  constructor(rawResults) {
    const self = this;

    self._rawResults = rawResults;
  }

  query(groupingAttrName, removedGroups) {
    const self = this;

    if (removedGroups === undefined) {
      removedGroups = [];
    }

    const occupationRollup = self._rollupQuery(
      groupingAttrName,
      removedGroups
    );
    
    if (occupationRollup === null) {
      return null;
    }
    
    return self._summarizeQuery(occupationRollup);
  }

  _rollupQuery(groupingAttrName, removedGroups) {
    const self = this;

    const occupationRollup = new Map();

    const validResults = self._rawResults.filter((x) => x["docc03"] !== undefined)
      .filter((x) => x[groupingAttrName] !== undefined);

    const totalGroup = {
      "groupings": new Map(),
      "wageTotal": 0,
      "countTotal": 0
    };

    const validResultsFilter = validResults.filter((rawRecord) => {
      const foundGroups = ATTRS.filter((attr) => {
        return removedGroups.indexOf(rawRecord[attr]) != -1;
      });
      return foundGroups.length == 0;
    });
    
    if (validResultsFilter.length == 0) {
      return null;
    }

    validResultsFilter.forEach((rawRecord) => {
      const groupingAttr = rawRecord[groupingAttrName];
      const occupation = rawRecord["docc03"];
      const wages = parseFloat(rawRecord["wageotc"]);
      const count = parseFloat(rawRecord["count"]);

      if (!occupationRollup.has(occupation)) {
        occupationRollup.set(occupation, {
          "groupings": new Map(),
          "wageTotal": 0,
          "countTotal": 0
        });
      }

      const occupationRecord = occupationRollup.get(occupation);
      occupationRecord["wageTotal"] += wages * count;
      occupationRecord["countTotal"] += count;

      totalGroup["wageTotal"] += wages * count;
      totalGroup["countTotal"] += count;

      const groupings = occupationRecord["groupings"];
      if (!groupings.has(groupingAttr)) {
        groupings.set(groupingAttr, {
          "wageTotal": 0,
          "countTotal": 0
        });
      }

      const groupingInfo = groupings.get(groupingAttr);
      groupingInfo["wageTotal"] += wages * count;
      groupingInfo["countTotal"] += count;

      const totalGroupings = totalGroup["groupings"];
      if (!totalGroupings.has(groupingAttr)) {
        totalGroupings.set(groupingAttr, {
          "wageTotal": 0,
          "countTotal": 0
        });
      }

      const totalGroupingInfo = totalGroupings.get(groupingAttr);
      totalGroupingInfo["wageTotal"] += wages * count;
      totalGroupingInfo["countTotal"] += count;
    });

    occupationRollup.set("All occupations", totalGroup);

    return occupationRollup;
  }

  _summarizeQuery(occupationRollup) {
    const self = this;

    let names = [];
    occupationRollup.forEach((rawRecord, occupationName) => {
      rawRecord["groupings"].forEach((record, name) => {
        if (names.indexOf(name) == -1) {
          names.push(name);
        }
      });
    });
    names.sort();

    if (names.indexOf("<25 yr") != -1) {
      names = names.filter((x) => x !== "<25 yr");
      names.unshift("<25 yr");
    }

    if (names.indexOf("Some college") != -1) {
      names = names.filter((x) => x !== "Some college");
      names.splice(2, 0, "Some college");
    }

    const outputRecords = [];
    occupationRollup.forEach((rawRecord, occupationName) => {
      const pay = rawRecord["wageTotal"] / rawRecord["countTotal"];
      const gapInfo = self._getGapInfo(pay, rawRecord["groupings"], names);
      const gini = self._getGini(rawRecord["groupings"]);
      const outputRecord = new Record(
        occupationName,
        pay,
        gapInfo,
        gini
      );
      outputRecords.push(outputRecord);
    });

    outputRecords.sort((a, b) => {
      if (a.getName() === "All occupations") {
        return -1;
      } else if (b.getName() === "All occupations") {
        return 1;
      } else {
        return a.getPay() - b.getPay();
      }
    });

    return outputRecords;
  }

  _getGapInfo(meanPay, rawGroupings, names) {
    const self = this;
    const retMap = new Map();

    names.forEach((name) => {
      if (rawGroupings.has(name)) {
        const rollup = rawGroupings.get(name);
        const groupingMean = rollup["wageTotal"] / rollup["countTotal"];
        const percentDiff = ((groupingMean - meanPay) / meanPay) * 100;
        retMap.set(name, {"value": percentDiff, "pop": rollup["countTotal"]});
      } else {
        retMap.set(name, {"value": null, "pop": 0});
      }
    });

    return retMap;
  }

  _getGini(groupings) {
    const self = this;

    const groupingsItems = [...groupings.values()];

    if (groupingsItems.length == 0) {
      throw "Groupings must have length > 0";
    }

    const totalIncome = groupingsItems
      .map((x) => x["wageTotal"])
      .reduce((a, b) => a + b);

    const totalPopulation = groupingsItems
      .map((x) => x["countTotal"])
      .reduce((a, b) => a + b);

    groupingsItems.sort((a, b) => {
      const aWage = a["wageTotal"] / a["countTotal"];
      const bWage = b["wageTotal"] / b["countTotal"];
      return aWage - bWage;
    });

    let percentRemaining = 1;

    const giniDetails = groupingsItems.map((x) => {
      const popPercent = x["countTotal"] / totalPopulation;
      percentRemaining -= popPercent;

      return {
        "income": x["wageTotal"] / totalIncome,
        "population": popPercent,
        "higher": percentRemaining
      };
    });

    const giniScores = giniDetails.map((x) => {
      return x["income"] * (x["population"] + 2 * x["higher"]);
    });

    const sumScores = giniScores.reduce((a, b) => a + b);

    const decimal = 1 - sumScores;

    return decimal * 100;
  }

}


function loadSourceDataRaw(loc) {
  if (loc === undefined) {
    loc = SOURCE_DATA_LOC;
  }

  return new Promise((resolve, reject) => {
    Papa.parse(loc, {
      download: true,
      header: true,
      complete: (results) => {
        resolve(results);
      }
    });
  });
}


function loadSourceDataNoCache(loc) {
  return loadSourceDataRaw(loc).then((raw) => new Dataset(raw["data"]));
}


function loadSourceData(loc) {
  if (cachedDataset === null) {
    return loadSourceDataNoCache(loc).then((result) => {
      cachedDataset = result;
      return result;
    });
  } else {
    return new Promise((resolve, reject) => {
      resolve(cachedDataset);
    });
  }
}


class VizPresenter {

  constructor(maxPay, minGap, maxGap, maxGini) {
    const self = this;

    self._maxPay = maxPay;
    self._minGap = minGap;
    self._maxGap = maxGap;
    self._maxGini = maxGini;

    self._numFormatInt = (x) => d3.format(".0f")(x).replaceAll("−", "-");
    self._numFormatConcise = (x) => d3.format(".1f")(x).replaceAll("−", "-");
    self._numFormat = (x) => d3.format(".2f")(x).replaceAll("−", "-");
    self._numFormatSign = (x) => d3.format("+.1f")(x).replaceAll("−", "-");

    self._updateWidths();
  }

  draw(queryResults) {
    const self = this;

    return new Promise((resolve, reject) => {
      const selection = self._createSelection(queryResults);

      selection.exit().remove();
      const selectionUpdated = self._createElements(selection);

      self._updateFixedElements(selectionUpdated);

      self._updateWidths();
      self._updateGapElements(selectionUpdated);
      self._updateLegend(queryResults);
      resolve();
    });
  }

  _updateWidths() {
    const self = this;

    self._maxPayWidth = self._getWidth("cell-pay");
    self._maxGapWidth = self._getWidth("cell-gap");
    self._maxGiniWidth = self._getWidth("cell-gini");

    self._payScale = d3.scaleLinear()
      .domain([0, self._maxPay])
      .range([0, self._maxPayWidth]);

    d3.select("#maxPay").html(self._numFormatConcise(self._maxPay));

    const effectiveMinMax = getGapMinMax();
    const effectiveMin = effectiveMinMax["min"];
    const effectiveMax = effectiveMinMax["max"];

    self._gapScale = d3.scaleLinear()
      .domain([effectiveMin, effectiveMax])
      .range([20, self._maxGapWidth - 20]);

    self._giniScale = d3.scaleLinear()
      .domain([0, self._maxGini])
      .range([0, self._maxGiniWidth]);

    d3.select("#maxGini").html(self._numFormatConcise(self._maxGini));
  }

  _getWidth(selector) {
    const self = this;
    const firstElem = document.getElementsByClassName(selector)[0];
    return firstElem.getBoundingClientRect()["width"];
  }

  _createSelection(queryResults) {
    const self = this;

    return d3.select("#vizTableBody")
      .selectAll(".viz-row")
      .data(queryResults, (x) => x.getName());
  }

  _createElements(selection) {
    const self = this;

    const midX = self._gapScale(0);

    const ticks = [-80, -60, -40, -20, 0, 20, 40, 60, 80];
    d3.select("#gapAxes").selectAll(".label").data(ticks, (x) => x).enter()
      .append("text")
      .classed("label", true)
      .attr("x", midX)
      .attr("y", 10)
      .html((x) => self._numFormatInt(x) + "%");

    const newElements = selection.enter()
      .append("tr")
      .classed("viz-row", true);

    const newOccupationCells = newElements.append("td")
      .classed("cell-occupation", true);

    newOccupationCells.append("span")
      .classed("occupation-label", true)
      .html((x) => x.getName().replaceAll(" occupations", ""));

    const newPayElements = newElements.append("td")
      .classed("cell-pay", true);

    newPayElements.append("div")
      .classed("bar-label", true);

    newPayElements.append("div")
      .classed("bar-body", true)
      .style("width", 0);

    const newGapElements = newElements.append("td")
      .classed("cell-gap", true);

    const newGapSvg = newGapElements.append("svg")
      .classed("cell-gap-svg", true);

    newGapSvg.append("rect")
      .classed("gap-line", true)
      .attr("x", midX);

    newGapSvg.selectAll("tick").data(ticks, (x) => x).enter().append("rect")
      .classed("tick", true)
      .classed("center-line", (x) => x == 0)
      .attr("x", midX);

    const newGiniElements = newElements.append("td")
      .classed("cell-gini", true);

    newGiniElements.append("div")
      .classed("bar-label", true);

    newGiniElements.append("div")
      .classed("bar-body", true)
      .style("width", 0);

    return selection.merge(newElements);
  }

  _updateFixedElements(selection) {
    const self = this;

    const payElements = selection.select(".cell-pay");

    payElements.select(".bar-label")
      .html((x) => self._numFormat(x.getPay()));

    payElements.select(".bar-body")
      .transition()
      .style("width", (x) => self._payScale(x.getPay()) + "px");

    const giniElements = selection.select(".cell-gini");

    giniElements.select(".bar-label")
      .html((x) => self._numFormat(x.getGini()));

    giniElements.select(".bar-body")
      .transition()
      .style("width", (x) => self._giniScale(x.getGini()) + "px");
  }

  _updateGapElements(selection) {
    const self = this;

    const axesSelection = d3.select("#gapAxes").selectAll(".label").transition()
      .duration(1000)
      .attr("x", (x) => self._gapScale(x))
      .attr("y", 10);

    const svgSelection = selection.select(".cell-gap-svg");
    svgSelection.selectAll(".tick").transition()
      .duration(1000)
      .attr("x", (x) => self._gapScale(x));

    const innerSelection = svgSelection.selectAll(".gap-group");

    const innerElements = innerSelection.data((x) => {
        const simplified = [];

        let maxPop = 0;
        x.getGapInfo().forEach((datum, name) => {
          const pop = datum["pop"];
          if (pop > maxPop) {
            maxPop = pop;
          }
        });
        const popScale = d3.scaleLinear()
          .domain([0, Math.sqrt(maxPop)])
          .range([MIN_GLYPH_SIZE, MAX_GLYPH_SIZE]);

        let i = 0;
        x.getGapInfo().forEach((datum, name) => {
          const value = datum["value"];
          const pop = datum["pop"];
          const size = isSizingEnabled() ? popScale(Math.sqrt(pop)) : DEFAULT_GLYPH_SIZE;
          simplified.push({"name": name, "value": value, "size": size, "i": i});
          i++;
        });

        return simplified;
    }, (x) => x["i"]);

    const midX = self._gapScale(0);
    const newGroups = innerElements.enter()
      .append("g")
      .classed("gap-group", true)
      .attr("transform", "translate(" + midX + ",10)")
      .attr("opacity", 0)
      .on("mouseover", (event, datum) => {
        self._setGlyphHover(datum["i"]);
      })
      .on("mouseout", (event, datum) => {
        self._clearGlyphHover();
      });

    newGroups.each(function (datum) {
      const radius = datum["size"];
      const i = datum["i"];
      const glyphStrategy = getGlyphStrategy(i);
      glyphStrategy(d3.select(this), i, radius);
    });

    newGroups.append("text")
      .classed("gap-label", true)
      .attr("x", 0)
      .attr("y", 17);

    innerElements.exit().remove();

    const joinedInnerElements = d3.selectAll(".gap-group");

    joinedInnerElements.transition()
      .delay(200)
      .duration(1000)
      .attr("transform", (x) => {
        const midX = self._maxGapWidth / 2;
        const newX = x["value"] === null ? midX : self._gapScale(x["value"]);
        return "translate(" + newX + ", 10)";
      })
      .attr("opacity", (x) => {
        if (x["pop"] < 1) {
          return 0;
        } else {
          return x["value"] === null ? 0 : 0.8;
        }
      });

    joinedInnerElements.each(function (datum) {
      const radius = datum["size"];
      const i = datum["i"];
      const glyphTransition = getGlyphTransition(i);
      glyphTransition(d3.select(this), i, radius);
    });

    joinedInnerElements.select(".gap-label")
      .html((x) => {
        return self._numFormatSign(x["value"]) + "%";
      });

    selection.select(".cell-gap-svg").select(".gap-line")
      .transition()
      .delay(200)
      .duration(1000)
      .attr("x", (x) => {
        let minX = midX;
        x.getGapInfo().forEach((datum, name) => {
          const value = datum["value"];
          const midX = self._maxGapWidth / 2;
          const newX = value === null ? midX : self._gapScale(value);
          if (newX < minX && datum["pop"] > 0) {
            minX = newX;
          }
        });
        return minX;
      })
      .attr("width", (x) => {
        let minX = midX;
        let maxX = midX;
        x.getGapInfo().forEach((datum, name) => {
          const value = datum["value"];
          const midX = self._maxGapWidth / 2;
          const newX = value === null ? midX : self._gapScale(value);
          if (datum["pop"] > 0) {
            if (newX < minX) {
              minX = newX;
            }
            if (newX > maxX) {
              maxX = newX;
            }
          }
        });
        return maxX - minX;
      });
  }

  _setGlyphHover(index) {
    const self = this;
    const groups = d3.selectAll(".gap-group");
    groups.classed("glyph-hovering", (x) => x["i"] == index);

    const labels = d3.selectAll(".glyph-label-display");
    labels.classed(
      "glyph-hovering",
      (x) => x !== undefined && x["i"] == index
    );
  }

  _clearGlyphHover() {
    const self = this;
    d3.selectAll(".gap-group").classed("glyph-hovering", false);
    d3.selectAll(".glyph-label-display").classed("glyph-hovering", false);
  }

  _updateLegend(dataset) {
    const self = this;

    // Get info
    let i = 0;
    const outputRecords = [];
    dataset[0].getGapInfo().forEach((datum, name) => {
      outputRecords.push({"name": name, "i": i});
      i++;
    });

    // Make labels
    const glyphLabels = d3.select("#glyphLabels");
    glyphLabels.html("");

    const labelCells = glyphLabels.selectAll(".label-cell")
      .data(outputRecords)
      .enter()
      .append("td")
      .classed("label-cell", true);

    labelCells.html((x) => x["name"]);

    // Make glyphs
    const glyphDisplays = d3.select("#glyphDisplays");
    glyphDisplays.html("");

    const glyphCells = glyphDisplays.selectAll(".glyph-cell")
      .data(outputRecords)
      .enter()
      .append("td")
      .classed("glyph-cell", true);

    const glyphInnerDisplays = glyphCells.append("svg")
      .classed("glyph-label-display", true)
      .append("g")
      .attr("transform", "translate(10, 10)")
      .on("mouseover", (event, datum) => {
        self._setGlyphHover(datum["i"]);
      })
      .on("mouseout", (event, datum) => {
        self._clearGlyphHover();
      });

    glyphInnerDisplays.each(function (datum) {
      const i = datum["i"];
      const glyphStrategy = getGlyphStrategy(i);
      glyphStrategy(d3.select(this), i, DEFAULT_GLYPH_SIZE);
    });

    // Make size display
    const sizeLegend = d3.select("#sizeLegend");
    sizeLegend.style("display", isSizingEnabled() ? "inline-block" : "none");

    const minDisplay = d3.select("#minSizeDisplay");
    const maxDisplay = d3.select("#maxSizeDisplay");
    const glyphStrategy = getGlyphStrategy(i);
    minDisplay.html("");
    maxDisplay.html("");
    glyphStrategy(
      minDisplay.append("g").attr("transform", "translate(10, 10)"),
      0,
      MIN_GLYPH_SIZE
    );
    glyphStrategy(
      maxDisplay.append("g").attr("transform", "translate(10, 10)"),
      0,
      MAX_GLYPH_SIZE
    );
  }

}


function getClientWidth() {
  return document.documentElement.clientWidth;
}


function createNewPresenter() {
  d3.select("#vizTableBody").html("");
  currentPresenter = new VizPresenter(MAX_PAY, MIN_GAP, MAX_GAP, MAX_GINI);
  return currentPresenter;
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


function updateViz() {
  if (currentPresenter === null) {
    currentPresenter = createNewPresenter();
  }

  const curTarget = document.getElementById("metric").value;
  return loadSourceData().then((result) => {
    const removalList = getRemovalList();
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
