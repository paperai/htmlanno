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

    // '<p>xxx<p><p>yyy zzz</p><p>111</p>
    this._content = '';
    // The array includes Toml Object.
    this._annotations = {spans: []};

    // ['xxx', 'yyy zzz, '111', ...]
    let contentArray = [];
    // ['yyy', 'zzz']
    let currentContentArray = [];
    // Toml object
    let currentSpan = undefined;
    bioes.split(this.LS).forEach((line) => {
      if (0 == line.length) {
        // Next paragraph.
        this._createParagraph(currentContentArray, contentArray);
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
               this._appendAnnotation(
                 this._createTomlObj(currentSpan, currentContentArray, contentArray)
               );
               currentSpan = undefined;
             } else {
               // TODO: フォーマットエラー
             }
             break;
           case 'S': // Single a span.
             this._appendAnnotation(
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
    this._createParagraph(currentContentArray, contentArray);
    this._content = this._contentArrayToString(contentArray);
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

  _createParagraph(currentContentArray, contentArray) {
    if (0 < currentContentArray.length) {
      contentArray.push(currentContentArray.join(' '));
    }
  }

  _createTomlObj(spanObject, currentContentArray, contentArray) {
    let beforeContent =
      contentArray.join('') +
      currentContentArray.slice(0, spanObject.startIndex).join(' ');
    let content = currentContentArray.slice(spanObject.startIndex).join(' ');
    
    let start = beforeContent.length;
    // Add the last space before context.
    start += 0 == spanObject.startIndex ? 0: 1;
    return {
      id: undefined,
      textrange: [start, (start + content.length)],
      text: content,
      label: spanObject.label
    };
  }

  _contentArrayToString(contentArray) {
    return `<p>${contentArray.join('</p><p>')}</p>`;
  }

  _appendAnnotation(span) {
    span.id = `${this._annotations.spans.length + 1}`;
    this._annotations.spans.push(span);
  }
}

module.exports = Bioes;
