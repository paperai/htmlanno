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
const LoadBioesPromise = require('./loadbioespromise.js');
const LoadHtmlPromise = require('./loadhtmlpromise.js');
const LoadTextPromise = require('./loadtextpromise.js');
const HideBioesAnnotation = require('./hidebioesannotation.js');
const WindowEvent = require('./windowevent.js');

class Htmlanno{
  constructor(){
    this.defaultDataUri = './sample/sample.xhtml';
    this.defaultDataName = this.excludeBaseUriName(this.defaultDataUri); // これは固定値だが指示都合上定数にしてはならない
    this._currentContentFileName = undefined;
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
      displayCurrentReferenceAnnotations : () => {}, // this.displayReferenceAnnotation.bind(this),
      displayCurrentPrimaryAnnotations :   () => {}, // this.displayPrimaryAnnotation.bind(this),
      getContentFiles :                    this.getContentFiles.bind(this),
      getAnnoFiles :                       this.getAnnoFiles.bind(this),
      closePDFViewer :                     this.clearViewer.bind(this),
      restoreBeforeStatus :                ((beforeStatus) => {
        let promise = undefined;
        if (null != beforeStatus.pdfName) {
          let content = this.fileContainer.getContent(beforeStatus.pdfName);
          if ('bioes' == content.type) {
            promise = new Promise((resolve, reject) => {
              $('#dropdownAnnoPrimary > button.dropdown-toggle')[0].setAttribute(
                'disabled', 'disabled'
              );
              beforeStatus.primaryAnnotationName = beforeStatus.pdfName;
              resolve();
            });
          } else {
            promise = HideBioesAnnotation.create(this);
          }
        } else {
            promise = Promise.resolve(true);
        }
        promise.then((resolve) => {
          if (null != beforeStatus.primaryAnnotationName) {
            this.displayPrimaryAnnotation(beforeStatus.primaryAnnotationName);
          }
          if (0 != beforeStatus.referenceAnnotationNames.length) {
            this.displayReferenceAnnotation(beforeStatus.referenceAnnotationNames);
          }
          // TODO: COLOR
        });
      }).bind(this)
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
         if (undefined == this.currentContentFileName) {
           WindowEvent.emit(
             'open-alert-dialog',
             {message: 'Cannot determine the filename for download.'}
           );
           return undefined;
         }
         else {
           return this.currentContentFileName.replace(/(\.[^.]+)?$/, '.htmlanno');
         }
      }
    });

    AnnoUI.annoListDropdown.setup({
      getAnnotations: this.annotations.getAllAnnotations.bind(this.annotations),
      scrollToAnnotation: this.scrollToAnnotation.bind(this)
    });

    $(document).on("keydown", this.handleKeydown.bind(this));
    $("#viewer").on("mouseup", this.handleMouseUp.bind(this));

    let windowObj = $(window);
    windowObj.on("resize", (e)=>{
      globalEvent.emit("resizewindow", e);
    });

    windowObj.on("mousedown", this.handleMouseDown.bind(this));

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
          WindowEvent.emit('annotationDeleted', {detail: {uuid: uuid} });
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
      WindowEvent.emit('annotationrendered');
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
      WindowEvent.emit('annotationrendered');
      relation.select();
    } else {
      WindowEvent.emit(
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
    if ('bioes' == annotation.subtype) {
      this._renderBioesAnnotation(annotation);
    } else {
      this._renderAnnotation(annotation);
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
    this.hideReferenceAnnotation(this.getUiAnnotations(true)).then((resolve) => {
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
          if ('bioes' == annotation.subtype) {
            this._renderBioesAnnotation(annotation, uiAnnotation);
          } else { 
            this._renderAnnotation(annotation, uiAnnotation);
          }
        }
      });
    });
  }

  /**
   * @param annotation ... Annotation object.
   * @param uiAnnotation . undefined(Primary annotation) or UiAnnotation object(Reference annotation)
   */
  _renderBioesAnnotation(annotation, uiAnnotation) {
    LoadBioesPromise.run(annotation, this).then((results) => {
      this._renderAnnotation(annotation, uiAnnotation);
    });
  }

  /**
   * @param annotation ... Annotation object.
   * @param uiAnnotation . undefined(Primary annotation) or UiAnnotation object(Reference annotation)
   */
  _renderAnnotation(annotation, uiAnnotation) {
    if (undefined == uiAnnotation) {
      TomlTool.loadToml(
        annotation.content,
        this.highlighter, this.arrowConnector
      );
    } else {
      TomlTool.loadToml(
        annotation.content,
        this.highlighter, this.arrowConnector,
        uiAnnotation.name, uiAnnotation.color
      );
    }
    WindowEvent.emit('annotationrendered');
  }

  /**
   * @return Promise
   */
  hideReferenceAnnotation(uiAnnotations) {
    let annotations = this.fileContainer.getAnnotations(
      uiAnnotations.map((ann) => {
        return ann.name;
      })
    );
    let promises = [];
    annotations.forEach((annotation) => {
      if (annotation.reference) {
        annotation.reference = false;
        promises.push(this.remove(annotation.name));
      }
    });
    return Promise.all(promises);
  }

  // TODO: この処理はanno-ui側に入れてもらいたい
  /**
   * Get the checked/unchecked annotations on dropdown UI.
   * @param not_selected ... boolean
   * @param target ... 'Reference' or 'Primary'. when undefined or not specified, this is 'Reference'.
   */
  getUiAnnotations(not_selected, target) {
    not_selected = undefined == not_selected ? true: not_selected;
    target = undefined == target ? 'Reference' : target;
    let uiAnnotations = [];
    $(`#dropdownAnno${target} a`).each((index, element) => {
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
    this.useDefaultData = false;
    this._currentContentFileName = fileName;
    $('#dropdownAnnoPrimary > button.dropdown-toggle')[0].removeAttribute(
      'disabled', 'disabled'
    );

    let content = this.fileContainer.getContent(fileName);
    switch(content.type) {
      case 'html':
        LoadHtmlPromise.run(content, this).then((results) => {
          this.remove();
          content.content = results[1];
          content.source = undefined;
          document.getElementById('viewer').innerHTML = content.content;
          this.handleResize();
        }).catch((reject) => {
          this.showReadError();
        });
        break;

      case 'bioes':
        LoadBioesPromise.run(content, this).then((results) => {
          this.remove();
          content.content = results[1].content;
          content.source = undefined;
          document.getElementById('viewer').innerHTML = content.content;
          $('#dropdownAnnoPrimary > button.dropdown-toggle')[0].setAttribute(
            'disabled', 'disabled'
          );
          // BIOESの場合Content fileとPrimary annotationがセットなので、
          // これがRefereneで使用されていることは起こりえない。
          results[1].annotation.primary = true;
          TomlTool.renderAnnotation(
            results[1].annotation.content,
            this.highlighter,
            this.arrowConnector
          );
          WindowEvent.emit('annotationrendered');
          this.handleResize();
        }).catch((reject) => {
          this.showReadError();
        });
        break;

      case 'text':
        LoadTextPromise.run(content, this).then((results) => {
          this.remove();
          content.content = results[1];
          content.source = undefined;
          document.getElementById('viewer').innerHTML = content.content;
          this.handleResize();
        }).catch((reject) => {
          this.showReadError();
        });
        break;

      default:
        WindowEvent.emit(
          'open-alert-dialog',
          {message: 'Unknown content type; ' + content.content}
        );
    }
  }  

  scrollToAnnotation(id) {
    let scrollArea = $('#viewerWrapper');
    let annotation = this.annotations.findById(id);
    scrollArea[0].scrollTop = annotation.scrollTop - scrollArea.offset().top;
    annotation.blink();
  }

  endEditLabel(id, label) {
    this.annotations.findById(id).setContent(label);
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

  /**
   * @return Promise (resolved)
   */
  remove(referenceId) {
    return Promise.all([
      this.highlighter.remove(referenceId),
      this.arrowConnector.remove(referenceId)
    ]).then((resolve) => {
      if (undefined == referenceId) {
        // All remove maybe.
        WindowEvent.emit('annotationDeleted', {detail: {uuid: undefined} });
      } else {
        if (0 != resolve.length) {
          // deleted.uuid(getter) is accessed after deleted it maybe.
          let uuid = resolve[0].uuid;
          WindowEvent.emit('annotationDeleted', {detail: {uuid: uuid} });
        } else {
          WindowEvent.emit('annotationDeleted', {detail: {uuid: undefined} });
        }
      }
    }).catch((reject) => {
      console.log(reject);
    });
  }

  loadDefaultData() {
    $.get({
      url: this.defaultDataUri,
      dataType: 'html',
      success: function(htmlData) {
        let content = FileContainer.parseHtml(htmlData);
        if (undefined != content) {
          this.useDefaultData = true;
          this._currentContentFileName = undefined;
          document.getElementById('viewer').innerHTML = content;
        }
        globalEvent.emit('resizewindow');
      }
    });
  }

  clearViewer() {
    this.remove();
    document.getElementById('viewer').innerHTML = '';
  }

  showReadError() {
      WindowEvent.emit('open-alert-dialog', {message: 'Read error.'});
  }

  // TODO: FileContainer#_excludeBaseDirName() とほぼ同等。 Web上ファイルを扱うようになった場合、これはそちらの処理に入れる
  excludeBaseUriName(uri) {
    let fragments = uri.split('/');
    return fragments[fragments.length - 1];
  }

  get currentContentFileName() {
    return this.useDefaultData ?
      this.defaultDataName :
      this._currentContentFileName;
  }

  /**
   * Hide Primary/Reference annotation files that match pattern(ReExp).
   * @param target ... 'Primary' or 'Reference'. this is the part of id value. (id="dropdownAnno" + target)
   * @paran pattern .. the JavaScript RegExp object.
   */ 
  hideAnnotationElements(target, pattern) {
    $(`#dropdownAnno${target} .js-annoname`).each((index, elm) => {
      let listElement = $(elm).closest('li');
      if (pattern.test(elm.innerText)) {
        listElement.addClass('hidden');
      } else {
        listElement.removeClass('hidden');
      }
    });
  }
}

module.exports = Htmlanno;
