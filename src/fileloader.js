class FileLoader{
  constructor(contents, annotations){
    this.contents = contents;
    this.annotations = annotations
  }

  /**
   * @param files ... Array of File(Blob)
   *
   * @return Promise({contents, annotations}) or Promise(cannot_read_filename)
   */
  loadFiles(files) {
    let categoraizedFiles = this._categorize(files);
    let _this = this;
    return new Promise((masterResolve, masterReject) => {
      let rejects = [];
      Promise.all(
        this._createHtmlLoadingPromiseList(categoraizedFiles[0])
      ).then(
        (results) => { _this._merge(results, _this.contents); },
        (reject)  => { rejects.push(rejects); }
      );
      Promise.all(
        this._createTextLoadingPromiseList(categoraizedFiles[1])
      ).then(
        (results) => { _this._merge(results, _this.contents); },
        (reject)  => { rejects.push(rejects); }
      );
      Promise.all(
        this._createAnnotationLoadingPromiseList(categoraizedFiles[2])
      ).then(
        (results) => { _this._merge(results, _this.annotations); },
        (reject)  => { rejects.push(rejects); }
      );

      if (0 == rejects.length) {
        masterResolve({
          contents: _this.contents,
          annotations: _this.annotations}
        );
      } else {
        masterReject(rejects);
      }
    });
  }

  _createHtmlLoadingPromiseList(files) {
    let promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = ()=>{
          if (reader.result.match(/<html\s?.*>/i)){
            let html = reader.result;
            let bodyStart = html.match(/<body\s?.*>/im);
            let bodyEnd   = html.search(/<\/body>/im);
            if (null != bodyStart && -1 != bodyEnd){
              html = html.substring(
                (bodyStart.index + bodyStart[0].length), bodyEnd
              );
            }
            html = html.replace(/<\?.+\?>/g, '').replace(/<!--.+-->/g, '');

            resolve({
              type   : 'html',
              name   : this._excludeBaseDirName(file.webkitRelativePath),
              content: html
            });
          } else{
            reject(file); // must read as Plain text.
          }
        };
        reader.onerror = this._loadError;
        reader.onabort = this._loadAbort;

        reader.readAsText(file);
      }));
    });
    return promises;
  }

  _createTextLoadingPromiseList(files) {
    let promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = ()=>{
          resolve({
            type   : 'text',
            name   : this._excludeBaseDirName(file.webkitRelativePath),
            content: reader.result
          });
        };
        reader.onerror = this._loadError;
        reader.onabort = this._loadAbort;

        reader.readAsText(file);
      }));
    });
    return promises;
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
            content: reader.result
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
    let htmlMatcher  = new RegExp(/.+\.html?$/i); // htm or html
    let textMatcher  = new RegExp(/.+\.txt$/i);
    let annoMatcher = new RegExp(/.+\.anno$/i);

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
