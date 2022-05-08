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


function drawEllipse(selection, rotate, i, radius) {
  selection.append("ellipse")
    .style("fill", getGroupFills(i))
    .classed("gap-indicator", true)
    .attr("cy", 0)
    .attr("cx", 0)
    .attr("rx", 7)
    .attr("ry", 7);
}


function transitionEllipse(selection, rotate, i, radius) {
  selection.select(".gap-indicator").transition()
    .attr("rx", radius)
    .attr("ry", radius);
}


function drawRect(selection, rotate, i, radius) {
  const rects = selection.append("rect")
    .style("fill", getGroupFills(i))
    .classed("gap-indicator", true)
    .attr("y", -7)
    .attr("x", -7)
    .attr("width", 7 * 2)
    .attr("height", 7 * 2);

  if (rotate) {
    rects.classed("rotate-glyph", true);
  }
}


function transitionRect(selection, rotate, i, radius) {
  const rects = selection.select(".gap-indicator").transition()
    .attr("y", -radius)
    .attr("x", -radius)
    .attr("width", radius * 2)
    .attr("height", radius * 2);
}


function getTrianglePoints(radius) {
  return [
    "0," + (-1 * radius),
    radius + "," + radius,
    (-1 * radius) + "," + radius,
  ];
}


function drawTriangle(selection, rotate, i, radius) {
  const outputStrs = getTrianglePoints(7);

  const shapes = selection.append("polygon")
    .style("fill", getGroupFills(i))
    .classed("gap-indicator", true)
    .attr("y", 0)
    .attr("x", 0)
    .attr("points", outputStrs.join(" "));

  if (rotate) {
    shapes.classed("rotate-glyph", true);
  }
}


function transitionTriangle(selection, rotate, i, radius) {
  const outputStrs = getTrianglePoints(radius);

  const rects = selection.select(".gap-indicator").transition()
    .attr("points", outputStrs.join(" "));
}

function getDiamondPoints(radius) {
  const offLength = radius / Math.sqrt(2);

  return [
    "0," + (-1 * radius),
    offLength + "," + offLength,
    "0," + radius,
    (-1 * offLength) + "," + offLength,
  ];
}


function drawDiamond(selection, rotate, i, radius) {
  const outputStrs = getDiamondPoints(7);

  const shapes = selection.append("polygon")
    .style("fill", getGroupFills(i))
    .classed("gap-indicator", true)
    .attr("y", -7)
    .attr("x", -7)
    .attr("points", outputStrs.join(" "));

  if (rotate) {
    shapes.classed("rotate-glyph", true);
  }
}


function transitionDiamond(selection, rotate, i, radius) {
  const outputStrs = getDiamondPoints(radius);

  selection.select(".gap-indicator").transition()
    .attr("points", outputStrs.join(" "));
}
