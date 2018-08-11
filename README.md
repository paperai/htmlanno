# HTMLAnno
HTMLAnno is a web-based linguistic annotation tool for xhtml/txt documents.  
It offers functions for annotating the documents with labels and relations.  
For natural language processing and machine learning, it is suitable for development of gold-standard data with named entity spans, dependency relations, and coreference chains.  

[Online Demo (v0.1.0)](https://paperai.github.io/htmlanno/0.1.0)

[Online Demo (experimental)](https://paperai.github.io/htmlanno/latest)

## Annotation Tools
| Icon | Description |
|:---:|:---:|
| <img src="https://github.com/paperai/pdfanno/blob/master/icons/fa-pencil.png" width="7%"> | Span highlighting. |
| <img src="https://github.com/paperai/pdfanno/blob/master/icons/fa-long-arrow-right.png" width="7%"> | One-way relation. This is used for annotating dependency relation between spans. |
| <img src="https://github.com/paperai/pdfanno/blob/master/icons/fa-arrows-h.png" width="7%"> | Two-way relation. |
| <img src="https://github.com/paperai/pdfanno/blob/master/icons/fa-minus.png" width="7%"> | Link relation. If you want to add non-directional relation between spans, use this. |

## Developer's Guide

### Install and Build
First, install [Node.js](https://nodejs.org/) and npm. The version of Node.js must be 6+.  
Then, run the following commands:
```
npm install
npm run publish:latest
```
and you can access HTMLAnno via `docs/latest/index.html`.  

For developing,
```
npm run watch
```
This command starts Webpack Dev Server and you can access [http://localhost:8080/dist/index.html](http://localhost:8080/dist/index.html) in your browser.
