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
  
  // Passthrough files via these glob patterns.
  [
    'src/library/**.js',
    'src/archive/**/*.css',
    'src/archive/**/*.html',
    'src/archive/**/*.js',
    'src/audio-worklet/**/*.html',
    'src/audio-worklet/**/*.js',
    'src/audio-worklet/**/*.mjs',
    'src/demos/**/*.css',
    'src/demos/**/*.gif',
    'src/demos/**/*.html',
    'src/demos/**/*.js',
    'src/demos/**/*.mjs',
    'src/demos/**/*.mp3',
    'src/demos/**/*.png',
    'src/demos/**/*.shader',
    'src/demos/**/*.wav',
    'src/demos/**/*.webmanifest',
    'src/demos/**/*.zip',
    'src/demos/wavetable-synth/wave-tables/*',
    'src/experiments/**/*.html',
    'src/experiments/**/*.js',
    'src/sounds/drum-samples/**/*.wav',
    'src/sounds/fx/**/*.wav',
    'src/sounds/fx/**/*.mp3',
    'src/sounds/hyper-reality/**/*.mp3',
    'src/sounds/hyper-reality/**/*.wav',
    'src/sounds/impulse-responses/**/*.wav',
    'src/sounds/loops/**/*.wav',
    'src/tests/**/*.html',
    'src/tests/**/*.js',
    'src/robots.txt',
    'src/README.md',
    'src/sitemap.xml',
  ].map(path => eleventyConfig.addPassthroughCopy(path));

  // eleventyConfig.addPassthroughCopy('src/favicon');

  return {
    dir: {input: 'src'}
  };
};
