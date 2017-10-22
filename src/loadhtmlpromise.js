const FileContainer = require('./filecontainer.js');
const HideBioesAnnotation = require('./hidebioesannotation.js');

exports.run = (content, htmlanno) => {
  return Promise.all([
    HideBioesAnnotation.create(htmlanno),
    new Promise((resolve, reject) => {
      if (undefined == content.content) {
        FileContainer.htmlLoader(content.source, (html) => {
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
