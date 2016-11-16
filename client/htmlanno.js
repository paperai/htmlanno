const $ = require("jquery");

const EventManager = require("./eventmanager");

window.globalEvent = new EventManager();

const ArrowAnnotation = require("./arrowannotation.js");
const Arrow = require("./arrow.js");
const Highlighter = require("./highlighter.js");

class Htmlanno{
  constructor(){
    this.setupHtml();
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
      if (this.selectedAnnotation){
        this.selectedAnnotation.blur();
        this.selectedAnnotation = null;
      }
      arrowAnnoId += 1;
    });
  }

  setupHtml(){
    const html = `
      <div id=htmlanno-anotation>
      <link rel="stylesheet" href="index.css">
      <svg id="htmlanno-svg-screen"
      visibility="hidden"
      baseProfile="full"
      pointer-events="visible"
      width="100%"
      height="100%">
      <defs>
      <marker id="htmlanno-arrow-head"
      class="htmlanno-arrow-head"
      visibility="visible"
      refX="6"
      refY="3"
      fill="red"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
      markerUnits="strokeWidth">
      <polyline
      points="0,0 6,3 0,6 0.2,3" />
      </marker>
      </defs>
      </svg>
      <span id="ruler" style="visibility:hidden;position:absolute;white-space:nowrap;">dddd</span>
      </div>
      `;
    document.body.appendChild($(html).get(0));
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
    console.log("hs", e, this.selectedAnnotation);
    if (this.selectedAnnotation === e){
      this.selectedAnnotation.blur();
      this.selectedAnnotation = null;
    } else{
      if (this.selectedAnnotation){
        this.selectedAnnotation.blur();
        this.selectedAnnotation = null;
      }
      if (e){
        this.selectedAnnotation = e;
        this.selectedAnnotation.select();
      }
    }
  }

  handleResize(){
    $('#htmlanno-svg-screen').attr("height", Math.max(window.innerHeight, document.body.clientHeight));
  }

  handleKeydown(e){
    console.log("keyd");
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
        e.preventDefault();
        this.selectedAnnotation.remove();
        this.selectedAnnotation = null;
      }
    }
  }

  commitSelection(){
    this.highlighter.highlight();
  }
}

module.exports = Htmlanno;

