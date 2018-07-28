const $ = require('jquery');
const URI = require('urijs');

const EventManager = require("./eventmanager");
const AnnotationContainer = require("./annotationcontainer.js");

window.globalEvent = new EventManager();
window.annotationContainer = new AnnotationContainer();

const AnnoUI = require("anno-ui");

const TomlTool = require("./tomltool.js");
const Highlighter = require("./highlighter.js");
const Circle = require("./circle.js");
const ArrowConnector = require("./arrowconnector.js");
const FileContainer = require("./filecontainer.js");
const SpanAnnotation = require("./spanannotation.js");
const RelationAnnotation = require("./relationannotation.js");
const Bioes = require("./bioes.js");
const LoadBioesPromise = require('./loadbioespromise.js');
const LoadHtmlPromise = require('./loadhtmlpromise.js');
const LoadTextPromise = require('./loadtextpromise.js');
const HideBioesAnnotation = require('./hidebioesannotation.js');
const WindowEvent = require('./windowevent.js');
const Searcher = require('./search.js');

class Htmlanno{
  constructor(){
    this.defaultDataUri = './sample/sample.xhtml';
    this.defaultDataName = URI(this.defaultDataUri).filename(); // これは固定値だが指示都合上定数にしてはならない
    this._currentContentFileName = undefined;
    /**
     * @see #reloadContent
     * @see #loadDefaultData
     */
    this.useDefaultData = true;
    this.setupHtml();
    this.highlighter = new Highlighter(annotationContainer);
    this.arrowConnector = new ArrowConnector(annotationContainer);

    // The contents and annotations from files.
    this.fileContainer = new FileContainer();

    globalEvent.on(this, "resizewindow", this.handleResize.bind(this));
    globalEvent.on(this, "mouseup", this.handleMouseUp.bind(this));

    globalEvent.on(this, "removearrowannotation", (data)=>{
      this.arrowConnector.removeAnnotation(data);
      this.unselectRelation();
    });
    this.wrapGlobalEvents();

    const query = URI(document.URL).query(true);
    if (undefined != query.xhtml) { // anno=だけあってもレンダリングできないので、コンテンツ系のみ存在チェックを行う
      this.fileContainer.loadURI(query).then((container) => {
        if (0 != container.contents.length) {
          this.reloadContent(container.contents[0].name).then((resolve) => {
            if (0 != container.annotations.length) {
              this.renderPrimaryAnnotation(container.annotations[0]);
            }
          });
        }
      }).catch(
        this.showReadError
      );
    } else {
      this.loadDefaultData();
    }
  }

  // TODO: not use now.
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
    AnnoUI.core.setup({
      applicationName: 'htmlanno'
    });

    AnnoUI.browseButton.setup({
      loadFiles :                          this.loadFiles.bind(this),
      clearAllAnnotations :                this.removeAll.bind(this),
      displayCurrentReferenceAnnotations : this.displayReferenceAnnotation.bind(this),
      displayCurrentPrimaryAnnotations :   () => {}, // not use. @see restoreAnnotations()
      getContentFiles :                    this.getContentFiles.bind(this),
      getAnnoFiles :                       this.getAnnoFiles.bind(this),
      closePDFViewer :                     this.clearViewer.bind(this),
      callbackLoadedFiles :                this.restoreAnnotations.bind(this)
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
      createRelAnnotation: this.handleAddRelation.bind(this),
      colorChangeListener: this.handleColorChange.bind(this),
      namingRuleForExport: this.getExportFileName.bind(this)
    });

    AnnoUI.downloadButton.setup({
      getAnnotationTOMLString: this.handleExportAnnotation.bind(this),
      getDownloadFileName: () => {
         if (undefined == this.currentContentFileName) {
           WindowEvent.emit(
             'open-alert-dialog',
             {message: 'Cannot determine the filename for download.'}
           );
           return undefined;
         }
         else {
           return this.currentContentFileName.replace(/(\.[^.]+)?$/, '.' + AnnoUI.core.applicationName());
         }
      }
    });

