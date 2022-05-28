/**
 * Constants defining visualiation drawing and dataset behavior.
 *
 * @author A Samuel Pottinger
 * @license MIT
 */

const SOURCE_DATA_LOC = "/data.csv";

const GLOBAL_MIN_MAXES = {
  "income": {
    "maxValue": 60,
    "minGap": -80,
    "maxGap": 80,
    "maxGini": 20
  },
  "unemployment": {
    "maxValue": 10,
    "minGap": -80,
    "maxGap": 80,
    "maxGini": 30
  }
};

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
  "income": {
    "female": {"max": 40, "min": -40},
    "wbhaom": {"max": 60, "min": -60},
    "educ": {"max": 80, "min": -80},
    "region": {"max": 40, "min": -40},
    "citistat": {"max": 40, "min": -40},
    "age": {"max": 40, "min": -60}
  },
  "unemployment": {
    "female": {"max": 40, "min": -40},
    "wbhaom": {"max": 60, "min": -60},
    "educ": {"max": 80, "min": -80},
    "region": {"max": 40, "min": -40},
    "citistat": {"max": 40, "min": -40},
    "age": {"max": 40, "min": -60}
  }
};

const VARIABLE_NAMES = {
  "income": {
    "variable": "wageotc",
    "count": "wageCount"
  },
  "unemployment": {
    "variable": "unemp",
    "count": "unempCount"
  }
};
