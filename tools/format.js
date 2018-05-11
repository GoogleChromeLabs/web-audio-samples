#!/usr/bin/env node

// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This script applies ESLint and HTMLTidy on given files. To run this use
// 'npm run format'.

const fs = require('fs');
const path = require('path');
const libtidy = require('libtidy');
const eslint = require('eslint');

// ESLint options.
const eslintCLI = new eslint.CLIEngine({
  'plugins': [
    'html',
  ],
  'env': {
    'es6': true,
  },
  'extends': 'google',
});

// HTMLTidy options.
const tidyOptions = {
  'indent': 'yes',
  'indent-spaces': '2',
  'wrap': '80',
  'tidy-mark': 'no',
  'doctype': 'html5',
  'vertical-space': 'no',
};


// Formatter for lint errors.
const eslintFormatter = eslintCLI.getFormatter();


/**
 * Format HTML files with HTML Tidy.
 *
 * @param {Array} targetFiles File paths in array.
 */
function formatHTML(targetFiles) {
  console.log('Applying HTMLTidy...');

  targetFiles.forEach((filePath) => {
    // If the file is not HTML, don't tidy it up.
    if (path.extname(filePath) !== '.html') {
      return;
    }

    let tidyDoc = new libtidy.TidyDoc();
    for (let option in tidyOptions) {
      if (tidyOptions[option]) {
        tidyDoc.optSet(option, tidyOptions[option]);
      }
    }

    let pageString = fs.readFileSync(filePath, 'utf8').toString();

    // Collect and print info from HTML Tidy.
    let logs = '';
    logs += tidyDoc.parseBufferSync(new Buffer(pageString));
    logs += tidyDoc.cleanAndRepairSync();
    logs += tidyDoc.runDiagnosticsSync();
    console.log(logs);

    pageString = tidyDoc.saveBufferSync().toString();

    // HTLMTidy does not handle the script tag well. It adds a trailing space
    // and a blank line before the script code starts. This RegExp cleans it up.
    let re1 = new RegExp(/\/script> \n/, 'gm');
    pageString = pageString.replace(re1, '\/script>\n');
    let re2 = new RegExp(/\>\n{2,}/, 'gm');
    pageString = pageString.replace(re2, '>\n');

    fs.writeFileSync(filePath, pageString);
  });
}


/**
 * Format JS files with ESLint.
 *
 * @param {Array} targetFiles File paths in array.
 */
function formatJS(targetFiles) {
  console.log('Applying ESLint...');

  let report = eslintCLI.executeOnFiles(targetFiles);
  if (report.results[0].errorCount > 0) {
    console.log(eslintFormatter(report.results));
  }
}


/**
 * Script entry point.
 */
function main() {
  let args = process.argv.slice(2);
  let files = [];
  args.forEach((targetPath) => {
    try {
      let stat = fs.lstatSync(targetPath);
      if (stat.isFile()) {
        // This linter only applies to JS and HTML file. The JS file generated
        // by Emscripten is also excluded by the keyword in the file name.
        let fileType = path.extname(targetPath);
        if (fileType === '.html' ||
            (fileType === '.js' && !targetPath.includes('.wasmmodule.js'))) {
          files.push(targetPath);
          console.log(targetPath);
        }
      }
    } catch (error) {
      let errorMessage = 'Invalid file path. (' + targetPath + ')\n' +
          '  > ' + error.toString();
      console.error('main()', errorMessage);
    }
  });

  formatHTML(files);
  formatJS(files);

  console.log('Formatting completed.');
}


main();
