class FileLoader{
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
    let _this = this;
    return Promise.all([
      Promise.all(
        this._createHtmlLoadingPromiseList(categoraizedFiles[0])
      ).then(
        (results) => { _this._merge(results, _this._contents); }
      ),
      Promise.all(
        this._createTextLoadingPromiseList(categoraizedFiles[1])
      ).then(
        (results) => { _this._merge(results, _this._contents); }
      ),
      Promise.all(
        this._createAnnotationLoadingPromiseList(categoraizedFiles[2])
      ).then(
        (results) => { _this._merge(results, _this._annotations); }
      )
    ]).then(
      (all_results) => {
        return Promise.resolve({
          contents: _this._contents,
          annotations: _this._annotations
        });
      }
    );
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
   *   name     : fileName
   *   content  : TOML source
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

  get contents() {
    return this._contents;
  }

  get annotations() {
    return this._annotations;
  }

  _getItem(name, container) {
    for(let i = 0; i < container.length; i ++) {
      if (container[i].name === name) {
        return container[i];
      }
    }
    return null;
  }

  _createHtmlLoadingPromiseList(files) {
    return files.map((file) => {
      return new Promise((resolve, reject) => {
        resolve({
          type   : 'html',
          name   : this._excludeBaseDirName(file.webkitRelativePath),
          content: undefined,
          source : file,
          selected: false
        });
      });
    });
  }

  static htmlLoader(file, callback) {
    let reader = new FileReader();
    reader.onload = () => {
      callback(FileLoader.parseHtml(reader.result));
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

  _createTextLoadingPromiseList(files) {
    return files.map((file) => {
      return new Promise((resolve, reject) => {
        resolve({
          type   : 'text',
          name   : this._excludeBaseDirName(file.webkitRelativePath),
          content: undefined,
          source: file,
          selected: false
        });
      });
    });
  }

  static textLoader(file, callback) {
    let reader = new FileReader();
    reader.onload = ()=>{
      callback(reader.result);
    };
    reader.onerror = () => {callback(undefined); };
    reader.onabort = () => {callback(undefined); };

    reader.readAsText(file);
  }

  _createAnnotationLoadingPromiseList(files) {
    let promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = ()=>{
          resolve({
            type   : 'annotation',
            name   : this._excludeBaseDirName(file.webkitRelativePath),
            content: reader.result,
            primary: false,
            reference: false
          });
        };
        reader.onerror = this._loadError;
        reader.onabort = this._loadAbort;

        reader.readAsText(file);
      }));
    });
    return promises;
  }

  _categorize(files){
    let htmlMatcher  = new RegExp(/.+\.xhtml$/i);
    let textMatcher  = new RegExp(/.+\.txt$/i);
    let annoMatcher = new RegExp(/.+\.htmlanno$/i);

    let htmlNames = [];
    let textNames = [];
    let annoNames = [];
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
        }
      }        
      // else, skip it.
    }
    return [
      htmlNames,
      textNames,
      annoNames
    ];
  }

  _excludeBaseDirName(filePath){
    let fragments = filePath.split('/');
    return fragments[fragments.length - 1];
  }

  _loadError(file){
    alert("Load failed.");  // TODO: UI実装後に適時変更
  }

  _loadAbort(file){
    alert("Load aborted."); // TODO: UI実装後に適宜変更
  }

  _merge(fromArray, toArray) {
    fromArray.forEach((elm) => {
      toArray.push(elm);
    });
  }

}
module.exports = FileLoader;
