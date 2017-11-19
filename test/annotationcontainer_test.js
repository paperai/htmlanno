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

test('getPrimaryAnnotations() should return the array that includes only primary annotations', (assert) => {
  const primary1 = new Annotation();
  const reference1 = new Annotation('ref1');
  const primary2 = new Annotation();
  const reference2 = new Annotation('ref1');
  instance.add(primary1);
  instance.add(reference1);
  instance.add(primary2);
  instance.add(reference2);

  const result = instance.getPrimaryAnnotations();
  assert.equal(result.length, 2);
  assert.ok(result.includes(primary1));
  assert.ok(result.includes(primary2));
  result.forEach((elm) => {
    assert.ok(elm.isPrimary());
  });
});

test('getPrimaryAnnotations() should return the empty array when instance is not have primary annotation.', (assert) => {
  const reference1 = new Annotation('ref1');
  const reference2 = new Annotation('ref1');
  const reference3 = new Annotation('ref2');
  const reference4 = new Annotation('ref2');
  instance.add(reference1);
  instance.add(reference2);
  instance.add(reference3);
  instance.add(reference4);

  const result = instance.getPrimaryAnnotations();
  assert.deepEqual(result, []);
});

// pdfannoとの互換性のため用意したダミーなので省略
QUnit.skip('enableAll()', (assert) => {
});

// pdfannoとの互換性のため用意したダミーなので省略
QUnit.skip('disableAll()', (assert) => {
});
