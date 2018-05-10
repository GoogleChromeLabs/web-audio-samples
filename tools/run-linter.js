const fs      = require('fs');
const path    = require('path');
const glob    = require('glob');
const libtidy = require('libtidy');
const eslint  = require('eslint');

const eslintCLI = new eslint.CLIEngine({
  "plugins": [
    "html"
  ],
  "env": {
    "es6": true,
  },
  "extends": "google",
  "rules": {
  }
});

const tidyOptions = {
  'indent': 'yes',
  'indent-spaces': '2',
  'wrap': '80',
  'tidy-mark': 'no',
  'doctype': 'html5',
  'vertical-space': 'no',
  'new-pre-tags': 'script'
};

const eslintFormatter = eslintCLI.getFormatter();

// fs.readFileSync(filePath, 'utf8').toString();

// HTMLTidy: {
//     'indent': 'yes',
//     'indent-spaces': '2',
//     'wrap': '80',
//     'tidy-mark': 'no',
//     'doctype': 'html5'
//   },

function formatHTML(targetFiles) {
  targetFiles.forEach((filePath) => {
    if (path.extname(filePath) !== '.html')
      return;

    let tidyDoc = new libtidy.TidyDoc();
    for (let option in tidyOptions)
      tidyDoc.optSet(option, tidyOptions[option]);

    let pageString = fs.readFileSync(filePath, 'utf8').toString();

    let logs = '';
    logs += tidyDoc.parseBufferSync(Buffer(pageString));
    logs += tidyDoc.cleanAndRepairSync();
    logs += tidyDoc.runDiagnosticsSync();

    pageString = tidyDoc.saveBufferSync().toString();

    let re1 = new RegExp(/\/script> \n/, 'gm');
    pageString = pageString.replace(re1, '\/script>\n');
    let re2 = new RegExp(/\>\n{2,}/, 'gm');
    pageString = pageString.replace(re2, '>\n');

    fs.writeFileSync(filePath, pageString);
  });
}

function formatJS(targetFiles) {
  console.log('Applying ESLint...');
  let report = eslintCLI.executeOnFiles(targetFiles);
  console.log(eslintFormatter(report.results));
  // targetFiles.forEach((filePath) => {
  //   if (path.extname(targetPath) === '.js') {
  //     let codeString = fs.readFileSync(filePath, 'utf8').toString();
  //   }
  // });
}




function main() {

  let args = process.argv.slice(2);

  let files = [];
  args.forEach((targetPath) => {
    try {
      let stat = fs.lstatSync(targetPath);
      if (stat.isFile()) {
        let fileType = path.extname(targetPath);
        if (fileType === '.html' ||
            (fileType === '.js' && !targetPath.includes('.wasmmodule.js'))) {
          files.push(targetPath);
          console.log(targetPath);
        }
      }
      // } else if (
      //     stat.isDirectory() && options.recursive &&
      //     !targetPath.includes('node_modules')) {
      //   files = files.concat(glob.sync(targetPath + '/**/*.{html,js}'));
      // }
    } catch (error) {
      let errorMessage = 'Invalid file path. (' + targetPath + ')\n' +
          '  > ' + error.toString();
      console.error('main()', errorMessage);
    }
  });

  formatHTML(files);
  // formatJS(files);

  console.log('Linting completed.');
}

main();

/**
 * 0. read file
 *
 * 1. check file type
 *
 * 2. JS
 *   - use eslint
 *
 * 2. HTML
 *   - use libtidy
 *   - then use eslint HTML plugin
 */
