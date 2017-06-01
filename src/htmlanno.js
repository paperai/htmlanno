//require("file?name=dist/index.html!./index.html");
//require("!style!css!./pdfanno.css");

/**
 * Start PDFAnno Application.
 */
function startApplication() {
    const $ = require("jquery");
    const Htmlanno = require("./core/htmlanno.js");
    window.$ = $;
    window.htmlanno = new Htmlanno();
}

/**
 *  The entry point.
 */
window.addEventListener('DOMContentLoaded', e => {

    // Delete prev annotations.
    //if (location.search.indexOf('debug') === -1) {
    //clearAllAnnotations();
    //}

    // Reset PDFViwer settings.
    //resetPDFViewerSettings();

    // Start application.
    startApplication();
});
