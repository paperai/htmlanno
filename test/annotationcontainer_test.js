const {test} = QUnit;

const Annotation = require('../src/annotation.js');
const AnnotationContainer = require('../src/annotationcontainer.js');

QUnit.module('AnnotationContainer', {
  before: () => {
    this.instance = undefined;
    this.instanceWithSomeElements = undefined;
    this.annotationSet = undefined;
  },
  beforeEach: () => {
    this.instance = new AnnotationContainer();
    window.annotationContainer = this.instance;

    this.annotationSet = {
      primary1: new Annotation(),
      primary2: new Annotation(),
      reference1: new Annotation(new Date().getTime().toString() + '1'),
      reference2: new Annotation(new Date().getTime().toString() + '2'),
      reference3: new Annotation(new Date().getTime().toString() + '3')
    }
    this.instanceWithSomeElements = new AnnotationContainer();
    this.instanceWithSomeElements.add(this.annotationSet.primary1);
    this.instanceWithSomeElements.add(this.annotationSet.primary2);
    this.instanceWithSomeElements.add(this.annotationSet.reference1);
    this.instanceWithSomeElements.add(this.annotationSet.reference2);
    this.instanceWithSomeElements.add(this.annotationSet.reference3);
  }
});

test('instance should have #set', (assert) => {
  assert.equal(this.instance.set.size, 0);
});

test('isAnnotation() should return true when argument is Object and it has #equals(), and has #getId()', (assert) => {
  const theAnnotation = new Annotation();
  assert.ok(this.instance.isAnnotation(theAnnotation));

  const o = {
    equals: (v) => { return true; },
    getId: () => {return 0; }
  };
  assert.ok(this.instance.isAnnotation(o));
});

test('isAnnotation() should return false when argument isnot Object or it doesnot have #equals() or #getId()', (assert) => {
  const theAnnotation = new Annotation();
  theAnnotation.getId = undefined;
  assert.notOk(this.instance.isAnnotation(theAnnotation));
});

test('add() should return true, store argument into #set', (assert) => {
  const theAnnotation = new Annotation()
  assert.ok(this.instance.isAnnotation(theAnnotation));

  assert.ok(this.instance.add(theAnnotation));
  assert.equal(this.instance.set.size, 1);
  this.instance.set.forEach((elm) => {
    // #setの要素は唯一 theAnnotation の筈
    assert.equal(elm, theAnnotation);
  });
});

test('add() should return false when call without Annotation object', (assert) => {
  const o = {
    getId: () => {return 100; }
  };
  assert.notOk(this.instance.add(o));
  assert.equal(this.instance.set.size, 0);
});

test('findById() should return an annotation that it#getId() equals to argument', (assert) => {
  assert.equal(this.instanceWithSomeElements.set.size, 5);
  assert.ok(this.instanceWithSomeElements.findById(this.annotationSet.primary1.getId()) === this.annotationSet.primary1);
});

test('remove() should return true when instance has the annotation that is specfied by argument (in case of argument is ID)', (assert) => {
  this.annotationSet.primary1.remove = () => {
    assert.step('remove is called');
  };
  assert.equal(this.instanceWithSomeElements.set.size, 5);

  assert.ok(this.instanceWithSomeElements.remove(this.annotationSet.primary1.getId()));
  assert.equal(this.instanceWithSomeElements.set.size, 4);
  this.instanceWithSomeElements.forEach((elm) => {
    assert.notOk(elm === this.annotationSet.primary1);
  });
  assert.verifySteps(['remove is called']);
});

test('remove() should return true when instance has the annotation that is specfied by argument (in case of argument is Annotation object)', (assert) => {
  this.annotationSet.reference1.remove = () => {
    assert.step('remove is called');
  };
  assert.equal(this.instanceWithSomeElements.set.size, 5);

  assert.ok(this.instanceWithSomeElements.remove(this.annotationSet.reference1));
  assert.equal(this.instanceWithSomeElements.set.size, 4);
  this.instanceWithSomeElements.forEach((elm) => {
    assert.notOk(elm === this.annotationSet.reference1);
  });
  assert.verifySteps(['remove is called']);
});

test('remove() should return false when instance doesnot have the annotation that is specified by argument', (assert) => {
  this.annotationSet.primary1.remove = () => {
    assert.step('remove is called');
  };
  assert.equal(this.instanceWithSomeElements.set.size, 5);

  const otherObject = new Annotation(this.annotationSet.primary1.uuid);
  otherObject.remove = () => {
    assert.step('remove in otherObject is called.');
  };
  assert.notOk(this.instanceWithSomeElements.remove(otherObject));
  assert.equal(this.instanceWithSomeElements.set.size, 5);
  assert.notEqual(this.instanceWithSomeElements.findById(this.annotationSet.primary1.getId()), null);
  assert.verifySteps([]);
});

