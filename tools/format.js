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
const config = require('./format-config');

const eslintCLI = new eslint.CLIEngine(config.eslintOptions);
const eslintFormatter = eslintCLI.getFormatter();

const FILETYPE_FILTER = [
  '.js',
  '.html',
];


/**
 * Format HTML files with HTML Tidy.
 *
 * @param {string} filePath Target file path.
 */
function tidyHTML(filePath) {
  console.log('   > HTMLTidy...');

  let tidyDoc = new libtidy.TidyDoc();
  let tidyOptions = config.htmlTidyOptions;
  for (let option in tidyOptions) {
    if (tidyOptions[option]) {
      tidyDoc.optSet(option, tidyOptions[option]);
    }
  }

  let pageString = fs.readFileSync(filePath, 'utf8').toString();

  let logs = '';
  logs += tidyDoc.parseBufferSync(new Buffer(pageString));
  logs += tidyDoc.cleanAndRepairSync();
  logs += tidyDoc.runDiagnosticsSync();
  if (!logs.includes('No warnings or errors were found')) {
    console.log(logs);
  }

  pageString = tidyDoc.saveBufferSync().toString();

  // HTLMTidy does not handle the script tag well. It adds a trailing space
  // and a blank line before the script code starts. This RegExp cleans it up.
  let re1 = new RegExp(/\/script> \n/, 'gm');
  pageString = pageString.replace(re1, '\/script>\n');
  let re2 = new RegExp(/\>\n{2,}/, 'gm');
  pageString = pageString.replace(re2, '>\n');

  fs.writeFileSync(filePath, pageString);
}


/**
 * Format JS files with ESLint.
 *
 * @param {string} filePath Target file path.
 */
function lintJS(filePath) {
  console.log('   > Linting...');

  let report = eslintCLI.executeOnFiles([filePath]);

  // Print formatted results if there's any error.
  if (report.results[0].errorCount > 0) {
    console.log(eslintFormatter(report.results));
  }
}


/**
 * Test file path to collect.
 * @param {string} filePath Target file path.
 * @return {Boolean} Test result.
 */
function testFilePath(filePath) {
  // If not a file, return false.
  let stat = fs.lstatSync(filePath);
  if (!stat.isFile()) {
    return false;
  }

  // If it has a ignore keyword, return false.
  for (let i = 0; i < config.ignore.length; ++i) {
    if (filePath.includes(config.ignore[i])) {
      return false;
    }
  }

  // If it is not either HTML or JS, return false.
  if (!FILETYPE_FILTER.includes(path.extname(filePath))) {
    return false;
  }

  return true;
}


/**
 * Collect files to process based on criteria.
 *   - Is it JS? or Is HTML?
 *   - Does it have 'wasmemodule.js' in its file name?
 * @param {Array} paths A list of file paths.
 * @return {Array} Collected file paths after testing.
 */
function collectFiles(paths) {
  let files = [];
  paths.forEach((filePath) => {
    try {
      if (testFilePath(filePath)) {
        files.push(filePath);
      }
    } catch (error) {
      let errorMessage = 'Invalid file path. (' + filePath + ')\n' +
          '  > ' + error.toString();
      console.error('[Format::collectFiles]', errorMessage);
    }
  });

  return files;
}


/**
 * Script entry point.
 */
function main() {
  let paths = process.argv.slice(2);
  collectFiles(paths).forEach((filePath) => {
    console.log('[] Processing: ' + filePath);

    switch (path.extname(filePath)) {
      case '.js':
        lintJS(filePath);
        break;
      case '.html':
        tidyHTML(filePath);
        lintJS(filePath);
        break;
    }
  });

  console.log('[] Formatting completed.');
}


main();
