const $ = require("jquery");

const EventManager = require("./eventmanager");

window.globalEvent = new EventManager();

const AnnoUI = require("anno-ui");

const TomlTool = require("./tomltool.js");
const Highlighter = require("./highlighter.js");
const Circle = require("./circle.js");
const ArrowConnector = require("./arrowconnector.js");
const AnnotationContainer = require("./annotationcontainer.js");
const FileLoader = require("./fileloader.js");
const Highlight = require("./highlight.js");
const RelationAnnotation = require("./relationannotation.js");

class Htmlanno{
  constructor(){
    this.setupHtml();
    this.annotations = new AnnotationContainer();
    this.highlighter = new Highlighter(this.annotations);
    this.arrowConnector = new ArrowConnector(this.annotations);
    this.handleResize();

    // The contents and annotations from files.
    this.fileLoader = new FileLoader();

    globalEvent.on(this, "resizewindow", this.handleResize.bind(this));
    globalEvent.on(this, "keydown", this.handleKeydown.bind(this));
    globalEvent.on(this, "mouseup", this.handleMouseUp.bind(this));

    globalEvent.on(this, "removearrowannotation", (data)=>{
      this.arrowConnector.removeAnnotation(data);
      this.unselectRelation();
    });

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
      height="100%" style="z-index: 100;">
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

    $(html).appendTo("#viewerWrapper");
  }

  wrapGlobalEvents(){
    AnnoUI.util.setupResizableColumns();
    AnnoUI.event.setup();

    AnnoUI.browseButton.setup({
      loadFiles :                          this.loadFiles.bind(this),
      clearAllAnnotations :                this.remove.bind(this),
      displayCurrentReferenceAnnotations : this.displayReferenceAnnotation.bind(this),
      displayCurrentPrimaryAnnotations :   this.displayPrimaryAnnotation.bind(this),
      getContentFiles :                    this.getContentFiles.bind(this),
      getAnnoFiles :                       this.getAnnoFiles.bind(this),
      closePDFViewer : () => {} //window.annoPage.closePDFViewer
    });

    AnnoUI.contentDropdown.setup({
      initialText: 'PDF File',
      overrideWarningMessage: 'Are you sure to load another Content ?',
      contentReloadHandler: this.reloadContent.bind(this)
      
    });

    AnnoUI.primaryAnnoDropdown.setup({
      clearPrimaryAnnotations: this.clearPrimaryAnnotation.bind(this),
      displayPrimaryAnnotation: this.displayPrimaryAnnotation.bind(this)
    });

    AnnoUI.referenceAnnoDropdown.setup({
      displayReferenceAnnotations: this.displayReferenceAnnotation.bind(this)
    });

    AnnoUI.labelInput.setup({
      getSelectedAnnotations: this.getSelectedAnnotations.bind(this),
      saveAnnotationText: this.endEditLabel.bind(this),
      createSpanAnnotation: this.handleAddSpan.bind(this),
      createRelAnnotation: this.handleAddRelation.bind(this)
    });

    AnnoUI.downloadButton.setup({
      getAnnotationTOMLString: this.handleExportAnnotation.bind(this),
      getCurrentContentName: ()=> {
         let contentFileName = this.getCurrentContentFileName();
         return undefined === contentFileName ?  "export.htmlanno" : contentFileName.replace(/(\.[^.]+)?$/, '.htmlanno');
      },
      unlistenWindowLeaveEvent: () => {} // TODO: 処理内容保留。 see: pdfanno/src/page/util/window.js
    });

    AnnoUI.annoListDropdown.setup({
      getAnnotations: this.annotations.getAllAnnotations.bind(this.annotations),
      scrollToAnnotation: this.scrollToAnnotation.bind(this)
    });

    $(document).on("dragover", (e)=>{
      if (e.originalEvent.pageX && e.originalEvent.pageY){
        globalEvent.emit("drag", e);
      }
    });

    $(document).on("keydown", (e)=>{
      globalEvent.emit("keydown", e);
    });

    $("#viewer").on("mouseup", (e)=>{
      globalEvent.emit("mouseup", e);
    });

    let windowObj = $(window);
    windowObj.on("resize", (e)=>{
      globalEvent.emit("resizewindow", e);
    });

    windowObj.on("mousedown", (e) =>{
      this.handleMouseDown(e);
    });

    window.addEventListener('open-alert-dialog', (e) => {
      AnnoUI.ui.alertDialog.show(e.detail);
    });
  }

