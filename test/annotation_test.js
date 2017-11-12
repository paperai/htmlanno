const {test} = QUnit;

const AnnotationContainer = require('../src/annotationcontainer.js');
const Annotation = require('../src/annotation.js');

QUnit.module('Annotation', {
  before: () => {
    instance = undefined;
    dummyReferenceId = 'sampleText';
  },
  beforeEach: () => {
    window.annotationContainer = new AnnotationContainer();
    instance = new Annotation(dummyReferenceId);
    annotationContainer.add(instance);
  }
});

test('instance should have id, referenceId, and selection info.(_selected, _selectedTimestamp)', (assert) => {
  assert.equal(instance.uuid, '1');
  assert.equal(instance.referenceId, dummyReferenceId);
  assert.equal(instance._selected, false);
  assert.equal(instance._selectedTimestamp, undefined);
});

// TODO: uuid()を実装したのでこの機能はもう不要か？
test('getId() should return UUID that create by Annotation.createId() with #uuid and #referenceId.', (assert) => {
  assert.equal(instance.getId(), Annotation.createId(instance.uuid, instance.referenceId));
});

// TODO: uuid()を実装したのでこの機能はもう不要か？
test('getId() should return UUID that equal to #uuid when #referenceId is undefined', (assert) => {
  let withoutReferenceId = new Annotation();
  annotationContainer.add(withoutReferenceId);

  assert.equal(withoutReferenceId.getId(), '2');
});

test('getId() should return UUID that replaced the string of cannot use to HTML class name on #referenceId', (assert) => {
  let cannotUseToHtmlChars = ['(', ')', '.', '#'];  // 実際にエラーとなった文字列を順次追加しています
  let replacedReferenceId = '_text_text_';

  cannotUseToHtmlChars.forEach((c, index) => {
    let referenceId = c + 'text' + c + 'text' + c;  // 文頭、文中、文末
    instance = new Annotation(referenceId);
    annotationContainer.add(instance);

    assert.equal(instance.uuid, (index + 2).toString());
    assert.equal(instance.getId(), instance.uuid + '-' + replacedReferenceId);
  }); 
});

test('uuid(getter) is start at one, and incremented automatically at instance creation. (instance must add to annotaionContainer)', (assert) => {
  assert.equal(instance.uuid, '1'); // beforeEach()で毎回1初期化され、インスタンスがannotationContainerへ登録される

  const other1 = new Annotation();
  annotationContainer.add(other1);
  assert.equal(other1.uuid, '2');

  const other2 = new Annotation();
  annotationContainer.add(other2);
  assert.equal(other2.uuid, '3');
});

test('getReferenceId() should return #referenceId', (assert) => {
  assert.equal(instance.getReferenceId(), dummyReferenceId);
});

test('equals() should return true when argument is myself', (assert) => {
  assert.ok(instance.equals(instance));
});

test('equals() should return false when argument is undefined', (assert) => {
  assert.notOk(instance.equals(undefined));
});

test('equals() should return false when argument is other Annotation object', (assert) => {
  let other = new Annotation(dummyReferenceId);
  annotationContainer.add(other);
  assert.notOk(instance.equals(other));
});

test('type(getter) should return undefined, this is abstract method, will be overridden in subclass', (assert) => {
  assert.equal(instance.type, undefined);
});

test('direction(getter) should return undefined, this is abstract method, will be overridden in subclass', (assert) => {
  assert.equal(instance.direction, undefined);
});

test('text(getter) should alias of content(), this is abstract method, content() will be implemented in subclass (This method used for Anno-ui)', (assert) => {
  // content() は実装されていないので仮設置(ついでに呼び出されたことの追跡用にカウンタを仕込む)
  let call_count = 0;
  instance.content = () => {
    call_count ++;
    return 'Content!';
  };
  assert.equal(instance.text, instance.content());
  // text経由の呼び出しと呼び出しとcontet()自身の呼び出しで計2回
  assert.equal(call_count, 2);
});

test('scrollTop(getter) should return zero, this is abstract method, will be overridden in subclass', (assert) => {
  assert.equal(instance.scrollTop, 0);
});

test('selected(getter) should return #_selected', (assert) => {
  instance._selected = false;
  assert.equal(instance.selected, false);
  instance._selected = true;
  assert.equal(instance.selected,  true);
});

QUnit.skip('selected(setter) should set value to #_selected and update #_selectedTimestamp by current date time', (assert) => {
});

QUnit.skip('selectedTimestamp(getter) should return #_selectedTimestamp', (assert) => {
});

QUnit.skip('blur() should reset #_selected and emit an event "annotationDeselected"', (assert) => {
});
