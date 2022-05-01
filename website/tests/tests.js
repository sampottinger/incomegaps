QUnit.module('incomeGaps', function() {

  QUnit.test('loadSourceDataRaw', function(assert) {
    const done = assert.async();
  
    loadSourceDataRaw().then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      done();
    }).catch((err) => {
      assert.equal(err, "");
      done();
    });
  });
  
  QUnit.test('loadSourceDataNoCache', function(assert) {
    const done = assert.async();
  
    loadSourceDataNoCache().then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      assert.ok(dataset._rawResults.length > 0);
      
      done();
    }).catch((err) => {
      assert.equal(err, "");
      done();
    });
  });
  
  QUnit.test('loadSourceData', function(assert) {
    const done = assert.async();
    loadSourceData().then(loadSourceData).then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
      assert.ok(dataset._rawResults.length > 0);
      done();
    }).catch((err) => {
      assert.equal(err, "");
      done();
    });
  });
  
  function testDataset(done, callback) {
    loadSourceData().then((dataset) => {
      callback(dataset);
      done();
    }).catch((err) => {
      assert.equal(err, "");
      done();
    });
  }
  
  QUnit.test('dataset rollupQuery', function(assert) {
    const done = assert.async();
    testDataset(done, (dataset) => {
      const grouped = dataset._rollupQuery("educ");
      assert.ok(grouped.has("Office and administrative support occupations"));
    });
  });
  
  QUnit.test('dataset query', function(assert) {
    const done = assert.async();
    testDataset(done, (dataset) => {
      const grouped = dataset.query("educ");
      assert.equal(grouped.length, 22);
    });
  });
  
  QUnit.test('dataset gini', function(assert) {
    const done = assert.async();
    testDataset(done, (dataset) => {
      const gini = dataset._getGini([
        {"wageTotal": 10 * 10, "countTotal": 10},
        {"wageTotal": 20 * 15, "countTotal": 15},
        {"wageTotal": 30 * 20, "countTotal": 20}
      ]);
      assert.ok(Math.abs(gini - 0.1888) < 0.0001);
    });
  });
  
  function testPresenter(done, callback) {
    loadSourceData().then((dataset) => {
      const presenter = new VizPresenter(60, -0.5, 0.5, 1);
      const queryResults = dataset.query("educ");
      
      try {
        callback(presenter, queryResults);
      } catch (e) {
        assert.equal(e, "");
      }
      
      done();
    }).catch((err) => {
      assert.equal(err, "");
      done();
    });
  }
  
  QUnit.test('presenter createSelection', function(assert) {
    const done = assert.async();
    testPresenter(done, (presenter) => {
      assert.ok(presenter !== undefined);
      assert.ok(presenter !== null);
    });
  });
  
  QUnit.test('presenter getWidth', function(assert) {
    const done = assert.async();
    testPresenter(done, (presenter) => {
      assert.ok(presenter._getWidth("cell-occupation") > 0);
    });
  });
  
  QUnit.test('presenter createSelection', function(assert) {
    const done = assert.async();
    testPresenter(done, (presenter, queryResults) => {
      assert.ok(presenter._createSelection(queryResults) !== null);
    });
  });
  
  QUnit.test('presenter createElements', function(assert) {
    const done = assert.async();
    testPresenter(done, (presenter, queryResults) => {
      const selection = presenter._createSelection(queryResults);
      selection.exit().remove();
      presenter._createElements(selection);
      assert.equal(
        document.getElementsByClassName("cell-occupation").length,
        queryResults.length + 1
      );
    });
  });
  
  QUnit.test('presenter repeatCreate', function(assert) {
    const done = assert.async();
    testPresenter(done, (presenter, queryResults) => {
      const selection = presenter._createSelection(queryResults);
      selection.exit().remove();
      presenter._createElements(selection);
      assert.equal(
        document.getElementsByClassName("cell-occupation").length,
        queryResults.length + 1
        );
    });
  });
  
});
