const Bioes = require('../src/bioes.js');

describe('Bioes', () => {
  let instance = undefined;
  beforeEach(() => {
    instance = new Bioes();
  });
  it('instance of initial status should have  undefined context and annotations.', () => {
    expect(instance.context).toBeUndefined();
    expect(instance.annotations).toBeUndefined();
  });
  

  it('FS is the Field Separator.', () => {
    expect(instance.FS).toBe("\t");
  });

  it('LS is the Line Separator.', () => {
    expect(instance.LS).toBe("\n");
  });

  describe('parse()', () => {
    it('should parse String argument, and return an object that is { context: <String>, annotations: <Array> }', () => {
      let src = `-DOCSTART-	O

CRICKET	O
-	O
LEICESTERSHIRE	S-ORG
TAKE	O
OVER	O
AT	O
TOP	O
AFTER	O
INNINGS	O
VICTORY	O
.	O

CRICKET	O
-	O
ENGLISH	B-MISC
COUNTY	I-MISC
CHAMPIONSHIP	E-MISC
SCORES	O
.	O
`;
      let result = instance.parse(src);
      expect(result).toBeTruthy();

      expect(instance.context).toBe(`-DOCSTART-
CRICKET - LEICESTERSHIRE TAKE OVER AT TOP AFTER INNINGS VICTORY .
CRICKET - ENGLISH COUNTY CHAMPIONSHIP SCORES .
`);
       expect(instance.annotations).toBeDefined();
       expect(instance.annotations.length).toBe(2);
       expect(instance.annotations[0]).toBe({
         type: 'span',
         position: [23, 36],
         text: 'LEICESTERSHIRE',
         label: 'ORG'
       });
       expect(instance.annotations[1]).toBe({
         type: 'span',
         position: [89, 115],
         text: 'ENGLISH COUNTY CHAMPIONSHIP',
         label: 'MISC'
       });
    });
  });
});
