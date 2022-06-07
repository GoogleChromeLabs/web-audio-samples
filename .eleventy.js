const htmlmin = require('html-minifier');
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

const htmlMinifierCallback = (content, outputPath) => {
  if (outputPath.endsWith('.html')) {
    let minified = htmlmin.minify(content, {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
    });
    return minified;
  }
  return content;
};

module.exports = function(eleventyConfig) {
  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.addDataExtension('yaml', contents => yaml.load(contents));
  eleventyConfig.addPlugin(navigationPlugin);

  eleventyConfig.addFilter('relativePath', (fromPage, toUrl) => {
    return path.relative(fromPage.url, toUrl);
  });

  writeBuildInfoToFile();

  if (process.env.ELEVENTY_ENV === 'production') {
    eleventyConfig.addTransform('htmlminifier', htmlMinifierCallback);
  } else {
    eleventyConfig.setBrowserSyncConfig({});
  }

  // eleventyConfig.addWatchTarget('./scripts/*.js');
  eleventyConfig.addWatchTarget('./src/styles/styles.css');
  
  // eleventyConfig.addPassthroughCopy('src/scripts');
  eleventyConfig.addPassthroughCopy('src/style.css');
  eleventyConfig.addPassthroughCopy('src/**/*.js');
  eleventyConfig.addPassthroughCopy('src/**/*.mp3');
  eleventyConfig.addPassthroughCopy('src/**/*.wav');
  // eleventyConfig.addPassthroughCopy('src/audio-worklet');
  // eleventyConfig.addPassthroughCopy('src/demos/**/*.js');
  // eleventyConfig.addPassthroughCopy('src/archive');
  // eleventyConfig.addPassthroughCopy('src/sounds');
  // eleventyConfig.addPassthroughCopy('src/favicon');
  eleventyConfig.addPassthroughCopy('src/robots.txt');
  eleventyConfig.addPassthroughCopy('src/sitemap.xml');

  return {
    dir: {input: 'src'}
  };
};