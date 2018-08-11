const FileContainer = require('../src/filecontainer.js');

class DummyFileObj {
  constructor(_path) {
    this.path = _path;
  }
      
  get webkitRelativePath() {
    return this.path;
  }
}

describe('FileContainer', () => {
  let instance;
  beforeEach(() => {
    instance = new FileContainer();
  });

  it('Constructor', () => {
    expect(instance._contents.length).toBe(0);
    expect(instance._annotations.length).toBe(0);
  });

  describe('loadFiles', () => {
    //pending('このテストはWeb APIのFileオブジェクトが必要になるので保留。');
    it('', () => {
      let uncategorizedFiles = [
        new DummyFileObj('./fixtures/fileloader/main.htmlanno')
      ];
      let result = instance.loadFiles(uncategorizedFiles);

      expect(result instanceof Promise).toBeTruthy();
      result.then((results) => {
        console.log(results);
      });
    });
    
  });
  describe('_categorize', () => {
    it('should return the Array, that includes 4 Array, that includes categorized file.', () => {
      let uncategorizedFiles = [
        new DummyFileObj('test1.xhtml'),
        new DummyFileObj('test2.txt'),
        new DummyFileObj('test3.htmlanno'),
        new DummyFileObj('test4.BIOES'),
        new DummyFileObj('test1.htmlanno'),
        new DummyFileObj('test2.BIOES')
      ];
      let result = instance._categorize(uncategorizedFiles);

      expect(result.length).toBe(4);
      // XHTML
      expect(result[0]).toEqual([uncategorizedFiles[0]]);
      // Plain text
      expect(result[1]).toEqual([uncategorizedFiles[1]]);
      // Annotation
      expect(result[2]).toEqual([uncategorizedFiles[2], uncategorizedFiles[4]]);
      // BIOES
      expect(result[3]).toEqual([uncategorizedFiles[3], uncategorizedFiles[5]]);
    });

    it('called with only XHTML files, should return the Arrary , the 1st element has XHTML file, and other elements is empty.', () => {
      let xhtmlonly = [new DummyFileObj('test1.xhtml'), new DummyFileObj('test2.XHTML')];
      let result = instance._categorize(xhtmlonly);

      expect(result.length).toBe(4);
      expect(result[0]).toEqual(xhtmlonly);
      [1,2,3].forEach((index) => {
        expect(result[index].length).toBe(0);
      });
    });

    it('called with only Plain text files, should return the Arrary , the 2nd element has Plain text file, and other elements is empty.', () => {
      let textonly = [new DummyFileObj('test1.txt'), new DummyFileObj('test2.TXT')];
      let result = instance._categorize(textonly);

      expect(result.length).toBe(4);
      expect(result[1]).toEqual(textonly);
      [0,2,3].forEach((index) => {
        expect(result[index].length).toBe(0);
      });
    });

    it('called with only Annotation files, should return the Arrary , the 3rd element has Annotation file, and other elements is empty.', () => {
      let annoonly = [new DummyFileObj('test1.htmlanno'), new DummyFileObj('test2.HTMLANNO')];
      let result = instance._categorize(annoonly);

      expect(result.length).toBe(4);
      expect(result[2]).toEqual(annoonly);
      [0,1,3].forEach((index) => {
        expect(result[index].length).toBe(0);
      });
    });

    it('called with only BIOES files, should return the Arrary , the 4th element has BIOES file, and other elements is empty.', () => {
      let bioesonly = [new DummyFileObj('test1.BIOES'), new DummyFileObj('test2.bioes')];
      let result = instance._categorize(bioesonly);

      expect(result.length).toBe(4);
      expect(result[3]).toEqual(bioesonly);
      [0,1,2].forEach((index) => {
        expect(result[index].length).toBe(0);
      });
    });
  });
  describe('_createBioesContents', () => {
    it('should add content object to this._contents, Object is {type: "bioes", name: fileName(without basepath), content: undefined, source: fileBlob, selected: false }.', () => {
      // This process does not accessed file in real.
      let files = [
        new DummyFileObj('fixtures/fileloaders/sample.BIOES'),
        new DummyFileObj('sample.BIOES'),
        new DummyFileObj('/sample.BIOES')
      ];
      expect(instance.contents.length).toBe(0);
      let result = instance._createBioesContents(files);

      expect(instance._contents.length).toBe(3);
      instance.contents.forEach((elm, index) => {
        expect(elm.type).toBe('bioes');
        expect(elm.name).toBe('sample.BIOES');
        expect(elm.content).toBeUndefined();
        expect(elm.source).toBe(files[index]);
        expect(elm.selected).toBeFalsy();
      });
    });
  });
});
