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
