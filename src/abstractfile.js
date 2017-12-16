class AbstractFile {
  constrcutor() {
  }

  readFile(file, callback) {
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result);
    };
    reader.onerror = () => {callback(undefined); };
    reader.onabort = () => {callback(undefined); };

    reader.readAsText(file);
  }
}
module.exports = AbstractFile;
