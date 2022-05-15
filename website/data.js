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
  