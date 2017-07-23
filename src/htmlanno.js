const $ = require("jquery");

const EventManager = require("./eventmanager");

window.globalEvent = new EventManager();

const AnnoUI = require("anno-ui");

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
    window.handleAddSpan           = this.handleAddSpan.bind(this);
    window.handleAddRelation = this.handleAddRelation.bind(this);
    window.handleExportAnnotation  = this.handleExportAnnotation.bind(this);

    // HTMLanno独自機能
    globalEvent.on(this, "uploadFileSelect", this.handleUploadFileSelect.bind(this));
    globalEvent.on(this, "importAnnotation", this.handleImportAnnotation.bind(this));

    this.wrapGlobalEvents();
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
      orient="auto-start-reverse"
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
    AnnoUI.util.setupResizableColumns();
    AnnoUI.event.setup();

    AnnoUI.annoSpanButton.setup({
      createSpanAnnotation: window.handleAddSpan
    });

    AnnoUI.annoRelButton.setup({
      createRelAnnotation: window.handleAddRelation
    });

    AnnoUI.downloadButton.setup({
      getAnnotationTOMLString: window.handleExportAnnotation,
      getCurrentContentName: ()=>{ return "export.htmlanno"; },
      unlistenWindowLeaveEvent: () => {} // TODO: 処理内容保留。 see: pdfanno/src/page/util/window.js
    });

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

    // HTMLanno独自機能
    $("#import_file_view").on("click", (e)=>{
      globalEvent.emit("uploadFileSelect", e);
    })
    // マウスクリック以外の動作は無効化
    .on("focusin", ()=>{ $("#uploadButton").focus(); })
    .on("keydown", false)
    .on("contextmenu", false);

    $("#uploadButton").on("click", (e)=>{
      globalEvent.emit("importAnnotation", e);
    });

    $("#import_file").change(()=>{
      let files = $("#import_file")[0].files;
      if ( undefined != files && 0 < files.length ){
        $("#import_file_view").val(files[0].name);
      }
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
  }

  handleAddRelation(direction){
    if (null != this.selectedAnnotation && null != this.relationTarget){
      let arrowId = this.annotations.nextId();
      switch(direction){
        case 'one-way':
          this.arrowConnector.createOnewayRelation(arrowId, this.selectedAnnotation.circle, this.relationTarget.circle, "");
          break;
        case 'two-way':
          this.arrowConnector.createTwowayRelation(arrowId, this.selectedAnnotation.circle, this.relationTarget.circle, "");
          break;
        case 'link':
          this.arrowConnector.createLinkRelation(arrowId, this.selectedAnnotation.circle, this.relationTarget.circle, "");
          break;
        default:
          console.log("ERROR! undefined direction; " + direction);
      }
    }
  }

  handleExportAnnotation(){
    return new Promise( (resolve, reject) => { resolve(TomlTool.saveToml(this.annotations)); } );
  }

  // htmlAnno独自機能
  handleUploadFileSelect(){
    $("#import_file").click();
  }

  // htmlAnno独自機能
  handleImportAnnotation(){
    let files = $("#import_file")[0].files;
    if (undefined != files && 0 < files.length) {
      TomlTool.loadToml(files[0], this.highlighter, this.arrowConnector);
    }
  }

  remove(){
    this.highlighter.remove();
    this.arrowConnector.remove();
  }
}

module.exports = Htmlanno;

