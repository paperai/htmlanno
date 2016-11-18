const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

const Highlight = require("./highlight.js");
const globalEvent = window.globalEvent;

class Highlighter{
  constructor(){
    this.highlights = [];
    this.highlightId = 1;
  }

  getText(node){
    let text = "";

    for (let i = 0; i < node.childNodes.length ; i++){
      const child = node.childNodes[i];

      if (child.nodeName == "#text"){
        text += child.textContent;
      } else{
        text += this.getText(child);
      }
    }

    return text;
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

  highlightRange(startBodyOffset, endBodyOffset){
    this.selectRange(startBodyOffset, endBodyOffset);
    this.highlight();
  }

  highlight(){
    this.highlighter = rangy.createHighlighter();
    this.temporaryElements = [];
    this.highlighter.addClassApplier(rangy.createClassApplier("htmlanno-highlight"+this.highlightId, {
      ignoreWhiteSpace: true,
      onElementCreate: (element)=>{this.temporaryElements.push(element)}
    }));

    const selection = rangy.getSelection();
    if (selection.isCollapsed){
      return;
    }

    this.highlighter.highlightSelection("htmlanno-highlight"+this.highlightId, {exclusive: false});
    if (this.temporaryElements.length > 0){
      const startOffset = this.textOffsetFromNode(selection.anchorNode)+selection.anchorOffset;
      const endOffset = this.textOffsetFromNode(selection.focusNode)+selection.focusOffset;
      const text = selection.getRangeAt(0).toString();
      const highlight = new Highlight(this.highlightId, startOffset, endOffset, text, this.temporaryElements);

      globalEvent.emit("highlightselect", highlight);
      this.highlights.push(highlight);
      this.highlightId += 1;
    }
    this.temporaryElements = [];
    selection.removeAllRanges();
  }

  remove(){
    this.highlighter.removeAllHighlights();
    this.highlights.forEach((hl)=>{
      hl.remove();
    });
  }
}

module.exports = Highlighter;
