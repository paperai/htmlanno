const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");

const EventEmitter = require('events').EventEmitter
window.eventEmitter = new EventEmitter();

const ArrowAnnotation = require("./arrowannotation.js");
const Label = require("./label.js");
const Highlight = require("./highlight.js");

class Htmlanno{
  constructor(){
    this.highlights = [];
    this.highlightId = 1;

    $('#svg-screen').attr("height", Math.max(window.innerHeight, document.body.clientHeight));
    $(window).on("resize", (e)=>{
      eventEmitter.emit("resizewindow", null);
      $('#svg-screen').attr("height", Math.max(window.innerHeight, document.body.clientHeight));
    });

    $(document).on("dragover", (e)=>{
      if (e.originalEvent.pageX && e.originalEvent.pageY){
        eventEmitter.emit("drag", e);
      }
    });

    let arrowAnno = null;

    eventEmitter.on("dragstart", (data)=>{
      arrowAnno = new ArrowAnnotation(data.circle);
    });
  }

  commitSelection(){
    const selection = rangy.getSelection();
    if (selection.isCollapsed){
      return;
    }

    const highlighter = rangy.createHighlighter();
    const temporaryElements = [];
    highlighter.addClassApplier(rangy.createClassApplier("highlight", {
      ignoreWhiteSpace: true,
      onElementCreate: (element)=>{temporaryElements.push(element)}
    }));
    highlighter.highlightSelection("highlight");

    if (temporaryElements.length > 0){
      const highlight = new Highlight(this.highlightId, selection, temporaryElements);
      this.highlights.push(highlight);
      this.highlightId += 1;
    }
    selection.removeAllRanges();
  }
}

module.exports = Htmlanno;

