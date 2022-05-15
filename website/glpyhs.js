/**
 * Logic for drawing "glyphs" in the gap display.
 *
 * @author A Samuel Pottinger
 * @license MIT
 */

const GROUP_FILLS = [
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#a0a0a0"
];

const GLPH_STRATEGIES = [
  (x, i, radius) => drawEllipse(x, false, i, radius),
  (x, i, radius) => drawRect(x, false, i, radius),
  (x, i, radius) => drawRect(x, true, i, radius),
  (x, i, radius) => drawTriangle(x, false, i, radius),
  (x, i, radius) => drawTriangle(x, true, i, radius),
  (x, i, radius) => drawDiamond(x, false, i, radius),
  (x, i, radius) => drawDiamond(x, true, i, radius)
];

const GLPH_TRANSITIONS = [
  (x, i, radius) => transitionEllipse(x, false, i, radius),
  (x, i, radius) => transitionRect(x, false, i, radius),
  (x, i, radius) => transitionRect(x, true, i, radius),
  (x, i, radius) => transitionTriangle(x, false, i, radius),
  (x, i, radius) => transitionTriangle(x, true, i, radius),
  (x, i, radius) => transitionDiamond(x, false, i, radius),
  (x, i, radius) => transitionDiamond(x, true, i, radius)
];


/**
 * Get the color to use for a subgroup (like Male, Female).
 *
 * @param index The 0-indexed index of the group.
 * @returns String containing color hex code.
 */
function getGroupFills(index) {
  return GROUP_FILLS[index];
}


/**
 * Get the strategy for drawing a glyph.
 *
 * Get the strategy for drawing a glyph, depending on if colorblind mode is
 * enabled by the user.
 *
 * @param index The 0-indexed index of the group.
 * @returns Function taking in the data point, index of the data point, and
 *   desired glyph radius.
 */
function getGlyphStrategy(index) {
  const colorblindEnabled = isColorblindModeEnabled();
  return colorblindEnabled ? GLPH_STRATEGIES[index] : GLPH_STRATEGIES[0];
}


/**
 * Get the strategy for animating the update of a glyph.
 *
 * Get the strategy for updating a glyph, depending on if colorblind mode is
 * enabled by the user.
 *
 * @param index The 0-indexed index of the group.
 * @returns Function taking in the data point, index of the data point, and
 *   desired glyph radius.
 */
function getGlyphTransition(index) {
  const colorblindEnabled = isColorblindModeEnabled();
  return colorblindEnabled ? GLPH_TRANSITIONS[index] : GLPH_TRANSITIONS[0];
}


/**
 * Draw an ellipse glpyph.
 *
 * @param selection The selection in which the glyph should be appended.
 * @param rotate Boolean indicator if the glyph should be rotated by 180 deg.
 *   This is ignored for this strategy.
 * @param i The 0-indexed index of this glpyh's subpopulation within the
 *   occupation.
 * @param radius The radius with which to draw this glyph in pixels.
 */
function drawEllipse(selection, rotate, i, radius) {
  selection.append("ellipse")
    .style("fill", getGroupFills(i))
    .classed("gap-indicator", true)
    .attr("cy", 0)
    .attr("cx", 0)
    .attr("rx", radius)
    .attr("ry", radius);
}


/**
 * Animate the update of an existing ellipse glyph.
 *
 * @param selection The selection in which the glyph should be updated.
 * @param rotate Boolean indicator if the glyph should be rotated by 180 deg.
 *   This is ignored for this strategy.
 * @param i The 0-indexed index of this glpyh's subpopulation within the
 *   occupation.
 * @param radius The radius with which to draw this glyph in pixels.
 */
function transitionEllipse(selection, rotate, i, radius) {
  selection.select(".gap-indicator").transition()
    .attr("rx", radius)
    .attr("ry", radius);
}


/**
 * Draw a rectange glpyph.
 *
 * @param selection The selection in which the glyph should be appended.
 * @param rotate Boolean indicator if the glyph should be rotated by 90 deg.
 * @param i The 0-indexed index of this glpyh's subpopulation within the
 *   occupation.
 * @param radius The radius with which to draw this glyph in pixels.
 */
