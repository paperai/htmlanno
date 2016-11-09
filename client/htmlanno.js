const $ = require("jquery");
const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

const EventEmitter = require('events').EventEmitter
window.globalEvent = new EventEmitter();

const ArrowAnnotation = require("./arrowannotation.js");
const Highlighter = require("./highlighter.js");

class Htmlanno{
  constructor(){
    this.highlighter = new Highlighter();
    this.handleResize();
    this.wrapGlobalEvents();
    this.selectedAnnotation = null;
    this.selectedHighlight = null;

    globalEvent.on("resizewindow", this.handleResize.bind(this));

    globalEvent.on("keydown", this.handleKeydown.bind(this));
    globalEvent.on("arrowannotationselect", (e)=>{
      console.log("select arrow");
      if (this.selectedHighlight){
        this.selectedHighlight.blur();
      }
      if (this.selectedAnnotation){
        this.selectedAnnotation.blur();
      }
      this.selectedAnnotation = e;
      this.selectedAnnotation.select();
    });

    globalEvent.on("highlightselect", (e)=>{
      if (this.selectedHighlight){
        this.selectedHighlight.blur();
      }
      this.selectedHighlight = e;
      this.selectedHighlight.select();
    });

    globalEvent.on("mouseup", (e)=>{
      this.commitSelection();
    });

    let arrowAnno = null;
    let arrowAnnoId = 1;

    globalEvent.on("dragstart", (data)=>{
      arrowAnno = new ArrowAnnotation(arrowAnnoId, data.circle);
    });
    globalEvent.on("arrowannotationconnect", (data)=>{
      arrowAnnoId += 1;
      console.log("connected");
    });
  }

  wrapGlobalEvents(){
    $(document).on("dragover", (e)=>{
      if (e.originalEvent.pageX && e.originalEvent.pageY){
        globalEvent.emit("drag", e);
      }
    });

    $(document).on("keydown", (e)=>{
      globalEvent.emit("keydown", e);
    });

    $(document).on("mouseup", (e)=>{
      globalEvent.emit("mouseup", e);
    });

    $(window).on("resize", (e)=>{
      globalEvent.emit("resizewindow", e);
    });
  }

  handleResize(){
    $('#svg-screen').attr("height", Math.max(window.innerHeight, document.body.clientHeight));
  }

  handleKeydown(e){
    // delete or back space
    // esc
    if (e.keyCode === 27) {
      if (this.selectedHighlight){
        this.selectedHighlight.blur();
      }
      if (this.selectedAnnotation){
        this.selectedAnnotation.blur();
      }
    }
    return;
    if (e.keyCode === 46 || e.keyCode == 8) {
      if (this.selectedAnnotation){
        this.selectedAnnotation.remove();
      }
      if (this.selectedHighlight){
        this.selectedHighlight.remove();
      }
      e.preventDefault();
    }
  }

  save(){
    // this.remove();
    // localStorage["savedata"] = rangy.serializeSelection();
    this.highlighter.highlight();
  }

  remove(){
    this.highlighter.remove();
  }

  commitSelection(){
    this.highlighter.highlight();
    // this.save();
  }
}

module.exports = Htmlanno;

