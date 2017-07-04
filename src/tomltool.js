exports.saveToml = (annotationMaps)=>{
  let data = ["version = 0.1\n"];
  let counter = 1;
  annotationMaps.forEach((annotationMap)=>{
    annotationMap.forEach((annotation)=>{
      data.push(`[${counter}]`);
      data.push(`${annotation.saveToml()}`);
      counter ++;
    });
  });
  return data;
};
