QUnit.module('incomeGaps', function() {

  QUnit.test('loadSourceDataRaw', function(assert) {
    const done = assert.async();

    loadSourceDataRaw("../2021.csv").then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      done();
    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  });

  QUnit.test('loadSourceDataNoCache', function(assert) {
    const done = assert.async();

    loadSourceDataNoCache("../2021.csv").then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      assert.ok(dataset._rawResults.length > 0);

      done();
    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  });

  QUnit.test('loadSourceData', function(assert) {
    const done = assert.async();
    loadSourceData("../2021.csv").then(loadSourceData).then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      assert.ok(dataset._rawResults.length > 0);
      done();
    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  });

  function testDataset(done, assert, callback) {
    loadSourceData("../2021.csv").then((dataset) => {
      callback(dataset);
      done();
    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  }

  QUnit.test('dataset rollupQuery', function(assert) {
    const done = assert.async();
    testDataset(done, assert, (dataset) => {
      const grouped = dataset._rollupQuery("educ");
      assert.ok(grouped.has("Office and administrative support occupations"));
    });
  });

  QUnit.test('dataset query', function(assert) {
    const done = assert.async();
    testDataset(done, assert, (dataset) => {
      const grouped = dataset.query("educ");
      assert.equal(grouped.length, 22);
    });
  });

  QUnit.test('dataset gini', function(assert) {
    const done = assert.async();
    testDataset(done, assert, (dataset) => {
      const gini = dataset._getGini([
        {"wageTotal": 10 * 10, "countTotal": 10},
        {"wageTotal": 20 * 15, "countTotal": 15},
        {"wageTotal": 30 * 20, "countTotal": 20}
      ]);
      assert.ok(Math.abs(gini - 18.88) < 0.01);
    });
  });

  function testPresenter(done, assert, callback) {
    loadSourceData("../2021.csv").then((dataset) => {
      const presenter = new VizPresenter(60, -0.5, 0.5, 1);
      const queryResults = dataset.query("educ");

      try {
        callback(done, presenter, queryResults);
      } catch (e) {
        assert.deepEqual(e, "");
      }

    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  }

  QUnit.test('presenter numFormat', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter) => {
      assert.deepEqual(presenter._numFormat(1.235), "1.24");
      assert.deepEqual(presenter._numFormat(-1.235), "-1.24");
      doneInner();
    });
  });

  QUnit.test('presenter numFormatSign', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter) => {
      assert.deepEqual(presenter._numFormatSign(1.235), "+1.2");
      assert.deepEqual(presenter._numFormatSign(-1.235), "-1.2");
      doneInner();
    });
  });

  QUnit.test('presenter createSelection', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter) => {
      assert.ok(presenter !== undefined);
      assert.ok(presenter !== null);
      doneInner();
    });
  });

  QUnit.test('presenter getWidth', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter) => {
      assert.ok(presenter._getWidth("cell-occupation") > 0);
      doneInner();
    });
  });

  QUnit.test('presenter createSelection', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      assert.ok(presenter._createSelection(queryResults) !== null);
      doneInner();
    });
  });

  QUnit.test('presenter createElements', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      const selection = presenter._createSelection(queryResults);
      selection.exit().remove();
      presenter._createElements(selection);
      assert.equal(
        document.getElementsByClassName("cell-occupation").length,
        queryResults.length + 1
      );
      doneInner();
    });
  });

  QUnit.test('presenter repeatCreate', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      const selection = presenter._createSelection(queryResults);
      selection.exit().remove();
      presenter._createElements(selection);
      assert.equal(
        document.getElementsByClassName("cell-occupation").length,
        queryResults.length + 1
      );
      doneInner();
    });
  });

  QUnit.test('presenter updateFixedElements', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      d3.select("#vizTableBody").html("");
      const selection = presenter._createSelection(queryResults);
      const selectionUpdated = presenter._createElements(selection);
      presenter._updateFixedElements(selectionUpdated);
      const barLabelElements = document.getElementsByClassName("bar-label");
      const exampleElement = barLabelElements[0]
      assert.ok(exampleElement.innerHTML !== "");
      doneInner();
    });
  });

  QUnit.test('presenter updateGapElements', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      d3.select("#vizTableBody").html("");
      const selection = presenter._createSelection(queryResults);
      const selectionUpdated = presenter._createElements(selection);
      presenter._updateGapElements(selectionUpdated);
      const gapLabelElements = document.getElementsByClassName("gap-label");
      assert.ok(gapLabelElements.length > 0);
      const exampleElement = gapLabelElements[0]
      assert.ok(exampleElement.innerHTML !== "");
      doneInner();
    });
  });

  QUnit.test('presenter draw', function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      d3.select("#vizTableBody").html("");
      const selection = presenter.draw(queryResults).then(() => {
        assert.equal(
          document.getElementsByClassName("cell-occupation").length,
          queryResults.length + 1
        );

        const gapLabelElements = document.getElementsByClassName("gap-label");
        assert.ok(gapLabelElements.length > 0);
        const exampleElement = gapLabelElements[0]
        assert.ok(exampleElement.innerHTML !== "");
        doneInner();
      });
    });
  });

  QUnit.test('updateViz', function(assert) {
    const done = assert.async();
    updateViz().then(() => {
      const numOccupations = document.getElementsByClassName("cell-occupation").length;
      assert.ok(numOccupations > 1);
      done();
    });
  });

});
