const {test} = QUnit;

const Annotation = require('../src/annotation.js');
const AnnotationContainer = require('../src/annotationcontainer.js');

QUnit.module('AnnotationContainer', {
  before: () => {
    instance = undefined;
  },
  beforeEach: () => {
    instance = new AnnotationContainer();
    window.annotationContainer = instance;
  }
});

test('instance should have #set', (assert) => {
  assert.equal(instance.set.size, 0);
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

test('isAnnotation() should return false when argument isnot Object or it doesnot have #equals() or #getId()', (assert) => {
  let theAnnotation = new Annotation();
  theAnnotation.getId = undefined;
  assert.notOk(instance.isAnnotation(theAnnotation));
});

test('add() should return true, store argument into #set', (assert) => {
  let theAnnotation = new Annotation()
  assert.ok(instance.isAnnotation(theAnnotation));

  assert.ok(instance.add(theAnnotation));
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
  assert.notOk(instance.add(o));
  assert.equal(instance.set.size, 0);
});

test('findById() should return an annotation that it#getId() equals to argument', (assert) => {
  let targetObject = new Annotation();

  assert.ok(instance.add(new Annotation()));
  assert.ok(instance.add(targetObject));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1')));
  assert.ok(instance.add(new Annotation("referenceId")));
  assert.ok(instance.add(new Annotation(targetObject.uuid)));

  assert.equal(instance.set.size, 5);
  assert.ok(instance.findById(targetObject.getId()) === targetObject);
});

test('remove() should return true when instance has the annotation that is specfied by argument (in case of argument is ID)', (assert) => {
  let targetObject = new Annotation();

  assert.ok(instance.add(new Annotation()));
  assert.ok(instance.add(targetObject));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1')));
  assert.ok(instance.add(new Annotation("referenceId")));
  assert.ok(instance.add(new Annotation(targetObject.uuid)));
  assert.equal(instance.set.size, 5);

  assert.ok(instance.remove(targetObject.getId()));
  assert.equal(instance.set.size, 4);
  instance.forEach((elm) => {
    assert.notOk(instance.findById(targetObject.getId()) === targetObject);
  });
});

test('remove() should return true when instance has the annotation that is specfied by argument (in case of argument is Annotation object)', (assert) => {
  let targetObject = new Annotation();

  assert.ok(instance.add(new Annotation()));
  assert.ok(instance.add(targetObject));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1')));
  assert.ok(instance.add(new Annotation("referenceId")));
  assert.ok(instance.add(new Annotation(targetObject.uuid)));
  assert.equal(instance.set.size, 5);

  assert.ok(instance.remove(targetObject));
  assert.equal(instance.set.size, 4);
  instance.forEach((elm) => {
    assert.notOk(instance.findById(targetObject.getId()) === targetObject);
  });
});

test('remove() should return false when instance doesnot have the annotation that is specified by argument', (assert) => {
  let targetObject = new Annotation();

  assert.ok(instance.add(new Annotation()));
  assert.ok(instance.add(targetObject));
  assert.ok(instance.add(new Annotation(new Date().getTime().toString() + '1')));
  assert.ok(instance.add(new Annotation("referenceId")));
  assert.ok(instance.add(new Annotation(targetObject.uuid)));
  assert.equal(instance.set.size, 5);

  let otherObject = new Annotation(targetObject.uuid);
  assert.notOk(instance.remove(otherObject));
  assert.equal(instance.set.size, 5);
  instance.forEach((elm) => {
    assert.ok(instance.findById(targetObject.getId()) === targetObject);
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
