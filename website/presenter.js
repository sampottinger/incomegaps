class VizPresenter {

  constructor(maxPay, minGap, maxGap, maxGini) {
    const self = this;

    self._maxPay = maxPay;
    self._minGap = minGap;
    self._maxGap = maxGap;
    self._maxGini = maxGini;

    self._numFormatInt = (x) => d3.format(".0f")(x).replaceAll("−", "-");
    self._numFormatConcise = (x) => d3.format(".1f")(x).replaceAll("−", "-");
    self._numFormat = (x) => d3.format(".2f")(x).replaceAll("−", "-");
    self._numFormatSign = (x) => d3.format("+.1f")(x).replaceAll("−", "-");

    self._updateWidths();
  }

  draw(queryResults) {
    const self = this;

    return new Promise((resolve, reject) => {
      const selection = self._createSelection(queryResults);

      selection.exit().remove();
      const selectionUpdated = self._createElements(selection);

      self._updateFixedElements(selectionUpdated);

      self._updateWidths();
      self._updateGapElements(selectionUpdated);
      self._updateLegend(queryResults);
      resolve();
    });
  }

  _updateWidths() {
    const self = this;

    self._maxPayWidth = self._getWidth("cell-pay");
    self._maxGapWidth = self._getWidth("cell-gap");
    self._maxGiniWidth = self._getWidth("cell-gini");

    self._payScale = d3.scaleLinear()
      .domain([0, self._maxPay])
      .range([0, self._maxPayWidth]);

    d3.select("#maxPay").html(self._numFormatConcise(self._maxPay));

    const effectiveMinMax = getGapMinMax();
    const effectiveMin = effectiveMinMax["min"];
    const effectiveMax = effectiveMinMax["max"];

    self._gapScale = d3.scaleLinear()
      .domain([effectiveMin, effectiveMax])
      .range([20, self._maxGapWidth - 20]);

    self._giniScale = d3.scaleLinear()
      .domain([0, self._maxGini])
      .range([0, self._maxGiniWidth]);

    d3.select("#maxGini").html(self._numFormatConcise(self._maxGini));
  }

  _getWidth(selector) {
    const self = this;
    const firstElem = document.getElementsByClassName(selector)[0];
    return firstElem.getBoundingClientRect()["width"];
  }

  _createSelection(queryResults) {
    const self = this;

    return d3.select("#vizTableBody")
      .selectAll(".viz-row")
      .data(queryResults, (x) => x.getName());
  }

  _createElements(selection) {
    const self = this;

    const midX = self._gapScale(0);

    const ticks = [-80, -60, -40, -20, 0, 20, 40, 60, 80];
    d3.select("#gapAxes").selectAll(".label").data(ticks, (x) => x).enter()
      .append("text")
      .classed("label", true)
      .attr("x", midX)
      .attr("y", 10)
      .html((x) => self._numFormatInt(x) + "%");

    const newElements = selection.enter()
      .append("tr")
      .classed("viz-row", true);

    const newOccupationCells = newElements.append("td")
      .classed("cell-occupation", true);

    newOccupationCells.append("span")
      .classed("occupation-label", true)
      .html((x) => x.getName().replaceAll(" occupations", ""));

    const newPayElements = newElements.append("td")
      .classed("cell-pay", true);

    newPayElements.append("div")
      .classed("bar-label", true);

    newPayElements.append("div")
      .classed("bar-body", true)
      .style("width", 0);

    const newGapElements = newElements.append("td")
      .classed("cell-gap", true);

    const newGapSvg = newGapElements.append("svg")
      .classed("cell-gap-svg", true);

    newGapSvg.append("rect")
      .classed("gap-line", true)
      .attr("x", midX);

    newGapSvg.selectAll("tick").data(ticks, (x) => x).enter().append("rect")
      .classed("tick", true)
      .classed("center-line", (x) => x == 0)
      .attr("x", midX);

    const newGiniElements = newElements.append("td")
      .classed("cell-gini", true);

    newGiniElements.append("div")
      .classed("bar-label", true);

    newGiniElements.append("div")
      .classed("bar-body", true)
      .style("width", 0);

    return selection.merge(newElements);
  }

  _updateFixedElements(selection) {
    const self = this;

    const payElements = selection.select(".cell-pay");

    payElements.select(".bar-label")
      .html((x) => self._numFormat(x.getPay()));

    payElements.select(".bar-body")
      .transition()
      .style("width", (x) => self._payScale(x.getPay()) + "px");

    const giniElements = selection.select(".cell-gini");

    giniElements.select(".bar-label")
      .html((x) => self._numFormat(x.getGini()));

    giniElements.select(".bar-body")
      .transition()
      .style("width", (x) => self._giniScale(x.getGini()) + "px");
  }

  _updateGapElements(selection) {
    const self = this;

    const axesSelection = d3.select("#gapAxes").selectAll(".label").transition()
      .duration(1000)
      .attr("x", (x) => self._gapScale(x))
      .attr("y", 10);

    const svgSelection = selection.select(".cell-gap-svg");
    svgSelection.selectAll(".tick").transition()
      .duration(1000)
      .attr("x", (x) => self._gapScale(x));

    const innerSelection = svgSelection.selectAll(".gap-group");

    const innerElements = innerSelection.data((x) => {
        const simplified = [];

        let maxPop = 0;
        x.getGapInfo().forEach((datum, name) => {
          const pop = datum["pop"];
          if (pop > maxPop) {
            maxPop = pop;
          }
        });
        const popScale = d3.scaleLinear()
          .domain([0, Math.sqrt(maxPop)])
          .range([MIN_GLYPH_SIZE, MAX_GLYPH_SIZE]);

        let i = 0;
        x.getGapInfo().forEach((datum, name) => {
          const value = datum["value"];
          const pop = datum["pop"];
          const size = isSizingEnabled() ? popScale(Math.sqrt(pop)) : DEFAULT_GLYPH_SIZE;
          simplified.push({"name": name, "value": value, "size": size, "i": i});
          i++;
        });

        return simplified;
    }, (x) => x["i"]);

    const midX = self._gapScale(0);
    const newGroups = innerElements.enter()
      .append("g")
      .classed("gap-group", true)
      .attr("transform", "translate(" + midX + ",10)")
      .attr("opacity", 0)
      .on("mouseover", (event, datum) => {
        self._setGlyphHover(datum["i"]);
      })
      .on("mouseout", (event, datum) => {
        self._clearGlyphHover();
      });

    newGroups.each(function (datum) {
      const radius = datum["size"];
      const i = datum["i"];
      const glyphStrategy = getGlyphStrategy(i);
      glyphStrategy(d3.select(this), i, radius);
    });

    newGroups.append("text")
      .classed("gap-label", true)
      .attr("x", 0)
      .attr("y", 17);

    innerElements.exit().remove();

    const joinedInnerElements = d3.selectAll(".gap-group");

    joinedInnerElements.transition()
      .delay(200)
      .duration(1000)
      .attr("transform", (x) => {
        const midX = self._maxGapWidth / 2;
        const newX = x["value"] === null ? midX : self._gapScale(x["value"]);
        return "translate(" + newX + ", 10)";
      })
      .attr("opacity", (x) => {
        if (x["pop"] < 1) {
          return 0;
        } else {
          return x["value"] === null ? 0 : 0.8;
        }
      });

    joinedInnerElements.each(function (datum) {
      const radius = datum["size"];
      const i = datum["i"];
      const glyphTransition = getGlyphTransition(i);
      glyphTransition(d3.select(this), i, radius);
    });

    joinedInnerElements.select(".gap-label")
      .html((x) => {
        return self._numFormatSign(x["value"]) + "%";
      });

    selection.select(".cell-gap-svg").select(".gap-line")
      .transition()
      .delay(200)
      .duration(1000)
      .attr("x", (x) => {
        let minX = midX;
        x.getGapInfo().forEach((datum, name) => {
          const value = datum["value"];
          const midX = self._maxGapWidth / 2;
          const newX = value === null ? midX : self._gapScale(value);
          if (newX < minX && datum["pop"] > 0) {
            minX = newX;
          }
        });
        return minX;
      })
      .attr("width", (x) => {
        let minX = midX;
        let maxX = midX;
        x.getGapInfo().forEach((datum, name) => {
          const value = datum["value"];
          const midX = self._maxGapWidth / 2;
          const newX = value === null ? midX : self._gapScale(value);
          if (datum["pop"] > 0) {
            if (newX < minX) {
              minX = newX;
            }
            if (newX > maxX) {
              maxX = newX;
            }
          }
        });
        return maxX - minX;
      });
  }

  _setGlyphHover(index) {
    const self = this;
    const groups = d3.selectAll(".gap-group");
    groups.classed("glyph-hovering", (x) => x["i"] == index);

    const labels = d3.selectAll(".glyph-label-display");
    labels.classed(
      "glyph-hovering",
      (x) => x !== undefined && x["i"] == index
    );
  }

  _clearGlyphHover() {
    const self = this;
    d3.selectAll(".gap-group").classed("glyph-hovering", false);
    d3.selectAll(".glyph-label-display").classed("glyph-hovering", false);
  }

  _updateLegend(dataset) {
    const self = this;

    // Get info
    let i = 0;
    const outputRecords = [];
    dataset[0].getGapInfo().forEach((datum, name) => {
      outputRecords.push({"name": name, "i": i});
      i++;
    });

    // Make labels
    const glyphLabels = d3.select("#glyphLabels");
    glyphLabels.html("");

    const labelCells = glyphLabels.selectAll(".label-cell")
      .data(outputRecords)
      .enter()
      .append("td")
      .classed("label-cell", true);

    labelCells.html((x) => x["name"]);

    // Make glyphs
    const glyphDisplays = d3.select("#glyphDisplays");
    glyphDisplays.html("");

    const glyphCells = glyphDisplays.selectAll(".glyph-cell")
      .data(outputRecords)
      .enter()
      .append("td")
      .classed("glyph-cell", true);

    const glyphInnerDisplays = glyphCells.append("svg")
      .classed("glyph-label-display", true)
      .append("g")
      .attr("transform", "translate(10, 10)")
      .on("mouseover", (event, datum) => {
        self._setGlyphHover(datum["i"]);
      })
      .on("mouseout", (event, datum) => {
        self._clearGlyphHover();
      });

    glyphInnerDisplays.each(function (datum) {
      const i = datum["i"];
      const glyphStrategy = getGlyphStrategy(i);
      glyphStrategy(d3.select(this), i, DEFAULT_GLYPH_SIZE);
    });

    // Make size display
    const sizeLegend = d3.select("#sizeLegend");
    sizeLegend.style("display", isSizingEnabled() ? "inline-block" : "none");

    const minDisplay = d3.select("#minSizeDisplay");
    const maxDisplay = d3.select("#maxSizeDisplay");
    const glyphStrategy = getGlyphStrategy(i);
    minDisplay.html("");
    maxDisplay.html("");
    glyphStrategy(
      minDisplay.append("g").attr("transform", "translate(10, 10)"),
      0,
      MIN_GLYPH_SIZE
    );
    glyphStrategy(
      maxDisplay.append("g").attr("transform", "translate(10, 10)"),
      0,
      MAX_GLYPH_SIZE
    );
  }

}


function createNewPresenter() {
  d3.select("#vizTableBody").html("");
  currentPresenter = new VizPresenter(MAX_PAY, MIN_GAP, MAX_GAP, MAX_GINI);
  return currentPresenter;
}