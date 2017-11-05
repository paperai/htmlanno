const {test} = QUnit;

const EventManager = require('../src/eventmanager.js');
window.globalEvent = new EventManager(); // Highlightのロード段階でCircleにより参照される

const AnnotationContainer = require('../src/annotationcontainer.js');
const Highlight = require('../src/highlight.js');

QUnit.module('Highlight', {
  before: () => {
    this.instance = undefined;
    this.dummyId = new Date().getTime().toString();
    this.dummyStart = 10;
    this.dummyEnd   = 15;
  },
  after: () => {
    window.globalEvent = undefined;
  },
  beforeEach: () => {
    window.annotationContainer = new AnnotationContainer();
    // 実際にはインスタンス生成に先立って設置されたHTMLタグをjQueryで選択したもの
    this.dummyElements = [
      document.createElement('span'),
      document.createElement('span'),
      document.createElement('span')
    ];
    this.dummyParentNode = document.createElement('div');
    this.dummyElements.forEach((elm) => {
      // @see Highlighter#create
      elm.className = 'htmlanno-highlight' + this.dummyId;
      elm.innerText = 'TEST TEST TEST';
      this.dummyParentNode.appendChild(elm);
    });
    $('#viewer')[0].appendChild(this.dummyParentNode);
    this.instance = new Highlight(
      this.dummyId,
      this.dummyStart,
      this.dummyEnd,
      this.dummyElements
    );
  },
  afterEach: () => {
    this.instance.remove(); // これをやらないとイベントリスナ等が残る場合がある(クラスによる)
    $('#viewer')[0].removeChild(this.dummyParentNode);
  }
}, () => {
  test('instance should have #id, #startOffset, #endOffset, #elements, #topElement, #circle and #jObject', (assert) => {
    assert.ok(this.instance.id === this.dummyId);
    assert.ok(this.instance.startOffset === this.dummyStart);
    assert.ok(this.instance.endOffset === this.dummyEnd);
    assert.ok(this.instance.elements === this.dummyElements);
    assert.ok(this.instance.topElement === this.dummyElements[0]);
    assert.equal(this.instance.circle.constructor.name, 'Circle');
    assert.ok(this.instance.circle.highlight === this.instance);
    assert.equal(this.instance.jObject.length, 3);
    this.instance.jObject.each((i, elm) => {
      assert.ok(elm.classList.contains('htmlanno-highlight' + this.dummyId));
    });
  });
  
  // TODO: 後回し
  QUnit.skip('handleHoverIn');
  // TODO: 後回し
  QUnit.skip('handleHoverOut');
  // コンストラクタから呼び出される
  QUnit.skip('addCircle');
  
  test('getClassName() should return "htmlanno-hl-" + #id', (assert) => {
    assert.equal(this.instance.getClassName(), 'htmlanno-hl-' + this.dummyId);
  });
  
  test('getClassName() should return "htmlanno-hl-" + #id + "-" + #referenceId when it has referenceId', (assert) => {
    let withReferenceId = new Highlight(
      this.dummyId, this.dummyStart, this.dummyEnd, this.dummyElements, 'referenceId'
    );
    assert.equal(withReferenceId.getClassName(), 'htmlanno-hl-' + this.dummyId + '-referenceId');
    withReferenceId.remove(); // これをやらないとイベントリスナ等が残る場合がある(クラスによる)
  });
  
  // TODO: 後回し
  QUnit.skip('getBoundingClientRect()');
  
  // このメソッドは現状コンストラクタで呼び出されてしまうので、コンストラクタで更新された部分を再初期化してから挙動を確認する
  // 処理内容としてはIDとなるHTMLクラス名のセットと、CSS定義用HTMLクラス名の埋め込み
  // 埋め込むクラスの種類と名前の長さを整理したほうがいいと思う
  test('setClass()', (assert) => {
    newElements = [
      document.createElement('span'),
      document.createElement('span'),
      document.createElement('span')
    ];
    newElements.forEach((elm) => {
      // @see Highlighter#create
      // #beforeEach()と異なりreferenceId付きとしている
      elm.className = 'htmlanno-highlight' + this.dummyId + '-reference001_txt';
      elm.innerText = 'TEST TEST TEST';
      $('#viewer')[0].appendChild(elm);
    });
    this.instance.elements = newElements;
    // この値を元に Annotation.createId() によって 'reference001_txt' へ変換される
    this.instance.referenceId = 'reference001.txt';

    this.instance.setClass();

    newElements.forEach((elm) => {
      assert.equal(3, elm.classList.length);
      // ハイライト対象を選択する際に付与するID付きクラス名(beforeではこれだけが付いている)
      assert.ok(elm.classList.contains('htmlanno-highlight'+this.dummyId + '-reference001_txt'));
      // インスタンスにおいて付与するID付きクラス名。不要？
      assert.ok(elm.classList.contains('htmlanno-hl-' + this.dummyId + '-reference001_txt'));
      // インスタンスにおいて付与するCSS定義用クラス名
      assert.ok(elm.classList.contains('htmlanno-highlight'));
    });
  });
  
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
    assert.equal('TEST TEST TESTTEST TEST TESTTEST TEST TEST', this.dummyParentNode.innerHTML);
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
