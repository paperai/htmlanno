const FileContainer = require('./filecontainer.js');

/**
 * @param content ... Content object or Annotation object
 * @param htmlanno .. Htmlanno object
 *
 * If content has `subtype` attribute and this value is `bioes`, content is (BIOES) Annotation object.
 */
exports.run = (content, htmlanno) => {
  return Promise.all([
    new Promise((resolve, reject) => {
      let pattern = new RegExp(/\.htmlanno/);
      htmlanno.hideAnnotationElements('Primary', pattern);
      htmlanno.hideAnnotationElements('Reference', pattern);
      resolve();
    }),
    new Promise((resolve, reject) => {
      let annotation = 'bioes' == content.subtype ?
        content :
        htmlanno.fileContainer.getAnnotation(content.name);
      if (undefined == content.content) {
        FileContainer.bioesLoader(content.source, (bioes) => {
          if (undefined == bioes) {
            reject();
          } else {
            annotation.content = bioes.annotations;
            annotation.source = undefined;
            const bodyObj = document.createElement('body');
            bodyObj.innerHTML = bioes.content;
            resolve({content: bodyObj, annotation: annotation});
          }
        });
      } else {
        annotation.primary = true;
        resolve({content: content.content, annotation: annotation});
      }
    })
  ]);
};
