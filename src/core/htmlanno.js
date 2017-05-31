const $ = require("jquery");

const EventManager = require("./eventmanager");

window.globalEvent = new EventManager();

const ArrowAnnotation = require("./arrowannotation.js");
const Highlighter = require("./highlighter.js");
const Circle = require("./circle.js");
const ArrowConnector = require("./arrowconnector.js");

class Htmlanno{
  constructor(){
    this.setupHtml();
    this.highlighter = new Highlighter();
    this.arrowConnector = new ArrowConnector();
    this.handleResize();
    this.wrapGlobalEvents();
    this.selectedAnnotation = null;

    globalEvent.on(this, "resizewindow", this.handleResize.bind(this));
    globalEvent.on(this, "keydown", this.handleKeydown.bind(this));
    globalEvent.on(this, "arrowannotationselect", this.handleSelect.bind(this));
    globalEvent.on(this, "highlightselect", this.handleSelect.bind(this));
    globalEvent.on(this, "mouseup", this.commitSelection.bind(this));

    globalEvent.on(this, "dragstart", (data)=>{
      this.arrowConnector.createDragingArrow(data.circle);
    });
    globalEvent.on(this, "arrowannotationconnect", (data)=>{
      this.arrowConnector.add(data);
      if (this.selectedAnnotation){
        this.selectedAnnotation.blur();
        this.selectedAnnotation = null;
      }
    });
    globalEvent.on(this, "removearrowannotation", (data)=>{
      this.arrowConnector.removeAnnotation(data);
    });

    /*
       setInterval(()=>{
       localStorage.setItem(this.storageKey(), this.toJson());
       }, 1 * 1000);
       setTimeout(()=>{
       this.loadStorage()
       }, 1);
       */
  }

  storageKey(){
    return "htmlanno-save-"+document.location.href;
  }

  setupHtml(){
    const html = `
      <div id="htmlanno-annotation">
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
      <span id="ruler" style="visibility:hidden;position:absolute;white-space:nowrap;"></span>
      </div>
      `;

    $(html).appendTo(document.body);
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

    $(document).on("mousemove", (e)=>{
      globalEvent.emit("mousemove", e);
    });

    $(window).on("resize", (e)=>{
      globalEvent.emit("resizewindow", e);
    });
  }

  handleSelect(e){
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
    if (Circle.instances){
      Circle.instances.forEach((cir)=>{
        cir.resetPosition();
      });
      Circle.instances.forEach((cir)=>{
        cir.reposition();
      });
    }
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
        e.preventDefault();
        this.selectedAnnotation.remove();
        this.highlighter.removeAnnotation(this.selectedAnnotation);
        this.arrowConnector.removeAnnotation(this.selectedAnnotation);
        this.selectedAnnotation = null;
      }
    }
  }

  commitSelection(){
    this.highlighter.highlight();
  }

  loadStorage(){
    const json = localStorage.getItem(this.storageKey());
    this.remove();

    if (json){
      this.fromJson(json);
    }
  }

  remove(){
    this.highlighter.remove();
    this.arrowConnector.remove();
  }

  saveData(){
    const data = {};
    this.highlighter.highlights.forEach((e)=>{
      data[`span-${e.id}`] = e.saveData();
    });

    this.arrowConnector.arrowAnnotations.forEach((e)=>{
      data[`rel-${e.id}`] = e.saveData();
    });

    return data;
  }

  loadData(data){
    const parseId = (key)=>{
      const type = key.split(/-/)[0];
      const id = parseInt(key.split(/-/)[1], 10);
      return {id: id, type: type};
    }

    // load spans first
    for (let key in data){
      const type = parseId(key).type;
      const id = parseId(key).id;
      if (type === "span"){
        const startOffset = data[key][0];
        const endOffset = data[key][1];
        const text = data[key][2];
        this.highlighter.create(id, startOffset, endOffset, text);
      }
    }

    for (let key in data){
      const type = parseId(key).type;
      const id = parseId(key).id;
      if (type === "rel"){
        const from = parseId(data[key][1]).id;
        const to = parseId(data[key][2]).id;
        const text = data[key][3];
        const startingCircle = this.highlighter.get(from).circle;
        const endingCircle = this.highlighter.get(to).circle;
        const arrow = this.arrowConnector.create(id, startingCircle, endingCircle, text);
        arrow.blur();
      }
    }
  }

  toJson(){
    return JSON.stringify(this.saveData());
  }

  fromJson(json){
    this.loadData(JSON.parse(json));
  }
}

module.exports = Htmlanno;

