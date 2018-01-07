const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

const Highlight = require("./highlight.js");
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

  nodeFromTextOffset(offset){
    return this.nodeFromTextOffset_(this.BASE_NODE, offset);
  }

  nodeFromTextOffset_(node, offset){
    for (let i = 0; i < node.childNodes.length ; i++){
      const child = node.childNodes[i];

      if (child.nodeName == "#text"){
        if (offset <= child.textContent.length){
          return {offset:offset, node:child};
        }
        offset -= child.textContent.length;
      } else{
        const ret = this.nodeFromTextOffset_(child, offset);
        if (ret.node){
          return ret;
        }
        offset = ret.offset;
      }
    }

    return {offset:offset, node:null};
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

  selectRange(startBodyOffset, endBodyOffset){
    if (startBodyOffset > endBodyOffset){
      const tmp = startBodyOffset;
      startBodyOffset = endBodyOffset;
      endBodyOffset = tmp;
    }

    const start = this.nodeFromTextOffset(startBodyOffset);
    const end = this.nodeFromTextOffset(endBodyOffset);
    const selection = rangy.getSelection();
    const range = rangy.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    selection.setSingleRange(range);

    return selection;
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

    return this._create(startOffset, endOffset, label, selection);
  }

  _create(startOffset, endOffset, text, selection, referenceId){
    const highlight = new Highlight(startOffset, endOffset, text, referenceId);
    const temporaryElements = [];
    const highlighter = rangy.createHighlighter();
    highlighter.addClassApplier(rangy.createClassApplier(
      highlight.getClassName(),
      {
        ignoreWhiteSpace: true,
        onElementCreate: (element)=>{temporaryElements.push(element)},
        useExistingElements: false
      }
    ));

    highlighter.highlightSelection(
      highlight.getClassName(),
      {exclusive: false}
    );
    if (temporaryElements.length > 0){
      highlight.setDomElements(temporaryElements);
      // TODO: #44 label-color.
      highlight.setColor({r: 255, g: 165, b: 0});
      this.highlights.add(highlight);
    }
    selection.removeAllRanges();

    return highlight;
  }

  addToml(id, toml, referenceId){
    try {
      const selection = this.selectRange(toml.position[0], toml.position[1]);
      if (!selection.isCollapsed){
        const span = this._create(
          toml.position[0], toml.position[1], toml.label,
          selection, referenceId
        );
        if (null != span) {
          span._id = id; // This is used to associate with RelationAnnotation.
          span.blur();
        }
        return span;
      }
    } catch(ex) {
      console.log(`id: ${id}, referenceId: ${referenceId}, toml is the following;`);
      console.log(toml);
      console.log(ex);
      return null;
    }
  }

  get(id, referenceId){
    return this.highlights.findById(Annotation.createId(id, referenceId));
  }

  remove(referenceId){
    if (undefined == referenceId) {
      return new Promise((resolve) => {
        this.highlights.forEach((highlight)=>{
          highlight.remove(true);
        });
        resolve(undefined);
      });
    } else {
      let promises = [];
      this.highlights.forEach((annotation, i)=>{
        if (annotation instanceof Highlight){
          if (undefined != referenceId) {
            if (referenceId == annotation.getReferenceId()) {
              promises.push(this._remove(annotation, i));
            }
          } else {
            promises.push(this._remove(annotation, i));
          }
        }
      });
      return Promise.all(promises);
    }
  }

  _remove(annotation, index) {
    return new Promise((resolve, reject) => {
      this.highlights.remove(index);
    }).catch((reject) => {
      console.log(reject);
    });
  }
}

module.exports = Highlighter;