function drawRect(selection, rotate, i, radius) {
  const rects = selection.append("rect")
    .style("fill", getGroupFills(i))
    .classed("gap-indicator", true)
    .attr("y", -radius)
    .attr("x", -radius)
    .attr("width", radius * 2)
    .attr("height", radius * 2)
    .classed("rotate-glyph-part", rotate);
}


/**
 * Animate the update of an existing rectangle glyph.
 *
 * @param selection The selection in which the glyph should be updated.
 * @param rotate Boolean indicator if the glyph should be rotated by 90 deg.
 * @param i The 0-indexed index of this glpyh's subpopulation within the
 *   occupation.
 * @param radius The radius with which to draw this glyph in pixels.
 */
function transitionRect(selection, rotate, i, radius) {
  const rects = selection.select(".gap-indicator").transition()
    .attr("y", -radius)
    .attr("x", -radius)
    .attr("width", radius * 2)
    .attr("height", radius * 2);
}


/**
 * Generate a list of points for the triangle glyph based on its radius.
 *
 * @param radius The "radius" of the glyph in pixels.
 * @returns Array of string SVG path points.
 */
function getTrianglePoints(radius) {
  return [
    "0," + (-1 * radius),
    radius + "," + radius,
    (-1 * radius) + "," + radius,
  ];
}


/**
 * Draw a triangle glpyph.
 *
 * @param selection The selection in which the glyph should be appended.
 * @param rotate Boolean indicator if the glyph should be rotated by 180 deg.
 * @param i The 0-indexed index of this glpyh's subpopulation within the
 *   occupation.
 * @param radius The radius with which to draw this glyph in pixels.
 */
function drawTriangle(selection, rotate, i, radius) {
  const outputStrs = getTrianglePoints(radius);

  const shapes = selection.append("polygon")
    .style("fill", getGroupFills(i))
    .classed("gap-indicator", true)
    .attr("y", 0)
    .attr("x", 0)
    .attr("points", outputStrs.join(" "))
    .classed("rotate-glyph", rotate);
}


/**
 * Animate the update of an existing triangle glyph.
 *
 * @param selection The selection in which the glyph should be updated.
 * @param rotate Boolean indicator if the glyph should be rotated by 180 deg.
 * @param i The 0-indexed index of this glpyh's subpopulation within the
 *   occupation.
 * @param radius The radius with which to draw this glyph in pixels.
 */
function transitionTriangle(selection, rotate, i, radius) {
  const outputStrs = getTrianglePoints(radius);

  const rects = selection.select(".gap-indicator").transition()
    .attr("points", outputStrs.join(" "));
}


/**
 * Generate a list of points for the diamond glyph based on its radius.
 *
 * @param radius The "radius" of the glyph in pixels.
 * @returns Array of string SVG path points.
 */
function getDiamondPoints(radius) {
  const offLength = radius / Math.sqrt(2);

  return [
    "0," + (-1 * radius),
    offLength + "," + offLength,
    "0," + radius,
    (-1 * offLength) + "," + offLength,
  ];
}


/**
 * Draw a diamond glpyph.
 *
 * @param selection The selection in which the glyph should be appended.
 * @param rotate Boolean indicator if the glyph should be rotated by 180 deg.
 * @param i The 0-indexed index of this glpyh's subpopulation within the
 *   occupation.
 * @param radius The radius with which to draw this glyph in pixels.
 */
function drawDiamond(selection, rotate, i, radius) {
  const outputStrs = getDiamondPoints(radius);

  const shapes = selection.append("polygon")
    .style("fill", getGroupFills(i))
    .classed("gap-indicator", true)
    .attr("y", -radius)
    .attr("x", -radius)
    .attr("points", outputStrs.join(" "));

  if (rotate) {
    shapes.classed("rotate-glyph", true);
  }
}


/**
 * Animate the update of an existing diamond glyph.
 *
 * @param selection The selection in which the glyph should be updated.
 * @param rotate Boolean indicator if the glyph should be rotated by 180 deg.
 * @param i The 0-indexed index of this glpyh's subpopulation within the
 *   occupation.
 * @param radius The radius with which to draw this glyph in pixels.
 */
function transitionDiamond(selection, rotate, i, radius) {
  const outputStrs = getDiamondPoints(radius);

  selection.select(".gap-indicator").transition()
    .attr("points", outputStrs.join(" "));
}