    AnnoUI.annoListDropdown.setup({
      getAnnotations: annotationContainer.getPrimaryAnnotations.bind(annotationContainer),
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
    const promises = [];
    promises.push(new Promise((resolve, reject) => {
      const viewWrapper = $('#viewerWrapper');
      // 10 is #viewrWrapper's margin(top: 5px, bottom: 5px)
      const height = $(window).height() - viewWrapper[0].offsetTop - 10;
      viewWrapper.css('height', '');
      viewWrapper.css('max-height', `${height}px`);
      $('#htmlanno-svg-screen').css('height', `${$('#viewer').height()}px`);
      resolve();
    }));
    if (Circle.instances){
      promises.push(Circle.repositionAll());
    }
    promises.push(annotationContainer.forEachPromise((annotation) => {
      if (annotation instanceof RelationAnnotation) {
        annotation.reposition();
      }
    }));
    return Promise.all(promises).then();
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
          if (lastSelected.isEditable()) {
            annotationContainer.remove(lastSelected); // In this function, lastSelected#remove() is called.
            let uuid = lastSelected.uuid; // lastSelected.uuid(getter) is accessed after deleted it maybe.
            WindowEvent.emit('annotationDeleted', {detail: {uuid: uuid} });
          }
        }
      // esc
      } else if (e.keyCode === 27) {
        if (lastSelected instanceof SpanAnnotation) {
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
      return this._blurAnnotations();
    } else {
      // maybe fire an event from annotation or relation.
      return Promise.resolve();
    }
  }

  // Unselect the selected highlight(s).
  //
  // When call with index, unselect a highlight that is specified by index.
  // And after, if selected index exists yet, start it's label edit.
  // When call without index, unselect all highlights.
  unselectHighlight(target){
    if (undefined == target) {
      return this._blurAnnotations((annotation) => {
        return (annotation instanceof SpanAnnotation);
      });
    } else {
      return (new Promise((resolve, reject) => {
        target.blur();
      })).then();
    }
  }

  unselectRelation(){
    return this._blurAnnotations((annotation) => {
      return (annotation instanceof RelationAnnotation);
    });
  }

  _blurAnnotations(callbackForCheck) {
    const promises = [];
    annotationContainer.getSelectedAnnotations().forEach((annotation) => {
      if (undefined == callbackForCheck || callbackForCheck(annotation)) {
        promises.push(new Promise((resolve, reject) => {
          annotation.blur();
        }));
      }
    });
    return Promise.all(promises).then();
  }

  handleExportAnnotation(){
    return new Promise((resolve, reject) => {
      resolve(TomlTool.saveToml(annotationContainer.filter((annotation) => {
        return undefined === annotation.referenceId;
      })));
    });
  }

  // TODO: 呼び出し元の処理まで含めて変更すればPromise化できそう
  _getAnnotations(selectorFunction) {
    const results = [];
    annotationContainer.forEach((annotation) => {
      if (selectorFunction(annotation)) {
        results.push(annotation);
      }
    });
    return results;
  }

  _getAnnotationsByFileContentName(targetName, optionalCheck) {
    return this._getAnnotations((annotation) => {
      if (targetName == annotation.fileContentName) {
        return undefined != optionalCheck ? optionalCheck(annotation) : true;
      }
    });
  }

  /**
   * Anno-Ui -> rendering
   * @see renderPrimaryAnnotation()
   */
  displayPrimaryAnnotation(fileName) {
    const promises = this._hideUnselectedPrimaryAnnotations();
    promises.push(this.handleResize());
    promises.push(
      new Promise((resolve, reject) => {
        this.renderPrimaryAnnotation(
          this.fileContainer.getAnnotation(fileName)
        );
        resolve();
      })
    );
    return Promise.all(promises).then();
  }

  renderPrimaryAnnotation(annotationFileObj) {
    annotationFileObj.primary = true;
    if ('bioes' == annotationFileObj.subtype) {
      this._renderBioesAnnotation(annotationFileObj);
    } else {
      this._renderAnnotation(annotationFileObj);
    }
  }

  /**
   * @return Array that includes Promise.
   */
  _hideUnselectedPrimaryAnnotations() {
    const promises = [];
    this.getUiAnnotations(true, 'Primary').forEach((ann) => {
      this._getAnnotationsByFileContentName(ann.name, (annotation) => {
        return annotation.isPrimary();
      }).forEach((annotation) => {
        // TODO: annotationContainer.removePrimaryAll() のほうが早いが、そもそもAnno-uiでclearPrimaryAnnotation()を呼び出さない理由が不明。
        promises.push(this.remove(annotation));
      });
      promises.push(new Promise((resolve, reject) => {
        // 操作対象を明確化したいのでAnnotationには機能実装していない
        const annotationFileObj = this.fileContainer.getAnnotation(ann.name);
        annotationFileObj.primary = false;
        resolve(annotationFileObj);
      }));
    });
    return promises;
  }

