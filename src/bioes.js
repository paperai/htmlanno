class Bioes {
  constrcutor() {
    this._context = undefined;
    this._annotations = undefined;
  }

  /**
   * Field Separator
   */
  get FS() {
    return "\t";
  }

  /**
   * Line Separator
   */
  get LS() {
    return "\n";
  }

  get context() {
    return this._context;
  }

  get annotations() {
    return this._annotations;
  }

  /**
   * @params bioes ... String object of BIOES format.
   */
  parse(bioes) {
    if (undefined === bioes) {
      return undefined;
    }

    this._context = '';
    this._annotations = [];

    let contextArray = [];
    let currentSpan = undefined;
    bioes.split(this.LS).forEach((line) => {
      if (0 == line.length) {
        this._context =
          this._context +
          this._contextArrayToString(contextArray) + 
          "\n";
        contextArray = [];
      }
      let fsIndex = line.indexOf(this.FS);
      if (-1 != fsIndex) {
        let word = line.substring(0, fsIndex);
        let type = line.substring(fsIndex+1);

        contextArray.push(word);
        switch(type[0]) {
           case 'B': // Begin span.
             if (undefined == currentSpan) {
               currentSpan = this._createSpanObject(
                 this._parseLabel(type), contextArray
               );
             } else {
               // TODO: フォーマットエラー
               // ignore inner span.
             }
             break;
           case 'I': // Internal of span.
             // if (undefined == currentSpan) {
             // TODO: フォーマットエラー
             // }
             break;
           case 'E': // End span.
             if (undefined != currentSpan) {
               this._annotations.push(
                 this._createTomlObj(currentSpan, contextArray)
               );
               currentSpan = undefined;
             } else {
               // TODO: フォーマットエラー
             }
             break;
           case 'S': // Single a span.
             this._annotations.push(
               this._createTomlObj(
                 this._createSpanObject(this._parseLabel(type)),
                 [word]
               )
             );
             break;
           case 'O': // Other.
             break;
           default:
             // Invalid tag, ignore.
        }
      } else {
        // TODO: フォーマットエラー
        return undefined;
      }
    });
    this._context = this._context + this._contextArrayToString(contextArray);
    return true;
  }

  _createSpanObject(label, contextArray = undefined) {
    return {
      startIndex: (undefined == contextArray ? 0 : (contextArray.length - 1)),
      label: label
    };
  }

  _parseLabel(tag) {
    return 1 == tag.length ? tag : tag.substring(2);
  }

  _createTomlObj(spanObject, contextArray) {
    let beforeContext = this._contextArrayToString(
      contextArray.slice(0, spanObject.startIndex)
    );
    let context = this._contextArrayToString(
      contextArray.slice(spanObject.startIndex)
    );
    let start = this._context.length + beforeContext.length;
    return {
      type: 'span',
      position: [start, (start + context.length)],
      text: context,
      label: spanObject.label
    };
  }

  _contextArrayToString(contextArray) {
    return contextArray.join(' ');
  }
}

module.exports = Bioes;
