import Vue from 'vue'
import $  from 'jquery'
import axios from 'axios'
import Bioes from './bioes'
import SpanAnnotation from './spanannotation'
import bioesHtmlViewer from './vue_bioes_viewer'
import htmlViewer from './vue_html_viewer'

window.$ = $

$(() => {
  bioesHtmlViewer()
  htmlViewer()
  const vueObj = new Vue({
    el: '#content',
    data: () => {
      return {
        /**
         * in the true case, BIOES viewer is used.
         */
        view_bioes: false,
        /**
         * in the true case, (X)HTML viewer is used.
         */
        view_html: false,
        /**
         * URI of Annotation content (e.g. TOML). if using BIOES viewer, this is BIOES content URI.
         */
        annotation_uri: undefined,
        /**
         * URI of Annotated content (e.g. HTML). if using BIOES viewer, this isnot used.
         */
        content_uri: ''
      }
    },
    methods: {
      load_bioes: function () {
        this.view_bioes = true;
        this.view_html  = false;
        Vue.nextTick(() => {
          this.annotation_uri = './sample/sample.BIOES'
        })
      },
      load_html: function () {
        this.view_bioes = false;
        this.view_html  = true;
        Vue.nextTick(() => {
          this.content_uri = './sample/sample.xhtml'
        });
      },
      annotation_selected: function (event) {
        const files = event.target.files
        if (files.lenfth !== 0) {
          this.annotation_uri = files[0]
        }
      },
    },
  })
});
