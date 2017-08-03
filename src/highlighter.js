const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

const Highlight = require("./highlight.js");
const globalEvent = window.globalEvent;

class Highlighter{
  constructor(annotationContainer){
    this.highlights = annotationContainer;
    this.highlighter = rangy.createHighlighter(this.BASE_DOCUMENT);
  }

  // 定数扱い
  get BASE_IFRAME(){
    return document.getElementById("viewer");
  }
  get BASE_DOCUMENT(){
    return this.BASE_IFRAME.contentWindow.document;
  }
  get BASE_NODE(){
    return this.BASE_DOCUMENT.body;
  }

  nodeFromTextOffset(offset){
    return this.nodeFromTextOffset_(this.BASE_NODE, offset);
  }

  nodeFromTextOffset_(node, offset){
    for (let i = 0; i < node.childNodes.length ; i++){
      const child = node.childNodes[i];

      if (child.nodeName == "#text"){
        if (offset < child.textContent.length){
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
    const selection = rangy.getSelection(this.BASE_IFRAME);
    const range = rangy.createRange(this.BASE_DOCUMENT);
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    selection.setSingleRange(range);
  }

  highlight(){
    const selection = rangy.getSelection(this.BASE_IFRAME);
    if (selection.isCollapsed){
      return;
    }

    const id = this.highlights.nextId();
    const startOffset = this.textOffsetFromNode(selection.anchorNode)+selection.anchorOffset;
    const endOffset = this.textOffsetFromNode(selection.focusNode)+selection.focusOffset;
    return this.create(id, startOffset, endOffset, "");
  }

  create(id, startOffset, endOffset, text){
    this.selectRange(startOffset, endOffset);
    const selection = rangy.getSelection(this.BASE_IFRAME);
    if (selection.isCollapsed){
      return;
    }

    const temporaryElements = [];
    this.highlighter.addClassApplier(rangy.createClassApplier("htmlanno-highlight"+id, {
      ignoreWhiteSpace: true,
      onElementCreate: (element)=>{temporaryElements.push(element)}
    }));

    let highlight = null;
    this.highlighter.highlightSelection("htmlanno-highlight"+id, {exclusive: false});
    if (temporaryElements.length > 0){
      highlight = new Highlight(id, startOffset, endOffset, temporaryElements);
      highlight.setContent(text);

      globalEvent.emit("highlightselect", {event: undefined, annotation: highlight});

      // TODO: 同一のSpan(定義は別途検討)を許さないのであればここでエラー判定必要
      this.highlights.add(highlight);
    }
    selection.removeAllRanges();

    return highlight;
  }

  addToml(id, toml){
    this.selectRange(toml.position[0], toml.position[1]);
    const selection = rangy.getSelection(this.BASE_IFRAME);
    if (!selection.isCollapsed){
      const startOffset = this.textOffsetFromNode(selection.anchorNode)+selection.anchorOffset;
      const endOffset   = this.textOffsetFromNode(selection.focusNode)+selection.focusOffset;
      let span = this.create(parseInt(id), startOffset, endOffset, toml.label);
      span.blur();
    }
  }

  get(id){
    return this.highlights.findById(id);
  }

  remove(){
    this.highlighter.removeAllHighlights();
    this.highlights.forEach((annotation, i)=>{
      if (annotation instanceof Highlight){
        this.highlights.remove(i);
      }
    });
  }

  removeAnnotation(highlight){
    this.highlights.remove(highlight);
  }
}

module.exports = Highlighter;