  handleResize(){
    let viewWrapper = $('#viewerWrapper');
    // 10 is #viewrWrapper's margin(top: 5px, bottom: 5px)
    let height = $(window).height() - viewWrapper[0].offsetTop - 10;
    viewWrapper.css('max-height', `${height}px`);
    $('#htmlanno-svg-screen').css('height', `${$('#viewer').height()}px`);

    if (Circle.instances){
      Circle.instances.forEach((cir)=>{
        cir.resetPosition();
      });
      Circle.instances.forEach((cir)=>{
        cir.reposition();
      });
    }
  }

  // HtmlAnno only, NEED.
  handleKeydown(e){
    let selected = this.getSelectedAnnotations();
    if (0 != selected.length) {
      let lastSelected = selected.sort(
        (a, b) => { return a - b; }
      ).pop();
      if (lastSelected instanceof Highlight) {
        // esc
        if (e.keyCode === 27) {
          this.unselectHighlight(lastSelected);
        }

        // delete or back space
        if (e.keyCode === 46 || e.keyCode == 8) {
          if (document.body == e.target){
            e.preventDefault();
            lastSelected.remove();
            this.annotations.remove(lastSelected);
          }
        }
      } else if (lastSelected instanceof RelationAnnotation) {
        // esc
        if (e.keyCode == 27) {
          this.unselectRelation();
        }

        // delete or back space
        if (e.keyCode === 46 || e.keyCode == 8) {
          if (document.body == e.target){
            e.preventDefault();
            lastSelected.remove();
            this.annotations.remove(lastSelected);
          }
        }
      }
    }
  }

  handleMouseUp(e){
    if (
      !$(e.target).hasClass("htmlanno-circle") &&
      !$(e.target).hasClass("htmlanno-arrow")
    ) {
      this.getSelectedAnnotations().forEach((annotation) => {
        annotation.blur();
      });
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
      this.getSelectedAnnotations().forEach((annotation) => {
        if (annotation instanceof Highlight) {
          annotation.blur();
        }
      });
    } else {
      target.blur();
    }
    return true;
  }

  unselectRelation(){
    this.getSelectedAnnotations().forEach((annotation) => {
      if (annotation instanceof RelationAnnotation) {
        annotation.blur();
      }
    });
  }

  handleAddSpan(label){
    let span = this.highlighter.highlight(label.text);
    if (undefined != span) {
      this.dispatchWindowEvent('annotationrendered');
      span.select();
    }
  }

  handleAddRelation(params) {
    let selected = this.getSelectedAnnotations();
    if (2 == selected.length) {
      let start = undefined;
      let end   = undefined;
      if (selected[0].selectedTimestamp < selected[1].selectedTimestamp) {
        start = selected[0];
        end   = selected[1];
      } else {
        start = selected[1];
        end   = selected[0];
      }
      let relation = this.arrowConnector.createRelation(
        this.annotations.nextId(),
        start.circle, end.circle,
        params.type, params.text
      );
      this.unselectHighlight();
      this.dispatchWindowEvent('annotationrendered');
      relation.select();
    } else {
      this.dispatchWindowEvent(
        'open-alert-dialog',
        {message: 'Two annotated text spans are not selected.\nTo select multiple annotated spans, click the first annotated span, then Ctrl+Click (Windows) or Cmd+Click (OSX) the second span.'}
      );
    }
  }

  handleExportAnnotation(){
    return new Promise((resolve, reject) => {
      resolve(TomlTool.saveToml(this.annotations));
    });
  }

  displayPrimaryAnnotation(fileName) {
    let annotation = this.fileLoader.getAnnotation(fileName);
    annotation.primary = true;
    TomlTool.loadToml(
      annotation.content,
      this.highlighter,
      this.arrowConnector
    );
    this.dispatchWindowEvent('annotationrendered');
  }

  clearPrimaryAnnotation() {
    this.fileLoader.annotations.forEach((annotation) => {
      if (annotation.primary) {
        annotation.primary = false;
      }
    });
    this.remove();
  }

