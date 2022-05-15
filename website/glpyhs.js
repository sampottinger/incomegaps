/**
 * Logic for drawing "glyphs" in the gap display.
 *
 * @author A Samuel Pottinger
 * @license MIT
 */


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
 * Get the strategy for drawing (appending) a glyph.
 *
 * Get the strategy for drawing a glyph, depending on if colorblind mode is
 * enabled by the user.
 *
 * @param index The 0-indexed index of the group.
 * @returns Function taking in the data point, index of the data point, and
 *   desired glyph radius.
 */
function getGlyphInitStrategy(index) {
  const colorblindEnabled = isColorblindModeEnabled();
  return colorblindEnabled ? GLPH_INITS[index] : GLPH_INITS[0];
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
 * Glyph strategy for ellipse (used for all if colorblind disabled).
 */
class EllipseStrategy {

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
  draw(selection, rotate, i, radius) {
    const self = this;
    
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
  transition(selection, rotate, i, radius) {
    const self = this;
    
    selection.select(".gap-indicator").transition()
      .attr("rx", radius)
      .attr("ry", radius);
  }
  
}


/**
 * Glyph strategy for rectangles.
 */
class RectangleStrategy {
  
  /**
   * Draw a rectange glpyph.
   *
   * @param selection The selection in which the glyph should be appended.
   * @param rotate Boolean indicator if the glyph should be rotated by 90 deg.
   * @param i The 0-indexed index of this glpyh's subpopulation within the
   *   occupation.
   * @param radius The radius with which to draw this glyph in pixels.
   */
  draw(selection, rotate, i, radius) {
    const self = this;
    
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
  transition(selection, rotate, i, radius) {
    const self = this;
    
    const rects = selection.select(".gap-indicator").transition()
      .attr("y", -radius)
      .attr("x", -radius)
      .attr("width", radius * 2)
      .attr("height", radius * 2);
  }
  
}


/**
 * Glyph strategy for triangles.
 */
class TriangleStrategy {
  
  /**
   * Draw a triangle glpyph.
   *
   * @param selection The selection in which the glyph should be appended.
   * @param rotate Boolean indicator if the glyph should be rotated by 180 deg.
   * @param i The 0-indexed index of this glpyh's subpopulation within the
   *   occupation.
   * @param radius The radius with which to draw this glyph in pixels.
   */
  draw(selection, rotate, i, radius) {
    const self = this;
    const outputStrs = self._getTrianglePoints(radius);
  
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
  transition(selection, rotate, i, radius) {
    const self = this;
    const outputStrs = self._getTrianglePoints(radius);
  
    selection.select(".gap-indicator").transition()
      .attr("points", outputStrs.join(" "));
  }
  
  /**
   * Generate a list of points for the triangle glyph based on its radius.
   *
   * @param radius The "radius" of the glyph in pixels.
   * @returns Array of string SVG path points.
   */
  _getTrianglePoints(radius) {
    const self = this;
    
    return [
      "0," + (-1 * radius),
      radius + "," + radius,
      (-1 * radius) + "," + radius,
    ];
  }
}


/**
 * Glyph strategy for diamonds.
 */
class DiamondStrategy {
  
  /**
   * Draw a diamond glpyph.
   *
   * @param selection The selection in which the glyph should be appended.
   * @param rotate Boolean indicator if the glyph should be rotated by 180 deg.
   * @param i The 0-indexed index of this glpyh's subpopulation within the
   *   occupation.
   * @param radius The radius with which to draw this glyph in pixels.
   */
  draw(selection, rotate, i, radius) {
    const self = this;
    const outputStrs = self._getDiamondPoints(radius);
  
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
  transition(selection, rotate, i, radius) {
    const self = this;
    const outputStrs = self._getDiamondPoints(radius);
  
    selection.select(".gap-indicator").transition()
      .attr("points", outputStrs.join(" "));
  }
  
  /**
   * Generate a list of points for the diamond glyph based on its radius.
   *
   * @param radius The "radius" of the glyph in pixels.
   * @returns Array of string SVG path points.
   */
  _getDiamondPoints(radius) {
    const self = this;
    const offLength = radius / Math.sqrt(2);
  
    return [
      "0," + (-1 * radius),
      offLength + "," + offLength,
      "0," + radius,
      (-1 * offLength) + "," + offLength,
    ];
  }

}


/**
 * Return a function for drawing (appending) a glyph.
 *
 * @param key The name of the glyph like ellipse.
 * @param rotate Boolean indicating if the glyph should be the "rotated" form.
 * @returns Function taking the data point, index, and radius to draw the
 *   glyph.
 */
function makeInitStrategy(key, rotate) {
  const strategy = GLYPH_STRATEGIES[key];
  return (x, i, radius) => strategy.draw(x, false, i, radius);
}


/**
 * Return a function for animating the update for a glyph.
 *
 * @param key The name of the glyph like ellipse.
 * @param rotate Boolean indicating if the glyph should be the "rotated" form.
 * @returns Function taking the data point, index, and radius to draw the
 *   glyph.
 */
function makeTransitionStrategy(key, rotate) {
  const strategy = GLYPH_STRATEGIES[key];
  return (x, i, radius) => strategy.transition(x, false, i, radius);
}


const GROUP_FILLS = [
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#a0a0a0"
];

const GLYPH_STRATEGIES = {
  "ellipse": new EllipseStrategy(),
  "rectangle": new RectangleStrategy(),
  "triangle": new TriangleStrategy(),
  "diamond": new DiamondStrategy()
}

const GLPH_INITS = [
  makeInitStrategy("ellipse", false),
  makeInitStrategy("rectangle", false),
  makeInitStrategy("rectangle", true),
  makeInitStrategy("triangle", false),
  makeInitStrategy("triangle", true),
  makeInitStrategy("diamond", false),
  makeInitStrategy("diamond", true)
];

const GLPH_TRANSITIONS = [
  makeTransitionStrategy("ellipse", false),
  makeTransitionStrategy("rectangle", false),
  makeTransitionStrategy("rectangle", true),
  makeTransitionStrategy("triangle", false),
  makeTransitionStrategy("triangle", true),
  makeTransitionStrategy("diamond", false),
  makeTransitionStrategy("diamond", true)
];
