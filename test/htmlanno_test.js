const {test} = QUnit;

const EventManager = require('../src/eventmanager.js');
const AnnotationContainer = require('../src/annotationcontainer.js');
const Highlighter = require("../src/highlighter.js");
const ArrowConnector = require("../src/arrowconnector.js");
const FileContainer = require("../src/filecontainer.js");
const WindowEvent = require('../src/windowevent.js');
const Htmlanno = require('../src/htmlanno.js');

QUnit.module('Htmlanno', {
  beforeAll: () => {
    this.instance = undefined;
    this.annotationDeletedListener = (event) => {
      Qunit.assert.step('annotationDeleted: ' + event.detail);
    };
    window.addEventListener('annotationDeleted', this.annotationDeletedListener);

  },
  afterAll: () => {
    window.removeEventListner('annotationDeleted', this.annotationDeletedListener);
  },
  beforeEach: () => {
    // Htmlannoロードタイミングで初期化されるので、ここで毎回再初期化する
    window.globalEvent = new EventManager();
    window.annotationContainer = new AnnotationContainer();
    this.instance = new Htmlanno();
  },
  afterEach: () => {
    const promiseList = [];
    window.annotationContainer.forEach((elm) => {
      promiseList.push(new Promise((result, reject) => {
        window.annotationContainer.remove(elm);
      }));
    });
    window.globalEvent.listenerMap.forEach((value, key) => {
      promiseList.push(new Promise((result, reject) => {
        window.globalEvent.removeObject(key);
      }));
    });
    Promise.all(promiseList).then(() => {
      window.annotationContainer = undefined;
      window.globalEvent = undefined;
    });
  }
});

test('instance should have defaultDataUri, defaultDataName, highlighter, arrowConnector and fileContainer.', (assert) => {
  assert.equal(this.instance.defaultDataUri, './sample/sample.xhtml');
  assert.equal(this.instance.defaultDataName, 'sample.xhtml');
  assert.ok(this.instance.highlighter instanceof Highlighter);
  assert.ok(this.instance.arrowConnector instanceof ArrowConnector);
  assert.ok(this.instance.fileContainer instanceof FileContainer);
  assert.ok(this.instance.useDefaultData);
  assert.ok(undefined === this.instance._currentContentFileName);
});

test('instance should set the HTML for rendering SVG objects to #viewerWrapper', (assert) => {
  assert.equal($('#viewerWrapper > div#htmlanno-annotation > svg#htmlanno-svg-screen').length, 1);
});

test('instance should set events to gloabalEvent', (assert) => {
  const events = globalEvent.eventMap(this.instance)
  assert.ok(events.has('resizewindow'));
  assert.ok(events.has('mouseup'));
  assert.ok(events.has('removearrowannotation'));
});

// イベント設定のみ、テスト省略
QUnit.skip('wrapGlobalEvents()');
// イベント設定のみ、テスト省略
QUnit.skip('handleAdjustCss()');
// TODO: 後回し
QUnit.skip('handleResize()');

test('handleKeydown() should do not anything when no selected annotation.', (assert) => {
  assert.equal(0, this.instance.getSelectedAnnotations());
  assert.verifySteps([]);
});
// TODO: ファイルを読み込む部分をテストしてからやる
QUnit.skip('handleKeydown()');

// TODO: 後回し
// イベント対象がサークルや矢印でない場合、何もないところがクリックされたはずなので全てのアノテーション選択を開放する
QUnit.skip('handleMouseUp()');

QUnit.skip('unselectHighlight()');
QUnit.skip('unselectRelation()');

QUnit.skip('handleAddSpan()');
QUnit.skip('handleAddRelation()');
QUnit.skip('handleExportAnnotation()');

test('displayPrimaryAnnotation() should render annotations (bioes)', (assert) => {
});

test('loadFiles() should call #fileContainer.loadFiles(),', (assert) => {
  this.instance.fileContainer.loadFiles = (files) => {
    assert.step('Called #loadFiles() with: ' + files);
    return 'return value from #loadFiles()';
  };
  const result = this.instance.loadFiles('arguments of #loadFiles()');
  assert.equal(result, 'return value from #loadFiles()');
  assert.verifySteps(['Called #loadFiles() with: arguments of #loadFiles()']);
});

test('getContentFiles() should return #fileContainer.contents', (assert) => {
  assert.ok(this.instance.getContentFiles() === this.instance.fileContainer.contents);
});

test('getAnnoFiles() should return #fileContainer.annotations', (assert) => {
  assert.ok(this.instance.getAnnoFiles() === this.instance.fileContainer.annotations);
});

QUnit.skip('reloadContent()');
QUnit.skip('restoreAnnotations()');
QUnit.skip('scrollToAnnotation()');
QUnit.skip('endEditLabel()');
QUnit.skip('getSelectedAnnotations()');
QUnit.skip('handleMouseDown()');

test('remove() should', (assert) => {
});
