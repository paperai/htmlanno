const {test} = QUnit;

const TomlTool = require('../src/tomltool.js');
const AnnotationContainer = require('../src/annotationcontainer.js');
const SpanAnnotation = require('../src/spanannotation.js');
const RelationAnnotation = require('../src/relationannotation.js');

QUnit.module('TomlTool', {
  before: () => {
    window.annotationContainer = undefined;
  },
  beforeEach: () => {
    window.annotationContainer = new AnnotationContainer();
  }
});

test('saveToml should return Array that include all annotation as TOML format string, in case of one highlight.', (assert) => {
  const highlight = new SpanAnnotation(123, 456, 'highlight 1');
  annotationContainer.add(highlight);

  const parentElement = document.createElement('div');
  const highlightingElements = [
    document.createElement('span'), document.createElement('span')
  ];
  highlightingElements.forEach((elm) => {
    elm.innerText = 'TEST TEST';
    elm.classList.add(highlight.getClassName());
    parentElement.appendChild(elm);
  });
  highlight._content = 'new highlight label';
  $('#viewer')[0].appendChild(parentElement);
  highlight.setDomElements(highlightingElements);

  assert.equal(highlight._id, undefined);
  const toml = TomlTool.saveToml(annotationContainer);
  assert.equal(highlight._id, 1);
  assert.deepEqual(
    toml,
    [
      [
        'version = 0.1',
        '',
        '[1]',
        'type = "span"',
        'position = [123, 456]',
        'text = "TEST TESTTEST TEST"',
        'label = "new highlight label"'
      ].join("\n")
    ]
  );
});
