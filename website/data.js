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
   * @param value The mean or median value like houly pay for this group.
   * @param gapInfo Mapping from subpopulation of interest to wage disparity
   *   and population size information.
   * @param gini The gini index for this group where the gini index is
   *   calculated after grouping by the dimension of interest.
   */
  constructor(name, value, gapInfo, gini) {
    const self = this;
    self._name = name;
    self._value = value;
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
   * Get the average value for this occupation with filters applied.
   *
   * @returns Float representing the value like hourly pay for this occupation
   *   with filters applied. So, if only Female is selected in filters, this
   *   will be average wage for those reporting Female within this
   *   occupation.
   */
  getValue() {
    const self = this;
    return self._value;
  }

  /**
   * Get information about subpopulations within the selected occupation.
   *
   * @returns Mapping from name of subpopulation to object with "value"
   *   representing how many more percentage points that subpopulation's mean
   *   value is above or below the occupation overall mean value. Subpopulations
   *   are based on selected metric / dimension like Gender which would yield a
   *   gap info map with Male and Female keys.
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
   * @param minGroupSize The minimum size for a group to be included.
   */
  query(groupingAttrName, removedGroups, minGroupSize) {
    const self = this;

    if (removedGroups === undefined) {
      removedGroups = [];
    }

    const occupationRollup = self._rollupQuery(
      groupingAttrName,
      removedGroups,
      minGroupSize
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
   * @param minGroupSize The minimum size for a group to be included.
   * @returns Mapping from occupation name to sum of wage and population count
   *   records for that occupation. Also includes an all occupations record.
   */
  _rollupQuery(groupingAttrName, removedGroups, minGroupSize) {
    const self = this;

    const occupationRollup = new Map();

    // Remove unusable results
    const validResults = self._rawResults.filter(
      (x) => x["docc03"] !== undefined
    ).filter((x) => x[groupingAttrName] !== undefined);

    // Remove groups requested to be excluded by user
    const validResultsFilter = validResults.filter((rawRecord) => {
      const foundGroups = ATTRS.filter((attr) => {
        return removedGroups.indexOf(rawRecord[attr]) != -1;
      });
      return foundGroups.length == 0;
    });

    // Check if anything is still left over
    if (validResultsFilter.length == 0) {
      return null;
    }

    // Parse and filter for min sample size
    const resultsParsed = self._parseResults(
      validResultsFilter,
      groupingAttrName
    );

    const minResultsFilter = self._filterMinResults(
      resultsParsed,
      minGroupSize
    );

    // Aggregate
    const totalGroup = {
      "groupings": new Map(),
      "valueTotal": 0,
      "countTotal": 0,
      "values": []
    };

    minResultsFilter.forEach((inputRecord) => {
      const groupingAttr = inputRecord["groupingAttr"];
      const occupation = inputRecord["occupation"];
      const valueTotal = inputRecord["valueTotal"];
      const count = inputRecord["count"];
      const values = inputRecord["values"];

      if (!occupationRollup.has(occupation)) {
        occupationRollup.set(occupation, {
          "groupings": new Map(),
          "valueTotal": 0,
          "countTotal": 0,
          "values": []
        });
      }

      const occupationRecord = occupationRollup.get(occupation);
      occupationRecord["valueTotal"] += valueTotal;
      occupationRecord["countTotal"] += count;
      occupationRecord["values"].push(...values);

      totalGroup["valueTotal"] += valueTotal;
      totalGroup["countTotal"] += count;
      totalGroup["values"].push(...values);

      const groupings = occupationRecord["groupings"];
      if (!groupings.has(groupingAttr)) {
        groupings.set(groupingAttr, {
          "valueTotal": 0,
          "countTotal": 0,
          "values": []
        });
      }

      const groupingInfo = groupings.get(groupingAttr);
      groupingInfo["valueTotal"] += valueTotal;
      groupingInfo["countTotal"] += count;
      groupingInfo["values"].push(...values);

      const totalGroupings = totalGroup["groupings"];
      if (!totalGroupings.has(groupingAttr)) {
        totalGroupings.set(groupingAttr, {
          "valueTotal": 0,
          "countTotal": 0,
          "values": []
        });
      }

      const totalGroupingInfo = totalGroupings.get(groupingAttr);
      totalGroupingInfo["valueTotal"] += valueTotal;
      totalGroupingInfo["countTotal"] += count;
      totalGroupingInfo["values"].push(...values);
    });

    occupationRollup.set("All occupations", totalGroup);

    return occupationRollup;
  }

  /**
   *
   * @param resultsRaw The raw records read from the data CSV file.
   * @param groupingAttrName The name of the attribute by which to aggregate
   *   (like Gender).
   * @returns Object with groupingAttr, occupation, valueTotal, and count attrs.
   */
  _parseResults(resultsRaw, groupingAttrName) {
    const self = this;

    const targetVariableAttrs = getVariableAttrs();
    const variableStrategies = self._getVariableStrategies(targetVariableAttrs);

    return resultsRaw.map((rawRecord) => {
      const groupingAttr = rawRecord[groupingAttrName];
      const occupation = rawRecord["docc03"];
      const valueTotal = variableStrategies["variableTotal"](rawRecord);
      const values = variableStrategies["variables"](rawRecord);
      const count = variableStrategies["count"](rawRecord);

      return {
        "groupingAttr": groupingAttr,
        "occupation": occupation,
        "valueTotal": valueTotal,
        "values": values,
        "count": count
      };
    });
  }

  /**
   * Filter for a minimum population size.
   *
   * @param results Parsed results.
   * @param minGroupSize The min group size as a percentage 0 - 1.
   * @returns Filtered list of parsed results.
   */
  _filterMinResults(results, minGroupSize) {
    const self = this;

    const overallTotal = results.map((x) => x["count"]).reduce((a, b) => a + b);
    const minGroupSizeCalculated = minGroupSize * overallTotal;

    const groupSizes = new Map();
    results.forEach((x) => {
      const occupation = x["occupation"];
      const group = x["groupingAttr"];
      const count = x["count"];
      const key = occupation + "\t" + group;

      if (!groupSizes.has(key)) {
        groupSizes.set(key, 0);
      }

      groupSizes.set(key, groupSizes.get(key) + count);
    });

    const groupsExclude = new Set();
    groupSizes.forEach((value, key) => {
      if (value < minGroupSizeCalculated) {
        groupsExclude.add(key);
      }
    });

    return results.filter((x) => {
      const occupation = x["occupation"];
      const group = x["groupingAttr"];
      const key = occupation + "\t" + group;
      return !groupsExclude.has(key);
    });
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
      const value = countTotal > 0 ? valueTotal / countTotal : 0;
      const gapInfo = self._getGapInfo(value, rawRecord["groupings"], names);
      const gini = self._getGini(rawRecord["groupings"]);
      const outputRecord = new Record(
        occupationName,
        value,
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
        return a.getValue() - b.getValue();
      }
    });

    return outputRecords;
  }

  /**
   * Get how much more or less a subpopulation is paid relative to pop mean.
   *
   * @param meanValue The value like average pay for the overall population in
   *   the occupation after applying filters.
   * @param rawGroupings Mapping from subgroup (Male, Female) for an occupation
   *   to object with valueTotal and countTotal.
   * @param names The ordered list of subgroup names (like Male, Female).
   */
  _getGapInfo(meanValue, rawGroupings, names) {
    const self = this;
    const retMap = new Map();

    names.forEach((name) => {
      if (rawGroupings.has(name)) {
        const rollup = rawGroupings.get(name);
        const groupingMean = rollup["valueTotal"] / rollup["countTotal"];
        const diff = groupingMean - meanValue;
        const percentDiff = (diff / meanValue) * 100;
        const isIncome = getVariable() === "income";
        const effectiveDiff = isIncome ? percentDiff : diff;
        retMap.set(name, {"value": effectiveDiff, "pop": rollup["countTotal"]});
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

  /**
   * Build strategies for parsing records for counts and variable values.
   *
   * @param variableAttrs The name of the variables of interest for the
   *    visualization.
   * @returns Object with strategies.
   */
  _getVariableStrategies(variableAttrs) {
    const self = this;

    const variableName = variableAttrs["variable"];

    const variableTotalStrategy = {
      "unemp": (record) => parseFloat(record["unemp"]),
      "wageotc": (record) => {
        const wageGroups = self._parseWageTuples(record["wageotc"]);
        const subTotals = wageGroups.map(
          (group) => group["value"] * group["weight"]
        );
        return subTotals.reduce((a, b) => a + b);
      }
    }[variableName];

    const variableStrategy = {
      "unemp": (record) => {
        const unemp = parseFloat(record["unemp"]);
        const count = parseFloat(record[variableAttrs["count"]]);
        return [{"value": unemp, "weight": count}];
      },
      "wageotc": (record) => {
        return self._parseWageTuples(record["wageotc"]);
      }
    }[variableName];

    return {
      "variableTotal": variableTotalStrategy,
      "variables": variableStrategy,
      "count": (x) => parseFloat(x[variableAttrs["count"]])
    };
  }

  /**
   * Parse a string containing wages and weights / counts for those wages.
   *
   * @param wageTupleStr The string containing the wages and weights string.
   * @returns Parsed string
   */
  _parseWageTuples(wageTupleStr) {
    const self = this;
    const groupStrs = wageTupleStr.split(';');
    return groupStrs.map((groupStr) => {
      const numbersStr = groupStr.split(" ");
      const numbers = numbersStr.map((numberStr) => parseFloat(numberStr));
      return {
        "value": numbers[0],
        "weight": numbers[1]
      };
    });
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
