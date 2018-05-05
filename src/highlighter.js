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

  addToml(id, toml, referenceId, viewer){
    try {
      const start_index = this._findPositionIncluded(toml.position[0], viewer.contents);
      const end_index = this._findPositionIncluded(toml.position[1], viewer.contents);
      if (start_index !== -1 && end_index !== -1) {
        const selector = [];
        for(let selector_index = start_index; selector_index <= end_index; selector_index ++) {
          selector.push(`[data-htmlanno-id="${selector_index + 1}"`);
        }
        const target = $(selector.join(','));
        target.wrapAll('<div id="temporary">')
        const real_target = document.getElementById('temporary');

        // TODO if (!selection.isCollapsed)
        const span = new SpanAnnotation(
          toml.position[0] - viewer.contents[start_index].offset,
          toml.position[1] - viewer.contents[start_index].offset,
          toml.label,
          referenceId,
          real_target
        );
        span.setColor({r: 255, g: 165, b: 0});
        this.highlights.add(span);

        target.unwrap();
      
        if (null != span) {
          span._id = id; // This is used to associate with RelationAnnotation.
          span.blur();
        }
        return span;
      }
      console.log("error!");
    } catch(ex) {
      console.log(`id: ${id}, referenceId: ${referenceId}, toml is the following;`);
      console.log(toml);
      console.log(ex);
      return null;
    }
  }

  _findPositionIncluded(position, contents) {
    let index;
    for(index = 0; index < contents.length; index ++) {
      if (contents[index].offset > position) {
        // 1. 行き過ぎたので戻る
        // 2. contents[index]に親はいるか？ (親がいるなら、親の範囲に目的地がある筈)
        if (contents[index - 1].parent_index !== undefined) {
          return this._checkParentContentLength(position, contents, contents[index - 1].parent_index);
        } else {
           // 3. 親がいないなら1つ前の兄弟を見る (1つ前の兄弟の範囲に目的地がある筈) 
           return (index - 1)
        }
      }
    }
  }

  _checkParentContentLength(target_position, contents, parent_index) {
    if (parent_index === undefined) {
      return undefined;
    }

    const parent_node = document.querySelector(`[data-htmlanno-id="${parent_index + 1}"`);
    if (target_position > contents[parent_index].offset + parent_node.textContent.length) {
      return this._checkParentContentLength(target_position, contents, contents[parent_index].parent_index);
    } else {
      return parent_index;
    }
  }

  get(id, referenceId){
    return this.highlights.findById(Annotation.createId(id, referenceId));
  }
}

module.exports = Highlighter;