  displayReferenceAnnotation(fileNames) {
    this.hideReferenceAnnotation(this.getUiAnnotations(true));

    let selectedUiAnnotations = this.getUiAnnotations(false);
    selectedUiAnnotations.forEach((uiAnnotation) => {
      let annotation = this.fileLoader.getAnnotation(uiAnnotation.name);
      if (annotation.reference) {
        this.annotations.forEach((annotationObj) => {
          if (uiAnnotation.name == annotationObj.referenceId) {
            annotationObj.setColor(uiAnnotation.color);
          }
        });
      } else {
        annotation.reference = true;
        TomlTool.loadToml(
          annotation.content,
          this.highlighter,
          this.arrowConnector,
          uiAnnotation.name,
          uiAnnotation.color
        );
      }
    });
    this.dispatchWindowEvent('annotationrendered');
  }

  hideReferenceAnnotation(uiAnnotations) {
    let annotations = this.fileLoader.getAnnotations(
      uiAnnotations.map((ann) => {
        return ann.name;
      })
    );
    annotations.forEach((annotation) => {
      if (annotation.reference) {
        annotation.reference = false;
        this.remove(annotation.name);
      }
    });
  }

  // TODO: この処理はanno-ui側に入れてもらいたい
  getUiAnnotations(not_selected) {
    not_selected = undefined == not_selected ? true: not_selected;
    let uiAnnotations = [];
    $('#dropdownAnnoReference a').each((index, element) => {
      let $elm = $(element);
      if ($elm.find('.fa-check').hasClass('no-visible') === not_selected) {
        uiAnnotations.push({
          name: $elm.find('.js-annoname').text(),
          color: $elm.find('.sp-preview-inner').css('background-color')
        });
      }
    });
    return uiAnnotations;
  }

  loadFiles(files) {
    return this.fileLoader.loadFiles(files);
  }

  getContentFiles() {
    return this.fileLoader.contents;
  }

  getAnnoFiles() {
    return this.fileLoader.annotations;
  }

  reloadContent(fileName) {
    let content = this.fileLoader.getContent(fileName);
    switch(content.type) {
      case 'html':
        this.remove();
        $('#viewer').html(content.content).on('click', false);
        break;

      case 'text':
        this.remove();
        $("#viewer").text(content.content);
        break;

      default:
        this.dispatchWindowEvent(
          'open-alert-dialog',
          {message: 'Unknown content type; ' + content.content}
        );
    }
    this.handleResize();
  }  

  scrollToAnnotation(id) {
    let scrollArea = $('#viewerWrapper');
    let annotation = this.annotations.findById(id);
    scrollArea[0].scrollTop = annotation.scrollTop - scrollArea.offset().top;
    annotation.blink();
  }

  endEditLabel(id, label) {
    let annotation = this.annotations.findById(id);
    annotation.setContent(label);
  }

  getSelectedAnnotations() {
    return this.annotations.getSelectedAnnotations();
  }

  /**
   * When text is selected and clicked annotation add-button,
   * the selected text is prevented from being released.
   */
  handleMouseDown(e) {
    if ($(e.target).hasClass("js-label")) {
      e.preventDefault();
    }
  }

  remove(referenceId) {
    this.highlighter.remove(referenceId);
    this.arrowConnector.remove(referenceId);

    // TODO: labelInput内、treatAnnotationDeleted(e.detail)。編集中のアノテーションが削除された場合の対応
    this.dispatchWindowEvent('annotationDeleted', {detail: {uuid: 'DUMMY'} });
  }

  // For Anno-ui.
  // TODO: Anno-UI events 辺りで提供してほしい
  dispatchWindowEvent(eventName, data) {
    let event = document.createEvent('CustomEvent');
    event.initCustomEvent(eventName, true, true, data);
    window.dispatchEvent(event);
  }

  // TODO: Anno-UI contentDropdown辺りで提供してほしい
  getCurrentContentFileName() {
    let value = $('#dropdownPdf .js-text').text();
    return value === 'PDF File' ? undefined : value;  // TODO: Anno-UI 対応後data-initial-textに切替
  }
}

module.exports = Htmlanno;

