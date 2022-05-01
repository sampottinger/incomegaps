QUnit.module('incomeGaps', function() {

  QUnit.test('test qunit', function(assert) {
    assert.ok(true);
  });
  
  QUnit.test('test qunit async', function(assert) {
    const done = assert.async();
  
    setTimeout(() => {
      assert.ok(true);
      done();
    }, 1);
  });
  
  QUnit.test('loadSourceDataRaw', function(assert) {
    const done = assert.async();
  
    loadSourceDataRaw().then((dataset) => {
      assert.ok(dataset !== null);
      assert.ok(dataset !== undefined);
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
    });
  });
  
  QUnit.test('rollupQuery', function(assert) {
    const done = assert.async();
    loadSourceData().then((dataset) => {
      const grouped = dataset._rollupQuery("educ");
      assert.ok(grouped.has("Office and administrative support occupations"));
      done();
    }).catch((err) => {
      assert.equal(err, "");
      done();
    });
  });
  
});
