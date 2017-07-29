const $ = require("jquery");

const EventManager = require("./eventmanager");

window.globalEvent = new EventManager();

const AnnoUI = require("anno-ui");

const TomlTool = require("./tomltool.js");
const Highlighter = require("./highlighter.js");
const Circle = require("./circle.js");
const ArrowConnector = require("./arrowconnector.js");
const AnnotationContainer = require("./annotationcontainer.js");
const InputLabel = require("./inputlabel");

class Htmlanno{
  constructor(){
    this.setupHtml();
    this.annotations = new AnnotationContainer();
    this.highlighter = new Highlighter(this.annotations);
    this.arrowConnector = new ArrowConnector(this.annotations);
    this.inputLabel = new InputLabel($("#inputLabel"));
    this.handleResize();
    this.selectedHighlights = [];
    this.selectedRelation   = null;

    globalEvent.on(this, "resizewindow", this.handleResize.bind(this));
    globalEvent.on(this, "keydown", this.handleKeydown.bind(this));
    globalEvent.on(this, "mouseup", this.handleMouseUp.bind(this));
    globalEvent.on(this, "annotationhoverin",
      this.handleAnnotationHoverIn.bind(this));
    globalEvent.on(this, "annotationhoverout",
      this.handleAnnotationHoverOut.bind(this));
    globalEvent.on(this, "highlightselect",
      this.handleHighlightSelect.bind(this));
    globalEvent.on(this, "relationselect",
      this.handleRelationSelect.bind(this));
    globalEvent.on(this, "showlabel", this.showLabel.bind(this));
    globalEvent.on(this, "clearlabel", this.clearLabel.bind(this));
    globalEvent.on(this, "editlabel", this.editLabel.bind(this));

    globalEvent.on(this, "removearrowannotation", (data)=>{
      this.arrowConnector.removeAnnotation(data);
      this.unselectRelation();
    });
    window.handleAddSpan           = this.handleAddSpan.bind(this);
    window.handleAddRelation       = this.handleAddRelation.bind(this);
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
/* TODO: 最終的に削除
    $(document).on("mousemove", (e)=>{
      globalEvent.emit("mousemove", e);
    });

    $(document).on("mouseup", (e)=>{
      globalEvent.emit("mouseup", e);
    });
*/
    $(window).on("resize", (e)=>{
      globalEvent.emit("resizewindow", e);
    });

    $("#viewer").on("mouseup", (e)=>{
      globalEvent.emit("mouseup", e);
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

  handleHighlightSelect(data){
    this.inputLabel.endEdit();
    this.unselectRelation();

    if (!this.unselectHighlight(data.annotation)){
    // Now selected highlight is not already selected.
      if (0 == this.selectedHighlights.length){
      // First selection.
        this.selectedHighlights.push(data.annotation);
        data.annotation.select();
      } else{
        if (undefined != data.event && data.event.ctrlKey) {
        // multi selection.
          this.selectedHighlights.push(data.annotation);
          data.annotation.select(true);
        } else{
        // New selection, unselect all old selection.
          this.unselectHighlight();
          this.selectedHighlights.push(data.annotation);
          data.annotation.select();
        }
      }
    }
  }

  handleRelationSelect(data){
    this.inputLabel.endEdit();
    this.unselectRelation();
    this.unselectHighlight();
    this.selectedRelation = data.annotation;
    data.annotation.select();
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
    if (0 != this.selectedHighlights.length){
      let lastSelected =
        this.selectedHighlights[this.selectedHighlights.length - 1];
      // esc
      if (e.keyCode === 27) {
        this.inputLabel.endEdit();
        this.unselectHighlight(lastSelected);
      }

      // delete or back space
      if (e.keyCode === 46 || e.keyCode == 8) {
        if (document.body == e.target){
          e.preventDefault();
          this.inputLabel.endEdit();
          lastSelected.remove();
          this.highlighter.removeAnnotation(lastSelected);
          this.unselectHighlight(lastSelected);
        }
      }
    } else if (null != this.selectedRelation){
      // esc
      if (e.keyCode == 27) {
        this.inputLabel.endEdit();
        this.unselectRelation();
      }

      // delete or back space
      if (e.keyCode === 46 || e.keyCode == 8) {
        if (document.body == e.target){
          e.preventDefault();
          this.inputLabel.endEdit();
          this.selectedRelation.remove();
          this.arrowConnector.removeAnnotation(this.selectedRelation);
          this.unselectRelation();
        }
      }
    }
  }

  handleMouseUp(e){
    this.inputLabel.endEdit();

    if (
      !$(e.target).hasClass("htmlanno-circle") &&
      !$(e.target).hasClass("htmlanno-arrow")
    ) {
      this.unselectRelation();
      this.unselectHighlight();
    }
    // else ... maybe fire an event from annotation or relation.
  }

  // Unselect the selected highlight(s).
  //
  // When call with index, unselect a highlight that is specified by index.
  // And after, if selected index exists yet, start it's label edit.
  // When call without index, unselect all highlights.
  unselectHighlight(target){
    if (undefined == target){
      this.selectedHighlights.forEach((highlight)=>{
        highlight.blur();
      });
      this.selectedHighlights = [];
    } else if ('number' === typeof(target)) {
      while(target < this.selectedHighlights.length){
        this.selectedHighlights.pop().blur();
      }
      if (0 != this.selectedHighlights.length){
        this.selectedHighlights[this.selectedHighlights.length - 1].select();
      }
    } else{
      let index = this.selectedHighlights.findIndex((elm)=>{
        return elm === target;
      });
      if (-1 == index){
        return false;
      } else{
        this.unselectHighlight(index);
      }
    }
    return true;
  }

  unselectRelation(){
    if (this.selectedRelation){
      this.selectedRelation.blur();
      this.selectedRelation = null;
    }
  }

  // Annotation (highliht and relation) hover in.
  handleAnnotationHoverIn(annotation){
    if (!this.inputLabel.editing()){
      this.inputLabel.show(annotation.content());
    }
  }

  // Annotation (highliht and relation) hover out.
  handleAnnotationHoverOut(annotation){
    if (!this.inputLabel.editing()){
      this.inputLabel.clear();
    } 
  }

  showLabel(e){
    if (!this.inputLabel.editing()){
      this.inputLabel.show(e.target.content());
    }
  }

  clearLabel(){
    if (!this.inputLabel.editing()){
      this.inputLabel.clear();
    }
  }

  editLabel(e){
    if (!this.inputLabel.editing()){
      this.inputLabel.startEdit(
        e.target.content(), e.target.setContent.bind(e.target)
      );
    }
  }

  handleAddSpan(){
    this.highlighter.highlight();
  }

  handleAddRelation(direction){
    if (2 == this.selectedHighlights.length){
      let arrowId = this.annotations.nextId();
      let from = this.selectedHighlights[0];
      let to   = this.selectedHighlights[1];
      let created = null;
      switch(direction){
        case 'one-way':
          created = this.arrowConnector.createOnewayRelation(arrowId, from.circle, to.circle, "");
          this.unselectHighlight();
          this.selectedRelation = created;
          created.select();
          break;
        case 'two-way':
          created = this.arrowConnector.createTwowayRelation(arrowId, from.circle, to.circle, "");
          this.unselectHighlight();
          this.selectedRelation = created;
          created.select();
          break;
        case 'link':
          created = this.arrowConnector.createLinkRelation(arrowId, from.circle, to.circle, "");
          this.unselectHighlight();
          this.selectedRelation = created;
          created.select();
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

