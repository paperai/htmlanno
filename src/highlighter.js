const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

const Highlight = require("./highlight.js");
const globalEvent = window.globalEvent;

class Highlighter{
  constructor(){
    this.highlights = new Map();
    this.highlighter = rangy.createHighlighter();
  }

  nodeFromTextOffset(offset){
    return this.nodeFromTextOffset_(document.body, offset);
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
    if (node.nodeName == "BODY"){
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
  }

  maxId(){
    let maxId = 1;
    for (let [id, value] of this.highlights) {
      maxId = Math.max(maxId, id);
    }
    return maxId;
  }

  highlight(){
    const selection = rangy.getSelection();
    if (selection.isCollapsed){
      return;
    }

    const id = this.maxId() + 1;
    const startOffset = this.textOffsetFromNode(selection.anchorNode)+selection.anchorOffset;
    const endOffset = this.textOffsetFromNode(selection.focusNode)+selection.focusOffset;
    return this.create(id, startOffset, endOffset, "");
  }

  create(id, startOffset, endOffset, text){
    this.selectRange(startOffset, endOffset);
    const selection = rangy.getSelection();
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
      highlight.label.setContent(text);

      globalEvent.emit("highlightselect", highlight);

      this.highlights.set(id, highlight);
    }
    selection.removeAllRanges();

    return highlight;
  }

  get(id){
    return this.highlights.get(id);
  }

  remove(){
    this.highlighter.removeAllHighlights();
    for (let [id, hl] of this.highlights) {
      hl.remove();
    }
    this.highlights = new Map();
  }

  removeAnnotation(highlight){
    this.highlights.delete(highlight.id);
  }
}

module.exports = Highlighter;
