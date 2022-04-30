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
  
});
