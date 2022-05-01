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
  (x, i) => drawEllipse(x, false, i),
  (x, i) => drawRect(x, false, i),
  (x, i) => drawRect(x, true, i),
  (x, i) => drawTriangle(x, false, i),
  (x, i) => drawTriangle(x, true, i),
  (x, i) => drawDiamond(x, false, i),
  (x, i) => drawDiamond(x, true, i)
];


function drawEllipse(selection, rotate, i) {
  selection.append("ellipse")
    .style("fill", GROUP_FILLS[i])
    .classed("gap-indicator", true)
    .attr("cy", 0)
    .attr("cx", 0)
    .attr("rx", 7)
    .attr("ry", 7);
}


function drawRect(selection, rotate, i) {
  const rects = selection.append("rect")
    .style("fill", GROUP_FILLS[i])
    .classed("gap-indicator", true)
    .attr("y", -7)
    .attr("x", -7)
    .attr("width", 14)
    .attr("height", 14);

  if (rotate) {
    rects.classed("rotate-glyph", true);
  }
}


function drawTriangle(selection, rotate, i) {
  const rects = selection.append("polygon")
    .style("fill", GROUP_FILLS[i])
    .classed("gap-indicator", true)
    .attr("y", -7)
    .attr("x", -7)
    .attr("points", "0,-7 4.9497,4.9497 -4.9497,4.9497");

  if (rotate) {
    rects.classed("rotate-glyph", true);
  }
}

function drawDiamond(selection, rotate, i) {
  const rects = selection.append("polygon")
    .style("fill", GROUP_FILLS[i])
    .classed("gap-indicator", true)
    .attr("y", -7)
    .attr("x", -7)
    .attr("points", "0,-7 4.9497,4.9497 0,7 -4.9497,4.9497");

  if (rotate) {
    rects.classed("rotate-glyph", true);
  }
}
