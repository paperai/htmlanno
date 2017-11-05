const {test} = QUnit;

const EventManager = require('../src/eventmanager.js');
window.globalEvent = new EventManager();

const Annotation = require('../src/annotation.js');
const AnnotationContainer = require('../src/annotationcontainer.js');
const RelationAnnotation = require('../src/relationannotation.js');

class HighlightStub extends Annotation {
  constructor(id, referenceId) {
    super(id, referenceId);
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

function createDummyId() {
  let value = new Date().getTime();
  // IDが重複しないよう1ms空ける
  while(value == new Date().getTime()) {
    ;
  }
  return value.toString();
}

QUnit.module('RelationAnnotation', {
  before: () => {
    instance = undefined;
    dummyId = createDummyId();
    dummyDirection = 'one-way';
  },
  beforeEach: () => {
    window.annotationContainer = new AnnotationContainer();
    dummyStartingHighlight = new HighlightStub(createDummyId());
    dummyStartingCircle = new CircleStub(dummyStartingHighlight.id, dummyStartingHighlight);
    dummyEndingHighlight = new HighlightStub(createDummyId());
    dummyEndingCircle = new CircleStub(dummyEndingHighlight.id, dummyEndingHighlight);
    instance = new RelationAnnotation(
      dummyId,
      dummyStartingCircle,
      dummyEndingCircle,
      dummyDirection
    );
  },
  afterEach: () => {
    instance.remove();
  }
});

test('instance should have #id, #startingCircle, #endignCircle, #_direction and #arrow', (assert) => {
  assert.equal(instance.id, dummyId);
  assert.ok(instance.startingCircle == dummyStartingCircle);
  assert.ok(instance.endingCircle == dummyEndingCircle);
  assert.equal(instance.arrow.constructor.name, 'RenderRelation');
  assert.equal(instance.arrow.id, dummyId);
  assert.equal(instance.arrow.fromX, dummyStartingCircle.positionCenter().left);
  assert.equal(instance.arrow.fromY, dummyStartingCircle.positionCenter().top);
  assert.equal($('#htmlanno-svg-screen > #arrow-' + dummyId).length, 1);
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
    assert.ok(event.detail === instance);
  };
  addEventListener('annotationDeleted', annotationDeletedHandler);

  // Before
  assert.equal($('#htmlanno-svg-screen > #arrow-' + dummyId).length, 1);
  instance.remove();
  // After
  assert.equal($('#htmlanno-svg-screen > #arrow-' + dummyId).length, 0);

  assert.verifySteps(['annotationDeleted: ' + dummyId]);
  removeEventListener('annotationDeleted', annotationDeletedHandler);
});

test('remove() should unselect itself when it is selected before remove and emit', (assert) => {
  let annotationDeletedHandler = (event) => {
    assert.step('annotationDeleted: ' + event.detail.getId());
    assert.ok(event.detail === instance);
  };
  addEventListener('annotationDeleted', annotationDeletedHandler);
  let annotationDeselectedHandler = (event) => {
    assert.step('annotationDeselected: ' + event.detail.getId());
    assert.ok(event.detail === instance);
  };
  addEventListener('annotationDeselected', annotationDeselectedHandler);

  instance.select();
  // Before
  assert.equal($('#htmlanno-svg-screen > #arrow-' + dummyId).length, 1);
  instance.remove();
  // After
  assert.equal($('#htmlanno-svg-screen > #arrow-' + dummyId).length, 0);

  assert.verifySteps([
    'annotationDeselected: ' + dummyId,
    'annotationDeleted: ' + dummyId
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

test('saveToml () should return TOML indicating instance that was persisted', (assert) => {
  let oneway = new RelationAnnotation(
      createDummyId(), dummyStartingCircle, dummyEndingCircle, 'one-way'
  );
  oneway.setContent('oneway relation');
  let twoway = new RelationAnnotation(
      createDummyId(), dummyStartingCircle, dummyEndingCircle, 'two-way'
  );
  twoway.setContent('twoway relation');
  let link   = new RelationAnnotation(
      createDummyId(), dummyStartingCircle, dummyEndingCircle, 'link'
  );
  link.setContent('link relation');

  let onewayToml = oneway.saveToml();
  assert.ok(onewayToml.match(/\n?type = "relation"\n/m));
  assert.ok(onewayToml.match(/\n?dir = "one-way"\n/m));
  let onewayIdsMatched = onewayToml.match(/\n?ids = \["([^"]+)", "([^"]+)"]\n/m);
  assert.ok(onewayIdsMatched);
  assert.equal(onewayIdsMatched[1], dummyStartingCircle.id);
  assert.equal(onewayIdsMatched[2], dummyEndingCircle.id);
  assert.ok(onewayToml.match(/\n?label = "oneway relation"/m));

  let twowayToml = twoway.saveToml();
  assert.ok(twowayToml.match(/\n?type = "relation"\n/m));
  assert.ok(twowayToml.match(/\n?dir = "two-way"\n/m));
  let twowayIdsMatched = twowayToml.match(/\n?ids = \["([^"]+)", "([^"]+)"]\n/m);
  assert.ok(twowayIdsMatched);
  assert.equal(twowayIdsMatched[1], dummyStartingCircle.id);
  assert.equal(twowayIdsMatched[2], dummyEndingCircle.id);
  assert.ok(twowayToml.match(/\n?label = "twoway relation"/m));

  let linkToml = link.saveToml();
  assert.ok(linkToml.match(/\n?type = "relation"\n/m));
  assert.ok(linkToml.match(/\n?dir = "link"\n/m));
  let linkIdsMatched = linkToml.match(/\n?ids = \["([^"]+)", "([^"]+)"]\n/m);
  assert.ok(linkIdsMatched);
  assert.equal(linkIdsMatched[1], dummyStartingCircle.id);
  assert.equal(linkIdsMatched[2], dummyEndingCircle.id);
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

test('getClassName() should return "arrow-" + the id specified on constructor', (assert) => {
  assert.equal(instance.getClassName(), 'arrow-' + dummyId);

  let withReferenceId = new RelationAnnotation(
      dummyId, dummyStartingCircle, dummyEndingCircle, 'one-way', 'referenceId'
  );
  assert.equal(withReferenceId.getClassName(), 'arrow-' + dummyId + '-referenceId');
});

// TODO: 後回し
QUnit.skip('setColor()', (assert) => {
});

// TODO: 後回し
QUnit.skip('removeColor()', (assert) => {
});

test('type(getter) should return "relation"', (assert) => {
  assert.equal(instance.type, 'relation');
});

test('direction(getter) should return the direction specified by constructor argument', (assert) => {
  let oneway = new RelationAnnotation(
      dummyId, dummyStartingCircle, dummyEndingCircle, 'one-way'
  );
  let twoway = new RelationAnnotation(
      dummyId, dummyStartingCircle, dummyEndingCircle, 'two-way'
  );
  let link   = new RelationAnnotation(
      dummyId, dummyStartingCircle, dummyEndingCircle, 'link'
  );

  assert.equal(oneway.direction, 'one-way');
  assert.equal(twoway.direction, 'two-way');
  assert.equal(link.direction, 'link');
});

// TODO: 後回し
QUnit.skip('scrollTop()', (assert) => {
});
