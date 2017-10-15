class FileContainer {
  constructor() {
    this._contents = [];
    this._annotations = [];
  }

  /**
   * @param files ... Array of File(Blob)
   *
   * @return Promise({contents, annotations}) or Promise(cannot_read_filename)
   */
  loadFiles(files) {
    this._contents = [];
    this._annotations = [];
    let categoraizedFiles = this._categorize(files);

    return Promise.all([
      new Promise((resolve, reject) => {
        this._createHtmlContents(categoraizedFiles[0]);
        resolve(true);
      }).then(),
      new Promise((resolve, reject) => {
        this._createTextContents(categoraizedFiles[1])
        resolve(true);
      }).then(),
      Promise.all(
        this._createAnnotationLoadingPromiseList(categoraizedFiles[2])
      ).then(this._mergeAnnotations.bind(this)),
      new Promise((resolve, reject) => {
        this._createBioesContents(categoraizedFiles[3]);
        resolve(true);
      })
    ]).then(this._allResult.bind(this));
  }

  /**
   * @param fileName ... maybe equal to this.contents[n].name
   * @return this.contents[n] or null
   *
   * contents[n] = {
   *   type    : 'html' or 'text'
   *   name    : fileName
   *   content : undefined or HTML soruce or Plain text
   *   source  : File object or undefined
   *   selected: boolean 
   * }
   * If content is undefined, you need get content by source. and after load, set the content to content, and set undefined to source.
   */
  getContent(fileName) {
    return this._getItem(fileName, this._contents);
  }

  /**
   * @param fileName ... maybe equal to this.annotations[n].name
   * @return this.annotations[n] or null
   *
   * annotation[n] = {
   *   type     : 'annotation'
   *   subtype  : 'bioes' or undefined (Using only BIOES annotation)
   *   name     : fileName
   *   content  : TOML source or undefined (When it is undefined, source must be defined.)
   *   source   : File object or undefined
   *   primary  : boolean
   *   reference: boolean
   * }
   */
  getAnnotation(fileName) {
    return this._getItem(fileName, this._annotations);
  }

  getAnnotations(fileNames) {
    let annotations = [];
    fileNames.forEach((fileName) => {
      let anno = this.getAnnotation(fileName);
      if (null != anno) {
        annotations.push(anno);
      }
    });
    return annotations;
  }

  // TODO: Needless...?
  addAnnotation(fileName, annotation) {
    let old = this.getAnnotation(fileName);
    if (null == old) {
      this._annotations.push({
        type: 'annotation',
        name: fileName,
        content: annotation,
        primary: false,
        reference: false
      });
      return true;
    } else {
      return false;
    }
  }

  /**
   * All contents array getter.
   * @return this._contents(reference)
   */
  get contents() {
    return this._contents;
  }

  /**
   * All annotations array getter.
   * @return this._annotations(reference)
   */
  get annotations() {
    return this._annotations;
  }

  /**
   * Read `file`, parse read result as HTML, and call `callback` with parse result.
   * @param file ... HTML file name
   * @param callback ... callback(read result) or callback(undefined)
   * @see FileContainer.parseHtml
   */ 
  static htmlLoader(file, callback) {
    let reader = new FileReader();
    reader.onload = () => {
      callback(FileContainer.parseHtml(reader.result));
    };
    reader.onerror = () => {callback(undefined); };
    reader.onabort = () => {callback(undefined); };

    reader.readAsText(file);
  }

  /**
   * Read `file`, and call `callback` with read result that wrapped `<p>` tag.
   * @param file ... Plain text file name
   * @param callback ... callback(read result) or callback(undefined)
   */
  static textLoader(file, callback) {
    let reader = new FileReader();
    reader.onload = ()=>{
      callback('<p>' + reader.result + '</p>');
    };
    reader.onerror = () => {callback(undefined); };
    reader.onabort = () => {callback(undefined); };

    reader.readAsText(file);
  }

  static parseHtml(html) {
    let sgmlFunc  = new RegExp(/<\?.+\?>/g);
    let comment   = new RegExp(/<!--.+-->/g);
    let htmlTag = new RegExp(/<html\s?.*>/i);

    if (null != html.match(htmlTag)) {
      let bodyStart = html.match(/<body\s?.*>/im);
      let bodyEnd   = html.search(/<\/body>/im);
      if (null != bodyStart && -1 != bodyEnd){
        html = html.substring((bodyStart.index + bodyStart[0].length), bodyEnd);
      }
      return html.replace(sgmlFunc, '').replace(comment, '');
    } else {
      return undefined;
    }
  }

  _getItem(name, container) {
    for(let i = 0; i < container.length; i ++) {
      if (container[i].name === name) {
        return container[i];
      }
    }
    return null;
  }

  _createHtmlContents(files) {
    files.forEach((file) => {
      this._contents.push({
        type   : 'html',
        name   : this._excludeBaseDirName(file.webkitRelativePath),
        content: undefined,
        source : file,
        selected: false
      });
    });
  }

  _createTextContents(files) {
    files.forEach((file) => {
      this._contents.push({
        type   : 'text',
        name   : this._excludeBaseDirName(file.webkitRelativePath),
        content: undefined,
        source: file,
        selected: false
      });
    });
  }

  _createBioesContents(files) {
    files.forEach((file) => {
      this._contents.push({
        type    : 'bioes',
        name    : this._excludeBaseDirName(file.webkitRelativePath),
        content : undefined,
        source  : file,
        selected: false
      });
      this._annotations.push({
        type     : 'annotation',
        subtype  : 'bioes',
        name     : this._excludeBaseDirName(file.webkitRelativePath),
        content  : undefined,
        source   : file,
        primary  : false,
        reference: false
      });
    });
  }

  _createAnnotationLoadingPromiseList(files) {
    let promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = ()=>{
          resolve({
            type     : 'annotation',
            subtype  : undefined,
            name     : this._excludeBaseDirName(file.webkitRelativePath),
            content  : reader.result,
            source   : undefined,
            primary  : false,
            reference: false
          });
        };
        reader.onerror = () => { alert("Load failed."); };  // TODO: UI実装後に適時変更
        reader.onabort = () => { alert("Load aborted."); }; // TODO: UI実装後に適宜変更

        reader.readAsText(file);
      }));
    });
    return promises;
  }

  _categorize(files){
    let htmlMatcher  = new RegExp(/.+\.xhtml$/i);
    let textMatcher  = new RegExp(/.+\.txt$/i);
    let annoMatcher  = new RegExp(/.+\.htmlanno$/i);
    let bioesMatcher = new RegExp(/.+\.BIOES$/i);

    let htmlNames  = [];
    let textNames  = [];
    let annoNames  = [];
    let bioesNames = [];
    for(let i = 0;i < files.length; i ++ ){
      let file = files[i];

      let fragments = file.webkitRelativePath.split('/');
      if (2 >= fragments.length){
        let fileName = fragments.pop();
        if (htmlMatcher.test(fileName)){
          htmlNames.push(file);
        } else if (textMatcher.test(fileName)){
          textNames.push(file);
        } else if (annoMatcher.test(fileName)){
          annoNames.push(file);
        } else if (bioesMatcher.test(fileName)){
          bioesNames.push(file);
        }
      }        
      // else, skip it.
    }
    return [
      htmlNames,
      textNames,
      annoNames,
      bioesNames
    ];
  }

  _excludeBaseDirName(filePath){
    let fragments = filePath.split('/');
    return fragments[fragments.length - 1];
  }

  /**
   * For loadFiles()
   */
  _merge(fromArray, toArray) {
    fromArray.forEach((elm) => {
      toArray.push(elm);
    });
  }
  /**
   * For loadFiles()
   */
  _mergeContents(results) {
    this._merge(results, this._contents);
  }
  /**
   * For loadFiles()
   */
  _mergeAnnotations(results) {
    this._merge(results, this._annotations);
  }
  /**
   * For loadFiles()
   */
  _allResult(all_results) {
    return Promise.resolve({
      contents: this._contents,
      annotations: this._annotations
    });
  }

}
module.exports = FileContainer;
