const libtidy = require('libtidy');
const eslint  = require('eslint');
const fs      = require('fs');


// fs.readFileSync(filePath, 'utf8').toString();

// HTMLTidy: {
//     'indent': 'yes',
//     'indent-spaces': '2',
//     'wrap': '80',
//     'tidy-mark': 'no',
//     'doctype': 'html5'
//   },




function main() {

  let args = process.argv.slice(2);

  let files = [];
  args.forEach((targetPath) => {
    try {
      let stat = fs.lstatSync(targetPath);
      if (stat.isFile()) {
        let fileType = path.extname(targetPath);
        if (fileType === '.html' || fileType === '.js') {
          files.push(targetPath);
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

  console.log(files);

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