  /**
   * Anno-ui -> rendering(clear)
   */
  clearPrimaryAnnotation() {
    this.fileContainer.annotations.forEach((annotation) => {
      if (annotation.primary) {
        annotationContainer.removePrimaryAll();
        this.handleResize();
        annotation.primary = false;
      }
    });
    
    // Because AnnotationContainer#removePrimaryAll() reconstructs inner set, #getAnnotations() is not return correctly collection.
    // For update annoList count, 'annotationDeleted' event need to emit after all process.
    WindowEvent.emit('annotationDeleted', {uuid: undefined});
  }

  /**
   * (re-)render all annotation that checked for reference.
   * @param fileNames ... not used.
   */
  displayReferenceAnnotation(fileNames) {
    const removePromise = this._hideReferenceAnnotation(this.getUiAnnotations(true));
    // TODO: resolve使っていないので、then()以下の処理もPromise化したい
    removePromise.then((resolve) => {
      const selectedUiAnnotations = this.getUiAnnotations(false);
      selectedUiAnnotations.forEach((uiAnnotation) => {
        const annotationFileObj = this.fileContainer.getAnnotation(uiAnnotation.name);
        if (!annotationFileObj.reference) {
          annotationFileObj.reference = true;
          if ('bioes' == annotationFileObj.subtype) {
            this._renderBioesAnnotation(annotationFileObj, uiAnnotation);
          } else { 
            this._renderAnnotation(annotationFileObj, uiAnnotation);
          }
        }
      });
      annotationContainer.forEach((annotation) => {
        selectedUiAnnotations.forEach((uiAnnotation) => {
          if (annotation.fileContentName == uiAnnotation.name && annotation.isReference()) {
            annotation.setColor(uiAnnotation.color);
          }
        });
      });
      this.handleResize();
    })
    .catch((reject) => {
      console.log(reject);
    });
  }

  /**
   * @param annotationFileObj ... Annotation object that is created by FileContainer#loadFiles()
   * @param uiAnnotation . undefined(Primary annotation) or UiAnnotation object(Reference annotation)
   */
  _renderBioesAnnotation(annotationFileObj, uiAnnotation) {
    LoadBioesPromise.run(annotationFileObj, this).then((results) => {
      this._renderAnnotation(annotationFileObj, uiAnnotation);
    });
  }

  /**
   * @param annotationFileObj ... Annotation object that is created by FileContainer#loadFiles()
   * @param uiAnnotation . undefined(Primary annotation) or UiAnnotation object(Reference annotation)
   */
  _renderAnnotation(annotationFileObj, uiAnnotation) {
    const colorMap = AnnoUI.labelInput.getColorMap();
    if (undefined == uiAnnotation) {
      TomlTool.loadToml(
        annotationFileObj,
        this.highlighter, this.arrowConnector,
        undefined, /* uiAnnotation.name */
        colorMap
      );
    } else {
      TomlTool.loadToml(
        annotationFileObj,
        this.highlighter, this.arrowConnector,
        uiAnnotation.name,
        colorMap
      );
    }
    WindowEvent.emit('annotationrendered');
  }

