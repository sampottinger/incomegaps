const SOURCE_DATA_LOC = "/march_2022.csv";
const MAX_PAY = 60;
const MIN_GAP = -50;
const MAX_GAP = 50;
const MAX_GINI = 1;

let currentPresenter = null;
let cachedDataset = null;


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
        retMap.set(name, null);
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

    self._updateWidths();

    self._numFormat = (x) => d3.format(".2f")(x).replaceAll("−", "-");
    self._numFormatSign = (x) => d3.format("+.1f")(x).replaceAll("−", "-");
  }

  draw(queryResults) {
    const self = this;

    const selection = self._createSelection(queryResults);

    selection.exit().remove();
    const selectionUpdated = self._createElements(selection);
    self._updateWidths();
    self._updateFixedElements(selectionUpdated);
    self._updateGapElements(selectionUpdated);
  }

  _updateWidths() {
    const self = this;

    self._maxPayWidth = self._getWidth("cell-pay");
    self._maxGapWidth = self._getWidth("cell-gap");
    self._maxGiniWidth = self._getWidth("cell-gini");

    self._payScale = d3.scaleLinear()
      .domain([0, self._maxPay])
      .range([0, self._maxPayWidth]);

    self._gapScale = d3.scaleLinear()
      .domain([self._minGap, self._maxGap])
      .range([0, self._maxGapWidth]);

    self._giniScale = d3.scaleLinear()
      .domain([0, self._maxGini])
      .range([0, self._maxGiniWidth]);
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

    const newElements = selection.enter()
      .append("tr")
      .classed("viz-row", true);

    newElements.append("td")
      .classed("cell-occupation", true)
      .html((x) => x.getName().replaceAll(" occupations", ""));

    const newPayElements = newElements.append("td")
      .classed("cell-pay", true);

    newPayElements.append("div")
      .classed("bar-label", true);

    newPayElements.append("div")
      .classed("bar-body", true);

    const newGapElements = newElements.append("td")
      .classed("cell-gap", true);

    const newGapSvg = newGapElements.append("svg")
      .classed("cell-gap-svg", true);

    newGapSvg.append("rect")
      .classed("center-line", true);

    const midX = self._maxGapWidth / 2;
    newGapSvg.append("rect")
      .classed("gap-line", true)
      .attr("x", midX);

    const newGiniElements = newElements.append("td")
      .classed("cell-gini", true);

    newGiniElements.append("div")
      .classed("bar-label", true);

    newGiniElements.append("div")
      .classed("bar-body", true);

    return selection.merge(newElements);
  }

  _updateFixedElements(selection) {
    const self = this;

    const payElements = selection.select(".cell-pay");

    payElements.select(".bar-label")
      .html((x) => self._numFormat(x.getPay()));

    payElements.select(".bar-body")
      .transition()
      .attr("width", (x) => self._payScale(x.getPay()));

    const giniElements = selection.select(".cell-gini");

    giniElements.select(".bar-label")
      .html((x) => self._numFormat(x.getGini()));

    giniElements.select(".bar-body")
      .transition()
      .attr("width", (x) => self._giniScale(x.getGini()));
  }

  _updateGapElements(selection) {
    const self = this;

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
        const popScale = d3.scaleLinear().domain([0, Math.sqrt(maxPop)]).range([1, 8]);

        x.getGapInfo().forEach((datum, name) => {
          const value = datum["value"];
          const pop = datum["pop"];
          const size = popScale(Math.sqrt(pop));
          simplified.push({"name": name, "value": value, "size": size});
        });
        return simplified;
    }, (x) => x["name"]);

    const midX = self._maxGapWidth / 2;
    const newGroups = innerElements.enter()
      .append("g")
      .classed("gap-group", true)
      .attr("transform", "translate(" + midX + ",10)")
      .attr("opacity", 0);

    newGroups.each(function (datum, i) {
      const radius = datum["size"];
      GLPH_STRATEGIES[i](d3.select(this), i, radius);
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
        return x["value"] === null ? 0 : 0.8;
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
          if (newX < minX) {
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
          if (newX < minX) {
            minX = newX;
          }
          if (newX > maxX) {
            maxX = newX;
          }
        });
        return maxX - minX;
      });
  }

}


function createNewPresenter() {
  d3.select("#vizTableBody").html("");
  currentPresenter = new VizPresenter(MAX_PAY, MIN_GAP, MAX_GAP, MAX_GINI);
  return currentPresenter;
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


function onResize() {
  createNewPresenter();
  updateViz();
}
