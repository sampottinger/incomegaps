/**
 * Logic for loading and querying underlying visualization data.
 *
 * @author A Samuel Pottinger
 * @license MIT
 */


/**
 * Single data record for an occupation.
 *
 * Record describing an occupation group within the dataset that has been
 * aggregated and is going into visualization. These are aggregated by
 * occupation but may represent a subset of the overall population if there are
 * filters active. For example, if the user filters out Male records, this will
 * be those reporting Female within this occupation.
 */
class Record {

  /**
   * Create a new record of a dataset group.
   *
   * @param name The name of the group (occupation).
   * @param pay The mean houly pay for this group.
   * @param gapInfo Mapping from subpopulation of interest to wage disparity
   *   and population size information.
   * @param gini The gini index for this group where the gini index is calculated
   *   after grouping by the dimension of interest.
   */
  constructor(name, pay, gapInfo, gini) {
    const self = this;
    self._name = name;
    self._pay = pay;
    self._gapInfo = gapInfo;
    self._gini = gini;
  }

  /**
   * Name of this occupation.
   *
   * @returns String like "Computer and mathematical science occupations".
   */
  getName() {
    const self = this;
    return self._name;
  }

  /**
   * Get the average hourly pay for this occupation with filters applied.
   *
   * @returns Float representing the hourly pay for this occupation with
   *   filters applied. So, if only Female is selected in filters, this
   *   will be average wage for those reporting Female within this
   *   occupation.
   */
  getPay() {
    const self = this;
    return self._pay;
  }

  /**
   * Get information about subpopulations within the selected occupation.
   *
   * @returns Mapping from name of subpopulation to object with "value"
   *   representing how many more percentage points that subpopulation's mean
   *   hourly pay is above or below the occupation overall mean pay.
   *   Subpopulations are based on selected metric / dimension like Gender
   *   which would yield a gap info map with Male and Female keys.
   */
  getGapInfo() {
    const self = this;
    return self._gapInfo;
  }

  /**
   * Get the gini index for the subpopulation based on selected dimension.
   *
   * @returns Gini index where the populations are defined by the selected
   *   metric / dimension. For example, if the user selected Gender, this will
   *   be the Gini index where two subpopulations (Male and Female) are used in
   *   calculation.
   */
  getGini() {
    const self = this;
    return self._gini;
  }

}


/**
 * Object abstracting a dataset which can be queried and filtered.
 *
 * Object representing the overall dataset which can be queried based on user
 * input into the data visualization's controls like filters and selected
 * metric / dimension.
 */
class Dataset {

  /**
   * Create a new dataset.
   *
   * @param rawResults List of objects representing the raw CSV returned by the
   *   server.
   */
  constructor(rawResults) {
    const self = this;

    self._rawResults = rawResults;
  }

  /**
   * Query the dataset with applied filters and dimension / metric of interest.
   *
   * @param groupingAttrName The name of the attribute on which to group the
   *   subpopulations. For example, Gender. This is the dimension / metric of
   *   interest.
   */
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

  /**
   * Aggregate the data by an attribute while applying filters.
   *
   * @param groupingAttrName The name of the attribute by which to aggregate
   *   (like Gender).
   * @param removedGroups The name of the groups like Male or Female to filter
   *   out.
   * @returns Mapping from occupation name to sum of wage and population count
   *   records for that occupation. Also includes an all occupations record.
   */
  _rollupQuery(groupingAttrName, removedGroups) {
    const self = this;

    const occupationRollup = new Map();

    const validResults = self._rawResults.filter((x) => x["docc03"] !== undefined)
      .filter((x) => x[groupingAttrName] !== undefined);

    const totalGroup = {
      "groupings": new Map(),
      "valueTotal": 0,
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
      const values = parseFloat(rawRecord["wageotc"]);
      const count = parseFloat(rawRecord["wageCount"]);

      if (!occupationRollup.has(occupation)) {
        occupationRollup.set(occupation, {
          "groupings": new Map(),
          "valueTotal": 0,
          "countTotal": 0
        });
      }

      const occupationRecord = occupationRollup.get(occupation);
      occupationRecord["valueTotal"] += values * count;
      occupationRecord["countTotal"] += count;

      totalGroup["valueTotal"] += values * count;
      totalGroup["countTotal"] += count;

      const groupings = occupationRecord["groupings"];
      if (!groupings.has(groupingAttr)) {
        groupings.set(groupingAttr, {
          "valueTotal": 0,
          "countTotal": 0
        });
      }

      const groupingInfo = groupings.get(groupingAttr);
      groupingInfo["valueTotal"] += values * count;
      groupingInfo["countTotal"] += count;

      const totalGroupings = totalGroup["groupings"];
      if (!totalGroupings.has(groupingAttr)) {
        totalGroupings.set(groupingAttr, {
          "valueTotal": 0,
          "countTotal": 0
        });
      }

      const totalGroupingInfo = totalGroupings.get(groupingAttr);
      totalGroupingInfo["valueTotal"] += values * count;
      totalGroupingInfo["countTotal"] += count;
    });