  /**
   * @return Promise
   */
  _hideReferenceAnnotation(uiAnnotations) {
    const fileContentNames = uiAnnotations.map((ann) => {
      return ann.name;
    });
    const promises = [];
    this.fileContainer.getAnnotations(fileContentNames).forEach((annotationFileObj) => {
      promises.push(new Promise((resolve, reject) => {
        annotationFileObj.reference = false;
        resolve(annotationContainer.removeReference(annotationFileObj.name));
      }));
    });
    promises.push(new Promise((resolve, reject) => {
      // Because AnnotationContainer#removeReference() reconstructs inner set, #getAnnotations() is not return correctly collection.
      // For update annoList count, 'annotationDeleted' event need to emit after all process.
      WindowEvent.emit('annotationDeleted', {uuid: undefined});
      resolve(true);
    }));
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
          name: $elm.find('.js-annoname').text()
        });
      }
    });
    return uiAnnotations;
  }

  loadFiles(files) {
    // For getCurrentFileNames() in Anno-UI, all dropdown element is turned on.
    this.hideAnnotationElements('Primary', null); 
    this.hideAnnotationElements('Reference', null); 

    return this.fileContainer.loadFiles(files);
  }

  getContentFiles() {
    return this.fileContainer.contents;
  }

  getAnnoFiles() {
    return this.fileContainer.annotations;
  }

  /**
   * @return Promise
   */
  reloadContent(fileName) {
    this.useDefaultData = false;
    this._currentContentFileName = fileName;
    this.enableDropdownAnnotationPrimary(true);

    const _removeExtension = (filename) => {
      const parts = filename.split('.');
      parts.pop(); // Remove extension
      return parts.join('.');
    };

    const contentData = this.fileContainer.getContent(fileName);
    const contentName = _removeExtension(contentData.name);
    const sameNameAnnotation = this.fileContainer.annotations.filter((annotation) => {
      if (annotation.subtype !== 'bioes') {
        const annoName = _removeExtension(annotation.name);
        return annoName == contentName;
      } else {
        return false;
      }
    });
    switch(contentData.type) {
      case 'html':
        return LoadHtmlPromise.run(contentData, this)
          .then((results) => {
            const annotation = sameNameAnnotation.length !== 0 ? sameNameAnnotation[0] : undefined;
            this._afterContentLoading(contentData, { content: results[1], annotation: annotation });
          }).catch((reject) => {
            this.showReadError();
          });

      case 'bioes':
        return LoadBioesPromise.run(contentData, this).then((results) => {
          this.enableDropdownAnnotationPrimary(false);
          this._afterContentLoading(contentData, results[1]);
        }).catch((reject) => {
          this.showReadError();
        });

      case 'text':
        return LoadTextPromise.run(contentData, this)
          .then((results) => {
            const annotation = sameNameAnnotation.length !== 0 ? sameNameAnnotation[0] : undefined;
            this._afterContentLoading(contentData, { content: results[1], annotation: annotation });
          }).catch((reject) => {
            this.showReadError();
          });

      default:
        WindowEvent.emit(
          'open-alert-dialog',
          {message: 'Unknown content type; ' + contentData.content}
        );
    }
  }  

  /**
   * called from reloadContent()
   */
  _afterContentLoading(contentData, loadingResult) {
    this.removeAll();
    contentData.content = loadingResult.content;
    contentData.source  = undefined;
    document.getElementById('viewer').innerHTML = contentData.content;
    if (loadingResult.annotation !== undefined) {
      document.querySelectorAll('#dropdownAnnoPrimary li').forEach((listElement) => {
        const listName = listElement.textContent.trim();
        if (loadingResult.annotation.name == listName) {
          document.querySelector('#dropdownAnnoPrimary .js-text').textContent = listName;
          listElement.querySelector('.fa-check').classList.remove('no-visible');
        } else {
          listElement.querySelector('.fa-check').classList.add('no-visible');
        }
      });
      loadingResult.annotation.primary = true;
      TomlTool.loadToml(
        loadingResult.annotation,
        this.highlighter,
        this.arrowConnector,
        undefined,
        AnnoUI.labelInput.getColorMap()
      );
      WindowEvent.emit('annotationrendered');
    }
    this.handleResize();
    new Searcher();
  }

  restoreAnnotations(beforeStatus) {
    let promise = undefined;
    if (null != beforeStatus.pdfName) {
      let content = this.fileContainer.getContent(beforeStatus.pdfName);
      if ('bioes' == content.type) {
        promise = new Promise((resolve, reject) => {
          this.enableDropdownAnnotationPrimary(false);
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
        // the reference annotation drawing color is set in this process based from Ui.
        this.displayReferenceAnnotation(beforeStatus.referenceAnnotationNames);
      }
    });
  }

  scrollToAnnotation(id) {
    const scrollArea = $('#viewerWrapper');
    const annotation = annotationContainer.findById(id);
    scrollArea[0].scrollTop = annotation.scrollTop - scrollArea.offset().top;
    annotation.blink();
  }

  // For labelInput
  endEditLabel(id, label) {
    annotationContainer.findByUuid(id).setContent(label);
  }

  // For labelInput
  handleAddSpan(label) {
    SpanAnnotation.updateLabelIfExistsSelectedSpan(label, annotationContainer).then(
      (spanUpdated) => {
        if (!spanUpdated) {
          // Create a new span.
          const span = this.highlighter.highlight(label.text);
          if (undefined != span) {
            WindowEvent.emit('annotationrendered');
            span.setColor(label.color);
            span.select();
          }
        }
      }
    );
  }

  // For labelInput
  handleAddRelation(label) {
    RelationAnnotation.updateLabelIfExistsSelectedRelation(label, annotationContainer).then(
      (relationUpdated) => {
        if (!relationUpdated) {
          const selected = this.getSelectedAnnotations().sort(
            (a, b) => {
              return a.selectedTimestamp.getTime() - b.selectedTimestamp.getTime();
            }
          );
          if (2 == selected.length) {
            const relation = new RelationAnnotation(
              selected[0].circle, selected[1].circle, label.type
            );
            relation.setContent(label.text);
            relation.setColor(label.color);
            annotationContainer.add(relation);
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
      }
    );
  }

  handleColorChange(query) {
    return annotationContainer.setColor(query);
  }

  getSelectedAnnotations() {
    return annotationContainer.getSelectedAnnotations();
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

  removeAll() {
    annotationContainer.removeAll();
    Circle.repositionAll().then(() => {
      // Because AnnotationContainer#removeAll() reconstructs inner set, #getAnnotations() is not return correctly collection.
      // For update annoList count, 'annotationDeleted' event need to emit after all process.
      WindowEvent.emit('annotationDeleted', {uuid: undefined});
    });
  }

  /**
   * @return Promise
   *
   * TODO: _hideUnselectedPrimaryAnnotations でのみ使用。廃止できるか？
   */
  remove(annotation) {
    return new Promise((resolve, reject) => {
      annotationContainer.remove(annotation);
      resolve(annotation);
    });
  }

  loadDefaultData() {
    $.get({
      url: this.defaultDataUri,
      dataType: 'html',
      success: ((htmlData) => {
        let content = FileContainer.parseHtml(htmlData);
        if (undefined != content) {
          this.useDefaultData = true;
          this._currentContentFileName = undefined;
          this.enableDropdownAnnotationPrimary(true);
          document.getElementById('viewer').innerHTML = content;
          new Searcher();
        }
        globalEvent.emit('resizewindow');
      }).bind(this)
    });
  }

  clearViewer() {
    this.removeAll();
    document.getElementById('viewer').innerHTML = '';
  }

  showReadError(error) {
    const messages = ['Read error.'];
    if (undefined != error) {
      console.log(error);
      if (undefined != error.message) {
        messages.push(error.message);
      }
      if (undefined != error.statusText) {
        messages.push(error.statusText);
      }
    }
    WindowEvent.emit('open-alert-dialog', {message: messages.join('<br />')});
  }

  get currentContentFileName() {
    return this.useDefaultData ?
      this.defaultDataName :
      this._currentContentFileName;
  }

  enableDropdownAnnotationPrimary(enabled) {
    let dropdown = $('#dropdownAnnoPrimary > button.dropdown-toggle')[0];
    if (enabled) {
      dropdown.removeAttribute('disabled', 'disabled');
    } else {
      dropdown.setAttribute('disabled', 'disabled');
    }
  }

  /**
   * Hide Primary/Reference annotation files that match pattern(ReExp).
   * @param target ... 'Primary' or 'Reference'. this is the part of id value. (id="dropdownAnno" + target)
   * @paran pattern .. the JavaScript RegExp object. or null(all NOT hide = all display)
   */ 
  hideAnnotationElements(target, pattern) {
    $(`#dropdownAnno${target} .js-annoname`).each((index, elm) => {
      let listElement = $(elm).closest('li');
      if (null == pattern) {
        listElement.removeClass('hidden');
      } else if (pattern.test(elm.innerText)) {
        listElement.addClass('hidden');
      } else {
        listElement.removeClass('hidden');
      }
    });
  }

  getExportFileName(exportProcess) {
    const inputPanel = $('#export_filename_input'); // this is jQuery object because be used by Bootstrap.
    const submitButton = document.querySelector('#export_filename_input_submit');
    const cancelButton = document.querySelector('#export_filename_input_cancel');

    const submitListener = () => {
      const inputField = document.querySelector('.js-export-file');
      const fileName = inputField.value;
      if (fileName !== '') {
        exportProcess(fileName);
        submitButton.removeEventListener('click', submitListener);
        cancelButton.removeEventListener('click', cancelListener);
        inputPanel.collapse('hide');
      } else {
        alert('Please input file name'); // TODO: 適切に
      }
    };
    const cancelListener = () => {
      submitButton.removeEventListener('click', submitListener);
      cancelButton.removeEventListener('click', cancelListener);
      inputPanel.collapse('hide');

      exportProcess(); // Cancel export
    };
    submitButton.addEventListener('click', submitListener); 
    cancelButton.addEventListener('click', cancelListener);

    inputPanel.collapse('show');
  }
}

module.exports = Htmlanno;
