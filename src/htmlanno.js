const $ = require("jquery");

const EventManager = require("./eventmanager");

window.globalEvent = new EventManager();

const TomlTool = require("./tomltool.js");
const Highlighter = require("./highlighter.js");
const Circle = require("./circle.js");
const ArrowConnector = require("./arrowconnector.js");
const AnnotationContainer = require("./annotationcontainer.js");

class Htmlanno{
  constructor(){
    this.setupHtml();
    this.annotations = new AnnotationContainer();
    this.highlighter = new Highlighter(this.annotations);
    this.arrowConnector = new ArrowConnector(this.annotations);
    this.handleResize();
    this.wrapGlobalEvents();
    this.selectedAnnotation = null;
    this.relationTarget = null;

    globalEvent.on(this, "resizewindow", this.handleResize.bind(this));
    globalEvent.on(this, "keydown", this.handleKeydown.bind(this));
    globalEvent.on(this, "arrowannotationselect", this.handleSelect.bind(this));
    globalEvent.on(this, "highlightselect", this.handleSelect.bind(this));
    globalEvent.on(this, "commitSelection", this.commitSelection.bind(this));

    globalEvent.on(this, "removearrowannotation", (data)=>{
      this.arrowConnector.removeAnnotation(data);
    });
    globalEvent.on(this, "addSpan", this.handleAddSpan.bind(this));
    globalEvent.on(this, "addOnewayRelation", this.handleAddOnewayRelation.bind(this));
    globalEvent.on(this, "addTwowayRelation", this.handleAddTwowayRelation.bind(this));
    globalEvent.on(this, "addLinkRelation", this.handleAddLinkRelation.bind(this));
    globalEvent.on(this, "exportAnnotation", this.handleExportAnnotation.bind(this));
    globalEvent.on(this, "importAnnotation", this.handleImportAnnotation.bind(this));

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

    $("#parent").on("mouseup", (e)=>{
      globalEvent.emit("commitSelection", e);
    });

    $("#add_span").on("click", (e)=>{
      globalEvent.emit("addSpan", e);
    });

    $("#add_oneway_relation").on("click", (e)=>{
      globalEvent.emit("addOnewayRelation", e);
    });

    $("#add_twoway_relation").on("click", (e)=>{
      globalEvent.emit("addTwowayRelation", e);
    });

    $("#add_link_relation").on("click", (e)=>{
      globalEvent.emit("addLinkRelation", e);
    });

    $("#export").on("click", (e)=>{
      globalEvent.emit("exportAnnotation", e);
    });

    $("#import").on("click", (e)=>{
      globalEvent.emit("importAnnotation", e);
    });
  }

  handleSelect(data){
    if (this.selectedAnnotation === data.annotation){
      this.unselectAnnotationTarget();
      this.unselectRelationTarget();
    } else if (this.relationTarget === data.annotation){
      this.unselectRelationTarget();
    } else{
      if (undefined != data.event && data.event.ctrlKey){
        if (this.selectedAnnotation){
          this.relationTarget = data.annotation;
          this.relationTarget.select();
          this.selectedAnnotation.hideLabel();
        }
      } else{
        this.unselectAnnotationTarget();
        this.unselectRelationTarget();
        if (data.annotation){
          this.selectedAnnotation = data.annotation;
          this.selectedAnnotation.selectForEditing();
        }
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

  commitSelection(e){
    if (!$(e.target).hasClass("htmlanno-circle")) {
      // TODO:spanボタンを有効化
      this.unselectAnnotationTarget();
      this.unselectRelationTarget();
    }
  }

  unselectAnnotationTarget(){
    if (this.selectedAnnotation){
      this.selectedAnnotation.blur();
      this.selectedAnnotation = null;
    }
  }

  unselectRelationTarget(){
    if (this.relationTarget){
      this.relationTarget.blur();
      this.relationTarget = null;
    }
  }

  handleAddSpan(){
    this.highlighter.highlight();
    // TODO:spanボタンを無効化;
  }

  handleAddOnewayRelation(){
    if (null != this.selectedAnnotation && null != this.relationTarget){
      let arrowId = this.annotations.nextId();
      this.arrowConnector.createOnewayRelation(
        arrowId, this.selectedAnnotation.circle, this.relationTarget.circle, ""
      );
    }
  }

  handleAddTwowayRelation(){
    if (null != this.selectedAnnotation && null != this.relationTarget){
      let arrowId = this.annotations.nextId();
      this.arrowConnector.createTwowayRelation(
        arrowId, this.selectedAnnotation.circle, this.relationTarget.circle, ""
      );
    }
  }

  handleAddLinkRelation(){
    if (null != this.selectedAnnotation && null != this.relationTarget){
      let arrowId = this.annotations.nextId();
      this.arrowConnector.createLinkRelation(
        arrowId, this.selectedAnnotation.circle, this.relationTarget.circle, ""
      );
    }
  }

  handleExportAnnotation(){
    let blob = new Blob(TomlTool.saveToml(this.annotations));
    let blobURL = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    document.body.appendChild(a); // for firefox working correctly.
    a.download = "export.htmlanno"; // TODO: 仮設定
    a.href = blobURL;
    a.click();
    a.parentNode.removeChild(a);
  }

  handleImportAnnotation(){
    let uploaded_files = $("#import_file")[0].files;
    TomlTool.loadToml(uploaded_files[0], this.highlighter, this.arrowConnector);
  }

  remove(){
    this.highlighter.remove();
    this.arrowConnector.remove();
  }
}

module.exports = Htmlanno;

