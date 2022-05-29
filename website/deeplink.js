/**
 * Utilities for creating and applying serizliations of viz state.
 *
 * Utilities for creating and applying serizliations of viz state that can be
 * written to and read from the URL.
 *
 * @author A Samuel Pottinger
 * @license MIT
 */

const FILTER_CHECK_IDS = [
  "femaleCheck",
  "maleCheck",
  "asianCheck",
  "blackCheck",
  "hispanicCheck",
  "multipleRaceCheck",
  "nativeCheck",
  "whiteCheck",
  "advancedCheck",
  "collegeCheck",
  "someCheck",
  "highSchoolCheck",
  "lessHighSchoolCheck",
  "midwestCheck",
  "northeastCheck",
  "southCheck",
  "westCheck",
  "naturalizedCheck",
  "notCheck",
  "abroadParentsCheck",
  "islandsCheck",
  "nativeCheck",
  "ageLt25Check",
  "age25Check",
  "age35Check",
  "age45Check",
  "age55Check",
  "ageGt65Check",
  "requireMinCheck"
];

const CONFIG_CHECK_IDS = [
  "groupSizeCheck",
  "colorblindModeCheck",
  "zoomingAxisCheck",
  "metricsCheck"
];

const DROP_IDS = [
  "variable",
  "dimension"
]

/**
 * Get an object describing the current visualization state.
 *
 * @returns Object with current visualization state.
 */
function getDeepLinkObj() {

  /**
   * Get the value of a filter or setting checkbox as a 0 or 1.
   *
   * @param id The ID of the checkbox.
   * @returns 1 if group included / enabled and 0 if excluded / disabled.
   */
  function getBinary(id) {
    return document.getElementById(id).checked ? 1 : 0;
  }

  /**
   * Get the value of an input.
   *
   * @param id The ID of the input.
   * @returns The value of the input.
   */
  function getValue(id) {
    return document.getElementById(id).value;
  }

  const filterField = FILTER_CHECK_IDS.map(getBinary).join('');
  const configField = CONFIG_CHECK_IDS.map(getBinary).join('');

  const outputRecord = {};

  DROP_IDS.forEach((x) => {
    outputRecord[x] = getValue(x);
  });
  outputRecord["filters"] = filterField;
  outputRecord["config"] = configField;

  return outputRecord;
}


/**
 * Update the visualization to reflect a serialization of viz state.
 *
 * @param target The serialization to apply.
 */
function applyDeepLinkObj(target) {

  /**
   * Set the value of a filter or setting checkbox.
   *
   * @param id The ID of the checkbox.
   * @param value 1 if enabled / included and 0 disabled / excluded.
   */
  function setBinary(id, value) {
    const valueStr = value + "";
    document.getElementById(id).checked = valueStr === "1";
  }

  /**
   * Set the value of an input.
   *
   * @param id The ID of the input.
   * @param value The value to set.
   */
  function setValue(id, value) {
    return document.getElementById(id).value = value;
  }

  const filterStr = target["filters"];
  const configStr = target["config"];

  FILTER_CHECK_IDS.forEach((id, i) => { setBinary(id, filterStr[i]); });
  CONFIG_CHECK_IDS.forEach((id, i) => { setBinary(id, configStr[i]); });
  DROP_IDS.forEach((x) => { setValue(x, target[x]); });
}


/**
 * Get a URL which includes the current visualization state.
 *
 * @returns Query string with serialized visualization state.
 */
function getDeepLinkUrl() {
  const paramsObj = getDeepLinkObj();
  const params = new URLSearchParams(paramsObj);
  const paramsStr = params.toString();

  return paramsStr;
}


/**
 * Update the visualization to reflect a serialization of viz state in a URL.
 *
 * @param paramsStr The query string containing serialization to be applied.
 */
function applyDeepLinkUrl(paramsStr) {
  const params = new URLSearchParams(paramsStr);

  const inputObj = {};
  DROP_IDS.forEach((x) => { inputObj[x] = params.get(x); });
  inputObj["filters"] = params.get("filters");
  inputObj["config"] = params.get("config");

  applyDeepLinkObj(inputObj);
}
