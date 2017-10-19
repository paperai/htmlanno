const FileContainer = require('./filecontainer.js');

exports.run = (content, htmlanno) => {
  return Promise.all([
    new Promise((resolve, reject) => {
      let pattern = new RegExp(/\.BIOES/);
      htmlanno.hideAnnotationElements('Primary', pattern);
      htmlanno.hideAnnotationElements('Reference', pattern);
      resolve();
    }),
    new Promise((resolve, reject) => {
      if (undefined == content.content) {
        FileContainer.textLoader(content.source, (text) => {
          if (undefined != text) {
            resolve(text);
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
