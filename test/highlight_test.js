const {test} = QUnit;

const EventManager = require('../src/eventmanager.js');
window.globalEvent = new EventManager(); // Highlightのロード段階でCircleにより参照される

const Highlight = require('../src/highlight.js');

QUnit.module('Highlight', {
  before: () => {
    this.instance = undefined;
    this.dummyStart = 10;
    this.dummyEnd   = 15;
    this.dummyHtmlClassName = 'htmlanno-highlight-dummy1';
  },
  after: () => {
    window.globalEvent = undefined;
  },
  beforeEach: () => {
    this.instance = new Highlight(this.dummyStart, this.dummyEnd, this.dummyHtmlClassName);

    // ハイライトする対象を生成、dummyParentNodeでラップしてから div#viewer へ追加登録する
    this.dummyElements = [
      document.createElement('span'),
      document.createElement('span'),
      document.createElement('span')
    ];
    this.dummyParentNode = document.createElement('div');
    this.dummyElements.forEach((elm) => {
      // elm.classList.add(this.instance.getClassName()); // TODO: これ必要だっけ？
      this.dummyParentNode.appendChild(elm);
    });
    this.dummyElements[0].innerHTML = 'TEST TEST TEST ' + Math.random().toString();
    this.dummyElements[1].innerHTML = 'TEST TEST TEST ' + Math.random().toString();
    this.dummyElements[2].innerHTML = 'TES';
    $('#viewer')[0].appendChild(this.dummyParentNode);

    this.selectedContent = this.dummyElements[0].innerHTML + this.dummyElements[1].innerHTML + this.dummyElements[2].innerHTML;
  },
  afterEach: () => {
    $('#viewer')[0].removeChild(this.dummyParentNode);
  }
}, () => {
  test('instance should have #startOffset, #endOffset, and #htmlClassName', (assert) => {
    assert.ok(this.instance.startOffset   === this.dummyStart);
    assert.ok(this.instance.endOffset     === this.dummyEnd);
    assert.ok(this.instance.htmlClassName === this.dummyHtmlClassName);
  });

  test('className should return htmlClassName that specified on constructor', (assert) => {
    assert.equal(this.instance.className, this.dummyHtmlClassName);
  });

  test('BASE_NODE should return <div id="viewer">', (assert) => {
    assert.equal(this.instance.BASE_NODE, document.getElementById('viewer'));
  });

  test('SCROLL_BASE_NODE_ID should return "viewerWrapper"', (assert) => {
    assert.equal(this.instance.SCROLL_BASE_NODE_ID, 'viewerWrapper');
  });
  QUnit.skip('startOffset');
  QUnit.skip('endOffset');
  QUnit.skip('scrollOffset');
  
  // TODO: 後回し
  // setClass()内で呼び出している
  QUnit.skip('addClass()');
  
  // TODO: 後回し
  QUnit.skip('removeClass()');

  QUnit.skip('_createDom');
  QUnit.skip('_selectRange');
  QUnit.skip('_nodeFromTextOffset');
  QUnit.skip('_searchNodeScrollRoot');
});
