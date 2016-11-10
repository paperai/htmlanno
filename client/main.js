const $ = require("jquery");
const Htmlanno = require("./htmlanno.js");

$(()=>{
  console.log("hello");
  htmlanno = new Htmlanno();
  window.htmlanno = htmlanno;
});

