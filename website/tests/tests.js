QUnit.module("incomeGaps", function() {

  const DATA_LOCATION = "../data.csv";

  const SAMPLE_GAP_1 = new Map();
  SAMPLE_GAP_1.set("group1", {"value": 12, "pop": 34});
  SAMPLE_GAP_1.set("group2", {"value": 23, "pop": 45});

  const SAMPLE_GAP_2 = new Map();
  SAMPLE_GAP_2.set("group3", {"value": 34, "pop": 56});
  SAMPLE_GAP_2.set("group4", {"value": 45, "pop": 67});

  const SAMPLE_RECORDS = [
    new Record("occupation1", 123, SAMPLE_GAP_1, 0.456),
    new Record("occupation2", 234, SAMPLE_GAP_2, 0.567)
  ];

  QUnit.test("loadSourceDataRaw", function(assert) {
    const done = assert.async();

    loadSourceDataRaw(DATA_LOCATION).then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      done();
    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  });

  QUnit.test("loadSourceDataNoCache", function(assert) {
    const done = assert.async();

    loadSourceDataNoCache(DATA_LOCATION).then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      assert.ok(dataset._rawResults.length > 0);

      done();
    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  });

  QUnit.test("loadSourceData", function(assert) {
    const done = assert.async();
    loadSourceData(DATA_LOCATION).then(loadSourceData).then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      assert.ok(dataset._rawResults.length > 0);

      const exampleRecord = dataset._rawResults[0];
      assert.ok(!isNaN(parseFloat(exampleRecord["unempCount"])));
      assert.ok(!isNaN(parseFloat(exampleRecord["unemp"])));
      assert.ok(!isNaN(parseFloat(exampleRecord["wageCount"])));

      const wageOtc = dataset._rawResults[0]["wageotc"];
      const exampleWage = parseFloat(wageOtc.split(" ")[0]);
      assert.ok(!isNaN(exampleWage));

      done();
    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  });

  function testDataset(done, assert, callback) {
    loadSourceData(DATA_LOCATION).then((dataset) => {
      callback(dataset);
      done();
    }).catch((err) => {
      assert.deepEqual(err, "");
      done();
    });
  }

  QUnit.test("dataset rollupQuery", function(assert) {
    const done = assert.async();
    testDataset(done, assert, (dataset) => {
      const grouped = dataset._rollupQuery("educ", []);
      assert.ok(grouped.has("Office and administrative support occupations"));
    });
  });

  QUnit.test("dataset query", function(assert) {
    const done = assert.async();
    testDataset(done, assert, (dataset) => {
      const grouped = dataset.query("educ");
      assert.equal(grouped.length, 23);
    });
  });

  QUnit.test("dataset gini", function(assert) {
    const done = assert.async();
    testDataset(done, assert, (dataset) => {
      const gini = dataset._getGini([
        {"valueTotal": 10 * 10, "countTotal": 10},
        {"valueTotal": 20 * 15, "countTotal": 15},
        {"valueTotal": 30 * 20, "countTotal": 20}
      ]);
      assert.ok(Math.abs(gini - 18.88) < 0.01);
    });
  });

  function testPresenter(done, assert, callback) {
    loadSourceData(DATA_LOCATION).then((dataset) => {
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

  QUnit.test("presenter numFormat", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter) => {
      assert.deepEqual(presenter._numFormat(1.235), "1.24");
      assert.deepEqual(presenter._numFormat(-1.235), "-1.24");
      doneInner();
    });
  });

  QUnit.test("presenter numFormatSign", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter) => {
      assert.deepEqual(presenter._numFormatSign(1.235), "+1.2");
      assert.deepEqual(presenter._numFormatSign(-1.235), "-1.2");
      doneInner();
    });
  });

  QUnit.test("presenter createSelection", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter) => {
      assert.ok(presenter !== undefined);
      assert.ok(presenter !== null);
      doneInner();
    });
  });

  QUnit.test("presenter getWidth", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter) => {
      assert.ok(presenter._getWidth("cell-occupation") > 0);
      doneInner();
    });
  });

  QUnit.test("presenter createSelection", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      assert.ok(presenter._createSelection(queryResults) !== null);
      doneInner();
    });
  });

  QUnit.test("presenter createElements", function(assert) {
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

  QUnit.test("presenter repeatCreate", function(assert) {
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

  QUnit.test("presenter updateFixedElements", function(assert) {
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

  QUnit.test("presenter updateGapElements", function(assert) {
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

  QUnit.test("presenter draw", function(assert) {
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

  QUnit.test("presenter getVals simple", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      const results = presenter._getVals(SAMPLE_RECORDS, (x) => x.getValue());
      assert.equal(results.length, 2);
      assert.equal(results[0], 123);
      assert.equal(results[1], 234);
      done();
    });
  });

  QUnit.test("presenter getVals gap info", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      const getter = presenter._makeGapInfoGetter(
        (x) => x["value"],
        (x) => Math.max(...x)
      );
      const results = presenter._getVals(SAMPLE_RECORDS, getter);
      assert.equal(results.length, 2);
      assert.equal(results[0], 23);
      assert.equal(results[1], 45);
      done();
    });
  });

  QUnit.test("presenter getMin static", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      const results = presenter._getMin(1, SAMPLE_RECORDS, (x) => x.getValue());
      assert.equal(results, 1);
      done();
    });
  });

  QUnit.test("presenter getMin dynamic", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      const results = presenter._getMin(
        500,
        SAMPLE_RECORDS,
        (x) => x.getValue()
      );
      assert.equal(results, 123);
      done();
    });
  });

  QUnit.test("presenter getMax static", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      const results = presenter._getMax(
        500,
        SAMPLE_RECORDS,
        (x) => x.getValue()
      );
      assert.equal(results, 500);
      done();
    });
  });

  QUnit.test("presenter getMax dynamic", function(assert) {
    const done = assert.async();
    testPresenter(done, assert, (doneInner, presenter, queryResults) => {
      const results = presenter._getMax(
        1,
        SAMPLE_RECORDS,
        (x) => x.getValue()
      );
      assert.equal(results, 234);
      done();
    });
  });

  QUnit.test("updateViz", function(assert) {
    const done = assert.async();
    updateViz().then(() => {
      const numOccupations = document.getElementsByClassName("cell-occupation").length;
      assert.ok(numOccupations > 1);
      done();
    });
  });

  QUnit.test("renderIncomeMedian", function(assert) {
    const done = assert.async();
    document.getElementById("variable").value = "income.median";
    updateViz().then(() => {
      const numOccupations = document.getElementsByClassName("cell-occupation").length;
      assert.ok(numOccupations > 1);
      done();
    });
  });

  QUnit.test("renderIncomeMean", function(assert) {
    const done = assert.async();
    document.getElementById("variable").value = "income.mean";
    updateViz().then(() => {
      const numOccupations = document.getElementsByClassName("cell-occupation").length;
      assert.ok(numOccupations > 1);
      done();
    });
  });

  QUnit.test("renderUnemployment", function(assert) {
    const done = assert.async();
    document.getElementById("variable").value = "unemployment.mean";
    updateViz().then(() => {
      const numOccupations = document.getElementsByClassName("cell-occupation").length;
      assert.ok(numOccupations > 1);
      done();
    });
  });

  QUnit.test("dataAvailableFilter", function(assert) {
    const done = assert.async();
    updateViz(["Male"]).then(() => {
      assert.deepEqual(
        document.getElementById("noDataMessage").style.display,
        "none"
      );
      assert.deepEqual(
        document.getElementById("vizBody").style.display,
        "block"
      );
      done();
    });
  });

  QUnit.test("dataNotAvailableFilter", function(assert) {
    const done = assert.async();
    updateViz(["Male", "Female"]).then(() => {
      assert.deepEqual(
        document.getElementById("noDataMessage").style.display,
        "block"
      );
      assert.deepEqual(
        document.getElementById("vizBody").style.display,
        "none"
      );
      done();
    });
  });

  QUnit.test("getDeepLinkObj", function(assert) {
    document.getElementById("variable").value = "unemployment.mean";
    document.getElementById("dimension").value = "educ";
    document.getElementById("groupSizeCheck").checked = true;
    document.getElementById("colorblindModeCheck").checked = false;
    document.getElementById("zoomingAxisCheck").checked = true;
    document.getElementById("metricsCheck").checked = false;
    document.getElementById("requireMinCheck").checked = true;

    const objBefore = getDeepLinkObj();
    assert.deepEqual(objBefore["config"], "1010");
    assert.deepEqual(objBefore["variable"], "unemployment.mean");
    assert.deepEqual(objBefore["dimension"], "educ");

    document.getElementById("groupSizeCheck").checked = true;
    document.getElementById("colorblindModeCheck").checked = true;
    document.getElementById("zoomingAxisCheck").checked = true;
    document.getElementById("metricsCheck").checked = true;
    document.getElementById("requireMinCheck").checked = true;

    const objAfter = getDeepLinkObj();
    assert.deepEqual(objAfter["config"], "1111");
  });

  QUnit.test("applyDeepLinkObj", function(assert) {
    document.getElementById("variable").value = "unemployment.mean";
    document.getElementById("dimension").value = "educ";

    const objBefore = getDeepLinkObj();
    objBefore["variable"] = "income.mean";
    applyDeepLinkObj(objBefore);

    assert.deepEqual(
      document.getElementById("variable").value,
      "income.mean"
    );
  });

  QUnit.test("getDeepLink", function(assert) {
    document.getElementById("variable").value = "income.mean";
    document.getElementById("dimension").value = "educ";

    const urlBefore = getDeepLinkUrl();
    assert.ok(urlBefore.indexOf("income") != -1);
    assert.ok(urlBefore.indexOf("unemployment") == -1);

    document.getElementById("variable").value = "unemployment.mean";
    document.getElementById("dimension").value = "educ";

    const urlAfter = getDeepLinkUrl();
    assert.ok(urlAfter.indexOf("income") == -1);
    assert.ok(urlAfter.indexOf("unemployment") != -1);
  });

  QUnit.test("applyDeepLinkUrl", function(assert) {
    document.getElementById("variable").value = "income.mean";
    document.getElementById("dimension").value = "educ";

    const urlBefore = getDeepLinkUrl();
    const newUrl = urlBefore.replaceAll("income.mean", "unemployment.mean");
    applyDeepLinkUrl(newUrl);

    assert.deepEqual(
      document.getElementById("variable").value,
      "unemployment.mean"
    );
  });

});
