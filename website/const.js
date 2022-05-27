/**
 * Constants defining visualiation drawing and dataset behavior.
 *
 * @author A Samuel Pottinger
 * @license MIT
 */

const SOURCE_DATA_LOC = "/data.csv";

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
};