test('removeAll() should call Annotation#remove() for all annotation in set, and remove it from set.', (assert) => {
  [
    this.annotationSet.primary1,
    this.annotationSet.primary2,
    this.annotationSet.reference1,
    this.annotationSet.reference2,
    this.annotationSet.reference3
  ].forEach((elm) => {
    elm.remove = () => {
      assert.step('remove is called');
    };
  });
  assert.equal(this.instanceWithSomeElements.set.size, 5);
  this.instanceWithSomeElements.removeAll();
  assert.equal(this.instanceWithSomeElements.set.size, 0);
  assert.verifySteps(['remove is called', 'remove is called','remove is called','remove is called','remove is called']);
});

test('removeAll() should not any raise error when instance is empty.', (assert) => {
  assert.equal(this.instance.set.size, 0);
  this.instance.removeAll();
  assert.equal(this.instance.set.size, 0);
});

test('removeAll() should call Annotation#remove(true) (batch removing mode)', (assert) => {
  [
    this.annotationSet.primary1,
    this.annotationSet.primary2,
    this.annotationSet.reference1,
    this.annotationSet.reference2,
    this.annotationSet.reference3
  ].forEach((elm) => {
    elm.remove = (batchMode) => {
      assert.ok(batchMode);
      assert.step('remove is called');
    };
  });
  assert.equal(this.instanceWithSomeElements.set.size, 5);
  this.instanceWithSomeElements.removeAll();
  assert.equal(this.instanceWithSomeElements.set.size, 0);
  assert.verifySteps(['remove is called', 'remove is called','remove is called','remove is called','remove is called']);
});

test('removePrimaryAll() should remove only the primary annotation that is no referenceId.', (assert) => {
  [
    this.annotationSet.primary1,
    this.annotationSet.primary2,
    this.annotationSet.reference1,
    this.annotationSet.reference2,
    this.annotationSet.reference3
  ].forEach((elm) => {
    elm.remove = () => {
      assert.step('remove is called. isPrimary = ' + elm.isPrimary());
    };
  });
  assert.equal(this.instanceWithSomeElements.set.size, 5);
  assert.equal(this.instanceWithSomeElements.getPrimaryAnnotations().length, 2);
  this.instanceWithSomeElements.removePrimaryAll();
  assert.equal(this.instanceWithSomeElements.set.size, 3);
  assert.notEqual(this.instanceWithSomeElements.findById(this.annotationSet.reference1.getId()), null);
  assert.notEqual(this.instanceWithSomeElements.findById(this.annotationSet.reference2.getId()), null);
  assert.notEqual(this.instanceWithSomeElements.findById(this.annotationSet.reference3.getId()), null);
  assert.verifySteps(['remove is called. isPrimary = true', 'remove is called. isPrimary = true']);
});

test('removePrimaryAll() should not any raise error when instance does not have the primary annotation.', (assert) => {
  const reference1 = new Annotation(new Date().getTime().toString() + '1');
  reference1.remove = () => {
    assert.step('remove is called');
  };
  const reference2 = new Annotation(new Date().getTime().toString() + '2');
  reference2.remove = () => {
    assert.step('remove is called');
  };
  
  assert.ok(this.instance.add(reference1));
  assert.ok(this.instance.add(reference2));
  
  assert.equal(this.instance.set.size, 2);
  this.instance.removePrimaryAll();
  assert.equal(this.instance.set.size, 2);
  assert.verifySteps([]);
});

test('removePrimaryAll() should call Annotation#remove(true) (batch removing mode)', (assert) => {
  [
    this.annotationSet.primary1,
    this.annotationSet.primary2,
    this.annotationSet.reference1,
    this.annotationSet.reference2,
    this.annotationSet.reference3
  ].forEach((elm) => {
    elm.remove = (batchMode) => {
      assert.ok(batchMode);
      assert.step('remove is called. isPrimary = ' + elm.isPrimary());
    };
  });
  assert.equal(this.instanceWithSomeElements.set.size, 5);
  assert.equal(this.instanceWithSomeElements.getPrimaryAnnotations().length, 2);
  this.instanceWithSomeElements.removePrimaryAll();
  assert.equal(this.instanceWithSomeElements.set.size, 3);
  assert.notEqual(this.instanceWithSomeElements.findById(this.annotationSet.reference1.getId()), null);
  assert.notEqual(this.instanceWithSomeElements.findById(this.annotationSet.reference2.getId()), null);
  assert.notEqual(this.instanceWithSomeElements.findById(this.annotationSet.reference3.getId()), null);
  assert.verifySteps(['remove is called. isPrimary = true', 'remove is called. isPrimary = true']);
});

