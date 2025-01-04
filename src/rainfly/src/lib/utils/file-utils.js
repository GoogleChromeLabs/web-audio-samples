/**
 * @fileoverview Common utility function for working with files
 */

import JSZip from 'jszip';

/**
 * Fetch a file from the given URL and return name and text data
 * @param {string} url - URL of the file to fetch
 * @return {Promise<{name: string, data: string}>} - Promise that resolves to
 * an object with the name and data of the file
 */
export async function fetchTextFile(url) {
  let filename = url.split('/').pop();
  if (filename === undefined || filename === '') {
    filename = url;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    const data = await response.text();
    return {name: filename, data};
  } catch (/** @type any */ error) {
    return {name: filename, data: 'error: '+ error.message};
  }
}

/**
 * Zip multiple text files into a single blob
 * @param {Object.<string, string>} files - JSON object of
 * filenames and data
 * @return {Promise<Blob>} - Promise to blob of zipped files
 */
export async function zipTextFiles(files) {
  const zip = new JSZip();
  for (const [filename, data] of Object.entries(files)) {
    zip.file(filename, data);
  }
  return zip.generateAsync({type: 'blob'});
}
