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

  highlight(){
    this.highlighter = rangy.createHighlighter();
    this.temporaryElements = [];
    this.highlighter.addClassApplier(rangy.createClassApplier("highlight"+this.highlightId, {
      ignoreWhiteSpace: true,
      onElementCreate: (element)=>{this.temporaryElements.push(element)}
    }));
    const selection = rangy.getSelection();
    if (selection.isCollapsed){
      return;
    }

    this.highlighter.highlightSelection("highlight"+this.highlightId, {exclusive: false});
    if (this.temporaryElements.length > 0){
      const highlight = new Highlight(this.highlightId, this, selection, this.temporaryElements);
      globalEvent.emit("highlightselect", highlight);
      this.highlights.push(highlight);
      this.highlightId += 1;
    }
    this.temporaryElements = [];
    selection.nativeSelection.removeAllRanges();
  }

  remove(){
    this.highlighter.removeAllHighlights();
    this.highlights.forEach((hl)=>{
      hl.remove();
    });
  }
}

module.exports = Highlighter;
