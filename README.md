# HTMLAnno
HTMLAnno is a web-based linguistic annotation tool for xhtml/txt documents.  
It offers functions for annotating the documents with labels and relations.  
For natural language processing and machine learning, it is suitable for development of gold-standard data with named entity spans, dependency relations, and coreference chains.  

[Online Demo (v0.1.1)](https://paperai.github.io/htmlanno/0.1.1)

[Online Demo (experimental)](https://paperai.github.io/htmlanno/latest)

## Annotation Tools
| Icon | Description |
|:---:|:---:|
| <img src="https://github.com/paperai/pdfanno/blob/master/icons/fa-pencil.png" width="7%"> | Span highlighting. |
| <img src="https://github.com/paperai/pdfanno/blob/master/icons/fa-long-arrow-right.png" width="7%"> | One-way relation. This is used for annotating dependency relation between spans. |

## Developer's Guide

### Install and Build
First, install [Node.js](https://nodejs.org/) and npm. The version of Node.js must be 8+.  
Then, run the following commands (example is run on  Bash, `/var/www/html/htmlanno` exists, and need to writable this directory):
```
npm install
env BASE_DIR=/var/www/html/htmlanno npm run publishLocal
```
and you can access HTMLAnno via `localhost/htmlanno/latest`.  

### Publish
1. publish the latest version:
    - `npm run pulish` (create/update `latest/` on `gh-pages` branch)
1. publsih the stable (versioning) version:
    1. remove `-dev` word from `version` property in `package.json`
    1. `npm run publish` (create/update `<version property value>/` on `gh-pages` branch)
    
For developing,
```
npm run watch
```
This command starts Webpack Dev Server and you can access [http://localhost:8080/dist/index.html](http://localhost:8080/dist/index.html) in your browser.
