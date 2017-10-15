const $ = require("jquery");

const EventManager = require("./eventmanager");

window.globalEvent = new EventManager();

const AnnoUI = require("anno-ui");

const TomlTool = require("./tomltool.js");
const Highlighter = require("./highlighter.js");
const Circle = require("./circle.js");
const ArrowConnector = require("./arrowconnector.js");
const AnnotationContainer = require("./annotationcontainer.js");
const FileContainer = require("./filecontainer.js");
const Highlight = require("./highlight.js");
const RelationAnnotation = require("./relationannotation.js");
const Bioes = require("./bioes.js");

class Htmlanno{
  constructor(){
    this.defaultDataUri = './sample/sample.xhtml';
    this.defaultDataName = this.excludeBaseUriName(this.defaultDataUri); // これは固定値だが指示都合上定数にしてはならない
    /**
     * @see #reloadContent
     * @see #loadDefaultData
     */
    this.useDefaultData = true;
    this.setupHtml();
    this.annotations = new AnnotationContainer();
    this.highlighter = new Highlighter(this.annotations);
    this.arrowConnector = new ArrowConnector(this.annotations);

    // The contents and annotations from files.
    this.fileContainer = new FileContainer();

    globalEvent.on(this, "resizewindow", this.handleResize.bind(this));
    globalEvent.on(this, "keydown", this.handleKeydown.bind(this));
    globalEvent.on(this, "mouseup", this.handleMouseUp.bind(this));

    globalEvent.on(this, "removearrowannotation", (data)=>{
      this.arrowConnector.removeAnnotation(data);
      this.unselectRelation();
    });
    this.wrapGlobalEvents();
    this.loadDefaultData();
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
      closePDFViewer :                     this.clearViewer.bind(this)
    });

    AnnoUI.contentDropdown.setup({
      initialText: 'Content File',
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
         if (undefined == contentFileName) {
           this.dispatchWindowEvent(
             'open-alert-dialog',
             {message: 'Cannot determine the filename for download.'}
           );
           return undefined;
         }
         else {
           return contentFileName.replace(/(\.[^.]+)?$/, '.htmlanno');
         }
      }
    });

    AnnoUI.annoListDropdown.setup({
      getAnnotations: this.annotations.getAllAnnotations.bind(this.annotations),
      scrollToAnnotation: this.scrollToAnnotation.bind(this)
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

    $('#tools').on('resizestop', (e) => {
      globalEvent.emit("resizewindow", e);
    });

    $('#adjust_css > li').each((index, elm) => {
      let style_name = elm.getAttribute('data-style');
      let default_value = parseInt($('#viewer').css(style_name));
      $(elm).find('input:text').val(default_value);
      $(elm).find('input:text')[0].setAttribute('data-default-value', default_value);

      this.handleAdjustCss(elm);
    });
    $('#adjust_css_reset').on('click', (event) => {
      $('#adjust_css input:text').each((index, form) => {
        form.value = form.getAttribute('data-default-value');
        $(form).change();
      });
    });
  }

  handleAdjustCss(adjuster) {
    let style_name = adjuster.getAttribute('data-style');
    let adjusterObj = $(adjuster);
    let form = adjusterObj.find('input:text');

    form.on('change', (event) => {
      $('#viewer').css(style_name, form.val() + 'px');
      this.handleResize();
    });
    adjusterObj.find('.btn.increment').on('click', (event) => {
      form.val(parseInt(form.val()) + 1);
      form.change();
    });
    adjusterObj.find('.btn.decrement').on('click', (event) => {
      form.val(parseInt(form.val()) - 1);
      form.change();
    });
  }

  handleResize(){
    let viewWrapper = $('#viewerWrapper');
    // 10 is #viewrWrapper's margin(top: 5px, bottom: 5px)
    let height = $(window).height() - viewWrapper[0].offsetTop - 10;
    viewWrapper.css('height', '');
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
    this.annotations.forEach((annotation) => {
      if (annotation instanceof RelationAnnotation) {
        annotation.reposition();
      }
    });
  }

  // HtmlAnno only, NEED.
  handleKeydown(e){
    let selected = this.getSelectedAnnotations();
    if (0 != selected.length) {
      let lastSelected = selected.sort(
        (a, b) => { return a - b; }
      ).pop();

      // delete or back space
      if (e.keyCode === 46 || e.keyCode == 8) {
        if (document.body == e.target){
          e.preventDefault();
          lastSelected.remove();
          this.annotations.remove(lastSelected);
          let uuid = lastSelected.uuid; // lastSelected.uuid(getter) is accessed after deleted it maybe.
          this.dispatchWindowEvent('annotationDeleted', {detail: {uuid: uuid} });
        }
      // esc
      } else if (e.keyCode === 27) {
        if (lastSelected instanceof Highlight) {
          this.unselectHighlight(lastSelected);
        } else if (lastSelected instanceof RelationAnnotation) {
          this.unselectRelation();
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
      resolve(TomlTool.saveToml(this.annotations.filter((annotation) => {
        return undefined === annotation.referenceId;
      })));
    });
  }

  displayPrimaryAnnotation(fileName) {
    let annotation = this.fileContainer.getAnnotation(fileName);
    annotation.primary = true;
    if ('bioes' != annotation.subtype) {
      // BIOES annotation is rendered at content loading.
      // TODO: BIOES annotaionはPrimaruには不要だが、リストがReferenceAnnotationと共用のため存在する
      // TODO: この処理が呼び出されるのはAnno-uiにおいてチェックが表示されたあとなので表示は制御できない
      TomlTool.loadToml(
        annotation.content,
        this.highlighter,
        this.arrowConnector
      );
      this.dispatchWindowEvent('annotationrendered');
    }
  }

  clearPrimaryAnnotation() {
    this.fileContainer.annotations.forEach((annotation) => {
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
      let annotation = this.fileContainer.getAnnotation(uiAnnotation.name);
      if (annotation.reference) {
        this.annotations.forEach((annotationObj) => {
          if (uiAnnotation.name == annotationObj.referenceId) {
            annotationObj.setColor(uiAnnotation.color);
          }
        });
      } else {
        annotation.reference = true;
        if (undefined == annotation.content) {
          FileContainer.bioesLoader(annotation.source, (bioes) => {
            if (undefined == bioes) {
              this.dispatchWindowEvent('open-alert-dialog', {message: 'Read error.'});
            } else {
              annotation.content = bioes.annotations.slice(0, 100); // TODO 個数が多すぎるので適当に切り出す
              annotation.source = undefined;
              TomlTool.renderAnnotation(
                annotation.content,
                this.highlighter,
                this.arrowConnector,
                uiAnnotation.name,
                uiAnnotation.color
              );
            }
          });
        } else { 
          TomlTool.loadToml(
            annotation.content,
            this.highlighter,
            this.arrowConnector,
            uiAnnotation.name,
            uiAnnotation.color
          );
        }
      }
    });
    this.dispatchWindowEvent('annotationrendered');
  }

  hideReferenceAnnotation(uiAnnotations) {
    let annotations = this.fileContainer.getAnnotations(
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
    return this.fileContainer.loadFiles(files);
  }

  getContentFiles() {
    return this.fileContainer.contents;
  }

  getAnnoFiles() {
    return this.fileContainer.annotations;
  }

  reloadContent(fileName) {
    const loadContent = (content, readResult, _this) => {
      if (undefined != readResult) {
        _this.remove();
        content.content = readResult;
        content.source = undefined;
        document.getElementById('viewer').innerHTML = content.content;
        _this.handleResize();
      } else {
        _this.showReadError();
      }
    };
    this.useDefaultData = false;
    $('#dropdownAnnoPrimary > button.dropdown-toggle')[0].removeAttribute(
      'disabled', 'disabled'
    );

    let content = this.fileContainer.getContent(fileName);
    if (undefined != content.content) {
      this.remove();
      document.getElementById('viewer').innerHTML = content.content;

      if ('bioes' == content.type) {
        $('#dropdownAnnoPrimary > button.dropdown-toggle')[0].setAttribute(
          'disabled', 'disabled'
        );
        let annotation = this.fileContainer.getAnnotation(content.name);
        annotation.primary = true;
        TomlTool.renderAnnotation(
          annotation.content, this.highlighter, this.arrowConnector
        );
        this.dispatchWindowEvent('annotationrendered');
      }
    } else {
      switch(content.type) {
        case 'html':
          FileContainer.htmlLoader(content.source, ((html) => {
            loadContent(content, html, this);
          }).bind(this));
          break;

        case 'bioes':
          FileContainer.bioesLoader(content.source, ((bioes) => {
            if (undefined == bioes) {
              this.showReadError();
            } else {
              loadContent(content, bioes.content, this);
              let annotation = this.fileContainer.getAnnotation(content.name);
              annotation.content = bioes.annotations.slice(0, 100); // TODO 個数が多すぎるので適当に切り出す
              annotation.source = undefined;
              annotation.primary = true;
              $('#dropdownAnnoPrimary > button.dropdown-toggle')[0].setAttribute(
                'disabled', 'disabled'
              );

              console.log("BIOES annotation is " + bioes.annotations.length); // TODO: temporary
              console.log(new Date()); // TODO: temporary
              TomlTool.renderAnnotation(
                annotation.content, this.highlighter, this.arrowConnector
              );
              console.log(new Date()); // TODO: temporary
              this.dispatchWindowEvent('annotationrendered');
            }
          }).bind(this));
          break;

        case 'text':
          this.remove();
          FileContainer.textLoader(content.source, ((text) => {
            loadContent(content, text, this);
          }).bind(this));
          break;

        default:
          this.dispatchWindowEvent(
            'open-alert-dialog',
            {message: 'Unknown content type; ' + content.content}
          );
      }
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
    let deleted = this.highlighter.remove(referenceId);
    if (undefined == deleted) {
      deleted = this.arrowConnector.remove(referenceId);
    }

    if (undefined != deleted) {
      let uuid = deleted.uuid; // deleted.uuid(getter) is accessed after deleted it maybe.
      this.dispatchWindowEvent('annotationDeleted', {detail: {uuid: uuid} });
    } else {
      // All remove maybe.
      this.dispatchWindowEvent('annotationDeleted', {detail: {uuid: undefined} });
    }
  }

  loadDefaultData() {
    $.get({
      url: this.defaultDataUri,
      dataType: 'html',
      success: function(htmlData) {
        let content = FileContainer.parseHtml(htmlData);
        if (undefined != content) {
          this.useDefaultData = true;
          $('#viewer').html(content);
        }
        globalEvent.emit('resizewindow');
      }
    });
  }

  clearViewer() {
    this.remove();
    $('#viewer').html('');
  }

  showReadError() {
      this.dispatchWindowEvent('open-alert-dialog', {message: 'Read error.'});
  }

  // TODO: FileContainer#_excludeBaseDirName() とほぼ同等。 Web上ファイルを扱うようになった場合、これはそちらの処理に入れる
  excludeBaseUriName(uri) {
    let fragments = uri.split('/');
    return fragments[fragments.length - 1];
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
    if (value === 'Content File') {
      if (this.useDefaultData) {
        return this.defaultDataName;
      } else {
        return undefined;
      }
    } else {
      return value;
    }
  }
}

module.exports = Htmlanno;

