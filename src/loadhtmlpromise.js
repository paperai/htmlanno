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
  const sgmlFunc  = new RegExp(/<\?.+\?>/g);
  const comment   = new RegExp(/<!--.+-->/g);

  const parser = new DOMParser();
  // Htmlanno uses the XHTML, but DOMParser accepted only 'text/html'.
  const content_body = parser.parseFromString(html, 'text/html').body
  content_body.innerHTML = content_body.innerHTML.replace(sgmlFunc, '').replace(comment, '');
  return content_body;
}
