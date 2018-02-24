const AnnoUI = require('anno-ui');
const Highlight = require('./highlight.js');

class Search {
  constructor() {
    this.searchHighlights = [];
    AnnoUI.searchUI.setup({
      pages:                this.htmlAnnoPages,
      scrollTo:             this.scrollTo.bind(this),
      searchResultRenderer: this.searchResultRenderer.bind(this),
      resetUIAfter:         this.resetUI.bind(this)
    });
    AnnoUI.searchUI.enableSearchUI();

    this.scrollArea = $('#viewerWrapper');
  }

  /**
   * returns #viewer.innerText(current text-node and all this children text-nodes) as a Page object.
   */
  get htmlAnnoPages() {
    return [{
      body: $('#viewer').text()
    }];
  }

  /**
   * Scroll to the hit position.
   */
  scrollTo(searchPosition) {
    const promises = [];
    for(let index = 0; index < this.searchHighlights.length; index ++) {
      promises.push(new Promise((resolve, reject) => {
        this.searchHighlights[index].removeClass(Search.currentClassName);
        resolve(index);
      }));
    }
    promises.push(new Promise((resolve, reject) => {
      this.searchHighlights[searchPosition].addClass(Search.currentClassName);
      this.scrollArea[0].scrollTop =
        this.searchHighlights[searchPosition].scrollOffset - this.scrollArea.offset().top;
      resolve(searchPosition);
    }));
    return Promise.all(promises);
  }

  /**
   * Render hit results for the seachWord.
   * @param positions ... hit positions; { start: startIndex, end: startIndex + searchWord.length }
   * @param page ... this is equals to document.getElementById('viewer').innerHTML
   * @param searchWord ... query word
   */
  searchResultRenderer(positions, page, searchWord) {
    const promises = [];
    positions.forEach((pos) => {
      promises.push(new Promise((resolve, reject) => {
        const highlight = new Highlight(pos.start, pos.end, Search.searchHighlightClassName);
        this.searchHighlights.push(highlight);
        resolve(highlight);
      }));
    });
    if (0 != positions.length) {
      promises.push(new Promise((resolve, reject) => {
        this.scrollTo(0);
        resolve();
      }));
    }
    return Promise.all(promises);
  }

  /**
   * Remove all the search-highlight and destroy all search result object.
   */
  resetUI() {
    return Promise.all([
      new Promise((resolve, reject) => {
        $(`.${Search.searchHighlightClassName}`).each((_i, elm) => {
          $(elm).replaceWith(elm.childNodes);
        });
        resolve();
      }),
      new Promise((resolve, reject) => {
        this.searchHighlights = [];
        resolve();
      })
    ]);
  }

  static get searchHighlightClassName() {
    return 'htmlanno-search-result';
  }

  static get currentClassName() {
    return 'htmlanno-search-result-current';
  }
}

module.exports = Search;
