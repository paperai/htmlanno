const $ = require("jquery");
const Htmlanno = require("./htmlanno.js");
window.$ = $;

const rangy = require("rangy");
require("rangy/lib/rangy-classapplier.js");
require("rangy/lib/rangy-highlighter.js");
require("rangy/lib/rangy-serializer.js");

$(()=>{
  console.log("hello!");
  htmlanno = new Htmlanno();
  window.htmlanno = htmlanno;
});
