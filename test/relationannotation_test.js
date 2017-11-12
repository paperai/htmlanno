const {test} = QUnit;

const EventManager = require('../src/eventmanager.js');
window.globalEvent = new EventManager();

const Annotation = require('../src/annotation.js');
const AnnotationContainer = require('../src/annotationcontainer.js');
const RelationAnnotation = require('../src/relationannotation.js');

class HighlightStub extends Annotation {
  constructor(referenceId) {
    super(referenceId);
  }
}

class CircleStub {
  constructor(id, highlight) {
    this.id = id;
    this.highlight = highlight;
    this._position = {
      left: 200,
      top: 100 
    };
  }

  positionCenter() {
    return this._position;
  }
}

QUnit.module('RelationAnnotation', {
  before: () => {
    this.instance = undefined;
    this.onewayDirection = 'one-way';
  },
  beforeEach: () => {
    window.annotationContainer = new AnnotationContainer();

    this.dummyStartingHighlight = new HighlightStub();
    annotationContainer.add(this.dummyStartingHighlight);
    this.dummyStartingCircle = new CircleStub(this.dummyStartingHighlight.uuid, this.dummyStartingHighlight);

    this.dummyEndingHighlight = new HighlightStub();
    annotationContainer.add(this.dummyEndingHighlight);
    this.dummyEndingCircle = new CircleStub(this.dummyEndingHighlight.uuid, this.dummyEndingHighlight);

    this.instance = new RelationAnnotation(
      this.dummyStartingCircle,
      this.dummyEndingCircle,
      this.onewayDirection
    );
    annotationContainer.add(this.instance);
  },
  afterEach: () => {
    this.instance.remove();
  }
});

test('instance should have #uuid, #startingCircle, #endignCircle, #_direction and #arrow', (assert) => {
  assert.equal(this.instance.uuid, '3'); // beforeEach()においてHighlightを2つ作っているので3始まり

  assert.ok(this.instance.startingCircle == this.dummyStartingCircle);
  assert.ok(this.instance.endingCircle == this.dummyEndingCircle);

  assert.equal(this.instance.arrow.constructor.name, 'RenderRelation');
  assert.equal(this.instance.arrow.id, this.instance.uuid);
  assert.equal(this.instance.arrow.fromX, this.dummyStartingCircle.positionCenter().left);
  assert.equal(this.instance.arrow.fromY, this.dummyStartingCircle.positionCenter().top);
  assert.equal($('#htmlanno-svg-screen > #arrow-3').length, 1);
  // TODO: instance.arrow はdirectionによってjObjectの生成を変更するが、手間がかかるので後回しとする
  // TODO: 各種イベントハンドラのセット、イベントの送出についてテスト
  // TODO: テストしづらいし妙に複雑な構造なので整理を検討。初期から手を入れていない箇所
});

// TODO: 後回し
QUnit.skip('positionCenter()', (assert) => {
});

// TODO: 後回し
QUnit.skip('reposition()', (assert) => {
});

// TODO: 後回し
QUnit.skip('select()', (assert) => {
});

// TODO: 後回し
QUnit.skip('blur()', (assert) => {
});

test('remove() should remove arrow from GUI, and emit "annotationDeleted" event', (assert) => {
  let annotationDeletedHandler = (event) => {
    assert.step('annotationDeleted: ' + event.detail.getId());
    assert.ok(event.detail === this.instance);
  };
  addEventListener('annotationDeleted', annotationDeletedHandler);

  // Before
  assert.equal($('#htmlanno-svg-screen > #arrow-3').length, 1);
  this.instance.remove();
  // After
  assert.equal($('#htmlanno-svg-screen > #arrow-3').length, 0);

  assert.verifySteps(['annotationDeleted: 3']);
  removeEventListener('annotationDeleted', annotationDeletedHandler);
});

test('remove() should unselect itself when it is selected before remove and emit', (assert) => {
  let annotationDeletedHandler = (event) => {
    assert.step('annotationDeleted: ' + event.detail.getId());
    assert.ok(event.detail === this.instance);
  };
  addEventListener('annotationDeleted', annotationDeletedHandler);
  let annotationDeselectedHandler = (event) => {
    assert.step('annotationDeselected: ' + event.detail.getId());
    assert.ok(event.detail === this.instance);
  };
  addEventListener('annotationDeselected', annotationDeselectedHandler);

  this.instance.select();
  // Before
  assert.equal($('#htmlanno-svg-screen > #arrow-3').length, 1);
  this.instance.remove();
  // After
  assert.equal($('#htmlanno-svg-screen > #arrow-3').length, 0);

  assert.verifySteps([
    'annotationDeselected: 3',
    'annotationDeleted: 3'
  ]);
  removeEventListener('annotationDeselected', annotationDeselectedHandler);
  removeEventListener('annotationDeleted', annotationDeletedHandler);
});

// TODO: 後回し
QUnit.skip('handleHoverIn', (assert) => {
});

// TODO: 後回し
QUnit.skip('handleHoverOut', (assert) => {
});

