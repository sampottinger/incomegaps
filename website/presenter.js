/**
 * Logic for rendering and updating the visualization.
 *
 * @author A Samuel Pottinger
 * @license MIT
 */


/**
 * Presenter to draw and update the visualization.
 */
class VizPresenter {

  /**
   * Create a new viz presenter.
   *
   * Create a new viz presenter which will control the visualization until the
   * underlying data changes such that the number of glyphs per occupation is
   * different.
   *
   * @param maxPay The maximum hourly pay to show the user. Pays past this will
   *   potentially render off screen.
   * @param minGap The lowest percent difference (the largest negative percent
   *   difference from the overall mean) to show for an occupation. Gaps below
   *   this value may render off screen.
   * @param maxGap The largest percent difference (the largest positive percent
   *   difference from the ovearll mean) to show for an occupation. Gaps above
   *   this value may render off screen.
   * @param maxGini The maximum gini index to show the user. Ginis past this
   *   will potentially render off screen.
   */
  constructor(maxPay, minGap, maxGap, maxGini) {
    const self = this;

    self._maxPay = maxPay;
    self._minGap = minGap;
    self._maxGap = maxGap;
    self._maxGini = maxGini;
    self._requiresSparseAxis = false;

    self._numFormatInt = (x) => d3.format(".0f")(x).replaceAll("−", "-");
    self._numFormatConcise = (x) => d3.format(".1f")(x).replaceAll("−", "-");
    self._numFormat = (x) => d3.format(".2f")(x).replaceAll("−", "-");
    self._numFormatSign = (x) => d3.format("+.1f")(x).replaceAll("−", "-");

    self._updateWidths();
  }

  /**
   * Draw the visaulization, creating elements if needed.
   *
   * @param queryResults The result of querying the dataset.
   * @returns Promise that resolves after the visualization is updated.
   */
  draw(queryResults) {
    const self = this;

    return new Promise((resolve, reject) => {
      const selection = self._createSelection(queryResults);

      selection.exit().remove();
      const selectionUpdated = self._createElements(selection);

      const metricsDisabled = !isMetricDisplayEnabled();
      d3.selectAll(".cell-pay").classed("hidden-metric", metricsDisabled);
      d3.selectAll(".cell-gini").classed("hidden-metric", metricsDisabled);

      self._updateWidths(queryResults);
      self._updateFixedElements(selectionUpdated);
      self._updateGapElements(selectionUpdated);
      self._updateLegend(queryResults);

      resolve();
    });
  }

  /**
   * Update the width of the columns and axes.
   *
   * Update the width of the columns and axes that influence the overall
   * spacing of table columns / cells. This will also update the axis labels.
   *
   * @param dataset The query results (array of Record).
   */
  _updateWidths(dataset) {
    const self = this;

    const staticGapMinMax = getGapMinMax();
    const staticGapMin = staticGapMinMax["min"];
    const staticGapMax = staticGapMinMax["max"];

    const effectiveMaxPay = self._getMax(
      self._maxPay,
      dataset,
      (x) => x.getPay()
    );

    const effectiveMaxGini = self._getMax(
      self._maxGini,
      dataset,
      (x) => x.getGini()
    );

    const effectiveGapMin = self._getMin(
      staticGapMin,
      dataset,
      self._makeGapInfoGetter((x) => x["value"], (x) => Math.min(...x))
    );

    const effectiveGapMax = self._getMax(
      staticGapMax,
      dataset,
      self._makeGapInfoGetter((x) => x["value"], (x) => Math.max(...x))
    );

    self._maxPayWidth = self._getWidth("cell-pay");
    self._maxGapWidth = self._getWidth("cell-gap");
    self._maxGiniWidth = self._getWidth("cell-gini");

    self._payScale = d3.scaleLinear()
      .domain([0, effectiveMaxPay])
      .range([0, self._maxPayWidth]);

    d3.select("#maxPay").html(self._numFormatConcise(effectiveMaxPay));

    self._gapScale = d3.scaleLinear()
      .domain([effectiveGapMin, effectiveGapMax])
      .range([20, self._maxGapWidth - 20]);

    self._giniScale = d3.scaleLinear()
      .domain([0, effectiveMaxGini])
      .range([0, self._maxGiniWidth]);

    d3.select("#maxGini").html(self._numFormatConcise(effectiveMaxGini));

    const range = effectiveGapMax - effectiveGapMin;
    self._requiresSparseAxis = range > 150;
  }

  /**
   * Get the width of a set of elements with the given class name.
   *
   * @param selector The selector (class name without period).
   * @returns Width in pixels of the first element with the given class.
   */
  _getWidth(selector) {
    const self = this;
    const firstElem = document.getElementsByClassName(selector)[0];
    return firstElem.getBoundingClientRect()["width"];
  }

  /**
   * Create a selection over the rows of the visualization table.
   *
   * @param queryResults The records to be displayed in the visualization.
   *   This is a collection of Records.
   */
  _createSelection(queryResults) {
    const self = this;

    return d3.select("#vizTableBody")
      .selectAll(".viz-row")
      .data(queryResults, (x) => x.getName());
  }

