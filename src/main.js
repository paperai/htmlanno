import Vue from 'vue'
import $  from 'jquery'
import axios from 'axios'
import Bioes from './bioes'
import SpanAnnotation from './spanannotation'

window.$ = $

$(() => {
  Vue.component('html_viewer', {
    template: '#html_viewer_template',
    props: {
      annotation_uri: {
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
      };
    },
    watch: {
      annotation_uri: function() {
        this.loadUri(this.annotation_uri).then((resolve, reject) => {
          this.parseBioes(resolve).then((resolve, reject) => {
            this.setContent(resolve.content);
            // setAnnotation() needs the real HTML tree.
            this.$nextTick(function() {
              this.setAnnotation(resolve.annotations).then()
            });
          })
        })
      },
    },
    methods: {
      loadUri: (uri) => {
        return new Promise((resolve, reject) => {
          axios.get(uri).then((http_response) => {
            resolve(http_response.data)
          })
        })
      },
      parseBioes: (bioes) => {
        return new Promise((resolve, reject) => {
          const parser = new Bioes()
          parser.parse(bioes)
          resolve(parser)
        })
      },
      setContent: function(html_src) {
        const virtualBody = document.createElement('div');
        virtualBody.innerHTML = html_src;

        let last_offset = 0;
        this.contents = [];
        for(let index = 0;index < virtualBody.childNodes.length; index ++) {
          this.contents.push({
            offset: last_offset,
            id: `htmlanno-content-${index + 1}`,
            content: virtualBody.childNodes[index].outerHTML
          })
          last_offset += virtualBody.childNodes[index].textContent.length;
        }
        this.content_length = last_offset;
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
          promises.push(new Promise((resolve, reject) => {
            const start_index = this._findPositionIncluded(annotations[index].position[0], this.contents);
            const end_index = this._findPositionIncluded(annotations[index].position[1], this.contents);

            if (start_index !== -1 && end_index !== -1) {
              // TODO: real_targetを得るための一連の処理を this.contents[n].content だけで実現できれば、更新が高速化できそう
              // TODO: ただし、プロファイリング結果としてはwrapAll() / unwrap()よりもCircleの構築が高コスト？
              const selector = [];
              for(let selector_index = start_index; selector_index <= end_index; selector_index ++) {
                selector.push(`#htmlanno-content-${selector_index + 1}`)
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
        return Promise.all(promises);
      },
    },
  });

  const vueObj = new Vue({
    el: '#content',
    data: () => {
      return {
        annotation_uri: ''
      }
    },
    methods: {
      load_html: function() {
        this.annotation_uri = './sample/sample.BIOES'
      }
    },
  })
});
