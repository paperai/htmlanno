const {test} = QUnit;

const EventManager = require('../src/eventmanager.js');
window.globalEvent = new EventManager(); // Highlightのロード段階でCircleにより参照される

const AnnotationContainer = require('../src/annotationcontainer.js');
const Highlight = require('../src/highlight.js');

QUnit.module('Highlight', {
  before: () => {
    this.instance = undefined;
    this.dummyStart = 10;
    this.dummyEnd   = 15;
  },
  after: () => {
    window.globalEvent = undefined;
  },
  beforeEach: () => {
    window.annotationContainer = new AnnotationContainer();

    this.instance = new Highlight(this.dummyStart, this.dummyEnd, 'test label 1');
    annotationContainer.add(this.instance);

    // ハイライトする対象を生成、dummyParentNodeでラップしてから div#viewer へ追加登録する
    this.dummyElements = [
      document.createElement('span'),
      document.createElement('span'),
      document.createElement('span')
    ];
    this.dummyParentNode = document.createElement('div');
    this.dummyElements.forEach((elm) => {
      elm.classList.add(this.instance.getClassName());
      this.dummyParentNode.appendChild(elm);
    });
    this.dummyElements[0].innerHTML = 'TEST TEST TEST ' + Math.random().toString();
    this.dummyElements[1].innerHTML = 'TEST TEST TEST ' + Math.random().toString();
    this.dummyElements[2].innerHTML = 'TES';
    $('#viewer')[0].appendChild(this.dummyParentNode);

    this.selectedContent = this.dummyElements[0].innerHTML + this.dummyElements[1].innerHTML + this.dummyElements[2].innerHTML;
  },
  afterEach: () => {
    this.instance.remove(); // これをやらないとイベントリスナ等が残る場合がある(クラスによる)
    $('#viewer')[0].removeChild(this.dummyParentNode);
  }
}, () => {
  test('instance should have #uuid, #startOffset, #endOffset, #elements, #topElement, #circle and #jObject', (assert) => {
    assert.ok(this.instance.uuid === '1');
    assert.ok(this.instance.startOffset === this.dummyStart);
    assert.ok(this.instance.endOffset === this.dummyEnd);
    assert.equal(this.instance.elements, undefined);
    assert.equal(this.instance.topElement, undefined);
    assert.equal(this.instance.circle, undefined);
    assert.equal(this.instance.jObject, undefined);
    assert.equal(this.instance.getClassName(), 'htmlanno-hl-1');
  });

  test('setDomElements() should set argument to #elements, and update #topElements, #circle and #jObject', (assert) => {
    this.instance.setDomElements(this.dummyElements);

    assert.ok(this.instance.elements === this.dummyElements);
    assert.ok(this.instance.topElement === this.dummyElements[0]);
    assert.equal(this.instance.circle.constructor.name, 'Circle');
    assert.ok(this.instance.circle.highlight === this.instance);
    assert.equal(this.instance.jObject.length, 3);
    this.instance.jObject.each((index, elm) => {
      assert.equal(elm.innerText, this.dummyElements[index].innerText);
      // test for  #setClass()
      // インスタンスにおいて付与するCSS定義用クラス名
      assert.ok(elm.classList.contains('htmlanno-highlight'));
      // ハイライト対象を選択する際に付与するID付きクラス名(beforeではこれだけが付いている)
      assert.ok(elm.classList.contains('htmlanno-hl-1'));
    });
  });
  
  // TODO: 後回し
  QUnit.skip('handleHoverIn');
  // TODO: 後回し
  QUnit.skip('handleHoverOut');
  // コンストラクタから呼び出される
  QUnit.skip('addCircle');
  
  test('getClassName() should return "htmlanno-hl-" + #uuid', (assert) => {
    assert.equal(this.instance.getClassName(), 'htmlanno-hl-' + this.instance.uuid);
  });
  
  test('getClassName() should return "htmlanno-hl-" + #uuid + "-" + #referenceId when it has referenceId', (assert) => {
    const withReferenceId = new Highlight(
      this.dummyStart, this.dummyEnd, 'with reference id', 'referenceId'
    );
    annotationContainer.add(withReferenceId);
    assert.equal(withReferenceId.getClassName(), 'htmlanno-hl-' + withReferenceId.uuid + '-referenceId');
    withReferenceId.remove(); // これをやらないとイベントリスナ等が残る場合がある(クラスによる)
  });
  
  // TODO: 後回し
  QUnit.skip('getBoundingClientRect()');
  
  // TODO: 後回し
  // setClass()内で呼び出している
  QUnit.skip('addClass()');
  
  // TODO: 後回し
  QUnit.skip('removeClass()');
  // TODO: 後回し
  QUnit.skip('select()');
  // TODO: 後回し
  QUnit.skip('blur()');
  
  test('remove()', (assert) => {
    this.dummyElements.forEach((elm) => {
      elm.classList.add('htmlanno-highlight-selected');
    });
    this.instance.remove();

    // ハイライトの<span>が削除され、<span>が持っていたinnerTextが代わりに配置される
    assert.equal(this.dummyParentNode.innerHTML, this.selectedContent);
    assert.notOk(globalEvent.listenerMap.has(this.instance.circle));
    assert.equal(0, $('div#circle-dummyId.htmlanno-circle').length);

    // TODO: イベントが発火していることの確認
  });
  
  // TODO: 後回し
  QUnit.skip('saveToml()');
  // TODO: 後回し
  QUnit.skip('isMydata()');
  // TODO: 後回し
  QUnit.skip('setContent()');
  // TODO: 後回し
  QUnit.skip('content()');
  
  test('type(getter) should return "span"', (assert) => {
    assert.equal('span', this.instance.type);
  });
  
  // TODO: 後回し
  QUnit.skip('scrollTop(getter)');
  // TODO: 後回し
  QUnit.skip('blink()');
  // TODO: 後回し
  QUnit.skip('setColor()');
  // TODO: 後回し
  QUnit.skip('removeColor()');
});
