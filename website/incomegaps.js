const SOURCE_DATA_LOC = "/march_2022.csv";
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
    
    self._rawResults.forEach((rawRecord) => {
      const groupingAttr = rawRecord[groupingAttrName];
      const occupation = rawRecord["docc03"];
      
      if (!occupationRollup.has(occupation)) {
        occupationRollup.set(occupation, {
          "groupings": new Map(),
          "wageTotal": 0,
          "countTotal": 0
        });
      }
      
      const occupationRecord = occupationRollup.get(occupation);
      occupationRecord["wageTotal"] += rawRecord["wageotc"];
      occupationRecord["countTotal"] += rawRecord["count"];
      
      const groupings = occupationRecord["groupings"];
      if (!groupings.has(groupingAttr)) {
        groupings.set(groupingAttr, {
          "wageTotal": 0,
          "countTotal": 0
        });
      }
      
      const groupingInfo = groupings.get(groupingAttr);
      groupingInfo["wageTotal"] += rawRecord["wageotc"];
      groupingInfo["countTotal"] += rawRecord["count"];
    });
    
    return occupationRollup;
  }
  
  _summarizeQuery(occupationRollup) {
    const self = this;
    
    const names = [];
    occupationRollup.forEach((rawRecord, occupationName) => {
      rawRecord["groupings"].keys().forEach((name) => {
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
        retMap.set(name, percentDiff);
      } else {
        retMap.set(name, null);
      }
    });
    
    return retMap;
  }
  
  _getGini(groupings) {
    const self = this;
    
    return 0;
  }
  
}


function loadSourceDataRaw() {
  return new Promise((resolve, reject) => {
    Papa.parse(SOURCE_DATA_LOC, {
      download: true,
      header: true,
      complete: (results) => {
        resolve(results);
      }
    });
  });
}


function loadSourceDataNoCache() {
  return loadSourceDataRaw().then((raw) => new Dataset(raw["data"]));
}


function loadSourceData() {
  if (cachedDataset === null) {
    return loadSourceDataNoCache().then((result) => {
      cachedDataset = result;
      return result;
    });
  } else {
    return new Promise((resolve, reject) => {
      resolve(cachedDataset);
    });
  }
}


/*class VizPresenter {
  
  constructor(maxPay, minGap, maxGap, maxGini) {
    const self = this;
    
    self._maxPayWidth = self._getWidth(".cell-pay");
    self._maxGapWidth = self._getWidth(".cell-gap");
    self._maxGiniWidth = self._getWidth(".cell-gini");
    
    self._payScale = d3.scaleLinear()
      .domain([0, maxPay])
      .range([0, self._maxPayWidth]);
    
    self._gapScale = d3.scaleLinear()
      .domain([minGap, maxGap])
      .range([0, self._maxGapWidth]);
    
    self._giniScale = d3.scaleLinear()
      .domain([0, maxGini])
      .range([0, self._maxGiniWidth]);
    
    self._numFormat = d3.format(".2f");
  }
  
  draw(queryResults) {
    const self = this;
    
    const selection = d3.select("#vizTableBody")
      .selectAll(".viz-row")
      .data(queryResults, (x) => x.getName());
      
    self._createElements(selection);
    selection.exit().delete();
    self._updateFixedElements(selection);
    self._updateGapElements(selection);
  }
  
  _createElements(selection) {
    const self = this;
    
    const newElements = selection.enter()
      .append("tr")
      .classed("viz-row", true);
    
    newElements.append("td")
      .classed("cell-occupation", true)
      .html((x) => x.getName());
    
    const newPayElements = newElements.append("td")
      .classed("cell-pay", true);
    
    newPayElements.append("div")
      .classed("bar-label", true);
    
    newPayElements.append("div")
      .classed("bar-body", true);
    
    const newGapElements = newElements.append("td")
      .classed("cell-gap", true);
    
    const newGapSvg = newGapElements.append("svg")
      .classed("cell-gap-svg");
    
    const newGiniElements = newElements.append("td")
      .classed("cell-gini", true);
    
    newPayElements.append("div")
      .classed("bar-label", true);
    
    newPayElements.append("div")
      .classed("bar-body", true);
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
    
    const innerElements = selection.select(".cell-gap-svg")
      .selectAll(".gap-group")
      .data((x) => {
        const newItems = new Array(x.getGapInfo().items());
        return newItems.map((x) => {"name": x[0], "value": x[1]});
      });
    
    const midX = self._maxGapWidth / 2;
    const newGroups = innerElements.enter()
      .append("g")
      .classed("gap-group", true)
      .attr("transform", "translate(10," + midX + ")")
      .attr("opacity", 0);
    
    newGroups.append("ellipse")
      .style("fill", (x, i) => GROUP_FILLS[i])
      .attr("cy", 0)
      .attr("cx", 0)
      .attr("rx", 7)
      .attr("ry", 7);
    
    newGroups.append("text")
      .classed("gap-label", true)
      .attr("x", 0)
      .attr("y", 10);
    
    innerElements.exit().delete();
    
    innerElements.transition()
      .attr("transform", (x) => {
        const midX = self._maxGapWidth / 2;
        const newX = x["value"] === null ? midX : self._gapScale(x["value"]);
        return "translate(" + newX + ", 10)";
      })
      .attr("opacity", (x) => {
        return x["value"] === null ? 0 : 0.8;
      });
    
    innerElements.select(".gap-label")
      .html((x) => self._numFormat(x["value"]) + "%");
  }
  
}


function createNewPresenter() {
  d3.select("#vizTableBody").html("");
  currentPresenter = new VizPresenter(MAX_PAY, MIN_GAP, MAX_GAP, MAX_GINI);
}


function updateViz() {
  if (currentPresenter === null) {
    currentPresenter = createNewPresenter();
  }
  
  loadSourceData.then((result) => currentPresenter.draw(result));
}


function onResize() {
  createNewPresenter();
  updateViz();
}*/
