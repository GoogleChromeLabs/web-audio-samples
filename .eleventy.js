// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const yaml = require('js-yaml');
const navigationPlugin = require('@11ty/eleventy-navigation');
const path = require('path');

// Generate the shortened commit hash and create (overwrite) `build_info.json`
// file. This file will eventually be added to the footer of the page.
const writeBuildInfoToFile = () => {
  const version = require('./package.json').version;
  const commitHash = require('child_process')
      .execSync('git rev-parse --short HEAD').toString().trim();
  const commitDate = require('child_process')
      .execSync('git show -s --format=%cd --date=short').toString().trim();
  const currentYear = (new Date()).getFullYear();
  const jsonData = JSON.stringify({
    version: version,
    revision: commitHash,
    lastUpdated: commitDate,
    copyrightYear: currentYear
  });
  const fs = require('fs');
  fs.writeFileSync('src/_data/build_info.json', jsonData);
};

module.exports = function(eleventyConfig) {
  writeBuildInfoToFile();

  // See .eleventyignore for files to ignore.
  eleventyConfig.setUseGitIgnore(false);
  
  // To enable YAML files in `_data`.
  eleventyConfig.addDataExtension('yaml', contents => yaml.load(contents));
  
  // To handle relative paths and basic navigation via breadcrumbs.
  eleventyConfig.addPlugin(navigationPlugin);
  eleventyConfig.addFilter('relativePath', (fromPage, toUrl) => {
    return path.relative(fromPage.url, toUrl);
  }); 

  if (process.env.ELEVENTY_ENV !== 'production') {
    eleventyConfig.setBrowserSyncConfig({});
  }

  eleventyConfig.addWatchTarget('src/**/*.js');
  eleventyConfig.addWatchTarget('src/styles/styles.css');
  
  // Do not process and passthrough these directories.
  [
    'src/audio-worklet/**/*.html',
    'src/audio-worklet/**/*.js',
    'src/demos/**/*.css',
    'src/demos/**/*.html',
    'src/demos/**/*.js',
    'src/archive/**/*.css',
    'src/archive/**/*.html',
    'src/archive/**/*.js',
    'src/robots.txt',
    'src/sitemap.xml',
  ].map((path) => {
    eleventyConfig.addPassthroughCopy(path);
  });

  // eleventyConfig.addPassthroughCopy('src/sounds');
  // eleventyConfig.addPassthroughCopy('src/favicon');

  return {
    dir: {input: 'src'}
  };
};