test('removeReference() should remove only the reference annotations that is specified by referenceId.', (assert) => {
  const referenceId = new Date().getTime().toString() + '1';
  const reference1 = new Annotation(referenceId);
  const reference2 = new Annotation(referenceId);
  [
    this.annotationSet.primary1,
    this.annotationSet.primary2,
    reference1,
    reference2,
    this.annotationSet.reference3
  ].forEach((elm) => {
    elm.remove = () => {
      assert.step('remove is called. isPrimary = ' + elm.isPrimary());
    };
  });
  assert.ok(this.instance.add(this.annotationSet.primary1));
  assert.ok(this.instance.add(this.annotationSet.primary2));
  assert.ok(this.instance.add(reference1));
  assert.ok(this.instance.add(reference2));
  assert.ok(this.instance.add(this.annotationSet.reference3));

  assert.equal(this.instance.set.size, 5);
  assert.equal(this.instance.getPrimaryAnnotations().length, 2);
  this.instance.removeReference(referenceId);
  assert.equal(this.instance.set.size, 3);
  assert.notEqual(this.instance.findById(this.annotationSet.primary1.getId()), null);
  assert.notEqual(this.instance.findById(this.annotationSet.primary2.getId()), null);
  assert.notEqual(this.instance.findById(this.annotationSet.reference3.getId()), null);
  assert.verifySteps(['remove is called. isPrimary = false', 'remove is called. isPrimary = false']);
});

test('removeReference() should not any raise error when instance does not have the reference annotation.', (assert) => {
  const primary1 = new Annotation();
  primary1.remove = () => {
    assert.step('remove is called');
  };
  const primary2 = new Annotation();
  primary2.remove = () => {
    assert.step('remove is called');
  };
  
  assert.ok(this.instance.add(primary1));
  assert.ok(this.instance.add(primary2));
  
  assert.equal(this.instance.set.size, 2);
  this.instance.removeReference('referenceId');
  assert.equal(this.instance.set.size, 2);
  assert.verifySteps([]);
});  

test('removeReference() should call Annotation#remove(true) (batch removing mode)', (assert) => {
  const referenceId = new Date().getTime().toString() + '1';
  const reference1 = new Annotation(referenceId);
  const reference2 = new Annotation(referenceId);
  [
    this.annotationSet.primary1,
    this.annotationSet.primary2,
    reference1,
    reference2,
    this.annotationSet.reference3
  ].forEach((elm) => {
    elm.remove = (batchMode) => {
      assert.ok(batchMode);
      assert.step('remove is called. isPrimary = ' + elm.isPrimary());
    };
  });
  assert.ok(this.instance.add(this.annotationSet.primary1));
  assert.ok(this.instance.add(this.annotationSet.primary2));
  assert.ok(this.instance.add(reference1));
  assert.ok(this.instance.add(reference2));
  assert.ok(this.instance.add(this.annotationSet.reference3));

  assert.equal(this.instance.set.size, 5);
  assert.equal(this.instance.getPrimaryAnnotations().length, 2);
  this.instance.removeReference(referenceId);
  assert.equal(this.instance.set.size, 3);
  assert.notEqual(this.instance.findById(this.annotationSet.primary1.getId()), null);
  assert.notEqual(this.instance.findById(this.annotationSet.primary2.getId()), null);
  assert.notEqual(this.instance.findById(this.annotationSet.reference3.getId()), null);
  assert.verifySteps(['remove is called. isPrimary = false', 'remove is called. isPrimary = false']);
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
  const result = this.instanceWithSomeElements.getPrimaryAnnotations();
  assert.equal(result.length, 2);
  assert.ok(result.includes(this.annotationSet.primary1));
  assert.ok(result.includes(this.annotationSet.primary2));
  result.forEach((elm) => {
    assert.ok(elm.isPrimary());
  });
});

test('getPrimaryAnnotations() should return the empty array when instance is not have primary annotation.', (assert) => {
  const reference1 = new Annotation('ref1');
  const reference2 = new Annotation('ref1');
  const reference3 = new Annotation('ref2');
  const reference4 = new Annotation('ref2');
  this.instance.add(reference1);
  this.instance.add(reference2);
  this.instance.add(reference3);
  this.instance.add(reference4);

  const result = this.instance.getPrimaryAnnotations();
  assert.deepEqual(result, []);
});

// pdfannoとの互換性のため用意したダミーなので省略
QUnit.skip('enableAll()', (assert) => {
});

// pdfannoとの互換性のため用意したダミーなので省略
QUnit.skip('disableAll()', (assert) => {
});
