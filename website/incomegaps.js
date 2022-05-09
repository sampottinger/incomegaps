const SOURCE_DATA_LOC = "/2021.csv";
const MAX_PAY = 60;
const MIN_GAP = -80;
const MAX_GAP = 80;
const MAX_GINI = 0.2;

let currentPresenter = null;
let cachedDataset = null;
let lastClientWidth = -1;


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
  return colorblindEnabled ? GLPH_TRANSITIONS[index] : GLPH_TRANSITIONS[index];
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

  query(groupingAttrName) {
    const self = this;

    const occupationRollup = self._rollupQuery(groupingAttrName);
    return self._summarizeQuery(occupationRollup);
  }

  _rollupQuery(groupingAttrName) {
    const self = this;

    const occupationRollup = new Map();

    const validResults = self._rawResults.filter((x) => x["docc03"] !== undefined)
      .filter((x) => x[groupingAttrName] !== undefined);

    validResults.forEach((rawRecord) => {
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
    });

    return occupationRollup;
  }

  _summarizeQuery(occupationRollup) {
    const self = this;

    const names = [];
    occupationRollup.forEach((rawRecord, occupationName) => {
      rawRecord["groupings"].forEach((record, name) => {
        if (names.indexOf(name) == -1) {
          names.push(name);
        }
      });
    });
    names.sort();

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

    outputRecords.sort((a, b) => a.getPay() - b.getPay());

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

    return 1 - sumScores;
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

      setTimeout(() => {
        self._updateWidths();
        self._updateGapElements(selectionUpdated);
        resolve();
      }, 200);
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

    self._gapScale = d3.scaleLinear()
      .domain([self._minGap, self._maxGap])
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
    d3.select("#gapAxes").html("");
    d3.select("#gapAxes").selectAll(".label").data(ticks).enter()
      .append("text")
      .classed("label", true)
      .attr("x", midX)
      .attr("y", 10)
      .html((x) => self._numFormatInt(x));

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
      .classed("center-line", true);

    newGapSvg.append("rect")
      .classed("gap-line", true)
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
      .attr("x", (x) => self._gapScale(x))
      .attr("y", 10);

    const innerSelection = selection.select(".cell-gap-svg")
      .selectAll(".gap-group");

    const innerElements = innerSelection.data((x) => {
        const simplified = [];

        let maxPop = 0;
        x.getGapInfo().forEach((datum, name) => {
          const pop = datum["pop"];
          if (pop > maxPop) {
            maxPop = pop;
          }
        });
        const popScale = d3.scaleLinear().domain([0, Math.sqrt(maxPop)]).range([2, 8]);

        let i = 0;
        x.getGapInfo().forEach((datum, name) => {
          const value = datum["value"];
          const pop = datum["pop"];
          const size = isSizingEnabled() ? popScale(Math.sqrt(pop)) : 7;
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
      .attr("opacity", 0);

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

    selection.select(".cell-gap-svg").select(".center-line")
      .attr("x", midX);

    selection.select(".cell-gap-svg").select(".gap-line")
      .transition()
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


function updateViz(callback) {
  if (currentPresenter === null) {
    currentPresenter = createNewPresenter();
  }

  const curTarget = document.getElementById("metric").value;
  return loadSourceData().then((result) => {
    const queryResults = result.query(curTarget);
    currentPresenter.draw(queryResults);
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
