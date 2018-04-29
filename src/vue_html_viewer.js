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
      annotation_uri: {
        type: String,
        required: true
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
          axios.get(uri).then((http_response) => {
            resolve(http_response.data)
          })
        })
      },
      setContent: function(html_src) {
        const parser = new DOMParser()
        // Htmlanno uses the XHTML, but DOMParser accepted only 'text/html'.
        const content_body = parser.parseFromString(html_src, 'text/html').body

        this.contents = []
        this.content_length = this._calculate_offset_and_register(content_body, undefined, 0)
        this.content = content_body.innerHTML
      },
      _calculate_offset_and_register: function (html_node, parent_index, parent_offset) {
        let last_offset = parent_offset
        for(let index = 0; index < html_node.childNodes.length; index ++) {
          const current_node = html_node.childNodes[index]
          if (current_node.nodeName === '#text') {
            last_offset += current_node.textContent.length
          } else {
            const current_index = this.contents.length
            const id = this.contents.length + 1
            current_node.setAttribute('data-htmlanno-id', id)
            this.contents.push({ parent_index: parent_index, offset: last_offset, id: id })
            last_offset += current_node.textContent.length
            // last_offset = this._calculate_offset_and_register(current_node, current_index, last_offset)
          }
        }
        return last_offset;
      },
      _findPositionIncluded: (position, contents) => {
        let index;
        for(index = 0; index < contents.length; index ++) {
          if (contents[index].offset > position) {
            // 1. 行き過ぎたので戻る
            // 2. contents[index]に親はいるか？ (親がいるなら、親の範囲に目的地がある筈)
            // 3. 親がいないなら1つ前の兄弟を見る (1つ前の兄弟の範囲に目的地がある筈) 
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
