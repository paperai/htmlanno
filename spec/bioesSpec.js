const Bioes = require('../src/bioes.js');

describe('Bioes', () => {
  let instance = undefined;
  beforeEach(() => {
    instance = new Bioes();
  });
  it('instance of initial status should have  undefined content and annotations.', () => {
    expect(instance.content).toBeUndefined();
    expect(instance.annotations).toBeUndefined();
  });
  

  it('FS is the Field Separator.', () => {
    expect(instance.FS).toBe("\t");
  });

  it('LS is the Line Separator.', () => {
    expect(instance.LS).toEqual(/\r\n|\n|\r/);
  });

  describe('parse()', () => {
    it('should parse String argument, and return an object that is { content: <String>, annotations: <Array> }', () => {
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

West	B-MISC
Indian	E-MISC
all-rounder	O
Phil	B-PER
Simmons	E-PER
`;
      let result = instance.parse(src);
      expect(result).toBeTruthy();

      expect(instance.content).toBe('<p>-DOCSTART-</p><p>CRICKET - LEICESTERSHIRE TAKE OVER AT TOP AFTER INNINGS VICTORY .</p><p>CRICKET - ENGLISH COUNTY CHAMPIONSHIP SCORES .</p><p>West Indian all-rounder Phil Simmons</p>');
       expect(instance.annotations).toBeDefined();
       expect(instance.annotations.length).toBe(4);
       expect(instance.annotations[0]).toEqual({
         type: 'span',
         position: [20, 34],
         text: 'LEICESTERSHIRE',
         label: 'ORG'
       });
       expect(instance.annotations[1]).toEqual({
         type: 'span',
         position: [85, 112],
         text: 'ENGLISH COUNTY CHAMPIONSHIP',
         label: 'MISC'
       });
       expect(instance.annotations[2]).toEqual({
         type: 'span',
         position: [121, 132],
         text: 'West Indian',
         label: 'MISC'
       });
       expect(instance.annotations[3]).toEqual({
         type: 'span',
         position: [145, 157],
         text: 'Phil Simmons',
         label: 'PER'
       });
    });
  });
});
