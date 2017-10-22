exports.create = (htmlanno) => {
  return new Promise((resolve, reject) => {
    let pattern = new RegExp(/\.BIOES/);
    htmlanno.hideAnnotationElements('Primary', pattern);
    htmlanno.hideAnnotationElements('Reference', pattern);
    resolve();
  });
};
 
