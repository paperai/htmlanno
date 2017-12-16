const AbstractFile = require('./abstractfile.js');
const HideBioesAnnotation = require('./hidebioesannotation.js');

exports.run = (content, htmlanno) => {
  return Promise.all([
    HideBioesAnnotation.create(htmlanno),
    new Promise((resolve, reject) => {
      if (undefined == content.content) {
        htmlLoader(content.source, (html) => {
          if (undefined != html) {
            resolve(html);
          } else {
            reject();
          }
        });
      } else {
        resolve(content.content);
      }
    })
  ]);
};

exports.createContainer = (name, content, source) => {
  return {
    type   : 'html',
    name   : name,
    content: content,
    source : source,
    selected: false
  };
};
 
/**
 * Read `file`, parse read result as HTML, and call `callback` with parse result.
 * @param file ... HTML file object
 * @param callback ... callback(read result) or callback(undefined)
 * @see parseHtml
 */
function htmlLoader(file, callback) {
  // TODO: LoadHtmlPromise自体をクラス化後、ベースクラスとして継承する形に変更
  (new AbstractFile()).readFile(file, (read_result) => {
    if (undefined == read_result) {
      callback(undefined);
    } else {
      callback(parseHtml(read_result));
    }
  });
}

function parseHtml(html) {
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
