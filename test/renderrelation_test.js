const {test} = Qunit;

const RenderRelation = require('../src/renderrelation.js');

Qunit.module('RenderRelation', {
// TODO: あとで
});

// TODO: 以下、RelationAnnotationから退避させただけなので要修正
test('RelationAnnotation.putArrowMarker() should append a <defs> tag that includes arrowHead to <svg id="htmlanno-svg-screen">', (assert) => {
  const arrowHead = document.createElement('marker');
  arrowHead.id = 'head_1';
  const id = 'arrow_1';

  assert.equal($('#htmlanno-svg-screen defs').length, 0);

  const result = RelationAnnotation.putArrowMarker(id, arrowHead);

  assert.ok(typeof(result), 'Promise');
  const defs = $('#htmlanno-svg-screen defs');
  assert.equal(defs.length, 1);
  assert.equal(defs[0].id, id);
  assert.equal(defs.find('marker').length, 1);
  assert.equal(defs.find('marker#' + arrowHead.id).length, 1);
});

test('RelationAnnotation.removeArrowMarker() should remove a <defs> that has id with specified value from <svg id="htmlanno-svg-screen">', (assert) => {
  const arrowHead1 = document.createElement('marker');
  arrowHead1.id = 'head_1';
  const id1 = 'arrow_1';
  const arrowHead2 = document.createElement('marker');
  arrowHead2.id = 'head_2';
  const id2 = 'arrow_2';
  RelationAnnotation.putArrowMarker(id1, arrowHead1);
  RelationAnnotation.putArrowMarker(id2, arrowHead2);

  assert.equal($('#htmlanno-svg-screen defs').length, 2);

  const success = RelationAnnotation.removeArrowMarker(id1);

  const done1 = assert.async();
  success.then((resolve) => {
    assert.ok(resolve);
    done1();
  });

  const defs = $('#htmlanno-svg-screen defs');
  assert.equal(defs.length, 1);
  assert.equal(defs[0].id, id2);
  assert.equal(defs.find('marker').length, 1);
  assert.equal(defs.find('marker#' + arrowHead2.id).length, 1);

  const notfound = RelationAnnotation.removeArrowMarker(id1);

  const done2 = assert.async();
  notfound.then((resolve) => {
    assert.notOk(resolve);
    done2();
  });
});

