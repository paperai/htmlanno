import Vue from 'vue'
import $  from 'jquery'
import axios from 'axios'
import Bioes from './bioes'
import Highlight from './highlight'

window.$ = $

$(() => {
  Vue.component('html_viewer', {
    template: '<div id="viewer" v-html="content"></div>',
    props: {
      annotation_uri: {
        type: String,
        required: true
      }
    },
    data: () => {
      return {
        content: '',
        // content_index := [<index>, <index>,...]
        // index         := {startOffset: <offset>, id: <ID for content part>}
        // offset        := the offset from start of all text content that ignored HTML tag.
        content_index: [],
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
          const id_for_content_part = `htmlanno-content-${index + 1}`
          virtualBody.childNodes[index].id = id_for_content_part
          this.contents.push({
            offset: last_offset,
            id: id_for_content_part
          })
          last_offset += virtualBody.childNodes[index].textContent.length;
        }
        this.content = virtualBody.innerHTML
      },
      _findPositionIncluded: (position, contents) => {
        for(let index = 0; index < contents.length; index ++) {
          if (contents[index].offset > position) {
            return (index - 1)
          }
        }
        return -1
      },
      setAnnotation: function(annotations) {
        const promises = [];
       
        for(let index in annotations) {
          promises.push(new Promise((resolve, reject) => {
            const start_index = this._findPositionIncluded(annotations[index].position[0], this.contents);
            const end_index = this._findPositionIncluded(annotations[index].position[1], this.contents);

            if (start_index !== -1 && end_index !== -1) {
              const selector = [];
              for(let selector_index = start_index; selector_index <= end_index; selector_index ++) {
                selector.push(`#htmlanno-content-${selector_index + 1}`)
              }
              const target = $(selector.join(','))
              target.wrapAll('<div id="temporary">')
              const real_target = document.getElementById('temporary')
              const highlight = new Highlight(
                annotations[index].position[0] - this.contents[start_index].offset,
                annotations[index].position[1] - this.contents[start_index].offset,
                'test',
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
        this.annotation_uri = './sample.BIOES'
      }
    },
  })
});
