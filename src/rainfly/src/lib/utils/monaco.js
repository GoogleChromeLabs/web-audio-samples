/**
 * @fileoverview Prepare Monaco Editor API for Vite usage
 */
import * as monaco from 'monaco-editor';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker
  from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker: function(_id, label) {
    switch (label) {
      case 'typescript':
      case 'javascript':
        // eslint-disable-next-line new-cap
        return new tsWorker();
      default:
        // eslint-disable-next-line new-cap
        return new editorWorker();
    }
  },
};

export default monaco;
