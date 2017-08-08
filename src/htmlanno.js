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

    // HTMLanno original function.
    globalEvent.on(this, "uploadFileSelect",
      this.handleUploadFileSelect.bind(this));
    globalEvent.on(this, "importAnnotation",
      this.handleImportAnnotation.bind(this));
    globalEvent.on(this, "targetFileSelect",
      this.handleLoadTargetSelect.bind(this));
    globalEvent.on(this, "loadTarget",
      this.handleLoadTarget.bind(this));

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
      createSpanAnnotation: this.handleAddSpan.bind(this)
    });

    AnnoUI.annoRelButton.setup({
      createRelAnnotation: this.handleAddRelation.bind(this)
    });

    AnnoUI.downloadButton.setup({
      getAnnotationTOMLString: this.handleExportAnnotation.bind(this),
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
    $(window).on("resize", (e)=>{
      globalEvent.emit("resizewindow", e);
    });

    $("#viewer").on("mouseup", (e)=>{
      globalEvent.emit("mouseup", e);
    });

    // HTMLanno original function,
    $("#import_file_view").on("click", (e)=>{
      globalEvent.emit("uploadFileSelect", e);
    })
    // Elabled only mouse click action.
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

    $("#target_file_view").on("click", (e)=>{
      globalEvent.emit("targetFileSelect", e);
    })
    // Elabled only mouse click action.
    .on("focusin", ()=>{ $("#loadlButton").focus(); })
    .on("keydown", false)
    .on("contextmenu", false);

    $("#target_file").change(()=>{
      let files = $("#target_file")[0].files;
      if ( undefined != files && 0 < files.length ){
        $("#target_file_view").val(files[0].name);
      }
    });

    $("#loadButton").on("click", (e)=>{
      globalEvent.emit("loadTarget", e);
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
      return -1 == index ? false : this.unselectHighlight(index);
    }
    return true;
  }

  unselectRelation(){
    if (null != this.selectedRelation){
      this.selectedRelation.blur();
      this.selectedRelation = null;
    }
  }

  // Annotation (highliht and relation) hover in.
  handleAnnotationHoverIn(annotation){
    this.showLabel({target: annotation});
  }

  // Annotation (highliht and relation) hover out.
  handleAnnotationHoverOut(annotation){
    this.clearLabel({target:annotation});
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
      this.selectedRelation = this.arrowConnector.createRelation(
        this.annotations.nextId(),
        this.selectedHighlights[0].circle,
        this.selectedHighlights[1].circle,
        direction, ""
      );
      this.unselectHighlight();
      this.selectedRelation.select();
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

  // htmlAnno独自機能
  handleLoadTargetSelect(){
    $("#target_file").click();
  }

  // htmlAnno独自機能
  handleLoadTarget(){
    let files = $("#target_file")[0].files;
    if (undefined != files && 0 < files.length) {
      let reader = new FileReader();
      reader.onload = ()=>{
        if (reader.result.match(/<html\s?.*>/i)){
          this.loadAsHtml(reader.result);
        } else{
          this.loadAsText(reader.result);
        }
      }
      reader.onerror = ()=>{
        alert("Load failed.");  // TODO: UI実装後に適時変更
      };
      reader.onabort = ()=>{
        alert("Load aborted."); // TODO: UI実装後に適宜変更
      };

      reader.readAsText(files[0]);

      let viewerObj = $('#viewer');
      viewerObj.css('height', window.innerHeight - viewerObj.offset().top);
    }
  }

  loadAsHtml(html){
    let bodyStart = html.match(/<body\s?.*>/im);
    let bodyEnd   = html.search(/<\/body>/im);
    if (null != bodyStart && -1 != bodyEnd){
      html = html.substring((bodyStart.index + bodyStart[0].length), bodyEnd);
    }
    html = html.replace(/<\?.+\?>/g, '').replace(/<!--.+-->/g, '');
    $("#viewer").html(html).on('click', false);
  }

  loadAsText(text){
    $("#viewer").text(text);
  }

  remove(){
    this.highlighter.remove();
    this.arrowConnector.remove();
  }
}

module.exports = Htmlanno;

