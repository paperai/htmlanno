const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

const SpanAnnotation = require("./spanannotation.js");
const Annotation = require("./annotation.js");
const WindowEvent = require('./windowevent.js');

class Highlighter{
  constructor(annotationContainer){
    this.highlights = annotationContainer;
  }

  // 定数扱い
  get BASE_NODE(){
    return document.getElementById("viewer");
  }

  textOffsetFromNode(node){
    return this.textOffsetFromNode_(node, 0);
  }

  textOffsetFromNode_(node, offset){
    if (node.id == this.BASE_NODE.id){
      return offset;
    }

    if (node.previousSibling){
      offset += node.previousSibling.textContent.length;
      return this.textOffsetFromNode_(node.previousSibling, offset);
    }else{
      return this.textOffsetFromNode_(node.parentNode, offset);
    }
  }

  // これはRangyが必要なケースでのファクトリメソッドとする
  // マウス操作によるハイライト追加を想定
  highlight(label){
    const selection = rangy.getSelection();
    if (0 == selection.rangeCount){
      WindowEvent.emit(
        'open-alert-dialog', {message: 'Text span is not selected.'}
      );
      return;
    }
    if (selection.isCollapsed){
      return;
    }
    const startOffset = this.textOffsetFromNode(selection.anchorNode)+selection.anchorOffset;
    const endOffset = this.textOffsetFromNode(selection.focusNode)+selection.focusOffset;

    return this._create(startOffset, endOffset, label);
  }

  _create(startOffset, endOffset, text, referenceId){
    const highlight = new SpanAnnotation(startOffset, endOffset, text, referenceId);
    highlight.setColor({r: 255, g: 165, b: 0});
    this.highlights.add(highlight);

    return highlight;
  }

  addToml(toml, referenceId){
    try {
      // TODO if (!selection.isCollapsed)
      const span = this._create(
        toml.range[0], toml.range[1], toml.label, referenceId
      );
      if (null != span) {
        span._id = toml.id; // This is used to associate with RelationAnnotation.
        span.blur();
      }
      return span;
    } catch(ex) {
      console.log(`id: ${toml.id}, referenceId: ${referenceId}, toml is the following;`);
      console.log(toml);
      console.log(ex);
      return null;
    }
  }

  get(id, referenceId){
    return this.highlights.findById(Annotation.createId(id, referenceId));
  }
}

module.exports = Highlighter;
