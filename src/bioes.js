class Bioes {
  constrcutor() {
    this._content = undefined;
    this._annotations = undefined;
  }

  /**
   * Field Separator
   */
  get FS() {
    return "\t";
  }

  /**
   * Line Separator (Regular Expression)
   */
  get LS() {
    return /\r\n|\n|\r/;
  }

  get content() {
    return this._content;
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

    this._content = '';
    this._annotations = [];

    let contentArray = [];
    let currentContentArray = [];
    let currentSpan = undefined;
    bioes.split(this.LS).forEach((line) => {
      if (0 == line.length) {
        contentArray.push(this._contentArrayToString(currentContentArray));
        currentContentArray = [];
      }
      let fsIndex = line.indexOf(this.FS);
      if (-1 != fsIndex) {
        let word = line.substring(0, fsIndex);
        let type = line.substring(fsIndex+1);

        currentContentArray.push(word);
        switch(type[0]) {
           case 'B': // Begin span.
             if (undefined == currentSpan) {
               currentSpan = this._createSpanObject(
                 this._parseLabel(type), currentContentArray
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
                 this._createTomlObj(currentSpan, currentContentArray, contentArray)
               );
               currentSpan = undefined;
             } else {
               // TODO: フォーマットエラー
             }
             break;
           case 'S': // Single a span.
             this._annotations.push(
               this._createTomlObj(
                 this._createSpanObject(this._parseLabel(type), currentContentArray),
                 currentContentArray,
                 contentArray
               )
             );
             break;
           case 'O': // Other.
             break;
           default:
             // Invalid tag, ignore.
        }
      }
      // TODO: フォーマットエラー
    });
    this._content = '<p>' + contentArray.join('</p><p>') + '</p>';
    this._content = this._content.replace(/<p>\s*<\/p>/, '');
    return true;
  }

  _createSpanObject(label, contentArray) {
    return {
      startIndex: (contentArray.length - 1),
      label: label
    };
  }

  _parseLabel(tag) {
    return 1 == tag.length ? tag : tag.substring(2);
  }

  _createTomlObj(spanObject, currentContentArray, contentArray) {
    let beforeContext = this._contentArrayToString(contentArray) + this._contentArrayToString(
      currentContentArray.slice(0, spanObject.startIndex)
    );
    let content = this._contentArrayToString(
      currentContentArray.slice(spanObject.startIndex)
    );
//console.log(beforeContext);
//console.log(content);
    let start = beforeContext.replace(/\s+/g, '').length + 1;
    return {
      type: 'span',
      position: [start, (start + content.replace(/\s+/g, '').length + 1)],
      text: content,
      label: spanObject.label
    };
  }

  _contentArrayToString(contentArray) {
    return contentArray.join(' ');
  }
}

module.exports = Bioes;
