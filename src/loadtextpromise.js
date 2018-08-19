const FileContainer = require('./filecontainer.js');
const HideBioesAnnotation = require('./hidebioesannotation.js');

exports.run = (content, htmlanno) => {
  return Promise.all([
    HideBioesAnnotation.create(htmlanno),
    new Promise((resolve, reject) => {
      if (undefined == content.content) {
        FileContainer.textLoader(content.source, (text) => {
          if (undefined != text) {
            const bodyObj = document.createElement('body');
            bodyObj.innerHTML = text;
            resolve(bodyObj);
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