  /**
   * Update elements for the visualization.
   *
   * Update the actual HTML elements to display in the visualization. This will
   * only create new elements where they are missing (not enough elements to
   * show all subpopulations). Existing elements will not be removed.
   *
   * @param selection Selection over all of the viz rows with the new data
   *   bound.
   * @returns Selection over all all viz-rows.
   */
  _createElements(selection) {
    const self = this;

    const midX = self._gapScale(0);

    const ticks = [];
    for (let i = -200; i <= 200; i += 20) {
        ticks.push(i);
    }

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

  /**
   * Update all of the viz elements where the number of elements remain same.
   *
   * Update all of the embedded bar charts where there is not a variable number
   * of elements for a population (only one element for an entire occupation,
   * for example).
   *
   * @param selection Selection over all of the viz rows with the new data
   *   bound.
   */
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

  /**
   * Update elements showing pay gaps.
   *
   * Update elements showing pay gaps where there may be a variable number of
   * elements per occupation based on subgroups / metric selected.
   *
   * @param selection Selection over all of the viz rows with the new data
   *   bound.
   */
  _updateGapElements(selection) {
    const self = this;

    const axesSelection = d3.select("#gapAxes").selectAll(".label").transition()
      .duration(1000)
      .attr("x", (x) => self._gapScale(x))
      .attr("y", 10)
      .style("opacity", (x) => {
          const absX = Math.abs(x);
          const isOdd = (absX / 20) % 2 == 1;
          const requiresZoomOut = self._requiresSparseAxis && isOdd;
          return requiresZoomOut ? 0 : 1;
      });

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
      const glyphStrategy = getGlyphInitStrategy(i);
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

  /**
   * Update which subgroup is being hovered on by the user.
   *
   * @param index The index of the subgroup to highlight. This is zero indexed
   *   and indexes into the names array.
   */
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

  /**
   * Indicate that no subgroup is being hovered on by the user.
   *
   * Clear the hover state such that no subgroups are highlighted in the
   * visualization.
   */
  _clearGlyphHover() {
    const self = this;
    d3.selectAll(".gap-group").classed("glyph-hovering", false);
    d3.selectAll(".glyph-label-display").classed("glyph-hovering", false);
  }

  /**
   * Update the legend at the top of the screen labeling each glyph.
   *
   * @param dataset The dataset query results (list of Records).
   */
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
      const glyphStrategy = getGlyphInitStrategy(i);
      glyphStrategy(d3.select(this), i, DEFAULT_GLYPH_SIZE);
    });

    // Make size display
    const sizeLegend = d3.select("#sizeLegend");
    sizeLegend.style("display", isSizingEnabled() ? "inline-block" : "none");

    const minDisplay = d3.select("#minSizeDisplay");
    const maxDisplay = d3.select("#maxSizeDisplay");
    const glyphStrategy = getGlyphInitStrategy(i);
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

  /**
   * Get the minimum value from a dataset query for a scale or axis.
   *
   * @param staticVal A default minimum value. If the actual minimum is higher
   *   than this, this static value will be used.
   * @param dataset The dataset from which the minimum value is gathered. If
   *   not given, will return staticVal.
   * @param getter Function which, when given a Record, returns a value for
   *   that record. The minimum of the values returned by the getter or the
   *   staticVal will be returned. Ignored if dataset not given.
   * @returns Minimum value to use for the scale / axis.
   */
  _getMin(staticVal, dataset, getter) {
    const self = this;

    if (dataset === undefined) {
      return staticVal;
    }

    const filteredVals = self._getVals(dataset, getter);

    if (filteredVals.length == 0) {
      return staticVal;
    }

    const naturalMin = Math.min(...filteredVals);
    return Math.min(naturalMin, staticVal);
  }

  /**
   * Get the maximum value from a dataset query for a scale or axis.
   *
   * @param staticVal A default maximum value. If the actual maximum is lower
   *   than this, this static value will be used.
   * @param dataset The dataset from which the maximum value is gathered. If
   *   not given, will return staticVal.
   * @param getter Function which, when given a Record, returns a value for
   *   that record. The maximum of the values returned by the getter or the
   *   staticVal will be returned. Ignored if dataset not given.
   * @returns Maximum value to use for the scale / axis.
   */
  _getMax(staticVal, dataset, getter) {
    const self = this;

    if (dataset === undefined) {
      return staticVal;
    }

    const filteredVals = self._getVals(dataset, getter);

    if (filteredVals.length == 0) {
      return staticVal;
    }

    const naturalMax = Math.max(...filteredVals);
    return Math.max(naturalMax, staticVal);
  }

  /**
   * Get the values relevant to an axis.
   *
   * @param dataset Collection of Records from which values that will be
   *   displayed on the axis will be returned.
   * @param getter Function taking a Record to return a value to represent that
   *   record on an axis.
   * @returns List of values for the axis.
   */
  _getVals(dataset, getter) {
    const self = this;
    const unfilteredVals = dataset.map(getter);
    const filteredVals = unfilteredVals.filter((x) => x !== null);
    return filteredVals;
  }

  /**
   * Make a getter for _getVals that summarizes gap info.
   *
   * @param getter Getter to apply to a record inside getGapInfo.
   * @param summarizer Function taking a list of values from getter to return
   *   one representative value for the Record from which the getter's values
   *   were collected.
   * @returns Function which can be applied to a Record and which returns a
   *   single representative value for that Record's getGapInfo.
   */
  _makeGapInfoGetter(getter, summarizer) {
    const self = this;
    return (datum) => {
      const values = Array.from(datum.getGapInfo().values());
      const innerVals = values.map(getter);
      return summarizer(innerVals);
    };
  }

}
