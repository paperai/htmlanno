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
  },
  beforeEach: () => {
    // Htmlannoロードタイミングで初期化されるので、ここで毎回再初期化する
    window.globalEvent = new EventManager();
    window.annotationContainer = new AnnotationContainer();

    // Anno-UI ダミー
    // .fa-check.no-visibleでない == 選択中, .ja-annonameのinnerText == アノテーション名
    // Primaryなので1つだけしか選択されていない筈
    this.selectedPrimaryAnno_1 = $('<li><a href="#"><i class="fa fa-check"></i><span class="js-annoname">selected_primary_1</span></a></li>');
    this.noselectedPrimaryAnno_1 = $('<li><a href="#"><i class="fa fa-check no-visible"></i><span class="js-annoname">noselected_primary_1</span></a></li>');
    this.noselectedPrimaryAnno_2 = $('<li><a href="#"><i class="fa fa-check no-visible"></i><span class="js-annoname">noselected_primary_2</span></a></li>');

    const primaryList = $('<ul>');
    primaryList.append(this.noselectedPrimaryAnno_1);
    primaryList.append(this.selectedPrimaryAnno_1);
    primaryList.append(this.noselectedPrimaryAnno_2);
    primaryList.appendTo($('<div id="dropdownAnnoPrimary">').appendTo('body'));

    this.selectedReferenceAnno_1 = $(`
      <li><a href="#">
        <i class="fa fa-check"></i>
        <span class="js-annoname">selected_ref_1</span>
        <div class="sp-replacer sp-light">
          <div class="sp-preview"><div class="sp-preview-inner" style="background-color: rgb(255, 0, 0);"></div></div>
        </div>
      </a></li>
    `);
    this.selectedReferenceAnno_2 = $(`
      <li><a href="#">
        <i class="fa fa-check"></i>
        <span class="js-annoname">selected_ref_2</span>
        <div class="sp-replacer sp-light">
          <div class="sp-preview"><div class="sp-preview-inner" style="background-color: rgb(0, 255, 0);"></div></div>
        </div>
      </a></li>
    `);
    this.selectedReferenceAnno_3 = $(`
      <li><a href="#">
        <i class="fa fa-check"></i>
        <span class="js-annoname">selected_ref_3</span>
        <div class="sp-replacer sp-light">
          <div class="sp-preview"><div class="sp-preview-inner" style="background-color: rgb(0, 0, 255);"></div></div>
        </div>
      </a></li>
    `);
    this.noselectedReferenceAnno_1 = $(`
      <li><a href="#">
        <i class="fa fa-check no-visible"></i>
        <span class="js-annoname">noselected_ref_1</span>
        <div class="sp-replacer sp-light">
          <div class="sp-preview"><div class="sp-preview-inner" style="background-color: rgb(255, 255, 255);"></div></div>
        </div>
      </a></li>
    `);
    const referenceList = $('<ul>');
    referenceList.append(this.selectedReferenceAnno_1);
    referenceList.append(this.noselectedReferenceAnno_1);
    referenceList.append(this.selectedReferenceAnno_2);
    referenceList.append(this.selectedReferenceAnno_3);
    referenceList.appendTo($('<div id="dropdownAnnoReference">').appendTo('body'));

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

    $('body #dropdownAnnoPrimary').remove();
    $('body #dropdownAnnoReference').remove();
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

QUnit.skip('displayPrimaryAnnotation() should render annotations (bioes)', (assert) => {
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

QUnit.skip('remove() should', (assert) => {
});

test('getUiAnnotations(true, "Primary") should return Array of primary annotation-data that is not selected on Anno-UI.', (assert) => {
  result = this.instance.getUiAnnotations(true, 'Primary');
  assert.equal(result.length, 2);
  assert.equal(result[0].color, undefined); // primaryはcolorを持たないので常にundefined
  assert.equal(result[1].color, undefined);
  assert.notEqual(result[0].name, undefined);
  assert.notEqual(result[1].name, undefined);
  const names = [result[0].name, result[1].name]; // 順序は特に定義がないのでとにかく含まれていればOK
  assert.ok(names.includes(this.noselectedPrimaryAnno_1.text().trim()));
  assert.ok(names.includes(this.noselectedPrimaryAnno_2.text().trim()));
});

test('getUiAnnotations(false, "Primary") should return Array of primary annotation-data that is selected on Anno-UI.', (assert) => {
  result = this.instance.getUiAnnotations(false, 'Primary');
  assert.equal(result.length, 1);
  assert.equal(result[0].color, undefined);
  assert.equal(result[0].name, this.selectedPrimaryAnno_1.text().trim());
});

test('getUiAnnotations(true, "Reference") should return Array of reference annotation-data that is not selected on Anno-UI.', (assert) => {
  result = this.instance.getUiAnnotations(true, 'Reference');
  assert.equal(result.length, 1);
  assert.equal(result[0].color, 'rgb(255, 255, 255)');
  assert.equal(result[0].name, this.noselectedReferenceAnno_1.text().trim());
});

test('getUiAnnotations(false, "Reference") should return Array of reference annotation-data that is selected on Anno-UI.', (assert) => {
  result = this.instance.getUiAnnotations(false, 'Reference');
  assert.equal(result.length, 3);
  assert.notEqual(result[0].color, undefined);
  assert.notEqual(result[1].color, undefined);
  assert.notEqual(result[2].color, undefined);
  const colors = [result[0].color, result[1].color, result[2].color];
  assert.ok(colors.includes('rgb(255, 0, 0)'));
  assert.ok(colors.includes('rgb(0, 255, 0)'));
  assert.ok(colors.includes('rgb(0, 0, 255)'));
  assert.notEqual(result[0].name, undefined);
  assert.notEqual(result[1].name, undefined);
  assert.notEqual(result[2].name, undefined);
  const names = [result[0].name, result[1].name, result[2].name];
  assert.ok(names.includes(this.selectedReferenceAnno_1.text().trim()));
  assert.ok(names.includes(this.selectedReferenceAnno_2.text().trim()));
  assert.ok(names.includes(this.selectedReferenceAnno_3.text().trim()));
});

test('_hideReferenceAnnotation() should return Promise that is 1) emit "annotationDeleted" event, 2) call AnnotationContainer#removeReference() for each specified UiAnnotations.', (assert) => {
  const done = assert.async();

  const references = ['ref1', 'ref2', 'ref3', 'ref4', 'ref5'];
  const hideTargetRefObjs = [
    { reference: true, name: 'ref2' },
    { reference: true, name: 'ref4' },
  ];
  this.instance.fileContainer.getAnnotations = (annotationNames) => {
    assert.deepEqual(annotationNames, ['ref2', 'ref4']);
    assert.step('Called FileContainer#getAnnotations');
    return hideTargetRefObjs;
  };
  window.annotationContainer.removeReference = (annotationName) => {
    assert.step('Called removeReference(' + annotationName + ')');
    return ({ref2: { uuid: 'ref2_uuid' }, ref4: { uuid: 'ref4_uuid' }})[annotationName];
  };
  
  result = this.instance._hideReferenceAnnotation([{ name: 'ref2' }, { name: 'ref4' }]);
  assert.ok('Promise', typeof(result));
  result.then((resolves) => {
    assert.deepEqual(resolves, [{ uuid: 'ref2_uuid' }, { uuid: 'ref4_uuid' }, true]);
    done();
  });
  assert.notOk(hideTargetRefObjs[0].reference);
  assert.notOk(hideTargetRefObjs[1].reference);
  assert.verifySteps([
    'Called FileContainer#getAnnotations', 'Called removeReference(ref2)', 'Called removeReference(ref4)'
  ]);
});