    occupationRollup.set("All occupations", totalGroup);

    return occupationRollup;
  }

  /**
   * Summarize a rollup result to a collection of Records.
   *
   * @param occupationRollup The result of _rollupQuery to summarize.
   * @returns Array of Record objects after summation.
   */
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
      const valueTotal = rawRecord["valueTotal"];
      const countTotal = rawRecord["countTotal"];
      const pay = countTotal > 0 ? valueTotal / countTotal : 0;
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

  /**
   * Get how much more or less a subpopulation is paid relative to pop mean.
   *
   * @param meanPay The average pay for the overall population in the
   *   occupation after applying filters.
   * @param rawGroupings Mapping from subgroup (Male, Female) for an occupation
   *   to object with valueTotal and countTotal.
   * @param names The ordered list of subgroup names (like Male, Female).
   */
  _getGapInfo(meanPay, rawGroupings, names) {
    const self = this;
    const retMap = new Map();

    names.forEach((name) => {
      if (rawGroupings.has(name)) {
        const rollup = rawGroupings.get(name);
        const groupingMean = rollup["valueTotal"] / rollup["countTotal"];
        const percentDiff = ((groupingMean - meanPay) / meanPay) * 100;
        retMap.set(name, {"value": percentDiff, "pop": rollup["countTotal"]});
      } else {
        retMap.set(name, {"value": null, "pop": 0});
      }
    });

    return retMap;
  }

  /**
   * Get the gini index for the provided set of groupings.
   *
   * @param groupings List of objects with valueTotal and countTotal
   *   representing the subpopulations.
   * @returns Gini index using the given subpopulations.
   */
  _getGini(groupings) {
    const self = this;

    const groupingsItems = [...groupings.values()];

    if (groupingsItems.length == 0) {
      throw "Groupings must have length > 0";
    }

    const totalIncome = groupingsItems
      .map((x) => x["valueTotal"])
      .reduce((a, b) => a + b);

    const totalPopulation = groupingsItems
      .map((x) => x["countTotal"])
      .reduce((a, b) => a + b);

    groupingsItems.sort((a, b) => {
      const aWage = a["valueTotal"] / a["countTotal"];
      const bWage = b["valueTotal"] / b["countTotal"];
      return aWage - bWage;
    });

    let percentRemaining = 1;

    const giniDetails = groupingsItems.map((x) => {
      const popPercent = x["countTotal"] / totalPopulation;
      percentRemaining -= popPercent;

      return {
        "income": x["valueTotal"] / totalIncome,
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


/**
 * Create a dataset using data from the server.
 *
 * @param loc Optional param for the URL at which the raw data can be found.
 * @returns Promise resolving to a Dataset wrapping the raw data from the
 *   server's CSV file.
 */
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


/**
 * Load a Dataset, ignoring cached values.
 *
 * @param loc Optional param for the URL at which the raw data can be found.
 * @returns Promise resolving to a Dataset.
 */
function loadSourceDataNoCache(loc) {
  return loadSourceDataRaw(loc).then((raw) => new Dataset(raw["data"]));
}


/**
 * Load a Dataset, using a cached value if available.
 *
 * @param loc Optional param for the URL at which the raw data can be found.
 * @returns Promise resolving to a Dataset.
 */
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
