const $ = require("jquery");

const EventManager = require("./eventmanager");

window.globalEvent = new EventManager();

const ArrowAnnotation = require("./arrowannotation.js");
const Arrow = require("./arrow.js");
const Highlighter = require("./highlighter.js");

class Htmlanno{
  constructor(){
    // const a = new Arrow(1, {top:100, left:100});
    // a.appendTo($("#svg-screen"));
    // a.point({top:200, left:300});

    this.highlighter = new Highlighter();
    this.handleResize();
    this.wrapGlobalEvents();
    this.selectedAnnotation = null;

    globalEvent.on(this, "resizewindow", this.handleResize.bind(this));
    globalEvent.on(this, "keydown", this.handleKeydown.bind(this));
    globalEvent.on(this, "arrowannotationselect", this.handleSelect.bind(this));
    globalEvent.on(this, "highlightselect", this.handleSelect.bind(this));
    globalEvent.on(this, "mouseup", this.commitSelection.bind(this));

    let arrowAnnoId = 1;

    globalEvent.on(this, "dragstart", (data)=>{
      new ArrowAnnotation(arrowAnnoId, data.circle);
    });
    globalEvent.on(this, "arrowannotationconnect", (data)=>{
      arrowAnnoId += 1;
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

  handleSelect(e){
    if (this.selectedAnnotation){
      this.selectedAnnotation.blur();
      this.selectedAnnotation = null;
    }else{
      this.selectedAnnotation = e;
      this.selectedAnnotation.select();
    }
  }

  handleResize(){
    $('#svg-screen').attr("height", Math.max(window.innerHeight, document.body.clientHeight));
  }

  handleKeydown(e){
    // esc
    if (e.keyCode === 27) {
      if (this.selectedAnnotation){
        this.selectedAnnotation.blur();
        this.selectedAnnotation = null;
      }
    }

    // delete or back space
    if (e.keyCode === 46 || e.keyCode == 8) {
      if (this.selectedAnnotation){
        this.selectedAnnotation.remove();
        this.selectedAnnotation = null;
      }
      e.preventDefault();
    }
  }

  save(){
    this.highlighter.highlight();
  }

  remove(){
    this.highlighter.remove();
  }

  commitSelection(){
    this.highlighter.highlight();
  }
}

module.exports = Htmlanno;

