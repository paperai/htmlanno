const {test} = QUnit;

const Annotation = require('../src/annotation.js');
const AnnotationContainer = require('../src/annotationcontainer.js');

QUnit.module('AnnotationContainer', {
  before: () => {
    instance = undefined;
  },
  beforeEach: () => {
    instance = new AnnotationContainer();
  }
});

test('instance should have #set and #maxId', (assert) => {
  assert.equal(instance.set.size, 0);
  assert.equal(instance.maxId, 0);
});

test('isAnnotation() should return true when argument is Object and it has #equals(), and has #getId()', (assert) => {
  let theAnnotation = new Annotation();
  assert.ok(instance.isAnnotation(theAnnotation));

  let o = {
    equals: (v) => { return true; },
    getId: () => {return 0; }
  };
  assert.ok(instance.isAnnotation(o));
});

// TODO: 後回し
QUnit.skip('isAnnotation() should return false when argument isnot Object or it doesnot have #equals() or #getId()', (assert) => {
});

test('#nextId should return #maxId + 1', (assert) => {
  assert.equal(instance.maxId, 0);
  assert.equal(instance.nextId(), 1);
  assert.equal(instance.maxId, 1);
  assert.equal(instance.nextId(), 2);
  assert.equal(instance.maxId, 2);
});

test('add() should return true, store argument into #set and update #maxId with larger of itself or argument#getId (case of maxId)', (assert) => {
  let theAnnotation = new Annotation(instance.nextId());
  assert.ok(instance.isAnnotation(theAnnotation));

  let old_maxId = instance.maxId;
  assert.ok(instance.add(theAnnotation));
  assert.equal(instance.maxId, old_maxId);
  assert.equal(instance.set.size, 1);
  instance.set.forEach((elm) => {
    // #setの要素は唯一 theAnnotation の筈
    assert.equal(elm, theAnnotation);
  });
});


test('add() should return true, store argument into #set and update #maxId with larger of itself or argument#getId (case of getId)', (assert) => {
  let theAnnotation = new Annotation(100);
  assert.ok(instance.isAnnotation(theAnnotation));
  assert.ok(instance.maxId < theAnnotation.getId());

  let old_maxId = instance.maxId;
  assert.ok(instance.add(theAnnotation));
  assert.equal(instance.maxId, 100);
  assert.equal(instance.set.size, 1);
  instance.set.forEach((elm) => {
    // #setの要素は唯一 theAnnotation の筈
    assert.equal(elm, theAnnotation);
  });
});

test('add() should return false when call without Annotation object', (assert) => {
  let o = {
    getId: () => {return 100; }
  };
  let old_maxId = instance.maxId;
  assert.notOk(instance.add(o));
  assert.equal(instance.maxId, old_maxId);
  assert.equal(instance.set.size, 0);
});

test('findById() should return an annotation that it#getId() equals to argument', (assert) => {
  let targetId = new Date().getTime().toString();
  let targetObject = new Annotation(targetId);

  assert.ok(instance.add(new Annotation()));
  assert.ok(instance.add(targetObject));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1')));
  assert.ok(instance.add(new Annotation(targetId, "referenceId")));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1', targetId)));

  assert.equal(instance.set.size, 5);
  assert.ok(instance.findById(targetId) === targetObject);
});

test('remove() should return true when instance has the annotation that is specfied by argument (in case of argument is ID)', (assert) => {
  let targetId = new Date().getTime().toString();
  let targetObject = new Annotation(targetId);

  assert.ok(instance.add(new Annotation()));
  assert.ok(instance.add(targetObject));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1')));
  assert.ok(instance.add(new Annotation(targetId, "referenceId")));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1', targetId)));
  assert.equal(instance.set.size, 5);

  assert.ok(instance.remove(targetId));
  assert.equal(instance.set.size, 4);
  instance.forEach((elm) => {
    assert.notOk(instance.findById(targetId) === targetObject);
  });
});

test('remove() should return true when instance has the annotation that is specfied by argument (in case of argument is Annotation object)', (assert) => {
  let targetId = new Date().getTime().toString();
  let targetObject = new Annotation(targetId);

  assert.ok(instance.add(new Annotation()));
  assert.ok(instance.add(targetObject));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1')));
  assert.ok(instance.add(new Annotation(targetId, "referenceId")));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1', targetId)));
  assert.equal(instance.set.size, 5);

  assert.ok(instance.remove(targetObject));
  assert.equal(instance.set.size, 4);
  instance.forEach((elm) => {
    assert.notOk(instance.findById(targetId) === targetObject);
  });
});

test('remove() should return false when instance doesnot have the annotation that is specified by argument', (assert) => {
  let targetId = new Date().getTime().toString();
  let targetObject = new Annotation(targetId);
  let otherObject = new Annotation(targetId, "referenceId");

  assert.ok(instance.add(new Annotation()));
  assert.ok(instance.add(targetObject));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1')));
  assert.ok(instance.add(new Annotation(targetId, "referenceId2")));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1', targetId)));
  assert.equal(instance.set.size, 5);

  assert.notOk(instance.remove(otherObject));
  assert.equal(instance.set.size, 5);
  instance.forEach((elm) => {
    assert.ok(instance.findById(targetId) === targetObject);
  });
});

// #setのforEach()を呼び出しているだけなので省略
QUnit.skip('forEach()', (assert) => {
});

// pdfannoとの互換性のため用意したダミーなので省略
QUnit.skip('destroy()', (assert) => {
});

// TODO: 後回し
QUnit.skip('filter()', (assert) => {
});

// TODO: 後回し
QUnit.skip('getAllAnnotations()', (assert) => {
});

// TODO: 後回し
QUnit.skip('getSelectedAnnotation()', (assert) => {
});

// pdfannoとの互換性のため用意したダミーなので省略
QUnit.skip('enableAll()', (assert) => {
});

// pdfannoとの互換性のため用意したダミーなので省略
QUnit.skip('disableAll()', (assert) => {
});

