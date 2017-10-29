const {test} = QUnit;
const Rangy = require('rangy');

const Highlighter = require('../src/highlighter.js');
const AnnotationContainer = require('../src/annotationcontainer.js');

QUnit.module('Highlighter', {
  before: () => {
    var annotationContainer = undefined;
    var instance = undefined;
  },
  beforeEach: () => {
    annotationContainer = new AnnotationContainer();
    instance = new Highlighter(annotationContainer);
  }
});
  
test('instance should have the AnnotationContainer that is specified on constructor.', (assert) => {
  assert.ok(instance.highlights === annotationContainer);
});

test('BASE_NODE should returns HTMLElement that is id="viewer".', (assert) => {
  assert.equal(instance.BASE_NODE, document.getElementById('viewer'));
});

QUnit.skip('nodeFromTextOffset');
QUnit.skip('textOffsetFromNode');

test('selectRange(start,end) for single tag should select the text contents that is specified by start and end, in BASE_NODE.', (assert) => {
  // "Introduction", 1始まり。Rangyの仕様としては0始まりだが(BASE_NODE後の改行が含まれる)、Htmlannoとしてはこの改行を含めない
  instance.selectRange(1, 13);
  let selected = Rangy.getSelection();
  assert.equal(selected.toString(), "Introduction");
});

test('selectRange(start,end) that includes multiple tags should select the text contents that is specified by start and end, , in BASE_NODE.', (assert) => {
  // "ction" + </h1>の後の改行 + <p>の後ろの改行 + text content
  // start: "Introduc" = 8(8文字目のcを含む), end: start + 改行2つ(2文字)+text contentの長さ
  instance.selectRange(8, 106);
  let selected = Rangy.getSelection();
  assert.equal(selected.toString(), "ction\n\nThere are a few characters that need to be treated differently when they are used in XHTML.");

});

test('selectRange(start,end) that includes multiple tags and empty line should select the text contents that is specified by start and end,  in BASE_NODE.', (assert) => {
  // text content + 各HTMLタグ後改行、text content内改行、空行の改行(2行分)
  // start,end の数値については連続する改行も1文字扱いとなる
  instance.selectRange(1, 387);
  let selected = Rangy.getSelection();
  assert.equal(selected.toString(), "Introduction\n\nThere are a few characters that need to be treated differently when they are used in XHTML. This may be because they mean something special in XHTML (they are reserved characters), so they would be interpreted as part of the XHTML markup instead of content text. Or, it may be because they are characters beyond the standard (small) character set known as ASCII.\n\n\n\nMethod");
});

test('highlight should create a new <span class="htmlanno-highlight*"> tag(* is ID) by selected range on GUI.', (assert) => {
  let range = new Range();
  // <div id="viewer">'s childNodes = 0:newline, 1:<h1>..</h1>
  // <h1>'s childNodes = 0:textnode
  range.setStart(document.getElementById('viewer').childNodes[1].childNodes[0], 0);
  range.setEnd(document.getElementById('viewer').childNodes[1].childNodes[0], 12);
  let selection = window.getSelection();
  selection.addRange(range);

  const label = 'Highlight#highlightTest1';
  let result = instance.highlight(label);
  assert.equal(result.id, '1');
  assert.equal(result.referenceId, undefined);
  assert.equal(result.startOffset, 1);
  assert.equal(result.endOffset, 13);
  assert.equal(result.getId(), '1');
  let result_selected = $('span.htmlanno-highlight1');
  assert.equal(result_selected.length, 1);
  assert.equal(result_selected.text(), 'Introduction');
  assert.equal(result_selected.data('label'), label);
});

test('highlight should create multiple <span class="htmlanno-highlight*"> tag, each <span> tag includes each HTML tag in selected range.', (assert) => {
  // 文頭から2つめの<h1>ブロックまでを選択
  // <div id="viewer">'s childNodes = 0:newline, 1:<h1>..</h1>, 2:newline, 3:<p>..</p>, 4:newlines(empty line), 5:<h1>..</h1>
  let range = new Range()
  range.setStart(document.getElementById('viewer').childNodes[1].childNodes[0], 0);
  range.setEnd(document.getElementById('viewer').childNodes[5].childNodes[0], 6);
  let selection = window.getSelection();
  selection.addRange(range);

  const label = 'Highlight#highlightTest2';
  let result = instance.highlight(label);
  assert.equal(result.id, '1');
  assert.equal(result.referenceId, undefined);
  assert.equal(result.startOffset, 1);
  assert.equal(result.endOffset, 387);
  assert.equal(result.getId(), '1');
  let result_selected = $('span.htmlanno-highlight1');
  assert.equal(result_selected.length, 3);
  assert.equal(result_selected[0].innerText, "Introduction\n"); // 先頭要素のみ、circleを設置するための<div>を含むのでinnerTextに改行が付く(?)
  assert.equal(result_selected[1].innerText, 'There are a few characters that need to be treated differently when they are used in XHTML. This may be because they mean something special in XHTML (they are reserved characters), so they would be interpreted as part of the XHTML markup instead of content text. Or, it may be because they are characters beyond the standard (small) character set known as ASCII.');
  assert.equal(result_selected[2].innerText, 'Method');
  assert.equal(result_selected.data('label'), label);
});
