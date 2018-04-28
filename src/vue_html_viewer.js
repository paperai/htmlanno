import Vue from 'vue'
import $  from 'jquery'
import axios from 'axios'
import SpanAnnotation from './spanannotation'
const TomlParser = require('toml')

window.$ = $

/**
 * Register `html-viewer` component.
 * This is viewer of (X)HTML format.
 * Usage:
 * `<html-viewer :annotation_uri="annotation_uri"></html-viewer>`
 */
export default () => {
  Vue.component('html-viewer', {
    template: '#html_viewer_template',
    props: {
      // File object or String(URI)
      annotation_uri: {
        required: false
      },
      content_uri: {
        type: String,
        required: true
      }
    },
    data: () => {
      return {
        content_length: 0,
        // contents := [<content>, <content>,...]
        // content  := {startOffset: <offset>, id: <ID for content part>, content: <content part>}
        // offset   := the offset from start of all text content that ignored HTML tag.
        contents: [],
        content: '',
      };
    },
    watch: {
      content_uri: function () {
        this.loadUri(this.content_uri).then(this.setContent)
      },
      annotation_uri: function () {
        this.loadUri(this.annotation_uri).then((resolve, reject) => {
          this.setAnnotation(TomlParser.parse(resolve))
        })
      },
    },
    methods: {
      // TODO: この処理はBIOES、HTML共通
      loadUri: (uri) => {
        return new Promise((resolve, reject) => {
          if (typeof(uri) === 'string') {
            axios.get(uri).then((http_response) => {
              resolve(http_response.data)
            })
          } else {
            // File object
            const reader = new FileReader()
            reader.onload = () => {
              resolve(reader.result)
            }
            reader.onerror = () => { alert("Load failed."); };  // TODO: UI実装後に適時変更
            reader.onabort = () => { alert("Load aborted."); }; // TODO: UI実装後に適宜変更
            reader.readAsText(uri) 
          }
        })
      },
      setContent: function(html_src) {
        const parser = new DOMParser()
        // Htmlanno uses the XHTML, but DOMParser accepted only 'text/html'.
        const contentBody = parser.parseFromString(html_src, 'text/html').body

        this.contents = []
        this.content_length = this._calculate_offset_and_register(contentBody, 0)
        this.content = contentBody.innerHTML
      },
      _calculate_offset_and_register: function (htmlnode, parent_offset) {
        let last_offset = parent_offset
        for(let index = 0; index < htmlnode.childNodes.length; index ++) {
          const current_node = htmlnode.childNodes[index]
          if (!current_node.nodeName.startsWith('#')) {
            current_node.setAttribute('data-htmlanno-id', this.contents.length + 1)
            this.contents.push({
              offset: last_offset,
              id: `htmlanno-content-${index + 1}`,
            });
            last_offset += current_node.textContent.length
          }
        }
        return last_offset;
      },
      _findPositionIncluded: (position, contents) => {
        let index;
        for(index = 0; index < contents.length; index ++) {
          if (contents[index].offset > position) {
            return (index - 1)
          }
        }
        // TODO: おそらくはここの判定にバグがあり、最終行のアノテーションレンダリングが実行されていません
        return contents[index -1].offset > position && this.content_length <= position ? (index - 1) : -1;
      },
      setAnnotation: function(annotations) {
        const promises = [];
       
        // TODO: このforループ内はHighlighter#addToml辺りに相当します。
        // TODO: 主処理に配置しておく必要はなく、あまりよい構成ではないので整理・分離すべきです
        for(let index in annotations) {
          if (annotations[index].type === 'span') {
            promises.push(new Promise((resolve, reject) => {
              const start_index = this._findPositionIncluded(annotations[index].position[0], this.contents);
              const end_index = this._findPositionIncluded(annotations[index].position[1], this.contents);
  
              if (start_index !== -1 && end_index !== -1) {
                // TODO: real_targetを得るための一連の処理を this.contents[n].content だけで実現できれば、更新が高速化できそう
                // TODO: ただし、プロファイリング結果としてはwrapAll() / unwrap()よりもCircleの構築が高コスト？
                const selector = [];
                for(let selector_index = start_index; selector_index <= end_index; selector_index ++) {
                  selector.push(`[data-htmlanno-id="${selector_index + 1}"`)
                }
                const target = $(selector.join(','))
                target.wrapAll('<div id="temporary">')
                const real_target = document.getElementById('temporary')
                const highlight = new SpanAnnotation(
                  annotations[index].position[0] - this.contents[start_index].offset,
                  annotations[index].position[1] - this.contents[start_index].offset,
                  annotations[index].label,
                  undefined,
                  real_target
                )
                target.unwrap()
                resolve(highlight)
              }
            }));
          }
        }
        return Promise.all(promises);
      },
    },
  });
};