test('saveToml() should return TOML indicating instance that was persisted (oneway)', (assert) => {
  const oneway = new RelationAnnotation(
      this.dummyStartingCircle, this.dummyEndingCircle, 'one-way'
  );
  oneway.setContent('oneway relation');
  annotationContainer.add(oneway);

  const startIdForToml = (new Date()).getTime().toString();
  const endIdForToml = ((new Date()).getTime() + 1).toString(); // startと重複しないように +1
  this.dummyStartingHighlight._id = startIdForToml;
  this.dummyEndingHighlight._id = endIdForToml;

  let onewayToml = oneway.saveToml();
  assert.ok(onewayToml.match(/\n?type = "relation"\n/m));
  assert.ok(onewayToml.match(/\n?dir = "one-way"\n/m));
  let onewayIdsMatched = onewayToml.match(/\n?ids = \["([^"]+)", "([^"]+)"]\n/m);
  assert.ok(onewayIdsMatched);
  assert.equal(onewayIdsMatched[1], startIdForToml);
  assert.equal(onewayIdsMatched[2], endIdForToml);
  assert.ok(onewayToml.match(/\n?label = "oneway relation"/m));
});

test('saveToml() should return TOML indicating instance that was persisted (twoway)', (assert) => {
  const twoway = new RelationAnnotation(
      this.dummyStartingCircle, this.dummyEndingCircle, 'two-way'
  );
  twoway.setContent('twoway relation');
  annotationContainer.add(twoway);

  const startIdForToml = (new Date()).getTime().toString();
  const endIdForToml = ((new Date()).getTime() + 1).toString(); // startと重複しないように +1
  this.dummyStartingHighlight._id = startIdForToml;
  this.dummyEndingHighlight._id = endIdForToml;

  let twowayToml = twoway.saveToml();
  assert.ok(twowayToml.match(/\n?type = "relation"\n/m));
  assert.ok(twowayToml.match(/\n?dir = "two-way"\n/m));
  let twowayIdsMatched = twowayToml.match(/\n?ids = \["([^"]+)", "([^"]+)"]\n/m);
  assert.ok(twowayIdsMatched);
  assert.equal(twowayIdsMatched[1], startIdForToml);
  assert.equal(twowayIdsMatched[2], endIdForToml);
  assert.ok(twowayToml.match(/\n?label = "twoway relation"/m));
});

test('saveToml() should return TOML indicating instance that was persisted (link)', (assert) => {
  const link   = new RelationAnnotation(
      this.dummyStartingCircle, this.dummyEndingCircle, 'link'
  );
  link.setContent('link relation');
  annotationContainer.add(link);

  const startIdForToml = (new Date()).getTime().toString();
  const endIdForToml = ((new Date()).getTime() + 1).toString(); // startと重複しないように +1
  this.dummyStartingHighlight._id = startIdForToml;
  this.dummyEndingHighlight._id = endIdForToml;

  let linkToml = link.saveToml();
  assert.ok(linkToml.match(/\n?type = "relation"\n/m));
  assert.ok(linkToml.match(/\n?dir = "link"\n/m));
  let linkIdsMatched = linkToml.match(/\n?ids = \["([^"]+)", "([^"]+)"]\n/m);
  assert.ok(linkIdsMatched);
  assert.equal(linkIdsMatched[1], startIdForToml);
  assert.equal(linkIdsMatched[2], endIdForToml);
  assert.ok(linkToml.match(/\n?label = "link relation"/m));
});

// TODO: 後回し
QUnit.skip('isMydata()', (assert) => {
});

// TODO: 後回し
QUnit.skip('setContent()', (assert) => {
});

// TODO: 後回し
QUnit.skip('content()', (assert) => {
});

test('getClassName() should return "arrow-" + #uuid', (assert) => {
  assert.equal(this.instance.getClassName(), 'arrow-' + this.instance.uuid);

  let withReferenceId = new RelationAnnotation(
      this.dummyStartingCircle, this.dummyEndingCircle, 'one-way', 'referenceId'
  );
  annotationContainer.add(withReferenceId);
  assert.equal(withReferenceId.getClassName(), 'arrow-' +withReferenceId.uuid + '-referenceId');
});

// TODO: 後回し
QUnit.skip('setColor()', (assert) => {
});

// TODO: 後回し
QUnit.skip('removeColor()', (assert) => {
});

test('type(getter) should return "relation"', (assert) => {
  assert.equal(this.instance.type, 'relation');
});

test('direction(getter) should return the direction specified by constructor argument', (assert) => {
  let oneway = new RelationAnnotation(
      this.dummyStartingCircle, this.dummyEndingCircle, 'one-way'
  );
  annotationContainer.add(oneway);
  let twoway = new RelationAnnotation(
      this.dummyStartingCircle, this.dummyEndingCircle, 'two-way'
  );
  annotationContainer.add(twoway);
  let link   = new RelationAnnotation(
      this.dummyStartingCircle, this.dummyEndingCircle, 'link'
  );
  annotationContainer.add(link);

  assert.equal(oneway.direction, 'one-way');
  assert.equal(twoway.direction, 'two-way');
  assert.equal(link.direction, 'link');
});

// TODO: 後回し
QUnit.skip('scrollTop()', (assert) => {
});
